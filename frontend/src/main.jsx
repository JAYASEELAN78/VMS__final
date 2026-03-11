import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './store'
import { ToastProvider } from './components/common'
import './index.css'
import App from './App.jsx'

// Google OAuth Client ID - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '670522390868-j16615o0n8s8s43cj4hkfcs4rv96nmp8.apps.googleusercontent.com';

// Application always in light mode - theme system removed

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

