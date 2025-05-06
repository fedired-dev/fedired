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

export const fetchVerifiedUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Error al obtener usuarios verificados: ${res.status}`);
    }
    const data: VerifiedUsersResponse = await res.json();
    return data.verifiedUsers;
  } catch (error) {
    console.error('Error al obtener usuarios verificados:', error);
    return [];
  }
};

export const isVerified = async (username: string): Promise<boolean> => {
  try {
    const verifiedUsers = await fetchVerifiedUsers();
    return verifiedUsers.includes(username);
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return false;
  }
};