export const verifiedUsers = [
  //pichula
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};