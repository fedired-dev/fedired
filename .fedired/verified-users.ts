/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const verifiedUsers = [
  const API_URL = "https://api-verify.fedired.com/verified-users";

];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};

