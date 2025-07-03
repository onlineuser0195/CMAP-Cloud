import nodemailer from "nodemailer";

const EmailService = () => {
    return nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.OUTLOOK_EMAIL,
            pass: process.env.OUTLOOK_EMAIL_PWD,
        },
    });
}

export default EmailService;
