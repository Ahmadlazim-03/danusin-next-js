"use client"

import type React from "react"

import { useMap } from "@/components/map/map-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { Building, Loader2, Package, Search, User, X } from "lucide-react"
import { useEffect, useState } from "react"

export function SearchPanel() {
  const { searchQuery, setSearchQuery, performSearch, clearSearch, searchResults, isSearching, selectUser, flyToUser } =
    useMap()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Filter results based on active tab
  const filteredResults =
    activeTab === "all" ? searchResults : searchResults.filter((result) => result.type === activeTab)

  // Count results by type
  const productCount = searchResults.filter((r) => r.type === "product").length
  const organizationCount = searchResults.filter((r) => r.type === "organization").length
  const userCount = searchResults.filter((r) => r.type === "user").length

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  // Handle result click
  const handleResultClick = (result: any) => {
    if (result.type === "user") {
      selectUser(result.data)
      if (result.data.coordinates) {
        flyToUser(result.data.coordinates)
      }
      setIsOpen(false)
    }
  }

  // Close search panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".search-panel") && !target.closest(".search-button")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <>
      {/* Search button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-10 bg-white dark:bg-zinc-800 shadow-md search-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Search panel */}
      {isOpen && (
        <div className="fixed top-16 left-4 z-[1000] w-96 search-panel">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Search</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Search for products, organizations, or users</CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>

            {searchResults.length > 0 && (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({searchResults.length})</TabsTrigger>
                    <TabsTrigger value="product">Products ({productCount})</TabsTrigger>
                    <TabsTrigger value="organization">Orgs ({organizationCount})</TabsTrigger>
                    <TabsTrigger value="user">Users ({userCount})</TabsTrigger>
                  </TabsList>
                </Tabs>

                <CardContent className="max-h-[60vh] overflow-y-auto pt-2">
                  <div className="space-y-3">
                    {filteredResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        {/* Icon or image */}
                        {result.type === "product" ? (
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 dark:bg-zinc-700 flex-shrink-0">
                            {result.image ? (
                              <img
                                src={result.image || "/placeholder.svg"}
                                alt={result.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-full h-full p-2 text-gray-400" />
                            )}
                          </div>
                        ) : result.type === "organization" ? (
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 dark:bg-zinc-700 flex-shrink-0">
                            {result.image ? (
                              <img
                                src={result.image || "/placeholder.svg"}
                                alt={result.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building className="w-full h-full p-2 text-gray-400" />
                            )}
                          </div>
                        ) : (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={result.image || "/placeholder.svg"} />
                            <AvatarFallback>
                              <User className="h-6 w-6 text-gray-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{result.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.type === "product" ? "Product" : result.type === "organization" ? "Org" : "User"}
                            </Badge>
                          </div>

                          {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {result.description}
                            </p>
                          )}

                          {/* Product specific info */}
                          {result.type === "product" && result.data.price && (
                            <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                              {formatCurrency(result.data.price)}
                              {result.data.organizationName && (
                                <span className="ml-2 text-gray-500">by {result.data.organizationName}</span>
                              )}
                            </div>
                          )}

                          {/* Organization specific info */}
                          {result.type === "organization" && result.data.slug && (
                            <div className="mt-1 text-xs text-gray-500">@{result.data.slug}</div>
                          )}

                          {/* User specific info */}
                          {result.type === "user" && result.data.organizationName && (
                            <div className="mt-1 text-xs text-gray-500 flex items-center">
                              <Building className="h-3 w-3 mr-1 text-blue-500" />
                              {result.data.organizationName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <CardContent>
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try different keywords or check your spelling</p>
                </div>
              </CardContent>
            )}

            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={clearSearch} disabled={!searchQuery}>
                Clear
              </Button>
              <div className="text-xs text-gray-500">
                {searchResults.length > 0 && `${searchResults.length} results found`}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}
