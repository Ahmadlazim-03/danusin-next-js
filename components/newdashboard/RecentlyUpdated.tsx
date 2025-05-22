import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/game-card";

type Game = {
  title: string;
  update: string;
  price: number;
  image: string;
  tags: string[];
  rating: number;
  players: string;
};

type RecentlyUpdatedProps = {
  games: Game[];
};

export function RecentlyUpdated({ games }: RecentlyUpdatedProps) {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
          <Clock className="mr-2 h-5 w-5 text-emerald-400" />
          Recently Updated
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300 min-w-[100px] min-h-[44px] text-sm"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {games.map((game, index) => (
          <GameCard key={index} game={game} />
        ))}
      </div>
    </section>
  );
}