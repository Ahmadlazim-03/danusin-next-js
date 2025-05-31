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
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isDanuser, setIsDanuser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, register, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Function to format phone number by removing non-numeric characters
  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "")
  }

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value)
    setPhone(formattedPhone)
  }

  // Handle password input change with real-time validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    // Debounced or on-blur validation might be better for UX than instant toast
    // For now, keeping as is per original code, but consider UX impact.
    if (newPassword.length > 0 && newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
    }
  }

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/register/keywords") // Or wherever you want to redirect logged-in users
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs before constructing data
    if (!name.trim()) {
        toast({
            title: "Full Name required",
            description: "Please enter your full name.",
            variant: "destructive",
        });
        return;
    }
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username.",
        variant: "destructive",
      })
      return
    }
    if (!email.trim()) {
        toast({
            title: "Email required",
            description: "Please enter an email address.",
            variant: "destructive",
        });
        return;
    }
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number.",
        variant: "destructive",
      })
      return
    }
    if (!password.trim() || !passwordConfirm.trim()) {
      toast({
        title: "Password missing",
        description: "Password and password confirmation cannot be blank.",
        variant: "destructive",
      })
      return
    }
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }
    if (password !== passwordConfirm) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // This object is for logging or if you adapt the register function to take an object in the future.
    const registrationPayloadForLogging = {
      email,
      username,
      name,
      phone,
      isdanuser: isDanuser,
      // Fields below are not directly passed to the current register function signature
      // but are kept here for completeness if you intend to use them later.
      emailVisibility: true,
      location: { lon: 0, lat: 0 },
      user_organization: [],
      bio: "",
      location_address: "",
      email_notifications: true,
      marketing_emails: true,
      // For logging, it's generally not a good idea to log passwords directly.
      // password: "******",
      // passwordConfirm: "******",
    }
    console.log("Submitting registration data (payload for logging):", JSON.stringify(registrationPayloadForLogging, null, 2))

    try {
      // Call register with individual arguments as expected by AuthContextType and AuthProvider implementation
      await register(
        email,
        password,
        passwordConfirm,
        name,
        username,
        isDanuser,
        phone
      )
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please select your interests.",
      })
      // Redirection is handled within the `register` function in `auth-provider.tsx`
    } catch (error: any) {
      console.error("Registration error in Page:", error)
      // More specific error handling based on PocketBase error structure
      let errorMessage = "There was an error creating your account. Please try again."
      if (error?.data?.data?.email?.message) {
        errorMessage = `Email: ${error.data.data.email.message}`;
      } else if (error?.data?.data?.username?.message) {
        errorMessage = `Username: ${error.data.data.username.message}`;
      } else if (error?.data?.data?.password?.message) {
        errorMessage = `Password: ${error.data.data.password.message}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }


      if (errorMessage.toLowerCase().includes("email") && (errorMessage.toLowerCase().includes("exists") || errorMessage.toLowerCase().includes("taken") || errorMessage.toLowerCase().includes("used"))) {
        toast({
          title: "Email already used",
          description: "This email is already registered. Please use a different email or sign in.",
          variant: "destructive",
        })
      } else if (errorMessage.toLowerCase().includes("password") && errorMessage.toLowerCase().includes("cannot be blank")) {
        toast({
          title: "Password missing",
          description: "Password and password confirmation cannot be blank. Please ensure they are provided.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle(isDanuser) // Pass isDanuser status for Google registration
      toast({
        title: "Google registration successful",
        description: "Welcome to Danusin!",
      })
      // Redirection is handled within loginWithGoogle
    } catch (error: any) {
      console.error("Google registration error:", error)
      const errorMsg = String(error?.message || JSON.stringify(error) || "").toLowerCase()
      const isCancellation =
        errorMsg.includes("cancel") ||
        errorMsg.includes("closed by user") ||
        errorMsg.includes("popup_closed_by_user") ||
        errorMsg.includes("cancelled") ||
        errorMsg.includes("popup window closed")

      if (!isCancellation) {
        toast({
          title: "Google registration failed",
          description: error.message || "There was an error registering with Google. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render the form if user is already logged in (prevents flash of content)
  // This also handles the case where isLoading is true during initial auth check
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
            <p className="text-center mt-4 text-muted-foreground">Redirecting...</p>
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
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2" />
            )}
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={handlePhoneChange}
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
                placeholder="Must be at least 8 characters"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="Re-enter your password"
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
