"use client"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const heroGames = [
  {
    id: 1,
    title: "Crusader Kings III",
    description:
      "The new core expansion brings a wealth of new features to the acclaimed medieval grand strategy game.",
    image: "/placeholder.svg?height=600&width=1400", // Ganti dengan path gambar Anda
    tags: ["Strategy", "RPG", "Medieval", "Grand Strategy"],
    price: 49.99,
    discountedPrice: 39.99,
    discount: 20,
  },
  {
    id: 2,
    title: "Elden Ring",
    description:
      "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    image: "/placeholder.svg?height=600&width=1400", // Ganti dengan path gambar Anda
    tags: ["Action RPG", "Souls-like", "Open World", "Fantasy"],
    price: 59.99,
    discountedPrice: 59.99,
    discount: 0,
  },
  {
    id: 3,
    title: "Starfield",
    description:
      "Embark on an epic journey through the stars in Bethesda Game Studios' first new universe in over 25 years.",
    image: "/placeholder.svg?height=600&width=1400", // Ganti dengan path gambar Anda
    tags: ["RPG", "Space", "Open World", "Sci-Fi"],
    price: 69.99,
    discountedPrice: 59.49,
    discount: 15,
  },
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [direction, setDirection] = useState(0)

  const nextSlide = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroGames.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + heroGames.length) % heroGames.length)
  }

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        nextSlide()
      }, 6000) 
      return () => clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, currentIndex]) 

  const currentGame = heroGames[currentIndex]

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%", 
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 260, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 260, damping: 30 }, 
        opacity: { duration: 0.2 },
      },
    }),
  }

  return (
    <div
      className="mb-6 md:mb-10 relative rounded-xl overflow-hidden shadow-2xl dark:shadow-black/50" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[16/9] sm:aspect-[18/9] md:aspect-[21/9] relative"> 
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex} 
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            <Image
              src={currentGame.image || "/placeholder.svg?height=600&width=1400"}
              alt={currentGame.title}
              fill
              className="object-cover"
              priority={currentIndex === 0} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                            md:bg-gradient-to-r md:from-black/70 md:via-black/20 md:to-transparent 
                            flex flex-col justify-end p-4 py-5 sm:p-6 md:p-7 lg:p-8">
              <div className="max-w-xl lg:max-w-2xl"> 
                {/* Badge "Featured Game" - Disembunyikan hingga lg, tampil di lg+ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }} 
                  className="hidden lg:block" // Diubah dari sm:block ke lg:block
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 mb-2 sm:mb-3 text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider border-none">
                    Featured Game
                  </Badge>
                </motion.div>

                {/* Judul Game - Selalu tampil */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-2 text-white shadow-black/50 text-shadow-md"
                >
                  {currentGame.title}
                </motion.h2>

                {/* Deskripsi Game - Disembunyikan hingga lg, tampil di lg+ */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="hidden lg:block text-neutral-200 dark:text-zinc-300 mb-3 sm:mb-4 text-xs sm:text-sm md:text-sm lg:text-base line-clamp-2 md:line-clamp-2 lg:line-clamp-3" // Diubah dari md:block ke lg:block
                >
                  {currentGame.description}
                </motion.p>

                {/* Tags Game - Disembunyikan hingga lg, tampil di lg+ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="hidden lg:flex flex-wrap gap-1 sm:gap-1.5 mb-3 md:mb-3" // Diubah dari md:flex ke lg:flex
                >
                  {currentGame.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="backdrop-blur-sm bg-white/10 dark:bg-zinc-700/60 text-neutral-100 dark:text-zinc-200 
                                 hover:bg-white/20 dark:hover:bg-zinc-600/60 
                                 transition-colors duration-200 rounded-md text-[10px] sm:text-xs px-2 py-0.5 border-none"
                    >
                      {tag}
                    </Badge>
                  ))}
                </motion.div>

                {/* Tombol Buy Now dan Harga - Selalu tampil */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }} // Penyesuaian delay jika elemen di atasnya hilang
                  // Margin atas disesuaikan: mt-3 untuk xs, sm, md. mt-0 untuk lg+ saat elemen lain muncul.
                  className="flex items-center gap-2.5 sm:gap-3 md:gap-3 flex-wrap mt-3 lg:mt-0" 
                >
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 
                               hover:from-emerald-600 hover:to-cyan-600 
                               transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 
                               text-white text-xs sm:text-sm md:text-sm lg:text-base py-2 px-4 sm:py-2.5 sm:px-5 md:py-2.5 md:px-5 rounded-md sm:rounded-lg" 
                    aria-label={`Buy ${currentGame.title} now`}
                  >
                    Buy Now
                  </Button>

                  <div className="flex items-baseline gap-1.5">
                    {currentGame.discount > 0 && (
                      <>
                        <span className="line-through text-neutral-400 dark:text-zinc-500 text-[10px] sm:text-xs md:text-xs">
                          ${currentGame.price.toFixed(2)}
                        </span>
                        <span className="font-bold text-white text-sm sm:text-lg md:text-lg"> 
                          ${currentGame.discountedPrice.toFixed(2)}
                        </span>
                        <Badge className="bg-red-500/80 dark:bg-red-600/90 text-white text-[9px] sm:text-xs px-1 py-0.5 border-none rounded-sm">
                          -{currentGame.discount}%
                        </Badge>
                      </>
                    )}
                    {currentGame.discount === 0 && (
                      <span className="font-bold text-white text-sm sm:text-lg md:text-lg"> 
                        ${currentGame.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-2.5 sm:bottom-3 md:bottom-3.5 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
        {heroGames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2 md:h-2 rounded-full transition-all duration-300 ease-out
                        ${ index === currentIndex 
                            ? "bg-emerald-500 scale-110 w-3 sm:w-4 md:w-4" 
                            : "bg-neutral-200/40 dark:bg-zinc-600/70 hover:bg-neutral-200/70 dark:hover:bg-zinc-500/90"
                        }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-1 sm:left-2 md:left-2.5 top-1/2 transform -translate-y-1/2 
                   bg-black/15 dark:bg-black/20 hover:bg-black/30 dark:hover:bg-black/40 
                   text-white p-1 sm:p-1.5 md:p-1.5 rounded-full transition-all duration-300 backdrop-blur-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-1 sm:right-2 md:right-2.5 top-1/2 transform -translate-y-1/2 
                   bg-black/15 dark:bg-black/20 hover:bg-black/30 dark:hover:bg-black/40 
                   text-white p-1 sm:p-1.5 md:p-1.5 rounded-full transition-all duration-300 backdrop-blur-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Next slide"
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" />
      </button>
    </div>
  )
}