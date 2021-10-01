//Dependecies
const { generateRandomString, userCheck } = require("./helper");
const express = require("express");
const app = express();
const PORT = 8080;

//Middle wear
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(cookieSession({
  name: "chocolateChip",
  keys: ["Eggs, butter, flour, sugar, baking powder", "Valrhona couveture"]
}));


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "111"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "111"
  }
};

const users = {
  "111": {
    id: "111",
    email: "1234@number.com",
    password: "$2a$10$ndPnXwtBJhI221lx3TKaAOozooTkKDEhXOH.8DyXX1fYWJjGOGVX6" //123
  },
  "222": {
    id: "222",
    email: "aaa@bbb.com",
    password: "abc"
  }
};

//
// get requests //
//
// A get request that will redirect the client to the mainpage of the tinyapp
app.get("/", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

//A get for rendering the url "homepage" with user specific urls
app.get("/urls", (req, res) => {
  const usersLinks = {};
  const userID = req.session.user_id;
  if (users[userID]) {
    for (let url in urlDatabase) {
      if (urlDatabase[url].userID === users[userID].id) {
        usersLinks[url] = urlDatabase[url];
      }
    }
  }
  const templateVars = { urls: usersLinks, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// A get request which displays a new page for URL creation
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

//A get request for rendering a html with a user specific shoretend url
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    return res.status(400).send("You need to log in to view this.");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("Url not found.");
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(401).send("Unauthorized access.");
  }
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("The URL you are trying to access does not exist.");
  }
  
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
});

// A get request that renders the register page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

// A get request that renders the login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
// post requests //
//

//A login post that will login the user after clearing some checks
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) {
    return res.status(400).send("Email or password cannot be blank");
  }

  const user = userCheck(email, users);

  if (!user) {
    return res.status(400).send("No user with that email was found");
  }
  
  if (bcrypt.compareSync(password, user.password) === false) {
    return res.status(400).send("Password given does not match");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
  
});

//A post request that will register a new user and add them to the user database
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email === '' || password === '') {
    res.status(400).send("You cannot enter an empty email or password.");
    return;
  }
  if (userCheck(email, users)) {
    res.status(400).send("Email already in use.");
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = {id: userID, email: email, password: hashedPassword};

  req.session.user_id = userID;
  res.redirect("/urls");
});

// A post request used to generate a new short URL and catagorize it into the database
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("Please log in to view this content.");
  }
  
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// A post request that will allow the client to delete a stored URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(401).send("Only registered users are allowed to make changes.");
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(401).send("You are only allowed to make changes to your own URL's.");
  }
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

// A post request for changing the URL of a currently stored site
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(401).send("Only registered users are allowed to make changes.");
  }
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.status(401).send("You are only allowed to make changes to your own URL's.");
  }
  urlDatabase[shortURL]["longURL"] = req.body.newLongURL;
  res.redirect(`/urls/${shortURL}`);
});

//// A logout post that will clear the cookies and redirect to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//listener to indicate a connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
