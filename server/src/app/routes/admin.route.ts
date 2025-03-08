import express, { Request, Response } from "express";
import TYPES from "../../config/types"; 
import container from "../../config/inversify.config"; 
import AdminController from "../controllers/admin.controller"; 

const router = express.Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

// ADMIN LOGIN
router.post("/login", async (req: Request, res: Response) => {
    await adminController.login(req, res);
});

// GET ALL USERS
router.get("/get-users", async (req: Request, res: Response) => {
    await adminController.getUsers(req, res);
});

export default router;