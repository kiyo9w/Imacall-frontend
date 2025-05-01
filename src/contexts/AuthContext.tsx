'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import type { Token, UserPublic } from '@/types/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios'; // Import axios

interface AuthContextType {
  user: UserPublic | null;
  token: string | null;
  loading: boolean;
  login: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>; // Add specific type later if needed
  fetchUser: () => Promise<void>; // Function to manually refetch user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const fetchUser = useCallback(async (currentToken: string | null = token) => {
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // Header is now set globally via interceptor if token exists
      // apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const response = await apiClient.get<UserPublic>('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      localStorage.removeItem('accessToken'); // Clear invalid token
      setToken(null);
      delete apiClient.defaults.headers.common['Authorization']; // Clear header in axios instance

       if (axios.isAxiosError(error) && error.response?.status === 401) {
         const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
         if (!publicPaths.includes(pathname)) {
             toast({ title: "Session expired", description: "Please log in again.", variant: "destructive"});
             router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
         }
       }
    } finally {
       // Initial loading is handled in the useEffect below
    }
  }, [token, router, pathname, toast]); // Add router and pathname as dependencies

  // Effect to check for token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    console.log("AuthContext: Initial token check:", storedToken ? "Token found" : "No token");
    if (storedToken) {
      setToken(storedToken);
      // Set the header immediately for subsequent requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser(storedToken).finally(() => setLoading(false)); // Fetch user and then set loading false
    } else {
      setLoading(false); // No token, stop loading
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const login = async (data: FormData) => {
    setLoading(true);
    try {
      // Use x-www-form-urlencoded for OAuth2 password flow
      const loginUrl = `/login/access-token`; // Relative path is fine
      console.log(`AuthContext: Attempting login POST to ${apiClient.defaults.baseURL}${loginUrl}`);

      const response = await apiClient.post<Token>(
        loginUrl,
        data, // FormData will be correctly encoded by axios
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } // Explicitly set header for this request
      );
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Update header in axios instance
      await fetchUser(access_token); // Fetch user data after successful login
      toast({ title: "Login Successful", description: "Welcome back!" });
      // Redirect is handled by the page component using searchParams
    } catch (error) {
       console.error('AuthContext: Login failed:', error);
       // Check specifically for Network Error -> likely CORS
        if (axios.isAxiosError(error) && error.message === 'Network Error') {
            console.error("AuthContext: Network Error during login. This is likely a CORS issue or the backend is unreachable from the browser. Check backend CORS setup allows this frontend origin.");
            throw new Error("Network Error: Could not connect to the server. Please ensure the backend is running and allows requests from this origin (CORS). See browser console and API client file for details.");
        } else if (axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
             // FastAPI default for invalid credentials in OAuth2PasswordBearer is 401, but templates might use 400.
             throw new Error("Invalid email or password.");
         } else {
            // Catchall for other errors
            const errorMsg = axios.isAxiosError(error) ? error.response?.data?.detail || error.message : 'An unexpected error occurred during login.';
            throw new Error(errorMsg);
         }
    } finally {
      setLoading(false);
    }
  };

   const register = async (data: any) => {
     setLoading(true);
     try {
       const signupUrl = `/users/signup`;
       console.log(`AuthContext: Attempting registration POST to ${apiClient.defaults.baseURL}${signupUrl}`);
       // Backend expects JSON for signup
       await apiClient.post<UserPublic>(signupUrl, data, { headers: { 'Content-Type': 'application/json' } });

       // After successful registration, automatically log the user in
       const loginData = new FormData();
       loginData.append('username', data.email); // FastAPI OAuth2 expects 'username'
       loginData.append('password', data.password);
       loginData.append('grant_type', 'password'); // Required by FastAPI OAuth2 form

       console.log("AuthContext: Registration successful, attempting automatic login.");
       await login(loginData); // Login automatically after registration
       // Toast for login success is handled within login()
     } catch (error) {
        console.error('AuthContext: Registration failed:', error);
        // Handle Network Error -> likely CORS
         if (axios.isAxiosError(error) && error.message === 'Network Error') {
             console.error("AuthContext: Network Error during registration. This is likely a CORS issue or the backend is unreachable from the browser. Check backend CORS setup allows this frontend origin.");
             throw new Error("Network Error: Could not connect to the server for registration. Ensure the backend is running and allows requests from this origin (CORS). See browser console and API client file for details.");
         } else if (axios.isAxiosError(error) && error.response?.status === 400) {
            // Check for specific backend error messages
             if (error.response.data?.detail?.includes("already exists") || error.response.data?.detail?.includes("already registered")) {
                throw new Error("Email already registered. Please login.");
             } else {
                // General validation error from backend
                 throw new Error(error.response.data?.detail || "Registration validation failed.");
             }
         } else if (axios.isAxiosError(error) && error.response?.status === 422) {
              // Handle detailed validation errors if backend returns 422
               const errorDetail = error.response.data?.detail?.[0];
               const errorMessage = errorDetail ? `${errorDetail.loc.join('.')} - ${errorDetail.msg}` : "Invalid registration data.";
               throw new Error(errorMessage);
         }
         // Catchall for other errors
         const errorMsg = axios.isAxiosError(error) ? error.message : 'Registration failed. Please try again.';
         throw new Error(errorMsg);
     } finally {
       setLoading(false);
     }
   };


  const logout = async () => {
    console.log("AuthContext: Logging out.");
    setLoading(true);
    // No backend endpoint for logout usually needed with JWT, just clear client-side
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization']; // Clear header in axios instance
    setLoading(false);
    router.push('/'); // Redirect to home page after logout
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
