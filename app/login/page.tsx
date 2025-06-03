"use client"

import { useAuth } from "@/components/auth/auth-provider"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { FaGoogle } from "react-icons/fa"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

// Tipe untuk bubble
interface Bubble {
  size: number
  x: number
  y: number
  delay: number
  duration: number
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const { user, login, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = []
      for (let i = 0; i < 20; i++) {
        newBubbles.push({
          size: Math.random() * 120 + 40,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 8,
          duration: Math.random() * 15 + 15,
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
      router.push("/dashboard")
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
    setIsLoading(true)
    setErrorMessage("")

    try {
      await loginWithGoogle()
      toast({
        title: "Google Login successful",
        description: "Welcome to Danusin!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      const errorMsg = String(error?.message || error || "").toLowerCase()
      const isCancellation =
        errorMsg.includes("cancel") ||
        errorMsg.includes("closed by user") ||
        errorMsg.includes("popup_closed_by_user") ||
        errorMsg.includes("cancelled") ||
        errorMsg.includes("popup window closed")

      if (!isCancellation) {
        setErrorMessage("Google login failed. Please try again.")
        toast({
          title: "Google login failed",
          description: "There was an error logging in with Google. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render the form if user is already logged in (prevents flash of content)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-emerald-50">
        <Header />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center space-y-6 p-8">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
                <div className="absolute -inset-2 bg-green-200 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Mengalihkan ke Dashboard</h3>
                <p className="text-gray-600">Mohon tunggu sebentar...</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-emerald-50">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {bubbles.map((bubble, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-gradient-to-br from-green-200/30 to-emerald-200/30 backdrop-blur-sm animate-float"
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

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mt-5">
          {/* Left Side - Welcome Section */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium">
                <UserPlus className="w-4 h-4 mr-2" />
                Selamat Datang Kembali
              </div>

              <h1 className="text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                  Danusin
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Sign in to your account to continue your business journey with us. Access all your tools and resources.
              </p>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Secure login
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                  24/7 support
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 w-full max-w-lg mx-auto">
                <Image
                  src="/imagesvue.png"
                  alt="Danusin Login Illustration"
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-full blur-3xl transform scale-75 translate-y-8"></div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                    <Image
                      src="/logo-danusin-hijau.png"
                      alt="Logo Danusin"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Google Login Button */}
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 hover:border-black bg-white transition-all duration-200 text-gray-700 font-medium"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <FaGoogle className="h-5 w-5 mr-2 text-gray-500" />
                  )}
                  Sign In with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500 font-medium">Or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                     
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-green-500 hover:text-green-400 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="data-[state=checked]:bg-green-400 data-[state=checked]:border-green-400"
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
                    >
                      Remember me
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="text-center pb-6">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{" "}
                  <Link href="/register" className="font-medium text-green-500 hover:text-green-400 transition-colors">
                    Daftar di sini
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.1;
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(90deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-40px) translateX(-10px) rotate(180deg);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-60px) translateX(10px) rotate(270deg);
            opacity: 0.2;
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
