
export const verifiedUsers = [
  "srnovus",
  "fedired",
  "Chajalele_Gt",
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};

