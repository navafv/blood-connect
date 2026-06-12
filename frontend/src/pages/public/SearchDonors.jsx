import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Globe2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Navigation,
  MapPin,
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
  // --- Master Data State ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // --- Active Filter State ---
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");

  // --- UI Transition State ---
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // --- Payload & Pagination State ---
  const [results, setResults] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get("/locations/countries/");
        setCountries(response.data);
      } catch (error) {
        console.error("Geographic initialization failed:", error);
        toast.error("Failed to load geographic master data.");
      }
    };
    fetchCountries();
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Hardware geolocation is not supported by your browser.");
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
            // Reconcile external map data with internal master records
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
                  toast.success("Location auto-detected successfully.");
                }
              }
            } else {
              toast.error(
                "Detected location is not currently serviced by our network.",
              );
            }
          }
        } catch (error) {
          console.error("Reverse geocoding pipeline failure:", error);
          toast.error("Failed to resolve coordinate data.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied or timed out:", error);
        toast.error(
          "Location access denied. Please select your region manually.",
        );
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  // --- Cascading Mutation Handlers ---

  const handleCountryChange = async (val) => {
    const countryObj = countries.find((c) => c.id.toString() === val);
    setSelectedCountry(countryObj || null);

    // Purge downstream dependencies
    setSelectedState(null);
    setSelectedDistrict(null);
    setStates([]);
    setDistricts([]);

    if (val) {
      try {
        const response = await api.get(`/locations/states/?country=${val}`);
        setStates(response.data);
      } catch (error) {
        toast.error("Failed to fetch state data.");
      }
    }
  };

  const handleStateChange = async (val) => {
    const stateObj = states.find((s) => s.id.toString() === val);
    setSelectedState(stateObj || null);

    // Purge downstream dependencies
    setSelectedDistrict(null);
    setDistricts([]);

    if (val) {
      try {
        const response = await api.get(`/locations/districts/?state=${val}`);
        setDistricts(response.data);
      } catch (error) {
        toast.error("Failed to fetch district data.");
      }
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
        // Construct canonical search query.
        // Note: Backend requires the 'name' string, not the relational ID.
        const params = new URLSearchParams();
        if (selectedCountry) params.append("country", selectedCountry.name);
        if (selectedState) params.append("state", selectedState.name);
        if (selectedDistrict) params.append("district", selectedDistrict.name);
        if (selectedBloodGroup)
          params.append("blood_group", selectedBloodGroup);

        endpoint = `/public/donors/search/?${params.toString()}`;
      } else {
        // Strip base URL if pagination returns absolute paths
        endpoint = endpoint.replace(api.defaults.baseURL, "") || endpoint;
      }

      const response = await api.get(endpoint);
      setResults(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalCount(response.data.count);

      if (response.data.count === 0 && !overrideUrl) {
        toast("No matches found for this specific criteria.", { icon: "ℹ️" });
      }
    } catch (error) {
      console.error("Query dispatch failed:", error);
      toast.error("Failed to connect to the directory server.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* SEO Configuration */}
      <Helmet>
        <title>Search Blood Donors | Bloodonate Directory</title>
        <meta
          name="description"
          content="Search our real-time blood donor directory to find eligible blood donors in your city or district. Filter by country, state, district, and blood group."
        />
        <meta
          name="keywords"
          content="search blood donors, find blood donor, blood donation directory, local blood search, blood group search, emergency blood"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Search Blood Donors | Bloodonate" />
        <meta
          property="og:description"
          content="Search our real-time blood donor directory to find eligible blood donors in your city or district."
        />
        {/* Replace with your actual deployed URL */}
        <meta property="og:url" content="https://www.bloodonate.org/search" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Search Blood Donors | Bloodonate" />
        <meta
          name="twitter:description"
          content="Search our real-time blood donor directory to find eligible blood donors in your city or district."
        />

        {/* Canonical Link */}
        <link rel="canonical" href="https://www.bloodonate.org/search" />
      </Helmet>

      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col pb-24">
        {/* --- Search Console Header --- */}
        <section className="pt-12 pb-16 px-4 relative overflow-hidden transition-colors duration-300 bg-white/40 border-b border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
          <div
            className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-rose-500/10 dark:bg-rose-600/10"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-4xl text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Directory Search
            </h1>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Our infrastructure connects you securely with eligible donors in
              your locality. Define your geographical parameters to initiate the
              query.
            </p>
          </div>
        </section>

        {/* --- Input Filter Matrix --- */}
        <div className="container mx-auto max-w-5xl px-4 -mt-10 relative z-20">
          <Card className="backdrop-blur-xl overflow-visible transition-colors duration-300 bg-white/80 border-slate-200 shadow-xl dark:bg-slate-900/70 dark:border-slate-700/80 dark:shadow-2xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                  <Search
                    className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                    aria-hidden="true"
                  />{" "}
                  Query Parameters
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="transition-colors duration-300 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 dark:border-slate-700 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-slate-800"
                >
                  {isLocating ? (
                    <Loader2
                      className="h-4 w-4 mr-2 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {isLocating ? "Resolving..." : "Auto-Detect Location"}
                </Button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchDonors();
                }}
                className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end"
              >
                <div className="space-y-2 relative z-50">
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
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
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    State / Province
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
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    District / City
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
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
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

                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-full gap-2 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Search className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isSearching ? "Querying..." : "Execute Search"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* --- Ad Network Boundary --- */}
        <div className="container mx-auto max-w-5xl px-4 mt-8">
          <AdBanner />
        </div>

        {/* --- Data Visualization Render Surface --- */}
        <div className="container mx-auto max-w-5xl px-4 mt-12 min-h-[400px]">
          {!hasSearched ? (
            /* Pre-Query State */
            <div className="flex flex-col items-center justify-center text-center py-24 animate-in fade-in duration-700">
              <Globe2
                className="h-20 w-20 mb-6 transition-colors duration-300 text-slate-200 dark:text-slate-800"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Awaiting Parameters
              </h3>
              <p className="text-base max-w-md transition-colors duration-300 text-slate-400 dark:text-slate-500">
                Define your geographic constraints above to securely query the
                nearest available donors.
              </p>
            </div>
          ) : isSearching ? (
            /* Flight State */
            <div className="flex flex-col items-center justify-center text-center py-24">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full blur-xl animate-pulse transition-colors duration-300 bg-rose-500/20 dark:bg-rose-500/20" />
                <Loader2
                  className="h-16 w-16 animate-spin relative z-10 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                  aria-hidden="true"
                />
              </div>
              <p className="text-lg font-medium transition-colors duration-300 text-slate-700 dark:text-slate-300">
                Scanning regional registries...
              </p>
            </div>
          ) : results.length === 0 ? (
            /* Empty Set Resolution */
            <div className="flex flex-col items-center justify-center text-center py-24 backdrop-blur-sm rounded-3xl border animate-in fade-in zoom-in-95 duration-300 transition-colors bg-white border-slate-200 shadow-md dark:bg-slate-900/40 dark:border-slate-800/60 dark:shadow-inner">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center border mb-6 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <AlertCircle
                  className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                Zero Active Matches
              </h3>
              <p className="max-w-md text-base leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                We could not identify any eligible donors matching{" "}
                <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-300">
                  {selectedBloodGroup || "any group"}
                </strong>{" "}
                in{" "}
                <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-300">
                  {selectedDistrict?.name || "your selected region"}
                </strong>{" "}
                at this time.
              </p>
            </div>
          ) : (
            /* Positive Resolution State */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end border-b pb-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                    <MapPin
                      className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                      aria-hidden="true"
                    />
                    Regional Matches
                  </h3>
                  <p className="text-sm mt-1 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Surfacing {totalCount} verified records in{" "}
                    {selectedDistrict?.name || "the selected region"}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((donor) => (
                  <DonorCard key={donor.id} donor={donor} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-10 border-t pt-6 gap-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                  <span className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Displaying batch of {results.length} records.
                  </span>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 px-4 flex-1 sm:flex-none"
                      disabled={!prevPageUrl || isSearching}
                      onClick={() => fetchDonors(prevPageUrl)}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />{" "}
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 px-4 flex-1 sm:flex-none"
                      disabled={!nextPageUrl || isSearching}
                      onClick={() => fetchDonors(nextPageUrl)}
                    >
                      Next{" "}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
