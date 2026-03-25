import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectToDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  registerConnectionLogging();

  const connection = await mongoose.connect(env.mongodbUri);
  const { host, name } = connection.connection;

  console.log(`MongoDB connected: ${host}/${name}`);
}

let hasRegisteredConnectionLogging = false;

function registerConnectionLogging(): void {
  if (hasRegisteredConnectionLogging) {
    return;
  }

  hasRegisteredConnectionLogging = true;

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    const { host, name } = mongoose.connection;
    console.log(`MongoDB reconnected: ${host}/${name}`);
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error.", error);
  });
}
