const API_URL = "https://api-verify.fedired.com/verified-users";

export const fetchVerifiedUsers = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      console.error("Error al obtener los usuarios verificados:", res.statusText);
      return [];  
    }

    const data = await res.json();

    console.log("Datos recibidos de la API:", data);

    if (!data || !data.verifiedUsers || !Array.isArray(data.verifiedUsers)) {
      console.error("Formato inválido desde la API:", data);
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

  console.log("Usuarios verificados:", verifiedUsers);

  return verifiedUsers.some(user => user.toLowerCase() === username.trim().toLowerCase());
};
