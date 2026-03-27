"use client"

import { useState, useCallback } from "react"
import { LoadingScreen } from "./loading-screen"

export function AppLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  const handleComplete = useCallback(() => {
    setLoading(false)
  }, [])

  return (
    <>
      {loading && <LoadingScreen onComplete={handleComplete} />}
      <div className={loading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </>
  )
}
