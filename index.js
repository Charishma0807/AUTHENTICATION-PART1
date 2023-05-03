const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//REGISTER USER API

app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //using hash() password here
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  //checking for users in database
  const selectUserDetails = `
  SELECT *
  FROM user 
  WHERE username = '${username}';`;
  //if we get username same then we get stored in dbUser
  const dbUser = await db.get(selectUserDetails);

  //if no row matches in the given condition then value in the db user would be undefined
  if (dbUser === undefined) {
    //create new user
    const createUserQuery = `
    INSERT INTO 
        user (username, name, location, gender, password)
    VALUES 
    (
        '${username}',
        '${name}',
        '${location}',
        '${gender}',
        '${hashedPassword}'
    );`;
    await db.run(createUserQuery);
    response.send("User Created Successfully.");
  } else {
    //user already exit
    response.status(400);
    //then sending message
    response.send("User Already Exists.");
  }
});

//LOGIN USER API

app.post("/login/", async (request, response) => {
  //getting user details
  const { username, password } = request.body;
  //check if user exists in database
  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';
    `;
  //with which we have fetching the user
  const dbUser = await db.get(selectUserQuery);
  //if their is no user
  if (dbUser === undefined) {
    //Invalid User
    response.send(400);
    response.send("Invalid User");
  } else {
    //check password
    const isPasswordMatched = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    //Sending HTTP response based on password
    if (isPasswordMatched === true) {
      response.send("Login Success");
    } else {
      response.send(400);
      response.send("Invalid Password");
    }
  }
});
