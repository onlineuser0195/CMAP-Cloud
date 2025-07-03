import { USER_ROLES } from "../constants/constants.js";
import UserSchema from "../models/user.js";
import EmailService from "./emailService.js";
import emailTemplate from "./emailTemplate.js";

export const sendEmail = async (userId, count, date) => {
    console.log(date);
    const embassyUser = await UserSchema.findById(userId);
    if (embassyUser) {
        // const admin = await UserSchema.findOne({ role: USER_ROLES.VIEWER });

        const embassyUserName = `${embassyUser.first_name} ${embassyUser.last_name}`;

        const emailService = EmailService();
        const mailOptions = {
            from: process.env.OUTLOOK_EMAIL,
            to: 'aacharya@syneren.com',
            subject: 'Foreign Visit Requests Alert',
            html: emailTemplate("Avash", embassyUserName, embassyUser.email, date, count)
        };
        await emailService.sendMail(mailOptions);
    }
};
