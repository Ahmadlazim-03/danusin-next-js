// components/product/ProductReviewsSection.tsx
"use client";

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star as StarIcon, Send, Loader2 } from 'lucide-react';


// Komponen untuk bintang rating (bisa diklik untuk input)
const ClickableRatingStars = ({ rating, setRating, starSize = "h-6 w-6", hoverColor = "hover:text-yellow-500", color = "text-yellow-400" }: { rating: number; setRating: (rating: number) => void; starSize?: string; hoverColor?: string; color?: string; }) => {
  const totalStars = 5;
  const [hoverRating, setHoverRating] = useState(0); // Tambahkan useState di sini
  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`${starSize} cursor-pointer transition-colors 
                        ${starValue <= (hoverRating || rating) ? `${color} fill-current` : 'text-gray-300 dark:text-gray-600'}
                        ${hoverColor}`}
            onClick={() => setRating(starValue)} onMouseEnter={() => setHoverRating(starValue)} onMouseLeave={() => setHoverRating(0)}
          />);
      })}
    </div>
  );
};

// Komponen untuk menampilkan bintang rating (tidak bisa diklik)
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


// Define the DisplayableReview type
type DisplayableReview = {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  rating: number;
  comment: string;
  date: string;
};

interface ProductReviewsSectionProps {
    averageRating: number;
    totalReviews: number;
    reviewsList: DisplayableReview[];
    // Props untuk form ulasan
    newReviewRating: number;
    setNewReviewRating: (rating: number) => void;
    newReviewComment: string;
    setNewReviewComment: (comment: string) => void;
    submittingReview: boolean;
    handleSubmitReview: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    isUserLoggedIn: boolean;
    accordionTextColor?: string; // Opsional, bisa di-default
}

export default function ProductReviewsSection({
    averageRating,
    totalReviews,
    reviewsList,
    newReviewRating,
    setNewReviewRating,
    newReviewComment,
    setNewReviewComment,
    submittingReview,
    handleSubmitReview,
    isUserLoggedIn,
    accordionTextColor = "text-[#8B4D65] dark:text-[#c58da9]", // Default color
}: ProductReviewsSectionProps) {
    return (
        <div className="p-6 bg-white dark:bg-zinc-800/30 rounded-xl border border-gray-200 dark:border-zinc-700/80">
            <h2 className={`text-2xl font-semibold mb-6 ${accordionTextColor}`}>Ulasan Pengguna</h2>
            {reviewsList && reviewsList.length > 0 && (
                <div className="flex items-center mb-6">
                    <RatingStars rating={averageRating || 0} starSize="h-7 w-7" />
                    <span className="ml-3 text-2xl font-bold text-neutral-700 dark:text-neutral-200">{(averageRating || 0).toFixed(1)}</span>
                    <span className="ml-2 text-base text-neutral-500 dark:text-zinc-400">dari {totalReviews || 0} ulasan</span>
                </div>
            )}
            <div className="space-y-6 mb-8">
                {reviewsList && reviewsList.length > 0 ? reviewsList.slice(0, 3).map(review => ( // Tampilkan 3 ulasan awal
                    <div key={review.id} className="pb-4 border-b dark:border-zinc-700 last:border-b-0">
                        <div className="flex items-start mb-1.5">
                            <Image 
                                src={review.user.avatarUrl || `/placeholder.svg?text=${review.user.name.substring(0, 2).toUpperCase()}&height=40&width=40`} 
                                alt={review.user.name} 
                                width={40} height={40} 
                                className="rounded-full mr-3 mt-0.5 object-cover" 
                            />
                            <div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-100 block">{review.user.name}</span>
                                <span className="text-xs text-neutral-400 dark:text-zinc-500">{review.date}</span>
                            </div>
                            <div className="ml-auto pt-0.5"><RatingStars rating={review.rating} starSize="h-4 w-4" /></div>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-300 pl-12">{review.comment}</p>
                    </div>
                )) : <p className="text-sm text-neutral-500 dark:text-zinc-400">Belum ada ulasan untuk produk ini.</p>}
            </div>

            <form onSubmit={handleSubmitReview} className="mt-6 pt-6 border-t dark:border-zinc-700">
                <h3 className={`text-xl font-semibold mb-3 ${accordionTextColor}`}>Bagikan Pendapat Anda</h3>
                <div className="mb-4">
                    <Label htmlFor="rating" className={`block text-sm font-medium mb-1.5 ${accordionTextColor}`}>Rating Anda:</Label>
                    <ClickableRatingStars rating={newReviewRating} setRating={setNewReviewRating} />
                </div>
                <div className="mb-4">
                    <Label htmlFor="comment" className={`block text-sm font-medium mb-1.5 ${accordionTextColor}`}>Ulasan Anda:</Label>
                    <Textarea
                        id="comment" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Tulis ulasan Anda di sini..." rows={4}
                        className="dark:bg-zinc-700/50 dark:border-zinc-600 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                    />
                </div>
                <Button type="submit" disabled={submittingReview || !isUserLoggedIn} className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-70">
                    {submittingReview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="mr-2 h-4 w-4" /> Kirim Ulasan</>}
                </Button>
                {!isUserLoggedIn && <p className="text-xs text-red-500 mt-2">Anda harus login untuk mengirim ulasan.</p>}
            </form>
        </div>
    );
}

// Anda mungkin ingin memindahkan tipe ini ke file terpisah, misal types/product.ts
// agar bisa diimpor di kedua file (page.tsx dan ProductReviewsSection.tsx)
// Untuk sementara, saya duplikasi, tapi idealnya diimpor.
// export type DisplayableReview = { // Pastikan tipe ini konsisten
//   id: string;
//   user: {
//     id: string;
//     name: string;
//     avatarUrl?: string; 
//   };
//   rating: number;
//   comment: string;
//   date: string; 
// };