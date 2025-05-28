"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Loader2 } from "lucide-react"
import { useState } from "react"

const USERS_COLLECTION = "danusin_users"

type ProfileSecurityProps = {
  user: any
}

export function ProfileSecurity({ user }: ProfileSecurityProps) {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Password strength validation
  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      errors: [
        password.length < minLength ? "Password must be at least 8 characters long" : "",
        !hasUpperCase ? "Password must contain at least one uppercase letter" : "",
        !hasLowerCase ? "Password must contain at least one lowercase letter" : "",
        !hasNumber ? "Password must contain at least one number" : "",
        !hasSpecialChar ? "Password must contain at least one special character" : "",
      ].filter(Boolean),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      })
      return
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid password",
        description: passwordValidation.errors.join(". "),
        variant: "destructive",
      })
      return
    }

    // Validate current password is not empty
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verify authentication state
      if (!pb.authStore.isValid) {
        await pb.collection(USERS_COLLECTION).authRefresh()
      }

      // Verify current password
      await pb.collection(USERS_COLLECTION).authWithPassword(user.email, currentPassword)

      // Update password
      await pb.collection(USERS_COLLECTION).update(user.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })

      // Clear the form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      let errorMessage = "There was an error updating your password."

      // Handle specific PocketBase errors
      if (error.status === 400) {
        errorMessage = "Invalid input. Ensure the new password meets all requirements."
      } else if (error.status === 401) {
        errorMessage = "Current password is incorrect. Please try again."
      } else if (error.status === 403) {
        errorMessage = "Session expired. Please log in again."
      } else if (error.data?.data?.password?.message) {
        errorMessage = `Password error: ${error.data.data.password.message}`
      }

      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters, with uppercase, lowercase, number, and special character"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Confirm your new password"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </div>
    </form>
  )
}