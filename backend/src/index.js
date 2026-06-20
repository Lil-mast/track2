import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { generateStrategy } from "./handlers/generate-strategy.js";
import { calculateRiskScore } from "./handlers/risk-score.js";
import { getStrategies } from "./handlers/get-strategies.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.post("/api/ai/generate-strategy", generateStrategy);
app.post("/api/ai/risk-score", calculateRiskScore);
app.get("/api/ai/strategies/:loanId", getStrategies);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`RecoveryAI Backend running at http://localhost:${port}`);
});
