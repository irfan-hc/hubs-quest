import React from "react";

export function Header() {
  return (
    <header className="w-full shrink-0 border-b border-[#D49572]/20 bg-[#170C12]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="w-full px-3 sm:px-4 h-11 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-2.5">
          <div
            className="w-7 h-7 rounded-lg bg-[#26151C] border border-[#D49572]/40 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 text-[#E3A988]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="21" x2="12" y2="11" />
              <line x1="12" y1="11" x2="6" y2="6" />
              <line x1="12" y1="11" x2="18" y2="6" />
              <line x1="6" y1="6" x2="4" y2="3" />
              <line x1="6" y1="6" x2="9" y2="3" />
              <line x1="18" y1="6" x2="15" y2="3" />
              <line x1="18" y1="6" x2="20" y2="3" />
            </svg>
          </div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#F7EDE6]">
              Recursive <span className="text-[#E3A988]">Soundscapes</span>
            </h1>
            <span className="hidden md:inline-block text-[11px] text-[#E6CFC2]">
              Turn recursion into a relaxing musical experience
            </span>
          </div>
        </div>

        {/* Engine Status Pill */}
        <div
          className="flex items-center space-x-2 text-xs text-[#F7EDE6] bg-[#221319] border border-[#D49572]/25 px-2.5 py-1 rounded-full"
          role="status"
          aria-label="Engine Status"
        >
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"
            aria-hidden="true"
          />
          <span className="font-medium text-[11px] text-[#F7EDE6]">Engine Ready</span>
        </div>
      </div>
    </header>
  );
}
