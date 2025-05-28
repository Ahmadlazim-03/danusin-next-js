"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { FaGoogle } from "react-icons/fa"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isDanuser, setIsDanuser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, register, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/register/keywords")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirm) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await register(email, password, passwordConfirm, name, username, isDanuser)
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please select your interests.",
      })
      // The auth provider should automatically update the user state,
      // which will trigger the useEffect above to redirect to dashboard
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle(isDanuser)
      toast({
        title: "Google registration successful",
        description: "Welcome to Danusin!",
      })
      // The auth provider should automatically update the user state,
      // which will trigger the useEffect above to redirect to dashboard
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
          title: "Google registration failed",
          description: "There was an error registering with Google. Please try again.",
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
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
            <p className="text-center mt-4 text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your details to create your Danusin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleRegister} disabled={isLoading}>
            <FaGoogle className="mr-2" />
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-green-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isDanuser" className="flex flex-col space-y-1">
                <span>Register as Danuser</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Danusers can create organizations and manage catalogs
                </span>
              </Label>
              <Switch id="isDanuser" checked={isDanuser} onCheckedChange={setIsDanuser} />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-green-700 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
