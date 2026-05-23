import { PackageSearch } from "lucide-react";
interface EmptyStateProps { title?: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ title = "No data", description = "Nothing here yet.", action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
