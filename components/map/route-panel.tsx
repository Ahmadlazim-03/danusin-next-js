"use client"
import { useMap } from "@/components/map/map-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, CornerDownRight, Loader2, Navigation, X } from "lucide-react"

// Define interfaces for the data structures used in this component
interface RouteStep {
  instruction: string
  distance: number // in meters
  duration: number // in seconds
  // id?: string | number; // Optional: if steps have unique IDs for more stable keys
}

interface Route {
  duration: number // total duration in seconds
  distance: number // total distance in meters
  steps: RouteStep[]
  // Potentially other properties from your routing service
}

interface SelectedUser {
  name: string
  /**
   * Coordinates array. Ensure consistency in order (e.g., [longitude, latitude] or [latitude, longitude]).
   * The code currently uses coordinates[1] as latitude and coordinates[0] as longitude.
   */
  coordinates: [number, number]
  // Potentially other user properties
}

// It's beneficial if useMap() hook provides these types.
// For this component, we'll assume these types for the destructured values.
interface UseMapReturn {
  route: Route | null | undefined
  isRoutingLoading: boolean
  routingError: string | null | undefined
  clearRoute: () => void
  selectedUser: SelectedUser | null | undefined
}

export function RoutePanel() {
  const { route, isRoutingLoading, routingError, clearRoute, selectedUser } = useMap() as unknown as UseMapReturn // Cast for type safety within this component

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    } else {
      return `${(meters / 1000).toFixed(1)} km`
    }
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} sec`
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} min`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours} hr ${minutes} min`
    }
  }

  // If no route is available, don't render anything
  if (!route) return null

  const handleOpenInMaps = () => {
    if (selectedUser && selectedUser.coordinates && navigator.share) {
      // Assuming selectedUser.coordinates is [longitude, latitude]
      // based on lat = coordinates[1] and lng = coordinates[0]
      const longitude = selectedUser.coordinates[0]
      const latitude = selectedUser.coordinates[1]

      // Correct Google Maps URL: https://www.google.com/maps?q=latitude,longitude
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

      navigator
        .share({
          title: `Directions to ${selectedUser.name}`,
          url: mapsUrl,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else if (selectedUser && selectedUser.coordinates) {
      // Fallback for browsers that don't support navigator.share
      const longitude = selectedUser.coordinates[0]
      const latitude = selectedUser.coordinates[1]
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
      window.open(mapsUrl, "_blank")
    } else {
      console.warn("Cannot open in maps: Selected user or coordinates missing, or Web Share API not supported.")
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[900] animate-fade-in pointer-events-auto">
      <Card className="w-full max-w-sm sm:w-96 shadow-lg max-h-[70vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-start justify-between flex-shrink-0">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-primary" />
              Route Navigation
            </CardTitle>
            {selectedUser && (
              <div className="text-sm text-muted-foreground mt-1">
                To: {selectedUser.name}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={clearRoute} aria-label="Close route panel">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-grow py-3">
          {isRoutingLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 mt-2 text-muted-foreground">Calculating route...</span>
            </div>
          ) : routingError ? (
            <div className="text-center py-4 text-destructive h-full flex flex-col justify-center items-center">
              <p className="font-semibold">Error calculating route</p>
              <p className="text-sm mt-1">{routingError}</p>
              <p className="text-xs mt-2 text-muted-foreground">Please try again or choose a different destination.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium text-sm">Estimated Time:</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/50">
                  {formatDuration(route.duration)}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50">
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium text-sm">Distance:</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/50">
                  {formatDistance(route.distance)}
                </Badge>
              </div>

              <div className="mt-3">
                <h4 className="font-medium mb-1.5 text-sm px-1">Directions:</h4>
                <div className="space-y-1.5">
                  {route.steps.map((step, index) => (
                    <div
                      key={step.instruction + index} // Consider a more stable key if available (e.g., step.id)
                      className="flex items-start p-2 rounded-md bg-muted/50 hover:bg-muted/80"
                    >
                      <div className="mr-2.5 mt-0.5 flex-shrink-0">
                        {index === 0 ? (
                          <ArrowRight className="h-4 w-4 text-primary" />
                        ) : (
                          <CornerDownRight className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{step.instruction}</p>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>{formatDistance(step.distance)}</span>
                          <span>{formatDuration(step.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>

        {!isRoutingLoading && !routingError && (
          <CardFooter className="flex justify-between pt-3 flex-shrink-0">
            <Button variant="outline" onClick={clearRoute}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={handleOpenInMaps}
              disabled={!selectedUser || !selectedUser.coordinates}
            >
              Open in Maps
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}