import express, { Request, Response } from "express";
import TYPES from "../../config/types"; 
import container from "../../config/inversify.config"; 
import AdminController from "../controllers/admin.controller"; 
import { authenticateToken } from "../../middleware/auth.middleware";
import isAdmin from "../../middleware/admin.middleware";

const router = express.Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

// ADMIN LOGIN
router.post("/login", async (req: Request, res: Response) => {
    await adminController.login(req, res);
});

// GET ALL USERS
router.get("/users", authenticateToken, isAdmin(), async (req: Request, res: Response) => {
    await adminController.getUsers(req, res);
});

//TOGGLE_BAN-USER
router.patch("/toggle-ban/:id", authenticateToken, isAdmin(), async (req: Request, res: Response) => {
    await adminController.toggleBan(req, res);
})

export default router;