"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect } from "react"

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Only check after auth has finished loading to avoid false redirects
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "You need to login first!",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [user, isLoading, router, toast])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="min-h-screen bg-white text-zinc-900 dark:bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:text-white flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
            <p className="text-lg">Loading map...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  // Don't render the map if user is not authenticated
  if (!user) {
    return null // This prevents the map from flashing before redirect
  }

  // User is authenticated, render the map layout
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white flex flex-col">
        
        <main className="flex-1 relative">{children}</main>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
