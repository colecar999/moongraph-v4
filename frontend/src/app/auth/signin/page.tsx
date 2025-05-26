"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconUser, IconMail, IconShield } from "@tabler/icons-react"

// Test users for development
const TEST_USERS = [
  {
    id: "cole",
    name: "Cole Carnes",
    email: "cole@moongraph.io",
    role: "Admin",
    description: "Platform owner and admin"
  },
  {
    id: "alice",
    name: "Alice Researcher",
    email: "alice@example.com",
    role: "Researcher",
    description: "Climate science researcher"
  },
  {
    id: "bob",
    name: "Bob Collaborator",
    email: "bob@example.com",
    role: "Collaborator",
    description: "Data scientist and collaborator"
  },
  {
    id: "charlie",
    name: "Charlie Public",
    email: "charlie@example.com",
    role: "Public User",
    description: "Public user exploring shared content"
  }
]

export default function SignInPage() {
  const [selectedUser, setSelectedUser] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useCustomEmail, setUseCustomEmail] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/home"

  const handleSignIn = async () => {
    setIsLoading(true)
    
    try {
      // For now, we'll use Auth0 with login_hint to suggest the email
      const email = useCustomEmail ? customEmail : TEST_USERS.find(u => u.id === selectedUser)?.email
      
      if (!email) {
        alert("Please select a user or enter an email")
        setIsLoading(false)
        return
      }

      console.log("Signing in with email:", email) // Debug log

      // Sign in with Auth0, passing login_hint to pre-fill email
      const result = await signIn('auth0', {
        callbackUrl,
        redirect: true, // Changed to true for direct redirect
        login_hint: email,
        // Add additional Auth0 parameters
        prompt: 'login',
        screen_hint: 'login'
      })

      if (result?.error) {
        console.error("Sign in error:", result.error)
        alert("Sign in failed: " + result.error)
        setIsLoading(false)
      }
      // Note: if redirect is true, we won't reach here
    } catch (error) {
      console.error("Sign in error:", error)
      alert("Sign in failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">MOONGRAPH</h1>
          <p className="text-slate-300">Knowledge graphs for the future</p>
        </div>

        {/* Sign In Card */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose a test user or enter your email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Selection Mode Toggle */}
            <div className="flex space-x-2">
              <Button
                variant={!useCustomEmail ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomEmail(false)}
                className="flex-1"
              >
                <IconUser className="h-4 w-4 mr-2" />
                Test Users
              </Button>
              <Button
                variant={useCustomEmail ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomEmail(true)}
                className="flex-1"
              >
                <IconMail className="h-4 w-4 mr-2" />
                Custom Email
              </Button>
            </div>

            {/* Test User Selection */}
            {!useCustomEmail && (
              <div className="space-y-3">
                <Label htmlFor="user-select">Select Test User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a test user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_USERS.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Email Input */}
            {useCustomEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
            )}

            {/* Sign In Button */}
            <Button 
              onClick={handleSignIn}
              disabled={isLoading || (!useCustomEmail && !selectedUser) || (useCustomEmail && !customEmail)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <IconShield className="h-5 w-5" />
                  <span>Sign in with Auth0</span>
                </div>
              )}
            </Button>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <IconShield className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Development Mode</p>
                  <p className="text-blue-700 mt-1">
                    This is a development environment. Test users are provided for collaboration testing.
                    Authentication is handled securely through Auth0.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>
            Need help? Contact{' '}
            <a href="mailto:support@moongraph.io" className="text-blue-400 hover:text-blue-300 transition-colors">
              support@moongraph.io
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 