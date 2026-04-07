import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../css/styles.css'

const LazyPlasmicHostPage = React.lazy(() => import('./plasmic-host'))

function RootRouter() {
  const isPlasmic = window.location.pathname === '/plasmic-host'

  if (isPlasmic) {
    return (
      <React.Suspense fallback={<div>Carregando Plasmic...</div>}>
        <LazyPlasmicHostPage />
      </React.Suspense>
    )
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
)
