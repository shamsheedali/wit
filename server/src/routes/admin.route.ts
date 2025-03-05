import express, {Request, Response} from 'express';
import adminController from '../controllers/admin.controller';

const router = express.Router();

//ADMIN_LOGIN
router.post("/login", async(req: Request, res: Response) => {
    await adminController.login(req, res);
})

//GET_USERS
router.get("/get-users", async(req: Request, res: Response) => {
    await adminController.getUsers(req, res);
})

export default router;
