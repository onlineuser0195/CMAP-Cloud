import { getJwtAuthToken, isValidToken } from "../auth.js";
import bcrypt from 'bcrypt';
import { logError } from "../helper/logger.js";
import UserSchema from "../models/user.js";

export const validateLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user = await UserSchema.findOne({
            email: email,
            role: role,
        });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (isMatch) {
                // Authentication successful
                const token = await getJwtAuthToken({
                    user_id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                });

                return res.status(200).json({ authenticated: true, user_id: user._id, first_name: user.first_name, last_name: user.last_name, email: user.email, token });
            }
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

// Added for Microsoft Authentication

export const validateUser = async (req, res) => {
  const { email, role, system } = req.body;

  // Query your DB for the user
    const user = await UserSchema.findOne({
        email: email,
        role: role,
        system_id: system
    }).collation({ locale: 'en', strength: 2 });

  if (!user) {
    console.log('NO EMAIL IN DB')
    return res.status(401).json({ error: "User is not registered. Please contact Admin." });
  }

    // console.log('USER EXISTS')
  return res.status(200).json({ message: "User valid", role: user.role });
};

export const authenticateToken = async (req, res) => {
    try {
      
        // console.log('Inside authenticateToken');
        // console.log('Full request user object:', JSON.stringify(req.user, null, 2));
        
        const token = req.user;
        
        // Azure AD tokens can have email in different fields
        const email = token.email || token.upn || token.unique_name || token.preferred_username;

        const { role, system } = req.body;
        
        // console.log('Extracted email:', email);
        // console.log('Token aud:', token.aud);
        // console.log('Token iss:', token.iss);
        // console.log('Token scope:', token.scp);

        if (!email) {
            console.error('Email not found in token. Available fields:', Object.keys(token));
            return res.status(400).json({ error: "Invalid token: email not found." });
        }

        const user = await UserSchema.findOne({ email, role, system_id: system });

        if (!user) {
            console.error(`User with email ${email} not found in database`);
            return res.status(403).json({ error: "User not registered in database." });
        }

        // console.log('User found:', user.email);

        res.json({
            userId: user._id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            system: user.system_id
        });

    } catch (err) {
        console.error("Microsoft login error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};