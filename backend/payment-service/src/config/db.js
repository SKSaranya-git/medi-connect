import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const initDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);
  console.log("Payment Service connected to MongoDB");
};

export default mongoose;
