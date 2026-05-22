import { useState } from "react";
import { Search, MapPin, Droplet } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export function DonorFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    location: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the filter values back to the parent component (SearchDonors page)
    onFilter(filters);
  };

  const handleReset = () => {
    const cleared = { bloodGroup: "", location: "" };
    setFilters(cleared);
    onFilter(cleared);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 shadow-lg"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
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
          >
            <option value="">Any Blood Group</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </div>

        {/* Location Filter */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" />
            Location
          </label>
          <Input
            name="location"
            placeholder="e.g., Munderi, Kannur or 670591"
            value={filters.location}
            onChange={handleChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <Search className="h-4 w-4" />
            Search Donors
          </Button>
        </div>
      </div>
    </form>
  );
}
