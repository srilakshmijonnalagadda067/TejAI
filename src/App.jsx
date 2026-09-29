import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('home')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [records, setRecords] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '' })
  const [authForm, setAuthForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) setPage('dashboard')
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || page !== 'dashboard') return
    loadRecords()
  }, [session, page])

  async function loadRecords() {
    const { data, error } = await supabase
      .from('managed_users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    else setRecords(data)
  }

  async function submitAuth(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const result = page === 'register'
      ? await supabase.auth.signUp(authForm)
      : await supabase.auth.signInWithPassword(authForm)
    setBusy(false)

    if (result.error) setMessage(result.error.message)
    else if (page === 'register') setMessage('Check your email to confirm your account.')
  }

  async function saveUser(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const query = editingId
      ? supabase.from('managed_users').update(userForm).eq('id', editingId)
      : supabase.from('managed_users').insert({ ...userForm, owner_id: session.user.id })
    const { error } = await query

    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setUserForm({ name: '', email: '', role: '' })
      setEditingId(null)
      await loadRecords()
    }
  }

  function editUser(record) {
    setEditingId(record.id)
    setUserForm({ name: record.name, email: record.email, role: record.role ?? '' })
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user record?')) return
    const { error } = await supabase.from('managed_users').delete().eq('id', id)
    if (error) setMessage(error.message)
    else await loadRecords()
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(error.message)
    else {
      setSession(null)
      setPage('home')
      setRecords([])
    }
  }

  async function deleteAccount() {
    if (!window.confirm('Permanently delete your account and its records?')) return
    setBusy(true)
    const { error } = await supabase.functions.invoke('delete-account')
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      await supabase.auth.signOut()
      setSession(null)
      setPage('home')
    }
  }

  if (!supabase) {
    return (
      <main>
        <h1>Supabase setup required</h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase project URL and anon key.</p>
      </main>
    )
  }

  return (
    <main>
      <header>
        <nav aria-label="Main navigation">
          <a href="#home" onClick={() => setPage('home')}>Home</a>{' | '}
          {session ? (
            <>
              <a href="#dashboard" onClick={() => setPage('dashboard')}>Dashboard</a>{' | '}
              <button type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <a href="#login" onClick={() => setPage('login')}>Login</a>{' | '}
              <a href="#register" onClick={() => setPage('register')}>Register</a>
            </>
          )}
        </nav>
      </header>

      {message && <p role="status">{message}</p>}

      {page === 'home' && (
        <section>
          <h1>People directory</h1>
          <p>A small React and Supabase example with authentication and protected user records.</p>
          {session ? (
            <button type="button" onClick={() => setPage('dashboard')}>Open dashboard</button>
          ) : (
            <>
              <button type="button" onClick={() => setPage('register')}>Create an account</button>{' '}
              <button type="button" onClick={() => setPage('login')}>Login</button>
            </>
          )}
        </section>
      )}

      {(page === 'login' || page === 'register') && !session && (
        <section>
          <h1>{page === 'register' ? 'Register' : 'Login'}</h1>
          <form onSubmit={submitAuth}>
            <p>
              <label>Email<br /><input type="email" autoComplete="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
            </p>
            <p>
              <label>Password<br /><input type="password" autoComplete={page === 'register' ? 'new-password' : 'current-password'} minLength="8" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
            </p>
            <button type="submit" disabled={busy}>{busy ? 'Please wait...' : page === 'register' ? 'Create account' : 'Login'}</button>
          </form>
        </section>
      )}

      {page === 'dashboard' && session && (
        <section>
          <h1>Dashboard</h1>
          <p>Signed in as <strong>{session.user.email}</strong></p>
          <h2>User management</h2>
          <form onSubmit={saveUser}>
            <p>
              <label>Name<br /><input required maxLength="100" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} /></label>
            </p>
            <p>
              <label>Email<br /><input type="email" required maxLength="254" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} /></label>
            </p>
            <p>
              <label>Role / title<br /><input maxLength="80" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })} /></label>
            </p>
            <button type="submit" disabled={busy}>{editingId ? 'Save changes' : 'Add user'}</button>{' '}
            {editingId && <button type="button" onClick={() => { setEditingId(null); setUserForm({ name: '', email: '', role: '' }) }}>Cancel edit</button>}
          </form>

          <h2>Users ({records.length})</h2>
          {records.length === 0 ? <p>No user records yet.</p> : (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role / title</th><th>Actions</th></tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.name}</td><td>{record.email}</td><td>{record.role || '—'}</td>
                    <td><button type="button" onClick={() => editUser(record)}>Edit</button>{' '}<button type="button" onClick={() => deleteUser(record.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr />
          <h2>Account</h2>
          <button type="button" onClick={deleteAccount} disabled={busy}>Permanently delete my account</button>
        </section>
      )}
    </main>
  )
}

export default App
