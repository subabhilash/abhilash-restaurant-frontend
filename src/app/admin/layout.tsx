"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layouts/admin-sidebar";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useAuthStore } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    // Kitchen staff → kitchen display, waiter → waiter station (unless already on allowed admin paths)
    if (user?.role === "kitchen") { router.replace("/kitchen/dashboard"); return; }
    if (user?.role === "waiter" && pathname === "/admin/dashboard") {
      // Waiters landing on /admin go to their station
      router.replace("/waiter");
    }
  }, [hydrated, isAuthenticated, user, pathname, router]);

  if (!hydrated || !isAuthenticated) return <LoadingScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
