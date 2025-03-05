
export const verifiedUsers = [
  "srnovus",
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};

