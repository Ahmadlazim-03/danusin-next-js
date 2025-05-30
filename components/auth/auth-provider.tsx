"use client"

import { Skeleton } from "@/components/ui/skeleton";
import { pb } from "@/lib/pocketbase"; // Assuming pb is correctly initialized PocketBase instance
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Type for location data, consistent with map page
type LocationData = {
  lon: number
  lat: number
}

// Define the User type based on your PocketBase collection fields
// Ensure all fields you expect to use are defined here.
type User = {
  id: string
  email: string
  username: string
  name: string
  isdanuser: boolean // Field name in PocketBase collection
  phone: string      // Field name in PocketBase collection
  avatar: string     // URL string after processing
  bio?: string
  location?: LocationData // This should be a JSON field in PocketBase: { "lon": number, "lat": number }
  location_text?: string
  email_notifications?: boolean
  marketing_emails?: boolean
  // Add other fields from your 'danusin_users' collection as needed
  // For example:
  // emailVisibility?: boolean;
  // created?: string;
  // updated?: string;
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (isDanuser?: boolean) => Promise<void> // isDanuser for new Google sign-ups
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username: string,
    isDanuser: boolean, // To set the role during registration
    phone: string
  ) => Promise<void>
  logout: () => void
  isDanuser: boolean // Derived from user?.isdanuser
  updateUserLocation: (lon: number, lat: number) => Promise<void> // For general profile location
  refreshUser: () => Promise<void>
  upsertLiveLocation: (
    location: LocationData,
    currentRecordId: string | null,
  ) => Promise<string | null>
  deactivateLiveLocation: (recordId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const protectedRoutes = ["/dashboard", "/profile", "/register/keywords"] // Added /register/keywords
const danUserOnlyRoutes = ["/dashboard/trends"] // Example

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start true to check auth status
  const router = useRouter()
  const pathname = usePathname()

  const processUserData = (userDataFromPb: any): User => {
    let avatarUrl = ""
    if (userDataFromPb.avatar && userDataFromPb.id && userDataFromPb.collectionId) {
      // Construct avatar URL using PocketBase file URL structure
      avatarUrl = pb.files.getUrl(userDataFromPb, userDataFromPb.avatar)
    } else if (userDataFromPb.avatar_url) { // For OAuth (Google might provide avatar_url directly)
        avatarUrl = userDataFromPb.avatar_url;
    }


    // Ensure all expected fields of User type are present, with defaults if necessary
    return {
      id: userDataFromPb.id,
      email: userDataFromPb.email || "",
      username: userDataFromPb.username || "",
      name: userDataFromPb.name || "",
      isdanuser: userDataFromPb.isdanuser || false, // Ensure this field name matches PocketBase
      phone: userDataFromPb.phone || "",         // Ensure this field name matches PocketBase
      avatar: avatarUrl,
      bio: userDataFromPb.bio || "",
      location: userDataFromPb.location, // Expects {lon, lat} or undefined. PocketBase stores JSON as is.
      location_text: userDataFromPb.location_text || "",
      email_notifications: userDataFromPb.email_notifications || false,
      marketing_emails: userDataFromPb.marketing_emails || false,
    }
  }

  const refreshUser = useCallback(async () => {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      console.warn("[AuthProvider] refreshUser: Auth store not valid or model ID missing.")
      // Optionally clear user state if auth is truly invalid
      // setUser(null); 
      return
    }
    try {
      const userId = pb.authStore.model.id
      console.log(`[AuthProvider] Refreshing user data for ID: ${userId}`)
      // Fetch the user record from 'danusin_users' collection
      const userData = await pb.collection("danusin_users").getOne(userId)
      setUser(processUserData(userData))
      console.log("[AuthProvider] User data refreshed successfully.")
    } catch (error) {
      console.error("[AuthProvider] Error refreshing user data:", error)
      // If refresh fails (e.g., token expired, user deleted), log out the user
      // pb.authStore.clear();
      // setUser(null);
      // router.push("/login"); // Or handle as appropriate
    }
  }, [router]) // Added router to dependencies if used in error handling

  useEffect(() => {
    setIsLoading(true); // Set loading true at the start of effect
    if (pb.authStore.isValid && pb.authStore.model) {
      console.log("[AuthProvider] Initial auth check: Valid session found.", pb.authStore.model);
      setUser(processUserData(pb.authStore.model as any));
    } else {
      console.log("[AuthProvider] Initial auth check: No valid session.");
      setUser(null);
    }
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log("[AuthProvider] AuthStore changed. New model:", model);
      setUser(model ? processUserData(model as any) : null);
      setIsLoading(false); // Also update loading state on change
    }, true); // `true` to immediately invoke with current state

    return () => {
      if (typeof unsubscribe === "function") {
        console.log("[AuthProvider] Unsubscribing from AuthStore changes.");
        unsubscribe();
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  const login = async (email: string, password: string) => {
    try {
      console.log(`[AuthProvider] Attempting login for email: ${email}`)
      const authData = await pb.collection("danusin_users").authWithPassword(email, password)
      setUser(processUserData(authData.record)) // authData.record contains the user model
      console.log("[AuthProvider] Login successful. User set:", authData.record.id)
      router.push("/dashboard") // Or a more appropriate redirect location
    } catch (error) {
      console.error("[AuthProvider] Login error:", error)
      throw error // Rethrow to be handled by the calling component
    }
  }

  const loginWithGoogle = async (isDanuserOnNewSignup = false) => {
    try {
      console.log("[AuthProvider] Attempting Google login.");
      // The 'google' provider name should match your PocketBase OAuth2 setup.
      const authData = await pb.collection("danusin_users").authWithOAuth2({ provider: "google" });
      console.log("[AuthProvider] Google auth data received:", authData);

      // authData.meta contains OAuth provider details (name, email, avatarUrl, isNew)
      // authData.record contains the PocketBase user record
      
      if (authData.meta?.isNew) {
        console.log("[AuthProvider] New user via Google. Updating profile with defaults.");
        const email = authData.meta?.email || `user_${authData.record.id}@example.com`; // Fallback email
        let username = authData.meta?.name ? authData.meta.name.replace(/\s+/g, "").toLowerCase() : email.split("@")[0].toLowerCase();
        username = username.replace(/[^a-z0-9._-]/g, "_"); // Sanitize username

        // Ensure username is unique (PocketBase might do this, but good to be robust)
        let isUsernameAvailable = false;
        let tempUsername = username;
        let attempt = 0;
        const MAX_ATTEMPTS = 5;
        while (!isUsernameAvailable && attempt < MAX_ATTEMPTS) {
          try {
            await pb.collection("danusin_users").getFirstListItem(`username="${tempUsername}"`);
            // Username taken, generate a new one
            console.log(`[AuthProvider] Username ${tempUsername} taken. Generating new.`);
            tempUsername = `${username}_${Math.random().toString(36).slice(2, 7)}`;
            attempt++;
          } catch (error: any) {
            if (error.status === 404) { // Not found, so username is available
              isUsernameAvailable = true;
              username = tempUsername;
              console.log(`[AuthProvider] Username ${username} is available.`);
            } else {
              console.error("[AuthProvider] Error checking username availability:", error);
              throw error; // Rethrow if it's not a 404
            }
          }
        }
        if (!isUsernameAvailable) {
          username = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; // More robust fallback
          console.log(`[AuthProvider] Could not find unique username quickly, using fallback: ${username}`);
        }
        
        const updateData: Partial<User> & { avatarUrl?: string } = {
          isdanuser: isDanuserOnNewSignup, // Set role based on input
          username: username,
          name: authData.meta?.name || username, // Use OAuth name or generated username
          email: email, // Ensure email is set if not already
          // PocketBase OAuth might automatically fetch the avatar. If not, or if you want to store it:
          // avatarUrl: authData.meta?.avatarUrl, // If you have a field to store the URL directly
          // Or, if PocketBase handles avatar download from URL, you might not need to do anything here for avatar.
          // Let's assume PocketBase handles setting the 'avatar' field if the provider gives an avatar URL.
        };

        console.log("[AuthProvider] Updating new Google user with data:", updateData);
        const updatedRecord = await pb.collection("danusin_users").update(authData.record.id, updateData);
        setUser(processUserData(updatedRecord));
        console.log("[AuthProvider] New Google user profile updated and set.");
        router.push("/register/keywords"); // Redirect new users to keywords page
      } else {
        console.log("[AuthProvider] Existing user via Google. Refreshing data.");
        // For existing users, their record is already in authData.record
        // We might want to refresh it to get the latest data if anything changed server-side
        const refreshedUser = await pb.collection("danusin_users").getOne(authData.record.id);
        setUser(processUserData(refreshedUser));
        console.log("[AuthProvider] Existing Google user data refreshed and set.");
        router.push("/dashboard"); // Redirect existing users to dashboard
      }
    } catch (error: any) {
      console.error("[AuthProvider] Google login error:", error, error.data);
      throw new Error(error.message || "Failed to register/login with Google");
    }
  };

  const register = async (
    email: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username: string,
    isDanuserFlag: boolean, // Renamed to avoid conflict with isDanuser in context
    phone: string,
  ) => {
    try {
      console.log(`[AuthProvider] Attempting registration for email: ${email}, username: ${username}, phone: ${phone}, isDanuser: ${isDanuserFlag}`);
      // Data to be sent to PocketBase for user creation.
      // Ensure field names match your 'danusin_users' collection schema exactly.
      const userDataToCreate = {
        email,
        password,
        passwordConfirm,
        name,
        username,
        isdanuser: isDanuserFlag, // Field name in PocketBase
        phone,                   // Field name in PocketBase
        // You can add other default fields here if your collection requires them
        // and they are not automatically set by PocketBase (e.g., emailVisibility: true)
      };

      await pb.collection("danusin_users").create(userDataToCreate);
      console.log("[AuthProvider] Registration successful. Authenticating...");
      
      // After successful creation, authenticate the user
      const authData = await pb.collection("danusin_users").authWithPassword(email, password);
      setUser(processUserData(authData.record)); // authData.record has the user model
      console.log("[AuthProvider] Authentication after registration successful. User set.");
      router.push("/register/keywords"); // Redirect to keywords page after registration
    } catch (error: any) {
      console.error("[AuthProvider] Registration error:", error?.data || error);
      // PocketBase errors often have details in error.data.data
      // Example: error.data.data.email.message
      throw error; // Rethrow to be handled by the calling component (RegisterPage)
    }
  };

  const logout = () => {
    console.log("[AuthProvider] Logging out user.");
    pb.authStore.clear();
    setUser(null);
    router.push("/login"); // Redirect to login page after logout
  };

  const updateUserLocation = async (lon: number, lat: number) => {
    const currentUserId = pb.authStore.model?.id || user?.id;
    if (!currentUserId) {
      console.warn("[AuthProvider] updateUserLocation: User ID not found.");
      throw new Error("User not authenticated to update location.");
    }
    try {
      console.log(`[AuthProvider] Updating profile location for user ID: ${currentUserId}`);
      // Assuming 'location' is a JSON field in PocketBase: { "lon": number, "lat": number }
      const updatedUserRecord = await pb.collection("danusin_users").update(currentUserId, {
        location: { lon, lat },
      });
      setUser(processUserData(updatedUserRecord)); // Update local user state
      console.log("[AuthProvider] Profile location updated successfully.");
    } catch (error) {
      console.error("[AuthProvider] Error updating user profile location:", error);
      throw error;
    }
  };

  const upsertLiveLocation = useCallback(
    async (location: LocationData, currentRecordId: string | null): Promise<string | null> => {
      const currentUserId = pb.authStore.model?.id;

      if (!currentUserId || !pb.authStore.isValid) {
        console.warn("[AuthProvider] upsertLiveLocation: User not authenticated or session invalid.");
        return null;
      }

      const dataPayload = {
        danuser_related: currentUserId, // Relation field to 'danusin_users'
        danuser_location: { lon: location.lon, lat: location.lat }, // JSON field
        isactive: true,
      };
      console.log(
        `[AuthProvider] upsertLiveLocation called. UserID: ${currentUserId}, RecordID: ${currentRecordId}, Payload:`,
        dataPayload,
      );

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
          console.warn(
            `[AuthProvider] Update for record ${currentRecordId} failed (404). Attempting to CREATE new record instead.`,
          );
          try {
            const newRecord = await pb.collection("danusin_users_location").create(dataPayload);
            console.log(
              `[AuthProvider] Live location record CREATED successfully after 404 on update. New ID: ${newRecord.id}`,
            );
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
    },
    [], // No dependencies, relies on pb.authStore.model.id inside
  );

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
    console.log(
      `[AuthProvider] deactivateLiveLocation called. UserID: ${currentUserId}, RecordID to deactivate: ${recordId}`,
    );
    try {
      // API rules should enforce: danuser_related = @request.auth.id for this update.
      await pb.collection("danusin_users_location").update(recordId, {
        isactive: false,
      });
      console.log(`[AuthProvider] Live location record DEACTIVATED: ${recordId}`);
    } catch (error: any) {
      console.error(`[AuthProvider] Error deactivating live location record ${recordId}:`, error);
      if (error.status !== 404) {
        throw error;
      } else {
        console.warn(
          `[AuthProvider] Record ${recordId} not found during deactivation. It might have been already deleted or belonged to another user.`,
        );
      }
    }
  }, []); // No dependencies, relies on pb.authStore.model.id inside

  // Effect for route protection
  useEffect(() => {
    if (!isLoading) { // Only run protection logic once initial loading is done
      const currentPath = pathname || "";
      if (!user && protectedRoutes.some((route) => currentPath.startsWith(route))) {
        console.log(`[AuthProvider] Protected route (${currentPath}), but no user. Redirecting to login.`);
        router.push("/login");
      }
      if ((!user || !user.isdanuser) && danUserOnlyRoutes.some((route) => currentPath.startsWith(route))) {
        console.log(
          `[AuthProvider] Danuser only route (${currentPath}), but user is not danuser or no user. Redirecting to dashboard (or a more appropriate page).`,
        );
        router.push(user ? "/dashboard" : "/login"); // If user exists but not danuser, go to dashboard, else login
      }
    }
  }, [pathname, user, isLoading, router]);

  const value = {
    user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    isDanuser: user?.isdanuser || false, // Derived from the user object
    updateUserLocation,
    upsertLiveLocation,
    deactivateLiveLocation,
    refreshUser,
  };

  // Show a loading skeleton or similar for protected routes while auth state is being determined
  if (isLoading && protectedRoutes.some((route) => (pathname || "").startsWith(route))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="space-y-4 w-full max-w-md p-4 bg-white rounded-lg shadow">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
