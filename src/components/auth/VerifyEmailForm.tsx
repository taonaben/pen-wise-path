import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authService } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { otpSchema } from "@/schemas/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;

type VerifyEmailFormProps = {
  email: string;
};

type PersistedState = {
  attempts: number;
  lockoutUntil: number;
  resendUntil: number;
};

const getStorageKey = (email: string) => `pen-wise-path:verify-email:${email}`;

function readPersistedState(email: string): PersistedState {
  if (typeof window === "undefined") {
    return { attempts: 0, lockoutUntil: 0, resendUntil: 0 };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(email));
    if (!raw) {
      return { attempts: 0, lockoutUntil: 0, resendUntil: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
      lockoutUntil: typeof parsed.lockoutUntil === "number" ? parsed.lockoutUntil : 0,
      resendUntil: typeof parsed.resendUntil === "number" ? parsed.resendUntil : 0,
    };
  } catch {
    return { attempts: 0, lockoutUntil: 0, resendUntil: 0 };
  }
}

function persistState(email: string, state: PersistedState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(email), JSON.stringify(state));
}

function clearState(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(email));
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const navigate = useNavigate();
  const [token, setToken] = React.useState("");
  const [attempts, setAttempts] = React.useState(0);
  const [lockoutUntil, setLockoutUntil] = React.useState(0);
  const [resendUntil, setResendUntil] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const state = readPersistedState(email);
    setAttempts(state.attempts);
    setLockoutUntil(state.lockoutUntil);
    setResendUntil(state.resendUntil);
  }, [email]);

  React.useEffect(() => {
    persistState(email, { attempts, lockoutUntil, resendUntil });
  }, [attempts, lockoutUntil, resendUntil, email]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const isLockedOut = lockoutUntil > now;
  const remainingLockoutSeconds = isLockedOut ? Math.ceil((lockoutUntil - now) / 1000) : 0;
  const remainingResendSeconds = resendUntil > now ? Math.ceil((resendUntil - now) / 1000) : 0;

  const submitToken = React.useCallback(
    async (candidateToken: string) => {
      if (isLockedOut || isVerifying) {
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        const parsed = otpSchema.safeParse({ email, token: candidateToken });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid verification code");
          return;
        }

        await authService.verifyOTP(parsed.data.email, parsed.data.token);
        clearState(email);
        toast.success("Email verified");
        await navigate({ to: "/profile-setup" });
      } catch (submissionError) {
        const nextAttempts = attempts + 1;

        if (nextAttempts >= MAX_ATTEMPTS) {
          const lockout = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
          setAttempts(nextAttempts);
          setLockoutUntil(lockout);
          setError("Too many incorrect attempts. Try again in 15 minutes.");
          toast.error("Verification locked for 15 minutes");
          return;
        }

        setAttempts(nextAttempts);
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "That code is invalid or expired.",
        );
        toast.error("Invalid or expired code");
      } finally {
        setIsVerifying(false);
      }
    },
    [attempts, email, isLockedOut, isVerifying, navigate],
  );

  React.useEffect(() => {
    if (token.length === 6) {
      void submitToken(token);
    }
  }, [submitToken, token]);

  const handleResend = async () => {
    if (remainingResendSeconds > 0 || isResending || isLockedOut) {
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      await authService.resendOTP(email);
      const nextResendUntil = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      setResendUntil(nextResendUntil);
      toast.success("Verification code resent");
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Unable to resend code";
      setError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-farm-800/80 bg-farm-900/80 text-foreground shadow-2xl backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-tight">Verify your email</CardTitle>
        <CardDescription className="text-farm-muted">
          Enter the 6-digit code we sent to {email}. You can resend it after the cooldown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <InputOTP
            value={token}
            onChange={setToken}
            maxLength={6}
            disabled={isLockedOut || isVerifying}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="text-farm-muted" />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="text-center text-xs text-farm-muted">
            {isLockedOut
              ? `Too many attempts. Try again in ${Math.ceil(remainingLockoutSeconds / 60)} minutes.`
              : attempts > 0
                ? `${MAX_ATTEMPTS - attempts} attempts remaining`
                : "The code will submit automatically when all 6 digits are entered."}
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="rounded-full"
            onClick={handleResend}
            disabled={remainingResendSeconds > 0 || isResending || isLockedOut}
            variant="outline"
          >
            {isResending
              ? "Resending…"
              : remainingResendSeconds > 0
                ? `Resend in ${remainingResendSeconds}s`
                : "Resend OTP"}
          </Button>
          {error ? (
            <Button
              type="button"
              className="rounded-full"
              variant="ghost"
              onClick={handleResend}
              disabled={remainingResendSeconds > 0 || isResending || isLockedOut}
            >
              Retry
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/register">Use a different email</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
