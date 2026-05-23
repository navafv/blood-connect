import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Search,
  Loader2,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function SupportTickets() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [updateStatus, setUpdateStatus] = useState("IN_PROGRESS");

  // Fetch Tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["superadmin-tenant-tickets"],
    queryFn: async () => {
      const res = await api.get("/superadmin/support-tickets/");
      return res.data.results || res.data;
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(
        `/superadmin/support-tickets/${selectedTicket.id}/reply/`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-tenant-tickets"]);
      setSelectedTicket(null);
      setReplyText("");
    },
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
    replyMutation.mutate({ message: replyText, status: updateStatus });
  };

  const filteredTickets = tickets.filter(
    (t) =>
      (statusFilter === "ALL" || t.status === statusFilter) &&
      (t.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())),
  );

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-rose-500" /> Tenant Support Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage and resolve tickets submitted by registered hospitals.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search organization or subject..."
            className="pl-10 bg-slate-950 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border-slate-700 w-full sm:w-48"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      {/* Ticket Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
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
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No tickets match your filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">
                        {ticket.organization_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.created_by_name}
                      </p>
                    </td>
                    <td className="px-6 py-4 truncate max-w-50">
                      {ticket.subject}
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
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setUpdateStatus(ticket.status);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Resolve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- REPLY MODAL --- */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Manage Tenant Ticket"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                <div>
                  <h3 className="text-white font-medium">
                    {selectedTicket.organization_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    TCKT-{selectedTicket.id.toString().padStart(4, "0")} •{" "}
                    {selectedTicket.subject}
                  </p>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>

              {/* Chat Thread */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col items-start">
                  <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm">
                    {selectedTicket.message}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {formatDate(selectedTicket.created_at)}
                  </span>
                </div>

                {selectedTicket.replies?.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex flex-col ${reply.is_superadmin ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-sm ${reply.is_superadmin ? "bg-rose-500/20 text-rose-100 border border-rose-500/30 rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm"}`}
                    >
                      {!reply.is_superadmin && (
                        <p className="text-xs font-bold text-slate-400 mb-1">
                          {reply.sender_name}
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
            </div>

            <form
              onSubmit={handleReplySubmit}
              className="space-y-4 pt-4 border-t border-slate-800"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Your Reply
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a response to the hospital..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Set Status:</label>
                  <Select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="bg-slate-950 border-slate-700 py-1.5 h-auto text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      replyMutation.isPending ||
                      (!replyText.trim() &&
                        updateStatus === selectedTicket.status)
                    }
                  >
                    {replyMutation.isPending ? "Updating..." : "Update Ticket"}
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
