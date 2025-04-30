const { PrismaClient } = require('../generated/prisma/default');
const prisma = new PrismaClient();
const express = require("express");
const qr = require("qrcode");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendQRCode = require("../utils/mailer"); 
const authenticateUser = require("../middleware/auth"); 
app.use(express.json());

const adminRoutes = require("./admin");
const registrationRoutes = require("./registration");
app.use("/", adminRoutes);
app.use("/", registrationRoutes);

async function getUsers() {
    return await prisma.user.findMany();
}

app.get("/qrgen/:userId/:eventId", authenticateUser, async (req, res) => {
    const { userId, eventId } = req.params;

    if (parseInt(userId) !== req.user.id) {
        return res.status(403).json({ message: "You can only generate QR for yourself" });
    }
    try {
        const registration = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                events: {
                    where: { eventid: parseInt(eventId) }
                }
            }
        });
        if (!registration || registration.events.length === 0) {
            return res.status(400).json({ message: "User is not registered for this event" });
        }
        const qrData = JSON.stringify({ userId: parseInt(userId), eventId: parseInt(eventId) });
        const filePath = path.join(__dirname, `qr${userId}_${eventId}.png`);
        qr.toFile(filePath, qrData, async function (err) {
            if (err) {
                return res.status(500).send("QR generation failed");
            }
            await sendQRCode(req.user.email, filePath);
            res.status(200).send("QR code sent to email");
        });

    } catch (err) {
        res.status(500).send("Failed to generate QR");
    }
});



app.post("/checkin", async (req, res) => {
    const { userId, eventId } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const event = await prisma.events.findUnique({ where: { eventid: eventId } });

        if (!user || !event) {
            console.log("User or Event not found");
            return res.status(404).send("Invalid User or Event");
        }

        const alreadyCheckedIn = await prisma.checkIn.findFirst({
            where: { userId: user.id, eventId }
        });

        if (alreadyCheckedIn) {
            console.log("User already checked in");
            return res.status(400).send("User already checked in");
        }

        const checkIn = await prisma.checkIn.create({
            data: {
                userId: user.id,
                eventId: event.eventid,
            }
        });

        res.status(200).json({ message: "Checked in successfully", checkIn });
    } catch (error) {
        console.error("Check-in error:", error);
        res.status(500).send("Check-in failed");
    }
});


app.listen(5000, () => {
    console.log("Server is listening on port 5000");
});
