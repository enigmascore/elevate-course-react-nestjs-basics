import { expect, test } from "@playwright/test";
import { clearMessages, extractLink, waitForMessageTo } from "./support/mailhog";

/**
 * The full signup journey, end to end and FOR REAL: register in the
 * browser, catch the activation email in MailHog, follow its link,
 * log in, land on an empty "my posts".
 */
test.describe("registration and activation", () => {
  test("register -> activation email -> activate -> login", async ({ page }) => {
    await clearMessages();
    const runId = Date.now();
    const email = `e2e.signup.${runId}@example.com`;
    const password = "Password123!";

    // register in the browser
    await page.goto("/register");
    await page.getByLabel("First name").fill("E2e");
    await page.getByLabel("Last name").fill("Signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByLabel("Technology").check();
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Check your email")).toBeVisible();

    // the activation email lands in MailHog; follow its link
    const message = await waitForMessageTo(email);
    const link = extractLink(message);
    expect(link).toContain("/activate?token=");
    await page.goto(link);
    await expect(page.getByText("Account activated")).toBeVisible();

    // log in with the new credentials
    await page.getByRole("link", { name: "log in", exact: true }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/my-posts/);
    await expect(page.getByText("No posts yet - write your first one.")).toBeVisible();
  });

  test("wrong password shows the backend's message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("pw-one@example.com");
    await page.getByLabel("Password").fill("Wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });
});
