"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useAuthStore } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    const allowed = ["super_admin", "admin", "kitchen"];
    if (!allowed.includes(user?.role ?? "")) router.replace("/admin/dashboard");
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated) return <LoadingScreen />;
  return <>{children}</>;
}
