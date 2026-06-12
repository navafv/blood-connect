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
      queryClient.invalidateQueries({ queryKey: ["superadmin-messages"] });
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
      queryClient.invalidateQueries({ queryKey: ["superadmin-messages"] });
      toast.success("Ticket status updated.");
    },
    onError: () => toast.error("Failed to modify ticket status."),
  });

  // --- Mutation Pipeline: Delete Message ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/messages/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-messages"] });
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Mail className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Public Support Inbox
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage, reply to, and resolve inquiries from the public Contact Us
            portal.
          </p>
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Sender Identity</th>
                <th className="px-6 py-5">Subject Line</th>
                <th className="px-6 py-5">Received</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
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
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                      <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Telemetry Failure
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm mb-6 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Unable to retrieve messages from the central database.
                    </p>
                    <Button
                      variant="outline"
                      className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <Inbox className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Inbox Empty
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      You are all caught up! There are no public inquiries at
                      this time.
                    </p>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                      !msg.is_resolved
                        ? "bg-slate-100 dark:bg-slate-800/10"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-inner shrink-0 border transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300 dark:group-hover:bg-slate-800">
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className={`font-bold text-sm transition-colors duration-300 ${
                              !msg.is_resolved
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {msg.name}
                          </p>
                          <p className="text-xs font-medium font-mono mt-0.5 tracking-tight transition-colors duration-300 text-slate-500 dark:text-slate-500">
                            {msg.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p
                        className={`truncate max-w-[200px] sm:max-w-xs transition-colors duration-300 ${
                          !msg.is_resolved
                            ? "text-slate-900 font-bold dark:text-slate-200"
                            : "text-slate-600 font-medium dark:text-slate-400"
                        }`}
                      >
                        {msg.subject}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                        {formatDate(msg.created_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {msg.is_resolved ? (
                        <Badge
                          variant="success"
                          className="px-2.5 py-1 transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="px-2.5 py-1 transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
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
                          className="h-8 w-8 p-0 transition-colors duration-300 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
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
                          className={`h-8 w-8 p-0 transition-colors duration-300 ${
                            msg.is_resolved
                              ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800"
                              : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          }`}
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
                          className="h-8 w-8 p-0 transition-colors duration-300 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 disabled:opacity-50"
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
            <div className="border rounded-2xl p-5 space-y-5 shadow-inner relative overflow-hidden transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
              <div
                className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${
                  selectedMessage.is_resolved
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              <div className="flex justify-between items-start border-b pb-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                <div>
                  <p className="font-bold text-lg tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                    {selectedMessage.name}
                  </p>
                  <p className="text-sm font-medium font-mono tracking-tight mt-0.5 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    {selectedMessage.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      selectedMessage.is_resolved ? "success" : "warning"
                    }
                    className={`transition-colors duration-300 ${
                      selectedMessage.is_resolved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                    }`}
                  >
                    {selectedMessage.is_resolved ? "Resolved" : "Open Ticket"}
                  </Badge>
                  <p className="text-xs font-medium mt-2.5 flex items-center gap-1.5 justify-end transition-colors duration-300 text-slate-500 dark:text-slate-500">
                    <Clock className="h-3 w-3" />{" "}
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                  Subject:{" "}
                  <span className="normal-case tracking-normal transition-colors duration-300 text-slate-900 dark:text-slate-200">
                    {selectedMessage.subject}
                  </span>
                </p>
                <div className="text-sm whitespace-pre-wrap p-4 rounded-xl border shadow-sm leading-relaxed transition-colors duration-300 bg-white border-slate-200 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Email Reply Form */}
            <form onSubmit={handleReplySubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                  <Reply className="h-4 w-4 transition-colors duration-300 text-blue-600 dark:text-blue-400" />{" "}
                  Dispatch Response
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Draft your response here. This payload will be routed directly to their inbox..."
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none shadow-sm dark:shadow-inner bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={replyMutation.isPending}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="transition-colors duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  disabled={replyMutation.isPending}
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="shadow-md font-bold min-w-[192px] transition-colors duration-300 bg-blue-600 hover:bg-blue-700 text-white dark:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-500"
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
