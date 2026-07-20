import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  itemsPerPage,
  onPageChange,
}) => {
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);

  if (totalPages <= 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const startNum = Math.min(startIndex + 1, totalItems);
  const endNum = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="px-4 md:px-6 py-4 border-t border-outline-variant/30 bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
      <span className="text-sm text-on-surface-variant text-center sm:text-left">
        Showing <span className="font-medium text-on-surface">{startNum}</span> to{' '}
        <span className="font-medium text-on-surface">{endNum}</span> of{' '}
        <span className="font-medium text-on-surface">{totalItems}</span> results
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              isPageDropdownOpen
                ? 'border-primary text-primary ring-1 ring-primary/20'
                : 'border-outline-variant/50 text-on-surface hover:border-outline-variant'
            }`}
          >
            Page {currentPage} of {totalPages}
            <ChevronDown className="w-4 h-4 text-on-surface-variant" />
          </button>

          {isPageDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsPageDropdownOpen(false)}
              ></div>
              <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1">
                <div className="max-h-48 overflow-y-auto">
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        onPageChange(page);
                        setIsPageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      Page {page}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
