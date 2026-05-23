import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Link href="/" className="text-primary hover:underline">Go home</Link>
    </div>
  );
}
