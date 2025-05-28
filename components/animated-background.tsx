"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number // To store the ID of the animation frame

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      // canvas and ctx are in scope here from useEffect
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions() // Initial set
    window.addEventListener("resize", setCanvasDimensions)

    // Particle class
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      opacity: number

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.size = Math.random() * 2 + 0.5 // Particle size between 0.5 and 2.5
        this.speedX = Math.random() * 0.5 - 0.25 // Slow horizontal speed
        this.speedY = Math.random() * 0.5 - 0.25 // Slow vertical speed
        // Color: bluish-cyan tones
        this.color = `rgb(${Math.floor(Math.random() * 50 + 20)}, ${Math.floor(
          Math.random() * 150 + 100,
        )}, ${Math.floor(Math.random() * 100 + 150)})`
        this.opacity = Math.random() * 0.5 + 0.1 // Opacity between 0.1 and 0.6
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.speedX
        this.y += this.speedY

        // Wrap particles around the screen
        if (this.x > canvasWidth) this.x = 0
        else if (this.x < 0) this.x = canvasWidth
        if (this.y > canvasHeight) this.y = 0
        else if (this.y < 0) this.y = canvasHeight
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath()
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        context.fillStyle = this.color
        context.globalAlpha = this.opacity // Apply particle-specific opacity
        context.fill()
        context.globalAlpha = 1 // Reset globalAlpha for other drawings
      }
    }

    // Create particles
    const particlesArray: Particle[] = []
    // Calculate number of particles based on canvas area, capped at 50
    // Approx. 1 particle per 15000 pixels
    const calculateNumberOfParticles = (width: number, height: number) =>
      Math.min(50, Math.floor((width * height) / 15000))

    const initParticles = () => {
      particlesArray.length = 0 // Clear existing particles if any (for resize scenarios if we were to re-init)
      const numberOfParticles = calculateNumberOfParticles(canvas.width, canvas.height)
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle(canvas.width, canvas.height))
      }
    }
    initParticles() // Initial particle creation

    // Handler for window resize - re-initialize particles for new dimensions
    const handleResize = () => {
      setCanvasDimensions()
      initParticles() // Re-create particles for the new canvas size
    }
    window.addEventListener("resize", handleResize) // Use the new handler

    // Connect particles with lines if they are close enough
    const connectParticles = (context: CanvasRenderingContext2D) => {
      const connectDistance = 100 // Max distance to connect particles
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) { // Start b from a + 1 to avoid self-connection and duplicate pairs
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectDistance) {
            context.beginPath()
            // Line opacity fades with distance
            context.strokeStyle = `rgba(0, 200, 150, ${0.1 * (1 - distance / connectDistance)})`
            context.lineWidth = 0.5
            context.moveTo(particlesArray[a].x, particlesArray[a].y)
            context.lineTo(particlesArray[b].x, particlesArray[b].y)
            context.stroke()
          }
        }
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height) // Clear canvas each frame

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(canvas.width, canvas.height)
        particlesArray[i].draw(ctx)
      }

      connectParticles(ctx) // Draw connecting lines

      animationFrameId = requestAnimationFrame(animate) // Request next frame
    }

    animate() // Start the animation

    // Cleanup function for useEffect
    return () => {
      window.removeEventListener("resize", handleResize) // Use the same handler instance
      cancelAnimationFrame(animationFrameId) // Cancel animation frame on unmount
    }
  }, []) // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
      // Style can also be applied directly if preferred, e.g., for opacity
      // style={{ opacity: 0.2 }}
    />
  )
}