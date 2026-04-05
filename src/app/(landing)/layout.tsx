export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0e17] dark:text-white">
      {children}
    </div>
  );
}
