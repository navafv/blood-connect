import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Globe2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Navigation,
  MapPin,
  List,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";
import { AdBanner } from "../../components/ads/AdBanner";
import { DonorCard } from "../../components/donors/DonorCard";

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
  const [viewMode, setViewMode] = useState("list");

  const [results, setResults] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Init Geodata
  useEffect(() => {
    api.get("/locations/countries/").then((res) => setCountries(res.data));
  }, []);

  // --- AUTOMATIC FETCHING EFFECT ---
  useEffect(() => {
    if (selectedCountry) {
      const delayDebounceFn = setTimeout(() => {
        fetchDonors();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [selectedCountry, selectedState, selectedDistrict, selectedBloodGroup]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported.");
      return;
    }
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
                  toast.success("Location auto-detected!");
                }
              }
            }
          }
        } catch (error) {
          toast.error("Failed to auto-detect location.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Location access denied.");
        setIsLocating(false);
      },
    );
  };

  const handleCountryChange = async (val) => {
    const countryObj = countries.find((c) => c.id.toString() === val);
    setSelectedCountry(countryObj || null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setStates([]);
    setDistricts([]);
    if (val) {
      api
        .get(`/locations/states/?country=${val}`)
        .then((res) => setStates(res.data));
    }
  };

  const handleStateChange = async (val) => {
    const stateObj = states.find((s) => s.id.toString() === val);
    setSelectedState(stateObj || null);
    setSelectedDistrict(null);
    setDistricts([]);
    if (val) {
      api
        .get(`/locations/districts/?state=${val}`)
        .then((res) => setDistricts(res.data));
    }
  };

  const handleDistrictChange = (val) => {
    const districtObj = districts.find((d) => d.id.toString() === val);
    setSelectedDistrict(districtObj || null);
  };

  const fetchDonors = async (overrideUrl = null) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      let endpoint = overrideUrl;
      if (!endpoint) {
        const params = new URLSearchParams();
        if (selectedCountry) params.append("country", selectedCountry.name);
        if (selectedState) params.append("state", selectedState.name);
        if (selectedDistrict) params.append("district", selectedDistrict.name);
        if (selectedBloodGroup)
          params.append("blood_group", selectedBloodGroup);
        endpoint = `/public/donors/search/?${params.toString()}`;
      } else {
        endpoint = endpoint.replace(api.defaults.baseURL, "") || endpoint;
      }

      const response = await api.get(endpoint);
      setResults(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalCount(response.data.count);
    } catch (error) {
      toast.error("Failed to query directory.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- SKELETON LOADER COMPONENT ---
  const SkeletonCard = () => (
    <div
      className={`animate-pulse bg-white border border-slate-200 rounded-3xl p-6 flex dark:bg-slate-900/50 dark:border-slate-800 ${viewMode === "list" ? "flex-col md:flex-row items-center gap-6" : "flex-col h-[300px]"}`}
    >
      <div
        className={`flex gap-4 ${viewMode === "list" ? "w-1/3" : "w-full mb-6"}`}
      >
        <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="space-y-3 w-full pt-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      </div>
      <div
        className={`space-y-3 ${viewMode === "list" ? "w-1/3" : "w-full mt-auto mb-4"}`}
      >
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
      </div>
      <div
        className={`flex gap-2 ${viewMode === "list" ? "w-1/3 justify-end" : "w-full mt-auto"}`}
      >
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Emergency Search | Bloodonate</title>
      </Helmet>

      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col pb-24">
        {/* Header */}
        <section className="pt-12 pb-16 px-4 relative overflow-hidden bg-white/40 border-b border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-rose-500/10 pointer-events-none dark:bg-rose-600/10" />
          <div className="container mx-auto max-w-4xl text-center relative z-10 animate-in fade-in duration-500">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white">
              Emergency Donor Search
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
              Select a location below to instantly query available donors in
              your area.
            </p>
          </div>
        </section>

        {/* Input Matrix */}
        <div className="container mx-auto max-w-5xl px-4 -mt-10 relative z-20">
          <Card className="backdrop-blur-xl overflow-visible bg-white/90 border-slate-200 shadow-xl dark:bg-slate-900/80 dark:border-slate-800">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                  <Search className="h-4 w-4 text-rose-600 dark:text-rose-500" />{" "}
                  Filter Criteria
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  {isLocating ? "Resolving..." : "Locate Me"}
                </Button>
              </div>

              {/* Matrix acts dynamically */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                <div className="space-y-2 relative z-50">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                <div className="space-y-2 relative z-40">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                <div className="space-y-2 relative z-30">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                <div className="space-y-2 relative z-20">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Blood Group
                  </label>
                  <SearchableSelect
                    options={bloodGroups.map((bg) => ({
                      label: bg,
                      value: bg,
                    }))}
                    value={selectedBloodGroup}
                    onChange={setSelectedBloodGroup}
                    placeholder="Any Group"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Primary Gateway Ad Placement --- */}
        <div className="container mx-auto max-w-5xl px-4 mt-8">
          <AdBanner format="banner" />
        </div>

        {/* Results Surface */}
        <div className="container mx-auto max-w-5xl px-4 mt-12 min-h-[400px]">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center text-center py-24 animate-in fade-in duration-700">
              <Globe2 className="h-20 w-20 mb-6 text-slate-300 dark:text-slate-800" />
              <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-400">
                Waiting for location...
              </h3>
              <p className="text-slate-500 max-w-md">
                Select your geographical area above to instantly see available
                donors.
              </p>
            </div>
          ) : isSearching ? (
            // SKELETON LOADERS
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
              <div
                className={`transition-all duration-500 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}`}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 mb-6 border border-slate-200 dark:border-slate-700">
                <AlertCircle className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                No Donors Found
              </h3>
              <p className="max-w-md text-slate-600 dark:text-slate-400">
                Try widening your search area or removing the blood group
                filter.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-4 gap-4 border-slate-200 dark:border-slate-800/80">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <MapPin className="h-5 w-5 text-rose-600" /> Regional
                    Matches
                  </h3>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                    Surfacing {totalCount} verified records.
                  </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === "list" ? "bg-white shadow-sm text-rose-600 dark:bg-slate-800 dark:text-rose-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"}`}
                  >
                    <List className="h-4 w-4" />{" "}
                    <span className="hidden sm:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === "grid" ? "bg-white shadow-sm text-rose-600 dark:bg-slate-800 dark:text-rose-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"}`}
                  >
                    <LayoutGrid className="h-4 w-4" />{" "}
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                </div>
              </div>

              <div
                className={`transition-all duration-500 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}`}
              >
                {results.map((donor) => (
                  <DonorCard key={donor.id} donor={donor} viewMode={viewMode} />
                ))}
              </div>

              {/* --- Secondary End-of-Journey Ad Placement --- */}
              {results.length > 3 && (
                <div className="mt-10 mb-4 animate-in fade-in duration-700">
                  <AdBanner format="banner" />
                </div>
              )}

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-10 border-t pt-6 gap-4 border-slate-200 dark:border-slate-800/80">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Displaying batch of {results.length} records.
                  </span>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!prevPageUrl || isSearching}
                      onClick={() => fetchDonors(prevPageUrl)}
                      className="flex-1 sm:flex-none"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!nextPageUrl || isSearching}
                      onClick={() => fetchDonors(nextPageUrl)}
                      className="flex-1 sm:flex-none"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
