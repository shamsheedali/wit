import express, { Request } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/database';
import userRouter from './app/routes/user.route';
import adminRouter from './app/routes/admin.route';
import friendRouter from './app/routes/friend.route';
import clubRouter from './app/routes/club.route';
import gameRoutes from './app/routes/game.route';
import tournamentRoutes from './app/routes/tournament.route';
import messageRoutes from './app/routes/message.routes';
import gameReportRoutes from './app/routes/gameReport.routes';
import { connectRedis } from './config/redis';
import setupErrorHandling from './middleware/error.middleware';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

morgan.token('body', (req: Request) => JSON.stringify(req.body || {}));
morgan.token('query', (req: Request) => JSON.stringify(req.query || {}));
morgan.token('params', (req: Request) => JSON.stringify(req.params || {}));

// app.use(
//   morgan(
//     ':method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent "Body: :body" "Query: :query" "Params: :params"'
//   )
// );

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

//DB Connection
connectDB();
//Redis Connection
connectRedis();

//All Routes
//USER-ROUTE
app.use('/api/user', userRouter);
//ADMIN-ROUTE
app.use('/api/admin', adminRouter);
//FRIEND-ROUTER
app.use('/api/friend', friendRouter);
//CLUB-ROUTER
app.use('/api/club', clubRouter);
//GAME-ROUTER
app.use('/api/game', gameRoutes);
//TOURNAMENT-ROUTER
app.use('/api/tournament', tournamentRoutes);
//MESSAGE-ROUTER
app.use('/api/message', messageRoutes);
//GAME-REPORT-ROUTER
app.use('/api/game-report', gameReportRoutes);

//Error Handler
setupErrorHandling(app);

export default app;
