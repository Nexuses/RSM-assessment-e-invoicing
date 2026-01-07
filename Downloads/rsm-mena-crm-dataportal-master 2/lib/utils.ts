import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"
import mongoose from "mongoose"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a cached response with appropriate cache headers
 * @param data The data to return in the response
 * @param maxAge Cache max age in seconds (default: 60 seconds)
 * @param staleWhileRevalidate Time in seconds that a stale response can be served while revalidating (default: 300 seconds)
 * @returns NextResponse with cache headers
 */
export function createCachedResponse(data: any, maxAge: number = 60, staleWhileRevalidate: number = 300) {
  const res = NextResponse.json(data);
  res.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  return res;
}

/**
 * Creates a non-cached response with appropriate no-cache headers
 * @param data The data to return in the response
 * @returns NextResponse with no-cache headers
 */
export function createNonCachedResponse(data: any) {
  const res = NextResponse.json(data);
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

/**
 * Ensures that the given collection has the specified indexes
 * @param collection Mongoose collection
 * @param indexSpecs Array of index specifications to ensure
 */
export async function ensureIndexes(collection: mongoose.Collection, indexSpecs: { fields: Record<string, number>, options?: mongoose.IndexOptions }[]) {
  try {
    const existingIndexes = await collection.indexes();
    
    for (const spec of indexSpecs) {
      // Generate a name based on fields for comparison
      const fieldKeys = Object.keys(spec.fields);
      const indexName = fieldKeys.map(key => `${key}_${spec.fields[key]}`).join('_');
      
      const indexExists = existingIndexes.some(idx => idx.name === indexName);
      
      if (!indexExists) {
        await collection.createIndex(spec.fields, spec.options);
      }
    }
  } catch (error) {
    console.error("Error ensuring indexes:", error);
  }
}

/**
 * Handles logout process including cache invalidation
 * Should be called when a user logs out
 */
export function handleLogout() {
  // Trigger cache invalidation via localStorage
  const timestamp = Date.now().toString();
  localStorage.setItem('logout', timestamp);
  
  // Clear all user-specific data from localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('userData');
  
  // Clear any React Query cache in localStorage
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    if (key.startsWith('reactQuery')) {
      localStorage.removeItem(key);
    }
  });
  
  // Dispatch a storage event for other tabs to pick up
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'logout',
    newValue: timestamp
  }));
  
  // Force clear sessionStorage as well
  sessionStorage.clear();
}

/**
 * Handles login process including cache refresh
 * Should be called when a user logs in
 * @param userId The ID of the user who just logged in
 */
export function handleLogin(userId: string) {
  if (!userId) return;
  
  // Store user ID in localStorage
  localStorage.setItem('userId', userId);
  localStorage.setItem('currentUserId', userId);
  localStorage.setItem('login', Date.now().toString());
  
  // Clear any existing data from previous users
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    if (key.startsWith('reactQuery')) {
      localStorage.removeItem(key);
    }
  });
  
  // Dispatch a storage event for other tabs to pick up
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'login',
    newValue: userId
  }));
}

/**
 * Creates fetch options with cache-busting headers
 * @returns Object with headers and cache options for fetch
 */
export function createNoCacheOptions(method: string = 'GET') {
  return {
    method,
    cache: 'no-store' as RequestCache,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Cache-Buster': Date.now().toString()
    }
  };
}

/**
 * Adds a cache-busting query parameter to a URL
 * @param url The URL to add the cache buster to
 * @returns URL with cache busting parameter
 */
export function addCacheBuster(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}
