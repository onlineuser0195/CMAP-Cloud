import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXPIRATION_TIME_KEY, JWT_TOKEN_KEY, USER_EMAIL_KEY, USER_FIRST_NAME_KEY, USER_ID_KEY, USER_LAST_NAME_KEY, USER_ROLE_KEY, USER_SYSTEM, MAPPED_ROLE_KEY } from "../constants/constants";
import { loginAPI } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(null);
    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);
    const [email, setEmail] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [mappedRole, setMappedRole] = useState(null);
    const [system, setSystem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load state from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem(JWT_TOKEN_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);
        const userId = localStorage.getItem(USER_ID_KEY);
        const firstName = localStorage.getItem(USER_FIRST_NAME_KEY);
        const lastName = localStorage.getItem(USER_LAST_NAME_KEY);
        const email = localStorage.getItem(USER_EMAIL_KEY);
        const expiration = localStorage.getItem(EXPIRATION_TIME_KEY);
        const system = localStorage.getItem(USER_SYSTEM);
        const mappedRole = localStorage.getItem(MAPPED_ROLE_KEY);

        if (token && expiration && Date.now() < parseInt(expiration)) {
            setIsAuthenticated(true);
            setUserRole(role);
            setMappedRole(mappedRole);
            setUserId(userId);
            setFirstName(firstName);
            setLastName(lastName);
            setEmail(email);
            setSystem(system);
        } else {
            logout();
        }
        setIsLoading(false);
    }, []);

    const login = (token, userId, firstName, lastName, email, role, system, mappedRole) => {
        const expirationTime = Date.now() + 3600 * 1000; // 1hr
        localStorage.setItem(EXPIRATION_TIME_KEY, expirationTime);
        localStorage.setItem(JWT_TOKEN_KEY, token);
        localStorage.setItem(USER_ROLE_KEY, role);
        localStorage.setItem(MAPPED_ROLE_KEY, mappedRole);
        localStorage.setItem(USER_ID_KEY, userId);
        localStorage.setItem(USER_FIRST_NAME_KEY, firstName);
        localStorage.setItem(USER_LAST_NAME_KEY, lastName);
        localStorage.setItem(USER_EMAIL_KEY, email);
        localStorage.setItem('LOGIN_TYPE', role === 'Microsoft' ? 'microsoft' : 'password');
        localStorage.setItem(USER_SYSTEM, system);

        setIsAuthenticated(true);
        setUserRole(role);
        setMappedRole(mappedRole);
        // Added for User Name in NavBar issue
        setUserId(userId);
        setFirstName(firstName);
        setLastName(lastName);
        setEmail(email);
        setSystem(system);
    };

    const logout = () => {
        localStorage.removeItem(JWT_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(MAPPED_ROLE_KEY);
        localStorage.removeItem(EXPIRATION_TIME_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(USER_FIRST_NAME_KEY);
        localStorage.removeItem(USER_LAST_NAME_KEY);
        localStorage.removeItem(USER_EMAIL_KEY);
        localStorage.removeItem(USER_SYSTEM);
        localStorage.removeItem('LOGIN_TYPE')
        setIsAuthenticated(false);
        setUserRole(null);
        setMappedRole(null);
        // Added for User Name in NavBar issue
        setUserId(null);
        setFirstName(null);
        setLastName(null);
        setEmail(null);
        setSystem(null);
        navigate("/login");
    };

    const isLoggedIn = async (roles = null) => {
        const loginType = localStorage.getItem('LOGIN_TYPE');
        const token = localStorage.getItem(JWT_TOKEN_KEY);

        if (loginType === 'microsoft') {
            // just check that token exists
            return !!token;
        } else {
            const decodedToken = token && await loginAPI.validateToken(token);
            // if (!decodedToken || (role && role !== decodedToken.role)) {
            //     logout();
            //     return false;
            // }
            // return true;
            
            if (!decodedToken) {
                logout();
                return false;
            }

            // Support multiple roles
            if (roles) {
                const roleList = Array.isArray(roles) ? roles : [roles];
                if (!roleList.includes(decodedToken.role)) {
                    logout();
                    return false;
                }
            }
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, userRole, userId, firstName, lastName, email, system, mappedRole, login, logout, isLoggedIn, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default function useAuth() {
    return useContext(AuthContext);
}


// Added for Microsoft Authentication

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URL,
    audience: import.meta.env.VITE_AZURE_CLIENT_ID
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
   scopes: [`api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`]
};