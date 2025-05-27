"use client"

import type React from "react"

import type PocketBase from "pocketbase"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

// Update the PocketBase initialization to use the existing pb instance from lib/pocketbase
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"

// Center of Indonesia (approximate)
export const INDONESIA_CENTER = [118.0, -2.5]

// Update interval in milliseconds (10 seconds)
const LOCATION_UPDATE_INTERVAL = 10000

// Inactivity timeout in milliseconds (2 minutes)
const INACTIVITY_TIMEOUT = 120000

// Debounce time for location updates (milliseconds)
const LOCATION_UPDATE_DEBOUNCE = 2000

export interface UserLocation {
  id: string
  userId: string
  username?: string
  name?: string
  avatar?: string
  coordinates: [number, number] // [longitude, latitude]
  isActive: boolean
  isCurrentUser?: boolean
  updated?: string
  organizationId?: string
  organizationName?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
  target?: string
  targetProgress?: number
  phone?: string
  created: string
  updated: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  discount?: number
  slug: string
  images: string[]
  created: string
  updated: string
  organizationId?: string
  organizationName?: string
  organizationSlug?: string
}

export interface SearchResult {
  type: "product" | "organization" | "user"
  id: string
  name: string
  description?: string
  image?: string
  data: Product | Organization | UserLocation
}

interface MapContextType {
  userLocations: UserLocation[]
  selectedUser: UserLocation | null
  currentUserLocation: UserLocation | null
  isSharingLocation: boolean
  isLoading: boolean
  error: string | null
  pb: PocketBase
  selectUser: (user: UserLocation | null) => void
  startSharingLocation: () => Promise<void>
  stopSharingLocation: () => Promise<void>
  flyToUser: (coordinates: [number, number]) => void
  mapRef: React.MutableRefObject<mapboxgl.Map | null>
  userProducts: Product[]
  isLoadingProducts: boolean
  setError: React.Dispatch<React.SetStateAction<string | null>>
  lastLocationUpdate: Date | null
  searchResults: SearchResult[]
  isSearching: boolean
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  performSearch: () => Promise<void>
  clearSearch: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
  const [currentUserLocation, setCurrentUserLocation] = useState<UserLocation | null>(null)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const selectingUserRef = useRef(false)
  const locationIntervalRef = useRef<number | null>(null)
  const inactivityTimeoutRef = useRef<number | null>(null)
  const locationUpdateTimeoutRef = useRef<number | null>(null)
  const fetchingLocationsRef = useRef(false)
  const consecutiveErrorsRef = useRef(0)
  const { toast } = useToast()

  // Replace the [pb] useState with:
  const [pbInstance] = useState(() => pb)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const auth = useAuth()

  const flyToUser = (coordinates: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: 20,
        pitch: 60,
        bearing: 0,
        duration: 2000,
      })
    }
  }

  // Function to reset inactivity timeout
  const resetInactivityTimeout = () => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current)
    }

    // Only set a new timeout if we're sharing location
    if (isSharingLocation && currentUserLocation) {
      inactivityTimeoutRef.current = window.setTimeout(async () => {
        console.log("Inactivity timeout reached, marking user as inactive")
        toast({
          title: "Inactive Status",
          description: "You've been marked as inactive due to inactivity.",
          variant: "default",
        })
        await stopSharingLocation()
      }, INACTIVITY_TIMEOUT)
    }
  }

  // Set up activity tracking
  useEffect(() => {
    // Track user activity to reset the inactivity timeout
    const trackActivity = () => {
      resetInactivityTimeout()
    }

    // Add event listeners for user activity
    window.addEventListener("mousemove", trackActivity)
    window.addEventListener("keydown", trackActivity)
    window.addEventListener("click", trackActivity)
    window.addEventListener("touchstart", trackActivity)

    // Initial setup of inactivity timeout
    resetInactivityTimeout()

    return () => {
      // Clean up event listeners
      window.removeEventListener("mousemove", trackActivity)
      window.removeEventListener("keydown", trackActivity)
      window.removeEventListener("click", trackActivity)
      window.removeEventListener("touchstart", trackActivity)

      // Clear timeout
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [isSharingLocation, currentUserLocation])

  // Search functionality
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const results: SearchResult[] = []

      // Search for products
      const productRecords = await pbInstance.collection("danusin_product").getList(1, 10, {
        filter: `product_name~"${searchQuery}" || description~"${searchQuery}"`,
        sort: "-created",
        expand: "by_organization",
      })

      // Process product results
      for (const record of productRecords.items) {
        let organizationName = undefined
        let organizationSlug = undefined

        // Get organization info if available
        if (record.by_organization) {
          try {
            if (record.expand?.by_organization) {
              organizationName = record.expand.by_organization.organization_name
              organizationSlug = record.expand.by_organization.organization_slug
            } else {
              const org = await pbInstance.collection("danusin_organizations").getOne(record.by_organization)
              organizationName = org.organization_name
              organizationSlug = org.organization_slug
            }
          } catch (e) {
            console.warn("Could not fetch organization details:", e)
          }
        }

        const images =
          record.product_image?.map((image: string) => pbInstance.files.getUrl(record, image, { thumb: "300x300" })) ||
          []

        const product: Product = {
          id: record.id,
          name: record.product_name || "Unnamed Product",
          description: record.description || "",
          price: record.price || 0,
          discount: record.discount,
          slug: record.slug || "",
          images,
          created: record.created,
          updated: record.updated,
          organizationId: record.by_organization,
          organizationName,
          organizationSlug,
        }

        results.push({
          type: "product",
          id: record.id,
          name: record.product_name || "Unnamed Product",
          description: record.description?.replace(/<[^>]*>?/gm, "").substring(0, 100) || "",
          image: images[0],
          data: product,
        })
      }

      // Search for organizations
      const orgRecords = await pbInstance.collection("danusin_organizations").getList(1, 10, {
        filter: `organization_name~"${searchQuery}" || organization_description~"${searchQuery}" || organization_slug~"${searchQuery}"`,
        sort: "-created",
      })

      // Process organization results
      for (const record of orgRecords.items) {
        const image = record.organization_image
          ? pbInstance.files.getUrl(record, record.organization_image, { thumb: "300x300" })
          : undefined

        const organization: Organization = {
          id: record.id,
          name: record.organization_name,
          slug: record.organization_slug,
          image,
          description: record.organization_description?.replace(/<[^>]*>?/gm, "") || "",
          target: record.target,
          targetProgress: record.target_progress,
          phone: record.group_phone,
          created: record.created,
          updated: record.updated,
        }

        results.push({
          type: "organization",
          id: record.id,
          name: record.organization_name,
          description: record.organization_description?.replace(/<[^>]*>?/gm, "").substring(0, 100) || "",
          image,
          data: organization,
        })
      }

      // Search for users
      const userRecords = await pbInstance.collection("danusin_users").getList(1, 10, {
        filter: `name~"${searchQuery}" || username~"${searchQuery}"`,
        sort: "-created",
      })

      // Process user results
      for (const record of userRecords.items) {
        // Find user location if available
        const locationRecord = userLocations.find((loc) => loc.userId === record.id)

        if (locationRecord) {
          results.push({
            type: "user",
            id: record.id,
            name: record.name || record.username || `User ${record.id.substring(0, 5)}`,
            description: `@${record.username}`,
            image: record.avatar ? pbInstance.files.getUrl(record, record.avatar, { thumb: "100x100" }) : undefined,
            data: locationRecord,
          })
        }
      }

      setSearchResults(results)
    } catch (err) {
      console.error("Error performing search:", err)
      setError("Failed to perform search. Please try again.")
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  // Custom select user function to handle product fetching
  const handleSelectUser = (user: UserLocation | null) => {
    // Prevent duplicate selection events
    if (selectingUserRef.current) return

    selectingUserRef.current = true

    console.log("Selecting user:", user?.name || "none")

    // Always update the selected user state first
    setSelectedUser(user)

    // If user is selected, fly to their location
    if (user) {
      // Small delay to ensure state is updated before flying
      setTimeout(() => {
        if (mapRef.current) {
          flyToUser(user.coordinates)
        }
        selectingUserRef.current = false
      }, 50)
    } else {
      selectingUserRef.current = false
    }
  }

  // Fetch products when a user is selected
  useEffect(() => {
    if (!selectedUser) {
      setUserProducts([])
      return
    }

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true)

        // First, try to get the user's organization if not already available
        let orgId = selectedUser.organizationId

        if (!orgId && selectedUser.userId) {
          try {
            const userData = await pbInstance.collection("danusin_users").getOne(selectedUser.userId)
            if (userData.organizations && userData.organizations.length > 0) {
              orgId = userData.organizations[0]
            }
          } catch (err) {
            console.warn("Could not fetch user organization:", err)
          }
        }

        // If we have an organization ID, fetch products
        if (orgId) {
          console.log(`Fetching products for organization: ${orgId}`)
          const records = await pbInstance.collection("danusin_product").getList(1, 10, {
            filter: `by_organization="${orgId}"`,
            sort: "-created",
            expand: "by_organization",
          })

          console.log(`Found ${records.items.length} products`)

          const products: Product[] = await Promise.all(
            records.items.map(async (record) => {
              const images =
                record.product_image?.map((image: string) =>
                  pbInstance.files.getUrl(record, image, { thumb: "300x300" }),
                ) || []

              // Get organization info if available
              let organizationName = selectedUser.organizationName
              let organizationSlug = undefined

              if (record.by_organization) {
                try {
                  if (record.expand?.by_organization) {
                    organizationName = record.expand.by_organization.organization_name
                    organizationSlug = record.expand.by_organization.organization_slug
                  } else {
                    const org = await pbInstance.collection("danusin_organizations").getOne(record.by_organization)
                    organizationName = org.organization_name
                    organizationSlug = org.organization_slug
                  }
                } catch (e) {
                  console.warn("Could not fetch organization details:", e)
                }
              }

              return {
                id: record.id,
                name: record.product_name || "Unnamed Product",
                description: record.description || "",
                price: record.price || 0,
                discount: record.discount,
                slug: record.slug || "",
                images,
                created: record.created,
                updated: record.updated,
                organizationId: record.by_organization,
                organizationName,
                organizationSlug,
              }
            }),
          )

          setUserProducts(products)
        } else {
          // If no organization, try to fetch products by user directly
          console.log(`Fetching products for user: ${selectedUser.userId}`)
          const records = await pbInstance.collection("danusin_product").getList(1, 10, {
            filter: `added_by="${selectedUser.userId}"`,
            sort: "-created",
            expand: "by_organization",
          })

          console.log(`Found ${records.items.length} products by user`)

          const products: Product[] = await Promise.all(
            records.items.map(async (record) => {
              const images =
                record.product_image?.map((image: string) =>
                  pbInstance.files.getUrl(record, image, { thumb: "300x300" }),
                ) || []

              // Get organization info if available
              let organizationName = undefined
              let organizationSlug = undefined

              if (record.by_organization) {
                try {
                  if (record.expand?.by_organization) {
                    organizationName = record.expand.by_organization.organization_name
                    organizationSlug = record.expand.by_organization.organization_slug
                  } else {
                    const org = await pbInstance.collection("danusin_organizations").getOne(record.by_organization)
                    organizationName = org.organization_name
                    organizationSlug = org.organization_slug
                  }
                } catch (e) {
                  console.warn("Could not fetch organization details:", e)
                }
              }

              return {
                id: record.id,
                name: record.product_name || "Unnamed Product",
                description: record.description || "",
                price: record.price || 0,
                discount: record.discount,
                slug: record.slug || "",
                images,
                created: record.created,
                updated: record.updated,
                organizationId: record.by_organization,
                organizationName,
                organizationSlug,
              }
            }),
          )

          setUserProducts(products)
        }
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setUserProducts([]) // Clear products on error
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [selectedUser, pbInstance])

  useEffect(() => {
    // Initial fetch of user locations - now including inactive users
    const fetchUserLocations = async () => {
      // Prevent concurrent fetches
      if (fetchingLocationsRef.current) return

      fetchingLocationsRef.current = true

      try {
        setIsLoading(true)

        // Use the safeRequest helper with retries
        const records = await pbInstance.collection("danusin_users_location").getList(1, 100, {
          expand: "danuser_related",
        })

        const locations: UserLocation[] = []

        // Process each location record
        for (const record of records.items) {
          let user = record.expand?.danuser_related

          // If user data is not expanded, fetch it separately
          if (!user && record.danuser_related) {
            try {
              user = await pbInstance.collection("danusin_users").getOne(record.danuser_related)
            } catch (e) {
              console.warn(`Could not fetch user details for ${record.danuser_related}:`, e)
            }
          }

          // Get organization info if user has organizations field
          let organizationId = undefined
          let organizationName = undefined

          if (user?.organizations && user.organizations.length > 0) {
            try {
              // Fetch the first organization
              const orgId = user.organizations[0]
              const org = await pbInstance.collection("danusin_organizations").getOne(orgId)
              organizationId = org.id
              organizationName = org.organization_name
            } catch (e) {
              console.warn("Could not fetch organization details:", e)
            }
          }

          locations.push({
            id: record.id,
            userId: record.danuser_related,
            username: user?.username || undefined,
            name: user?.name || user?.username || `User ${record.danuser_related.substring(0, 5)}`,
            avatar: user?.avatar ? pbInstance.files.getUrl(user, user.avatar, { thumb: "100x100" }) : undefined,
            coordinates: [record.danuser_location.lon, record.danuser_location.lat],
            isActive: record.isactive,
            isCurrentUser: pbInstance.authStore.model?.id === record.danuser_related,
            updated: record.updated,
            organizationId,
            organizationName,
          })
        }

        setUserLocations(locations)

        // Set current user location if it exists
        const currentUser = locations.find((loc) => loc.isCurrentUser && loc.isActive)
        if (currentUser) {
          setCurrentUserLocation(currentUser)
          setIsSharingLocation(true)
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching user locations:", err)
        setError(`Failed to load user locations: ${err.message || "Unknown error"}`)
        toast({
          title: "Error",
          description: "Failed to load user locations. Please check your connection.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        fetchingLocationsRef.current = false
      }
    }

    fetchUserLocations()

    // Subscribe to realtime updates
    const subscribe = async () => {
      try {
        await pbInstance.collection("danusin_users_location").subscribe("*", async (data) => {
          if (data.action === "create" || data.action === "update") {
            const record = data.record
            let user = record.expand?.danuser_related

            // Fetch user details if not expanded
            if (!user && record.danuser_related) {
              try {
                user = await pbInstance.collection("danusin_users").getOne(record.danuser_related)
              } catch (e) {
                console.warn("Could not fetch user details:", e)
              }
            }

            // Get organization info if available
            let organizationId = undefined
            let organizationName = undefined

            if (user?.organizations && user.organizations.length > 0) {
              try {
                const orgId = user.organizations[0]
                const org = await pbInstance.collection("danusin_organizations").getOne(orgId)
                organizationId = org.id
                organizationName = org.organization_name
              } catch (e) {
                console.warn("Could not fetch organization details:", e)
              }
            }

            const newLocation: UserLocation = {
              id: record.id,
              userId: record.danuser_related,
              username: user?.username || undefined,
              name: user?.name || user?.username || `User ${record.danuser_related.substring(0, 5)}`,
              avatar: user?.avatar ? pbInstance.files.getUrl(user, user.avatar, { thumb: "100x100" }) : undefined,
              coordinates: [record.danuser_location.lon, record.danuser_location.lat],
              isActive: record.isactive,
              isCurrentUser: pbInstance.authStore.model?.id === record.danuser_related,
              updated: record.updated,
              organizationId,
              organizationName,
            }

            setUserLocations((prev) => {
              const existing = prev.findIndex((loc) => loc.id === record.id)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = newLocation
                return updated
              } else {
                return [...prev, newLocation]
              }
            })

            // Update current user location if this is the current user
            if (newLocation.isCurrentUser && newLocation.isActive) {
              setCurrentUserLocation(newLocation)
              setIsSharingLocation(true)
            } else if (newLocation.isCurrentUser && !newLocation.isActive) {
              setIsSharingLocation(false)
            }
          } else if (data.action === "delete") {
            setUserLocations((prev) => prev.filter((loc) => loc.id !== data.record.id))

            // Clear current user location if deleted
            if (currentUserLocation?.id === data.record.id) {
              setCurrentUserLocation(null)
              setIsSharingLocation(false)
            }
          }
        })
      } catch (err) {
        console.error("Failed to subscribe to realtime updates:", err)
      }
    }

    subscribe()

    return () => {
      pbInstance.collection("danusin_users_location").unsubscribe()
    }
  }, [pbInstance])

  // Debounced function to update location
  const debouncedUpdateLocation = (recordId: string, longitude: number, latitude: number) => {
    // Clear any existing timeout
    if (locationUpdateTimeoutRef.current) {
      window.clearTimeout(locationUpdateTimeoutRef.current)
    }

    // Set a new timeout
    locationUpdateTimeoutRef.current = window.setTimeout(async () => {
      try {
        if (auth.upsertLiveLocation) {
          await auth.upsertLiveLocation({ lon: longitude, lat: latitude }, recordId)
        } else if (window.authProvider?.upsertLiveLocation) {
          await window.authProvider.upsertLiveLocation({ lon: longitude, lat: latitude }, recordId)
        } else {
          await pbInstance.collection("danusin_users_location").update(recordId, {
            danuser_location: { lat: latitude, lon: longitude },
            isactive: true,
          })
        }

        // Update last location update timestamp
        setLastLocationUpdate(new Date())

        // Reset consecutive errors counter on success
        consecutiveErrorsRef.current = 0
      } catch (err: any) {
        console.error("Error updating location:", err)
        if (err.message) {
          console.error("Error details:", err.message)
        }
        if (err.data) {
          console.error("Error data:", err.data)
        }

        // Increment consecutive errors counter
        consecutiveErrorsRef.current += 1

        // Show toast notification after multiple consecutive errors
        if (consecutiveErrorsRef.current >= 3) {
          toast({
            title: "Connection Issues",
            description: "Having trouble updating your location. Please check your connection.",
            variant: "destructive",
          })
        }
      }
    }, LOCATION_UPDATE_DEBOUNCE)
  }

  // Function to update location
  const updateLocation = async (recordId: string) => {
    try {
      // Reset inactivity timeout
      resetInactivityTimeout()

      // Get current position with better error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            // Handle specific geolocation errors
            if (err.code === 1) {
              reject(new Error("Location permission denied. Please enable location access."))
            } else if (err.code === 2) {
              reject(new Error("Location unavailable. Please try again."))
            } else if (err.code === 3) {
              reject(new Error("Location request timed out. Please check your connection and try again."))
            } else {
              reject(err)
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increase timeout to 15 seconds
            maximumAge: 5000, // Allow cached positions up to 5 seconds old
          },
        )
      })

      const { latitude, longitude } = position.coords
      console.log(`Updating location at ${new Date().toLocaleTimeString()}: ${latitude}, ${longitude}`)

      // Update local state immediately for a responsive UI
      setCurrentUserLocation((prev) => {
        if (!prev) return null
        return {
          ...prev,
          coordinates: [longitude, latitude],
          updated: new Date().toISOString(),
        }
      })

      // Use debounced update to prevent too many requests
      debouncedUpdateLocation(recordId, longitude, latitude)
    } catch (err: any) {
      console.error("Error updating location:", err)

      // Provide more specific error messages based on the error
      const errorMessage = err.message || "Unknown error updating location"
      console.error("Error details:", errorMessage)

      if (err.code) {
        console.error("Geolocation error code:", err.code)
      }

      // Increment consecutive errors counter
      consecutiveErrorsRef.current += 1

      // Only show toast for timeout errors or after multiple consecutive errors
      if (errorMessage.includes("timed out") || consecutiveErrorsRef.current >= 3) {
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        })

        // Set a user-friendly error message
        setError(errorMessage)
      }

      // If we've had multiple timeouts, suggest stopping and restarting location sharing
      if (errorMessage.includes("timed out")) {
        console.log("Location timeout detected, will retry on next interval")
      }
    }
  }

  const startSharingLocation = async () => {
    if (!pbInstance.authStore.isValid) {
      const errorMsg = "You must be logged in to share your location"
      setError(errorMsg)
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setError(null) // Clear any previous errors
      consecutiveErrorsRef.current = 0 // Reset consecutive errors counter

      // Get current position with better error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            // Handle specific geolocation errors
            if (err.code === 1) {
              reject(new Error("Location permission denied. Please enable location access."))
            } else if (err.code === 2) {
              reject(new Error("Location unavailable. Please try again."))
            } else if (err.code === 3) {
              reject(new Error("Location request timed out. Please check your connection and try again."))
            } else {
              reject(err)
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increase timeout to 15 seconds
            maximumAge: 5000, // Allow cached positions up to 5 seconds old
          },
        )
      })

      const { latitude, longitude } = position.coords

      // Create or update location record using the auth provider's method if available
      const data = {
        danuser_related: pbInstance.authStore.model?.id,
        danuser_location: { lat: latitude, lon: longitude },
        isactive: true,
      }

      let recordId
      try {
        // Try to use the auth provider if available
        if (auth.upsertLiveLocation) {
          recordId = await auth.upsertLiveLocation({ lon: longitude, lat: latitude }, currentUserLocation?.id || null)
        } else if (window.authProvider?.upsertLiveLocation) {
          recordId = await window.authProvider.upsertLiveLocation(
            { lon: longitude, lat: latitude },
            currentUserLocation?.id || null,
          )
        } else {
          // Fallback to direct PocketBase call
          let record
          if (currentUserLocation) {
            record = await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, data)
          } else {
            record = await pbInstance.collection("danusin_users_location").create(data)
          }
          recordId = record.id
        }
      } catch (err: any) {
        console.error("Error updating location record:", err)
        const errorMessage = err.message || "Unknown error updating location record"
        console.error("Error details:", errorMessage)

        if (err.data) {
          console.error("Error data:", err.data)
        }

        toast({
          title: "Location Error",
          description: `Failed to update location: ${errorMessage}`,
          variant: "destructive",
        })

        throw new Error(`Failed to update location: ${errorMessage}`)
      }

      if (!recordId) {
        const errorMsg = "Failed to create or update location record"
        toast({
          title: "Location Error",
          description: errorMsg,
          variant: "destructive",
        })
        throw new Error(errorMsg)
      }

      const newLocation: UserLocation = {
        id: recordId,
        userId: pbInstance.authStore.model?.id as string,
        username: pbInstance.authStore.model?.username,
        name:
          pbInstance.authStore.model?.name ||
          pbInstance.authStore.model?.username ||
          `User ${pbInstance.authStore.model?.id.substring(0, 5)}`,
        coordinates: [longitude, latitude],
        isActive: true,
        isCurrentUser: true,
        updated: new Date().toISOString(),
      }

      setCurrentUserLocation(newLocation)
      setIsSharingLocation(true)
      setLastLocationUpdate(new Date())
      setError(null)

      // Show success toast
      toast({
        title: "Location Sharing Started",
        description: "Your location is now being shared on the map.",
        variant: "default",
      })

      // Reset inactivity timeout
      resetInactivityTimeout()

      // Fly to user location
      flyToUser([longitude, latitude])

      // Set up interval to update location every 10 seconds
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current)
      }

      locationIntervalRef.current = window.setInterval(() => {
        updateLocation(recordId)
      }, LOCATION_UPDATE_INTERVAL)

      // Store the interval ID in window for cleanup
      window.locationIntervalId = locationIntervalRef.current

      // Also set up watchPosition for more accurate updates between intervals
      // with better error handling
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            const newLon = pos.coords.longitude
            const newLat = pos.coords.latitude

            // Only update if it's been at least 5 seconds since the last update
            // This prevents too many updates from watchPosition
            const now = new Date()
            if (lastLocationUpdate && now.getTime() - lastLocationUpdate.getTime() < 5000) {
              return
            }

            // Update local state immediately
            setCurrentUserLocation((prev) => {
              if (!prev) return null
              return {
                ...prev,
                coordinates: [newLon, newLat],
                updated: new Date().toISOString(),
              }
            })

            // Use debounced update to prevent too many requests
            debouncedUpdateLocation(recordId, newLon, newLat)

            // Reset inactivity timeout
            resetInactivityTimeout()
          } catch (err: any) {
            console.error("Error updating location from watch:", err)
            const errorMessage = err.message || "Unknown error updating location from watch"
            console.error("Error details:", errorMessage)
          }
        },
        (err) => {
          // Don't show errors for every watchPosition error as they can be frequent
          // Just log them unless it's a permission error
          console.error("Geolocation watch error:", err)
          if (err.code === 1) {
            const errorMsg = "Location permission denied. Please enable location access."
            setError(errorMsg)
            toast({
              title: "Permission Error",
              description: errorMsg,
              variant: "destructive",
            })
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increase timeout to 15 seconds
          maximumAge: 5000, // Allow cached positions up to 5 seconds old
        },
      )

      // Store watch ID for cleanup
      window.locationWatchId = watchId
    } catch (err: any) {
      console.error("Error sharing location:", err)
      const errorMessage = err.message || "Unknown error sharing location"
      setError(`Failed to share location: ${errorMessage}`)

      // Show toast notification
      toast({
        title: "Location Sharing Failed",
        description: errorMessage,
        variant: "destructive",
      })

      // If location sharing fails, make sure we clean up any partial setup
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current)
        locationIntervalRef.current = null
      }

      if (window.locationWatchId) {
        navigator.geolocation.clearWatch(window.locationWatchId)
        delete window.locationWatchId
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stopSharingLocation = async () => {
    if (!currentUserLocation) return

    try {
      setIsLoading(true)

      // Clear inactivity timeout
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }

      // Clear location update timeout
      if (locationUpdateTimeoutRef.current) {
        window.clearTimeout(locationUpdateTimeoutRef.current)
        locationUpdateTimeoutRef.current = null
      }

      // Clear interval
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current)
        locationIntervalRef.current = null
        delete window.locationIntervalId
      }

      // Clear watch position
      if (window.locationWatchId) {
        navigator.geolocation.clearWatch(window.locationWatchId)
        delete window.locationWatchId
      }

      // Use auth provider if available
      if (auth.deactivateLiveLocation) {
        await auth.deactivateLiveLocation(currentUserLocation.id)
      } else if (window.authProvider?.deactivateLiveLocation) {
        await window.authProvider.deactivateLiveLocation(currentUserLocation.id)
      } else {
        await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, {
          isactive: false,
        })
      }

      setIsSharingLocation(false)
      setLastLocationUpdate(null)
      setError(null)

      // Show success toast
      toast({
        title: "Location Sharing Stopped",
        description: "You are no longer sharing your location on the map.",
        variant: "default",
      })
    } catch (err: any) {
      console.error("Error stopping location sharing:", err)
      const errorMsg = `Failed to stop sharing location: ${err.message || "Unknown error"}`
      setError(errorMsg)

      // Show error toast
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current)
        locationIntervalRef.current = null
      }

      if (window.locationWatchId) {
        navigator.geolocation.clearWatch(window.locationWatchId)
        delete window.locationWatchId
      }

      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }

      if (locationUpdateTimeoutRef.current) {
        window.clearTimeout(locationUpdateTimeoutRef.current)
        locationUpdateTimeoutRef.current = null
      }
    }
  }, [])

  // Connection loss detection
  useEffect(() => {
    let connectionLostTimeout: number | null = null

    const handleConnectionLoss = async () => {
      console.log("Connection lost, starting 1-minute timer")

      // Show toast notification
      toast({
        title: "Connection Lost",
        description: "You'll be marked as inactive in 1 minute if connection isn't restored.",
        variant: "warning",
      })

      connectionLostTimeout = window.setTimeout(async () => {
        if (currentUserLocation?.id) {
          console.log("Connection lost for 1 minute, marking user as inactive")
          try {
            if (auth.deactivateLiveLocation) {
              await auth.deactivateLiveLocation(currentUserLocation.id)
            } else if (window.authProvider?.deactivateLiveLocation) {
              await window.authProvider.deactivateLiveLocation(currentUserLocation.id)
            } else {
              await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, {
                isactive: false,
              })
            }

            setIsSharingLocation(false)
            setCurrentUserLocation(null)

            // Show toast notification
            toast({
              title: "Marked as Inactive",
              description: "You've been marked as inactive due to connection loss.",
              variant: "destructive",
            })
          } catch (err) {
            console.error("Error marking user as inactive after connection loss:", err)
          }
        }
      }, 60000) // 1 minute
    }

    const handleConnectionRestore = () => {
      console.log("Connection restored")
      if (connectionLostTimeout) {
        window.clearTimeout(connectionLostTimeout)
        connectionLostTimeout = null

        // Show toast notification
        toast({
          title: "Connection Restored",
          description: "Your connection has been restored.",
          variant: "default",
        })
      }
    }

    window.addEventListener("offline", handleConnectionLoss)
    window.addEventListener("online", handleConnectionRestore)

    return () => {
      window.removeEventListener("offline", handleConnectionLoss)
      window.removeEventListener("online", handleConnectionRestore)
      if (connectionLostTimeout) {
        window.clearTimeout(connectionLostTimeout)
      }
    }
  }, [currentUserLocation, auth, toast])

  return (
    <MapContext.Provider
      value={{
        userLocations,
        selectedUser,
        currentUserLocation,
        isSharingLocation,
        isLoading,
        error,
        pb: pbInstance,
        selectUser: handleSelectUser,
        startSharingLocation,
        stopSharingLocation,
        flyToUser,
        mapRef,
        userProducts,
        isLoadingProducts,
        setError,
        lastLocationUpdate,
        searchResults,
        isSearching,
        searchQuery,
        setSearchQuery,
        performSearch,
        clearSearch,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
