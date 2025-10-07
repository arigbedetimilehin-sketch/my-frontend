import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Deadman() {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [newContent, setNewContent] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        fetchItems(sessionUser.id)
      }
    }
    getSession()
  }, [])

  const fetchItems = async (userId) => {
    const { data, error } = await supabase
      .from('deadman_triggers') // 👈 must match your table name
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setItems(data)
    }
  }

  const addItem = async () => {
    if (!newContent || !user) return

    const { error } = await supabase
      .from('deadman_triggers')
      .insert([{ user_id: user.id, content: newContent }])

    if (error) {
      setErrorMsg(error.message)
    } else {
      setNewContent('')
      fetchItems(user.id)
    }
  }

  if (!user) {
    return <p>Please log in to access Deadman Fingers.</p>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #1e3c72, #2a5298)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>⚡ Deadman Fingers (Triggers)</h1>

      {errorMsg && <p style={{ color: 'red' }}>Error: {errorMsg}</p>}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Write something..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <button
          onClick={addItem}
          style={{
            padding: '8px 16px',
            background: '#ff6f61',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          Save
        </button>
      </div>

      <h2>Your Saved Triggers</h2>
      {items.length === 0 ? (
        <p>No triggers saved yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: '10px' }}>
              {item.content}{' '}
              <em>({new Date(item.created_at).toLocaleString()})</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}