/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

interface VerifiedUsersResponse {
  verifiedUsers: string[];
}

const API_URL = "https://api-verify.fedired.com/verified-users";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CacheData {
  users: string[];
  timestamp: number;
}

let cache: CacheData | null = null;

const isCacheValid = (): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
};

export const fetchVerifiedUsers = async (token?: string): Promise<string[]> => {
  try {
    // Si el caché es válido, retornamos los datos del caché
    if (isCacheValid() && cache) {
      return cache.users;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Si hay token, lo añadimos a los headers
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(API_URL, { headers });
    
    if (!res.ok) {
      throw new Error(`Error al obtener usuarios verificados: ${res.status}`);
    }

    const data: VerifiedUsersResponse = await res.json();
    
    // Actualizamos el caché
    cache = {
      users: data.verifiedUsers,
      timestamp: Date.now()
    };

    return data.verifiedUsers;
  } catch (error) {
    console.error('Error al obtener usuarios verificados:', error);
    // Si hay caché, lo usamos como fallback
    if (cache) {
      return cache.users;
    }
    return [];
  }
};

export const isVerified = async (username: string, token?: string): Promise<boolean> => {
  try {
    if (!username) {
      return false;
    }

    const verifiedUsers = await fetchVerifiedUsers(token);
    return verifiedUsers.includes(username);
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return false;
  }
};

// Función para limpiar el caché manualmente
export const clearVerifiedUsersCache = (): void => {
  cache = null;
};