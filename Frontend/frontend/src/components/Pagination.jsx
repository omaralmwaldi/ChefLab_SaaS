function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  function getPageNumbers() {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-1 text-stone-400">...</span>
          )}
        </>
      )}

      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium ${
            p === currentPage
              ? "bg-orange-500 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          {p}
        </button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-1 text-stone-400">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default Pagination;
