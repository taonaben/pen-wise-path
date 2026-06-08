import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authService } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { farmService } from "@/services/farmService";
import { farmSchema } from "@/schemas/auth";

type FieldErrors = Partial<Record<"name" | "location", string>>;

const initialValues = {
  name: "",
  location: "",
};

export function FarmSetupForm() {
  const navigate = useNavigate();
  const [values, setValues] = React.useState(initialValues);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const redirectTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) {
        window.clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const updateValue =
    (field: keyof typeof initialValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setGeneralError(null);
      setSuccessMessage(null);
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const parsed = farmSchema.safeParse(values);

      if (!parsed.success) {
        const flattened = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          name: flattened.name?.[0],
          location: flattened.location?.[0],
        });
        setGeneralError("Please fix the highlighted fields.");
        toast.error("Check the form for errors");
        return;
      }

      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Please sign in again to finish setup.");
      }

      await farmService.createFarmWithOwnership(user.id, parsed.data);
      const welcomeMessage = `Welcome to your new farm, ${parsed.data.name}!`;
      setSuccessMessage(welcomeMessage);
      toast.success("Farm created");

      redirectTimer.current = window.setTimeout(() => {
        void navigate({ to: "/dashboard" });
      }, 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Farm setup failed";
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
          Step 2 of 2
        </div>
        <CardTitle className="text-2xl tracking-tight">Set up your first farm</CardTitle>
        <CardDescription className="text-farm-muted">
          Give your operation a name and add a location if you want to keep records organized.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Farm name</Label>
            <Input
              id="name"
              autoComplete="organization"
              placeholder="Green Valley Farm"
              value={values.name}
              onChange={updateValue("name")}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              autoComplete="address-level2"
              placeholder="North Region"
              value={values.location}
              onChange={updateValue("location")}
            />
            {fieldErrors.location ? (
              <p className="text-xs text-destructive">{fieldErrors.location}</p>
            ) : null}
          </div>

          {generalError ? <p className="text-sm text-destructive">{generalError}</p> : null}

          {successMessage ? (
            <p className="rounded-xl border border-farm-lime/30 bg-farm-lime/10 px-4 py-3 text-sm text-farm-lime">
              {successMessage}
            </p>
          ) : null}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating farm…" : "Create farm"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
