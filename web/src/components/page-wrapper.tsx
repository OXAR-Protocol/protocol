'use client'

import { CustomCursor } from '@/components/custom-cursor'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      {children}
    </>
  )
}
