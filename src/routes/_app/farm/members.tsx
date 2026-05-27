import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/farm/members")({
  component: FarmMembersPage,
});

const members = [
  { name: "Tendai Moyo", email: "tendai@greenvalley.farm", role: "Owner", status: "Active", last: "2 min ago" },
  { name: "Rumbi Chigodora", email: "rumbi@greenvalley.farm", role: "Manager", status: "Active", last: "1 hr ago" },
  { name: "Farai Banda", email: "farai@greenvalley.farm", role: "Worker", status: "Active", last: "Yesterday" },
  { name: "Kuda Nyathi", email: "kuda@greenvalley.farm", role: "Worker", status: "Inactive", last: "3 weeks ago" },
];

function FarmMembersPage() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Farm Members"
        description="Invite and manage the people working on this farm."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full bg-farm-lime text-farm-950 font-semibold text-sm px-4 py-2 hover:bg-farm-limeSoft transition">
                <UserPlus className="h-4 w-4" /> Add Farm Member
              </button>
            </DialogTrigger>
            <DialogContent className="bg-farm-900 border">
              <DialogHeader>
                <DialogTitle>Add Farm Member</DialogTitle>
                <DialogDescription>
                  User creation will be connected to Supabase Admin / Edge Function later. Public
                  signup is intentionally disabled.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl border bg-farm-800/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Last Active</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3 font-medium">{m.name}</td>
                <td className="px-5 py-3 text-farm-muted">{m.email}</td>
                <td className="px-5 py-3">{m.role}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={m.status} variant={m.status === "Active" ? "success" : "default"} />
                </td>
                <td className="px-5 py-3 text-farm-muted">{m.last}</td>
                <td className="px-5 py-3 text-right text-farm-muted">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
