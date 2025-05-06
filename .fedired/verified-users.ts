/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const API_URL = "https://api-verify.fedired.com/verified-users";

export const fetchVerifiedUsers = async (): Promise<string[]> => {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.verifiedUsers;
};

export const isVerified = async (username: string): Promise<boolean> => {
  const verifiedUsers = await fetchVerifiedUsers();
  return verifiedUsers.includes(username);
};
