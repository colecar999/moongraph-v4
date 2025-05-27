import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, useCase } = body

    // Validate required fields
    if (!name || !email || !company || !useCase) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Send notification to your backend API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          company,
          use_case: useCase,
          requested_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        console.error('Failed to send to backend:', response.status, response.statusText)
        // Continue anyway - we'll still log the request
      }
    } catch (error) {
      console.error('Error sending to backend:', error)
      // Continue anyway - we'll still log the request
    }

    // Log the request (you could also store this in a database)
    console.log('Access request received:', {
      name,
      email,
      company,
      useCase,
      timestamp: new Date().toISOString(),
    })

    // In a real implementation, you might:
    // 1. Store the request in a database
    // 2. Send an email notification to admin
    // 3. Add to a CRM or tracking system

    return NextResponse.json(
      { 
        message: 'Access request submitted successfully',
        status: 'pending'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing access request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 