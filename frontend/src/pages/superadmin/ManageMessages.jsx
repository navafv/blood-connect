import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  MailOpen,
  Reply,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Inbox,
  ServerCrash,
  RefreshCw,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

/**
 * SuperAdmin Public Support Inbox
 * Centralized dashboard for managing, replying to, and resolving messages
 * submitted via the public "Contact Us" form.
 */
export default function ManageMessages() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");

  // --- Query Pipeline: Fetch Inbox ---
  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["superadmin-messages"],
    queryFn: async () => {
      const res = await api.get("/superadmin/messages/");
      return res.data.results || res.data;
    },
  });

  // --- Mutation Pipeline: Send Reply ---
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/superadmin/messages/${selectedMessage.id}/reply/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-messages"]);
      closeModal();
      toast.success("Reply dispatched successfully.", { icon: "📨" });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          "Failed to dispatch reply. Verify email configuration.",
      );
    },
  });

  // --- Mutation Pipeline: Toggle Resolution ---
  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/messages/${id}/toggle/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-messages"]);
      toast.success("Ticket status updated.");
    },
    onError: () => toast.error("Failed to modify ticket status."),
  });

  // --- Mutation Pipeline: Delete Message ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/messages/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-messages"]);
      toast.success("Message deleted permanently.");
    },
    onError: () => toast.error("Failed to delete message."),
  });

  // --- Action Handlers ---
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate({ reply_text: replyText });
  };

  const closeModal = () => {
    setSelectedMessage(null);
    setReplyText("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Mail className="h-5 w-5 text-rose-500" />
            </div>
            Public Support Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Manage, reply to, and resolve inquiries from the public Contact Us
            portal.
          </p>
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Sender Identity</th>
                <th className="px-6 py-5">Subject Line</th>
                <th className="px-6 py-5">Received</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
                      Loading Inbox...
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
                      Unable to retrieve messages from the central database.
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
              ) : messages.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Inbox className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Inbox Empty
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
                      You are all caught up! There are no public inquiries at
                      this time.
                    </p>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-slate-800/30 transition-colors group ${!msg.is_resolved ? "bg-slate-800/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner group-hover:bg-slate-800 transition-colors shrink-0">
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className={`font-bold text-sm ${!msg.is_resolved ? "text-white" : "text-slate-300"}`}
                          >
                            {msg.name}
                          </p>
                          <p className="text-xs font-medium text-slate-500 font-mono mt-0.5 tracking-tight">
                            {msg.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p
                        className={`truncate max-w-xs ${!msg.is_resolved ? "text-slate-200 font-bold" : "text-slate-400 font-medium"}`}
                      >
                        {msg.subject}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {formatDate(msg.created_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {msg.is_resolved ? (
                        <Badge
                          variant="success"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-2.5 py-1"
                        >
                          Needs Reply
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Read & Reply */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Read & Reply"
                          aria-label={`Read message from ${msg.name}`}
                          className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/10 transition-colors"
                          onClick={() => setSelectedMessage(msg)}
                        >
                          {msg.is_resolved ? (
                            <MailOpen className="h-4 w-4" />
                          ) : (
                            <Reply className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Toggle Status */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title={
                            msg.is_resolved
                              ? "Mark Unresolved"
                              : "Mark Resolved"
                          }
                          aria-label="Toggle resolved status"
                          className={`h-8 w-8 p-0 transition-colors ${msg.is_resolved ? "text-slate-500 hover:text-white" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                          onClick={() => toggleMutation.mutate(msg.id)}
                          disabled={
                            toggleMutation.isPending &&
                            toggleMutation.variables === msg.id
                          }
                        >
                          {toggleMutation.isPending &&
                          toggleMutation.variables === msg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Message"
                          aria-label="Delete message"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Permanently delete this inquiry from the database?",
                              )
                            ) {
                              deleteMutation.mutate(msg.id);
                            }
                          }}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === msg.id
                          }
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === msg.id ? (
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

      {/* --- READ & REPLY MODAL --- */}
      <Modal
        isOpen={!!selectedMessage}
        onClose={closeModal}
        title="Support Inquiry"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Original Message Display */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-inner relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 w-1 h-full ${selectedMessage.is_resolved ? "bg-emerald-500" : "bg-amber-500"}`}
              />

              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <p className="text-white font-bold text-lg tracking-tight">
                    {selectedMessage.name}
                  </p>
                  <p className="text-sm font-medium text-slate-400 font-mono tracking-tight mt-0.5">
                    {selectedMessage.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      selectedMessage.is_resolved ? "success" : "warning"
                    }
                    className={
                      selectedMessage.is_resolved
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }
                  >
                    {selectedMessage.is_resolved ? "Resolved" : "Open Ticket"}
                  </Badge>
                  <p className="text-xs font-medium text-slate-500 mt-2.5 flex items-center gap-1.5 justify-end">
                    <Clock className="h-3 w-3" />{" "}
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Subject:{" "}
                  <span className="text-slate-200 normal-case tracking-normal">
                    {selectedMessage.subject}
                  </span>
                </p>
                <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Email Reply Form */}
            <form onSubmit={handleReplySubmit} className="space-y-5">
              {/* Developer Environment Alert */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Developer Notice
                  </p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  If SMTP routing is suppressed in your local environment, the
                  reply payload will be printed to your{" "}
                  <strong className="text-slate-300">
                    Django terminal stdout
                  </strong>{" "}
                  instead of being emailed.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Reply className="h-4 w-4 text-blue-400" /> Dispatch Response
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Draft your response here. This payload will be routed directly to their inbox..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all resize-none shadow-inner"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={replyMutation.isPending}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white"
                  disabled={replyMutation.isPending}
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-500 shadow-lg font-bold min-w-48"
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Transmitting...
                    </>
                  ) : (
                    "Send Reply & Mark Resolved"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
