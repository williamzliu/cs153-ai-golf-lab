import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { embed } from "@/lib/embed";
import { retrieveTopK } from "@/lib/retrieval";
import { buildSystemPrompt, PlayerProfile } from "@/lib/prompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  profile: PlayerProfile;
  history: ChatMessage[];
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, profile, history } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  let retrieved: ReturnType<typeof retrieveTopK>;
  let systemPrompt: string;
  try {
    const queryEmbedding = await embed(message);
    retrieved = retrieveTopK(queryEmbedding, 5);
    systemPrompt = buildSystemPrompt(profile, retrieved);
  } catch (err) {
    console.error("/api/chat setup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "sources", retrieved }) + "\n")
        );

        const llmStream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        for await (const event of llmStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", delta: event.delta.text }) + "\n"
              )
            );
          }
        }
      } catch (err) {
        console.error("/api/chat stream error:", err);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", message: "Stream error" }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
