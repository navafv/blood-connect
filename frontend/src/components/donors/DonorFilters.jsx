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

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };

    setFilters(newFilters);

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      onFilter(newFilters);
    }, 300);
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
    <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 transition-colors duration-300 dark:bg-slate-900/40 dark:border-slate-800/60">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-2 relative group">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block transition-colors dark:text-slate-400">
            Search Directory
          </label>
          <div className="relative">
            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors z-10 dark:text-slate-500" />
            <Input
              name="searchQuery"
              placeholder="Query name, phone number, or system ID..."
              value={filters.searchQuery}
              onChange={handleChange}
              className="pl-11 h-11 w-full"
            />
          </div>
        </div>

        {/* Blood Group Dropdown */}
        <div className="flex-1 relative group">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block transition-colors dark:text-slate-400">
            Blood Group
          </label>
          <div className="relative">
            <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/70 z-10" />
            <Select
              name="bloodGroup"
              value={filters.bloodGroup}
              onChange={handleChange}
              className="pl-11 h-11 w-full"
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
            className={`h-11 px-4 w-full md:w-auto font-semibold border transition-all duration-300 ${
              hasActiveFilters
                ? "text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 border-transparent dark:text-slate-300 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20"
                : "text-slate-400 border-transparent dark:text-slate-600"
            }`}
          >
            <XCircle className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
