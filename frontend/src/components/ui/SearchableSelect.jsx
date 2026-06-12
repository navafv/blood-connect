import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export const SearchableSelect = React.forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      placeholder = "Select an option...",
      className,
      disabled = false,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
      function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (selectedValue) => {
      onChange(selectedValue);
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div ref={wrapperRef} className="relative w-full">
        {/* Trigger Button */}
        <button
          type="button"
          ref={ref}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border px-4 py-2 text-sm shadow-sm transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            // Light Mode Defaults
            "bg-white border-slate-200 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
            // Dark Mode Overrides
            "dark:bg-slate-950/50 dark:border-slate-700/80 dark:text-slate-100 dark:shadow-inner dark:focus:border-rose-500 dark:focus:ring-1 dark:focus:ring-rose-500/30",
            // Open State
            isOpen &&
              "border-rose-500 ring-2 ring-rose-500/20 bg-slate-50 dark:border-rose-500 dark:ring-1 dark:ring-rose-500/30 dark:bg-slate-950",
            className,
          )}
        >
          <span
            className={cn(
              "truncate font-medium transition-colors",
              !selectedOption &&
                "text-slate-500 font-normal dark:text-slate-400",
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
              isOpen
                ? "text-rose-600 dark:text-rose-400 rotate-180"
                : "text-slate-400 dark:text-slate-500"
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden bg-white border-slate-200 dark:bg-slate-900/95 dark:backdrop-blur-xl dark:border-slate-700/80 dark:shadow-2xl">
            {/* Search Input Field */}
            <div className="flex items-center border-b px-3 py-2.5 bg-slate-50/50 border-slate-100 dark:bg-slate-950/50 dark:border-slate-800 transition-colors">
              <Search className="h-4 w-4 mr-2 shrink-0 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                autoFocus
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Options List */}
            <div className="max-h-[30vh] overflow-y-auto p-1.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <p className="py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  No results found.
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      // Selected State
                      value === option.value
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        : // Unselected State
                          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

SearchableSelect.displayName = "SearchableSelect";
