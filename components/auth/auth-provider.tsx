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
  isLoading: boolean // Renamed from loading for clarity if it was just 'loading'
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
  updateUserLocation: (lon: number, lat: number) => Promise<void> // For general profile location
  refreshUser: () => Promise<void>
  upsertLiveLocation: ( // For the map feature
    location: LocationData,
    currentRecordId: string | null
  ) => Promise<string | null>;
  deactivateLiveLocation: (recordId: string) => Promise<void>; // Renamed from deleteLiveLocation
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
    // Ensure all expected fields of User type are present, with defaults if necessary
    return {
        id: userData.id,
        email: userData.email || "",
        username: userData.username || "",
        name: userData.name || "",
        isdanuser: userData.isdanuser || false,
        avatar: avatarUrl,
        bio: userData.bio || "",
        location: userData.location, // This should be {lon, lat} or undefined
        location_text: userData.location_text || "",
        email_notifications: userData.email_notifications || false,
        marketing_emails: userData.marketing_emails || false,
     }
  }

  const refreshUser = useCallback(async () => {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
        console.warn("[AuthProvider] refreshUser: Auth store not valid or model ID missing.");
        return;
    }
    try {
      const userId = pb.authStore.model.id
      console.log(`[AuthProvider] Refreshing user data for ID: ${userId}`);
      const userData = await pb.collection("danusin_users").getOne(userId)
      setUser(processUserData(userData))
      console.log("[AuthProvider] User data refreshed successfully.");
    } catch (error) {
      console.error("[AuthProvider] Error refreshing user data:", error)
    }
  }, [])

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      setUser(processUserData(pb.authStore.model as any)) 
    }
    setIsLoading(false)
    
    const unsubscribe = pb.authStore.onChange((token, model) => {
        console.log("[AuthProvider] AuthStore changed. New model:", model);
        setUser(model ? processUserData(model as any) : null);
    }, true); 
    
    return () => {
        if (typeof unsubscribe === 'function') {
            console.log("[AuthProvider] Unsubscribing from AuthStore changes.");
            unsubscribe(); 
        }
    };
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log(`[AuthProvider] Attempting login for email: ${email}`);
      const authData = await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(authData.record))
      console.log("[AuthProvider] Login successful. User set:", authData.record.id);
      router.push("/dashboard")
    } catch (error) {
      console.error("[AuthProvider] Login error:", error)
      throw error
    }
  }

  const loginWithGoogle = async (isDanuser = false) => {
    try {
      console.log("[AuthProvider] Attempting Google login.");
      const authData = await pb.collection("danusin_users").authWithOAuth2({ provider: "google" })
      console.log("[AuthProvider] Google auth data received:", authData);
      if (authData.meta?.isNew) {
        console.log("[AuthProvider] New user via Google. Updating profile.");
        const email = authData.meta?.email || `user_${authData.record.id}@example.com` 
        let username = ""
        if (authData.meta?.name) {
          username = authData.meta.name.replace(/\s+/g, "").toLowerCase()
        } else {
          username = email.split("@")[0].toLowerCase()
        }
        username = username.replace(/[^a-z0-9._-]/g, "_") 
        
        let isUsernameAvailable = false;
        let tempUsername = username;
        let attempt = 0;
        console.log(`[AuthProvider] Checking username availability for: ${tempUsername}`);
        while(!isUsernameAvailable && attempt < 5) { 
            try {
                await pb.collection("danusin_users").getFirstListItem(`username="${tempUsername}"`);
                console.log(`[AuthProvider] Username ${tempUsername} taken. Generating new.`);
                const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "_");
                tempUsername = `${emailPrefix}_${Math.random().toString(36).slice(2, 8)}`;
                attempt++;
            } catch (error: any) {
                if (error.status === 404) { 
                    isUsernameAvailable = true;
                    username = tempUsername;
                    console.log(`[AuthProvider] Username ${username} is available.`);
                } else {
                    console.error("[AuthProvider] Error checking username availability:", error);
                    throw error; 
                }
            }
        }
        if (!isUsernameAvailable) { 
            username = `user_${Date.now()}`; 
            console.log(`[AuthProvider] Could not find unique username quickly, using fallback: ${username}`);
        }

        const updateData = {
          isdanuser: isDanuser,
          username: username,
          name: authData.meta?.name || username, 
          email: email, 
        }
        console.log("[AuthProvider] Updating new Google user with data:", updateData);
        await pb.collection("danusin_users").update(authData.record.id, updateData)
        const refreshedUser = await pb.collection("danusin_users").getOne(authData.record.id);
        setUser(processUserData(refreshedUser));
        console.log("[AuthProvider] New Google user profile updated and set.");
      } else {
         console.log("[AuthProvider] Existing user via Google. Refreshing data.");
         const refreshedUser = await pb.collection("danusin_users").getOne(authData.record.id);
         setUser(processUserData(refreshedUser));
         console.log("[AuthProvider] Existing Google user data refreshed and set.");
      }
      router.push(authData.meta?.isNew ? "/register/keywords" : "/dashboard")
    } catch (error: any) {
      console.error("[AuthProvider] Google login error:", error, error.data)
      throw new Error(error.message || "Failed to register with Google")
    }
  }

  const register = async (
    email: string, password: string, passwordConfirm: string,
    name: string, username: string, isDanuser: boolean,
  ) => {
    try {
      console.log(`[AuthProvider] Attempting registration for email: ${email}, username: ${username}`);
      await pb.collection("danusin_users").create({ 
        email, password, passwordConfirm, name, username, isdanuser: isDanuser,
      })
      console.log("[AuthProvider] Registration successful. Authenticating...");
      await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(pb.authStore.model as any))
      console.log("[AuthProvider] Authentication after registration successful. User set.");
      router.push("/register/keywords") 
    } catch (error) {
      console.error("[AuthProvider] Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    console.log("[AuthProvider] Logging out user.");
    pb.authStore.clear()
    setUser(null)
    router.push("/") 
  }

  const updateUserLocation = async (lon: number, lat: number) => {
    const currentUserId = pb.authStore.model?.id || user?.id;
    if (!currentUserId) {
        console.warn("[AuthProvider] updateUserLocation: User ID not found.");
        return;
    }
    try {
        console.log(`[AuthProvider] Updating profile location for user ID: ${currentUserId}`);
        const updatedUserRecord = await pb.collection("danusin_users").update(currentUserId, {
          location: { lon, lat }, 
        })
        setUser(processUserData(updatedUserRecord)) 
        console.log("[AuthProvider] Profile location updated successfully.");
    } catch (error) {
      console.error("[AuthProvider] Error updating user profile location:", error)
      throw error
    }
  }

  const upsertLiveLocation = useCallback(async (
    location: LocationData,
    currentRecordId: string | null
  ): Promise<string | null> => {
    const currentUserId = pb.authStore.model?.id; // Prioritize fresh ID from authStore

    if (!currentUserId || !pb.authStore.isValid) {
      console.warn("[AuthProvider] upsertLiveLocation: User not authenticated or session invalid.");
      return null;
    }
    
    const dataPayload = {
      danuser_related: currentUserId,
      danuser_location: { lon: location.lon, lat: location.lat }, 
      isactive: true, 
    };
    console.log(`[AuthProvider] upsertLiveLocation called. UserID: ${currentUserId}, RecordID: ${currentRecordId}, Payload:`, dataPayload);

    try {
      if (currentRecordId) {
        console.log(`[AuthProvider] Attempting to UPDATE live location record: ${currentRecordId}`);
        const updatedRecord = await pb.collection("danusin_users_location").update(currentRecordId, dataPayload);
        console.log(`[AuthProvider] Live location record UPDATED successfully. New ID: ${updatedRecord.id}`);
        return updatedRecord.id;
      } else {
        console.log("[AuthProvider] Attempting to CREATE new live location record.");
        const newRecord = await pb.collection("danusin_users_location").create(dataPayload);
        console.log(`[AuthProvider] Live location record CREATED successfully. New ID: ${newRecord.id}`);
        return newRecord.id;
      }
    } catch (error: any) {
      console.error(`[AuthProvider] Error during upsert. Initial RecordID: ${currentRecordId}. Error:`, error);
      if (error.status === 404 && currentRecordId) {
        console.warn(`[AuthProvider] Update for record ${currentRecordId} failed (404). Attempting to CREATE new record instead.`);
        try {
          const newRecord = await pb.collection("danusin_users_location").create(dataPayload);
          console.log(`[AuthProvider] Live location record CREATED successfully after 404 on update. New ID: ${newRecord.id}`);
          return newRecord.id;
        } catch (createError) {
          console.error("[AuthProvider] Error CREATING live location record after update failed (404):", createError);
          throw createError; 
        }
      } else {
        console.error("[AuthProvider] Unhandled error in upsertLiveLocation or error during initial create:", error);
        throw error; 
      }
    }
  }, []) // Removed 'user' from dependencies, relying on pb.authStore.model.id inside

  const deactivateLiveLocation = useCallback(async (recordId: string): Promise<void> => {
    const currentUserId = pb.authStore.model?.id;
     if (!currentUserId || !pb.authStore.isValid) {
      console.warn("[AuthProvider] deactivateLiveLocation: User not authenticated or session invalid.");
      return;
    }
    if (!recordId) {
        console.warn("[AuthProvider] No record ID provided for live location deactivation.");
        return;
    }
    console.log(`[AuthProvider] deactivateLiveLocation called. UserID: ${currentUserId}, RecordID to deactivate: ${recordId}`);
    try {
      await pb.collection("danusin_users_location").update(recordId, { 
        isactive: false,
        // It's important that only the user themselves can deactivate their record.
        // PocketBase API rules should enforce: danuser_related = @request.auth.id for this update.
      });
      console.log(`[AuthProvider] Live location record DEACTIVATED: ${recordId}`);
    } catch (error:any) {
      console.error(`[AuthProvider] Error deactivating live location record ${recordId}:`, error);
      if (error.status !== 404) {
        throw error; 
      } else {
        console.warn(`[AuthProvider] Record ${recordId} not found during deactivation. It might have been already deleted or belonged to another user.`);
      }
    }
  }, []) 

  useEffect(() => {
    if (!isLoading) { 
      const currentPath = pathname || "";
      if (protectedRoutes.some((route) => currentPath.startsWith(route)) && !user) {
        console.log(`[AuthProvider] Protected route (${currentPath}), but no user. Redirecting to login.`);
        router.push("/login") 
      }
      if (danUserOnlyRoutes.some((route) => currentPath.startsWith(route)) && (!user || !user.isdanuser)) {
        console.log(`[AuthProvider] Danuser only route (${currentPath}), but user is not danuser or no user. Redirecting to dashboard.`);
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
    deactivateLiveLocation, 
    refreshUser,
  }

  if (isLoading && protectedRoutes.some((route) => (pathname || "").startsWith(route))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-4">
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
