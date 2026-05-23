import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/helpers";
import type { LucideIcon } from "lucide-react";
interface StatCardProps { title: string; value: string | number; icon: LucideIcon; description?: string; loading?: boolean; iconColor?: string; }
export function StatCard({ title, value, icon: Icon, description, loading, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="mt-1 text-3xl font-bold">{value}</p>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn("rounded-full bg-muted p-3", iconColor)}><Icon className="h-6 w-6" /></div>
        </div>
      </CardContent>
    </Card>
  );
}
