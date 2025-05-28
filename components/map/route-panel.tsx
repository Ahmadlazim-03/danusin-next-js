"use client"
import { useMap } from "@/components/map/map-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, CornerDownRight, Loader2, Navigation, X } from "lucide-react"

export function RoutePanel() {
  const { route, isRoutingLoading, routingError, clearRoute, selectedUser } = useMap()

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    } else {
      return `${(meters / 1000).toFixed(1)} km`
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
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

  return (
    <div className="fixed bottom-4 right-4 z-[900] animate-fade-in pointer-events-auto">
      <Card className="w-96 shadow-lg max-h-[60vh] overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-blue-500" />
              Navigation
            </CardTitle>
            {selectedUser && <div className="text-sm text-gray-500 dark:text-gray-400">To: {selectedUser.name}</div>}
          </div>
          <Button variant="ghost" size="icon" onClick={clearRoute}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-auto max-h-[40vh]">
          {isRoutingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2">Calculating route...</span>
            </div>
          ) : routingError ? (
            <div className="text-center py-4 text-red-500">
              <p>{routingError}</p>
              <p className="text-sm mt-2">Please try again or choose a different destination.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Estimated Time:</span>
                </div>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {formatDuration(route.duration)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Distance:</span>
                </div>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {formatDistance(route.distance)}
                </Badge>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Directions:</h4>
                <div className="space-y-2">
                  {route.steps.map((step, index) => (
                    <div key={index} className="flex items-start p-2 rounded-md bg-gray-50 dark:bg-zinc-800">
                      <div className="mr-2 mt-1">
                        {index === 0 ? (
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CornerDownRight className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.instruction}</p>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
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

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={clearRoute}>
            Close
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // Open in Google Maps if available
              if (selectedUser && navigator.share) {
                const lat = selectedUser.coordinates[1]
                const lng = selectedUser.coordinates[0]
                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

                navigator
                  .share({
                    title: `Directions to ${selectedUser.name}`,
                    url: url,
                  })
                  .catch((err) => console.error("Error sharing:", err))
              }
            }}
          >
            Open in Maps
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
