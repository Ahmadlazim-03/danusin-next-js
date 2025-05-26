"use client"

import type React from "react"

import type PocketBase from "pocketbase"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Update the PocketBase initialization to use the existing pb instance from lib/pocketbase
import { pb } from "@/lib/pocketbase"

// Center of Indonesia (approximate)
export const INDONESIA_CENTER = [118.0, -2.5]

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

  // Replace the [pb] useState with:
  const [pbInstance] = useState(() => pb)
  const mapRef = { current: null } as React.MutableRefObject<mapboxgl.Map | null>

  const flyToUser = (coordinates: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: 15,
        pitch: 60,
        bearing: 0,
        duration: 2000,
      })
    }
  }

  // Fetch products when a user is selected
  useEffect(() => {
    if (!selectedUser || !selectedUser.organizationId) {
      setUserProducts([])
      return
    }

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const records = await pbInstance.collection("danusin_product").getList(1, 10, {
          filter: `by_organization="${selectedUser.organizationId}"`,
          sort: "-created",
        })

        const products: Product[] = records.items.map((record) => {
          const images =
            record.product_image?.map((image: string) =>
              pbInstance.files.getUrl(record, image, { thumb: "300x300" }),
            ) || []

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
          }
        })

        setUserProducts(products)
      } catch (err: any) {
        console.error("Error fetching products:", err)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [selectedUser, pbInstance])

  useEffect(() => {
    // Initial fetch of user locations - now including inactive users
    const fetchUserLocations = async () => {
      try {
        setIsLoading(true)
        // Changed filter to include all users, not just active ones
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
              organizationName = org.name
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
        setError(`Failed to load user locations: ${err.message}`)
      } finally {
        setIsLoading(false)
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
                organizationName = org.name
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

  const startSharingLocation = async () => {
    if (!pbInstance.authStore.isValid) {
      setError("You must be logged in to share your location")
      return
    }

    try {
      setIsLoading(true)

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords

      // Create or update location record using the auth provider's method if available
      // This is a fallback implementation if the auth provider is not available
      const data = {
        danuser_related: pbInstance.authStore.model?.id,
        danuser_location: { lat: latitude, lon: longitude },
        isactive: true,
      }

      let recordId
      try {
        // Try to use the window.authProvider if available (we'll add this later)
        if (window.authProvider?.upsertLiveLocation) {
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
        throw err
      }

      if (!recordId) {
        throw new Error("Failed to create or update location record")
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
      setError(null)

      // Fly to user location
      flyToUser([longitude, latitude])

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            const newLon = pos.coords.longitude
            const newLat = pos.coords.latitude

            if (window.authProvider?.upsertLiveLocation) {
              await window.authProvider.upsertLiveLocation({ lon: newLon, lat: newLat }, recordId)
            } else {
              await pbInstance.collection("danusin_users_location").update(recordId, {
                danuser_location: { lat: newLat, lon: newLon },
                isactive: true,
              })
            }

            // Update local state
            setCurrentUserLocation((prev) => {
              if (!prev) return null
              return {
                ...prev,
                coordinates: [newLon, newLat],
                updated: new Date().toISOString(),
              }
            })
          } catch (err: any) {
            console.error("Error updating location:", err)
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError(`Geolocation error: ${err.message}`)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )

      // Store watch ID for cleanup
      window.locationWatchId = watchId
    } catch (err: any) {
      console.error("Error sharing location:", err)
      setError(`Failed to share location: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const stopSharingLocation = async () => {
    if (!currentUserLocation) return

    try {
      setIsLoading(true)

      // Clear watch position
      if (window.locationWatchId) {
        navigator.geolocation.clearWatch(window.locationWatchId)
        window.locationWatchId = undefined
      }

      // Use auth provider if available
      if (window.authProvider?.deactivateLiveLocation) {
        await window.authProvider.deactivateLiveLocation(currentUserLocation.id)
      } else {
        await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, {
          isactive: false,
        })
      }

      setIsSharingLocation(false)
      setError(null)
    } catch (err: any) {
      console.error("Error stopping location sharing:", err)
      setError(`Failed to stop sharing location: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

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
        selectUser: setSelectedUser,
        startSharingLocation,
        stopSharingLocation,
        flyToUser,
        mapRef,
        userProducts,
        isLoadingProducts,
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
