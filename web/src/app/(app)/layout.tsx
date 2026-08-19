import { Suspense } from "react";
import { Providers } from "@/providers/providers";
import { dmSans } from "@/components/landing-v2/fonts";
import { TopNav } from "@/components/top-nav";
import { TabBar } from "@/components/tab-bar";
import { AuthGuard } from "@/components/auth-guard";
import { AccessWall } from "@/components/access-gate/access-wall";
import { JoinCapture } from "@/components/access-gate/join-capture";
import { ChannelReport } from "@/components/channel-tracker";
import { WarpProvider } from "@/components/warp-transition";
import { WarpOnEntry } from "@/components/warp-on-entry";
import { TermsAndIntroGate } from "@/components/terms/terms-and-intro-gate";
import { SignInGateProvider } from "@/components/terms/sign-in-gate";
import { PullToRefresh } from "@/components/pull-to-refresh";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} app-texture min-h-screen text-ink`}>
      <Suspense fallback={null}>
        <AccessWall>
          {/* The warp sits ABOVE Providers on purpose. PrivyProvider reads its config
              at mount, so it is keyed by the theme and that subtree remounts on every
              light↔dark switch. With the warp inside it, changing the theme replayed
              the three-second entry animation — which reads as the app reloading
              itself for a colour. Nothing in the warp needs Privy or the locale. */}
          <WarpProvider>
            <WarpOnEntry />
            <Providers>
              <SignInGateProvider>
                <AuthGuard>
                  <PullToRefresh />
                  {/* Flex column so the photo footer sits pinned below the content (never
                      overlapping it — text stays legible) and spans the full page width. */}
                  <div className="flex min-h-screen flex-col">
                    <TopNav />
                    <div className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-6">
                      {children}
                      <JoinCapture />
                      <ChannelReport />
                    </div>
                  </div>
                  <TabBar />
                  {/* Terms gate first (blocking, per-wallet), THEN the first-run
                      welcome/tour — never both on screen. See `TermsAndIntroGate`. */}
                  <TermsAndIntroGate />
                </AuthGuard>
              </SignInGateProvider>
            </Providers>
          </WarpProvider>
        </AccessWall>
      </Suspense>
    </div>
  );
}
