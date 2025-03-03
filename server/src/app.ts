import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import userRouter from './routes/user.route';
import adminRouter from './routes/admin.route';

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

//All Routes
//USER-ROUTE
app.use('/api/user', userRouter);
//ADMIN-ROUTE
app.use('/api/admin', adminRouter);

//DB Connection
connectDB();

export default app;
