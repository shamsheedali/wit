import express, { Request, Response } from "express";
import TYPES from "../../config/types";
import container from "../../config/inversify.config";
import UserController from "../controllers/user.controller";

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);

router.post("/register", async (req: Request, res: Response) => {
  await userController.registerUser(req, res);
});

router.post("/login", async (req: Request, res: Response) => {
  await userController.login(req, res);
});

router.post("/google-auth", async (req: Request, res: Response) => {
  await userController.googleUser(req, res);
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  await userController.forgotPassword(req, res);
})

router.post("/reset-password", async (req: Request, res: Response) => {
  await userController.resetPassword(req, res);
})

export default router;