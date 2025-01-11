
export const verifiedUsers = [
  "srnovus",
  "fedired",
  "Chajalele_Gt",
  "jrecado",
  "ronalon",
];

export const isVerified = (username: string): boolean => {
  return verifiedUsers.includes(username);
};

