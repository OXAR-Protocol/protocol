'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LoadingScreen } from '@/components/loading-screen'
import { LoadingProvider, useLoading } from '@/context/loading-context'

function PageContent({ children }: { children: React.ReactNode }) {
  const { isLoaded, setIsLoaded } = useLoading()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isHomePage) {
      setIsLoaded(true)
    }
  }, [isHomePage, setIsLoaded])

  if (!mounted) return null

  return (
    <>
      {isHomePage && !isLoaded && (
        <LoadingScreen
          duration={2000}
          onComplete={() => setIsLoaded(true)}
        />
      )}

      {isLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </>
  )
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <PageContent>{children}</PageContent>
    </LoadingProvider>
  )
}
