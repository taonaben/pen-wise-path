import { createFileRoute } from "@tanstack/react-router";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { Eye, MoreHorizontal, RotateCcw, ShieldCheck, Trash2, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { StatCard } from "@/shared/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmMemberActions, useFarmMembers } from "@/features/farm/hooks/useFarmMembers";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";
import type { FarmRole } from "@/features/farm/types/farm.types";

export const Route = createFileRoute("/_app/farm/members")({
  component: FarmMembersPage,
});

function formatWhen(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  const now = new Date();
  const minutes = Math.max(0, differenceInMinutes(now, date));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} hr ago`;

  const days = differenceInDays(now, date);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function FarmMembersPage() {
  const [open, setOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    role: "worker" as Exclude<FarmRole, "owner">,
  });
  const { currentFarm, currentRole, currentUser } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const membersQuery = useFarmMembers({
    farmId: currentFarm.id,
    currentRole,
    currentUserId: currentUser.id,
  });
  const actions = useFarmMemberActions(currentFarm.id);

  const members = membersQuery.data ?? [];
  const stats = {
    total: members.length,
    active: members.filter((member) => member.status === "active").length,
    managers: members.filter((member) => member.role === "manager").length,
    workers: members.filter((member) => member.role === "worker").length,
    inactive: members.filter((member) => member.status === "inactive").length,
  };

  const onRoleChange = async (memberId: string, role: FarmRole) => {
    try {
      await actions.updateRole.mutateAsync({ memberId, role });
      toast.success("Member role updated");
    } catch {
      toast.error("Could not update member role");
    }
  };

  const onDeactivate = async (memberId: string) => {
    try {
      await actions.deactivate.mutateAsync(memberId);
      toast.success("Member deactivated");
    } catch {
      toast.error("Could not deactivate member");
    }
  };

  const onReactivate = async (memberId: string) => {
    try {
      await actions.activate.mutateAsync(memberId);
      toast.success("Member reactivated");
    } catch {
      toast.error("Could not reactivate member");
    }
  };

  const onRemove = async (memberId: string) => {
    const confirmed = window.confirm("Remove this member from the farm?");
    if (!confirmed) return;

    try {
      await actions.remove.mutateAsync(memberId);
      toast.success("Member removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove member";
      toast.error(message);
    }
  };

  const onInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await actions.invite.mutateAsync({
        farmId: currentFarm.id,
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        role: inviteForm.role,
      });
      toast.success("Invite email sent");
      setInviteForm({ fullName: "", email: "", role: "worker" });
      setOpen(false);
    } catch {
      toast.error("Could not send invite");
    }
  };

  return (
    <div>
      <PageHeader
        title="Farm Members"
        description="Manage users, roles, and access for this farm."
        action={
          can("manageMembers") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-farm-lime text-farm-950 hover:bg-farm-limeSoft">
                  <UserPlus className="h-4 w-4" /> Add Farm Member
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-farm-900 border">
                <DialogHeader>
                  <DialogTitle>Add Farm Member</DialogTitle>
                  <DialogDescription>
                    The invitee will receive an email, accept the invite, verify their address, and
                    set their password through Supabase Auth.
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 py-2" onSubmit={onInvite}>
                  <div className="grid gap-2">
                    <Label htmlFor="member-name">Full name</Label>
                    <Input
                      id="member-name"
                      value={inviteForm.fullName}
                      onChange={(event) =>
                        setInviteForm((form) => ({ ...form, fullName: event.target.value }))
                      }
                      placeholder="Tendai Moyo"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      value={inviteForm.email}
                      onChange={(event) =>
                        setInviteForm((form) => ({ ...form, email: event.target.value }))
                      }
                      type="email"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-role">Role</Label>
                    <select
                      id="member-role"
                      className="h-9 rounded-md border bg-farm-800 px-3 text-sm"
                      value={inviteForm.role}
                      onChange={(event) =>
                        setInviteForm((form) => ({
                          ...form,
                          role: event.target.value as Exclude<FarmRole, "owner">,
                        }))
                      }
                    >
                      <option value="manager">Manager</option>
                      <option value="worker">Worker</option>
                    </select>
                  </div>
                  <Button className="mt-2" disabled={actions.invite.isPending}>
                    {actions.invite.isPending ? "Sending invite..." : "Invite member"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Members" value={String(stats.total)} />
        <StatCard title="Active Members" value={String(stats.active)} variant="success" />
        <StatCard title="Managers" value={String(stats.managers)} />
        <StatCard title="Workers" value={String(stats.workers)} />
        <StatCard title="Inactive Members" value={String(stats.inactive)} variant="warning" />
      </div>

      <div className="rounded-2xl border bg-farm-800/80 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Joined</th>
              <th className="text-left px-5 py-3 font-medium">Last Active</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {membersQuery.isLoading && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-muted" colSpan={7}>
                  Loading farm members...
                </td>
              </tr>
            )}
            {membersQuery.isError && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-danger" colSpan={7}>
                  Could not load farm members.
                </td>
              </tr>
            )}
            {!membersQuery.isLoading && members.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-muted" colSpan={7}>
                  No farm members found.
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3 font-medium">
                  {member.name}
                  {member.isCurrentUser && (
                    <span className="ml-2 rounded-full bg-farm-lime/10 px-2 py-0.5 text-[10px] text-farm-lime">
                      You
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-farm-muted">{member.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={member.role}
                    disabled={!member.canEditRole || actions.updateRole.isPending}
                    onChange={(event) => onRoleChange(member.id, event.target.value as FarmRole)}
                    className="h-8 rounded-md border bg-farm-900 px-2 text-xs capitalize disabled:opacity-60"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="worker">Worker</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge
                    status={member.status}
                    variant={member.status === "active" ? "success" : "default"}
                  />
                </td>
                <td className="px-5 py-3 text-farm-muted">{formatWhen(member.joinedAt)}</td>
                <td className="px-5 py-3 text-farm-muted">{formatWhen(member.lastActiveAt)}</td>
                <td className="px-5 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8"
                        title="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-farm-900">
                      <DropdownMenuItem disabled>
                        <Eye className="h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      {member.status === "active" ? (
                        <DropdownMenuItem
                          disabled={!member.canDeactivate || actions.deactivate.isPending}
                          onClick={() => onDeactivate(member.id)}
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={!member.canReactivate || actions.activate.isPending}
                          onClick={() => onReactivate(member.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem disabled>
                        <ShieldCheck className="h-4 w-4" />
                        Reset access
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!member.canRemove || actions.remove.isPending}
                        onClick={() => onRemove(member.id)}
                        className="text-farm-danger focus:text-farm-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
