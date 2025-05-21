"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, X } from "lucide-react"

type LocationPromptProps = {
  onAllow: () => void
  onDeny: () => void
}

export function LocationPrompt({ onAllow, onDeny }: LocationPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Location Access</CardTitle>
            <Button variant="ghost" size="icon" onClick={onDeny}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <CardDescription>Danusin would like to access your location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm">Allowing location access will enhance your experience on Danusin:</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <span>Center the map on your current location</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <span>Show nearby organizations and danusers</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <span>If you're a danuser, display your location on the map for others to find you</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onDeny}>
            Deny
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={onAllow}>
            Allow
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
