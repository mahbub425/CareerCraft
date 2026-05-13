import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pingAppwriteBackend } from './lib/appwrite'

void pingAppwriteBackend()
  .then(() => {
    console.info('Appwrite backend ping successful.')
  })
  .catch((error) => {
    console.warn('Appwrite backend ping failed.', error)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
