import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import imageRoutes from "./routes/images";
import syncRoutes from "./routes/sync";

dotenv.config();

const app = express();

// Increase JSON body size limit to 50MB for base64 image uploads
app.use(express.json({ limit: "50mb" }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/sync", syncRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    const MONGODB_URI = process.env.MONGODB_URI || "";

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
