"use client";

import React, { useEffect, useState, useCallback, JSX } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { Skeleton } from "@/components/ui/skeleton";

// Tipe data dari ProductDetailPage (ReviewRecord, ExpandedUser, DisplayableReview)
// bisa disalin ke sini atau diimpor jika Anda punya file tipe global.
export type ReviewRecord = RecordModel & {
  id_product: string;
  id_user: string;
  rating: number;
  ulasan: string;
};

// Tipe data untuk produk yang akan ditampilkan di carousel
type HeroProduct = RecordModel & {
  product_name: string;
  description?: string; 
  product_image: string[]; 
  price: number;
  discount?: number; 
  slug: string; 
  average_rating?: number; // Akan dihitung
  total_reviews?: number; // Akan dihitung
  tags?: string[] | null; 
  expand?: {
    catalog?: { id: string; name: string; }[];
  };
  catalog?: { id: string; name: string; }[];
  // 'created' sudah ada dari RecordModel
};

const swipeThreshold = 50;

// Komponen Skeleton untuk Hero Carousel
function HeroCarouselSkeleton(): JSX.Element { // Pastikan return JSX.Element
  return (
    <div className="mb-6 md:mb-10 relative rounded-xl overflow-hidden shadow-2xl dark:shadow-black/50">
      <div className="aspect-[16/9] sm:aspect-[18/9] md:aspect-[21/9] relative bg-muted dark:bg-zinc-700 animate-pulse">
        <div className="absolute inset-0 flex flex-col justify-end p-4 py-5 sm:p-6 md:p-7 lg:p-8">
          <div className="max-w-xl lg:max-w-2xl space-y-3">
            <Skeleton className="h-5 w-32 rounded-full bg-gray-300 dark:bg-zinc-600" />
            <Skeleton className="h-8 sm:h-10 md:h-12 w-3/4 sm:w-2/3 bg-gray-300 dark:bg-zinc-600" />
            <Skeleton className="hidden lg:block h-4 w-full bg-gray-300 dark:bg-zinc-600" />
            <Skeleton className="hidden lg:block h-4 w-5/6 bg-gray-300 dark:bg-zinc-600" />
            <div className="hidden lg:flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-md bg-gray-300 dark:bg-zinc-600" />
              <Skeleton className="h-5 w-20 rounded-md bg-gray-300 dark:bg-zinc-600" />
              <Skeleton className="h-5 w-14 rounded-md bg-gray-300 dark:bg-zinc-600" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-28 rounded-lg bg-gray-300 dark:bg-zinc-600" /> 
              <Skeleton className="h-6 w-24 rounded bg-gray-300 dark:bg-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen untuk menampilkan konten di dalam slide carousel
function CarouselProductContent({ product }: { product: HeroProduct }): JSX.Element { // Pastikan return JSX.Element
    const displayPrice = product.discount && product.discount > 0 && product.discount < product.price ? (
        <>
            <span className="line-through text-neutral-400 dark:text-zinc-500 text-[10px] sm:text-xs md:text-xs">
                Rp{product.price.toLocaleString('id-ID')}
            </span>
            <span className="font-bold text-white text-sm sm:text-lg md:text-lg"> 
                Rp{product.discount.toLocaleString('id-ID')}
            </span>
            <Badge className="bg-red-500/80 dark:bg-red-600/90 text-white text-[9px] sm:text-xs px-1 py-0.5 border-none rounded-sm ml-1.5">
                -{(((product.price - product.discount) / product.price) * 100).toFixed(0)}%
            </Badge>
        </>
    ) : (
        <span className="font-bold text-white text-sm sm:text-lg md:text-lg"> 
            Rp{product.price.toLocaleString('id-ID')}
        </span>
    );

    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId && product.id
        ? pb.getFileUrl(product, product.product_image[0])
        : "/placeholder.svg?height=600&width=1400&text=" + encodeURIComponent(product.product_name.substring(0,2).toUpperCase());

    const productTagsSource = product.expand?.catalog || product.tags;
    const productTags = Array.isArray(productTagsSource) ? productTagsSource : [];

    return (
        <>
            <Image
                src={imageUrl}
                alt={product.product_name}
                fill
                className="object-cover"
                priority 
                draggable="false" 
                onError={(e) => { (e.target as HTMLImageElement).src = `/placeholder.svg?height=600&width=1400&text=${encodeURIComponent(product.product_name.substring(0,1) || 'Err')}`; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/20 md:to-transparent flex flex-col justify-end p-4 py-5 sm:p-6 md:p-7 lg:p-8">
                <div className="max-w-xl lg:max-w-2xl"> 
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="hidden lg:block" >
                        <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 mb-2 sm:mb-3 text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider border-none">
                            Produk Unggulan
                        </Badge>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-2 text-white shadow-black/50 text-shadow-md" >
                        {product.product_name}
                    </motion.h2>
                    {product.description && (
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="hidden lg:block text-neutral-200 dark:text-zinc-300 mb-3 sm:mb-4 text-xs sm:text-sm md:text-sm lg:text-base line-clamp-2 md:line-clamp-2 lg:line-clamp-3" >
                            {product.description}
                        </motion.p>
                    )}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="hidden lg:flex flex-wrap gap-1 sm:gap-1.5 mb-3 md:mb-3" >
                        {productTags.slice(0, 3).map((tag: any, index: number) => (
                            <Badge key={typeof tag === 'object' ? tag.id : index} variant="secondary" className="backdrop-blur-sm bg-white/10 dark:bg-zinc-700/60 text-neutral-100 dark:text-zinc-200 hover:bg-white/20 dark:hover:bg-zinc-600/60 transition-colors duration-200 rounded-md text-[10px] sm:text-xs px-2 py-0.5 border-none" >
                                {typeof tag === 'object' ? tag.name : tag}
                            </Badge>
                        ))}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="flex items-center gap-2.5 sm:gap-3 md:gap-3 flex-wrap mt-3 lg:mt-0" >
                        <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-white text-xs sm:text-sm md:text-sm lg:text-base py-2 px-4 sm:py-2.5 sm:px-5 md:py-2.5 md:px-5 rounded-md sm:rounded-lg" aria-label={`Lihat ${product.product_name}`} asChild>
                           <Link href={`/dashboard/products/${product.id}`}>Lihat Produk</Link>
                        </Button>
                        <div className="flex items-baseline gap-1.5"> {displayPrice} </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export function HeroCarousel() {
  const [featuredProducts, setFeaturedProducts] = useState<HeroProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0); 

  const calculateProductRating = useCallback(async (productId: string, signal?: AbortSignal): Promise<{ average: number, total: number }> => {
    try {
      const reviews = await pb.collection('danusin_product_review').getFullList<ReviewRecord>({
        filter: `id_product = "${productId}"`, fields: 'rating', signal, $autoCancel: false,
      });
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (reviews.length === 0) return { average: 0, total: 0 };
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      return { average: totalRating / reviews.length, total: reviews.length };
    } catch (err: any) {
      if (err.name !== 'AbortError' && !signal?.aborted) { console.warn(`Could not calculate rating for product ${productId}:`, err); }
      return { average: 0, total: 0 };
    }
  }, []);


  const fetchAndFilterProducts = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const potentialProductsResult = await pb.collection('danusin_product').getList<HeroProduct>(1, 20, { 
        sort: '-created', expand: 'catalog', signal, $autoCancel: false,
      });
      if (signal.aborted) return;

      const productsWithRatingPromises = potentialProductsResult.items.map(async (product) => {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const ratingData = await calculateProductRating(product.id, signal);
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        // Pastikan semua field dari RecordModel (seperti 'created') tetap ada
        return { 
            ...product, // Menyalin semua properti asli dari produk
            average_rating: ratingData.average, 
            total_reviews: ratingData.total 
        } as HeroProduct; // Type assertion agar TypeScript tahu ini adalah HeroProduct
      });

      let productsWithRatings = await Promise.all(productsWithRatingPromises);
      if (signal.aborted) return;

      const highlyRatedProducts = productsWithRatings.filter(p => p.average_rating !== undefined && p.average_rating >= 4);
      
      highlyRatedProducts.sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return (b.average_rating || 0) - (a.average_rating || 0);
        }
        // Pastikan 'created' ada untuk sorting sekunder
        return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
      });

      if (!signal.aborted) {
        setFeaturedProducts(highlyRatedProducts.slice(0, 5));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal.aborted) {
        console.error("Failed to fetch or process featured products:", err);
        setError("Gagal memuat produk unggulan.");
      } else { console.log("Fetch/process featured products request was cancelled."); }
    } finally { if (!signal.aborted) { setLoading(false); } }
  }, [calculateProductRating]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAndFilterProducts(controller.signal);
    return () => { controller.abort(); };
  }, [fetchAndFilterProducts]);

  const changeSlide = useCallback((newDirection: number) => {
    if (featuredProducts.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex(prevIndex => {
      let newIndex = prevIndex + newDirection;
      if (newIndex < 0) { newIndex = featuredProducts.length - 1; }
      else if (newIndex >= featuredProducts.length) { newIndex = 0; }
      return newIndex;
    });
  }, [featuredProducts.length]);

  const nextSlide = useCallback(() => changeSlide(1),[changeSlide]);
  const prevSlide = useCallback(() => changeSlide(-1),[changeSlide]);

  useEffect(() => {
    if (!isHovered && featuredProducts.length > 1) {
      const interval = setInterval(() => { nextSlide(); }, 3000); 
      return () => clearInterval(interval);
    }
  }, [isHovered, currentIndex, featuredProducts.length, nextSlide]); 

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, }),
    center: { x: 0, opacity: 1, transition: { x: { type: "spring", stiffness: 260, damping: 30 }, opacity: { duration: 0.3 }, }, },
    exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%", opacity: 0, transition: { x: { type: "spring", stiffness: 260, damping: 30 }, opacity: { duration: 0.2 }, }, }),
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;
    if (offset.x < -swipeThreshold) { nextSlide(); } 
    else if (offset.x > swipeThreshold) { prevSlide(); }
  };
  
  if (loading) { return <HeroCarouselSkeleton />; }
  if (error) { return ( <div className="mb-6 md:mb-10 p-8 text-center text-red-600 bg-red-50 rounded-xl">{error} <Button onClick={() => fetchAndFilterProducts(new AbortController().signal)} variant="outline" className="mt-2">Coba Lagi</Button></div> ); }
  if (featuredProducts.length === 0) { return ( <div className="mb-6 md:mb-10 p-8 text-center text-muted-foreground bg-muted rounded-xl">Belum ada produk unggulan dengan rating tinggi untuk ditampilkan.</div> ); }

  const currentProduct = featuredProducts[currentIndex];

  return (
    <div className="mb-6 md:mb-10 relative rounded-xl overflow-hidden shadow-2xl dark:shadow-black/50 cursor-grab active:cursor-grabbing" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} >
      <div className="aspect-[16/9] sm:aspect-[18/9] md:aspect-[21/9] relative"> 
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div key={currentProduct.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd} >
            <CarouselProductContent product={currentProduct} />
          </motion.div>
        </AnimatePresence>
      </div>
      {featuredProducts.length > 1 && ( <>
            <div className="absolute bottom-2.5 sm:bottom-3 md:bottom-3.5 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                {featuredProducts.map((_, index) => ( <button key={index} onClick={() => { setDirection(index > currentIndex ? 1 : (index < currentIndex ? -1 : 0)); setCurrentIndex(index); }} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2 md:h-2 rounded-full transition-all duration-300 ease-out ${ index === currentIndex ? "bg-emerald-500 scale-110 w-3 sm:w-4 md:w-4" : "bg-neutral-200/40 dark:bg-zinc-600/70 hover:bg-neutral-200/70 dark:hover:bg-zinc-500/90" }`} aria-label={`Go to slide ${index + 1}`} /> ))}
            </div>
            <button onClick={prevSlide} className="absolute left-1 sm:left-2 md:left-2.5 top-1/2 transform -translate-y-1/2 bg-black/15 dark:bg-black/20 hover:bg-black/30 dark:hover:bg-black/40 text-white p-1 sm:p-1.5 md:p-1.5 rounded-full transition-all duration-300 backdrop-blur-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label="Previous slide" > <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" /> </button>
            <button onClick={nextSlide} className="absolute right-1 sm:right-2 md:right-2.5 top-1/2 transform -translate-y-1/2 bg-black/15 dark:bg-black/20 hover:bg-black/30 dark:hover:bg-black/40 text-white p-1 sm:p-1.5 md:p-1.5 rounded-full transition-all duration-300 backdrop-blur-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label="Next slide" > <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" /> </button>
        </> )}
    </div>
  )
}