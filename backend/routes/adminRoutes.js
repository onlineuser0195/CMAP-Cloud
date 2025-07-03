import express from "express";
import { addUser, deleteUser, getUsers, getUser, updateUser, getSiteLocations, changeEmailDemo } from "../controllers/adminController.js";

const adminRoutes = express.Router();

adminRoutes.post("/add-user", addUser);

adminRoutes.get("/get-users", getUsers);

adminRoutes.delete("/delete-user", deleteUser);

adminRoutes.get("/get-user/:id", getUser);
 
adminRoutes.put("/update-user/:id", updateUser);

adminRoutes.get("/get-locations", getSiteLocations);

adminRoutes.put('/users/email', changeEmailDemo);

export default adminRoutes;
