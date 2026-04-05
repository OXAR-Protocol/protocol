export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-oxar-black text-oxar-white overflow-x-hidden">
      {children}
    </div>
  );
}
