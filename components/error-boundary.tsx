"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by error boundary:", error)
      setError(error.error)
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  if (hasError) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-4 text-sm text-muted-foreground">{error?.message || "An unexpected error occurred"}</p>
          <Button onClick={() => setHasError(false)}>Try again</Button>
        </div>
      )
    )
  }

  return <>{children}</>
}
