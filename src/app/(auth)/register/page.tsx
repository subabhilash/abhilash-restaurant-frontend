"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Building2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_HOME } from "@/utils/constants";

const schema = z
  .object({
    restaurant_name: z.string().min(1, "Restaurant name is required").max(200),
    full_name: z.string().min(1, "Your name is required").max(255),
    email: z.string().email("Enter a valid email"),
    phone: z.string().max(20).optional(),
    password: z.string().min(8, "Minimum 8 characters").max(128),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      // Registration creates a restaurant + admin user in one shot
      const { authService } = await import("@/services/auth.service");
      const res = await authService.register({
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || undefined,
        password: data.password,
        confirm_password: data.confirm_password,
        restaurant_name: data.restaurant_name,
      });

      // Hydrate auth store directly since the registration returns a token
      const store = useAuthStore.getState();
      store.setSession(res);

      toast.success(`Welcome to Admizo! "${data.restaurant_name}" is ready.`);
      router.push(ROLE_HOME[res.user.role] ?? "/admin/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; errors?: Record<string, string> } } })
          ?.response?.data?.detail ?? "Registration failed. Email may already be registered.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Create your restaurant account</CardTitle>
        <CardDescription>
          Start your free trial — no credit card required
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Restaurant name */}
          <div className="space-y-1.5">
            <Label htmlFor="restaurant_name">Restaurant name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="restaurant_name"
                className="pl-9"
                placeholder="The Spice Garden"
                autoFocus
                {...register("restaurant_name")}
              />
            </div>
            {errors.restaurant_name && (
              <p className="text-xs text-destructive">{errors.restaurant_name.message}</p>
            )}
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Your name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                className="pl-9"
                placeholder="Jane Smith"
                {...register("full_name")}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                placeholder="you@restaurant.com"
                autoComplete="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                className="pl-9"
                placeholder="+91 98765 43210"
                {...register("phone")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="Min 8 chars"
                  autoComplete="new-password"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Repeat"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account &amp; restaurant
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
