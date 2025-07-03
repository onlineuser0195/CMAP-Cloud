import { getJwtAuthToken } from "../auth.js";
import bcrypt from 'bcrypt';
import { USER_ROLES, FVS_FIELD_MAPPING } from "../constants/constants.js";
import { logError } from "../helper/logger.js";
import UserSchema from "../models/user.js";
import { Dropdown } from "../models/fields.js";

export const addUser = async (req, res) => {
    try {
        const { email, password, role, first_name, last_name, location, system_id  } = req.body;

        // Validate required fields
        if (!email || !password || !role || !first_name || !last_name || !system_id) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if a user with the same email already exists REMOVE AFTER DEMO
        // const existingUser = await UserSchema.findOne({ email });
        // if (existingUser) {
        //     return res.status(400).json({ message: "A user with this email already exists." });
        // }

        // Hash the password before storing it
        const saltRounds = 10; // You can adjust this for security/perf balance
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Build the user object conditionally
        const userData = {
            email,
            password_hash,
            role,
            first_name,
            last_name,
            system_id
        };

        if (role === USER_ROLES.CONFIRMATION_USER) {
            if (!location) {
                return res.status(400).json({ message: "Location is required for Confirmation Users." });
            }
            userData.location = location;
        }

        // Create and save the user
        const newUser = new UserSchema(userData);
        
        // Save the user to the database
        await newUser.save();

        const userResponse = {
            _id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            system_id: newUser.system_id
        };

        // Return success response
        return res.status(201).json({ message: "User created successfully.", user: userResponse });
    } catch (error) {
        logError('addUser', error);
        return res.status(500).json({ message: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        // const users = await UserSchema.find(
        //     // { role: { $in: [USER_ROLES.APP_USER, USER_ROLES.SUPERVISOR, USER_ROLES.CONFIRMATION_USER, USER_ROLES.LOCAL_ADMIN] } }, // Filter condition
        //     { password_hash: 0 } // Exclude the password field
        // );
        const users = await UserSchema.find({}, { password_hash: 0 });

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        logError('getUsers', error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const deletedUser = await UserSchema.findByIdAndDelete(id);

        // Check if the user was found and deleted
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        logError('deleteUser', error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id);
        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
 
        const user = await UserSchema.findById(id, { password_hash: 0, __v: 0 });
 
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
 
        return res.status(200).json({ success: true, user });
    } catch (error) {
        logError('getUser', error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};
 
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, password, role, location, system_id} = req.body;
 
        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
 
        const existingUser = await UserSchema.findById(id);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
 
        const updateData = {};
 
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (email) {
            // Check if new email is already taken by another user
            const emailExists = await UserSchema.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: "Email already in use" });
            }
            updateData.email = email;
        }
        if (password) {
            const saltRounds = 10; // You can adjust this for security/perf balance
            updateData.password = await bcrypt.hash(password, saltRounds);
        }
        if (role) {
            if (!Object.values(USER_ROLES).includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid user role" });
            }
            updateData.role = role;
        }
        if (system_id) {
            updateData.system_id = system_id;
        }
        let finalRole = updateData.role || existingUser.role;
        if (finalRole === USER_ROLES.CONFIRMATION_USER) {
            if (location) {
                updateData.location = location;
            } else if (!existingUser.location) {
                return res.status(400).json({ success: false, message: "Location is required for Confirmation User" });
                }
        } else {
            // Remove location if role is changed away from confirmation_user
            updateData.location = undefined;
        }

 
        const updatedUser = await UserSchema.findByIdAndUpdate(
            id,
            { $set: updateData, $unset: finalRole !== USER_ROLES.CONFIRMATION_USER ? { location: "" } : {} },
            { new: true, runValidators: true }
        ).select({ password_hash: 0, __v: 0 }); // Exclude password from the returned data
 
        if (!updatedUser) {
            return res.status(500).json({ success: false, message: "Failed to update user" });
        }
 
        return res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
 
    } catch (error) {
        logError('updateUser', error);
        res.status(500).json({ success: false, message: "Failed to update user" });
    }
};

export const getSiteLocations = async (req, res) => {
    try {
        const locationField = await Dropdown.findOne({field_id: FVS_FIELD_MAPPING.site});
 
        let locations = [];
 
        if (locationField) {
            locations = locationField.options;
        }
 
        return res.status(200).json(locations);
    } catch (error) {
        logError('getSiteLocations', error);
        res.status(500).json({ success: false, message: "Failed to fetch site locations" });
    }
};

export const changeEmailDemo = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await UserSchema.updateMany(
      {}, 
      { email: email.trim().toLowerCase() }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update emails' });
  }
};
