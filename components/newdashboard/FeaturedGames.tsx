"use client"
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/game-card"; // Pastikan GameCard juga theme-aware

type Game = {
  title: string;
  price: number;
  discount: number;
  image: string;
  tags: string[];
  rating: number;
  players: string;
};

type FeaturedGamesProps = {
  games: Game[];
};

export function FeaturedGames({ games }: FeaturedGamesProps) {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center 
                       text-neutral-800 dark:text-white"> {/* Warna teks judul disesuaikan */}
          <Sparkles className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" /> {/* Warna ikon disesuaikan */}
          Featured & Recommended
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-300 text-neutral-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600
                     dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400
                     transition-all duration-300 min-w-[100px] min-h-[44px] text-sm"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {games.map((game, index) => (
          // Pastikan komponen GameCard Anda sudah responsif terhadap tema (light/dark)
          // Styling internal GameCard akan menentukan tampilan kartu game di sini.
          <GameCard key={index} game={game} />
        ))}
      </div>
    </section>
  );
}