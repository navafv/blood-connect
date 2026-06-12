import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Globe2,
  Map,
  MapPinOff,
  ServerCrash,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import api from "../../lib/axios";

export default function ManageLocations() {
  const queryClient = useQueryClient();

  // --- UI Transition State ---
  const [activeTab, setActiveTab] = useState("countries"); // 'countries' | 'states' | 'districts'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Payload State ---
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // --- Query Pipeline: Fetch Geographic Data ---
  const {
    data: countries = [],
    isLoading: loadingC,
    isError: isErrorC,
  } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () => {
      const res = await api.get("/superadmin/locations/countries/");
      return res.data.results || res.data;
    },
  });

  const {
    data: states = [],
    isLoading: loadingS,
    isError: isErrorS,
  } = useQuery({
    queryKey: ["admin-states"],
    queryFn: async () => {
      const res = await api.get("/superadmin/locations/states/");
      return res.data.results || res.data;
    },
  });

  const {
    data: districts = [],
    isLoading: loadingD,
    isError: isErrorD,
  } = useQuery({
    queryKey: ["admin-districts"],
    queryFn: async () => {
      const res = await api.get("/superadmin/locations/districts/");
      return res.data.results || res.data;
    },
  });

  // --- Mutation Pipeline: Upsert Location ---
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = `/superadmin/locations/${activeTab}/`;
      if (editingItem) {
        return await api.put(`${endpoint}${editingItem.id}/`, payload);
      }
      return await api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${activeTab}`] });
      toast.success(`${activeTab.slice(0, -1)} data saved successfully.`, {
        className: "capitalize",
      });
      closeModal();
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          "Failed to save location. Check your inputs.",
      );
    },
  });

  // --- Mutation Pipeline: Delete Location ---
  const deleteMutation = useMutation({
    mutationFn: async ({ id, tab }) =>
      await api.delete(`/superadmin/locations/${tab}/${id}/`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.tab}`] });
      toast.success("Location deleted permanently.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          "Cannot delete this location. It is actively bound to a tenant or donor.",
      );
    },
  });

  // --- Action Handlers ---
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({ is_whitelisted: true, timezone_offset: "UTC" }); // Defaults
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // --- UI Transition States ---
  const isLoading = loadingC || loadingS || loadingD;
  const isError = isErrorC || isErrorS || isErrorD;

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 transition-colors duration-300 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin transition-colors duration-300 text-rose-600 dark:text-rose-500" />
        <span className="text-sm font-semibold tracking-widest uppercase">
          Fetching Geographic Data...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500 transition-colors duration-300">
        <div className="h-20 w-20 rounded-2xl flex items-center justify-center border mb-6 shadow-inner transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
          <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
          Telemetry Failure
        </h3>
        <p className="max-w-md mb-6 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
          Unable to establish connection with the central location database.
        </p>
        <Button
          variant="outline"
          className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => window.location.reload()}
        >
          Reload Workspace
        </Button>
      </div>
    );
  }

  // --- Helper to determine current dataset ---
  const getCurrentData = () => {
    switch (activeTab) {
      case "countries":
        return countries;
      case "states":
        return states;
      case "districts":
        return districts;
      default:
        return [];
    }
  };
  const currentData = getCurrentData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <MapPin className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Location Master Data
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage global geographic locks and regions available for tenant
            registration.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-md hover:shadow-lg dark:shadow-lg transition-all duration-300"
          onClick={() => openModal()}
        >
          <Plus className="h-4 w-4" /> Add New{" "}
          {activeTab.slice(0, -1).replace(/^\w/, (c) => c.toUpperCase())}
        </Button>
      </div>

      {/* --- Segmented Tab Navigation --- */}
      <div className="flex gap-2 p-1.5 rounded-xl w-fit border shadow-sm transition-colors duration-300 bg-white/60 border-slate-200 backdrop-blur-md dark:bg-slate-900/40 dark:border-slate-800/60">
        {[
          { id: "countries", label: "Countries", icon: Globe2 },
          { id: "states", label: "States", icon: Map },
          { id: "districts", label: "Districts", icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 border ${
              activeTab === tab.id
                ? "shadow-sm bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:border-slate-700"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <tab.icon
              className={`h-4 w-4 transition-colors duration-300 ${activeTab === tab.id ? "text-rose-400 dark:text-rose-500" : ""}`}
            />{" "}
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Nomenclature</th>
                {activeTab === "countries" && (
                  <th className="px-6 py-5">ISO Code / Timezone</th>
                )}
                {activeTab === "states" && (
                  <th className="px-6 py-5">Sovereign Parent</th>
                )}
                {activeTab === "districts" && (
                  <th className="px-6 py-5">State Parent</th>
                )}
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <MapPinOff className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      No {activeTab} Found
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      The active database contains no entries for this
                      geographic tier.
                    </p>
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-bold text-base transition-colors duration-300 text-slate-900 dark:text-white">
                      {item.name}
                    </td>

                    {activeTab === "countries" && (
                      <td className="px-6 py-4 font-mono tracking-tight font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        <span className="transition-colors duration-300 text-blue-600 dark:text-blue-400">
                          {item.code}
                        </span>
                        <span className="opacity-30 mx-3 transition-colors duration-300 text-slate-400">
                          |
                        </span>
                        {item.timezone_offset}
                      </td>
                    )}

                    {activeTab === "states" && (
                      <td className="px-6 py-4 font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {countries.find((c) => c.id === item.country)?.name || (
                          <span className="italic opacity-50">Orphaned</span>
                        )}
                      </td>
                    )}

                    {activeTab === "districts" && (
                      <td className="px-6 py-4 font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {states.find((s) => s.id === item.state)?.name || (
                          <span className="italic opacity-50">Orphaned</span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Location"
                          className="h-8 w-8 p-0 transition-colors duration-300 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
                          onClick={() => openModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Location"
                          className="h-8 w-8 p-0 disabled:opacity-50 transition-colors duration-300 text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-500/70 dark:hover:text-rose-400 dark:hover:bg-rose-500/10"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to permanently delete ${item.name}?`,
                              )
                            ) {
                              deleteMutation.mutate({
                                id: item.id,
                                tab: activeTab,
                              });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables?.id === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- CRUD Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`${editingItem ? "Edit" : "Add"} ${activeTab.slice(0, -1).replace(/^\w/, (c) => c.toUpperCase())}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Nomenclature
            </label>
            <Input
              className="h-11 transition-colors duration-300 bg-white border-slate-200 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700"
              required
              placeholder="e.g. Kerala"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={saveMutation.isPending}
            />
          </div>

          {activeTab === "countries" && (
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  ISO Code
                </label>
                <Input
                  className="h-11 font-mono transition-colors duration-300 bg-white border-slate-200 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700"
                  required
                  placeholder="e.g. IN"
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Timezone Offset
                </label>
                <Input
                  className="h-11 font-mono transition-colors duration-300 bg-white border-slate-200 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700"
                  required
                  placeholder="e.g. UTC+5:30"
                  value={formData.timezone_offset || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timezone_offset: e.target.value,
                    })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>
            </div>
          )}

          {activeTab === "states" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Sovereign Parent (Country)
              </label>
              <Select
                className="h-11 transition-colors duration-300 bg-white border-slate-200 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700"
                required
                value={formData.country || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    country: parseInt(e.target.value),
                  })
                }
                disabled={saveMutation.isPending}
              >
                <option value="" disabled>
                  Select Parent Country
                </option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {activeTab === "districts" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                State Parent
              </label>
              <Select
                className="h-11 transition-colors duration-300 bg-white border-slate-200 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700"
                required
                value={formData.state || ""}
                onChange={(e) =>
                  setFormData({ ...formData, state: parseInt(e.target.value) })
                }
                disabled={saveMutation.isPending}
              >
                <option value="" disabled>
                  Select Parent State
                </option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="pt-6 border-t flex justify-end gap-3 transition-colors duration-300 border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
              className="transition-colors duration-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              disabled={saveMutation.isPending}
            >
              Abort
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saveMutation.isPending}
              className="shadow-md min-w-32 hover:shadow-lg transition-all duration-300 dark:shadow-lg"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Committing...
                </>
              ) : (
                "Save Data"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
