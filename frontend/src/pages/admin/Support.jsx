import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  Inbox,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function Support() {
  const queryClient = useQueryClient();

  // --- UI Transition State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // automatically updates when React Query fetches new data in the background.
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // --- Form Payload State ---
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");

  // --- Query Pipeline: Fetch Tickets ---
  const {
    data: tickets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tenant-support-tickets"],
    queryFn: async () => {
      const res = await api.get("/tenant/support-tickets/");
      return res.data.results || res.data;
    },
  });

  // Derived state for the active modal
  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  // --- Mutation Pipeline: Create Ticket ---
  const createMutation = useMutation({
    mutationFn: async (payload) =>
      api.post("/tenant/support-tickets/", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-support-tickets"] });
      setIsCreateModalOpen(false);
      setSubject("");
      setMessage("");
      toast.success("Support ticket opened successfully.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to create ticket.");
    },
  });

  // --- Mutation Pipeline: Submit Reply ---
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/tenant/support-tickets/${selectedTicketId}/reply/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-support-tickets"] });
      setReplyText("");
      toast.success("Reply dispatched.", { icon: "📨" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to send reply.");
    },
  });

  // --- Action Handlers ---
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createMutation.mutate({ subject, message });
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate({ message: replyText });
  };

  // --- Formatters ---
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <LifeBuoy className="h-5 w-5 text-rose-500" />
            </div>
            Help & Support
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Contact the Bloodonate administration team for platform
            assistance.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-lg w-full sm:w-auto"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Open New Ticket
        </Button>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Ticket Identification</th>
                <th className="px-6 py-5">Current Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium text-slate-400 tracking-widest uppercase">
                      Fetching Tickets...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto text-rose-500 mb-4" />
                    <p className="text-slate-300 font-medium mb-4">
                      Failed to load support history.
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/50"
                      onClick={() => refetch()}
                    >
                      Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Inbox className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      No Active Tickets
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed text-sm">
                      You haven't opened any support requests. If you run into
                      issues, you can open a new ticket here.
                    </p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                          <Ticket className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm truncate max-w-50 sm:max-w-xs">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-1 font-semibold">
                            TCKT-{ticket.id.toString().padStart(4, "0")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Clock className="h-3.5 w-3.5" />
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
                        View Thread
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- CREATE TICKET MODAL --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open Support Ticket"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 flex items-start gap-3">
            <LifeBuoy className="h-5 w-5 shrink-0" />
            <p>
              Our SuperAdmin support team typically reviews and responds to
              incoming requests within 24 business hours.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Subject
            </label>
            <Input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="bg-slate-950/50 h-11"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Details
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your problem or request in detail..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all resize-none shadow-inner"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                createMutation.isPending || !subject.trim() || !message.trim()
              }
              className="shadow-lg min-w-32"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW TICKET & CHAT MODAL --- */}
      <Modal
        isOpen={!!activeTicket}
        onClose={() => setSelectedTicketId(null)}
        title={
          <div className="flex items-center gap-3">
            <span className="text-rose-500 font-mono text-sm bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
              TCKT-{activeTicket?.id.toString().padStart(4, "0")}
            </span>
            <span className="truncate max-w-50 sm:max-w-xs">
              {activeTicket?.subject}
            </span>
          </div>
        }
      >
        {activeTicket && (
          <div className="space-y-6 flex flex-col max-h-[75vh]">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner shrink-0">
              <span className="text-sm font-medium text-slate-300">
                Current Status
              </span>
              {getStatusBadge(activeTicket.status)}
            </div>

            {/* Chat History Container */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar min-h-75 p-2">
              {/* Original Message (User) */}
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-md leading-relaxed border border-slate-700/50">
                  {activeTicket.message}
                </div>
                <span className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />{" "}
                  {formatDate(activeTicket.created_at)}
                </span>
              </div>

              {/* Replies Thread */}
              {activeTicket.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex flex-col animate-in fade-in duration-300 ${reply.is_superadmin ? "items-start slide-in-from-left-4" : "items-end slide-in-from-right-4"}`}
                >
                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-md leading-relaxed border ${
                      reply.is_superadmin
                        ? "bg-rose-500/10 text-rose-100 border-rose-500/20 rounded-tl-sm"
                        : "bg-slate-800 text-slate-200 border-slate-700/50 rounded-tr-sm"
                    }`}
                  >
                    {reply.is_superadmin && (
                      <p className="text-xs font-bold text-rose-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5" /> Support Team
                      </p>
                    )}
                    {reply.message}
                  </div>
                  <span className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(reply.created_at)}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Input Area */}
            {activeTicket.status !== "RESOLVED" ? (
              <form
                onSubmit={handleReplySubmit}
                className="flex gap-3 pt-4 border-t border-slate-800/80 shrink-0"
              >
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="bg-slate-950 border-slate-700 h-12 focus:border-rose-500"
                  disabled={replyMutation.isPending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-12 w-12 p-0 shrink-0 shadow-lg"
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center flex justify-center items-center gap-2 font-medium shrink-0">
                <CheckCircle2 className="h-5 w-5" /> This ticket has been
                resolved and closed.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
