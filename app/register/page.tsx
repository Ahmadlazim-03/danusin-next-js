"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FaGoogle } from "react-icons/fa"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Bubble {
  size: number
  x: number
  y: number
  delay: number
  duration: number
}

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isDanuser, setIsDanuser] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const { user, register, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const formatPhoneNumber = (value: string) => value.replace(/\D/g, "")
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

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
    if (!name.trim()) {
      toast({ title: "Nama Lengkap wajib diisi", variant: "destructive" })
      return
    }
    if (!username.trim()) {
      toast({ title: "Username wajib diisi", variant: "destructive" })
      return
    }
    if (!email.trim()) {
      toast({ title: "Email wajib diisi", variant: "destructive" })
      return
    }
    if (!phone.trim()) {
      toast({ title: "Nomor Telepon wajib diisi", variant: "destructive" })
      return
    }
    if (!password || !passwordConfirm) {
      toast({
        title: "Password wajib diisi",
        description: "Password dan konfirmasi password tidak boleh kosong.",
        variant: "destructive",
      })
      return
    }
    if (password.length < 8) {
      toast({
        title: "Password terlalu pendek",
        description: "Password minimal 8 karakter.",
        variant: "destructive",
      })
      return
    }
    if (password !== passwordConfirm) {
      toast({
        title: "Password tidak cocok",
        description: "Pastikan password dan konfirmasi password sama.",
        variant: "destructive",
      })
      return
    }

    setIsFormSubmitting(true)
    try {
      await register(email, password, passwordConfirm, name, username, isDanuser, phone)
      toast({
        title: "Registrasi Berhasil",
        description: "Akun Anda telah dibuat. Silakan lanjutkan.",
      })
    } catch (error: any) {
      console.error("Registration error in Page:", error)
      let errorMessage = "Gagal membuat akun. Silakan coba lagi."
      if (error?.data?.data?.email?.message) {
        errorMessage = `Email: ${error.data.data.email.message}`
      } else if (error?.data?.data?.username?.message) {
        errorMessage = `Username: ${error.data.data.username.message}`
      } else if (error?.data?.data?.password?.message) {
        errorMessage = `Password: ${error.data.data.password.message}`
      } else if (error?.message) {
        errorMessage = error.message
      }
      toast({
        title: "Registrasi Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle(isDanuser)
      toast({
        title: "Registrasi Google Berhasil",
        description: "Selamat datang di Danusin!",
      })
    } catch (error: any) {
      const errorMsg = String(error?.message || error || "").toLowerCase()
      const isCancellation =
        errorMsg.includes("cancel") ||
        errorMsg.includes("closed by user") ||
        errorMsg.includes("popup_closed_by_user") ||
        errorMsg.includes("cancelled") ||
        errorMsg.includes("popup window closed")
      if (!isCancellation) {
        toast({
          title: "Registrasi Google Gagal",
          description: error.message || "Terjadi kesalahan saat mendaftar dengan Google.",
          variant: "destructive",
        })
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

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
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Welcome Section */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium">
                <UserPlus className="w-4 h-4 mr-2" />
                Bergabung dengan Danusin
              </div>

              <h1 className="text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Mulai Perjalanan
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                  Bisnis Anda
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Bergabunglah dengan ribuan entrepreneur yang telah memulai bisnis mereka bersama Danusin. Platform
                terpercaya untuk mengembangkan usaha Anda.
              </p>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Gratis untuk memulai
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                  Setup dalam 5 menit
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 w-full max-w-lg mx-auto">
                <Image
                  src="/imagesvue.png"
                  alt="Danusin Register Illustration"
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-full blur-3xl transform scale-75 translate-y-8"></div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex justify-center lg:justify-end mt-5">
            <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16  rounded-2xl flex items-center justify-center shadow-lg">
                    <Image
                      src="/logo-danusin-hijau.png"
                      alt="Logo Danusin"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Buat Akun Baru</CardTitle>
                <CardDescription className="text-gray-600">Isi informasi di bawah untuk memulai</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                {/* Google Register Button */}
                <Button
                  
                  className="w-full h-12 border-2 border-gray-200 hover:border-black hover:bg-green-50 bg-white transition-all duration-200 text-gray-700 font-medium"
                  onClick={handleGoogleRegister}
                  disabled={isGoogleLoading || isFormSubmitting}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <FaGoogle className="h-5 w-5 mr-2 text-gray-500" />
                  )}
                  Daftar dengan Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500 font-medium">Atau daftar dengan email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name and Username Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nama Lengkap
                      </Label>
                      <div className="relative">
                      
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-12 text-black bg-white focus:border-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <div className="relative">
                      
                        <Input
                          id="username"
                          placeholder="johndoe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                     
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Nomor Telepon
                    </Label>
                    <div className="relative">
                     
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="08123456789"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="pl-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                    
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                     
                      <Input
                        id="passwordConfirm"
                        type={showPasswordConfirm ? "text" : "password"}
                        placeholder="Ulangi password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 text-black focus:border-green-400 focus:ring-green-400 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Danuser Switch */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex-1">
                      <Label htmlFor="isDanuser" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Daftar sebagai Danuser
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Danuser dapat membuat organisasi & katalog</p>
                    </div>
                    <Switch
                      id="isDanuser"
                      checked={isDanuser}
                      onCheckedChange={setIsDanuser}
                      className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-gray-200 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isFormSubmitting || isGoogleLoading}
                  >
                    {isFormSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat Akun...
                      </>
                    ) : (
                      "Buat Akun"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="text-center pb-6">
                <p className="text-sm text-gray-600">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="font-medium text-green-500 hover:text-green-400 transition-colors">
                    Masuk di sini
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
