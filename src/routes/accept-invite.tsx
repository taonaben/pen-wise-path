import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/shared/lib/supabase";

export const Route = createFileRoute("/accept-invite")({
  component: AcceptInvitePage,
});

type InviteState = "loading" | "ready" | "missing-session" | "complete";

function AcceptInvitePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<InviteState>("loading");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      const user = data.session?.user;
      if (!user) {
        setState("missing-session");
        return;
      }

      setEmail(user.email ?? "");
      setFullName(String(user.user_metadata?.full_name ?? ""));
      setState("ready");
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName },
      });

      if (updateError) throw updateError;

      const user = userData.user;
      if (user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          email: user.email ?? email,
          updated_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;
      }

      setState("complete");
      toast.success("Profile setup complete");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Could not complete invite setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-farm-950 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-farm-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-lime/15 text-farm-lime">
            {state === "complete" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <KeyRound className="h-5 w-5" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold">Accept farm invite</h1>
            <p className="text-sm text-farm-muted">Set your profile and password.</p>
          </div>
        </div>

        {state === "loading" && (
          <p className="text-sm text-farm-muted">Checking invite session...</p>
        )}

        {state === "missing-session" && (
          <div className="space-y-3 text-sm text-farm-muted">
            <p>
              This invite link is no longer active in this browser. Open the latest invite email
              again, or ask the farm owner to send a new invite.
            </p>
            <Button variant="outline" onClick={() => navigate({ to: "/login" })}>
              Go to login
            </Button>
          </div>
        )}

        {state === "ready" && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" value={email} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invite-password">Password</Label>
              <Input
                id="invite-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invite-confirm-password">Confirm password</Label>
              <Input
                id="invite-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Completing setup..." : "Complete setup"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
