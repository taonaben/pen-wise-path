import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authService } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profileService";
import { profileSchema } from "@/schemas/auth";

type FieldErrors = Partial<Record<"firstName" | "lastName", string>>;

const initialValues = {
  firstName: "",
  lastName: "",
};

export function ProfileSetupForm() {
  const navigate = useNavigate();
  const [values, setValues] = React.useState(initialValues);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateValue =
    (field: keyof typeof initialValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setGeneralError(null);
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    try {
      const parsed = profileSchema.safeParse(values);

      if (!parsed.success) {
        const flattened = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          firstName: flattened.firstName?.[0],
          lastName: flattened.lastName?.[0],
        });
        setGeneralError("Please fix the highlighted fields.");
        toast.error("Check the form for errors");
        return;
      }

      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Please sign in again to finish setup.");
      }

      await profileService.createProfile(user.id, parsed.data);
      toast.success("Profile saved");
      await navigate({ to: "/farm-setup" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile setup failed";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-farm-800/80 bg-farm-900/80 text-foreground shadow-2xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-farm-lime">
          Step 1 of 2
        </div>
        <CardTitle className="text-2xl tracking-tight">Tell us who you are</CardTitle>
        <CardDescription className="text-farm-muted">
          Add your name so the app can personalize your account and audit trail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="John"
              value={values.firstName}
              onChange={updateValue("firstName")}
            />
            {fieldErrors.firstName ? (
              <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Doe"
              value={values.lastName}
              onChange={updateValue("lastName")}
            />
            {fieldErrors.lastName ? (
              <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
            ) : null}
          </div>

          {generalError ? <p className="text-sm text-destructive">{generalError}</p> : null}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving profile…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
