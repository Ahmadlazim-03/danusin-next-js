"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, X } from "lucide-react"

interface LocationPromptProps {
  onAllow: () => void
  onDeny: () => void
}

export function LocationPrompt({ onAllow, onDeny }: LocationPromptProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Location Access</CardTitle>
          <Button variant="ghost" size="icon" onClick={onDeny} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <CardDescription>We need your location to show you on the map and find nearby danusers</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your location will only be shared while you're using this page. You can disable location sharing at any time.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDeny}>
          Deny
        </Button>
        <Button onClick={onAllow} className="bg-green-600 hover:bg-green-700">
          <MapPin className="mr-2 h-4 w-4" />
          Allow
        </Button>
      </CardFooter>
    </Card>
  )
}
