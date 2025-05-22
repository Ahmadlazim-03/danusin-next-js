import Link from "next/link";
import { Flame, Zap, Award, Clock, Percent, Gamepad2, ChevronRight, Tag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <div className="space-y-6">
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
          <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
            <Flame className="mr-2 h-4 w-4" />
            DISCOVER
          </h3>
          <ul className="space-y-2">
            {[
              { label: "New & Noteworthy", icon: <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> },
              { label: "Top Sellers", icon: <Award className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> },
              { label: "Upcoming", icon: <Clock className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> },
              { label: "Special Offers", icon: <Percent className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> },
              { label: "VR Games", icon: <Gamepad2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href="#"
                  className="flex items-center text-white hover:text-emerald-400 transition-colors duration-300 group"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
          <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            CATEGORIES
          </h3>
          <ul className="space-y-2">
            {["Action", "Adventure", "RPG", "Strategy", "Simulation"].map((category) => (
              <li key={category}>
                <Link
                  href="#"
                  className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                >
                  <span>{category}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </li>
            ))}
            <li>
              <Button
                variant="link"
                className="text-emerald-400 p-0 h-auto hover:text-emerald-300 transition-colors duration-300"
              >
                View all categories
              </Button>
            </li>
          </ul>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
          <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            TRENDING TAGS
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Open World", "RPG", "Souls-like", "FPS", "Multiplayer", "Roguelike", "Survival"].map(
              (tag, index) => (
                <Badge
                  key={index}
                  className="bg-zinc-700/50 hover:bg-emerald-500 transition-colors duration-300 cursor-pointer py-1 px-2 text-sm"
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