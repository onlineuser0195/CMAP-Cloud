import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/AuthContext';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from './hooks/AuthContext';
import ChangeEmailDemo from './pages/ChangeEmailDemo';

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <BrowserRouter>
  //     <AuthProvider>
  //       <MsalProvider instance={msalInstance}>
  //         <App />
  //       </MsalProvider>
  //     </AuthProvider>
  //   </BrowserRouter>
  // </StrictMode>
    <StrictMode>
    <Router>
      <Routes>
        {/* Public, no-auth route just for Demo*/}
        {/* <Route path="/change-email-demo" element={<ChangeEmailDemo />} /> */}

        {/* Everything else is wrapped in MSAL + your AuthProvider */}
        <Route
          path="/*"
          element={
            <MsalProvider instance={msalInstance}>
              <AuthProvider>
                <App />
              </AuthProvider>
            </MsalProvider>
          }
        />
      </Routes>
    </Router>
  </StrictMode>
);
