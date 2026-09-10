import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import { User, UserRole } from "../users/user.entity";
import { Post } from "./post.entity";
import { PostsService } from "./posts.service";

/** UNIT tests: ownership rules and the paging shape, repositories mocked. */
describe("PostsService", () => {
  let service: PostsService;

  const posts = { findOne: jest.fn(), findAndCount: jest.fn(), create: jest.fn(), save: jest.fn() };
  const users = { findOneByOrFail: jest.fn() };

  const owner: AuthenticatedUser = { userId: "owner-id", email: "o@example.com", role: "USER" };
  const stranger: AuthenticatedUser = { userId: "other-id", email: "s@example.com", role: "USER" };
  const admin: AuthenticatedUser = { userId: "admin-id", email: "a@example.com", role: "ADMIN" };

  const existingPost = () => ({
    id: "post-1",
    title: "Old title",
    body: "Old body",
    author: { id: "owner-id", firstName: "Own", lastName: "Er" },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: posts },
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();
    service = moduleRef.get(PostsService);
    posts.save.mockImplementation((p) => Promise.resolve(p));
  });

  describe("update ( ownership )", () => {
    it("lets the owning author edit", async () => {
      posts.findOne.mockResolvedValue(existingPost());
      const result = await service.update(owner, "post-1", { title: "New", body: "Body" });
      expect(result.title).toBe("New");
    });

    it("rejects another user with 403", async () => {
      posts.findOne.mockResolvedValue(existingPost());
      await expect(
        service.update(stranger, "post-1", { title: "New", body: "Body" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("lets an ADMIN edit anyone's post", async () => {
      posts.findOne.mockResolvedValue(existingPost());
      const result = await service.update(admin, "post-1", { title: "Moderated", body: "Body" });
      expect(result.title).toBe("Moderated");
    });

    it("404s on a missing post", async () => {
      posts.findOne.mockResolvedValue(null);
      await expect(
        service.update(owner, "missing", { title: "New", body: "Body" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findByAuthor ( paging )", () => {
    it("passes skip/take through and answers items + total + page + size", async () => {
      posts.findAndCount.mockResolvedValue([[existingPost()], 17]);

      const result = await service.findByAuthor("owner-id", { page: 2, size: 5 });

      expect(posts.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5, order: { createdAt: "DESC" } }),
      );
      expect(result).toMatchObject({ total: 17, page: 2, size: 5 });
      expect(result.items).toHaveLength(1);
    });
  });
});
