import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../test/render";

describe("RegisterPage", () => {
  it("renders the interests multi-select from the API", async () => {
    await renderApp("/register");

    expect(await screen.findByLabelText("Books")).toBeInTheDocument();
    expect(screen.getByLabelText("Technology")).toBeInTheDocument();
    expect(screen.getByLabelText("Travel")).toBeInTheDocument();
  });

  it("requires at least one interest ( the zod rule )", async () => {
    const user = userEvent.setup();
    await renderApp("/register");

    await user.type(await screen.findByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Pick at least one interest")).toBeInTheDocument();
  });

  it("registers and tells the user to check their email", async () => {
    const user = userEvent.setup();
    await renderApp("/register");

    await user.type(await screen.findByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByLabelText("Books"));
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });
});
