import "./env"; // MUST be first: points the app at the blog_test database
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { clearMessages, extractLink, waitForMessageTo } from "./mailhog";

/**
 * INTEGRATION tests: the real HTTP API against the real dockerised
 * Postgres ( blog_test ) and MailHog. Needs `make docker-up` first.
 */
describe("API ( integration )", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let interestIds: string[];

  const PASSWORD = "Password123!";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await dataSource.query(
      `TRUNCATE TABLE "refresh_tokens", "posts", "user_interests", "users", "interests" CASCADE`,
    );
    await dataSource.query(
      `INSERT INTO "interests" ("name") VALUES ('Technology'), ('Music'), ('Travel')`,
    );
    await clearMessages();

    const interests = await request(app.getHttpServer()).get("/api/interests").expect(200);
    interestIds = interests.body.map((i: { id: string }) => i.id);
  });

  afterAll(async () => {
    await app.close();
  });

  /** register + activate ( via MailHog ) + login - returns the tokens */
  async function signUp(email: string, firstName: string) {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email, password: PASSWORD, firstName, lastName: "Test", interestIds: [interestIds[0]] })
      .expect(201);

    const message = await waitForMessageTo(email);
    const token = new URL(extractLink(message)).searchParams.get("token")!;
    await request(app.getHttpServer()).post("/api/auth/activate").send({ token }).expect(200);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: PASSWORD })
      .expect(200);
    return login.body as { accessToken: string; refreshToken: string };
  }

  describe("registration and activation", () => {
    it("registers, emails the activation link to MailHog, activates, logs in", async () => {
      const email = "reg@example.com";
      await request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          email,
          password: PASSWORD,
          firstName: "Reg",
          lastName: "User",
          interestIds: [interestIds[0], interestIds[1]],
        })
        .expect(201);

      // not activated yet -> login is 403
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email, password: PASSWORD })
        .expect(403);

      const message = await waitForMessageTo(email);
      const link = extractLink(message);
      expect(link).toContain("/activate?token=");
      const token = new URL(link).searchParams.get("token")!;

      await request(app.getHttpServer()).post("/api/auth/activate").send({ token }).expect(200);
      // a token only works once
      await request(app.getHttpServer()).post("/api/auth/activate").send({ token }).expect(404);

      const login = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email, password: PASSWORD })
        .expect(200);
      expect(login.body.accessToken).toBeDefined();
      expect(login.body.refreshToken).toBeDefined();
      expect(login.body.user.interests).toHaveLength(2);
    });

    it("rejects a duplicate email with 409", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          email: "reg@example.com",
          password: PASSWORD,
          firstName: "Dup",
          lastName: "User",
          interestIds: [interestIds[0]],
        })
        .expect(409);
    });

    it("rejects an invalid body with 400 ( DTO validation )", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: "short", firstName: "", lastName: "", interestIds: [] })
        .expect(400);
    });
  });

  describe("tokens", () => {
    it("refresh rotates the token; logout revokes it", async () => {
      const tokens = await signUp("tok@example.com", "Tok");

      const refreshed = await request(app.getHttpServer())
        .post("/api/auth/refresh")
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);
      expect(refreshed.body.refreshToken).not.toBe(tokens.refreshToken);

      // the OLD token was rotated away
      await request(app.getHttpServer())
        .post("/api/auth/refresh")
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);

      // logout revokes the NEW one
      await request(app.getHttpServer())
        .post("/api/auth/logout")
        .send({ refreshToken: refreshed.body.refreshToken })
        .expect(200);
      await request(app.getHttpServer())
        .post("/api/auth/refresh")
        .send({ refreshToken: refreshed.body.refreshToken })
        .expect(401);
    });

    it("guards: no token is 401", async () => {
      await request(app.getHttpServer()).get("/api/users/me").expect(401);
      await request(app.getHttpServer()).post("/api/posts").send({ title: "t", body: "b" }).expect(401);
    });
  });

  describe("posts", () => {
    it("create, read, edit own; another user gets 403; paging works", async () => {
      const author = await signUp("author@example.com", "Author");
      const other = await signUp("other@example.com", "Other");

      const created = await request(app.getHttpServer())
        .post("/api/posts")
        .set("Authorization", `Bearer ${author.accessToken}`)
        .send({ title: "First post", body: "Hello world" })
        .expect(201);
      const postId = created.body.id;

      // read one ( any logged-in user )
      const read = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${other.accessToken}`)
        .expect(200);
      expect(read.body.title).toBe("First post");

      // owner edits
      await request(app.getHttpServer())
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${author.accessToken}`)
        .send({ title: "Edited", body: "Hello again" })
        .expect(200);

      // a different USER may not
      await request(app.getHttpServer())
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${other.accessToken}`)
        .send({ title: "Hijacked", body: "No" })
        .expect(403);

      // paging: 12 more posts -> page 0 has 10, page 1 has 3, total 13
      for (let n = 0; n < 12; n++) {
        await request(app.getHttpServer())
          .post("/api/posts")
          .set("Authorization", `Bearer ${author.accessToken}`)
          .send({ title: `Post ${n}`, body: "Body" })
          .expect(201);
      }
      const page0 = await request(app.getHttpServer())
        .get("/api/users/me/posts?page=0&size=10")
        .set("Authorization", `Bearer ${author.accessToken}`)
        .expect(200);
      expect(page0.body.total).toBe(13);
      expect(page0.body.items).toHaveLength(10);

      const page1 = await request(app.getHttpServer())
        .get("/api/users/me/posts?page=1&size=10")
        .set("Authorization", `Bearer ${author.accessToken}`)
        .expect(200);
      expect(page1.body.items).toHaveLength(3);

      // my posts are MINE only
      const otherPosts = await request(app.getHttpServer())
        .get("/api/users/me/posts")
        .set("Authorization", `Bearer ${other.accessToken}`)
        .expect(200);
      expect(otherPosts.body.total).toBe(0);
    });

    it("invalid paging params are 400", async () => {
      const author = await signUp("paging@example.com", "Paging");
      await request(app.getHttpServer())
        .get("/api/users/me/posts?page=-1&size=0")
        .set("Authorization", `Bearer ${author.accessToken}`)
        .expect(400);
    });
  });

  describe("users/me", () => {
    it("returns the profile without the password hash", async () => {
      const tokens = await signUp("me@example.com", "Me");
      const me = await request(app.getHttpServer())
        .get("/api/users/me")
        .set("Authorization", `Bearer ${tokens.accessToken}`)
        .expect(200);
      expect(me.body.email).toBe("me@example.com");
      expect(me.body.passwordHash).toBeUndefined();
      expect(me.body.interests).toHaveLength(1);
    });
  });
});
