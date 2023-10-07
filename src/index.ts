import express, { Request, Response, NextFunction } from 'express';
import userRouter from '~/routes/users.routes';
import databaseService from '~/services/database.services';

const app = express();
const port = 4000;

// Parse data to json
app.use(express.json());

// Define routes
app.use('/users', userRouter);

// Connect to database service
databaseService.connect().catch(console.dir);

// Handle Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('Error:', err.message);
  res.status(400).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
