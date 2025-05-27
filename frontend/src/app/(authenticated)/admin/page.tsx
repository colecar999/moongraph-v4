'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3, 
  Shield, 
  Mail,
  Database,
  Activity
} from 'lucide-react'
import { isAdminUser } from '@/lib/utils/admin'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!isAdminUser(session.user?.email)) {
      router.push('/home')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (!session || !isAdminUser(session.user?.email)) {
    return <div className="p-6">Access denied</div>
  }

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage user invitations and access requests',
      icon: Users,
      href: '/admin/invitations',
      color: 'bg-blue-500',
      stats: 'Pending requests: 3'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      stats: 'Last updated: 2 days ago'
    },
    {
      title: 'Analytics',
      description: 'View platform usage and performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-green-500',
      stats: 'Active users: 24'
    },
    {
      title: 'Security',
      description: 'Monitor security events and access logs',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-red-500',
      stats: 'No alerts'
    },
    {
      title: 'Email Templates',
      description: 'Manage email templates and notifications',
      icon: Mail,
      href: '/admin/email-templates',
      color: 'bg-purple-500',
      stats: '5 templates'
    },
    {
      title: 'Database',
      description: 'Database management and maintenance',
      icon: Database,
      href: '/admin/database',
      color: 'bg-indigo-500',
      stats: 'Healthy'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Administrator
          </Badge>
        </div>
        <p className="text-gray-600">
          Welcome back, {session.user?.name || session.user?.email}. Manage your Moongraph platform from here.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <UserPlus className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">Good</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Card key={card.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {card.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{card.stats}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(card.href)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest administrative actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">New access request received</p>
                <p className="text-xs text-gray-500">john@example.com requested access - 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Invitation sent</p>
                <p className="text-xs text-gray-500">Invited jane@company.com to join platform - 4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Settings className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">System configuration updated</p>
                <p className="text-xs text-gray-500">Email templates modified - 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 