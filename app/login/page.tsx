"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from 'next/image'
import { FaGoogle } from "react-icons/fa"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import Footer from "@/components/footer"

// Tipe untuk bubble
interface Bubble {
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const { login, loginWithGoogle } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = []
      for (let i = 0; i < 15; i++) {
        newBubbles.push({
          size: Math.random() * 100 + 50,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 5,
          duration: Math.random() * 10 + 10,
        })
      }
      setBubbles(newBubbles)
    }
    generateBubbles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      await login(email, password)
      toast({
        title: "Login successful",
        description: "Welcome back to Danusin!",
      })
    } catch (error: any) {
      setErrorMessage(error.message || "Invalid email or password. Please try again.")
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await loginWithGoogle();
      toast({
        title: "Google Login successful",
        description: "Welcome to Danusin!",
      });
    } catch (error: any) {
      const errorMsg = String(error?.message || error || "").toLowerCase();
      const isCancellation =
        errorMsg.includes("cancel") ||
        errorMsg.includes("closed by user") ||
        errorMsg.includes("popup_closed_by_user") ||
        errorMsg.includes("cancelled") ||
        errorMsg.includes("popup window closed");

      if (!isCancellation) {
        setErrorMessage("Google login failed. Please try again.");
        toast({
          title: "Google login failed",
          description: "There was an error logging in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Header />

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 p-4 md:p-0">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          {bubbles.map((bubble, index) => (
            <div
              key={index}
              className="bubble absolute rounded-full bg-green-200/30"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                animationDelay: `${bubble.delay}s`,
                animationDuration: `${bubble.duration}s`,
              }}
            />
          ))}
        </div>

        {/* --- Kontainer Utama Diubah --- */}
        <div className="container mx-auto px-0 md:px-0 flex flex-col items-center lg:flex-row lg:justify-between lg:items-center lg:gap-x-12 max-w-6xl z-10">
          {/* Left side with character illustration - Diubah visibilitas & lebarnya */}
          <div className="w-full lg:w-1/2 mb-10 lg:mb-0 relative hidden lg:block mt-5">
            <div className="relative z-10 flex flex-col items-center md:items-start mt-5">
              <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 mt-5">
                Welcome to <span className="text-green-500">Danusin</span>
              </div>
              <p className="text-gray-600 text-lg mb-8 text-center md:text-left max-w-md">
                Sign in to your account to start your business with us.
              </p>
              <div className="character-container relative h-96 w-96 md:h-[480px] md:w-[480px] ml-0">
                <Image src="/imagesvue.png" alt="Danusin Character" width={480} height={480} className="w-full h-full object-contain z-10 relative mt-2" />
                <div className="absolute inset-0 bg-green-100 rounded-full opacity-20 transform scale-90 translate-y-10"></div>
              </div>
            </div>
          </div>

          {/* Right side with login form - Diubah lebar & justifikasinya */}
          <div className="w-full lg:w-2/4 flex justify-center lg:justify-end mt-5">
            <div className="w-full md:max-w-md p-8 md:p-8 rounded-2xl shadow-xl backdrop-blur-sm bg-white/90 mt-4">
              {/* Logo and Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
                <p className="text-gray-500">Sign in to your account</p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded-lg text-center">{errorMessage}</div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      className="block w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-auto bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</Label>
                    <Link href="/forgot-password" className="ml-auto inline-block text-sm text-green-600 hover:text-green-500">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-auto bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    type="checkbox"
                    className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors h-auto disabled:opacity-70"
                  disabled={isLoading}
                >
                  Sign In
                </Button>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500 text-sm sm:text-base">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="button-google w-full cursor-pointer gap-3 inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-600 hover:bg-gray-50 hover:shadow-md transition-all duration-200 social-button h-auto focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-70"
                      variant="outline"
                      disabled={isLoading}
                    >
                      <FaGoogle className="social-icon h-5 w-5" />
                      Sign In With Google
                    </Button>
                  </div>
                </div>
              </form>
              <div>
                <p className="text-center text-base text-gray-600 mt-5">
                  Belum punya akun?{" "}
                  <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
                    Daftar di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    <Footer />
    </div>
  )
}