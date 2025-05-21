"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { pb } from "@/lib/pocketbase"
import { useRouter, usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

type User = {
  id: string
  email: string
  username: string
  name: string
  isdanuser: boolean
  avatar: string
  location?: { lon: number; lat: number }
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, passwordConfirm: string, name: string) => Promise<void>
  logout: () => void
  isDanuser: boolean
  updateUserLocation: (lon: number, lat: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is already logged in
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model as unknown as User)
    }
    setIsLoading(false)

    // Subscribe to auth state changes
    pb.authStore.onChange(() => {
      setUser(pb.authStore.model ? (pb.authStore.model as unknown as User) : null)
    })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await pb.collection("users").authWithPassword(email, password)
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      // Open Google OAuth2 authentication
      const authData = await pb.collection("users").authWithOAuth2({ provider: "google" })

      // Update user record if needed
      if (authData.meta?.isNew) {
        await pb.collection("users").update(authData.record.id, {
          isdanuser: false,
        })
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, passwordConfirm: string, name: string) => {
    try {
      // Create user
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm,
        name,
        isdanuser: false,
      })

      // Login after registration
      await pb.collection("users").authWithPassword(email, password)

      // Redirect to keyword selection page
      router.push("/register/keywords")
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    pb.authStore.clear()
    router.push("/")
  }

  const updateUserLocation = async (lon: number, lat: number) => {
    if (!user) return

    try {
      // Only update location for danusers
      if (user.isdanuser) {
        await pb.collection("users").update(user.id, {
          location: { lon, lat },
        })

        // Update local user state
        setUser((prev) => (prev ? { ...prev, location: { lon, lat } } : null))
      }
    } catch (error) {
      console.error("Error updating user location:", error)
      throw error
    }
  }

  // Protected routes logic
  useEffect(() => {
    const protectedRoutes = ["/dashboard", "/profile"]
    const danUserOnlyRoutes = ["/dashboard/trends"]

    if (!isLoading) {
      // Check if route is protected and user is not logged in
      if (protectedRoutes.some((route) => pathname?.startsWith(route)) && !user) {
        router.push("/login")
      }

      // Check if route is danuser only and user is not a danuser
      if (danUserOnlyRoutes.some((route) => pathname?.startsWith(route)) && (!user || !user.isdanuser)) {
        router.push("/dashboard")
      }
    }
  }, [pathname, user, isLoading, router])

  const value = {
    user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    isDanuser: user?.isdanuser || false,
    updateUserLocation,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
