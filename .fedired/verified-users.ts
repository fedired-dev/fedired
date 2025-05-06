const API_URL = "https://api-verify.fedired.com/verified-users";

export const fetchVerifiedUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      console.error("Error al obtener los usuarios verificados:", res.statusText);
      return [];
    }

    const data = await res.json();

    if (!data || !Array.isArray(data.verifiedUsers)) {
      console.error("Formato inválido desde API:", data);
      return [];
    }

    return data.verifiedUsers;
  } catch (error) {
    console.error("Error al conectarse a la API:", error);
    return [];
  }
};

export const isVerified = async (username: string): Promise<boolean> => {
  const verifiedUsers = await fetchVerifiedUsers();
  return verifiedUsers.includes(username);
};
