"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Clock, MapPin, Package, User, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useMap } from "./map-provider"
import { ProductList } from "./product-list"

export function UserCard() {
  const { selectedUser, selectUser, flyToUser, userProducts, isLoadingProducts } = useMap()
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [activeTab, setActiveTab] = useState("info")

  // Format time ago for the selected user
  useEffect(() => {
    if (!selectedUser || !selectedUser.updated) return

    const updateTimeAgo = () => {
      const now = new Date()
      const updatedDate = new Date(selectedUser.updated || "")
      const diffMs = now.getTime() - updatedDate.getTime()

      // Convert to appropriate time unit
      if (diffMs < 60000) {
        setTimeAgo("Just now")
      } else if (diffMs < 3600000) {
        const minutes = Math.floor(diffMs / 60000)
        setTimeAgo(`${minutes} minute${minutes > 1 ? "s" : ""} ago`)
      } else if (diffMs < 86400000) {
        const hours = Math.floor(diffMs / 3600000)
        setTimeAgo(`${hours} hour${hours > 1 ? "s" : ""} ago`)
      } else {
        const days = Math.floor(diffMs / 86400000)
        setTimeAgo(`${days} day${days > 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [selectedUser])

  if (!selectedUser) return null

  const handleFlyToUser = () => {
    flyToUser(selectedUser.coordinates)
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 animate-fade-in">
      <Card className="w-96 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
            {selectedUser.username && <CardDescription>@{selectedUser.username}</CardDescription>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => selectUser(null)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mb-2">
            <TabsTrigger value="info" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 overflow-auto m-0 p-0">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg?height=100&width=100"} />
                  <AvatarFallback>
                    <User className="h-8 w-8 text-gray-400" />
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>

                  {timeAgo && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{timeAgo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Coordinates:</span>
                  <span className="col-span-2 font-mono text-xs">
                    {selectedUser.coordinates[0].toFixed(5)}, {selectedUser.coordinates[1].toFixed(5)}
                  </span>
                </div>

                {selectedUser.organizationName && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Organization:</span>
                    <span className="col-span-2 flex items-center">
                      <Building className="h-3 w-3 mr-1 text-blue-500" />
                      {selectedUser.organizationName}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => selectUser(null)}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleFlyToUser}>
                <MapPin className="h-4 w-4 mr-2" /> Fly to
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="products" className="flex-1 overflow-auto m-0 p-0">
            <ProductList />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
