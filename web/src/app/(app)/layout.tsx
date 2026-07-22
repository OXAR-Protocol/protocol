import { Suspense } from "react";
import { Providers } from "@/providers/providers";
import { dmSans } from "@/components/landing-v2/fonts";
import { TopNav } from "@/components/top-nav";
import { TabBar } from "@/components/tab-bar";
import { AuthGuard } from "@/components/auth-guard";
import { AccessWall } from "@/components/access-gate/access-wall";
import { JoinCapture } from "@/components/access-gate/join-capture";
import { PhotoFooter } from "@/components/photo-footer";
import { ChannelReport } from "@/components/channel-tracker";
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
                {/* Flex column so the photo footer sits pinned below the content (never
                    overlapping it — text stays legible) and spans the full page width. */}
                <div className="flex min-h-screen flex-col">
                  {/* barely-there page texture — shows through the gutters, never over cards */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/art/coin-collage.webp"
                    alt=""
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 h-full w-full select-none object-cover opacity-[0.035]"
                  />
                  <TopNav />
                  <div className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-6">
                    <PendingBridgeBanner />
                    {children}
                    <JoinCapture />
                    <ChannelReport />
                  </div>
                  <PhotoFooter />
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
