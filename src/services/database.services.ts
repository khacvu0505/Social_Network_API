import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';

dotenv.config();
// dotenv.config({ path: "./config.env" });

const uri = process.env.DB_URI?.replace('<username>', process.env.DB_USERNAME as string).replace(
  '<password>',
  process.env.DB_PASSWORD as string
);

class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri as string);
    this.db = this.client.db(process.env.DB_NAME);
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
      // Ensures that the client will close when you finish/error
      await this.client.close();
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_COLLECTION_USERS as string);
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_COLLECTION_REFRESH_TOKEN as string);
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_COLLECTION_FOLLOWERS as string);
  }

  // Create indexes for some fields to improve query performance of collection USERS
  async indexUser() {
    const exists = await this.users.indexExists(['username_1_password_1', 'email_1', 'username_1']);
    if (exists) return;

    this.users.createIndex({ username: 1, password: 1 }, { unique: true });
    this.users.createIndex({ email: 1 }, { unique: true });
    this.users.createIndex({ username: 1 }, { unique: true });
  }

  // Create indexes for some fields to improve query performance of collection REFRESH_TOKENS
  async indexRefreshToken() {
    const exists = await this.refreshTokens.indexExists(['exp_1', 'token_1']);
    if (exists) return;

    this.refreshTokens.createIndex({ token: 1 }, { unique: true });

    // Chỗ này là background_task của mongodb dựa vào field exp để xóa data
    this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
  }

  // Create indexes for some fields to improve query performance of collection USERS
  async indexFollower() {
    const exists = await this.followers.indexExists(['followed_user_id_1_user_id_1']);
    if (exists) return;

    this.followers.createIndex({ followed_user_id: 1, user_id: 1 }, { unique: true });
  }
}

const databaseService = new DatabaseService();
export default databaseService;
