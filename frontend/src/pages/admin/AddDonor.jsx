import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Activity,
  MapPin,
  ClipboardCheck,
  Save,
  UserCircle,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

// --- Zod Schema for Bulletproof Validation ---
const donorSchema = z
  .object({
    full_name: z.string().min(3, "Full name must be at least 3 characters."),
    phone_number: z
      .string()
      .regex(/^\+?1?\d{9,15}$/, "Invalid phone format (e.g. +919876543210)."),
    date_of_birth: z.string().refine((val) => new Date(val) <= new Date(), {
      message: "Date of birth cannot be in the future.",
    }),
    gender: z.enum(["M", "F", "O"], {
      errorMap: () => ({ message: "Please select a gender." }),
    }),
    blood_group: z.string().min(1, "Blood group is required."),
    last_donation_date: z
      .string()
      .optional()
      .refine((val) => !val || new Date(val) <= new Date(), {
        message: "Donation date cannot be in the future.",
      }),
    is_permanently_deferred: z.boolean().default(false),
    deferral_reason: z.string().optional(),
    country: z.string().min(1, "Country is required."),
    state: z.string().min(1, "State is required."),
    district: z.string().min(1, "District is required."),
    has_consented: z.boolean().refine((val) => val === true, {
      message: "Donor consent verification is mandatory.",
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.is_permanently_deferred &&
      (!data.deferral_reason || data.deferral_reason.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deferral_reason"],
        message: "Deferral reason is required when permanently deferred.",
      });
    }
  });

const BLOOD_GROUPS = [
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

export default function AddDonor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // --- React Hook Form Setup ---
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      date_of_birth: "",
      gender: "M",
      blood_group: "",
      last_donation_date: "",
      is_permanently_deferred: false,
      deferral_reason: "",
      country: "",
      state: "",
      district: "",
      has_consented: false,
    },
  });

  const isDeferred = watch("is_permanently_deferred");
  const watchCountry = watch("country");
  const watchState = watch("state");

  const { data: initialData, isLoading: isLoadingGeo } = useQuery({
    queryKey: ["addDonorContext"],
    queryFn: async () => {
      const [orgRes, countriesRes] = await Promise.all([
        api.get("/tenant/organization/"),
        api.get("/locations/countries/"),
      ]);
      return { org: orgRes.data, countries: countriesRes.data };
    },
    staleTime: Infinity,
  });

  // Auto-hydrate
  useEffect(() => {
    if (initialData && !watchCountry) {
      const org = initialData.org;
      setValue("country", org.country?.toString() || "");
      setValue("state", org.state?.toString() || "");
      setValue("district", org.district?.toString() || "");

      if (org.country) {
        api
          .get(`/locations/states/?country=${org.country}`)
          .then((res) => setStates(res.data))
          .catch(() => toast.error("Failed to hydrate states."));
      }
      if (org.state) {
        api
          .get(`/locations/districts/?state=${org.state}`)
          .then((res) => setDistricts(res.data))
          .catch(() => toast.error("Failed to hydrate districts."));
      }
    }
  }, [initialData, setValue, watchCountry]);

  const loadStates = async (countryId) => {
    setStates([]);
    setDistricts([]);
    setValue("state", "");
    setValue("district", "");
    if (countryId) {
      const res = await api.get(`/locations/states/?country=${countryId}`);
      setStates(res.data);
    }
  };

  const loadDistricts = async (stateId) => {
    setDistricts([]);
    setValue("district", "");
    if (stateId) {
      const res = await api.get(`/locations/districts/?state=${stateId}`);
      setDistricts(res.data);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (payload) =>
      (await api.post("/tenant/donors/", payload)).data,
    onSuccess: () => {
      toast.success("Donor registered successfully.");
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      navigate("/admin/donors");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          "Registration failed due to a server error.",
      );
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      last_donation_date: data.last_donation_date || null,
    };
    createMutation.mutate(payload);
  };

  if (isLoadingGeo) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600 mb-4" />
        <p className="text-slate-500 font-medium tracking-widest uppercase text-sm">
          Provisioning Schema...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 relative z-10 border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin/donors">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg border shadow-inner bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                <UserPlus className="h-5 w-5 text-rose-600 dark:text-rose-500" />
              </div>
              Register New Donor
            </h1>
          </div>
          <p className="text-sm ml-11 text-slate-600 dark:text-slate-400">
            Register a new blood donor to your facility's active directory.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6 relative z-30">
          <Card className="backdrop-blur-xl shadow-lg relative z-20 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
            <CardHeader className="border-b pb-4 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
                  <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                Identity & Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.full_name ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Full Name *
                  </label>
                  <Input
                    placeholder="E.g. John Doe"
                    {...register("full_name")}
                    className={`h-11 ${errors.full_name ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500"}`}
                    autoFocus
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.phone_number ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+919876543210"
                    {...register("phone_number")}
                    className={`font-mono h-11 ${errors.phone_number ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500"}`}
                  />
                  {errors.phone_number && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.date_of_birth ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Date of Birth *
                  </label>
                  <Input
                    type="date"
                    {...register("date_of_birth")}
                    className={`h-11 ${errors.date_of_birth ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500"}`}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {errors.date_of_birth && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.gender ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Biological Gender *
                  </label>
                  <Select
                    {...register("gender")}
                    className={`h-11 ${errors.gender ? "border-red-500 focus:border-red-500" : "focus:border-rose-500"}`}
                  >
                    <option value="M">Male (90-day cycle)</option>
                    <option value="F">Female (120-day cycle)</option>
                    <option value="O">Other (120-day cycle)</option>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl shadow-lg overflow-visible relative z-30 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
            <CardHeader className="border-b pb-4 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                  <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                Donor Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        placeholder="Country *"
                        value={field.value}
                        options={
                          initialData?.countries?.map((c) => ({
                            label: c.name,
                            value: c.id.toString(),
                          })) || []
                        }
                        onChange={(val) => {
                          field.onChange(val);
                          loadStates(val);
                        }}
                        className={errors.country ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.country && (
                    <p className="text-xs text-red-600">
                      {errors.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        placeholder="State/Province *"
                        value={field.value}
                        options={states.map((s) => ({
                          label: s.name,
                          value: s.id.toString(),
                        }))}
                        onChange={(val) => {
                          field.onChange(val);
                          loadDistricts(val);
                        }}
                        disabled={!watchCountry}
                      />
                    )}
                  />
                  {errors.state && (
                    <p className="text-xs text-red-600">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        placeholder="District/City *"
                        value={field.value}
                        options={districts.map((d) => ({
                          label: d.name,
                          value: d.id.toString(),
                        }))}
                        onChange={field.onChange}
                        disabled={!watchState}
                      />
                    )}
                  />
                  {errors.district && (
                    <p className="text-xs text-red-600">
                      {errors.district.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6 relative z-10">
          <Card className="backdrop-blur-xl shadow-lg relative z-10 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
            <CardHeader className="border-b pb-4 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                Medical Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.blood_group ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Blood Group *
                </label>
                <Select
                  {...register("blood_group")}
                  className={`h-11 ${errors.blood_group ? "border-red-500 text-red-600" : "focus:border-rose-500"}`}
                >
                  <option value="" disabled>
                    Select Group
                  </option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
                {errors.blood_group && (
                  <p className="text-xs text-red-600">
                    {errors.blood_group.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.last_donation_date ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Last Donation Date
                </label>
                <Input
                  type="date"
                  {...register("last_donation_date")}
                  className={`h-11 ${errors.last_donation_date ? "border-red-500" : "focus:border-rose-500"}`}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.last_donation_date && (
                  <p className="text-xs text-red-600">
                    {errors.last_donation_date.message}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60">
                <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20">
                  <input
                    type="checkbox"
                    {...register("is_permanently_deferred")}
                    className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 dark:bg-slate-950 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold flex items-center gap-2 mb-1 text-amber-700 dark:text-amber-500">
                      <ShieldAlert className="h-4 w-4" /> Medical Deferral
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Mark as medically ineligible. They will be hidden from the
                      public directory.
                    </p>
                  </div>
                </label>

                {isDeferred && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                      {...register("deferral_reason")}
                      placeholder="Required: Deferral Reason (e.g. Chronic condition)..."
                      className={`w-full min-h-25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 resize-none shadow-inner ${errors.deferral_reason ? "border bg-white border-red-500 dark:bg-slate-950/50" : "bg-white border text-slate-900 border-amber-200 focus:border-amber-500 dark:border-amber-500/20 dark:bg-slate-950/50 dark:text-slate-200"}`}
                    />
                    {errors.deferral_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.deferral_reason.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl shadow-lg relative overflow-hidden z-10 bg-white/80 border-rose-200 dark:bg-slate-900/80 dark:border-rose-500/30">
            <div className="absolute inset-0 bg-gradient-to-br pointer-events-none from-rose-100 to-transparent dark:from-rose-500/10" />
            <CardContent className="p-6 relative z-10 flex flex-col gap-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("has_consented")}
                  className={`mt-1 h-5 w-5 rounded transition-all cursor-pointer bg-white dark:bg-slate-950 ${errors.has_consented ? "border-red-500 text-red-600 focus:ring-red-500" : "border-slate-300 text-emerald-600 focus:ring-emerald-500"}`}
                />
                <div>
                  <span
                    className={`text-sm font-bold flex items-center gap-2 transition-colors ${errors.has_consented ? "text-red-600" : "text-slate-900 group-hover:text-rose-600 dark:text-white"}`}
                  >
                    <ClipboardCheck
                      className={`h-4 w-4 ${errors.has_consented ? "text-red-600" : "text-emerald-600"}`}
                    />
                    Explicit Consent Verified
                  </span>
                  <p className="text-xs mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                    I attest that this individual has authorized our facility to
                    store their medical data and surface their masked contact
                    information to the public.
                  </p>
                </div>
              </label>

              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending}
                className="w-full h-14 text-base font-bold shadow-md hover:shadow-lg dark:shadow-[0_0_20px_rgba(225,29,72,0.2)]"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Save Donor Record
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
