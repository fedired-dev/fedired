
export const sponsorUsers = [
    "srnovus",
  ];
  
  export const isSponsor = (username: string): boolean => {
    return sponsorUsers.includes(username);
  };
  
  
