import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Dashboard() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    getSession()
  }, [])

  return (
    <div>
      <h1>EchoSignal Cloud</h1>
      {session ? (
        <p>Welcome {session?.user?.email}</p>
      ) : (
        <p>Loading...</p>
      )}

      <h2 style={{ color: 'red' }}>Features (test)</h2>
      <p style={{ color: 'blue' }}>DEBUG: This should always show</p>

      <ul>
        <li>
          <Link href="/deadman">Deadman Fingers</Link>
        </li>
      </ul>
    </div>
  )
}
