import { query } from "./services/db.js";
import { invokeNova } from "./services/ai.js";
import dotenv from "dotenv";

dotenv.config();

async function verify() {
  console.log("--- Starting Connection Verification ---");

  // Debug: Show found environment variables (keys only)
  console.log("\nChecking Environment Variables in .env:");
  const requiredKeys = [
    "AWS_REGION", 
    "AWS_ACCESS_KEY_ID", 
    "AWS_SECRET_ACCESS_KEY", 
    "AWS_SESSION_TOKEN",
    "AURORA_CLUSTER_ARN", 
    "AURORA_SECRET_ARN", 
    "AURORA_DATABASE"
  ];
  
  requiredKeys.forEach(key => {
    const status = process.env[key] ? "✅ Found" : "❌ Missing";
    console.log(`${key}: ${status}`);
  });

  // 1. Test Database
  console.log("\n1. Testing Database Connection...");
  try {
    const res = await query("SELECT NOW() as current_time");
    console.log("✅ Database Connected! Current Time:", res.rows[0].current_time);
    
    const userCount = await query("SELECT COUNT(*) FROM users");
    console.log(`📊 Database has ${userCount.rows[0].count} users.`);
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
  }

  // 2. Test AI (AWS Bedrock)
  console.log("\n2. Testing AWS Bedrock (AI Engine)...");
  try {
    const systemPrompt = "Respond with 'Connected'";
    const userPrompt = "Hello";
    const aiResponse = await invokeNova(systemPrompt, userPrompt);
    console.log("✅ AI Engine Connected! Response:", aiResponse.trim());
  } catch (err) {
    console.error("❌ AI Engine Connection Failed:", err.message);
    console.log("Tip: If keys are present, ensure they have the 'AmazonBedrockFullAccess' and 'AmazonRDSDataFullAccess' policies.");
  }

  console.log("\n--- Verification Complete ---");
  process.exit(0);
}

verify();
