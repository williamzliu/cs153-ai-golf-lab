"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { PlayerProfile } from "@/lib/prompt";

interface RetrievedChunk {
  topic: string;
  content_type: string;
  text: string;
  source: string;
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  retrieved?: RetrievedChunk[];
}

interface ChatInterfaceProps {
  profile: PlayerProfile;
  onEditProfile: () => void;
}

export default function ChatInterface({ profile, onEditProfile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openSources, setOpenSources] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function toggleSources(index: number) {
    setOpenSources((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || isStreaming) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setIsStreaming(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, profile, history }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantAdded = false;
      let loadingCleared = false;

      function ensureAssistantMessage(retrieved: RetrievedChunk[]) {
        if (!assistantAdded) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", retrieved },
          ]);
          assistantAdded = true;
        }
      }

      function clearLoading() {
        if (!loadingCleared) {
          setLoading(false);
          loadingCleared = true;
        }
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let parsed: { type: string; retrieved?: RetrievedChunk[]; delta?: string; message?: string };
          try {
            parsed = JSON.parse(line);
          } catch {
            continue;
          }

          if (parsed.type === "sources") {
            ensureAssistantMessage(parsed.retrieved ?? []);
          } else if (parsed.type === "text") {
            ensureAssistantMessage([]);
            clearLoading();
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                content: copy[copy.length - 1].content + (parsed.delta ?? ""),
              };
              return copy;
            });
          } else if (parsed.type === "error") {
            throw new Error(parsed.message ?? "Stream error");
          }
        }
      }
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        },
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const topicLabel: Record<string, string> = {
    swing_mechanics: "Swing",
    short_game: "Short Game",
    putting: "Putting",
    course_management: "Course Mgmt",
    mental_game: "Mental Game",
    practice_structure: "Practice",
    rules: "Rules",
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⛳</span>
          <span className="font-bold text-stone-900 tracking-tight">AI Golf Lab</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-stone-500 hidden sm:block">
            {profile.handicap} hdcp &middot; {profile.currentGoal}
          </span>
          <button
            onClick={onEditProfile}
            className="text-green-800 font-medium hover:text-green-700 transition-colors"
          >
            Edit profile
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center text-stone-400 mt-16 text-sm space-y-2">
            <p className="text-4xl">🏌️</p>
            <p>Ask your coach anything about your game.</p>
            <p className="text-stone-300 text-xs">
              Try: "How do I stop slicing my driver?" or "Give me a 45-minute practice plan."
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] space-y-2`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-green-800 text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm prose prose-sm prose-stone max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2"
                }`}
              >
                {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
              </div>

              {msg.role === "assistant" && msg.retrieved && msg.retrieved.length > 0 && (
                <div className="ml-1">
                  <button
                    onClick={() => toggleSources(i)}
                    className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
                  >
                    <span>{openSources.has(i) ? "▾" : "▸"}</span>
                    <span>
                      {msg.retrieved.length} source{msg.retrieved.length !== 1 ? "s" : ""} retrieved
                    </span>
                  </button>

                  {openSources.has(i) && (
                    <div className="mt-2 space-y-1.5">
                      {msg.retrieved.map((chunk, j) => (
                        <div
                          key={j}
                          className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-600"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-green-800">
                              {topicLabel[chunk.topic] ?? chunk.topic}
                            </span>
                            <span className="text-stone-400">{chunk.content_type}</span>
                            <span className="ml-auto text-stone-300">
                              {(chunk.score * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <div className="text-stone-500 italic">{chunk.source}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-green-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-green-700 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || isStreaming || !input.trim()}
            className="rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-stone-300 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}
