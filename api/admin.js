const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('../generated/prisma/default');
const prisma = new PrismaClient();
require("dotenv").config();

function checkIfAdmin(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token is missing" });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decodedToken.role !== "Admin") {
            return res.status(403).json({ message: "You must be an admin to access this route" });
        }        
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

router.post("/create-event", checkIfAdmin, async (req, res) => {
    const { event_name, desc, location, Datetime } = req.body;
    
    try {
        const newEvent = await prisma.events.create({
            data: {
                event_name,
                desc,
                location,
                Datetime: new Date(Datetime),
            },
        });

        res.status(201).json({
            message: "Event created successfully",
            event: newEvent,
        });
    } catch (err) {
        res.status(500).json({ message: "Error creating event", error: err.message });
    }
});

router.delete("/delete-event/:eventId", checkIfAdmin, async (req, res) => {
    const { eventId } = req.params;

    try {
        const deleted = await prisma.events.delete({
            where: {
                eventid: parseInt(eventId),
            },
        });

        res.json({ message: "Event deleted", deleted });
    } catch (err) {
        res.status(500).json({ message: "Error deleting event", error: err.message });
    }
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).send("User not found");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).send("Invalid password");

        if (!user.isAdmin) {
            return res.status(403).send("You must be an admin to log in");
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );
        
        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, email: user.email, isAdmin: user.isAdmin },
        });
    } catch (err) {
        res.status(500).send("Error logging in");
    }
});

router.post("/user-login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).send("User not found");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).send("Invalid password");

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: false },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({
            message: "User login successful",
            token,
            user: { id: user.id, email: user.email, isAdmin: false },
        });
    } catch {
        res.status(500).send("Error logging in");
    }
});

router.get("/checked-in/:eventId", checkIfAdmin, async (req, res) => {
    const { eventId } = req.params;

    try {
        const checkIns = await prisma.checkIn.findMany({
            where: { eventId: parseInt(eventId) },
            include: { user: true }
        });

        res.json({ eventId, attendees: checkIns.map(c => c.user) });
    } catch {
        res.status(500).send("Could not fetch check-ins");
    }
});



module.exports = router;
