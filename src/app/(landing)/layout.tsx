"use client";

import { WarpProvider } from "@/components/landing/warp-transition";
import { PageWrapper } from "@/components/landing/page-wrapper";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-oxar-black text-oxar-white overflow-x-hidden">
      <WarpProvider>
        <PageWrapper>{children}</PageWrapper>
      </WarpProvider>
    </div>
  );
}
