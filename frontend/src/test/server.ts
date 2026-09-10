import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { PostView } from "../api/types";

/**
 * MSW: the tests mock the NETWORK, not the fetch function - the real
 * client code runs untouched and these handlers answer as the backend
 * would. Shapes mirror the real API exactly.
 */
export const INTERESTS = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Books" },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", name: "Technology" },
  { id: "aaaaaaaa-0000-4000-8000-000000000003", name: "Travel" },
];

export const TEST_USER = {
  id: "bbbbbbbb-0000-4000-8000-000000000001",
  email: "user@example.com",
  firstName: "Tess",
  lastName: "Tester",
  role: "USER" as const,
  interests: [INTERESTS[0]],
};

export const TEST_TOKENS = {
  accessToken: "test-access-token",
  refreshToken: "cccccccc-0000-4000-8000-000000000001",
  user: TEST_USER,
};

/** 23 posts -> 3 pages of 10/10/3, newest first like the API. */
export const TEST_POSTS: PostView[] = Array.from({ length: 23 }, (_, n) => ({
  id: `dddddddd-0000-4000-8000-${String(n).padStart(12, "0")}`,
  title: `Seeded post ${23 - n}`,
  body: `Body of seeded post ${23 - n}`,
  author: { id: TEST_USER.id, firstName: TEST_USER.firstName, lastName: TEST_USER.lastName },
  createdAt: new Date(Date.UTC(2026, 0, 1, 12, 23 - n)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 0, 1, 12, 23 - n)).toISOString(),
}));

export const handlers = [
  http.get("*/api/interests", () => HttpResponse.json(INTERESTS)),

  http.post("*/api/auth/register", () =>
    HttpResponse.json({ message: "Registered" }, { status: 201 }),
  ),

  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === TEST_USER.email && body.password === "Password123!") {
      return HttpResponse.json(TEST_TOKENS);
    }
    return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }),

  http.get("*/api/users/me/posts", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    return HttpResponse.json({
      items: TEST_POSTS.slice(page * size, (page + 1) * size),
      total: TEST_POSTS.length,
      page,
      size,
    });
  }),

  http.get("*/api/posts/:id", ({ params }) => {
    const post = TEST_POSTS.find((p) => p.id === params.id);
    return post
      ? HttpResponse.json(post)
      : HttpResponse.json({ message: "Post not found" }, { status: 404 });
  }),

  http.post("*/api/posts", async ({ request }) => {
    const body = (await request.json()) as { title: string; body: string };
    return HttpResponse.json(
      {
        id: "eeeeeeee-0000-4000-8000-000000000001",
        title: body.title,
        body: body.body,
        author: { id: TEST_USER.id, firstName: TEST_USER.firstName, lastName: TEST_USER.lastName },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];

export const server = setupServer(...handlers);
