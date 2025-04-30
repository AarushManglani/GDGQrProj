const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const { PrismaClient } = require('../generated/prisma/default')
const prisma = new PrismaClient()
const authenticateUser = require("../middleware/auth");
router.post("/register", async (req, res) => {
    const { name, email, password, student_id } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "Student",
            student_id,
        }
    });

    res.status(201).json({ message: "User created", user });
});


router.post("/register-event/:eventId", authenticateUser, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    try {
        const event = await prisma.events.findUnique({ where: { eventid: parseInt(eventId) } });
        if (!event) return res.status(404).send("Event not found");
        await prisma.user.update({
            where: { id: userId },
            data: {
                events: {
                    connect: { eventid: parseInt(eventId) }
                }
            }
        });

        res.status(200).send("User registered for event");
    } catch (err) {
        res.status(500).json({ message: "Error registering for event", error: err.message });
    }
});


module.exports = router
