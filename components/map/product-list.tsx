"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { Package2, Store } from "lucide-react"
import { useMap } from "./map-provider"

export function ProductList() {
  const { userProducts, isLoadingProducts, selectedUser } = useMap()

  if (isLoadingProducts) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-video relative">
              <Skeleton className="absolute inset-0" />
            </div>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (userProducts.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full">
        <Store className="h-12 w-12 text-gray-400 mb-2" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No Products Found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {selectedUser?.organizationName
            ? `${selectedUser.organizationName} hasn't added any products yet.`
            : "This user isn't associated with any organization or products."}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center">
          <Package2 className="h-4 w-4 mr-1 text-blue-500" />
          {selectedUser?.organizationName ? `${selectedUser.organizationName}'s Products` : "Products"}
        </h3>
        <Badge variant="outline">{userProducts.length} items</Badge>
      </div>

      <div className="space-y-3">
        {userProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.images.length > 0 && (
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                <img
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                  }}
                />
              </div>
            )}
            <CardContent className="p-3">
              <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
              {product.description && (
                <CardDescription className="text-xs mt-1 line-clamp-2">
                  {product.description.replace(/<[^>]*>?/gm, "")}
                </CardDescription>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(product.discount ? product.price * (1 - product.discount / 100) : product.price)}
                  </span>
                  {product.discount && (
                    <span className="text-xs line-through ml-1 text-gray-500">{formatCurrency(product.price)}</span>
                  )}
                </div>
                {product.discount && <Badge className="text-xs">{product.discount}% OFF</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
