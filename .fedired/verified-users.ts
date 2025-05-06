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