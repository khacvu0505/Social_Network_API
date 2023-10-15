import express from 'express';
import userRouter from '~/routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';

const app = express();
const port = 4000;

// Connect to database service
databaseService.connect().catch(console.dir);

// Parse data to json
app.use(express.json());

// Define routes
app.use('/users', userRouter);

// Error handler
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
