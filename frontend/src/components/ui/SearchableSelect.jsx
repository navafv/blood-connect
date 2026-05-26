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
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-sm text-slate-100 shadow-inner transition-all duration-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50",
            isOpen && "border-rose-500 ring-1 ring-rose-500/30 bg-slate-950",
            className,
          )}
        >
          <span
            className={cn(
              "truncate font-medium",
              !selectedOption && "text-slate-500 font-normal",
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "text-rose-400 rotate-180" : "text-slate-500"}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Search Input Field */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-3 py-2.5">
              <Search className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
              <input
                type="text"
                autoFocus
                className="flex-1 bg-transparent text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <p className="py-6 text-center text-sm font-medium text-slate-500">
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
                      value === option.value
                        ? "bg-rose-500/10 text-rose-400"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
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
