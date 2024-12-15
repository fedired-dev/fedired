export const verifiedUsers = [
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};