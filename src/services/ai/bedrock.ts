import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { awsConfig } from "@/config/aws";

const MAX_INPUT_LENGTH = 50000;

const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts|context)/gi,
    label: "INSTRUCTION_OVERRIDE",
  },
  {
    pattern:
      /disregard\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi,
    label: "INSTRUCTION_OVERRIDE",
  },
  {
    pattern:
      /forget\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi,
    label: "INSTRUCTION_OVERRIDE",
  },
  {
    pattern:
      /override\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi,
    label: "INSTRUCTION_OVERRIDE",
  },
  { pattern: /you\s+are\s+now\s+(a|an|the|my)\b/gi, label: "ROLE_HIJACK" },
  { pattern: /act\s+as\s+(a|an|if|though)\b/gi, label: "ROLE_HIJACK" },
  { pattern: /pretend\s+(you\s+are|to\s+be|you're)\b/gi, label: "ROLE_HIJACK" },
  {
    pattern: /switch\s+to\s+(a\s+)?new\s+(role|persona|mode|character)/gi,
    label: "ROLE_HIJACK",
  },
  {
    pattern: /enter\s+(developer|admin|root|sudo|god|debug|jailbreak|dan)\s*mode/gi,
    label: "MODE_SWITCH",
  },
  { pattern: /\bDAN\b.*\bdo\s+anything\s+now\b/gi, label: "DAN_JAILBREAK" },
  { pattern: /do\s+anything\s+now/gi, label: "DAN_JAILBREAK" },
  { pattern: /system\s*:/gi, label: "ROLE_TAG" },
  { pattern: /user\s*:/gi, label: "ROLE_TAG" },
  { pattern: /assistant\s*:/gi, label: "ROLE_TAG" },
  { pattern: /\[INST\]/gi, label: "DELIMITER" },
  { pattern: /\[\/INST\]/gi, label: "DELIMITER" },
  { pattern: /<<\s*SYS\s*>>/gi, label: "DELIMITER" },
  { pattern: /<<\s*\/SYS\s*>>/gi, label: "DELIMITER" },
  { pattern: /<\|im_start\|>/gi, label: "DELIMITER" },
  { pattern: /<\|im_end\|>/gi, label: "DELIMITER" },
  { pattern: /<\|endoftext\|>/gi, label: "DELIMITER" },
  { pattern: /BEGIN\s+(SYSTEM|INSTRUCTIONS?|PROMPT)/gi, label: "DELIMITER" },
  { pattern: /END\s+(SYSTEM|INSTRUCTIONS?|PROMPT)/gi, label: "DELIMITER" },
  {
    pattern: /reveal\s+(your|the|system|hidden)\s*(prompt|instructions|rules|context)/gi,
    label: "EXFILTRATION",
  },
  {
    pattern:
      /show\s+(me\s+)?(your|the|system|hidden)\s*(prompt|instructions|rules|context)/gi,
    label: "EXFILTRATION",
  },
  {
    pattern:
      /what\s+(are|is|were)\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi,
    label: "EXFILTRATION",
  },
  {
    pattern: /repeat\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi,
    label: "EXFILTRATION",
  },
  {
    pattern: /output\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi,
    label: "EXFILTRATION",
  },
  {
    pattern: /print\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi,
    label: "EXFILTRATION",
  },
  { pattern: /base64\s*(encode|decode|encoded|decoded)/gi, label: "ENCODING_TRICK" },
  { pattern: /rot13/gi, label: "ENCODING_TRICK" },
  { pattern: /hex\s*(encode|decode|encoded|decoded)/gi, label: "ENCODING_TRICK" },
  {
    pattern: /translate\s+from\s+(base64|hex|binary|rot13)/gi,
    label: "ENCODING_TRICK",
  },
  { pattern: /\bprompt\s*injection\b/gi, label: "SUSPICIOUS_TERM" },
  { pattern: /\bjailbreak\b/gi, label: "SUSPICIOUS_TERM" },
];

function buildBedrockClient(): BedrockRuntimeClient {
  const region = awsConfig.bedrock.region;
  const roleArn = process.env.AWS_ROLE_ARN;

  if (roleArn) {
    return new BedrockRuntimeClient({
      region,
      credentials: awsCredentialsProvider({ roleArn }),
    });
  }

  return new BedrockRuntimeClient({ region });
}

let cachedClient: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!cachedClient) {
    cachedClient = buildBedrockClient();
  }
  return cachedClient;
}

function stripDangerousUnicode(text: string): string {
  return text
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[\u2060\u2061\u2062\u2063\u2064]/g, "");
}

export function sanitizeForAI(data: unknown): string {
  let jsonString = JSON.stringify(data);

  if (jsonString.length > MAX_INPUT_LENGTH) {
    console.warn(
      `sanitizeForAI: Input truncated from ${jsonString.length} to ${MAX_INPUT_LENGTH} chars`
    );
    jsonString = jsonString.slice(0, MAX_INPUT_LENGTH);
  }

  jsonString = stripDangerousUnicode(jsonString);

  for (const { pattern, label } of INJECTION_PATTERNS) {
    jsonString = jsonString.replace(pattern, `[REDACTED:${label}]`);
  }

  return `<data>${jsonString}</data>`;
}

export async function invokeNova(
  systemPrompt: string,
  userPrompt: string,
  modelId = awsConfig.bedrock.modelId
): Promise<string> {
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

    const response = await getClient().send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    ) as {
      output: { message: { content: { text: string }[] } };
    };

    return responseBody.output.message.content[0].text;
  } catch (error) {
    console.error("Bedrock invocation error:", error);

    const err = error as { name?: string };
    if (
      modelId === "amazon.nova-pro-v1:0" &&
      (err.name === "ThrottlingException" ||
        err.name === "ServiceUnavailableException")
    ) {
      console.log("Falling back to Nova Lite...");
      return invokeNova(systemPrompt, userPrompt, "amazon.nova-lite-v1:0");
    }

    throw error;
  }
}
