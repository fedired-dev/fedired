/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const API_URL = "https://api-verify.fedired.com/verified-users";

export const fetchVerifiedUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Error al obtener los usuarios verificados:", res.statusText);
      return [];
    }

    const data = await res.json();

    if (!data || !Array.isArray(data.verifiedUsers)) {
      console.error("Respuesta de API inválida", data);
      return [];
    }

    return data.verifiedUsers;
  } catch (error) {
    console.error("Error al conectar con la API:", error);
    return [];
  }
};

export const isVerified = async (username: string, verifierUsername: string): Promise<boolean> => {
  // Primero verificamos si el usuario que intenta verificar está en la lista de verificados
  const verifiedUsers = await fetchVerifiedUsers();
  
  if (!verifiedUsers || verifiedUsers.length === 0) {
    console.error("No se pudo obtener la lista de usuarios verificados");
    return false;
  }

  // Verificamos si el usuario que intenta verificar está autorizado
  if (!verifiedUsers.includes(verifierUsername)) {
    console.error(`Usuario ${verifierUsername} no está autorizado para realizar verificaciones`);
    return false;
  }

  // Si el verificador está autorizado, entonces verificamos al usuario objetivo
  return verifiedUsers.includes(username);
};
