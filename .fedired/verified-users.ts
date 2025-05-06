const API_URL = "https://fedired-api.vercel.app/"; 

const getVerifiedUsers = (): string[] => {
  console.log(`Consultando usuarios verificados desde: ${API_URL}`);
  return [];
};

export const isVerified = (username: string): boolean => {
  const verifiedUsers = getVerifiedUsers();
  return verifiedUsers.includes(username);
};
