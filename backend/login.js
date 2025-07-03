import { getJwtAuthToken, isValidToken } from "../auth.js";
import { logError } from "../helper/logger.js";
import UserSchema from "../models/user.js";

export const validateLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user = await UserSchema.findOne({
            email: email,
            password: password,
            role: role,
        });

        if (user) {
            // Authentication successful
            const token = await getJwtAuthToken({
                user_id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
            });

            return res.status(200).json({ authenticated: true, token });
        }
        return res.status(404).json({ authenticated: false });
    } catch (error) {
        logError('validateLogin', error);
        return res.status(500).json({ authenticated: false });
    }
}

export const validateToken = async (req, res) => {
    try {
        const { token } = req.body;
        const decodedToken = await isValidToken(token);
        if (decodedToken) {
            return res.status(200).json(decodedToken);
        }
        return res.status(401).json({ authenticated: false });
    } catch (error) {
        logError('validateLogin', error);
        return res.status(500).json({ authenticated: false });
    }
}