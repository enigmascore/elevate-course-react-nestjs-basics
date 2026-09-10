import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "../store/auth";
import { renderApp } from "../test/render";
import { TEST_USER } from "../test/server";

describe("LoginPage", () => {
  it("shows the zod error for an invalid email, without calling the API", async () => {
    const user = userEvent.setup();
    await renderApp("/login");

    await user.type(await screen.findByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "whatever");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });

  it("logs in, stores the tokens and navigates to my posts", async () => {
    const user = userEvent.setup();
    const { router } = await renderApp("/login");

    await user.type(await screen.findByLabelText("Email"), TEST_USER.email);
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("test-access-token");
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/my-posts");
    });
  });

  it("shows the backend message on wrong credentials", async () => {
    const user = userEvent.setup();
    await renderApp("/login");

    await user.type(await screen.findByLabelText("Email"), TEST_USER.email);
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
