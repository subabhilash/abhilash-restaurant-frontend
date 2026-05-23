"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/auth.service";

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirm_new_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_new_password, {
    message: "Passwords do not match",
    path: ["confirm_new_password"],
  });

type FormData = z.infer<typeof schema>;

// Wrapper component — useSearchParams() requires a Suspense boundary in Next.js 15
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // No token in URL → invalid link
  useEffect(() => {
    if (!token) setStatus("error");
  }, [token]);

  async function onSubmit(data: FormData) {
    if (!token) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, data.new_password, data.confirm_new_password);
      setStatus("success");
      toast.success("Password updated! Please sign in with your new password.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "This reset link is invalid or has expired.";
      toast.error(msg);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <Card className="shadow-lg text-center">
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold">Password updated</h3>
          <p className="text-sm text-muted-foreground">
            Your password has been changed successfully.
          </p>
          <Button className="mt-2 w-full" onClick={() => router.push("/login")}>
            Sign in with new password
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (status === "error") {
    return (
      <Card className="shadow-lg text-center">
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
          <XCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Link invalid or expired</h3>
          <p className="text-sm text-muted-foreground">
            This reset link has already been used or expired (links last 1 hour). Request a new one.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="mt-2">Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter a new password for your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new_password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new_password"
                type="password"
                className="pl-9"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                autoFocus
                {...register("new_password")}
              />
            </div>
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_new_password">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm_new_password"
                type="password"
                className="pl-9"
                placeholder="Repeat password"
                autoComplete="new-password"
                {...register("confirm_new_password")}
              />
            </div>
            {errors.confirm_new_password && (
              <p className="text-xs text-destructive">{errors.confirm_new_password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardContent>
      </form>
    </Card>
  );
}
