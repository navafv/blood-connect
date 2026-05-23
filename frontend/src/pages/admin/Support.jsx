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
} from "lucide-react";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Forms
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");

  // 1. Fetch Tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tenant-support-tickets"],
    queryFn: async () => {
      const res = await api.get("/tenant/support-tickets/");
      return res.data.results || res.data;
    },
  });

  // 2. Create Ticket Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) =>
      api.post("/tenant/support-tickets/", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-support-tickets"]);
      setIsCreateModalOpen(false);
      setSubject("");
      setMessage("");
    },
  });

  // 3. Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/tenant/support-tickets/${selectedTicket.id}/reply/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-support-tickets"]);
      setReplyText("");
      // Update local state to show the reply immediately (or rely on a background refetch)
      setSelectedTicket(null); // Close modal on success for simplicity, or refetch
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ subject, message });
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate({ message: replyText });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="warning" className="bg-amber-500/10 text-amber-400">
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="primary" className="bg-blue-500/10 text-blue-400">
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="success"
            className="bg-emerald-500/10 text-emerald-400"
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-rose-500" /> Help & Support
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Contact the BloodConnect administration team for assistance.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" /> Open New Ticket
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Ticket ID & Subject</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />{" "}
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{ticket.subject}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        TCKT-{ticket.id.toString().padStart(4, "0")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3" />{" "}
                        {formatDate(ticket.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-slate-950/50 hover:bg-slate-800"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> View Thread
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
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Subject
            </label>
            <Input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="bg-slate-950"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Details
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your problem in detail..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW TICKET & CHAT MODAL --- */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject || "Ticket Details"}
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-sm text-slate-400 font-mono">
                TCKT-{selectedTicket.id.toString().padStart(4, "0")}
              </span>
              {getStatusBadge(selectedTicket.status)}
            </div>

            {/* Chat History */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {/* Original Message */}
              <div className="flex flex-col items-end">
                <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm">
                  {selectedTicket.message}
                </div>
                <span className="text-xs text-slate-500 mt-1">
                  {formatDate(selectedTicket.created_at)}
                </span>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex flex-col ${reply.is_superadmin ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-sm ${reply.is_superadmin ? "bg-rose-500/20 text-rose-100 border border-rose-500/30 rounded-tl-sm" : "bg-slate-800 text-slate-200 rounded-tr-sm"}`}
                  >
                    {reply.is_superadmin && (
                      <p className="text-xs font-bold text-rose-400 mb-1">
                        Support Team
                      </p>
                    )}
                    {reply.message}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== "RESOLVED" ? (
              <form
                onSubmit={handleReplySubmit}
                className="flex gap-2 pt-4 border-t border-slate-800"
              >
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="bg-slate-950"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center flex justify-center items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> This ticket has been
                resolved.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
