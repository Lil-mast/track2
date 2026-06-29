import { Suspense } from "react";
import { AiAgentClient } from "@/components/ai-agent/ai-agent-client";

export default function AiAgentPage() {
  return (
    <Suspense>
      <AiAgentClient />
    </Suspense>
  );
}
