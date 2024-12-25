
export const verifiedUsers = [
  "srnovus",
  "fedired",
  "Chajalele_Gt",
  "jrecado",
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};

