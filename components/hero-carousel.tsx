"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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
    image: "/placeholder.svg?height=600&width=1400",
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
    image: "/placeholder.svg?height=600&width=1400",
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
    image: "/placeholder.svg?height=600&width=1400",
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
  }, [isHovered])

  const currentGame = heroGames[currentIndex]

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[21/9] relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={currentGame.image || "/placeholder.svg"}
              alt={currentGame.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 md:p-10">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 mb-3 uppercase tracking-wider">
                    Featured Game
                  </Badge>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 text-white"
                >
                  {currentGame.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-zinc-300 mb-2 sm:mb-4 text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-none"
                >
                  {currentGame.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-wrap gap-2 mb-4"
                >
                  {currentGame.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-zinc-800/80 hover:bg-zinc-700 transition-colors duration-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex items-center gap-2 sm:gap-4 flex-wrap"
                >
                  <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-emerald-500/20 text-sm sm:text-base py-2 px-4 sm:py-6 sm:px-8">
                    Buy Now
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentGame.discount > 0 && (
                      <>
                        <span className="line-through text-zinc-500 text-xs sm:text-base">
                          ${currentGame.price.toFixed(2)}
                        </span>
                        <span className="font-bold text-base sm:text-xl md:text-2xl">
                          ${currentGame.discountedPrice.toFixed(2)}
                        </span>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs sm:text-sm">
                          -{currentGame.discount}%
                        </Badge>
                      </>
                    )}
                    {currentGame.discount === 0 && (
                      <span className="font-bold text-base sm:text-xl md:text-2xl">
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

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {heroGames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-emerald-500 w-6" : "bg-zinc-600 hover:bg-zinc-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>
    </div>
  )
}
