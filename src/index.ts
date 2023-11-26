import express from 'express';
import userRouter from '~/routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import mediaRoute from './routes/media.routes';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR, UPLOAD_TEMP_DIR } from './constants/dir';
import { config } from 'dotenv';
import staticRoute from './routes/static.routes';

config();

const app = express();
const port = process.env.PORT || 4000;

// Connect to database service
databaseService.connect().catch(console.dir);

// Public folder
// app.use('/static', express.static(UPLOAD_DIR));

// Create folder upload if not exist
const uploadDirTemp = path.resolve(UPLOAD_TEMP_DIR);
if (!fs.existsSync(uploadDirTemp)) {
  fs.mkdirSync(uploadDirTemp, { recursive: true });
}
const uploadDir = path.resolve(UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Parse data to json
app.use(express.json());

// Define routes
app.use('/users', userRouter);
app.use('/media', mediaRoute);
app.use('/static', staticRoute);

// Error handler
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
