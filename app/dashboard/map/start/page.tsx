"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { RealtimeMapViewer } from "@/components/map/realtime-map-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { AlertCircle, MapPin, Play, StopCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function StartDanusinPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSharing, setIsSharing] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const isMounted = useRef(true)

  // Check if geolocation is available
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
    }
    return () => {
      isMounted.current = false
    }
  }, [])

  // Subscribe to nearby users when component mounts
  useEffect(() => {
    if (!user) return

    // Subscribe to changes in danusin_users collection
    const unsubscribe = pb.collection("danusin_users").subscribe("*", (e) => {
      if (!isMounted.current) return
      if (e.action === "update") {
        // Update the user in the nearby users list
        setNearbyUsers((prev) => {
          const index = prev.findIndex((u) => u.id === e.record.id)
          const updatedUser = {
            ...e.record,
            location: e.record.location ? { lat: e.record.location.lat, lng: e.record.location.lon } : null
          }
          if (index >= 0) {
            const newUsers = [...prev]
            newUsers[index] = updatedUser
            return newUsers
          }
          return [...prev, updatedUser]
        })
      }
    })

    // Fetch initial nearby users
    fetchNearbyUsers()

    return () => {
      pb.collection("danusin_users").unsubscribe()
    }
  }, [user])

  const fetchNearbyUsers = async () => {
    if (!user || !isMounted.current) return

    try {
      // Disable auto-cancellation for this request
      const result = await pb.collection("danusin_users").getList(1, 100, {
        filter: `isdanuser=true && id!="${user.id}"`,
        $autoCancel: false // Prevent auto-cancellation
      })

      if (!isMounted.current) return

      // Map lon to lng for Mapbox compatibility
      const mappedUsers = result.items.map((item) => ({
        ...item,
        location: item.location ? { lat: item.location.lat, lng: item.location.lon } : null
      }))

      setNearbyUsers(mappedUsers)
    } catch (error) {
      if (!isMounted.current) return
      console.error("Error fetching nearby users:", error)
      setError("Failed to fetch nearby users")
    }
  }

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to share your location",
        variant: "destructive",
      })
      return
    }

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMounted.current) return
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setError(null)

        // Update user location in PocketBase
        updateUserLocation(latitude, longitude)
      },
      (error) => {
        if (!isMounted.current) return
        console.error("Error getting location:", error)
        setError(getGeolocationErrorMessage(error.code))
        stopSharing()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    setWatchId(id)
    setIsSharing(true)

    toast({
      title: "Location sharing started",
      description: "Your location is now being shared with nearby Danusin users",
    })
  }

  const stopSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    setIsSharing(false)

    // Update user to stop sharing
    if (user) {
      updateUserDanusinStatus(false)
    }

    toast({
      title: "Location sharing stopped",
      description: "Your location is no longer being shared",
    })
  }

  const updateUserLocation = async (lat: number, lng: number) => {
    if (!user || !isMounted.current) return

    try {
      await pb.collection("danusin_users").update(user.id, {
        location: {
          lat,
          lon: lng, // Store as 'lon' in PocketBase for consistency with existing schema
        },
      })
    } catch (error) {
      if (!isMounted.current) return
      console.error("Error updating user location:", error)
    }
  }

  const updateUserDanusinStatus = async (status: boolean) => {
    if (!user || !isMounted.current) return

    try {
      await pb.collection("danusin_users").update(user.id, {
        isdanuser: status,
      })
    } catch (error) {
      if (!isMounted.current) return
      console.error("Error updating user status:", error)
    }
  }

  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "You denied permission to use your location"
      case 2:
        return "Location information is unavailable"
      case 3:
        return "The request to get your location timed out"
      default:
        return "An unknown error occurred"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Start Danusin!</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Share Your Location</CardTitle>
            <CardDescription>Start sharing your location to connect with nearby Danusin users</CardDescription>
          </CardHeader>
          <CardContent>
            {location ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-green-500" />
                  <span>Location active</span>
                </div>
                <p className="text-sm text-muted-foreground">Latitude: {location.lat.toFixed(6)}</p>
                <p className="text-sm text-muted-foreground">Longitude: {location.lng.toFixed(6)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Your location will appear here once you start sharing</p>
            )}
          </CardContent>
          <CardFooter>
            {isSharing ? (
              <Button variant="destructive" className="w-full" onClick={stopSharing}>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Sharing
              </Button>
            ) : (
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={startSharing}>
                <Play className="mr-2 h-4 w-4" />
                Start Sharing
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Nearby Danusin Users</CardTitle>
            <CardDescription>See other users who are currently sharing their location</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <RealtimeMapViewer currentUserLocation={location} nearbyUsers={nearbyUsers} isSharing={isSharing} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}