'use client';

import { useCallback, useEffect, useRef, useState } from "react";
// import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, Separator, Text, TextArea } from "@radix-ui/themes";
import type { ChatMessagePayload } from "@/lib/chat/types";

type ChatPanelProps = {
  agentName: string;
  intro: string;
  chatWithAgent: (messages: ChatMessagePayload[]) => Promise<{ reply: string }>;
};

type DisplayMessage = ChatMessagePayload & {
  id: string;
  localOnly?: boolean;
};

const createMessage = (
  role: ChatMessagePayload["role"],
  content: string,
  extra: Partial<DisplayMessage> = {},
): DisplayMessage => {
  const fallbackId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackId;

  return {
    id,
    role,
    content,
    ...extra,
  };
};

export default function ChatPanel({ agentName, intro, chatWithAgent }: ChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: "intro", role: "assistant", content: intro, localOnly: true },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const payloadFromMessages = useCallback(
    (history: DisplayMessage[]): ChatMessagePayload[] =>
      history.filter((msg) => !msg.localOnly).map(({ role, content }) => ({ role, content })),
    [],
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const optimisticMessages = [...messages, createMessage("user", trimmed)];
    setMessages(optimisticMessages);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const response = await chatWithAgent(payloadFromMessages(optimisticMessages));
      const replyText = response.reply.trim();
      setMessages((current) => [...current, createMessage("assistant", replyText || "…")]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong talking to the agent. Please try again.");
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "I ran into an issue getting that info. Please try asking again.",
          { localOnly: true },
        ),
      ]);
    } finally {
      setPending(false);
    }
  }, [chatWithAgent, input, messages, payloadFromMessages, pending]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage();
    },
    [sendMessage],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <Card
      variant="surface"
      size="4"
      style={{
        width: "100%",
        maxWidth: 720,
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <Box>
        <Heading size="5" mb="1">
          {agentName}
        </Heading>
        <Text color="gray" size="3">
          Ask me anything about legendary guitar tones, gear pairings, and artist rigs.
        </Text>
      </Box>
      <Separator size="4" />
      <Box
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "var(--radius-4)",
          backgroundColor: "var(--gray-2)",
          padding: "var(--space-4)",
        }}
      >
        <Flex direction="column" gap="3">
          {messages.map((message) => (
            <Flex
              key={message.id}
              justify={message.role === "user" ? "end" : "start"}
              align="start"
            >
              <Box
                style={{
                  maxWidth: "80%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-4)",
                  backgroundColor:
                    message.role === "user" ? "var(--accent-9)" : "var(--color-panel)",
                  color: message.role === "user" ? "white" : "var(--gray-12)",
                  boxShadow: "var(--shadow-2)",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Text size="3">{message.content}</Text>
              </Box>
            </Flex>
          ))}
          {pending && (
            <Text size="2" color="gray">
              {agentName} is dialing in a reply…
            </Text>
          )}
        </Flex>
      </Box>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <TextArea
            ref={textAreaRef}
            value={input}
            placeholder="Ask about solos, signal chains, or specific performances…"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={pending}
            variant="soft"
            rows={4}
          />
          <Flex align="center" gap="3">
            <Button type="submit" disabled={pending || input.trim().length === 0} aria-busy={pending}>
              {/* <PaperPlaneIcon /> */}
              Send 
            </Button>
            {error && (
              <Text size="2" color="red">
                {error}
              </Text>
            )}
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
