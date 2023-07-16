import express from "express";
import userRouter from "~/routes/users.routes";
import databaseService from "~/services/database.services";

const app = express();
const port = 4000;

// Parse data to json
app.use(express.json());

// Define routes
app.use("/users", userRouter);

// Connect to database service
databaseService.connect().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
