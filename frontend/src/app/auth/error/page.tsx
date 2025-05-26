"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconAlertTriangle, IconHome, IconRefresh } from "@tabler/icons-react"
import Link from "next/link"

const ERROR_MESSAGES = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  
  const errorMessage = error && error in ERROR_MESSAGES 
    ? ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]
    : ERROR_MESSAGES.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">MOONGRAPH</h1>
          <p className="text-slate-300">Knowledge graphs for the future</p>
        </div>

        {/* Error Card */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <IconAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-gray-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Details */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm">
                  <p className="text-red-800 font-medium">Error Code</p>
                  <p className="text-red-700 mt-1 font-mono">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/signin">
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <IconHome className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Need Help?</p>
                <p className="text-blue-700 mt-1">
                  If this error persists, please contact support with the error code above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>
            Contact{' '}
            <a href="mailto:support@moongraph.io" className="text-blue-400 hover:text-blue-300 transition-colors">
              support@moongraph.io
            </a>
            {' '}for assistance
          </p>
        </div>
      </div>
    </div>
  )
} 