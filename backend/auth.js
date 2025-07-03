import jwt from 'jsonwebtoken';

export const getJwtAuthToken = async (obj) => {
    const token = jwt.sign(
        obj,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return token;
}

export const isValidToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return false;
    }
}

export const authenticateRequest = async (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: "Authentication Failed" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid Token" });
        }
        req.user = user;
        next();
    });
}