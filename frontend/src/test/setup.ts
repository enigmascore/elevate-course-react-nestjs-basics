import "@testing-library/jest-dom/vitest";
import { useAuthStore } from "../store/auth";
import { server } from "./server";

// jsdom has no scrollTo; the router calls it on navigation
window.scrollTo = () => undefined;

// MSW answers all network calls for the whole unit-test run
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  // every test starts logged OUT unless it says otherwise
  useAuthStore.getState().clearAuth();
  window.localStorage.clear();
});
afterAll(() => server.close());
