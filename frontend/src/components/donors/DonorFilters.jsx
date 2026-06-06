import { useState, useRef, useEffect } from "react";
import { Droplet, UserSearch, XCircle } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export function DonorFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    searchQuery: "",
  });

  // Ref to hold the debounce timeout
  const filterTimeoutRef = useRef(null);

  const bloodGroups = [
    "A+",
    "A-",
    "A1+",
    "A1-",
    "A1B+",
    "A1B-",
    "A2+",
    "A2-",
    "A2B+",
    "A2B-",
    "AB+",
    "AB-",
    "B+",
    "B-",
    "BBG",
    "INRA",
    "O+",
    "O-",
  ];

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, []);

  // Trigger parent filter immediately on state change for a snappy UX
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };

    // 1. Update local UI state instantly so typing feels responsive
    setFilters(newFilters);

    // 2. Clear the previous timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // 3. Set a new timeout to delay the heavy filtering logic
    filterTimeoutRef.current = setTimeout(() => {
      onFilter(newFilters);
    }, 300); // 300ms debounce
  };

  const handleReset = () => {
    const cleared = { bloodGroup: "", searchQuery: "" };
    setFilters(cleared);
    onFilter(cleared);

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
  };

  const hasActiveFilters =
    filters.bloodGroup !== "" || filters.searchQuery !== "";

  return (
    <div className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Search by Name/Phone/ID */}
        <div className="flex-2 relative group">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
            Search Directory
          </label>
          <div className="relative">
            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
            <Input
              name="searchQuery"
              placeholder="Query name, phone number, or system ID..."
              value={filters.searchQuery}
              onChange={handleChange}
              className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Blood Group Dropdown */}
        <div className="flex-1 relative group">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
            Blood Group
          </label>
          <div className="relative">
            <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/70" />
            <Select
              name="bloodGroup"
              value={filters.bloodGroup}
              onChange={handleChange}
              className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all shadow-inner"
            >
              <option value="">Any Group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={`h-11 px-4 w-full md:w-auto font-semibold border transition-all ${
              hasActiveFilters
                ? "text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border-transparent"
                : "text-slate-600 border-transparent"
            }`}
          >
            <XCircle className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
