import express from "express";
import { validateLogin, validateToken, validateUser, authenticateToken } from "../controllers/loginController.js";
// import passport from 'passport';
import { verifyMicrosoftToken, debugToken } from '../middleware/authMiddleware.js';

const loginRoutes = express.Router();


loginRoutes.post("", validateLogin);


loginRoutes.post("/validate-token", validateToken);


loginRoutes.post('/validate-user', validateUser);


loginRoutes.post('/microsoft', verifyMicrosoftToken, authenticateToken);


export default loginRoutes;
