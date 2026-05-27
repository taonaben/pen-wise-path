import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FarmRole = "manager" | "worker";

type InvitePayload = {
  farmId?: string;
  fullName?: string;
  email?: string;
  role?: FarmRole;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase function environment is not configured" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: caller },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !caller) {
    return json({ error: "Invalid authenticated user" }, 401);
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const farmId = payload.farmId?.trim();
  const fullName = payload.fullName?.trim();
  const email = payload.email ? normalizeEmail(payload.email) : "";
  const role = payload.role;

  if (!farmId || !fullName || !email || !role) {
    return json({ error: "farmId, fullName, email, and role are required" }, 400);
  }

  if (!["manager", "worker"].includes(role)) {
    return json({ error: "Only manager and worker roles can be invited from this flow" }, 400);
  }

  const { data: isOwner, error: ownerError } = await callerClient.rpc("is_farm_owner", {
    target_farm_id: farmId,
  });

  if (ownerError) {
    return json({ error: ownerError.message }, 500);
  }

  if (!isOwner) {
    return json({ error: "Only farm owners can invite members" }, 403);
  }

  const siteUrl = Deno.env.get("SITE_URL");
  const redirectTo =
    Deno.env.get("INVITE_REDIRECT_URL") ?? (siteUrl ? `${siteUrl}/accept-invite` : undefined);

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
      data: {
        full_name: fullName,
        invited_farm_id: farmId,
        invited_role: role,
      },
    },
  );

  if (inviteError || !inviteData.user) {
    return json({ error: inviteError?.message ?? "Could not invite user" }, 400);
  }

  const invitedUserId = inviteData.user.id;

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: invitedUserId,
    full_name: fullName,
    email,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return json({ error: profileError.message }, 500);
  }

  const { data: membership, error: membershipError } = await adminClient
    .from("farm_members")
    .upsert(
      {
        farm_id: farmId,
        user_id: invitedUserId,
        role,
        status: "active",
        created_by: caller.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "farm_id,user_id" },
    )
    .select("id, farm_id, user_id, role, status")
    .single();

  if (membershipError) {
    return json({ error: membershipError.message }, 500);
  }

  await adminClient.from("audit_logs").insert({
    farm_id: farmId,
    user_id: caller.id,
    action: "MEMBER_INVITED",
    entity_type: "farm_member",
    entity_id: membership.id,
    description: `Invited ${fullName} as ${role}`,
    metadata: {
      email,
      role,
      invited_user_id: invitedUserId,
    },
  });

  return json({
    member: membership,
    invitedUser: {
      id: invitedUserId,
      email,
      fullName,
    },
  });
});
