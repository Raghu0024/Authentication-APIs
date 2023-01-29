const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "userData.db");
let database = null;

const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Database error:${database.error}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`;
    if (validatePassword(password)) {
      await database.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// app.post("/register", async (request, response) => {
//     const { username, name, password, gender, location } = request.body;
//     const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
//     const isUser = await database.get(selectUserQuery);
//     switch (true) {
//         case isUser !== undefined:
//             response.status(400);
//             response.send("User already exists");
//             break;
//         case password.length() < 5:
//             response.status(400);
//             response.send("Password is too short");
//             break;
//         default:
//             const hashedPassword = await bcrypt.hash(password, 10);
//             const createUserQuery = `
//         INSERT INTO
//           user(username,name,password,gender,location)
//         VALUES('${username}','${name}','${hashedPassword}','${gender}','${loccation}');`;
//             await database.run(createUserQuery);
//             response.status(200);
//             response.send("User created successfully");
//             break;
//     }
// });

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// app.post("/login", async (request, response) => {
//     const { username, password } = request.body;
//     const getUserQuery = `
//     SELECT * FROM user WHERE username='${username}';`;
//     const getUser = await database.get(getUserQuery);
//     const comparePassword = await bcrypt.compare(password, getUser.password);
//     switch (true) {
//         case getUser.username === undefined:
//             response.status(400);
//             response.send("Invalid user");
//             break;
//         case comparePassword:
//             response.status(400);
//             response.send("Invalid password");
//             break;
//         default:
//             response.status(200);
//             response.send("Login success!");
//             break;
//     }
// });

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await database.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

// app.put("/change-password", async (request, response) => {
//     const { username, oldPassword, newPassword } = request.body;
//     const getUserQuery = `
//     SELECT * FROM user WHERE username='${username}';`;
//     const getUser = await database.get(getUserQuery);
//     const currentPassword = await bcrypt.compare(oldPassword, getUser.password);
//     switch (true) {
//         case currentPassword:
//             response.status(400);
//             response.send("Invalid current password");
//             break;
//         case newPassword.length() < 5:
//             response.status(400);
//             response.send("Password is too short");
//             break;
//         default:
//             const hashPassword = await bcrypt.hash(newPassword, 10);
//             response.status(200);
//             const updatePasswordQuery = `UPDATE user SET password='${hashPassword}' WHERE username='${username}'`;
//             await database.run(updatePasswordQuery);
//             response.send("Password updated");
//             break;
//     }
// });

module.exports = app;
