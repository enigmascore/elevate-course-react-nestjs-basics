import { expect, Page, test } from "@playwright/test";

/**
 * The posts journey as a SEEDED user ( pw-one@example.com is reserved
 * for these tests - `make seed` gives it 16 posts, so paging is real ).
 */
const EMAIL = "pw-one@example.com";
const PASSWORD = "Password123!";

async function logIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/my-posts/);
}

test.describe("my posts", () => {
  test("seeded posts arrive paged; paging controls page through them", async ({ page }) => {
    await logIn(page);

    // 16 seeded posts, page size 10 -> two pages
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
    const listItems = page.getByRole("listitem");
    await expect(listItems).toHaveCount(10);

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
    await expect(page).toHaveURL(/page=1/);

    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
  });

  test("create a post, see it on top, edit it", async ({ page }) => {
    await logIn(page);
    const runId = Date.now();

    // create
    await page.getByRole("main").getByRole("link", { name: "New post" }).click();
    await page.getByLabel("Title").fill(`E2e post ${runId}`);
    await page.getByLabel("Body").fill("Written by the Playwright journey.");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("heading", { name: `E2e post ${runId}` })).toBeVisible();

    // it is the newest -> first on page 1 of my posts
    await page.getByRole("link", { name: "My posts" }).click();
    await expect(page.getByRole("listitem").first()).toContainText(`E2e post ${runId}`);

    // the list shows the post's excerpt, not just its title
    await expect(page.getByRole("listitem").first()).toContainText(
      "Written by the Playwright journey.",
    );

    // edit it
    await page.getByRole("link", { name: `E2e post ${runId}` }).click();
    await page.getByRole("link", { name: "Edit this post" }).click();
    await page.getByLabel("Title").fill(`E2e post ${runId} ( edited )`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("heading", { name: `E2e post ${runId} ( edited )` }),
    ).toBeVisible();

    // open the post FROM the list - "< Back" returns to the list
    await page.getByRole("link", { name: "My posts" }).click();
    await page.getByRole("link", { name: `E2e post ${runId} ( edited )` }).click();
    await page.getByRole("button", { name: "< Back" }).click();
    await expect(page).toHaveURL(/\/my-posts/);
  });

  test("the editor mirrors the backend rules ( empty title is caught locally )", async ({
    page,
  }) => {
    await logIn(page);
    await page.getByRole("main").getByRole("link", { name: "New post" }).click();
    await page.getByLabel("Body").fill("Body without a title");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
  });
});
