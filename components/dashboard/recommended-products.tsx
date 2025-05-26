"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { Star, Users, Heart as HeartIcon, ExternalLink, User, Building2 } from "lucide-react" 
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion" 

// Tipe data produk (tetap sama)
type Product = {
  id: string
  collectionId: string
  product_name: string
  description: string
  price: number
  discount: number
  product_image: string[]
  by_organization: {
    id: string
    organization_name: string
    organization_slug: string
  } | null
  added_by: {
    id: string
    name: string
  } | null
  catalog: {
    id: string
    name: string
  }[] | null
}

// Komponen ProductCard (tetap sama)
function ProductCard({ product }: { product: Product }) {
  const [isFavorited, setIsFavorited] = useState(false)

  const displayPrice = product.discount && product.discount > 0 ? (
      <>
          <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">
              ${product.price.toFixed(2)}
          </span>
          <span>${product.discount.toFixed(2)}</span>
      </>
  ) : (
      <span>${product.price.toFixed(2)}</span>
  );

  const imageUrl =
    product.product_image && product.product_image.length > 0
      ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" })
      : "/placeholder.svg?height=300&width=500"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 }, }} className="h-full">
      <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
        <div className="aspect-video relative overflow-hidden">
          <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex justify-between items-center">
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                <Link href={`/dashboard/products/${product.id}`}><ExternalLink className="h-3 w-3 mr-1.5" /> View Product</Link>
              </Button>
              <Button variant="outline" size="icon" className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8" onClick={(e) => { e.preventDefault(); setIsFavorited(!isFavorited); }} aria-label="Add to Wishlist">
                <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">{product.product_name}</h3>
            {product.by_organization && (<div className="text-[10px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1 flex-shrink-0"><Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="truncate max-w-[80px] sm:max-w-[100px]">{product.by_organization.organization_name}</span></div>)}
          </div>
          <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
            {product.catalog?.slice(0, 3).map((cat) => (<Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.name)}`} passHref className="no-underline"><Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm">{cat.name}</Badge></Link>))}
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
            <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">{displayPrice}</div>
            
            {/* --- PERUBAHAN DI SINI (Untuk Debug) --- */}
            <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="truncate max-w-[80px]">
                    {product.added_by ? product.added_by.name : "N/A"} {/* Tampilkan N/A jika null */}
                </span>
            </div>
            {/* --- AKHIR PERUBAHAN --- */}

          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


// --- Komponen RecommendedProducts Utama ---
export function RecommendedProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const cancelTokensRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => { /* ... Logika fetch data ... */ 
      isMountedRef.current = true;
      return () => { isMountedRef.current = false; cancelTokensRef.current.forEach((token) => pb.cancelRequest(token)); }
  }, [])

  useEffect(() => { /* ... Logika fetch data ... */ 
      cancelTokensRef.current.forEach((token) => pb.cancelRequest(token));
      cancelTokensRef.current = [];
      async function fetchRecommendedProducts() {
          try {
              const token = `recommended_products_${Date.now()}`;
              cancelTokensRef.current.push(token);
              const result = await pb.collection("danusin_product").getList(1, 6, { sort: "-created", expand: "by_organization,added_by,catalog", $autoCancel: false, $cancelKey: token });
              if (!isMountedRef.current) return;
              // Tambahkan console.log di sini untuk cek data
              console.log("Fetched Data Items:", result.items); 
              const details = result.items.map((item: any) => ({
                  id: item.id, collectionId: item.collectionId, product_name: item.product_name, description: item.description, price: item.price, discount: item.discount, product_image: item.product_image || [],
                  by_organization: item.expand?.by_organization ? { id: item.expand.by_organization.id, organization_name: item.expand.by_organization.organization_name, organization_slug: item.expand.by_organization.organization_slug } : null,
                  added_by: item.expand?.added_by ? { id: item.expand.added_by.id, name: item.expand.added_by.name } : null,
                  catalog: item.expand?.catalog ? item.expand.catalog.map((cat: any) => ({ id: cat.id, name: cat.name })) : null,
              }));
              console.log("Mapped Products:", details); // Cek data setelah mapping
              setProducts(details);
          } catch (error: any) { if (error.name !== "AbortError") console.error("Fetch Error:", error); } 
          finally { if (isMountedRef.current) setLoading(false); }
      }
      fetchRecommendedProducts();
  }, [])

  return (
    <Card className="bg-transparent border-none shadow-none"> 
    
      <CardHeader className="p-0 mb-4 flex flex-row justify-between items-center">
        <div> 
          <h2 className="text-xl font-bold">Recommended Products</h2>
          <p className="text-sm text-muted-foreground">Discover the latest products from our community</p>
        </div>
        <div>
            <Button asChild variant="outline" size="sm" className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600
                    dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400
                    transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md">
                <Link href="/dashboard/products/all">
                    View All
                </Link>
            </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
               <div key={i} className="rounded-lg border bg-white dark:bg-zinc-800 p-3">
                 <Skeleton className="aspect-video w-full rounded-md mb-3" />
                 <Skeleton className="h-5 w-2/3 mb-2" />
                 <Skeleton className="h-4 w-1/3 mb-3" />
                 <div className="flex justify-between items-center">
                   <Skeleton className="h-4 w-1/4" />
                   <Skeleton className="h-4 w-1/4" />
                 </div>
               </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}