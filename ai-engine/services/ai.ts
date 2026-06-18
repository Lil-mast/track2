import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Sanitizes input data to prevent prompt injection.
 * Removes common injection keywords and wraps in XML tags.
 */
export const sanitizeForAI = (data: any): string => {
  const jsonString = JSON.stringify(data);
  // Basic sanitization: remove common prompt injection sequences
  const sanitized = jsonString
    .replace(/ignore all previous instructions/gi, "[REDACTED]")
    .replace(/system:/gi, "[REDACTED]")
    .replace(/user:/gi, "[REDACTED]")
    .replace(/assistant:/gi, "[REDACTED]");
  
  return `<data>${sanitized}</data>`;
};

export const invokeNova = async (
  systemPrompt: string,
  userPrompt: string,
  modelId: string = "amazon.nova-pro-v1:0"
): Promise<string> => {
  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [{ text: userPrompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 2000,
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // AWS Nova returns content in content[0].text
    return responseBody.output.message.content[0].text;
  } catch (error: any) {
    console.error("Bedrock invocation error:", error);
    
    // Fallback logic 
    if (modelId === "amazon.nova-pro-v1:0" && (error.name === "ThrottlingException" || error.name === "ServiceUnavailableException")) {
      console.log("Falling back to Nova Lite...");
      return invokeNova(systemPrompt, userPrompt, "amazon.nova-lite-v1:0");
    }
    
    throw error;
  }
};
