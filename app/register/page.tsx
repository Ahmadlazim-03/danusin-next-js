"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Bubble {
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isDanuser, setIsDanuser] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const { user, register, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const formatPhoneNumber = (value: string) => value.replace(/\D/g, "");
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < 15; i++) {
        newBubbles.push({
          // Menggunakan ukuran bubble dari LoginPage sebagai referensi
          size: Math.random() * 100 + 50,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 5,
          duration: Math.random() * 10 + 10,
        });
      }
      setBubbles(newBubbles);
    };
    generateBubbles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Nama Lengkap wajib diisi", variant: "destructive" }); return; }
    if (!username.trim()) { toast({ title: "Username wajib diisi", variant: "destructive" }); return; }
    if (!email.trim()) { toast({ title: "Email wajib diisi", variant: "destructive" }); return; }
    if (!phone.trim()) { toast({ title: "Nomor Telepon wajib diisi", variant: "destructive" }); return; }
    if (!password || !passwordConfirm) { toast({ title: "Password wajib diisi", description: "Password dan konfirmasi password tidak boleh kosong.", variant: "destructive" }); return; }
    if (password.length < 8) { toast({ title: "Password terlalu pendek", description: "Password minimal 8 karakter.", variant: "destructive" }); return; }
    if (password !== passwordConfirm) { toast({ title: "Password tidak cocok", description: "Pastikan password dan konfirmasi password sama.", variant: "destructive" }); return; }

    setIsFormSubmitting(true);
    try {
      await register(email, password, passwordConfirm, name, username, isDanuser, phone);
      toast({ title: "Registrasi Berhasil", description: "Akun Anda telah dibuat. Silakan lanjutkan.", });
    } catch (error: any) {
      console.error("Registration error in Page:", error);
      let errorMessage = "Gagal membuat akun. Silakan coba lagi.";
      if (error?.data?.data?.email?.message) {errorMessage = `Email: ${error.data.data.email.message}`; }
      else if (error?.data?.data?.username?.message) {errorMessage = `Username: ${error.data.data.username.message}`; }
      else if (error?.data?.data?.password?.message) {errorMessage = `Password: ${error.data.data.password.message}`; }
      else if (error?.message) {errorMessage = error.message; }
      toast({ title: "Registrasi Gagal", description: errorMessage, variant: "destructive", });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(isDanuser);
      toast({ title: "Registrasi Google Berhasil", description: "Selamat datang di Danusin!", });
    } catch (error: any) {
      const errorMsg = String(error?.message || error || "").toLowerCase();
      const isCancellation = errorMsg.includes("cancel") || errorMsg.includes("closed by user") || errorMsg.includes("popup_closed_by_user") || errorMsg.includes("cancelled") || errorMsg.includes("popup window closed");
      if (!isCancellation) {
        toast({ title: "Registrasi Google Gagal", description: error.message || "Terjadi kesalahan saat mendaftar dengan Google.", variant: "destructive" });
      }
    }
    finally {
      setIsGoogleLoading(false);
    }
  };

  if (user) { // Pengalihan jika pengguna sudah login
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                <p className="text-center text-lg text-gray-700 dark:text-neutral-300">Mengalihkan ke dasbor...</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-zinc-900 p-4 md:p-0"> {/* Menghapus mt-5 global dari sini */}
        {/* Background Bubbles */}
        <div className="absolute inset-0 z-0"> {/* Menghapus mt-5 dari bubble container */}
          {bubbles.map((bubble, index) => (
            <div key={index} className="bubble absolute rounded-full bg-emerald-200/30 dark:bg-emerald-700/20" // Warna disesuaikan dengan RegisterPage
              style={{ width: `${bubble.size}px`, height: `${bubble.size}px`, left: `${bubble.x}%`, top: `${bubble.y}%`, animationDelay: `${bubble.delay}s`, animationDuration: `${bubble.duration}s`, }} />
          ))}
        </div>

        {/* Main Content - Disesuaikan dengan layout LoginPage */}
        <div className="container mx-auto px-0 md:px-0 flex flex-col items-center lg:flex-row lg:justify-between lg:items-center lg:gap-x-12 max-w-6xl z-10 mt-5">
          {/* Left Section (Welcome Text & Image) - Disesuaikan dengan LoginPage */}
          <div className="w-full lg:w-1/2 mb-10 lg:mb-0 relative hidden lg:block mt-5">
            <div className="relative z-10 flex flex-col items-center lg:items-start mt-5"> {/* lg:items-start untuk rata kiri di layar besar */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-neutral-100 mb-4 mt-5">
                Selamat Datang di <span className="text-emerald-500 dark:text-emerald-400">Danusin</span> {/* Warna span disesuaikan */}
              </h1>
              <p className="text-gray-600 dark:text-neutral-300 text-lg mb-8 text-center lg:text-left max-w-md">
                Buat akun Anda untuk memulai bisnis dan jelajahi berbagai peluang.
              </p>
              <div className="character-container relative h-96 w-96 md:h-[480px] md:w-[480px] mx-auto lg:ml-0"> {/* lg:ml-0 agar tidak terpusat jika kolom lebih lebar */}
                <Image src="/imagesvue.png" alt="Danusin Register Character" width={480} height={480} className="w-full h-full object-contain z-10 relative mt-2" priority />
                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-800/40 rounded-full opacity-30 dark:opacity-50 transform scale-90 translate-y-10"></div> {/* Warna dan opasitas disesuaikan */}
              </div>
            </div>
          </div>

          {/* Right Section (Registration Card) - Lebar disesuaikan, konten form tetap sama dari sebelumnya */}
          <div className="w-full lg:w-2/4 flex justify-center lg:justify-end mt-5 lg:mt-0"> {/* Tambah lg:mt-0 agar tidak ada dobel margin di layar besar */}
            <Card className="w-full max-w-md shadow-xl backdrop-blur-lg bg-white/80 dark:bg-zinc-800/90 dark:border-zinc-700 rounded-2xl">
              <CardHeader className="text-center p-4 pt-5 sm:p-6 sm:pt-6">
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <Image src="/logo-danusin-hijau.png" alt="Logo Danusin" width={48} height={48} className="object-contain" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-neutral-50">Buat Akun Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 p-4 sm:p-6 pb-3 sm:pb-4">
                <Button
                  variant="outline"
                  className="w-full gap-2 h-9 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700/50 text-sm"
                  onClick={handleGoogleRegister}
                  disabled={isGoogleLoading || isFormSubmitting}
                >
                  {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaGoogle className="h-4 w-4" />}
                  Daftar dengan Google
                </Button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300 dark:border-zinc-600" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-800 px-2 text-muted-foreground">Atau lanjutkan dengan</span></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:space-x-2.5 space-y-3 sm:space-y-0">
                    <div className="sm:w-1/2 space-y-1">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-8 w-full bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                    </div>
                    <div className="sm:w-1/2 space-y-1">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-8 w-full bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input id="phone" type="tel" placeholder="08123xxxx" value={phone} onChange={handlePhoneChange} required className="h-8 bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-8 bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Minimal 8 karakter" value={password} onChange={handlePasswordChange} required className="h-8 bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="passwordConfirm">Konfirmasi Password</Label>
                    <Input id="passwordConfirm" type="password" placeholder="Ulangi password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className="h-8 bg-white dark:bg-zinc-700/30 border-gray-300 dark:border-zinc-600 text-sm"/>
                  </div>
                  <div className="flex items-center justify-between space-x-2 pt-1">
                    <Label htmlFor="isDanuser" className="flex flex-col">
                      <span className="font-medium text-sm text-gray-700 dark:text-neutral-200">Daftar sebagai Danuser</span>
                      <span className="font-normal text-xs text-muted-foreground -mt-0.5">Danuser dapat membuat organisasi & katalog.</span>
                    </Label>
                    <Switch id="isDanuser" checked={isDanuser} onCheckedChange={setIsDanuser} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white h-9 text-sm"
                    disabled={isFormSubmitting || isGoogleLoading}
                  >
                    {isFormSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat Akun...</> : "Buat Akun"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center p-4 sm:p-6 pt-2 pb-3 sm:pb-4">
                <p className="text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                    Masuk di sini
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Menggunakan keyframes dari LoginPage, namun opasitas disesuaikan sedikit agar lebih visible seperti RegisterPage sebelumnya */}
      <style jsx global>{`
        .bubble {
          animation: float linear infinite;
          /* opacity: 0.5; // Opasitas dari LoginPage (lebih terlihat) */
          /* Biarkan opasitas awal dari RegisterPage jika lebih disukai, atau sesuaikan */
        }
        
        /* Keyframes dari LoginPage (disesuaikan agar float ke atas) */
        @keyframes float {
          0% { transform: translateY(20vh) translateX(0) scale(0.8); opacity: 0; } /* Mulai dari bawah */
          10%, 90% { opacity: 0.07; } /* Sedikit lebih visible dari sebelumnya */
          25% { transform: translateY(-20vh) translateX(10vw) scale(1); }
          50% { transform: translateY(-50vh) translateX(-10vw) scale(1.2); opacity: 0.12; } /* Sedikit lebih visible dari sebelumnya */
          75% { transform: translateY(-80vh) translateX(5vw) scale(1); }
          100% { transform: translateY(-100vh) translateX(0) scale(0.8); opacity: 0; } /* Hilang di atas */
        }
      `}</style>
      <Footer />
    </div>
  )
}