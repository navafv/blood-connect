import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export const SearchableSelect = React.forwardRef(
  (
    {
      options = [], // Array of { label: string, value: string }
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

    // Find the currently selected label
    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options based on search
    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Close dropdown when clicking outside
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
      setSearchTerm(""); // Reset search on select
    };

    return (
      <div ref={wrapperRef} className="relative w-full">
        {/* Trigger Button (Looks like your original select) */}
        <button
          type="button"
          ref={ref}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-700 bg-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Search Input Field */}
            <div className="flex items-center border-b border-slate-700 px-3 py-2">
              <Search className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {filteredOptions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No results found.
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm text-slate-200 hover:bg-rose-500/10 hover:text-rose-400 transition-colors",
                      value === option.value &&
                        "bg-rose-500/10 text-rose-400 font-medium",
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
