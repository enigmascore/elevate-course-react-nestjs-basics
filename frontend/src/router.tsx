import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type AnyRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { ActivatePage } from "./pages/ActivatePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPostsPage } from "./pages/MyPostsPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { PostViewPage } from "./pages/PostViewPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuthStore } from "./store/auth";

/**
 * The ROUTE TREE: every screen the app has, as code. A route pairs a
 * path with a component; $postId is a PATH PARAM; beforeLoad guards
 * the logged-in-only screens by redirecting to /login.
 */
const requireAuth = () => {
  if (!useAuthStore.getState().accessToken) {
    throw redirect({ to: "/login" });
  }
};

export const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: useAuthStore.getState().accessToken ? "/my-posts" : "/login" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const activateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activate",
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ActivatePage,
});

const myPostsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-posts",
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 0) || 0,
  }),
  component: MyPostsPage,
});

const newPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts/new",
  beforeLoad: requireAuth,
  component: PostEditorPage,
});

const postViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts/$postId",
  beforeLoad: requireAuth,
  component: PostViewPage,
});

const postEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts/$postId/edit",
  beforeLoad: requireAuth,
  component: PostEditorPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  activateRoute,
  myPostsRoute,
  newPostRoute,
  postViewRoute,
  postEditRoute,
]);

export function createAppRouter(queryClient: QueryClient): AnyRouter {
  return createRouter({ routeTree, context: { queryClient } });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
