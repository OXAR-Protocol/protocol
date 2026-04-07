import { Providers } from "@/providers/providers";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-grid">
        <div className="max-w-[600px] mx-auto px-4 pb-24">{children}</div>
      </div>
      <TabBar />
    </Providers>
  );
}
