import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PagingControls } from "./PagingControls";

describe("PagingControls", () => {
  it("disables Previous on the first page and Next on the last", () => {
    const { rerender } = render(
      <PagingControls page={0} size={10} total={23} onPageChange={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    rerender(<PagingControls page={2} size={10} total={23} onPageChange={() => undefined} />);
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("reports the requested page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<PagingControls page={1} size={10} total={23} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });
});
