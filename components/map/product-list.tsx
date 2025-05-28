"use client"

import { useMap } from "@/components/map/map-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Building, Eye, Package2, Store } from "lucide-react";
import { useRouter } from "next/navigation";

// Define interfaces for the data structures used in this component
interface Product {
  id: string;
  name: string;
  description?: string; // Optional, might contain HTML initially
  price: number;
  discount?: number | null; // Can be undefined, null, or a number
  images: string[]; // Array of image URLs
  organizationName?: string;
  organizationSlug?: string;
}

interface SelectedUser {
  name?: string; // User's display name
  organizationName?: string; // Name of the organization the user might be associated with
  organizationId?: string | number | null; // ID of that organization
  // Add other user properties if available and needed by other components
}

// Define the expected shape from useMap for this component
interface MapContextForProductList {
  userProducts: Product[];
  isLoadingProducts: boolean;
  selectedUser: SelectedUser | null;
}

export function ProductList() {
  // Apply type assertion to the hook's return value
  const { userProducts, isLoadingProducts, selectedUser } = useMap() as MapContextForProductList;
  const router = useRouter();

  if (isLoadingProducts) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-video relative">
              <Skeleton className="absolute inset-0 w-full h-full" />
            </div>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!userProducts || userProducts.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Store className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Products Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {selectedUser?.organizationName
            ? `${selectedUser.organizationName} hasn't added any products yet.`
            : selectedUser?.name
              ? `${selectedUser.name} is not currently associated with any products.`
              : "No products are available for the current selection."}
        </p>

        {selectedUser && !selectedUser.organizationId && (
          <Alert variant="default" className="mt-6 text-left max-w-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Organization Link</AlertTitle>
            <AlertDescription>
              This user doesn't seem to be linked to an organization. Products are typically associated with organizations.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const handleViewMore = (productId: string) => {
    router.push(`/dashboard/products/${productId}`);
  };

  // Define placeholder image URL
  const placeholderImage = "/placeholder.svg?height=200&width=300";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center text-foreground">
          <Package2 className="h-5 w-5 mr-2 text-primary" />
          {selectedUser?.organizationName ? `${selectedUser.organizationName}'s Products` : "Available Products"}
        </h3>
        <Badge variant="secondary">{userProducts.length} item{userProducts.length === 1 ? "" : "s"}</Badge>
      </div>

      <div className="space-y-3">
        {userProducts.map((product) => {
          const discountedPrice = product.discount && product.price ? product.price * (1 - product.discount / 100) : product.price;
          const showDiscount = typeof product.discount === 'number' && product.discount > 0 && product.price > discountedPrice;

          return (
            <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {product.images && product.images.length > 0 && (
                <div className="aspect-[16/10] relative bg-muted">
                  <img
                    src={product.images[0]} // Use the first image
                    alt={product.name || "Product image"}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Prevent infinite loop if placeholder itself fails
                      if (target.src !== placeholderImage) {
                        target.src = placeholderImage;
                      }
                    }}
                    loading="lazy" // Add lazy loading for images
                  />
                </div>
              )}
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm line-clamp-1" title={product.name}>{product.name}</h4>
                {product.description && (
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {/* Basic HTML stripping. For complex HTML, consider a library or server-side processing. */}
                    {product.description.replace(/<[^>]*>?/gm, "")}
                  </CardDescription>
                )}

                {product.organizationName && (
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Building className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    <span>{product.organizationName}</span>
                  </div>
                )}

                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <span className="text-base font-bold text-primary">
                      {formatCurrency(discountedPrice)}
                    </span>
                    {showDiscount && typeof product.price === 'number' && (
                      <span className="text-xs line-through ml-1.5 text-muted-foreground">{formatCurrency(product.price)}</span>
                    )}
                  </div>
                  {showDiscount && typeof product.discount === 'number' && <Badge variant="destructive" className="text-xs">{product.discount}% OFF</Badge>}
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-1 flex justify-between items-center bg-muted/50">
                <div className="text-xs text-muted-foreground" title={product.id}>
                  ID: {product.id.substring(0, 8)}...
                </div>
                {product.organizationSlug && (
                  <Badge variant="outline" className="text-xs">
                    {product.organizationSlug}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewMore(product.id)}
                  className={!product.organizationSlug ? "ml-auto" : ""} // Ensure button alignment
                  aria-label={`View more details for ${product.name}`}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}