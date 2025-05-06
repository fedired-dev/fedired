/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const API_URL = "https://api-verify.fedired.com/verified-users";

// Función para obtener los usuarios verificados desde la API
export const fetchVerifiedUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      console.error("Error al obtener los usuarios verificados:", res.statusText);
      return [];  
    }

    const data = await res.json();

    // Verificar el formato de los datos
    console.log("Datos recibidos de la API:", data);

    // Asegurarnos de que `verifiedUsers` es un array
    if (!data || !Array.isArray(data.verifiedUsers)) {
      console.error("Formato inválido desde la API:", data);
      return [];  
    }

    return data.verifiedUsers;  
  } catch (error) {
    console.error("Error al conectarse a la API:", error);
    return [];  
  }
};

// Función para verificar si un usuario está verificado
export const isVerified = async (username: string): Promise<boolean> => {
  // Obtener los usuarios verificados desde la API
  const verifiedUsers = await fetchVerifiedUsers();

  // Mostrar los usuarios verificados para depuración
  console.log("Usuarios verificados:", verifiedUsers);

  // Verificar si el nombre de usuario existe en la lista de verificados (ignorando mayúsculas/minúsculas)
  return verifiedUsers.some(user => user.trim().toLowerCase() === username.trim().toLowerCase());
};
