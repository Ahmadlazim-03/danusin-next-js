import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame, LayoutDashboard, Locate, Map, Tag, Telescope, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <div className="space-y-6">
        
        {/* Bagian DISCOVER */}
        <div className="bg-emerald-100/80 bg-gradi backdrop-blur-lg dark:bg-zinc-800/80 dark:backdrop-blur-lg 
                        rounded-xl p-4 border border-neutral-200/70 dark:border-zinc-700/50 
                        shadow-sm hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 
                         mb-3.5 flex items-center text-[0.8rem] uppercase tracking-wider">
            <Locate className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Discover
          </h3>
          <ul className="space-y-1">
            {[
              { label: "Explore", icon: Telescope , url:"/dashboard"},
              { label: "Your Dashboard", icon: LayoutDashboard, url:"/explore" },
              { label: "Organization", icon: Users, url:"/dashboard/organization" },
              { label: "Trends", icon: Flame, url:"/dashboard/trend" },
              { label: "Map Explorer", icon: Map, url:"/dashboard/maps" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.url} // Ganti dengan path yang sesuai
                    className="flex items-center p-2 rounded-md transition-all duration-200 group 
                               text-neutral-600 dark:text-zinc-300 
                               hover:bg-emerald-50/80 dark:hover:bg-zinc-700/70 
                               hover:text-emerald-600 dark:hover:text-emerald-300"
                  >
                    <Icon className="mr-2.5 h-4 w-4 text-neutral-400 dark:text-zinc-400 
                                   group-hover:text-emerald-500 dark:group-hover:text-emerald-300 
                                   transition-colors duration-200 group-hover:scale-110" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bagian CATEGORIES */}
        <div className="bg-white/80 backdrop-blur-lg dark:bg-zinc-800/80 dark:backdrop-blur-lg
                        rounded-xl p-4 border border-neutral-200/70 dark:border-zinc-700/50 
                        shadow-sm hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 
                         mb-3.5 flex items-center text-[0.8rem] uppercase tracking-wider">
            <Tag className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Categories
          </h3>
          <ul className="space-y-1">
            {["Action", "Adventure", "RPG", "Strategy", "Simulation"].map((category) => (
              <li key={category}>
                <Link
                  href="#" // Ganti dengan path yang sesuai
                  className="flex items-center justify-between p-2 rounded-md transition-all duration-200 group 
                             text-neutral-600 dark:text-zinc-400 
                             hover:bg-emerald-50/80 dark:hover:bg-zinc-700/70 
                             hover:text-emerald-600 dark:hover:text-white"
                >
                  <span className="text-xs font-medium">{category}</span>
                  <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-zinc-500 
                                         group-hover:text-emerald-500 dark:group-hover:text-emerald-400 
                                         group-hover:translate-x-0.5 transition-all duration-200 opacity-70 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <Button
                variant="link"
                className="text-emerald-600 dark:text-emerald-400 
                           p-0 h-auto hover:text-emerald-700 dark:hover:text-emerald-300 
                           transition-colors duration-200 text-xs font-medium"
              >
                View all categories
              </Button>
            </li>
          </ul>
        </div>

        {/* Bagian TRENDING TAGS */}
        <div className="bg-white/80 backdrop-blur-lg dark:bg-zinc-800/80 dark:backdrop-blur-lg
                        rounded-xl p-4 border border-neutral-200/70 dark:border-zinc-700/50 
                        shadow-sm hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 
                         mb-3.5 flex items-center text-[0.8rem] uppercase tracking-wider">
            <TrendingUp className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Open World", "RPG", "Souls-like", "FPS", "Multiplayer", "Roguelike", "Survival"].map(
              (tag, index) => (
                <Badge
                  key={index}
                  variant="outline" // Menggunakan variant outline agar border lebih terlihat
                  className="border-emerald-300/70 bg-emerald-50/70 text-emerald-700 
                             dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-200 
                             hover:bg-emerald-100/80 dark:hover:bg-zinc-600/70
                             hover:border-emerald-400/70 dark:hover:border-zinc-500
                             transition-colors duration-200 cursor-pointer 
                             py-0.5 px-2.5 text-[0.7rem] font-medium rounded-full" // Dibuat pill-shaped
                >
                  {tag}
                </Badge>
              ),
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}