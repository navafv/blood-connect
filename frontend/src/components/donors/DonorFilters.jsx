import { useState } from "react";
import { Search, Droplet, UserSearch } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export function DonorFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    searchQuery: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    const cleared = { bloodGroup: "", searchQuery: "" };
    setFilters(cleared);
    onFilter(cleared);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 mb-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search by Name/Phone */}
        <div className="flex-2 space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <UserSearch className="h-4 w-4 text-rose-500" />
            Search Donors
          </label>
          <Input
            name="searchQuery"
            placeholder="Search by name or phone number..."
            value={filters.searchQuery}
            onChange={handleChange}
            className="bg-slate-950"
          />
        </div>

        {/* Blood Group Filter */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-rose-500" />
            Blood Group
          </label>
          <Select
            name="bloodGroup"
            value={filters.bloodGroup}
            onChange={handleChange}
            className="bg-slate-950"
          >
            <option value="">Any Group</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-slate-400"
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <Search className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
    </form>
  );
}
