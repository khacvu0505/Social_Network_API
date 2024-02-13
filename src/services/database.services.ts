import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Bookmark from '~/models/schemas/Bookmark.schema';
import Conversation from '~/models/schemas/Conversation.schema';

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

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_COLLECTION_TWEETS as string);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_COLLECTION_HASHTAGS as string);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.DB_COLLECTION_BOOKMARKS as string);
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(process.env.DB_COLLECTION_CONVERSATIONS as string);
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

  async indexTweet() {
    const exists = await this.tweets.indexExists(['content_text']);
    if (!exists) {
      this.tweets.createIndex(
        { content: 'text' },
        // Chỗ này là cho phép mongodb tìm những từ trong list stopword của mongodb. Ex: who, a, an, and, are, as, at, for, from, has, have, he, in, is, it, its, of, on, or, that, the, to, was, were, with
        // Nếu mình k làm vậy thì mongodb sẽ bỏ qua những từ này, dù cho có trong db thì cũng sẽ tìm không thấy và không trả về kq
        { default_language: 'none' }
      );
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
