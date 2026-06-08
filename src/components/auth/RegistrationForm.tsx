import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authService } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrationSchema } from "@/schemas/auth";

type FieldName = "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

const initialValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegistrationForm() {
  const navigate = useNavigate();
  const [values, setValues] = React.useState(initialValues);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateValue = (field: FieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const parsed = registrationSchema.safeParse(values);

      if (!parsed.success) {
        const flattened = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          email: flattened.email?.[0],
          password: flattened.password?.[0],
          confirmPassword: flattened.confirmPassword?.[0],
        });
        setGeneralError("Please fix the highlighted fields.");
        toast.error("Check the form for errors");
        return;
      }

      await authService.registerWithPassword(parsed.data.email, parsed.data.password);

      toast.success("Account created");
      await navigate({
        to: "/verify-email",
        search: { email: parsed.data.email },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-farm-800/80 bg-farm-900/80 text-foreground shadow-2xl backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-tight">Create your account</CardTitle>
        <CardDescription className="text-farm-muted">
          Register to start setting up your farm and onboarding your team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="manager@farm.com"
              value={values.email}
              onChange={updateValue("email")}
            />
            {fieldErrors.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={updateValue("password")}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={updateValue("confirmPassword")}
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          {generalError ? <p className="text-sm text-destructive">{generalError}</p> : null}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-farm-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-farm-lime hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
