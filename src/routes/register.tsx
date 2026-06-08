import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { theme } from "@/shared/config/theme";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="min-h-screen bg-farm-950 px-6 py-12 text-foreground">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(183,243,74,0.08),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.06),transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-farm-lime/15 text-farm-lime">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">{theme.appName}</div>
              <div className="text-sm text-farm-muted">{theme.tagline}</div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-farm-lime">Onboarding</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Set up your account and start managing your farm.
            </h1>
            <p className="max-w-lg text-base text-farm-muted">
              Create your login, verify your email, and move into profile and farm setup without
              leaving the flow.
            </p>
          </div>
        </section>

        <div className="w-full max-w-md">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
