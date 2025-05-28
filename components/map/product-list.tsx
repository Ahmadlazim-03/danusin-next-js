"use client"

import { useMap } from "@/components/map/map-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Building, Eye, Package2, Store } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter

export function ProductList() {
  const { userProducts, isLoadingProducts, selectedUser } = useMap()
  const router = useRouter() // Initialize useRouter


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

        {!selectedUser?.organizationId && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Organization Found</AlertTitle>
            <AlertDescription>
              This user isn't associated with any organization. Products are linked to organizations.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const handleViewMore = (productId: string) => {
    router.push(`/dashboard/products/${productId}`)
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
        {userProducts.map((product) => {
          const discountedPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price
          const showDiscount = product.discount > 0 && discountedPrice > 0

          return (
            <Card key={product.id} className="overflow-hidden">
              {product.images.length > 0 && (
                <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                  <img
                    src={product.images[0] || "/placeholder.svg?height=200&width=300"}
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

                {product.organizationName && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Building className="h-3 w-3 mr-1 text-blue-500" />
                    <span>{product.organizationName}</span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(discountedPrice)}
                    </span>
                    {showDiscount && (
                      <span className="text-xs line-through ml-1 text-gray-500">{formatCurrency(product.price)}</span>
                    )}
                  </div>
                  {showDiscount && <Badge className="text-xs">{product.discount}% OFF</Badge>}
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-between items-center">
                <div className="text-xs text-gray-500">ID: {product.id.substring(0, 8)}...</div>
                {product.organizationSlug && (
                  <Badge variant="outline" className="text-xs">
                    {product.organizationSlug}
                  </Badge>
                )}
                 <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewMore(product.id)}
                  className="ml-auto" // Push button to the right if no org slug
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View More
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}