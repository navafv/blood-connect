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
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

/**
 * SuperAdmin Tenant Support Queue
 * Centralized helpdesk for managing, replying to, and resolving tickets
 * submitted by registered organizations. Features live-syncing chat modals.
 */
export default function SupportTickets() {
  const queryClient = useQueryClient();

  // --- UI & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // 🛡️ THE FIX: Track ID instead of object so the modal live-updates on refetch
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
      queryClient.invalidateQueries(["superadmin-tenant-tickets"]);
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
            className="bg-amber-500/10 text-amber-400 border-amber-500/20"
          >
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="primary"
            className="bg-blue-500/10 text-blue-400 border-blue-500/20"
          >
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="success"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            Resolved
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <LifeBuoy className="h-5 w-5 text-rose-500" />
            </div>
            Tenant Support Queue
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Manage, triage, and resolve helpdesk tickets submitted by registered
            facilities.
          </p>
        </div>
      </div>

      {/* --- Search & Filter Toolbar --- */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="relative w-full flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Search by facility name or ticket subject..."
            className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950/50 border-slate-700 h-11 w-full sm:w-56 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open (Awaiting Triage)</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Tenant Organization</th>
                <th className="px-6 py-5">Subject Line</th>
                <th className="px-6 py-5">Current Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
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
                    <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ServerCrash className="h-10 w-10 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Telemetry Failure
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm mb-6">
                      Unable to retrieve support tickets from the central
                      database.
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/50"
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
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Inbox className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Queue Empty
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
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
                    <SearchX className="h-12 w-12 text-slate-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      No Matches Found
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      No tickets match your search parameters or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner group-hover:bg-slate-800 transition-colors shrink-0">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {ticket.organization_name}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 tracking-tight">
                            Requested by: {ticket.created_by_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="truncate max-w-50 sm:max-w-xs text-slate-200 font-medium">
                        {ticket.subject}
                      </p>
                      <p className="text-xs font-medium text-slate-500 font-mono mt-1 tracking-tight">
                        TCKT-{ticket.id.toString().padStart(4, "0")}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {formatDate(ticket.updated_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-white transition-colors"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />{" "}
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
          <div className="space-y-6 flex flex-col max-h-[80vh]">
            {/* Header / Context */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner shrink-0">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg tracking-tight">
                    {activeTicket.organization_name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 font-mono tracking-tight mt-0.5">
                    TCKT-{activeTicket.id.toString().padStart(4, "0")} •{" "}
                    {activeTicket.subject}
                  </p>
                </div>
                {getStatusBadge(activeTicket.status)}
              </div>

              {/* Original Query (Simulated as first message) */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Original Inquiry
                </p>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeTicket.message}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />{" "}
                  {formatDate(activeTicket.created_at)}
                </div>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar min-h-62.5 p-2">
              {activeTicket.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex flex-col animate-in fade-in duration-300 ${reply.is_superadmin ? "items-end slide-in-from-right-4" : "items-start slide-in-from-left-4"}`}
                >
                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-md leading-relaxed border ${
                      reply.is_superadmin
                        ? "bg-blue-600/20 text-blue-100 border-blue-500/30 rounded-tr-sm"
                        : "bg-slate-800 text-slate-200 border-slate-700/50 rounded-tl-sm"
                    }`}
                  >
                    {reply.is_superadmin ? (
                      <p className="text-xs font-bold text-blue-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5" /> Support Team
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />{" "}
                        {reply.sender_name}
                      </p>
                    )}
                    <span className="whitespace-pre-wrap">{reply.message}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(reply.created_at)}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Actions */}
            <form
              onSubmit={handleReplySubmit}
              className="space-y-4 pt-4 border-t border-slate-800/80 shrink-0"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Compose Response
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a response to the tenant organization..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all resize-none shadow-inner"
                  disabled={replyMutation.isPending}
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800 w-full sm:w-auto">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-2">
                    Ticket Status:
                  </label>
                  <Select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="bg-slate-900 border-slate-700 py-1.5 h-auto text-sm w-full sm:w-40 focus:border-blue-500"
                    disabled={replyMutation.isPending}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </Select>
                </div>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedTicketId(null);
                      setReplyText("");
                    }}
                    disabled={replyMutation.isPending}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-500 shadow-lg font-bold min-w-32"
                    disabled={
                      replyMutation.isPending ||
                      (!replyText.trim() &&
                        updateStatus === activeTicket.status)
                    }
                  >
                    {replyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Submit Update
                      </>
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
