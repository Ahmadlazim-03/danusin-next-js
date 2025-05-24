"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { AnimatedBackground } from "@/components/animated-background"
import { Header } from "@/components/newdashboard/Header"
import { Sidebar } from "@/components/newdashboard/Sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
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
            <p className="text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  // Don't render the dashboard if user is not authenticated
  if (!user) {
    return null // This prevents the dashboard from flashing before redirect
  }

  // User is authenticated, render the dashboard
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:text-white">
        <AnimatedBackground />
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <aside className="hidden md:block w-56 shrink-0 fixed top-21 h-[calc(100vh-4rem)] overflow-y-auto pr-4">
              <Sidebar />
            </aside>
            <main className="w-full flex-1 md:ml-64">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
