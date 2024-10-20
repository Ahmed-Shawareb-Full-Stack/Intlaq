import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import profileRoutes from './routes/profileRoutes';
import applicationRoutes from './routes/applicationRoutes';
import locationRoutes from './routes/locationRoutes';
import userRoutes from './routes/userRoutes';
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
