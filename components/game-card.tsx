"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Users, Heart as HeartIcon } from "lucide-react" // Mengganti nama Heart agar tidak konflik
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card" // Asumsi Card dari shadcn/ui
import { motion } from "framer-motion"

interface GameCardProps {
  game: {
    title: string
    price: number
    discount?: number
    image: string
    tags: string[]
    rating: number
    players: string
  }
}

export function GameCard({ game }: GameCardProps) {
  // isHovered tetap digunakan untuk animasi Framer Motion yang kompleks & glow
  const [isHovered, setIsHovered] = useState(false)
  // State untuk fill pada ikon hati
  const [isFavorited, setIsFavorited] = useState(false) // Contoh state, bisa diganti dengan data dari API

  const calculatedDiscountedPrice = game.discount && game.discount > 0 
    ? game.price * (1 - game.discount / 100) 
    : game.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.02, // Sedikit lebih halus skala hovernya
        transition: { duration: 0.2 },
      }}
      className="h-full" // Memastikan motion.div mengisi tinggi parent jika di grid
    >
      <Card
        className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm 
                   border border-neutral-200/80 dark:border-zinc-700/60 
                   overflow-hidden group relative h-full transition-shadow duration-300 
                   hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow effect on hover (gradien di seluruh kartu) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 
                      group-hover:opacity-100 dark:group-hover:opacity-30 
                      transition-opacity duration-500 pointer-events-none rounded-lg`}
        />

        {/* Border glow - lebih sederhana via Card className hover */}
        
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={game.image || "/placeholder.svg?height=300&width=500"} // Placeholder lebih generik
            alt={game.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105" // Efek scale menggunakan group-hover
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          />

          {game.discount && game.discount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <motion.div
                animate={{
                  scale: isHovered ? [1, 1.15, 1] : 1, // Animasi scale tetap dengan isHovered
                  rotate: isHovered ? [0, -3, 3, -3, 0] : 0,
                }}
                transition={{
                  duration: 0.6,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 2.5,
                }}
              >
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 text-white shadow-lg font-bold border-none text-xs px-2.5 py-1">
                  -{game.discount}%
                </Badge>
              </motion.div>
            </div>
          )}

          {/* Overlay on hover dengan tombol */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent 
                       flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 
                       transition-opacity duration-300"
          >
            <div className="flex justify-between items-center">
                <Button 
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white 
                               hover:from-emerald-600 hover:to-cyan-600 
                               transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 
                               text-xs px-3 py-1.5 h-auto rounded-md"
                >
                    View Game
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-white/20 dark:bg-zinc-800/70 
                               border-white/30 dark:border-zinc-700 
                               text-white dark:text-zinc-300 
                               hover:bg-white/30 dark:hover:bg-zinc-700 
                               hover:border-emerald-500/70 dark:hover:border-emerald-500 
                               hover:text-emerald-500 dark:hover:text-emerald-400
                               transition-all duration-200 w-8 h-8"
                    onClick={() => setIsFavorited(!isFavorited)} // Contoh aksi favorit
                    aria-label="Add to Wishlist"
                >
                    <HeartIcon 
                        className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : (isHovered ? "stroke-rose-400 dark:stroke-rose-500" : "stroke-current")}`} 
                    />
                </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 relative z-10"> {/* bg dihilangkan, akan mewarisi dari Card */}
          <h3
            className="font-semibold text-sm sm:text-base mb-1 truncate 
                       text-neutral-800 dark:text-neutral-100 
                       group-hover:text-emerald-600 dark:group-hover:text-emerald-400 
                       transition-colors duration-300"
          >
            {game.title}
          </h3>

          <div className="flex flex-wrap gap-1 mb-2">
            {game.tags.slice(0, 2).map((tag, i) => ( // Hanya tampilkan 2 tag utama
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] sm:text-xs px-1.5 py-0.5 font-normal
                           border-neutral-300 dark:border-zinc-600 
                           text-neutral-600 dark:text-zinc-400 
                           group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 
                           group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 
                           group-hover:text-emerald-700 dark:group-hover:text-emerald-400
                           transition-all duration-300"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-semibold 
                            text-neutral-900 dark:text-white">
              {game.discount && game.discount > 0 ? (
                <>
                  <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">${game.price.toFixed(2)}</span>
                  <span>${calculatedDiscountedPrice.toFixed(2)}</span>
                </>
              ) : (
                <span>${game.price.toFixed(2)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 sm:gap-1 text-neutral-600 dark:text-zinc-300">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] sm:text-xs">{game.rating}</span>
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {game.players}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}