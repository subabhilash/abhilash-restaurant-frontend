"use client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface KitchenHeaderProps {
  lastUpdate: string;
  onHistoryToggle: () => void;
  showingHistory: boolean;
  historyCount: number;
}

export function KitchenHeader({ lastUpdate, onHistoryToggle, showingHistory, historyCount }: KitchenHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">A</div>
        <div>
          <span className="font-bold text-base text-white">Kitchen Display</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · Auto-refresh 10s · {lastUpdate}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right mr-1 hidden sm:block">
          <p className="text-xs font-medium text-gray-200">{user?.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>

        <button
          onClick={onHistoryToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showingHistory ? "bg-primary text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
        >
          {showingHistory ? "← Live Board" : `History (${historyCount})`}
        </button>

        {isAdmin && (
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-medium text-gray-200 transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-xs font-medium text-red-300 hover:text-red-100 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </div>
  );
}
