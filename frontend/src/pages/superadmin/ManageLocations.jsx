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
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("countries"); // 'countries' | 'states' | 'districts'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // --- Data Fetching ---
  const { data: countries = [], isLoading: loadingC } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () =>
      (await api.get("/superadmin/locations/countries/")).data,
  });

  const { data: states = [], isLoading: loadingS } = useQuery({
    queryKey: ["admin-states"],
    queryFn: async () => (await api.get("/superadmin/locations/states/")).data,
  });

  const { data: districts = [], isLoading: loadingD } = useQuery({
    queryKey: ["admin-districts"],
    queryFn: async () =>
      (await api.get("/superadmin/locations/districts/")).data,
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = `/superadmin/locations/${activeTab}/`;
      if (editingItem) {
        return await api.put(`${endpoint}${editingItem.id}/`, payload);
      }
      return await api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`admin-${activeTab}`]);
      closeModal();
    },
    onError: (err) =>
      setErrorMsg(
        err.response?.data?.detail ||
          "Failed to save location. Check your inputs.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, tab }) =>
      await api.delete(`/superadmin/locations/${tab}/${id}/`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([`admin-${variables.tab}`]);
    },
    onError: (err) =>
      alert(
        err.response?.data?.detail ||
          "Cannot delete this location. It is currently in use by an organization or donor.",
      ),
  });

  // --- Handlers ---
  const openModal = (item = null) => {
    setErrorMsg("");
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

  const isLoading = loadingC || loadingS || loadingD;

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-rose-500" /> Location Master Data
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage geographic locks and regions available for registration.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => openModal()}>
          <Plus className="h-4 w-4" /> Add New {activeTab.slice(0, -1)}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg w-fit border border-slate-800">
        {[
          { id: "countries", label: "Countries", icon: Globe2 },
          { id: "states", label: "States", icon: Map },
          { id: "districts", label: "Districts", icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-rose-500 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                {activeTab === "countries" && (
                  <th className="px-6 py-4 font-semibold">Code / TZ</th>
                )}
                {activeTab === "states" && (
                  <th className="px-6 py-4 font-semibold">Country</th>
                )}
                {activeTab === "districts" && (
                  <th className="px-6 py-4 font-semibold">State</th>
                )}
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeTab === "countries" &&
                countries.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {c.code} <span className="opacity-50 mx-2">|</span>{" "}
                      {c.timezone_offset}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(c)}
                      >
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteMutation.mutate({ id: c.id, tab: activeTab })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </td>
                  </tr>
                ))}

              {activeTab === "states" &&
                states.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {countries.find((c) => c.id === s.country)?.name ||
                        "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(s)}
                      >
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteMutation.mutate({ id: s.id, tab: activeTab })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </td>
                  </tr>
                ))}

              {activeTab === "districts" &&
                districts.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {d.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {states.find((s) => s.id === d.state)?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(d)}
                      >
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteMutation.mutate({ id: d.id, tab: activeTab })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CRUD Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`${editingItem ? "Edit" : "Add"} ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Name</label>
            <Input
              className="bg-slate-950"
              required
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {activeTab === "countries" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">ISO Code</label>
                <Input
                  className="bg-slate-950"
                  required
                  placeholder="e.g. US"
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Timezone</label>
                <Input
                  className="bg-slate-950"
                  required
                  placeholder="e.g. UTC"
                  value={formData.timezone_offset || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timezone_offset: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === "states" && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">
                Belongs to Country
              </label>
              <Select
                className="bg-slate-950"
                required
                value={formData.country || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    country: parseInt(e.target.value),
                  })
                }
              >
                <option value="">Select Country</option>
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
              <label className="text-sm text-slate-400">Belongs to State</label>
              <Select
                className="bg-slate-950"
                required
                value={formData.state || ""}
                onChange={(e) =>
                  setFormData({ ...formData, state: parseInt(e.target.value) })
                }
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
