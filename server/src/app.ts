import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/database';
import userRouter from './app/routes/user.route';
import adminRouter from './app/routes/admin.route';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

morgan.token("body", (req: Request) => JSON.stringify(req.body || {}));
morgan.token("query", (req: Request) => JSON.stringify(req.query || {}));
morgan.token("params", (req: Request) => JSON.stringify(req.params || {}));

app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent "Body: :body" "Query: :query" "Params: :params"'
  )
);

app.use(cors({
  origin: "http://localhost:3000", //frontend
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}));


//All Routes
//USER-ROUTE
app.use('/api/user', userRouter);
//ADMIN-ROUTE
app.use('/api/admin', adminRouter);

//DB Connection
connectDB();

export default app;
