const { generateRandomString, userCheck } = require("./helper");
const express = require("express");
const app = express();
const PORT = 8080;

//Parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser());
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const users = {
  "111": {
    id: "111",
    email: "1234@number.com",
    password: "123"
  },
  "222": {
    id: "222",
    email: "aaa@bbb.com",
    password: "abc"
  }
}


app.use(cookieSession({
  name: "chocolateChip",
  keys: ["Eggs, butter, flour, sugar, baking powder", "Valrhona couveture"]
}));

// get requests

// A get request that will redirect the client to the mainpage of the tinyapp
app.get("/", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  
  const usersLinks = {};
  const userID = req.session.user_id;
  if(users[userID]) {
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
  const templateVars = { user: users[req.session.user_id] }
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
});

// A get request that renders the register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] }
  res.render("register", templateVars);
});

// A get request that renders the login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] }
  res.render("login", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// post requests


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if ( !email || !password ) {
    return res.status(400).send("Email or password cannot be blank");
  }

  const user = userCheck(email, users);

  if (!user) {
    return res.status(400).send("No user with that email was found");
  }
  
  if (bcrypt.compareSync(password, user.password) === false) {
    return res.status(400).send("Password given does not match");
  }

  req.session.user_id = user.id
  res.redirect("/urls");
  
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email === null || password === null) {
    res.status(400).send("Please enter a valid email and password.");
    return;
  }
  const newUser = userCheck(email, users);
  
  if(newUser) {
    res.status(400).send("Email already in use.");
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  users[userID] = {id: userID, email: email, password: hashedPassword};

  req.session.user_id = userID;
  res.redirect("/urls");
});

// A post request used to generate a new short URL and catagorize it into the database
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL
  urlDatabase[shortURL] = { longURL: longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// A post request that will allow the client to delete a stored URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(401).send("Only registered users are allowed to make changes.")
  }
  delete urlDatabase[shortURL]
  res.redirect(`/urls`);
});

// A post request for changing the URL of a currently stored site
app.post("/urls/:shortURL/edit", (req, res) => { 
  const shortURL = req.params.shortURL;
  if (!req.session.user_id) {
    return res.status(401).send("Only registered users are allowed to make changes.")
  }
  urlDatabase[shortURL]["longURL"] = req.body.newLongURL;
  res.redirect(`/urls/${shortURL}`);
});

//// A logout post that will clear the cookie associated with our username
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
})

//listener to indicate a connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
