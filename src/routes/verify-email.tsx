import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyEmailSearch = {
  email?: string;
};

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const search = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center bg-farm-950 p-6">
      <Card className="w-full max-w-lg border-farm-800/80 bg-farm-900/80 text-foreground shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">Check your inbox</CardTitle>
          <CardDescription className="text-farm-muted">
            We sent a verification email{search.email ? ` to ${search.email}` : ""}. Use the link
            there to continue onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-farm-muted">
            If it does not arrive in a few minutes, check spam or return to registration.
          </p>
          <div className="flex gap-3">
            <Button asChild className="rounded-full">
              <Link to="/login">Back to login</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/register">Create another account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
