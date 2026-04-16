import { Providers } from "@/providers/providers";
import { TopNav } from "@/components/top-nav";
import { TabBar } from "@/components/tab-bar";
import { AuthGuard } from "@/components/auth-guard";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
        <div className="min-h-screen bg-grid">
          <TopNav />
          <div className="max-w-[1300px] mx-auto px-4 pb-24 md:pb-12 pt-6 md:pt-0">
            {children}
          </div>
        </div>
        <TabBar />
      </AuthGuard>
    </Providers>
  );
}
