import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './luxury.css'

const AdminApp = lazy(() => import('./admin/AdminApp'))

const isAdminRoute = () => window.location.hash.startsWith('#/admin')

function Root() {
  const [admin, setAdmin] = useState(isAdminRoute)

  useEffect(() => {
    const onHashChange = () => {
      const nextAdmin = isAdminRoute()
      if (nextAdmin !== admin) {
        setAdmin(nextAdmin)
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [admin])

  if (!admin) return <App />

  return (
    <Suspense fallback={<div className="route-loading">Loading the menu manager…</div>}>
      <AdminApp />
    </Suspense>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
