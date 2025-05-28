"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatCurrency } from "@/lib/utils"
import { Building, Loader2, Package, Search, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

// Assuming PocketBase is already imported in the Header component
// If not, you'll need to import it here
import PocketBase from "pocketbase"

// Define types for search results
interface Organization {
  id: string
  organization_name: string
  organization_slug: string
  organization_image?: string
  organization_description?: string
}

interface Product {
  id: string
  product_name: string
  slug: string
  product_image?: string[]
  description?: string
  price?: number
  discount?: number
  by_organization?: string
  organizationName?: string
}

interface SearchResult {
  organizations: Organization[]
  products: Product[]
  isLoading: boolean
  query: string
}

export function SearchComponent() {
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult>({
    organizations: [],
    products: [],
    isLoading: false,
    query: "",
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.evoptech.com")

  // Search recommendations
  const searchRecommendations = [
    { label: "Cari Semua Organisasi", href: "/dashboard/organization/all" },
    { label: "Lihat Semua Produk", href: "/dashboard/products/all" },
    { label: "Favorit Produk", href: "/dashboard/favorites/products" },
    { label: "Profil Saya", href: "/dashboard/profile" },
    { label: "Danusin Map", href: "/map" },
  ]

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({
        organizations: [],
        products: [],
        isLoading: false,
        query: "",
      })
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSearchResults((prev) => ({ ...prev, isLoading: true, query: searchQuery }))

        // Search for organizations
        const organizationsResult = await pb.collection("danusin_organization").getList(1, 5, {
          filter: `organization_name~"${searchQuery}" || organization_slug~"${searchQuery}" || organization_description~"${searchQuery}"`,
          sort: "-created",
        })

        // Search for products
        const productsResult = await pb.collection("danusin_product").getList(1, 5, {
          filter: `product_name~"${searchQuery}" || description~"${searchQuery}" || slug~"${searchQuery}"`,
          sort: "-created",
          expand: "by_organization",
        })

        // Process products to include organization name
        const processedProducts = await Promise.all(
          productsResult.items.map(async (product) => {
            let organizationName = undefined

            if (product.by_organization) {
              try {
                if (product.expand?.by_organization) {
                  organizationName = product.expand.by_organization.organization_name
                } else {
                  const org = await pb.collection("danusin_organization").getOne(product.by_organization)
                  organizationName = org.organization_name
                }
              } catch (e) {
                console.warn("Could not fetch organization details:", e)
              }
            }

            return {
              ...product,
              organizationName,
            }
          }),
        )

        setSearchResults({
          organizations: organizationsResult.items,
          products: processedProducts,
          isLoading: false,
          query: searchQuery,
        })
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults((prev) => ({ ...prev, isLoading: false }))
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleClearSearch = () => {
    setSearchQuery("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const hasResults = searchResults.organizations.length > 0 || searchResults.products.length > 0
  const hasSearchQuery = searchQuery.trim().length > 0

  return (
    <Popover open={isSearchPopoverOpen} onOpenChange={setIsSearchPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1 md:flex-none md:w-48 group">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-emerald-100 group-focus-within:text-white dark:text-zinc-400 dark:group-focus-within:text-emerald-400 pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search..."
            className="pl-8 text-sm transition-all duration-300 bg-emerald-400/30 border-2 border-emerald-200/90 text-white placeholder:text-emerald-50/80 hover:bg-emerald-300/40 focus-visible:border-emerald-100/90 focus-visible:ring-1 focus-visible:ring-emerald-300/50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-400 dark:focus-visible:border-emerald-500 dark:focus-visible:ring-1 dark:focus-visible:ring-emerald-500/50 w-full h-9"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => {
              e.stopPropagation()
              setIsSearchPopoverOpen(true)
            }}
            onFocus={() => {
              if (!isSearchPopoverOpen) {
                setIsSearchPopoverOpen(true)
              }
            }}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-100 hover:text-white dark:text-zinc-400 dark:hover:text-white"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1 mt-1 bg-card border-border shadow-md rounded-md max-h-[80vh] overflow-auto"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="center"
      >
        {searchResults.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500 dark:text-emerald-400" />
            <span className="ml-2 text-sm">Searching...</span>
          </div>
        ) : hasSearchQuery && hasResults ? (
          <div className="flex flex-col space-y-2">
            {/* Organizations section */}
            {searchResults.organizations.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center">
                  <Building className="h-3 w-3 mr-1" />
                  Organizations ({searchResults.organizations.length})
                </div>
                {searchResults.organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/dashboard/organization/view/${org.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => setIsSearchPopoverOpen(false)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-emerald-100 dark:bg-zinc-700 flex items-center justify-center">
                      {org.organization_image ? (
                        <img
                          src={pb.files.getUrl(org, org.organization_image, { thumb: "64x64" || "/placeholder.svg" })}
                          alt={org.organization_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{org.organization_name}</div>
                      <div className="text-xs text-muted-foreground">@{org.organization_slug}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Products section */}
            {searchResults.products.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  Products ({searchResults.products.length})
                </div>
                {searchResults.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => setIsSearchPopoverOpen(false)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-emerald-100 dark:bg-zinc-700 flex items-center justify-center">
                      {product.product_image && product.product_image.length > 0 ? (
                        <img
                          src={pb.files.getUrl(product, product.product_image[0], {
                            thumb: "64x64" || "/placeholder.svg",
                          })}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{product.product_name}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {product.organizationName ? `by ${product.organizationName}` : ""}
                        </span>
                        {product.price !== undefined && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(
                              product.discount && product.discount > 0
                                ? product.price * (1 - product.discount / 100)
                                : product.price,
                            )}
                            {product.discount && product.discount > 0 && (
                              <Badge className="ml-1 text-[10px] py-0 h-4" variant="outline">
                                {product.discount}% OFF
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : hasSearchQuery && !hasResults ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
            <p className="text-xs text-muted-foreground mt-1">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-0.5">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Saran Pencarian</p>
            {searchRecommendations.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-1.5 text-sm rounded-sm hover:bg-accent focus:bg-accent focus:outline-none text-popover-foreground"
                onClick={() => setIsSearchPopoverOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
