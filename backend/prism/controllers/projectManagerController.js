import UserSchema from "../../models/user.js";
export const getGovernmentLeads = async (req, res) => {
    try {
        const users = await UserSchema.find(
            { role: { $in: ['Government Lead'] } }, // Filter condition
            { password_hash: 0 } // Exclude the password field
        );
    
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        logError('getGovernmentLeads', error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};