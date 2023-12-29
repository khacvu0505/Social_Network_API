import express from 'express';
import userRouter from '~/routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import mediaRoute from './routes/media.routes';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';
import staticRoute from './routes/static.routes';
import { initFolder } from './utils/files';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir';
import tweetRouter from './routes/tweets.routes';
import bookmarkRouter from './routes/bookmarks.routes';

config();

const app = express();
const port = process.env.PORT || 4000;

// Connect to database service
databaseService
  .connect()
  .then(() => {
    // Call function create index collection after connect to database
    databaseService.indexUser();
    databaseService.indexRefreshToken();
    databaseService.indexFollower();
  })
  .catch(console.dir);

// Public folder
// app.use('/static', express.static(UPLOAD_IMAGE_DIR));

// Create folder upload if not exist
initFolder();

// Parse data to json
app.use(express.json());

// Define routes
app.use('/users', userRouter);
app.use('/media', mediaRoute);
app.use('/static', staticRoute);
app.use('/tweets', tweetRouter);
app.use('/bookmarks', bookmarkRouter);

app.use('/static/video', express.static(UPLOAD_VIDEO_DIR));

// Error handler
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
