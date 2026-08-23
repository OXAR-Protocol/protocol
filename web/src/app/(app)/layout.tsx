import { Suspense } from "react";
import { Providers } from "@/providers/providers";
import { dmSans } from "@/components/landing-v2/fonts";
import { TopNav } from "@/components/top-nav";
import { TabBar } from "@/components/tab-bar";
import { AuthGuard } from "@/components/auth-guard";
import { AccessWall } from "@/components/access-gate/access-wall";
import { JoinCapture } from "@/components/access-gate/join-capture";
import { ChannelReport } from "@/components/channel-tracker";
import { TermsAndIntroGate } from "@/components/terms/terms-and-intro-gate";
import { SignInGateProvider } from "@/components/terms/sign-in-gate";
import { PullToRefresh } from "@/components/pull-to-refresh";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} app-texture min-h-screen text-ink`}>
      <Suspense fallback={null}>
        <AccessWall>
          {/* The logo warp used to wrap everything from here down, and play on every
              hard load. It was never attached to anything: it did not wait for auth,
              it did not wait for balances, it did not cover a navigation — it ran
              because the layout mounted, and then held the screen while it did. An
              animation with no event behind it is decoration, and decoration does not
              get to stand between someone and their money. Removed entirely; the
              canvas machinery went with it. In git history if a real transition ever
              needs it. */}
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
        </AccessWall>
      </Suspense>
    </div>
  );
}
