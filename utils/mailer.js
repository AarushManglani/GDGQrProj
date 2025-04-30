const nodemailer = require('nodemailer');
require('dotenv').config();

const sendQRCode = async (email, filePath) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Event Registration QR generated',
            text: 'Please find attached your QR code for you event attached with this mail. Hope you have a wonderful time at our event!',
            attachments: [
                {
                    filename: `qr_code.png`,
                    path: filePath,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log('QR code sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = sendQRCode;
