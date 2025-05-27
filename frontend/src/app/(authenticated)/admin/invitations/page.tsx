'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Mail, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AccessRequest {
  id: string
  name: string
  email: string
  company: string
  use_case: string
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
}

interface Invitation {
  id: string
  email: string
  invited_by: string
  invited_at: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
}

export default function AdminInvitationsPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch access requests and invitations from your API
      // For now, using mock data
      setAccessRequests([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          use_case: 'Document analysis for legal research',
          requested_at: '2024-01-15T10:30:00Z',
          status: 'pending'
        }
      ])
      
      setInvitations([
        {
          id: '1',
          email: 'jane@example.com',
          invited_by: 'admin@moongraph.io',
          invited_at: '2024-01-14T15:20:00Z',
          status: 'pending',
          expires_at: '2024-01-21T15:20:00Z'
        }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInviteEmail) return

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newInviteEmail }),
      })

      if (response.ok) {
        setNewInviteEmail('')
        fetchData() // Refresh the data
      } else {
        console.error('Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleApproveRequest = async (requestId: string, email: string) => {
    try {
      const response = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, email }),
      })

      if (response.ok) {
        fetchData() // Refresh the data
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      if (response.ok) {
        fetchData() // Refresh the data
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
      case 'accepted':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
      case 'expired':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage access requests and user invitations</p>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="invite">Send Invitation</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Access Requests</CardTitle>
              <CardDescription>
                Review and approve user access requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No access requests</p>
                ) : (
                  accessRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.email}</p>
                          <p className="text-sm text-gray-600">{request.company}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Use Case:</p>
                        <p className="text-sm text-gray-600">{request.use_case}</p>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Requested: {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveRequest(request.id, request.email)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve & Invite
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>
                Track invitation status and resend if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No invitations sent</p>
                ) : (
                  invitations.map((invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{invitation.email}</h3>
                          <p className="text-sm text-gray-600">Invited by: {invitation.invited_by}</p>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <div>Sent: {new Date(invitation.invited_at).toLocaleDateString()}</div>
                        <div>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</div>
                      </div>
                      
                      {invitation.status === 'pending' && (
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4 mr-1" />
                          Resend Invitation
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Send Invitation</CardTitle>
              <CardDescription>
                Directly invite a user by email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 