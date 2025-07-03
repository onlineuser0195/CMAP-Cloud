// components/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Loading } from "./Loading";

export function RequireAuth({ children }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal(); // "none" | "login" | "logout" | …
  const location = useLocation();

  // while MSAL is checking cache, show spinner
  if (inProgress !== "none") {
    return <Loading />;
  }

  // once MSAL is done, if no account, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // otherwise render the protected UI
  return children;
}