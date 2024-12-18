 /**
 * Lista de usuarios sponsor.
 * 
 * NOTA: Este archivo debe ser editado manualmente por los administradores
 * para incluir los usuarios correctos en el sistema.
 */

 

 export const sponsorUsers = [
    "",
  ];
  
  export const isSponsor = (username: string): boolean => {
    return sponsorUsers.includes(username);
  };
  
  
