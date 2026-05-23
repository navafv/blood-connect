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
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function ManageMessages() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Fetch Messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["superadmin-messages"],
    queryFn: async () => {
      const res = await api.get("/superadmin/messages/");
      return res.data.results || res.data;
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/superadmin/messages/${selectedMessage.id}/reply/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-messages"]);
      closeModal();
    },
  });

  // Toggle Resolution Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/messages/${id}/toggle/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-messages"]),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/messages/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-messages"]),
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-rose-500" /> Public Support Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, reply to, and resolve messages from the Contact Us form.
          </p>
        </div>
      </div>

      {/* Messages Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Sender</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Received</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />{" "}
                    Loading inbox...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Inbox is empty.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-slate-800/30 transition-colors ${!msg.is_resolved ? "bg-slate-800/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className={`font-medium ${!msg.is_resolved ? "text-white" : "text-slate-300"}`}
                        >
                          {msg.name}
                        </p>
                        <p className="text-xs text-slate-500">{msg.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className={`truncate max-w-xs ${!msg.is_resolved ? "text-slate-200 font-medium" : "text-slate-400"}`}
                      >
                        {msg.subject}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />{" "}
                        {formatDate(msg.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {msg.is_resolved ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          Needs Reply
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View / Reply */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Read & Reply"
                          aria-label={`Read message from ${msg.name}`}
                          className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
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
                          size="icon"
                          title={
                            msg.is_resolved
                              ? "Mark Unresolved"
                              : "Mark Resolved"
                          }
                          aria-label="Toggle resolved status"
                          className={`h-8 w-8 ${msg.is_resolved ? "text-slate-500 hover:text-white" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                          onClick={() => toggleMutation.mutate(msg.id)}
                          disabled={toggleMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Message"
                          aria-label="Delete message"
                          className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => {
                            if (
                              window.confirm("Delete this message permanently?")
                            )
                              deleteMutation.mutate(msg.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
        title="Support Ticket"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Original Message Display */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <p className="text-white font-medium">
                    {selectedMessage.name}
                  </p>
                  <p className="text-sm text-slate-400 font-mono">
                    {selectedMessage.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      selectedMessage.is_resolved ? "default" : "warning"
                    }
                  >
                    {selectedMessage.is_resolved ? "Resolved" : "Open"}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-1">
                  Subject: {selectedMessage.subject}
                </p>
                <div className="text-sm text-slate-400 whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800/50">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Email Reply Form */}
            <form onSubmit={handleReplySubmit} className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Reply className="h-4 w-4" /> Send Email Reply
              </label>
              <textarea
                required
                rows={5}
                placeholder="Type your response here. This will be sent directly to their email address..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : (
                    "Send Reply & Resolve"
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
