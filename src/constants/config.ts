import argv from 'minimist';
import { config } from 'dotenv';

config();

const option = argv(process.argv.slice(2));

export const isProduction = Boolean(option.production);

export const envConfig = {
  REGION_AWS: process.env.AWS_REGION as string,
  SECRET_ACCESS_KEY_AWS: process.env.AWS_SECRET_ACCESS_KEY as string,
  ACCESS_KEY_ID_AWS: process.env.AWS_ACCESS_KEY_ID as string,
  SES_FROM_ADDRESS_AWS: process.env.SES_FROM_ADDRESS as string,
  PORT: (process.env.PORT as string) || 4000,
  CLIENT_REDIRECT_CALLBACK: process.env.CLIENT_REDIRECT_CALLBACK as string,
  JWT_SECRET_FORGOT_PASSWORD_TOKEN: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  JWT_SECRET_EMAIL_VERIFY_TOKEN: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
  DB_USERNAME: process.env.DB_USERNAME as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_COLLECTION_USERS: process.env.DB_COLLECTION_USERS as string,
  DB_COLLECTION_REFRESH_TOKEN: process.env.DB_COLLECTION_REFRESH_TOKEN as string,
  DB_COLLECTION_FOLLOWERS: process.env.DB_COLLECTION_FOLLOWERS as string,
  DB_COLLECTION_TWEETS: process.env.DB_COLLECTION_TWEETS as string,
  DB_COLLECTION_HASHTAGS: process.env.DB_COLLECTION_HASHTAGS as string,
  DB_COLLECTION_BOOKMARKS: process.env.DB_COLLECTION_BOOKMARKS as string,
  DB_COLLECTION_CONVERSATIONS: process.env.DB_COLLECTION_CONVERSATIONS as string,
  DB_URI: process.env.DB_URI as string,
  DB_NAME: process.env.DB_NAME as string,
  PASSWORD_SECRET: process.env.PASSWORD_SECRET as string,
  CLIENT_URL: process.env.CLIENT_URL as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string
};
