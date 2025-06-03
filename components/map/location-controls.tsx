"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { useMap } from "@/components/map/map-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, ChevronDown, ChevronUp, Clock, Loader2, MapPin, MapPinOff, RefreshCw, Users, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function LocationControls() {
  const {
    isSharingLocation,
    isLoading,
    error,
    userLocations,
    startSharingLocation,
    stopSharingLocation,
    setError,
    lastLocationUpdate,
  } = useMap()
  const { user } = useAuth()
  const { toast } = useToast()

  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown")
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isMinimized, setIsMinimized] = useState(false)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Format time ago for the last location update
  useEffect(() => {
    if (!lastLocationUpdate) {
      setTimeAgo("")
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const diffMs = now.getTime() - lastLocationUpdate.getTime()

      // Convert to appropriate time unit
      if (diffMs < 1000) {
        setTimeAgo("Just now")
      } else if (diffMs < 60000) {
        const seconds = Math.floor(diffMs / 1000)
        setTimeAgo(`${seconds} second${seconds > 1 ? "s" : ""} ago`)
      } else if (diffMs < 3600000) {
        const minutes = Math.floor(diffMs / 60000)
        setTimeAgo(`${minutes} minute${minutes > 1 ? "s" : ""} ago`)
      } else {
        const hours = Math.floor(diffMs / 3600000)
        setTimeAgo(`${hours} hour${hours > 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [lastLocationUpdate])

  // Check for geolocation permission
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      // Browser doesn't support permissions API, try geolocation directly
      navigator.geolocation.getCurrentPosition(
        () => setPermissionState("granted"),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionState("denied")
          } else {
            setPermissionState("prompt")
          }
        },
      )
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" })
      setPermissionState(permission.state)

      // Listen for permission changes
      permission.onchange = () => {
        setPermissionState(permission.state)

        // Show toast when permission changes
        if (permission.state === "granted") {
          toast({
            title: "Location Access Granted",
            description: "You can now share your location on the map.",
            variant: "default",
          })
        } else if (permission.state === "denied") {
          toast({
            title: "Location Access Denied",
            description: "Please enable location access in your browser settings to share your location.",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error("Error checking location permission:", err)
      setPermissionState("unknown")
    }
  }

  // Check permission on first render
  useEffect(() => {
    checkLocationPermission()
  }, [])

  const handleStartSharing = async () => {
    if (!user) {
      const errorMsg = "You must be logged in to share your location"
      setError(errorMsg)
      toast({
        title: "Authentication Required",
        description: errorMsg,
    variant: "destructive",
      })
      return
    }

    await checkLocationPermission()

    if (permissionState === "denied") {
      const errorMsg = "Location permission is denied. Please enable location access in your browser settings."
      setError(errorMsg)
      toast({
        title: "Permission Denied",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    startSharingLocation()
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <Card className="w-96 shadow-lg location-controls z-[950] mt-5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center">
            <span>Location Sharing</span>
            {isOnline ? <Wifi className="h-4 w-4 text-green-500 ml-2" /> : <WifiOff className="h-4 w-4 text-red-500 ml-2" />}
          </CardTitle>
          <CardDescription>Share your location on the map</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMinimize}>
          {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="space-y-4">
            {!isOnline && (
              <Alert variant="warning" className="mb-4">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Offline Mode</AlertTitle>
                <AlertDescription>
                  You are currently offline. Location sharing will be disabled until your connection is restored.
                </AlertDescription>
              </Alert>
            )}

            {!user && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>You need to be logged in to share your location.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{error}</span>
                  {error.includes("timed out") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setError(null)
                        if (isSharingLocation) {
                          stopSharingLocation().then(() => {
                            setTimeout(() => startSharingLocation(), 1000)
                          })
                        } else {
                          startSharingLocation()
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" /> Retry Location
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Active Users:</span>
              </div>
              <span className="font-bold text-lg">{userLocations.filter((u) => u.isActive).length}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <span className="font-medium">Status:</span>
              </div>
              <span className={`font-medium ${isSharingLocation ? "text-green-500" : "text-gray-500"}`}>
                {isSharingLocation ? "Sharing" : "Not Sharing"}
              </span>
            </div>

            {isSharingLocation && lastLocationUpdate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Last Update:</span>
                </div>
                <span className="font-medium text-blue-500">{timeAgo}</span>
              </div>
            )}
          </CardContent>

          <CardFooter>
            {isSharingLocation ? (
              <Button variant="destructive" className="w-full" onClick={stopSharingLocation} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPinOff className="mr-2 h-4 w-4" />}
                Stop Sharing
              </Button>
            ) : (
              <Button className="w-full" onClick={handleStartSharing} disabled={isLoading || !user || !isOnline}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                {!user ? "Login Required" : !isOnline ? "Offline" : "Start Sharing"}
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  )
}