import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "../store/auth";
import { renderApp } from "../test/render";
import { TEST_TOKENS } from "../test/server";

describe("PostEditorPage ( new post )", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(TEST_TOKENS);
  });

  it("shows the zod errors for an empty form", async () => {
    const user = userEvent.setup();
    await renderApp("/posts/new");

    await user.click(await screen.findByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Body is required")).toBeInTheDocument();
  });

  it("publishes and navigates to the created post", async () => {
    const user = userEvent.setup();
    const { router } = await renderApp("/posts/new");

    await user.type(await screen.findByLabelText("Title"), "A brand new post");
    await user.type(screen.getByLabelText("Body"), "Written from the editor test.");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/posts/eeeeeeee-0000-4000-8000-000000000001",
      );
    });
  });
});
