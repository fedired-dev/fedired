/**
 * @file verification.service.ts
 * @description Servicio para verificación de usuarios
 * @copyright (C) 2024 Fedired - AGPL v3
 */

/**
 * Verifica si un usuario está verificado a través de la API
 * @param username - Nombre de usuario a verificar
 * @returns Promise<boolean> - true si el usuario está verificado
 */
export const isVerified = async (username: string): Promise<boolean> => {
  try {
    // En desarrollo, usa la URL local
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888' 
      : 'https://[tu-dominio].netlify.app';

    const response = await fetch(`${baseUrl}/.netlify/functions/verified-users/${username}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar el usuario');
    }

    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error en la verificación:', error);
    return false;
  }
}; 