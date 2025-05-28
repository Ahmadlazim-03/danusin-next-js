"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card" // Asumsi Card dari shadcn/ui
import { motion } from "framer-motion"

interface SpecialOfferCardProps {
  deal: {
    title: string
    discount: string // Diskon bisa berupa teks seperti "Up to 50% OFF" atau "SALE"
    image: string
    endDate: string
    gradient: string // contoh: "from-purple-500 to-blue-500"
  }
}

export function SpecialOfferCard({ deal }: SpecialOfferCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.025, // Skala hover sedikit disesuaikan
        transition: { duration: 0.2 },
      }}
      className="h-full"
    >
      <Card
        className="bg-white dark:bg-zinc-800/50  // Latar belakang kartu utama theme-aware
                   border border-neutral-200/90 dark:border-zinc-700/60 
                   overflow-hidden group relative h-full transition-all duration-300 
                   hover:shadow-xl dark:hover:shadow-black/30 
                   dark:backdrop-blur-sm" // Backdrop blur hanya untuk dark mode jika light mode solid
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-[16/9] sm:aspect-video relative overflow-hidden"> {/* Aspect ratio disesuaikan */}
          <Image
            src={deal.image || "/placeholder.svg?height=300&width=500"}
            alt={deal.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradien Overlay dari props deal */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${deal.gradient} 
                        opacity-40 group-hover:opacity-60 transition-opacity duration-300`}
          ></div>

          {/* Konten Teks di atas Gambar */}
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <motion.div
              className="transform-gpu" // Untuk performa animasi yang lebih baik
              animate={{
                scale: isHovered ? 1.05 : 1, // Sedikit scale pada seluruh blok teks
                y: isHovered ? -5 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 text-white 
                             [text-shadow:0_2px_5px_rgba(0,0,0,0.6)]"> {/* Text shadow lebih kuat */}
                {deal.title}
              </h3>

              <motion.div
                animate={{
                  // Animasi rotate dan scale pada badge diskon
                  rotate: isHovered ? [-1, 1.5, -1.5, 1.5, -1, 0] : 0,
                  scale: isHovered ? [1, 1.08, 1] : 1,
                }}
                transition={{
                  duration: 0.7,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatType: "mirror",
                  repeatDelay: 1.5,
                }}
              >
                <Badge className="bg-white/95 dark:bg-black/60 text-neutral-900 dark:text-white 
                                  font-bold text-sm sm:text-base md:text-lg 
                                  px-3 py-1 sm:px-4 sm:py-1.5 
                                  shadow-xl rounded-md border border-white/20 dark:border-black/20">
                  {deal.discount}
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4"> {/* Padding konsisten */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-neutral-500 dark:text-zinc-400">
              Ends {deal.endDate}
            </span>

            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white
                         dark:bg-emerald-600 dark:hover:bg-emerald-700 
                         transition-all duration-200 
                         text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 rounded-md shadow hover:shadow-md"
            >
              View Deals
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}