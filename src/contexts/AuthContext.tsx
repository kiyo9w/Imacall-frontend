'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import type { Token, UserPublic } from '@/types/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
    setLoading(true);
    try {
      const response = await apiClient.get<UserPublic>('/users/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      localStorage.removeItem('accessToken'); // Clear invalid token
      setToken(null);
      // Optionally redirect if the error indicates an invalid token
       if (axios.isAxiosError(error) && error.response?.status === 401) {
         // Redirect only if not already on a public page
         const publicPaths = ['/login', '/register', '/forgot-password', '/'];
         if (!publicPaths.includes(pathname)) {
             toast({ title: "Session expired", description: "Please log in again.", variant: "destructive"});
             router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
         }
       }
    } finally {
      setLoading(false);
    }
  }, [token, router, pathname, toast]); // Add router and pathname as dependencies

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]); // Only run on mount and when fetchUser changes


  const login = async (data: FormData) => {
    setLoading(true);
    try {
      // Use x-www-form-urlencoded for OAuth2 password flow
      const response = await apiClient.post<Token>(
        '/login/access-token',
        data, // FormData handles the encoding
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      await fetchUser(access_token); // Fetch user data after successful login
    } catch (error) {
       console.error('Login failed:', error);
        // Handle specific login errors from the backend if needed
        if (axios.isAxiosError(error) && error.response?.status === 400) {
             // Assuming 400 for invalid credentials based on FastAPI template
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
       await apiClient.post<UserPublic>('/users/signup', data);
       // After successful registration, log the user in
       const loginData = new FormData();
       loginData.append('username', data.email);
       loginData.append('password', data.password);
       await login(loginData); // Login automatically after registration
       toast({ title: "Registration Successful", description: "Welcome to Imacall!"});
     } catch (error) {
        console.error('Registration failed:', error);
        if (axios.isAxiosError(error) && error.response?.status === 400) {
            // Example: Check for specific error messages from backend if available
             if (error.response.data?.detail?.includes("already exists")) {
                throw new Error("Email already registered. Please login.");
             }
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
    apiClient.defaults.headers['Authorization'] = undefined; // Clear header in axios instance
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

// Need to import axios for error checking
import axios from 'axios';
