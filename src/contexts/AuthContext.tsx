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
    // No need to setLoading(true) here if we only call this when we already have a token
    // setLoading(true);
    try {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`; // Set header for this request
      const response = await apiClient.get<UserPublic>('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      localStorage.removeItem('accessToken'); // Clear invalid token
      setToken(null);
      delete apiClient.defaults.headers.common['Authorization']; // Clear header in axios instance

      // Optionally redirect if the error indicates an invalid token
       if (axios.isAxiosError(error) && error.response?.status === 401) {
         // Redirect only if not already on a public page
         const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
         if (!publicPaths.includes(pathname)) {
             toast({ title: "Session expired", description: "Please log in again.", variant: "destructive"});
             // Use replace to avoid adding the failed page to history
             router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
         }
       }
    } finally {
      // setLoading(false); // Loading should be false once initial check is done
    }
  }, [token, router, pathname, toast]); // Add router and pathname as dependencies

  // Effect to check for token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    console.log("Initial token check:", storedToken);
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).finally(() => setLoading(false)); // Set loading false after fetch attempt
    } else {
      setLoading(false); // No token, stop loading
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const login = async (data: FormData) => {
    setLoading(true);
    try {
      // Use x-www-form-urlencoded for OAuth2 password flow
      const loginUrl = `${apiClient.defaults.baseURL}/login/access-token`;
      console.log("Attempting login to:", loginUrl); // Log the full URL being hit

      const response = await apiClient.post<Token>(
        '/login/access-token',
        data, // FormData handles the encoding
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Set header for future requests
      await fetchUser(access_token); // Fetch user data after successful login
      toast({ title: "Login Successful", description: "Welcome back!" });
      // Redirect is handled by the page component using searchParams
    } catch (error) {
       console.error('Login failed:', error);
        // Check specifically for Network Error
        if (axios.isAxiosError(error) && error.message === 'Network Error') {
            console.error("Network Error during login. Check backend server status and CORS configuration.");
            throw new Error("Network Error: Could not connect to the server. Please ensure the backend is running and allows requests from this origin (CORS).");
        } else if (axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
             // FastAPI default for invalid credentials in OAuth2PasswordBearer is 401, but templates might use 400.
             throw new Error("Invalid email or password.");
         } else {
            throw new Error("An unexpected error occurred during login.");
         }
    } finally {
      setLoading(false);
    }
  };

   const register = async (data: any) => {
     setLoading(true);
     try {
       console.log("Attempting registration to:", `${apiClient.defaults.baseURL}/users/signup`);
       await apiClient.post<UserPublic>('/users/signup', data);
       // After successful registration, log the user in
       const loginData = new FormData();
       loginData.append('username', data.email); // FastAPI OAuth2 expects 'username'
       loginData.append('password', data.password);
       loginData.append('grant_type', 'password'); // Required by FastAPI OAuth2 form
       await login(loginData); // Login automatically after registration
       // Toast for login success is handled within login() now
       // toast({ title: "Registration Successful", description: "Welcome to Imacall!"});
     } catch (error) {
        console.error('Registration failed:', error);
         if (axios.isAxiosError(error) && error.message === 'Network Error') {
             console.error("Network Error during registration. Check backend server status and CORS configuration.");
             throw new Error("Network Error: Could not connect to the server for registration. Ensure the backend is running and allows requests from this origin (CORS).");
         } else if (axios.isAxiosError(error) && error.response?.status === 400) {
            // Example: Check for specific error messages from backend if available
             if (error.response.data?.detail?.includes("already exists")) {
                throw new Error("Email already registered. Please login.");
             } else {
                // General validation error from backend (e.g., password too short)
                 throw new Error(error.response.data?.detail || "Registration validation failed.");
             }
         } else if (axios.isAxiosError(error) && error.response?.status === 422) {
              // Handle validation errors if backend returns 422
               const errorDetail = error.response.data?.detail?.[0];
               const errorMessage = errorDetail ? `${errorDetail.loc.join('.')} - ${errorDetail.msg}` : "Invalid registration data.";
               throw new Error(errorMessage);
         }
         throw new Error("Registration failed. Please try again.");
     } finally {
       setLoading(false);
     }
   };


  const logout = async () => {
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