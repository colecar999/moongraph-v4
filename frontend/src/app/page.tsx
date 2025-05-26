import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to custom sign-in page
  redirect('/auth/signin')
}
