export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl mb-3">R</div>
          <h2 className="text-2xl font-bold text-gray-900">RestaurantOS</h2>
          <p className="text-sm text-gray-500">Restaurant Management Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
