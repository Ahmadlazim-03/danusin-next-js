"use client"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"; // Tambahkan ChevronLeft dan ChevronRight
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/game-card";
import { useState } from "react"; // Impor useState

type Game = {
  title: string;
  price: number;
  discount: number;
  image: string;
  tags: string[];
  rating: number;
  players: string;
  // Tambahkan id jika game memiliki ID unik, untuk key yang lebih baik
  // id?: string | number; 
};

type FeaturedGamesProps = {
  games: Game[];
};

export function FeaturedGames({ games }: FeaturedGamesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Maksimal 8 kartu per halaman

  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGames = games.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center 
                       text-neutral-800 dark:text-white">
          <Sparkles className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Featured & Recommended
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600
                     dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400
                     transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {currentGames.map((game, index) => (
          // Jika game memiliki ID unik, gunakan game.id sebagai key: <GameCard key={game.id || index} game={game} />
          <GameCard key={`${game.title}-${startIndex + index}`} game={game} />
        ))}
      </div>

      {/* Kontrol Paginasi */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 md:mt-8">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:hover:bg-zinc-800
                       dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 h-9 sm:h-10 px-3 rounded-md"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Prev</span>
          </Button>

          <span className="text-sm font-medium text-neutral-600 dark:text-zinc-400 px-2">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:hover:bg-zinc-800
                       dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 h-9 sm:h-10 px-3 rounded-md"
            aria-label="Next page"
          >
            <span className="text-xs sm:text-sm">Next</span>
            <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
        </div>
      )}
    </section>
  );
}