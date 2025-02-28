import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db';
import userRouter from './routes/user.route';

dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({origin: 'http://localhost:3001', credentials: true}));


//All Routes
//User Route
app.use('/api/user', userRouter);

//DB Connection
connectDB();

export default app;
