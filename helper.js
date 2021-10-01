
//Helper functions

const userCheck = (email, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user
    }
  }
  return null;
}


const generateRandomString = () => {
  let randomShortUrl = ''
  const setCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxy1234567890';
  for (let i = 0; i < 6; i++) {
    let randomCharacter = Math.floor(Math.random() * 61);
    randomShortUrl += setCharacters[randomCharacter];
  }
  return randomShortUrl;
}

module.exports = { generateRandomString, userCheck};