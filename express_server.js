const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let randomShortUrl = ''
  const setCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxy1234567890';
  for (let i = 0; i < 6; i++) {
    let randomCharacter = Math.floor(Math.random() * 61);
    randomShortUrl += setCharacters[randomCharacter];
  }
  return randomShortUrl;
}


// get requests
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// post requests
app.post("/urls", (req, res) => {
  shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//listener to indicate a connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});