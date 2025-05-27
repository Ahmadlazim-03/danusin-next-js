"use client";

import React, { useEffect, useState, FormEvent, useMemo, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
    User, Building2, Tag, ExternalLink, Heart, Info, AlertTriangle, ShoppingCart, 
    Star as StarIcon, ChevronLeft, ChevronRight, Ruler, Shield, Brush, Award, 
    MessageSquare, Send, Loader2, Mail, Phone, MapPin, Link2 as WhatsAppIcon, ArrowLeft,
    HeartIcon
} from 'lucide-react'; // Menambahkan ArrowLeft & WhatsAppIcon jika diperlukan (sudah ada di file lain, mungkin tidak perlu di sini)
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card'; // Card & CardContent sudah ada
import { useParams } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/use-toast';
import { ClientResponseError, RecordModel } from 'pocketbase';

// --- TIPE DATA ---
export type ReviewRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  id_product: string;
  id_user: string;
  rating: number;
  ulasan: string;
  created: string;
  updated: string;
};

export type ExpandedUser = {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  avatar?: string;
  // Tambahkan field lain yang mungkin ada di user record Anda
  username?: string; 
  phone?: string; 
};

export type DisplayableReview = {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  rating: number;
  comment: string;
  date: string;
  createdTimestamp: number;
};

export type ProductDetail = {
  id: string;
  collectionId: string;
  product_name: string;
  description: string;
  price: number;
  discount: number;
  product_image: string[];
  by_organization?: {
    id: string;
    organization_name: string;
    creator_phone?: string; 
  } | null;
  added_by?: {
    id: string;
    name: string;
  } | null;
  catalog?: {
    id: string;
    name: string;
  }[] | null;
  stock?: number;
  tinggi?: number;
  lebar?: number;
  berat?: number;
  alat_bahan?: string;
  petunjuk_penyimpanan?: string;
  all_reviews_unfiltered?: DisplayableReview[];
  average_rating?: number;
  total_reviews?: number;
};

type FavoriteRecord = RecordModel & {
    danusers_id: string;
    products_id: string[];
};
// --- AKHIR TIPE DATA ---

const ClickableRatingStars = ({ rating, setRating, starSize = "h-6 w-6", hoverColor = "hover:text-yellow-500", color = "text-yellow-400" }: { rating: number; setRating: (rating: number) => void; starSize?: string; hoverColor?: string; color?: string; }) => {
  const totalStars = 5;
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`${starSize} cursor-pointer transition-colors ${starValue <= (hoverRating || rating) ? `${color} fill-current` : 'text-gray-300 dark:text-gray-600'} ${hoverColor}`}
            onClick={() => setRating(starValue)} onMouseEnter={() => setHoverRating(starValue)} onMouseLeave={() => setHoverRating(0)}
          />);
      })}
    </div>
  );
};

const RatingStars = ({ rating, starSize = "h-5 w-5" }: { rating: number; starSize?: string }) => {
  const totalStars = 5;
  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => (
        <StarIcon key={index} className={`${starSize} ${index < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
    </div>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<string>("-created");

  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
  const [userFavoriteIds, setUserFavoriteIds] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
    if (!currentUser || !pb.authStore.isValid) {
        setUserFavoriteIds(new Set());
        setFavoriteRecordId(null);
        setLoadingFavorites(false);
        return;
    }
    setLoadingFavorites(true);
    try {
        const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal });
        if (!signal?.aborted) {
            const favIds = new Set(record.products_id || []);
            setUserFavoriteIds(favIds);
            setFavoriteRecordId(record.id);
            if (product) { setIsFavorited(favIds.has(product.id)); }
        }
    } catch (err: any) {
        if (!signal?.aborted) {
            if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') { console.warn("Favorite fetch was cancelled (Ignored)."); }
            else if (err.status === 404) { setUserFavoriteIds(new Set()); setFavoriteRecordId(null); if (product) setIsFavorited(false); }
            else { console.error("Failed to fetch favorites:", err); setUserFavoriteIds(new Set()); setFavoriteRecordId(null); if (product) setIsFavorited(false); }
        }
    } finally { if (!signal?.aborted) { setLoadingFavorites(false); } }
  }, [currentUser, product]);

  useEffect(() => {
    const controller = new AbortController();
    if (currentUser) { fetchUserFavorites(controller.signal); }
    else { setLoadingFavorites(false); setIsFavorited(false); }
    return () => { controller.abort(); };
  }, [currentUser, fetchUserFavorites]);

   useEffect(() => {
    if (product && userFavoriteIds) { setIsFavorited(userFavoriteIds.has(product.id)); }
  }, [product, userFavoriteIds]);

  const handleToggleFavorite = async () => {
    if (!currentUser || !product) { toast({ title: "Harap Login", description: "Anda harus login untuk mengubah favorit.", variant: "destructive" }); return; }
    setTogglingFavorite(true);
    const currentProductId = product.id;
    const currentIsFavorited = isFavorited;
    try {
        let newFavoriteProductIds: string[];
        if (currentIsFavorited) { newFavoriteProductIds = Array.from(userFavoriteIds).filter(id => id !== currentProductId); }
        else { newFavoriteProductIds = [...Array.from(userFavoriteIds), currentProductId]; }
        newFavoriteProductIds = [...new Set(newFavoriteProductIds)];
        if (favoriteRecordId) { await pb.collection('danusin_favorite').update(favoriteRecordId, { products_id: newFavoriteProductIds }); }
        else { const newRecord = await pb.collection('danusin_favorite').create<FavoriteRecord>({ danusers_id: currentUser.id, products_id: newFavoriteProductIds, }); setFavoriteRecordId(newRecord.id); }
        setUserFavoriteIds(new Set(newFavoriteProductIds));
        setIsFavorited(!currentIsFavorited);
        toast({ title: "Favorit Diperbarui", description: `${product.product_name} ${currentIsFavorited ? 'dihapus dari' : 'ditambahkan ke'} favorit.` });
    } catch (error: any) {
        console.error("Error toggling favorite:", error);
        let errMsg = "Gagal memperbarui favorit.";
        if (error instanceof ClientResponseError) { errMsg = error.response?.message || errMsg; }
        else if (error instanceof Error) { errMsg = error.message; }
        toast({ title: "Error", description: errMsg, variant: "destructive" });
        await fetchUserFavorites(new AbortController().signal);
    } finally { setTogglingFavorite(false); }
  };

  const fetchProductReviews = async (productId: string, abortSignal: AbortSignal): Promise<{ reviews: DisplayableReview[], average: number, total: number }> => {
    try {
      const reviewsListResult = await pb.collection('danusin_product_review').getList<ReviewRecord & { expand?: { id_user?: ExpandedUser } }>(1, 50, { filter: `id_product = "${productId}"`, sort: '-created', expand: 'id_user', signal: abortSignal, });
      const formattedReviews: DisplayableReview[] = reviewsListResult.items.map(item => {
        const userDetail = item.expand?.id_user;
        let avatarUrl = `/placeholder.svg?text=${(userDetail?.name || "U").substring(0,2).toUpperCase()}&height=40&width=40`;
        if (userDetail && userDetail.avatar && userDetail.collectionId && userDetail.id) {
          const userRecordForAvatar = { collectionId: userDetail.collectionId, id: userDetail.id, avatar: userDetail.avatar };
          avatarUrl = pb.getFileUrl(userRecordForAvatar, userDetail.avatar, { thumb: '100x100' });
        }
        return { id: item.id, user: { id: userDetail?.id || item.id_user, name: userDetail?.name || "User Anonim", avatarUrl: avatarUrl, }, rating: item.rating, comment: item.ulasan, date: new Date(item.created).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }), createdTimestamp: new Date(item.created).getTime(), };
      });
      return { reviews: formattedReviews, average: 0, total: 0 }; // Average & total dihitung di useEffect terpisah
    } catch (err: any) { if (err.name !== 'AbortError') { console.error("Gagal mengambil ulasan produk:", err); } return { reviews: [], average: 0, total: 0 }; }
  };

  useEffect(() => {
    const abortController = new AbortController();
    if (slug) {
      const fetchProductData = async () => {
        setLoading(true); setError(null);
        try {
          const record = await pb.collection('danusin_product').getOne(slug, { expand: 'by_organization,added_by,catalog,by_organization.created_by', signal: abortController.signal });
          const reviewData = await fetchProductReviews(record.id, abortController.signal);
          let productDetailExtra: any = {};
          try { productDetailExtra = await pb.collection('danusin_product_detail').getFirstListItem(`id_product = "${record.id}"`, { signal: abortController.signal }); }
          catch (detailErr: any) { if (detailErr.status !== 404 && !abortController.signal.aborted) { console.warn("Gagal mengambil detail produk tambahan:", detailErr); } }
          
          const orgRecord = record.expand?.by_organization as (RecordModel & { organization_name: string, expand?: { created_by?: ExpandedUser } }) | undefined; // Perluas tipe ExpandedUser di sini
          const orgCreatorRecord = orgRecord?.expand?.created_by;

          const fetchedProduct: ProductDetail = {
            id: record.id, collectionId: record.collectionId, product_name: record.product_name,
            description: record.description || "Deskripsi produk ini belum tersedia.",
            price: record.price, discount: record.discount, product_image: record.product_image || [],
            by_organization: orgRecord ? { id: orgRecord.id, organization_name: orgRecord.organization_name, creator_phone: orgCreatorRecord?.phone } : null,
            added_by: record.expand?.added_by ? { id: record.expand.added_by.id, name: record.expand.added_by.name } : null,
            catalog: record.expand?.catalog ? record.expand.catalog.map((cat: any) => ({ id: cat.id, name: cat.name })) : null,
            stock: record.stock,
            tinggi: productDetailExtra.tinggi, lebar: productDetailExtra.lebar, berat: productDetailExtra.berat,
            alat_bahan: productDetailExtra.alat_bahan, petunjuk_penyimpanan: productDetailExtra.petunjuk_penyimpanan,
            all_reviews_unfiltered: reviewData.reviews,
          };
          setProduct(fetchedProduct); setCurrentImageIndex(0);
        } catch (err: any) {
          if (err.name === 'AbortError' || err.isAbort) { console.log(`Request untuk produk ${slug} dibatalkan.`);}
          else {
            console.error("Gagal mengambil detail produk utama:", err);
            if (err.status === 404) { setError("Produk tidak ditemukan."); }
            else if (err.status === 403) { setError("Anda tidak memiliki izin untuk melihat produk ini.");}
            else { setError("Terjadi kesalahan saat mengambil data produk."); }
          }
        } finally { if (!abortController.signal.aborted) { setLoading(false); } }
      };
      fetchProductData();
      return () => { abortController.abort(); };
    } else { setLoading(false); setError("ID Produk tidak valid atau tidak ditemukan di URL."); }
  }, [slug]);

  const filteredAndSortedReviews = useMemo(() => {
    if (!product?.all_reviews_unfiltered) return [];
    let reviews = [...product.all_reviews_unfiltered];
    if (ratingFilter > 0) { reviews = reviews.filter(review => review.rating === ratingFilter); }
    if (sortOrder === '-created') { reviews.sort((a, b) => b.createdTimestamp - a.createdTimestamp); }
    else if (sortOrder === 'created') { reviews.sort((a, b) => a.createdTimestamp - b.createdTimestamp); }
    return reviews;
  }, [product?.all_reviews_unfiltered, ratingFilter, sortOrder]);

  useEffect(() => {
    if (product && product.all_reviews_unfiltered) {
        const currentReviewsToConsider = ratingFilter > 0 ? filteredAndSortedReviews : product.all_reviews_unfiltered;
        if (currentReviewsToConsider.length > 0) {
            const totalRating = currentReviewsToConsider.reduce((sum, rev) => sum + rev.rating, 0);
            const average = totalRating / currentReviewsToConsider.length;
            setProduct(prev => prev ? ({...prev, average_rating: average, total_reviews: currentReviewsToConsider.length}) : null);
        } else {
            setProduct(prev => prev ? ({...prev, average_rating: 0, total_reviews: 0}) : null);
        }
    }
    setCurrentReviewPage(1);
  }, [filteredAndSortedReviews, ratingFilter, product?.all_reviews_unfiltered]); // product?.all_reviews_unfiltered diperlukan di sini

  const paginatedReviews = useMemo(() => { const startIndex = (currentReviewPage - 1) * REVIEWS_PER_PAGE; return filteredAndSortedReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE); }, [filteredAndSortedReviews, currentReviewPage]);
  const totalReviewPages = Math.ceil(filteredAndSortedReviews.length / REVIEWS_PER_PAGE);

  const nextImage = () => { if (product && product.product_image.length > 0) { setCurrentImageIndex((prev) => (prev + 1) % product.product_image.length); } };
  const prevImage = () => { if (product && product.product_image.length > 0) { setCurrentImageIndex((prev) => (prev - 1 + product.product_image.length) % product.product_image.length); } };
  const selectImage = (index: number) => { setCurrentImageIndex(index); };

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !currentUser?.id) { toast({title: "Login Diperlukan", description: "Anda harus login untuk mengirim ulasan.", variant: "destructive"}); return; }
    if (newReviewRating === 0) { toast({title: "Rating Kosong", description:"Mohon berikan rating bintang.", variant: "destructive"}); return; }
    if (!newReviewComment.trim()) { toast({title: "Ulasan Kosong", description:"Mohon tulis ulasan Anda.", variant: "destructive"}); return; }
    setSubmittingReview(true);
    try {
        const reviewData = { id_product: product.id, id_user: currentUser.id, rating: newReviewRating, ulasan: newReviewComment, };
        await pb.collection('danusin_product_review').create(reviewData);
        const reviewDataResult = await fetchProductReviews(product.id, new AbortController().signal);
        setProduct(prevProduct => prevProduct ? ({ ...prevProduct, all_reviews_unfiltered: reviewDataResult.reviews }) : null);
        setNewReviewRating(0); setNewReviewComment("");
        toast({title: "Ulasan Terkirim", description:"Ulasan Anda telah berhasil dikirim!"});
    } catch (err) { console.error("Gagal mengirim ulasan:", err); toast({title: "Gagal Mengirim Ulasan", description:"Gagal mengirim ulasan. Silakan coba lagi.", variant: "destructive"});
    } finally { setSubmittingReview(false); }
  };

  const handleBeliProduk = () => {
    if (!product || !product.by_organization?.creator_phone) {
      toast({ title: "Informasi Tidak Lengkap", description: "Nomor WhatsApp penjual tidak tersedia.", variant: "destructive", }); return;
    }
    const phoneNumber = product.by_organization.creator_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Halo, saya tertarik dengan produk "${product.product_name}". Apakah masih tersedia?`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading || loadingFavorites) {
    return ( <div className="max-w-7xl mx-auto animate-pulse"> <Skeleton className="h-10 w-3/5 mb-6" /> <div className="grid md:grid-cols-2 gap-6 lg:gap-10"> <div> <Skeleton className="aspect-[4/3] w-full rounded-lg mb-3" /> <div className="grid grid-cols-4 gap-2"> {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-md" />)} </div> </div> <div className="space-y-4"> <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-6 w-1/2" /> <div className="flex gap-2"> <Skeleton className="h-6 w-20 rounded-full" /> <Skeleton className="h-6 w-24 rounded-full" /> </div> <Skeleton className="h-20 w-full" /> <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-12 w-full" /> </div> </div> <Skeleton className="h-40 w-full mt-8" /> <Skeleton className="h-60 w-full mt-8" /> </div>);
  }
  if (error) {
    return ( <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]"> <AlertTriangle className="w-16 h-16 text-red-500 mb-4" /> <h2 className="text-2xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h2> <p className="text-neutral-600 dark:text-zinc-400">{error}</p> <Button asChild className="mt-6"> <Link href="/dashboard/products">Kembali ke Daftar Produk</Link> </Button> </div>);
  }
  if (!product) {
    return ( <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]"> <Info className="w-16 h-16 text-neutral-500 mb-4" /> <h2 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Produk Tidak Ditemukan</h2> <p className="text-neutral-600 dark:text-zinc-400">Produk yang Anda cari mungkin telah dihapus atau URL tidak valid.</p> <Button asChild className="mt-6"> <Link href="/dashboard/products">Kembali ke Daftar Produk</Link> </Button> </div>);
  }

  const mainImageUrl = product.product_image && product.product_image.length > 0 ? pb.getFileUrl(product, product.product_image[currentImageIndex], { thumb: '800x600' }) : "/placeholder.svg?height=600&width=800&text=Tidak+Ada+Gambar";
  const displayPrice = product.discount && product.discount > 0 && product.discount < product.price ? ( <> <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rp{product.discount.toLocaleString('id-ID')}</span> <span className="ml-2 sm:ml-3 text-lg sm:text-xl line-through text-neutral-500 dark:text-zinc-400">Rp{product.price.toLocaleString('id-ID')}</span> <Badge variant="destructive" className="ml-2 sm:ml-3 text-xs sm:text-sm"> HEMAT {(((product.price - product.discount) / product.price) * 100).toFixed(0)}% </Badge> </> ) : ( <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rp{product.price.toLocaleString('id-ID')}</span> );
  const accordionTextColor = "text-[#8B4D65] dark:text-[#c58da9]";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 lg:mb-12">
        <div className="relative">
          <div className="aspect-[4/3] relative overflow-hidden rounded-lg border dark:border-zinc-700 shadow-lg">
            <Image src={mainImageUrl} alt={product.product_name} fill className="object-cover transition-all duration-300" priority />
            {product.product_image && product.product_image.length > 1 && ( <> <Button onClick={prevImage} variant="outline" size="icon" className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black border-neutral-300 dark:border-zinc-600 h-8 w-8 sm:h-10 sm:w-10"> <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /> </Button> <Button onClick={nextImage} variant="outline" size="icon" className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black border-neutral-300 dark:border-zinc-600 h-8 w-8 sm:h-10 sm:w-10"> <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /> </Button> </> )}
          </div>
          {product.product_image && product.product_image.length > 1 && ( <div className="mt-3 grid grid-cols-4 gap-2"> {product.product_image.map((imgFile, index) => ( <div key={index} className={`aspect-square relative overflow-hidden rounded-md border dark:border-zinc-600 cursor-pointer transition-all duration-200 ${currentImageIndex === index ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-black' : 'hover:opacity-80'}`} onClick={() => selectImage(index)}> <Image src={pb.getFileUrl(product, imgFile, { thumb: '100x100' })} alt={`${product.product_name} thumbnail ${index + 1}`} fill className="object-cover" /> </div> ))} </div> )}
        </div>

        <div className="flex flex-col space-y-3 sm:space-y-4">
          {product.by_organization && (<Link href={`/dashboard/organizations/${product.by_organization.id}`} className={`text-xs sm:text-sm font-medium flex items-center ${accordionTextColor} hover:opacity-80`}><Building2 className="h-4 w-4 mr-1.5" /> {product.by_organization.organization_name}</Link>)}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-neutral-800 dark:text-neutral-100">{product.product_name}</h1>
          <div className="flex items-center gap-3"> <RatingStars rating={product.average_rating || 0} starSize="h-5 w-5 sm:h-6 sm:w-6"/> <span className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400">({product.total_reviews || 0} ulasan)</span> </div>
          <div className="flex items-baseline pt-1"> {displayPrice} </div>
          {product.catalog && product.catalog.length > 0 && (<div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-zinc-400">Kategori:</span>{product.catalog.map(cat => (<Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.id)}`} passHref><Badge variant="secondary" className="cursor-pointer hover:bg-neutral-200 dark:hover:bg-zinc-700 text-xs"> {cat.name} </Badge></Link>))}</div>)}
          {product.stock !== undefined && product.stock !== null && (<p className={`text-xs sm:text-sm font-medium ${product.stock > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{product.stock > 0 ? `Stok: ${product.stock} unit` : "Stok Habis"}</p>)}
          
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 sm:pt-4 mt-auto">
            <Button size="lg" className="text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white w-full sm:flex-1" onClick={handleBeliProduk} disabled={!product.by_organization?.creator_phone} >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Beli Produk
            </Button>
            <Button size="lg" variant="outline" className="text-sm sm:text-base w-full sm:w-auto" onClick={handleToggleFavorite} disabled={!currentUser || togglingFavorite || loadingFavorites} >
              {togglingFavorite ? ( <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> ) : ( isFavorited ? ( <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 fill-red-500 text-red-500" /> ) : ( <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> ) )}
              Favorit
            </Button>
          </div>
          {product.added_by && (<div className="text-xs text-neutral-500 dark:text-zinc-400 flex items-center pt-3 border-t dark:border-zinc-700 mt-2"><User className="h-3.5 w-3.5 mr-1.5" /> Ditambahkan oleh: {product.added_by.name}</div>)}
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        <div> <div className={`p-4 sm:p-6 bg-white dark:bg-zinc-800/30 rounded-xl border border-gray-200 dark:border-zinc-700/80`}> <div className={`text-xs sm:text-sm mb-2 uppercase tracking-wider font-medium ${accordionTextColor}`}>Deskripsi Produk</div> {product.description ? ( <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none text-neutral-700 dark:text-zinc-300 mt-2 break-words" dangerouslySetInnerHTML={{ __html: product.description }} /> ) : (<p className="text-sm leading-relaxed mt-2"><em>Tidak ada deskripsi detail untuk produk ini.</em></p>)} </div> </div>
        <div> <div className="bg-[#FAF9F9] dark:bg-zinc-800 p-4 sm:p-6 rounded-lg border dark:border-zinc-700/80"> <Accordion type="single" collapsible className="space-y-1 w-full" defaultValue="product-info"> <AccordionItem value="product-info" className="border-none"> <AccordionTrigger className={`${accordionTextColor} hover:no-underline group transition-all duration-300 ease-in-out text-sm sm:text-base`}> <div className="flex items-center gap-2 group-hover:translate-x-0.5 transition-transform duration-300 ease-in-out"> <Ruler className="h-4 w-4" /> <span className="font-semibold tracking-wide">INFORMASI PRODUK</span> </div> </AccordionTrigger> <AccordionContent className="text-xs sm:text-sm space-y-3 pt-3 text-neutral-700 dark:text-zinc-300"> {product.tinggi !== undefined && product.tinggi !== null ? ( <div className="flex justify-between"><strong className={`${accordionTextColor}`}>Tinggi:</strong> <span>{product.tinggi} cm</span></div> ) : null} {product.lebar !== undefined && product.lebar !== null ? ( <div className="flex justify-between"><strong className={`${accordionTextColor}`}>Lebar:</strong> <span>{product.lebar} cm</span></div> ) : null} {product.berat !== undefined && product.berat !== null ? ( <div className="flex justify-between"><strong className={`${accordionTextColor}`}>Berat:</strong> <span>{product.berat} kg</span></div> ) : null} {product.tinggi === undefined && product.lebar === undefined && product.berat === undefined && ( <p><i>Informasi ukuran & berat tidak tersedia.</i></p> )} </AccordionContent> </AccordionItem> <AccordionItem value="material" className="border-none"> <AccordionTrigger className={`${accordionTextColor} hover:no-underline group transition-all duration-300 ease-in-out text-sm sm:text-base`}> <div className="flex items-center gap-2 group-hover:translate-x-0.5 transition-transform duration-300 ease-in-out"> <Brush className="h-4 w-4" /> <span className="font-semibold tracking-wide">ALAT DAN BAHAN</span> </div> </AccordionTrigger> <AccordionContent className="pt-3 text-neutral-700 dark:text-zinc-300"> {product.alat_bahan ? ( <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.alat_bahan }} /> ) : ( <p><i>Detail alat dan bahan tidak tersedia.</i></p> )} </AccordionContent> </AccordionItem> <AccordionItem value="care" className="border-none"> <AccordionTrigger className={`${accordionTextColor} hover:no-underline group transition-all duration-300 ease-in-out text-sm sm:text-base`}> <div className="flex items-center gap-2 group-hover:translate-x-0.5 transition-transform duration-300 ease-in-out"> <Shield className="h-4 w-4" /> <span className="font-semibold tracking-wide">PETUNJUK PENYIMPANAN</span> </div> </AccordionTrigger> <AccordionContent className="pt-3 text-neutral-700 dark:text-zinc-300"> {product.petunjuk_penyimpanan ? ( <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.petunjuk_penyimpanan }} /> ) : <p className="text-xs sm:text-sm"><i>Petunjuk penyimpanan tidak tersedia.</i></p>} </AccordionContent> </AccordionItem> </Accordion> </div> </div>
        <div> <div className="p-4 sm:p-6 bg-white dark:bg-zinc-800/30 rounded-xl border border-gray-200 dark:border-zinc-700/80"> <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 sm:mb-6 gap-3 md:gap-4"> <h2 className={`text-xl sm:text-2xl font-semibold ${accordionTextColor}`}>Ulasan Pengguna</h2> <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"> <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(parseInt(value))}> <SelectTrigger className="w-full sm:w-[150px] md:w-[160px] text-xs sm:text-sm dark:bg-zinc-700/50 dark:border-zinc-600"> <SelectValue placeholder="Filter Rating" /> </SelectTrigger> <SelectContent className="dark:bg-zinc-800"> <SelectItem value="0">Semua Rating</SelectItem> {[5,4,3,2,1].map(r => <SelectItem key={r} value={r.toString()}>{r} Bintang</SelectItem>)} </SelectContent> </Select> <Select value={sortOrder} onValueChange={setSortOrder}> <SelectTrigger className="w-full sm:w-[150px] md:w-[160px] text-xs sm:text-sm dark:bg-zinc-700/50 dark:border-zinc-600"> <SelectValue placeholder="Urutkan" /> </SelectTrigger> <SelectContent className="dark:bg-zinc-800"> <SelectItem value="-created">Terbaru</SelectItem> <SelectItem value="created">Terlama</SelectItem> </SelectContent> </Select> </div> </div> {filteredAndSortedReviews && filteredAndSortedReviews.length > 0 && ( <div className="flex items-center mb-4 sm:mb-6"> <RatingStars rating={product.average_rating || 0} starSize="h-6 w-6 sm:h-7 sm:w-7" /> <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-bold text-neutral-700 dark:text-neutral-200">{(product.average_rating || 0).toFixed(1)}</span> <span className="ml-1.5 sm:ml-2 text-sm sm:text-base text-neutral-500 dark:text-zinc-400">dari {product.total_reviews || 0} ulasan</span> </div> )} <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8"> {paginatedReviews && paginatedReviews.length > 0 ? paginatedReviews.map(review => ( <div key={review.id} className="pb-4 border-b dark:border-zinc-700 last:border-b-0"> <div className="flex items-start mb-1.5"> <Image src={review.user.avatarUrl || `/placeholder.svg?text=${review.user.name.substring(0,2).toUpperCase()}&height=32&width=32`} alt={review.user.name} width={32} height={32} className="rounded-full mr-2.5 sm:mr-3 mt-0.5 object-cover" /> <div> <span className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 block">{review.user.name}</span> <span className="text-xs text-neutral-400 dark:text-zinc-500">{review.date}</span> </div> <div className="ml-auto pt-0.5"><RatingStars rating={review.rating} starSize="h-3.5 w-3.5 sm:h-4 sm:w-4" /></div> </div> <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-zinc-300 pl-[42px] sm:pl-12">{review.comment}</p> </div> )) : <p className="text-sm text-neutral-500 dark:text-zinc-400">Tidak ada ulasan yang sesuai dengan filter Anda.</p>} </div> {totalReviewPages > 1 && ( <div className="flex justify-center items-center gap-2 mt-6"> <Button variant="outline" size="sm" onClick={() => setCurrentReviewPage(p => Math.max(1, p - 1))} disabled={currentReviewPage === 1} className="text-xs sm:text-sm"> <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Sebelumnya </Button> <span className="text-xs sm:text-sm text-neutral-600 dark:text-zinc-400"> Halaman {currentReviewPage} dari {totalReviewPages} </span> <Button variant="outline" size="sm" onClick={() => setCurrentReviewPage(p => Math.min(totalReviewPages, p + 1))} disabled={currentReviewPage === totalReviewPages} className="text-xs sm:text-sm"> Berikutnya <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" /> </Button> </div> )} <form onSubmit={handleSubmitReview} className="mt-6 sm:mt-8 pt-6 border-t dark:border-zinc-700"> <h3 className={`text-lg sm:text-xl font-semibold mb-3 ${accordionTextColor}`}>Bagikan Pendapat Anda</h3> <div className="mb-3 sm:mb-4"> <Label htmlFor="rating" className={`block text-xs sm:text-sm font-medium mb-1.5 ${accordionTextColor}`}>Rating Anda:</Label> <ClickableRatingStars rating={newReviewRating} setRating={setNewReviewRating} /> </div> <div className="mb-3 sm:mb-4"> <Label htmlFor="comment" className={`block text-xs sm:text-sm font-medium mb-1.5 ${accordionTextColor}`}>Ulasan Anda:</Label> <Textarea id="comment" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="Tulis ulasan Anda di sini..." rows={4} className="text-sm dark:bg-zinc-700/50 dark:border-zinc-600 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400" /> </div> <Button type="submit" disabled={submittingReview || !currentUser} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-70"> {submittingReview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="mr-2 h-4 w-4" /> Kirim Ulasan</>} </Button> {!currentUser && <p className="text-xs text-red-500 mt-2">Anda harus login untuk mengirim ulasan.</p>} </form> </div> </div>
      </div>
    </div>
  );
}