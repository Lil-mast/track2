// Placeholder for AWS Bedrock / Amazon Nova AI recommendations
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

type BedrockClientConfig = ConstructorParameters<typeof BedrockRuntimeClient>[0];

const clientConfig: BedrockClientConfig = {
  region: process.env.BEDROCK_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN
      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
      : {}),
  };
}

const client = new BedrockRuntimeClient(clientConfig);

/** Maximum allowed input length in characters to prevent abuse. */
const MAX_INPUT_LENGTH = 50_000;

interface InjectionPattern {
  pattern: RegExp;
  label: string;
}

/**
 * Patterns known to be used in prompt injection attacks.
 * Each entry has a regex and a label used in the redaction marker.
 */
const INJECTION_PATTERNS: InjectionPattern[] = [
  // --- Role / Identity Hijacking ---
  { pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts|context)/gi, label: "INSTRUCTION_OVERRIDE" },
  { pattern: /disregard\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi, label: "INSTRUCTION_OVERRIDE" },
  { pattern: /forget\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi, label: "INSTRUCTION_OVERRIDE" },
  { pattern: /override\s+(all\s+)?(prior|previous|above|earlier)\s+(instructions|prompts|context|rules)/gi, label: "INSTRUCTION_OVERRIDE" },
  { pattern: /you\s+are\s+now\s+(a|an|the|my)\b/gi, label: "ROLE_HIJACK" },
  { pattern: /act\s+as\s+(a|an|if|though)\b/gi, label: "ROLE_HIJACK" },
  { pattern: /pretend\s+(you\s+are|to\s+be|you're)\b/gi, label: "ROLE_HIJACK" },
  { pattern: /switch\s+to\s+(a\s+)?new\s+(role|persona|mode|character)/gi, label: "ROLE_HIJACK" },
  { pattern: /enter\s+(developer|admin|root|sudo|god|debug|jailbreak|dan)\s*mode/gi, label: "MODE_SWITCH" },
  { pattern: /\bDAN\b.*\bdo\s+anything\s+now\b/gi, label: "DAN_JAILBREAK" },
  { pattern: /do\s+anything\s+now/gi, label: "DAN_JAILBREAK" },

  // --- Delimiter / Structural Injection ---
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

  // --- Data Exfiltration ---
  { pattern: /reveal\s+(your|the|system|hidden)\s*(prompt|instructions|rules|context)/gi, label: "EXFILTRATION" },
  { pattern: /show\s+(me\s+)?(your|the|system|hidden)\s*(prompt|instructions|rules|context)/gi, label: "EXFILTRATION" },
  { pattern: /what\s+(are|is|were)\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi, label: "EXFILTRATION" },
  { pattern: /repeat\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi, label: "EXFILTRATION" },
  { pattern: /output\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi, label: "EXFILTRATION" },
  { pattern: /print\s+(your|the)\s*(system\s*)?(prompt|instructions|rules)/gi, label: "EXFILTRATION" },

  // --- Encoding / Obfuscation Tricks ---
  { pattern: /base64\s*(encode|decode|encoded|decoded)/gi, label: "ENCODING_TRICK" },
  { pattern: /rot13/gi, label: "ENCODING_TRICK" },
  { pattern: /hex\s*(encode|decode|encoded|decoded)/gi, label: "ENCODING_TRICK" },
  { pattern: /translate\s+from\s+(base64|hex|binary|rot13)/gi, label: "ENCODING_TRICK" },

  // --- Instruction Smuggling ---
  { pattern: /\bprompt\s*injection\b/gi, label: "SUSPICIOUS_TERM" },
  { pattern: /\bjailbreak\b/gi, label: "SUSPICIOUS_TERM" },
];

/**
 * Strips potentially dangerous Unicode characters that could be used
 * to visually disguise injection attempts (homoglyphs, zero-width chars, etc.).
 */
const stripDangerousUnicode = (text: string): string => {
  return text
    // Remove zero-width characters
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "")
    // Remove right-to-left / left-to-right override marks
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    // Remove other invisible formatting characters
    .replace(/[\u2060\u2061\u2062\u2063\u2064]/g, "");
};

/**
 * Sanitizes input data to prevent prompt injection.
 */
export const sanitizeForAI = (data: unknown): string => {
  let jsonString = JSON.stringify(data);

  // Layer 1: Length limit
  if (jsonString.length > MAX_INPUT_LENGTH) {
    console.warn(
      `sanitizeForAI: Input truncated from ${jsonString.length} to ${MAX_INPUT_LENGTH} chars`
    );
    jsonString = jsonString.slice(0, MAX_INPUT_LENGTH);
  }

  // Layer 2: Strip dangerous Unicode
  jsonString = stripDangerousUnicode(jsonString);

  // Layer 3: Apply all injection pattern filters
  for (const { pattern, label } of INJECTION_PATTERNS) {
    jsonString = jsonString.replace(pattern, `[REDACTED:${label}]`);
  }

  // Layer 4: Wrap in XML tags to clearly delineate data boundaries
  return `<data>${jsonString}</data>`;
};

// Nova invocation

const NOVA_PRO_MODEL_ID = "amazon.nova-pro-v1:0";
const NOVA_LITE_MODEL_ID = "amazon.nova-lite-v1:0";

interface NovaResponseBody {
  output: {
    message: {
      content: { text: string }[];
    };
  };
}

/**
 * Invokes Amazon Nova on Bedrock with a system + user prompt.
 * Falls back from Nova Pro to Nova Lite on throttling or
 * service-unavailable errors.
 */
export const invokeNova = async (
  systemPrompt: string,
  userPrompt: string,
  modelId: string = NOVA_PRO_MODEL_ID
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
    const responseBody: NovaResponseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    return responseBody.output.message.content[0].text;
  } catch (error) {
    console.error("Bedrock invocation error:", error);

    const errorName = error instanceof Error ? error.name : undefined;
    if (
      modelId === NOVA_PRO_MODEL_ID &&
      (errorName === "ThrottlingException" || errorName === "ServiceUnavailableException")
    ) {
      console.log("Falling back to Nova Lite...");
      return invokeNova(systemPrompt, userPrompt, NOVA_LITE_MODEL_ID);
    }

    throw error;
  }
};