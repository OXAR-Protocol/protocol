import { Suspense } from "react";
import type { Viewport } from "next";
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

// Let the app routes draw into the display's safe areas, which the .safe-* rules in
// globals.css then pad back out. Needed for the mobile shell, whose WebView is the root
// view and so renders under the status bar and home indicator; harmless everywhere else,
// since env(safe-area-inset-*) is 0 without insets. It must be server-rendered — WebKit
// reads viewport-fit when it parses the document and ignores later mutations of the tag.
// Scoped to (app) on purpose: the marketing pages keep the default viewport.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} app-texture min-h-screen text-black`}>
      <Suspense fallback={null}>
        <AccessWall>
          <Providers>
            <WarpProvider>
              <WarpOnEntry />
              <AuthGuard>
                {/* Flex column so the photo footer sits pinned below the content (never
                    overlapping it — text stays legible) and spans the full page width. */}
                <div className="flex min-h-screen flex-col">
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
