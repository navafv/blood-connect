import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Droplet,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Globe2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";
import { AdBanner } from "../../components/ads/AdBanner";

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function SearchDonors() {
  // Cascading Form State
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Selected Object States
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");

  // Search Results State
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [revealedContacts, setRevealedContacts] = useState(new Set());

  // Pagination State
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // --- 1. Fetch Countries on Component Mount ---
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get("/locations/countries/");
        setCountries(response.data);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
    fetchCountries();
  }, []);

  // --- 2. Handlers for Cascading Dropdowns ---
  const handleCountryChange = async (e) => {
    const countryId = e.target.value;
    const countryObj = countries.find((c) => c.id.toString() === countryId);

    setSelectedCountry(countryObj || null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setStates([]);
    setDistricts([]);

    if (countryId) {
      try {
        const response = await api.get(
          `/locations/states/?country=${countryId}`,
        );
        setStates(response.data);
      } catch (error) {
        console.error("Failed to fetch states:", error);
      }
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    const stateObj = states.find((s) => s.id.toString() === stateId);

    setSelectedState(stateObj || null);
    setSelectedDistrict(null);
    setDistricts([]);

    if (stateId) {
      try {
        const response = await api.get(
          `/locations/districts/?state=${stateId}`,
        );
        setDistricts(response.data);
      } catch (error) {
        console.error("Failed to fetch districts:", error);
      }
    }
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    const districtObj = districts.find((d) => d.id.toString() === districtId);
    setSelectedDistrict(districtObj || null);
  };

  // --- 3. Execute Search ---
  const fetchDonors = async (url = null) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      let endpoint = url;

      // If no URL is provided, build the base search URL from the form parameters
      if (!endpoint) {
        const params = new URLSearchParams();
        if (selectedCountry) params.append("country", selectedCountry.name);
        if (selectedState) params.append("state", selectedState.name);
        if (selectedDistrict) params.append("district", selectedDistrict.name);
        if (selectedBloodGroup)
          params.append("blood_group", selectedBloodGroup);
        endpoint = `/donors/search/?${params.toString()}`;
      } else {
        // Strip the baseURL if DRF provides an absolute URL
        endpoint = endpoint.replace(api.defaults.baseURL, "") || endpoint;
      }

      const response = await api.get(endpoint);
      setResults(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalCount(response.data.count);

      // Reset revealed contacts on every page load
      setRevealedContacts(new Set());
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDonors(); // Fetch page 1
  };

  const revealContact = (donorId) => {
    setRevealedContacts((prev) => {
      const next = new Set(prev);
      next.add(donorId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-24">
      {/* --- Search Header --- */}
      <section className="pt-12 pb-8 px-4 relative overflow-hidden bg-slate-900/50 border-b border-slate-800">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find a Blood Donor
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our platform strictly matches you with available donors in your
            local area. Select your geographic region to begin.
          </p>
        </div>
      </section>

      {/* --- Search Filter Box --- */}
      <div className="container mx-auto max-w-5xl px-4 -mt-6 relative z-20">
        <Card className="bg-slate-900/90 backdrop-blur-xl border-slate-700 shadow-2xl">
          <CardContent className="p-6">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Country
                </label>
                <Select
                  value={selectedCountry?.id || ""}
                  onChange={handleCountryChange}
                  className="bg-slate-950/50"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  State / Province
                </label>
                <Select
                  value={selectedState?.id || ""}
                  onChange={handleStateChange}
                  className="bg-slate-950/50"
                  disabled={!selectedCountry}
                  required
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  District / City
                </label>
                <Select
                  value={selectedDistrict?.id || ""}
                  onChange={handleDistrictChange}
                  className="bg-slate-950/50"
                  disabled={!selectedState}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Blood Group
                </label>
                <Select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="bg-slate-950/50"
                  required
                >
                  <option value="">Any Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="h-10 w-full gap-2 text-sm"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* --- Advertisement Banner --- */}
      <div className="container mx-auto max-w-5xl px-4 mt-8">
        <AdBanner />
      </div>

      {/* --- Search Results --- */}
      <div className="container mx-auto max-w-5xl px-4 mt-12">
        {!hasSearched ? (
          // Pre-search state
          <div className="text-center py-20 text-slate-500">
            <Globe2 className="h-16 w-16 mx-auto mb-4 text-slate-800" />
            <p className="text-lg">
              Select your location to find nearby donors.
            </p>
          </div>
        ) : isSearching ? (
          // Loading state
          <div className="text-center py-20 text-slate-500">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-rose-500" />
            <p className="text-lg">Scanning local registries...</p>
          </div>
        ) : results.length === 0 ? (
          // No results state
          <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-700" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No available donors found
            </h3>
            <p>
              We couldn't find any donors matching {selectedBloodGroup} in{" "}
              {selectedDistrict?.name}.
            </p>
          </div>
        ) : (
          // Results Grid
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-lg font-medium text-white">
                Found {totalCount} Donors in {selectedDistrict?.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((donor) => {
                const isRevealed = revealedContacts.has(donor.id);
                const isAvailable = donor.is_available_now;

                return (
                  <Card
                    key={donor.id}
                    className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold border ${isAvailable ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                          >
                            {donor.blood_group}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-white">
                              {donor.full_name}
                            </h4>
                            <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{" "}
                              {donor.district_name}, {donor.state_name}
                            </p>
                          </div>
                        </div>

                        {isAvailable ? (
                          <Badge
                            variant="success"
                            className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20"
                          >
                            <Clock className="h-3 w-3" /> Unavailable
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Registered By:</span>
                          <span className="text-slate-300 font-medium">
                            {donor.organization_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Last Donation:</span>
                          <span className="text-slate-300">
                            {donor.last_donation_date || "Never donated"}
                          </span>
                        </div>

                        {/* Privacy Masked Phone Field */}
                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-slate-500 flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Contact
                          </span>

                          {isRevealed ? (
                            <a
                              href={`tel:${donor.phone_number}`}
                              className="font-bold text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              {donor.phone_number}
                            </a>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-400 tracking-wider">
                                {donor.masked_phone || "Not provided"}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => revealContact(donor.id)}
                                className="h-7 text-xs border-slate-700 hover:bg-slate-800"
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* --- Pagination Controls --- */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between mt-8 border-t border-slate-800 pt-6">
                <span className="text-sm text-slate-400">
                  Showing {results.length} of {totalCount} total donors
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
                    disabled={!prevPageUrl || isSearching}
                    onClick={() => fetchDonors(prevPageUrl)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
                    disabled={!nextPageUrl || isSearching}
                    onClick={() => fetchDonors(nextPageUrl)}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
