import express from 'express';
import userRouter from '~/routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import mediaRoute from './routes/media.routes';
import path from 'path';
import fs from 'fs';
import staticRoute from './routes/static.routes';
import { initFolder } from './utils/files';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir';
import tweetRouter from './routes/tweets.routes';
import bookmarkRouter from './routes/bookmarks.routes';
import searchRouter from './routes/search.routes';
import cors from 'cors';
// import '~/utils/s3';
import { createServer } from 'http';
import conversationRouter from './routes/conversations.routes';
import { initSocket } from './utils/socket';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
// Run fetch fake data
// import '~/utils/fake';

// Swagger
import swaggerJSDoc from 'swagger-jsdoc';

import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { envConfig, isProduction } from './constants/config';
const fileSwagger = fs.readFileSync(path.resolve('swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(fileSwagger);

const options: swaggerJSDoc.Options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Network API',
      version: '1.0.0'
    }
  },
  apis: ['./src/openapi/*.yaml']
  // apis: ['./src/routes/*.routes.ts', './src/models/requests/*.requests.ts']
};
const openapiSpecification = swaggerJSDoc(options);

const app = express();
const port = envConfig.PORT;

const httpServer = createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// Use Helmet!
app.use(helmet());

// Use cors
app.use(
  cors({
    origin: isProduction ? envConfig.CLIENT_URL : '*'
  })
);

// Connect to database service
databaseService
  .connect()
  .then(() => {
    // Call function create index collection after connect to database
    databaseService.indexUser();
    databaseService.indexRefreshToken();
    databaseService.indexFollower();
    databaseService.indexTweet();
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
app.use('/search', searchRouter);
app.use('/bookmarks', bookmarkRouter);

app.use('/static/video', express.static(UPLOAD_VIDEO_DIR));
app.use('/conversations', conversationRouter);

// Option 1: Chỗ này là dùng swagger-ui-express để viết document cho toàn bộ api trong duy nhất 1 file (.json or .yaml)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

//Option 2: Chỗ này là dùng swagger-jsdoc của viết document cho mỗi route
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Init socket
initSocket(httpServer);

// Error handler
app.use(defaultErrorHandler);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
