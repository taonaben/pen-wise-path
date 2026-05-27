import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberService } from "../services/memberService";
import type { FarmRole } from "../types/farm.types";

export const farmMemberKeys = {
  all: ["farm-members"] as const,
  list: (farmId: string) => [...farmMemberKeys.all, farmId] as const,
};

export function useFarmMembers(args: {
  farmId: string | undefined;
  currentRole: FarmRole | undefined;
  currentUserId: string | undefined;
}) {
  return useQuery({
    queryKey: args.farmId ? farmMemberKeys.list(args.farmId) : farmMemberKeys.all,
    queryFn: () =>
      memberService.getFarmMembers({
        farmId: args.farmId!,
        currentRole: args.currentRole ?? "worker",
        currentUserId: args.currentUserId,
      }),
    enabled: Boolean(args.farmId && args.currentRole && args.currentUserId),
  });
}

export function useFarmMemberActions(farmId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (farmId) await queryClient.invalidateQueries({ queryKey: farmMemberKeys.list(farmId) });
    await queryClient.invalidateQueries({ queryKey: ["audit-logs", farmId] });
  };

  return {
    invite: useMutation({
      mutationFn: (payload: {
        farmId: string;
        fullName: string;
        email: string;
        role: Exclude<FarmRole, "owner">;
      }) => memberService.inviteFarmMember(payload),
      onSuccess: invalidate,
    }),
    updateRole: useMutation({
      mutationFn: ({ memberId, role }: { memberId: string; role: FarmRole }) =>
        memberService.updateFarmMemberRole(memberId, role),
      onSuccess: invalidate,
    }),
    deactivate: useMutation({
      mutationFn: (memberId: string) => memberService.deactivateFarmMember(memberId),
      onSuccess: invalidate,
    }),
    activate: useMutation({
      mutationFn: (memberId: string) => memberService.activateFarmMember(memberId),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (memberId: string) => memberService.removeFarmMember(memberId),
      onSuccess: invalidate,
    }),
  };
}
