"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

// Type for location data, consistent with map page
type LocationData = {
  lon: number;
  lat: number;
};

type User = {
  id: string
  email: string
  username: string
  name: string
  isdanuser: boolean
  avatar: string
  bio?: string
  location?: LocationData // General profile location
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
  upsertLiveLocation: (
    location: LocationData,
    currentRecordId: string | null
  ) => Promise<string | null>;
  deleteLiveLocation: (recordId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Define protectedRoutes and danUserOnlyRoutes at the component's top level scope
const protectedRoutes = ["/dashboard", "/profile"];
const danUserOnlyRoutes = ["/dashboard/trends"];


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const processUserData = (userData: any): User => {
    let avatarUrl = ""
    if (userData.avatar) {
      avatarUrl = pb.files.getUrl(userData, userData.avatar)
    }
    return { ...userData, avatar: avatarUrl, }
  }

  const refreshUser = useCallback(async () => {
    if (!pb.authStore.isValid || !pb.authStore.model) return
    try {
      const userId = pb.authStore.model.id
      const userData = await pb.collection("danusin_users").getOne(userId)
      setUser(processUserData(userData))
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }, [])

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      setUser(processUserData(pb.authStore.model as any))
    }
    setIsLoading(false)
    const unsubscribe = pb.authStore.onChange((token, model) => {
        setUser(model ? processUserData(model as any) : null);
    }, true); 
    
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe(); 
        }
    };
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
      const authData = await pb.collection("danusin_users").authWithOAuth2({ provider: "google" })
      if (authData.meta?.isNew) {
        const email = authData.meta?.email || `user_${authData.record.id}`
        let username = ""
        if (authData.meta?.name) {
          username = authData.meta.name.replace(/\s+/g, "").toLowerCase()
        } else {
          username = email.split("@")[0].toLowerCase()
        }
        username = username.replace(/[^a-z0-9._-]/g, "_")
        let isUsernameAvailable = false
        try {
          await pb.collection("danusin_users").getFirstListItem(`username="${username}"`)
        } catch (error) {
          isUsernameAvailable = true
        }
        if (!isUsernameAvailable) {
          const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "_")
          username = `${emailPrefix}_${Math.random().toString(36).slice(2, 8)}`
        }
        const updateData = {
          isdanuser: isDanuser,
          username: username,
          name: authData.meta?.name || "",
          email: email,
        }
        await pb.collection("danusin_users").update(authData.record.id, updateData)
        const refreshedUser = await pb.collection("danusin_users").getOne(authData.record.id);
        setUser(processUserData(refreshedUser));
      } else {
         setUser(processUserData(authData.record));
      }
      router.push(authData.meta?.isNew ? "/register/keywords" : "/dashboard")
    } catch (error: any) {
      console.error("Google login error:", error, error.data)
      throw new Error(error.message || "Failed to register with Google")
    }
  }

  const register = async (
    email: string, password: string, passwordConfirm: string,
    name: string, username: string, isDanuser: boolean,
  ) => {
    try {
      await pb.collection("danusin_users").create({ 
        email, password, passwordConfirm, name, username, isdanuser: isDanuser,
      })
      await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(pb.authStore.model as any))
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
        const updatedUserRecord = await pb.collection("danusin_users").update(user.id, {
          location: { lon, lat },
        })
        setUser(processUserData(updatedUserRecord))
    } catch (error) {
      console.error("Error updating user profile location:", error)
      throw error
    }
  }

  const upsertLiveLocation = useCallback(async (
    location: LocationData,
    currentRecordId: string | null
  ): Promise<string | null> => {
    if (!user || !user.id || !pb.authStore.isValid) {
      console.warn("User not authenticated or session invalid for live location update.");
      return null;
    }
    try {
      const data = {
        danuser_related: user.id,
        danuser_location: { lon: location.lon, lat: location.lat },
      };
      if (currentRecordId) {
        const updatedRecord = await pb.collection("danusin_users_location").update(currentRecordId, data);
        return updatedRecord.id;
      } else {
        // This is the POST request that IS triggering your server-side rule failure
        const newRecord = await pb.collection("danusin_users_location").create(data);
        return newRecord.id;
      }
    } catch (error) {
      console.error("Error in AuthProvider upsertLiveLocation:", error); 
      throw error; // This error will be the "create rule failure" if the server rejects it
    }
  }, [user])

  const deleteLiveLocation = useCallback(async (recordId: string): Promise<void> => {
    if (!pb.authStore.isValid) {
      console.warn("Session invalid for deleting live location.");
      return;
    }
    if (!recordId) {
        console.warn("No record ID provided for live location deletion.");
        return;
    }
    try {
      await pb.collection("danusin_users_location").delete(recordId);
      console.log("Live location record deleted from danusin_users_location:", recordId);
    } catch (error) {
      console.error("Error deleting live location from danusin_users_location:", error);
      throw error;
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (protectedRoutes.some((route) => pathname?.startsWith(route)) && !user) {
        router.push("/login")
      }
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
    upsertLiveLocation,
    deleteLiveLocation,
    refreshUser,
  }

  if (isLoading && !user && protectedRoutes.some((route) => pathname?.startsWith(route))) {
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