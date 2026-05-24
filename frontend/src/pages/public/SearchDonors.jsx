import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Globe2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";
import { AdBanner } from "../../components/ads/AdBanner";
import { DonorCard } from "../../components/donors/DonorCard";

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function SearchDonors() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");

  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [results, setResults] = useState([]);

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

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          const detectedCountry = data.address?.country;
          const detectedState = data.address?.state;

          if (detectedCountry) {
            const matchedCountry = countries.find(
              (c) => c.name.toLowerCase() === detectedCountry.toLowerCase(),
            );
            if (matchedCountry) {
              setSelectedCountry(matchedCountry);
              const stateRes = await api.get(
                `/locations/states/?country=${matchedCountry.id}`,
              );
              setStates(stateRes.data);
              if (detectedState) {
                const matchedState = stateRes.data.find(
                  (s) => s.name.toLowerCase() === detectedState.toLowerCase(),
                );
                if (matchedState) {
                  setSelectedState(matchedState);
                  const distRes = await api.get(
                    `/locations/districts/?state=${matchedState.id}`,
                  );
                  setDistricts(distRes.data);
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { timeout: 10000 },
    );
  };

  // --- Handlers for SearchableSelect ---
  const handleCountryChange = async (val) => {
    const countryObj = countries.find((c) => c.id.toString() === val);
    setSelectedCountry(countryObj || null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setStates([]);
    setDistricts([]);
    if (val) {
      const response = await api.get(`/locations/states/?country=${val}`);
      setStates(response.data);
    }
  };

  const handleStateChange = async (val) => {
    const stateObj = states.find((s) => s.id.toString() === val);
    setSelectedState(stateObj || null);
    setSelectedDistrict(null);
    setDistricts([]);
    if (val) {
      const response = await api.get(`/locations/districts/?state=${val}`);
      setDistricts(response.data);
    }
  };

  const handleDistrictChange = (val) => {
    const districtObj = districts.find((d) => d.id.toString() === val);
    setSelectedDistrict(districtObj || null);
  };

  // --- 4. Execute Search ---
  const fetchDonors = async (url = null) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      let endpoint =
        url ||
        `/donors/search/?country=${selectedCountry?.name || ""}&state=${selectedState?.name || ""}&district=${selectedDistrict?.name || ""}&blood_group=${selectedBloodGroup}`;
      const response = await api.get(
        endpoint.replace(api.defaults.baseURL, ""),
      );
      setResults(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalCount(response.data.count);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDonors();
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
            <div className="flex justify-end mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="bg-slate-950/50 border-slate-700 text-rose-400"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Auto-Detect Location
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchDonors();
              }}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Country
                </label>
                <SearchableSelect
                  options={countries.map((c) => ({
                    label: c.name,
                    value: c.id.toString(),
                  }))}
                  value={selectedCountry?.id?.toString() || ""}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  State
                </label>
                <SearchableSelect
                  options={states.map((s) => ({
                    label: s.name,
                    value: s.id.toString(),
                  }))}
                  value={selectedState?.id?.toString() || ""}
                  onChange={handleStateChange}
                  placeholder="Select State"
                  disabled={!selectedCountry}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  District
                </label>
                <SearchableSelect
                  options={districts.map((d) => ({
                    label: d.name,
                    value: d.id.toString(),
                  }))}
                  value={selectedDistrict?.id?.toString() || ""}
                  onChange={handleDistrictChange}
                  placeholder="Select District"
                  disabled={!selectedState}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Blood Group
                </label>
                <SearchableSelect
                  options={bloodGroups.map((bg) => ({ label: bg, value: bg }))}
                  value={selectedBloodGroup}
                  onChange={setSelectedBloodGroup}
                  placeholder="Any Group"
                />
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
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-8">
        <AdBanner />
      </div>

      {/* --- Search Results --- */}
      <div className="container mx-auto max-w-5xl px-4 mt-12">
        {!hasSearched ? (
          <div className="text-center py-20 text-slate-500">
            <Globe2 className="h-16 w-16 mx-auto mb-4 text-slate-800" />
            <p className="text-lg">
              Select your location to find nearby donors.
            </p>
          </div>
        ) : isSearching ? (
          <div className="text-center py-20 text-slate-500">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-rose-500" />
            <p className="text-lg">Scanning local registries...</p>
          </div>
        ) : results.length === 0 ? (
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
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-lg font-medium text-white">
                Found {totalCount} Donors in {selectedDistrict?.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>

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
