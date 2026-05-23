"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_HOME } from "@/utils/constants";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useHydrated } from "@/hooks/use-hydrated";

export default function RootPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    router.replace(ROLE_HOME[user?.role ?? ""] ?? "/admin/dashboard");
  }, [hydrated, isAuthenticated, user, router]);

  return <LoadingScreen />;
}
