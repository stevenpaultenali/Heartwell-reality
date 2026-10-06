const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const db = require("./database");

const app = express();

const PORT = 3000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   SERVE FRONTEND
========================================================= */

app.use(
    express.static(
        path.join(__dirname, "..")
    )
);


app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "..",
            "real-estate.html"
        )
    );

});


/* =========================================================
   ADMIN SESSIONS
========================================================= */

const sessions = new Set();


/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
    "/api/admin/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (!username || !password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username and password are required."

                });

            }


            const admin = db
                .prepare(
                    `
                    SELECT *
                    FROM admins
                    WHERE username = ?
                    `
                )
                .get(username);


            if (!admin) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });

            }


            const passwordValid =
                await bcrypt.compare(
                    password,
                    admin.password
                );


            if (!passwordValid) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });

            }


            const token =
                crypto.randomBytes(32).toString("hex");


            sessions.add(token);


            res.json({

                success: true,

                token: token

            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Login failed."

            });

        }

    }
);


/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

function requireAuth(
    req,
    res,
    next
) {

    const auth =
        req.headers.authorization;


    if (
        !auth ||
        !auth.startsWith("Bearer ")
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Unauthorized."

        });

    }


    const token =
        auth.replace(
            "Bearer ",
            ""
        );


    if (!sessions.has(token)) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired session."

        });

    }


    next();

}


/* =========================================================
   CHECK ADMIN SESSION
========================================================= */

app.get(
    "/api/admin/check",
    requireAuth,
    (req, res) => {

        res.json({

            success: true,

            message:
                "Admin session is valid."

        });

    }
);


/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
    "/api/admin/logout",
    requireAuth,
    (req, res) => {

        const auth =
            req.headers.authorization;


        const token =
            auth.replace(
                "Bearer ",
                ""
            );


        sessions.delete(token);


        res.json({

            success: true,

            message:
                "Logged out successfully."

        });

    }
);


/* =========================================================
   CREATE CUSTOMER ENQUIRY
========================================================= */

app.post(
    "/api/enquiries",
    (req, res) => {

        try {

            const {
                name,
                email,
                phone,
                property_interest,
                message
            } = req.body;


            if (
                !name ||
                !email ||
                !message
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name, email and message are required."

                });

            }


            const result =
                db.prepare(
                    `
                    INSERT INTO enquiries
                    (
                        name,
                        email,
                        phone,
                        property_interest,
                        message
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `
                )
                .run(
                    name.trim(),
                    email.trim(),
                    phone || "",
                    property_interest || "",
                    message.trim()
                );


            res.json({

                success: true,

                message:
                    "Enquiry submitted successfully.",

                id:
                    result.lastInsertRowid

            });


        } catch (error) {

            console.error(
                "Enquiry error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to save enquiry."

            });

        }

    }
);


/* =========================================================
   GET CUSTOMER ENQUIRIES
========================================================= */

app.get(
    "/api/enquiries",
    requireAuth,
    (req, res) => {

        try {

            const enquiries =
                db.prepare(
                    `
                    SELECT *
                    FROM enquiries
                    ORDER BY created_at DESC
                    `
                )
                .all();


            res.json({

                success: true,

                enquiries:
                    enquiries

            });


        } catch (error) {

            console.error(
                "Get enquiries error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load enquiries."

            });

        }

    }
);


/* =========================================================
   DELETE CUSTOMER ENQUIRY
========================================================= */

app.delete(
    "/api/enquiries/:id",
    requireAuth,
    (req, res) => {

        try {

            const result =
                db.prepare(
                    `
                    DELETE FROM enquiries
                    WHERE id = ?
                    `
                )
                .run(
                    req.params.id
                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Enquiry not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Enquiry deleted successfully."

            });


        } catch (error) {

            console.error(
                "Delete enquiry error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to delete enquiry."

            });

        }

    }
);


/* =========================================================
   GET PROPERTIES
========================================================= */

app.get(
    "/api/properties",
    (req, res) => {

        try {

            const properties =
                db.prepare(
                    `
                    SELECT *
                    FROM properties
                    ORDER BY created_at DESC
                    `
                )
                .all();


            res.json({

                success: true,

                properties:
                    properties

            });


        } catch (error) {

            console.error(
                "Get properties error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load properties."

            });

        }

    }
);


/* =========================================================
   ADD PROPERTY
========================================================= */

app.post(
    "/api/properties",
    requireAuth,
    (req, res) => {

        try {

            const {
                title,
                location,
                property_type,
                price,
                bedrooms,
                bathrooms,
                area,
                description,
                image_url,
                status
            } = req.body;


            if (
                !title ||
                !location
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Title and location are required."

                });

            }


            const result =
                db.prepare(
                    `
                    INSERT INTO properties
                    (
                        title,
                        location,
                        property_type,
                        price,
                        bedrooms,
                        bathrooms,
                        area,
                        description,
                        image_url,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .run(
                    title,
                    location,
                    property_type || "",
                    price || 0,
                    bedrooms || 0,
                    bathrooms || 0,
                    area || 0,
                    description || "",
                    image_url || "",
                    status || "For sale"
                );


            res.json({

                success: true,

                message:
                    "Property added successfully.",

                id:
                    result.lastInsertRowid

            });


        } catch (error) {

            console.error(
                "Add property error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to add property."

            });

        }

    }
);


/* =========================================================
   UPDATE PROPERTY
========================================================= */

app.put(
    "/api/properties/:id",
    requireAuth,
    (req, res) => {

        try {

            const {
                title,
                location,
                property_type,
                price,
                bedrooms,
                bathrooms,
                area,
                description,
                image_url,
                status
            } = req.body;


            const result =
                db.prepare(
                    `
                    UPDATE properties

                    SET
                        title = ?,
                        location = ?,
                        property_type = ?,
                        price = ?,
                        bedrooms = ?,
                        bathrooms = ?,
                        area = ?,
                        description = ?,
                        image_url = ?,
                        status = ?

                    WHERE id = ?
                    `
                )
                .run(
                    title,
                    location,
                    property_type || "",
                    price || 0,
                    bedrooms || 0,
                    bathrooms || 0,
                    area || 0,
                    description || "",
                    image_url || "",
                    status || "For sale",
                    req.params.id
                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Property not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Property updated successfully."

            });


        } catch (error) {

            console.error(
                "Update property error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to update property."

            });

        }

    }
);


/* =========================================================
   DELETE PROPERTY
========================================================= */

app.delete(
    "/api/properties/:id",
    requireAuth,
    (req, res) => {

        try {

            const result =
                db.prepare(
                    `
                    DELETE FROM properties
                    WHERE id = ?
                    `
                )
                .run(
                    req.params.id
                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Property not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Property deleted successfully."

            });


        } catch (error) {

            console.error(
                "Delete property error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to delete property."

            });

        }

    }
);


/* =========================================================
   SERVER STATUS
========================================================= */

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Hartwell Realty backend is running."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "Hartwell Realty backend running"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "================================="
        );

    }
);