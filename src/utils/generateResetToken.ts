const generateResetToken = (length: number = 12): string => {
  const characters: string = '0123456789';
  let token: string = '';
  
  for (let i: number = 0; i < length; i++) {
    const randomIndex: number = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }
  
  return token;
};

export default generateResetToken;
