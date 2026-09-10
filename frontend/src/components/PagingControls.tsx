interface PagingControlsProps {
  page: number; // 0-based, as the API speaks it
  size: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Renders the paging every list endpoint supports: driven purely by
 * the items + total the API returns.
 */
export function PagingControls({ page, size, total, onPageChange }: PagingControlsProps) {
  const pageCount = Math.max(1, Math.ceil(total / size));

  return (
    <nav aria-label="pagination" className="flex items-center justify-between pt-4">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {page + 1} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page + 1 >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
