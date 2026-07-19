import { Suspense } from "react";
import { Providers } from "@/providers/providers";
import { dmSans } from "@/components/landing-v2/fonts";
import { TopNav } from "@/components/top-nav";
import { TabBar } from "@/components/tab-bar";
import { AuthGuard } from "@/components/auth-guard";
import { AccessWall } from "@/components/access-gate/access-wall";
import { JoinCapture } from "@/components/access-gate/join-capture";
import { WarpProvider } from "@/components/warp-transition";
import { WarpOnEntry } from "@/components/warp-on-entry";
import { PendingBridgeBanner } from "@/components/pending-bridge-banner";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-white text-black`}>
      <Suspense fallback={null}>
        <AccessWall>
          <Providers>
            <WarpProvider>
              <WarpOnEntry />
              <AuthGuard>
                <div className="min-h-screen bg-white">
                  <TopNav />
                  <div className="mx-auto max-w-[1100px] px-5 pb-28 pt-6 md:pb-16">
                    <PendingBridgeBanner />
                    {children}
                    <JoinCapture />
                  </div>
                </div>
                <TabBar />
              </AuthGuard>
            </WarpProvider>
          </Providers>
        </AccessWall>
      </Suspense>
    </div>
  );
}
