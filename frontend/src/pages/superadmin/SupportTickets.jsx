import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Search,
  Loader2,
  Clock,
  Send,
  MessageSquare,
  ServerCrash,
  RefreshCw,
  Inbox,
  SearchX,
  Building2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function SupportTickets() {
  const queryClient = useQueryClient();

  // --- UI & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [updateStatus, setUpdateStatus] = useState("IN_PROGRESS");

  // --- Query Pipeline: Fetch Tickets ---
  const {
    data: tickets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["superadmin-tenant-tickets"],
    queryFn: async () => {
      const res = await api.get("/superadmin/support-tickets/");
      return res.data.results || res.data;
    },
  });

  // Derived state for the active chat modal
  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  // Sync the local status dropdown with the active ticket's actual status
  useEffect(() => {
    if (activeTicket) {
      setUpdateStatus(activeTicket.status);
    }
  }, [activeTicket]);

  // --- Mutation Pipeline: Dispatch Reply & Update Status ---
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(
        `/superadmin/support-tickets/${selectedTicketId}/reply/`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin-tenant-tickets"],
      });

      setSelectedTicketId(null);
      setReplyText("");

      toast.success("Response dispatched successfully.", { icon: "📨" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to dispatch response.");
    },
  });

  // --- Action Handlers ---
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() && updateStatus === activeTicket.status) return;

    replyMutation.mutate({
      message: replyText,
      status: updateStatus,
    });
  };

  // --- Client-Side Search Engine ---
  const filteredTickets = tickets.filter(
    (t) =>
      (statusFilter === "ALL" || t.status === statusFilter) &&
      (t.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // --- Formatters ---
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge
            variant="warning"
            className="transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
          >
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="primary"
            className="transition-colors duration-300 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
          >
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="success"
            className="transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
          >
            Resolved
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <LifeBuoy className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Tenant Support Queue
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage, triage, and resolve helpdesk tickets submitted by registered
            facilities.
          </p>
        </div>
      </div>

      {/* --- Search & Filter Toolbar --- */}
      <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border shadow-sm backdrop-blur-md transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60">
        <div className="relative w-full flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
          <Input
            placeholder="Search by facility name or ticket subject..."
            className="pl-11 h-11 transition-all duration-300 focus:ring-rose-500/20 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 w-full sm:w-56 transition-all duration-300 focus:ring-rose-500/20 bg-white border-slate-200 text-slate-700 dark:bg-slate-950/50 dark:border-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open (Awaiting Triage)</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Tenant Organization</th>
                <th className="px-6 py-5">Subject Line</th>
                <th className="px-6 py-5">Current Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      Loading Queue...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                      <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Telemetry Failure
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm mb-6 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Unable to retrieve support tickets from the central
                      database.
                    </p>
                    <Button
                      variant="outline"
                      className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <Inbox className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Queue Empty
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      There are no support tickets from any tenant organization.
                    </p>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-300"
                  >
                    <SearchX className="h-12 w-12 mb-4 mx-auto transition-colors duration-300 text-slate-400 dark:text-slate-600" />
                    <h3 className="text-lg font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                      No Matches Found
                    </h3>
                    <p className="text-sm max-w-sm mx-auto transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      No tickets match your search parameters or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-inner shrink-0 border transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 dark:group-hover:bg-slate-800">
                          <Building2 className="h-5 w-5 transition-colors duration-300 text-slate-400 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm transition-colors duration-300 text-slate-900 dark:text-white">
                            {ticket.organization_name}
                          </p>
                          <p className="text-xs font-medium mt-0.5 tracking-tight transition-colors duration-300 text-slate-500 dark:text-slate-500">
                            Requested by: {ticket.created_by_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="truncate max-w-[200px] sm:max-w-xs font-medium transition-colors duration-300 text-slate-900 dark:text-slate-200">
                        {ticket.subject}
                      </p>
                      <p className="text-xs font-medium font-mono mt-1 tracking-tight transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        TCKT-{ticket.id.toString().padStart(4, "0")}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                        {formatDate(ticket.updated_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 transition-colors duration-300 text-blue-600 dark:text-blue-400" />{" "}
                        Triage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- READ & REPLY MODAL --- */}
      <Modal
        isOpen={!!activeTicket}
        onClose={() => {
          setSelectedTicketId(null);
          setReplyText("");
        }}
        title="Tenant Support Interface"
      >
        {activeTicket && (
          <div className="flex flex-col h-[75vh] sm:h-[80vh] w-full">
            {/* 1. Header & Original Inquiry - PINNED TOP */}
            <div className="shrink-0 mb-4 overflow-y-auto pr-1">
              <div className="p-5 rounded-2xl border shadow-inner transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                <div className="flex justify-between items-start border-b pb-3 mb-3 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      {activeTicket.organization_name}
                    </h3>
                    <p className="text-xs font-medium font-mono tracking-tight mt-0.5 transition-colors duration-300 text-slate-600 dark:text-slate-500">
                      TCKT-{activeTicket.id.toString().padStart(4, "0")} •{" "}
                      {activeTicket.subject}
                    </p>
                  </div>
                  {getStatusBadge(activeTicket.status)}
                </div>
                <div className="rounded-xl p-4 border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800/50">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                    Original Inquiry
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-slate-800 dark:text-slate-300">
                    {activeTicket.message}
                  </div>
                  <div className="text-xs font-medium mt-3 flex items-center gap-1.5 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                    <Clock className="h-3 w-3" />{" "}
                    {formatDate(activeTicket.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Chat Thread - FLEX GROW (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
              {activeTicket.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex flex-col animate-in fade-in duration-300 ${
                    reply.is_superadmin ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl max-w-[90%] sm:max-w-[80%] text-sm shadow-sm border transition-colors duration-300 ${
                      reply.is_superadmin
                        ? "bg-blue-50 text-blue-900 border-blue-200 rounded-tr-sm dark:bg-blue-600/20 dark:text-blue-100 dark:border-blue-500/30 dark:rounded-tl-none dark:rounded-tr-2xl"
                        : // Note: Added distinct corner radii below for visual flow
                          "bg-white text-slate-800 border-slate-200 rounded-tl-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700/50 dark:rounded-tr-none dark:rounded-tl-2xl"
                    }`}
                    style={{
                      borderTopRightRadius: reply.is_superadmin
                        ? "0.125rem"
                        : "1rem",
                      borderTopLeftRadius: !reply.is_superadmin
                        ? "0.125rem"
                        : "1rem",
                    }}
                  >
                    <p
                      className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 transition-colors duration-300 ${reply.is_superadmin ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {reply.is_superadmin ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5" />
                      )}
                      {reply.is_superadmin ? "Support Team" : reply.sender_name}
                    </p>
                    <span className="whitespace-pre-wrap">{reply.message}</span>
                  </div>
                  <span className="text-xs font-medium mt-1.5 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
              ))}
            </div>

            {/* 3. Reply Actions - PINNED BOTTOM */}
            <form
              onSubmit={handleReplySubmit}
              className="shrink-0 border-t pt-4 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="space-y-2 mb-4">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a response..."
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 resize-none shadow-sm dark:shadow-inner transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:ring-blue-500/30"
                  disabled={replyMutation.isPending}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <Select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full sm:w-40 transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  disabled={replyMutation.isPending}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </Select>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedTicketId(null)}
                    className="flex-1 sm:flex-none transition-colors duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 sm:flex-none font-bold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg dark:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-500"
                    disabled={replyMutation.isPending}
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Update"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
