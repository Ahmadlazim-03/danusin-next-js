"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize } from "lucide-react"
import { useMap } from "@/components/map/map-provider"
import { useToast } from "@/components/ui/use-toast"

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { mapRef } = useMap()
  const { toast } = useToast()

  // Check if fullscreen is supported
  const isFullscreenSupported = () => {
    return (
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  // Update state when fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        ),
      )
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!isFullscreenSupported()) {
      toast({
        title: "Fullscreen Not Supported",
        description: "Your browser doesn't support fullscreen mode.",
        variant: "destructive",
      })
      return
    }

    try {
      const mapContainer = mapRef.current?.getContainer()?.parentElement

      if (!mapContainer) {
        toast({
          title: "Map Not Found",
          description: "Could not find the map container.",
          variant: "destructive",
        })
        return
      }

      if (!isFullscreen) {
        // Enter fullscreen
        if (mapContainer.requestFullscreen) {
          await mapContainer.requestFullscreen()
        } else if ((mapContainer as any).webkitRequestFullscreen) {
          await (mapContainer as any).webkitRequestFullscreen()
        } else if ((mapContainer as any).mozRequestFullScreen) {
          await (mapContainer as any).mozRequestFullScreen()
        } else if ((mapContainer as any).msRequestFullscreen) {
          await (mapContainer as any).msRequestFullscreen()
        }

        // Resize map after entering fullscreen
        setTimeout(() => {
          mapRef.current?.resize()
        }, 100)
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }

        // Resize map after exiting fullscreen
        setTimeout(() => {
          mapRef.current?.resize()
        }, 100)
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
      toast({
        title: "Fullscreen Error",
        description: "An error occurred while toggling fullscreen mode.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 bg-white dark:bg-zinc-800 shadow-md"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
    </Button>
  )
}
