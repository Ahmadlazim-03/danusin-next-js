"use client"

import type React from "react"; // Used for React.FormEvent

import { useMap } from "@/components/map/map-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils"; // Assuming this utility function is correctly defined
import { Building, Loader2, Package, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";

// Define specific data structures for each search result type
interface ProductData {
  price?: number
  organizationName?: string
}

interface OrganizationData {
  slug?: string
}

// Updated UserData interface
interface UserData {
  id: string
  userId: string
  isActive: boolean
  coordinates: [number, number] // Changed to a non-optional tuple e.g. [latitude, longitude]
  organizationName?: string
}

// Define a base interface for common properties
interface BaseSearchResult {
  id: string | number
  name: string
  image?: string
  description?: string
}

// Create a discriminated union for search results
export interface ProductSearchResult extends BaseSearchResult {
  type: "product"
  data: ProductData
}

export interface OrganizationSearchResult extends BaseSearchResult {
  type: "organization"
  data: OrganizationData
}

export interface UserSearchResult extends BaseSearchResult {
  type: "user"
  data: UserData // UserData now has coordinates: [number, number]
}

export type SearchResult = ProductSearchResult | OrganizationSearchResult | UserSearchResult

export function SearchPanel() {
  const {
    searchQuery,
    setSearchQuery,
    performSearch,
    clearSearch,
    searchResults,
    isSearching,
    selectUser, // Expects UserLocation where coordinates is [number, number]
    flyToUser,   // Expects [number, number]
  } = useMap()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "product" | "organization" | "user">("all")

  const typedSearchResults = searchResults as SearchResult[]

  // Filter results based on active tab
  const filteredResults: SearchResult[] =
    activeTab === "all"
      ? typedSearchResults
      : typedSearchResults.filter((result) => result.type === activeTab)

  // Count results by type
  const productCount = typedSearchResults.filter((r) => r.type === "product").length
  const organizationCount = typedSearchResults.filter((r) => r.type === "organization").length
  const userCount = typedSearchResults.filter((r) => r.type === "user").length

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      // result.data is UserData, which now has 'coordinates: [number, number]'
      // This should make result.data assignable to UserLocation for selectUser
      selectUser(result.data)

      // Since result.data.coordinates is now [number, number] and non-optional,
      // we can pass it directly to flyToUser.
      // The previous check for existence is no longer strictly needed here if the type guarantees it.
      // Ensure the order [lat, lng] or [lng, lat] is correct for flyToUser.
      flyToUser(result.data.coordinates)

      setIsOpen(false)
    }
  }

  // Close search panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest(".search-panel") && !target.closest(".search-button")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      {/* Search button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-10 bg-background shadow-md search-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close search panel" : "Open search panel"}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </Button>

      {/* Search panel */}
      {isOpen && (
        <div className="fixed top-16 left-4 z-[1000] w-full max-w-md sm:w-96 search-panel">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Search Map</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close search panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Find products, organizations, or users on the map.</CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Enter keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  aria-label="Search input"
                />
                <Button type="submit" disabled={isSearching || !searchQuery.trim()} aria-label="Perform search">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>

            {typedSearchResults.length > 0 && (
              <>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "all" | "product" | "organization" | "user")}
                  className="px-4 pt-2"
                >
                  <TabsList className="grid w-full grid-cols-4 h-auto sm:h-10">
                    <TabsTrigger value="all" className="text-xs sm:text-sm">
                      All ({typedSearchResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="product" className="text-xs sm:text-sm">
                      Products ({productCount})
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="text-xs sm:text-sm">
                      Orgs ({organizationCount})
                    </TabsTrigger>
                    <TabsTrigger value="user" className="text-xs sm:text-sm">
                      Users ({userCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <CardContent className="max-h-[calc(100vh-20rem)] overflow-y-auto pt-3 pb-2 space-y-3">
                  {filteredResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleResultClick(result)
                        }
                      }}
                    >
                      {/* Icon or image */}
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                        {result.type === "product" &&
                          (result.image ? (
                            <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          ))}
                        {result.type === "organization" &&
                          (result.image ? (
                            <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building className="w-6 h-6 text-muted-foreground" />
                          ))}
                        {result.type === "user" && (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={result.image} />
                            <AvatarFallback>
                              <User className="w-6 h-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm truncate" title={result.name}>
                            {result.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>

                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={result.description}>
                            {result.description}
                          </p>
                        )}

                        {result.type === "product" && result.data.price !== undefined && (
                          <div className="mt-1 text-xs">
                            <span className="font-medium text-primary">{formatCurrency(result.data.price)}</span>
                            {result.data.organizationName && (
                              <span className="ml-2 text-muted-foreground">by {result.data.organizationName}</span>
                            )}
                          </div>
                        )}

                        {result.type === "organization" && result.data.slug && (
                          <div className="mt-1 text-xs text-muted-foreground">@{result.data.slug}</div>
                        )}

                        {result.type === "user" && result.data.organizationName && (
                          <div className="mt-1 text-xs text-muted-foreground flex items-center">
                            <Building className="h-3 w-3 mr-1 text-primary" />
                            {result.data.organizationName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </>
            )}

            {searchQuery && typedSearchResults.length === 0 && !isSearching && (
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3" />
                  <p className="font-medium">No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try different keywords or check your spelling.</p>
                </div>
              </CardContent>
            )}

            {typedSearchResults.length > 0 && (
              <CardFooter className="pt-2 pb-3 flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={clearSearch} disabled={!searchQuery && !isSearching}>
                  Clear Search
                </Button>
                <div className="text-xs text-muted-foreground">
                  {filteredResults.length} of {typedSearchResults.length} results shown
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </>
  )
}