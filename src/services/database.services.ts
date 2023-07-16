import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
// dotenv.config({ path: "./config.env" });

// const uri =
//   "mongodb+srv://khacvu0505:01699652356vV@twitter.veitxfa.mongodb.net/?retryWrites=true&w=majority";
const uri = process.env.DB_URI?.replace(
  "<USERNAME>",
  process.env.DB_USERNAME as string
).replace("<PASSWORD>", process.env.DB_PASSWORD as string);

class DatabaseService {
  private client: MongoClient;
  constructor() {
    this.client = new MongoClient(uri as string);
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db("admin").command({ ping: 1 });
      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      );
    } finally {
      // Ensures that the client will close when you finish/error
      await this.client.close();
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
