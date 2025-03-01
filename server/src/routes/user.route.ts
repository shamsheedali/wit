import express, {Request, Response} from 'express';
import userController from '../controllers/user.controller';

const router = express.Router();

//Create a User
router.post('/register', async(req: Request, res: Response) => {
    await userController.registerUser(req, res);
});

//User login 
router.post('/login', async(req: Request, res: Response) => {
    await userController.login(req, res);
})


export default router;
