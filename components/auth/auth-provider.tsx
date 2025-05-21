"use client"

import type React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

type User = {
  id: string
  email: string
  username: string
  name: string
  isdanuser: boolean
  avatar: string
  bio?: string
  location?: { lon: number; lat: number }
  location_text?: string
  email_notifications?: boolean
  marketing_emails?: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (isDanuser?: boolean) => Promise<void>
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username: string,
    isDanuser: boolean,
  ) => Promise<void>
  logout: () => void
  isDanuser: boolean
  updateUserLocation: (lon: number, lat: number) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to process user data and add avatar URL
  const processUserData = (userData: any): User => {
    let avatarUrl = ""
    if (userData.avatar) {
      avatarUrl = pb.files.getUrl(userData, userData.avatar)
    }

    return {
      ...userData,
      avatar: avatarUrl,
    }
  }

  // Function to refresh user data
  const refreshUser = async () => {
    if (!pb.authStore.isValid || !pb.authStore.model) return

    try {
      const userId = pb.authStore.model.id
      const userData = await pb.collection("danusin_users").getOne(userId)
      setUser(processUserData(userData))
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  useEffect(() => {
    // Check if user is already logged in
    if (pb.authStore.isValid && pb.authStore.model) {
      setUser(processUserData(pb.authStore.model as any))
    }
    setIsLoading(false)

    // Subscribe to auth state changes
    pb.authStore.onChange(() => {
      setUser(pb.authStore.model ? processUserData(pb.authStore.model as any) : null)
    })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(authData.record))
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const loginWithGoogle = async (isDanuser = false) => {
    try {
      // Open Google OAuth2 authentication
      const authData = await pb.collection("danusin_users").authWithOAuth2({ provider: "google" })

      // Update user record if needed
      if (authData.meta?.isNew) {
        await pb.collection("danusin_users").update(authData.record.id, {
          isdanuser: isDanuser,
        })
      }

      setUser(processUserData(authData.record))
      router.push("/dashboard")
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }

  const register = async (
    email: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username: string,
    isDanuser: boolean,
  ) => {
    try {
      // Create user
      const userData = await pb.collection("danusin_users").create({
        email,
        password,
        passwordConfirm,
        name,
        username,
        isdanuser: isDanuser,
      })

      // Login after registration
      await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(userData))

      // Redirect to keyword selection page
      router.push("/register/keywords")
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    router.push("/")
  }

  const updateUserLocation = async (lon: number, lat: number) => {
    if (!user) return

    try {
      // Only update location for dandanusin_users
      if (user.isdanuser) {
        const updatedUser = await pb.collection("danusin_users").update(user.id, {
          location: { lon, lat },
        })

        // Update local user state
        setUser(processUserData(updatedUser))
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
    refreshUser,
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
