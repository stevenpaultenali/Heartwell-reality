const db = require("./database");
const bcrypt = require("bcryptjs");

const username = "admin";
const password = "admin123";

const existing = db
    .prepare("SELECT id FROM admins WHERE username = ?")
    .get(username);

if (existing) {
    console.log("Admin account already exists.");
} else {

    const hashedPassword =
        bcrypt.hashSync(password, 12);

    db.prepare(`
        INSERT INTO admins (username, password)
        VALUES (?, ?)
    `).run(
        username,
        hashedPassword
    );

    console.log("Admin account created successfully.");
    console.log("Username: admin");
    console.log("Password: admin123");
}