import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "../store/auth";
import { renderApp } from "../test/render";
import { TEST_TOKENS } from "../test/server";

/** 23 posts, page size 10 -> pages of 10 / 10 / 3. */
describe("MyPostsPage", () => {
  beforeEach(() => {
    // logged in ( the route redirects to /login otherwise )
    useAuthStore.getState().setAuth(TEST_TOKENS);
  });

  it("renders the first page and the paging controls", async () => {
    await renderApp("/my-posts");

    expect(await screen.findByText("Seeded post 23")).toBeInTheDocument();
    expect(screen.getByText("Seeded post 14")).toBeInTheDocument();
    // each card carries an excerpt of the body, not just the title
    expect(screen.getByText("Body of seeded post 23")).toBeInTheDocument();
    expect(screen.queryByText("Seeded post 13")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("Next moves to page 2 and updates the URL search param", async () => {
    const user = userEvent.setup();
    const { router } = await renderApp("/my-posts");

    await screen.findByText("Seeded post 23");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Seeded post 13")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ page: 1 });
    });
  });

  it("redirects to /login when not logged in", async () => {
    useAuthStore.getState().clearAuth();
    const { router } = await renderApp("/my-posts");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
