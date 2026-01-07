'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a context for cache invalidation
export const CacheContext = createContext({
  invalidateCache: () => {},
  setUserLoggedIn: (userId: string) => {},
  userId: null as string | null,
});

export const useCacheInvalidation = () => useContext(CacheContext);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use ref to ensure the QueryClient instance persists across renders
  const queryClientRef = useRef<QueryClient | null>(null);
  
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes - much longer stale time
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnMount: false, // Don't refetch on mount by default
        },
      },
    });
  }
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Function to invalidate all queries
  const invalidateCache = () => {
    console.log('Invalidating all queries');
    if (queryClientRef.current) {
      queryClientRef.current.invalidateQueries();
    }
  };
  
  // Function to set current user and invalidate cache if user changes
  const setUserLoggedIn = (userId: string) => {
    if (userId !== currentUserId) {
      console.log('User changed, invalidating cache');
      setCurrentUserId(userId);
      
      // Store the current user ID in localStorage for cross-tab synchronization
      localStorage.setItem('currentUserId', userId);
      localStorage.setItem('lastUserChange', Date.now().toString());
      
      // Don't invalidate immediately to prevent double fetching
      setTimeout(() => {
        if (queryClientRef.current) {
          queryClientRef.current.invalidateQueries();
        }
      }, 100);
    }
  };
  
  // Listen for logout and login events
  useEffect(() => {
    // Check if there's a stored user ID on mount
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId && storedUserId !== currentUserId) {
      setCurrentUserId(storedUserId);
    }
    
    const handleStorageEvent = (event: StorageEvent) => {
      // Handle logout events
      if (event.key === 'logout' && event.newValue) {
        console.log('Logout detected in another tab');
        setCurrentUserId(null);
      }
      
      // Handle login events
      if (event.key === 'login' && event.newValue) {
        console.log('Login detected in another tab');
        if (event.newValue !== currentUserId) {
          setCurrentUserId(event.newValue);
        }
      }
      
      // Handle user ID changes
      if (event.key === 'currentUserId' && event.newValue) {
        if (event.newValue !== currentUserId) {
          console.log('User ID changed in another tab');
          setCurrentUserId(event.newValue);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [currentUserId]);

  return (
    <CacheContext.Provider value={{ 
      invalidateCache, 
      setUserLoggedIn,
      userId: currentUserId
    }}>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </CacheContext.Provider>
  )
} 