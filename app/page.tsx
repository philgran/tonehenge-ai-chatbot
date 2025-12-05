import { Agent, RunMessageOutputItem, assistant as assistantMessage, run, user } from "@openai/agents";
import { Theme, Flex } from "@radix-ui/themes";
import ChatPanel from "@/components/chat-panel";
import type { ChatMessagePayload } from "@/lib/chat/types";

const agent = new Agent({
  name: "Gearhead",
  instructions:
    "You are a gear guru who can explain what guitars, amps, pedals, and signal chain decisions shaped iconic guitar solos and parts from studio recordings and live performances.",
  model: "gpt-5-nano",
});

const AGENT_INTRO =
  "Hey there! I’m Gearhead. Ask me about the exact guitars, amps, pedals, and studio tricks that shaped any legendary guitar performance—I'll break down the rig so you can chase the tone.";

async function chatWithGearhead(messages: ChatMessagePayload[]) {
  "use server";

  const conversation = messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => (message.role === "user" ? user(message.content) : assistantMessage(message.content)));

  if (conversation.length === 0) {
    throw new Error("Please send a question before chatting with the agent.");
  }

  const result = await run(agent, conversation);
  let reply = "";

  if (typeof result.finalOutput === "string") {
    reply = result.finalOutput;
  } else if (
    result.finalOutput &&
    typeof result.finalOutput === "object" &&
    "content" in result.finalOutput &&
    typeof (result.finalOutput as { content?: string }).content === "string"
  ) {
    reply = (result.finalOutput as { content?: string }).content ?? "";
  }

  if (!reply) {
    const lastMessage = [...result.newItems]
      .reverse()
      .find((item) => item instanceof RunMessageOutputItem) as RunMessageOutputItem | undefined;
    reply = lastMessage?.content ?? "";
  }

  if (!reply.trim()) {
    throw new Error("The agent returned an empty response.");
  }

  return { reply: reply.trim() };
}

export default function Home() {
  return (
    <Theme accentColor="violet" grayColor="sand" radius="large" scaling="95%">
      <Flex
        align="center"
        justify="center"
        style={{
          minHeight: "100vh",
          padding: "var(--space-7)",
          background:
            "radial-gradient(circle at top, rgba(124,58,237,0.15), transparent 55%), var(--gray-2)",
        }}
      >
        <ChatPanel agentName="Gearhead" intro={AGENT_INTRO} chatWithAgent={chatWithGearhead} />
      </Flex>
    </Theme>
  );
}
