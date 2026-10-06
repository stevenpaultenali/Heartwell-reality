const db = require("./database");
const bcrypt = require("bcryptjs");

const username = "admin";
const password = "admin123";

const hashedPassword = bcrypt.hashSync(password, 12);

const result = db.prepare(`
    UPDATE admins
    SET password = ?
    WHERE username = ?
`).run(hashedPassword, username);

if (result.changes === 0) {
    console.log("Admin account not found.");
} else {
    console.log("Admin password secured successfully.");
    console.log("Username: admin");
    console.log("Password: admin123");
}