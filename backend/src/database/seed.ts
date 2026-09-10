import "reflect-metadata";
import * as bcrypt from "bcryptjs";
import { appDataSource } from "./data-source";
import { User, UserRole } from "../users/user.entity";
import { Interest } from "../interests/interest.entity";
import { Post } from "../posts/post.entity";

/**
 * Resets the database to a known state: run migrations, wipe the data,
 * insert the seed users / interests / posts. `make seed` runs this.
 *
 * Every seeded account is ACTIVATED and logs in with Password123!
 * pw-one@example.com and pw-two@example.com are RESERVED for the
 * Playwright tests - do not use them for manual poking around.
 */
export const SEED_PASSWORD = "Password123!";

export const INTEREST_NAMES = [
  "Technology",
  "Sports",
  "Music",
  "Travel",
  "Food",
  "Books",
  "Movies",
  "Science",
];

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  interests: string[];
  posts: number;
}

export const SEED_USERS: SeedUser[] = [
  { email: "admin@example.com",  firstName: "Ada",   lastName: "Admin",  role: UserRole.ADMIN, interests: ["Technology", "Science"],        posts: 16 },
  { email: "alice@example.com",  firstName: "Alice", lastName: "Archer", role: UserRole.USER,  interests: ["Technology", "Music", "Books"], posts: 17 },
  { email: "bob@example.com",    firstName: "Bob",   lastName: "Baker",  role: UserRole.USER,  interests: ["Sports", "Travel"],             posts: 16 },
  { email: "carla@example.com",  firstName: "Carla", lastName: "Cruz",   role: UserRole.USER,  interests: ["Food", "Movies", "Music"],      posts: 18 },
  { email: "pw-one@example.com", firstName: "Pia",   lastName: "One",    role: UserRole.USER,  interests: ["Technology", "Books"],          posts: 16 },
  { email: "pw-two@example.com", firstName: "Paul",  lastName: "Two",    role: UserRole.USER,  interests: ["Technology", "Travel"],         posts: 16 },
];

const POST_TOPICS = [
  "what I learned this week",
  "a tool I cannot live without",
  "notes from a rainy afternoon",
  "three things worth sharing",
  "a small experiment",
  "looking back, looking forward",
];

export async function seed(): Promise<void> {
  const ds = appDataSource.isInitialized ? appDataSource : await appDataSource.initialize();
  await ds.runMigrations();

  // wipe in dependency order ( truncate cascades through the FKs )
  await ds.query(
    `TRUNCATE TABLE "refresh_tokens", "posts", "user_interests", "users", "interests" CASCADE`,
  );

  const interestRepo = ds.getRepository(Interest);
  const interests = await interestRepo.save(
    INTEREST_NAMES.map((name) => interestRepo.create({ name })),
  );
  const interestByName = new Map(interests.map((i) => [i.name, i]));

  const userRepo = ds.getRepository(User);
  const postRepo = ds.getRepository(Post);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const spec of SEED_USERS) {
    const user = await userRepo.save(
      userRepo.create({
        email: spec.email,
        passwordHash,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: spec.role,
        activated: true,
        activationToken: null,
        interests: spec.interests.map((name) => interestByName.get(name)!),
      }),
    );

    // stagger createdAt so "newest first" orderings are deterministic
    const base = Date.now() - spec.posts * 60_000;
    const posts = Array.from({ length: spec.posts }, (_, n) =>
      postRepo.create({
        title: `${spec.firstName} on ${POST_TOPICS[n % POST_TOPICS.length]} #${n + 1}`,
        body:
          `Post number ${n + 1} by ${spec.firstName} ${spec.lastName}.\n\n` +
          `This is seeded content so the application is never empty: paged ` +
          `lists have real pages from the very first run.`,
        author: user,
        createdAt: new Date(base + n * 60_000),
      }),
    );
    await postRepo.save(posts);
  }
}

/* istanbul ignore next - CLI entry point */
if (require.main === module) {
  seed()
    .then(async () => {
      console.log("Database seeded.");
      await appDataSource.destroy();
    })
    .catch(async (err) => {
      console.error("Seeding failed:", err);
      await appDataSource.destroy().catch(() => undefined);
      process.exit(1);
    });
}
