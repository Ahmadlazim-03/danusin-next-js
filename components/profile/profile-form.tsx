"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Camera, Loader2, MapPin, User } from "lucide-react"
import { useRef, useState } from "react"

const USERS_COLLECTION = "danusin_users"

type ProfileFormProps = {
  user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [location, setLocation] = useState(
    user?.location ? `${user.location.lat},${user.location.lon}` : ""
  )
  const [locationAddress, setLocationAddress] = useState(user?.location_address || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const { user: authUser } = useAuth()

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const updatedUser = await pb.collection(USERS_COLLECTION).update(user.id, formData)

      if (updatedUser.avatar) {
        const avatarUrl = pb.files.getUrl(updatedUser, updatedUser.avatar)
        setAvatarUrl(avatarUrl)
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const coords = `${position.coords.latitude},${position.coords.longitude}`
      setLocation(coords)

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
        )
        const data = await response.json()
        const address = data.display_name || "Unknown address"
        setLocationAddress(address)
      } catch (error) {
        console.error("Error fetching address:", error)
        setLocationAddress("Unable to fetch address")
      }

      toast({
        title: "Location updated",
        description: "Your location has been successfully captured",
      })
    } catch (error) {
      console.error("Error getting location:", error)
      toast({
        title: "Location error",
        description: "Failed to get your location. Please try again or enter manually.",
        variant: "destructive",
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Parse location string to object
      let locationData: { lon: number; lat: number } | null = null
      if (location) {
        const [lat, lon] = location.split(",").map((coord) => parseFloat(coord.trim()))
        if (!isNaN(lat) && !isNaN(lon)) {
          locationData = { lat, lon }
        } else {
          throw new Error("Invalid location format")
        }
      }

      await pb.collection(USERS_COLLECTION).update(user.id, {
        name,
        bio,
        location: locationData,
        location_address: locationAddress,
      })

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-6 sm:space-y-0">
        <div className="relative cursor-pointer" onClick={handleAvatarClick}>
          <Avatar className="h-24 w-24 cursor-pointer">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name} />
            ) : (
              <AvatarFallback className="bg-green-100 text-green-700">
                <User className="h-12 w-12" />
              </AvatarFallback>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </Avatar>
          <div className="absolute bottom-0 right-0 rounded-full z-100 bg-green-600 p-1 text-white shadow-sm">
            <Camera className="h-4 w-4" />
          </div>
          <input
            title="input-image"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
        </div>
        <div className="w-full space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-medium">{name || "User"}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.isdanuser ? "Danuser Account" : "Regular Account"}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location Coordinates</Label>
          <div className="flex space-x-2">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Latitude,Longitude"
            />
            <Button
              type="button"
              variant="outline"
              onClick={getLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Get Location
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationAddress">Location Address</Label>
          <Input
            id="locationAddress"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Your address"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}