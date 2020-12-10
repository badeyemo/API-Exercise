const express = require('express'),
    router = express.Router(),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    db = require('../db');


const SECRET = 'NEVER TO BE DISPLAYED HERE IN PRODUCTION';


// Sign up a User
router.post('/', async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const result = await db.query("INSERT INTO users (username, password, isAdmin) VALUES ($1, $2, $3) RETURNING *", [req.body.username, hashedPassword, req.body.adminCode === "20102020"]);

        return res.status(201).json(result.rows[0])
    } catch (err) {
        return next(err);
    }
});


// Login a User
router.post('/login', async (req, res, next) => {
    try {
        const foundUser = await db.query("SELECT * FROM users WHERE username=$1", [req.body.username]);

        if (foundUser.rows.length === 0) {
            return res.json({ message: 'Null! No User found' });
        }

        const hashedPassword = await bcrypt.compare(req.body.password, foundUser.rows[0].password);

        if (hashedPassword === false) {
            return res.json({ message: 'Invalid' });
        }

        const token = jwt.sign(
            { id: foundUser.rows[0].id, isAdmin: foundUser.rows[0].isadmin },
            SECRET,
            { expiresIn: 60 * 60 }
        );

        return res.status(200).json({
            token: token,
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});


// Get all Users
router.get('/', userLoggedIn, async (req, res) => {
    try {
        const data = await db.query("SELECT * FROM users");

        return res.status(200).json(data.rows);
    } catch (e) {
        return res.status(400).json(e);
    }
});

// Get one user
router.get('/:id', userLoggedIn, async (req, res) => {
    try {
        const data = await db.query("SELECT * FROM users WHERE id=$1", [req.params.id]);

        return res.status(200).json(data.rows[0]);
    } catch (e) {
        return res.status(404).json(e);
    }
});

// Update a user
router.patch('/:id', userLoggedIn, async (req, res) => {
    try {
        const data = await db.query("UPDATE users SET username=$1 WHERE id=$2 RETURNING *", [req.body.username, req.params.id]);

        return res.status(201).json(data.rows[0]);
    } catch (e) {
        return res.status(400).json(e);
    }
});

// Delete a User
router.delete('/:id', userLoggedIn, async (req, res) => {
    try {
        const data = await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);

        return res.status(200).json({
            message: "User Deleted"
        });
    } catch (e) {
        return res.status(400).json(e);
    }
});

function userLoggedIn(req, res, next) {
    try {
        const authHeader = req.headers.authorization.split(" ")[1];
        const token = jwt.verify(authHeader, SECRET);

        if (token.id === req.params.id || token.isAdmin === true) {
            return next();
        } else {
            return res.status(404).json({
                message: 'Unauthorized User'
            });
        }
    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized access'
        });
    }
}

module.exports = router; 