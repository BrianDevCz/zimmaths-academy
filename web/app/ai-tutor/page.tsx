"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AITutorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const FREE_LIMIT = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestions();
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("aiUsageDate");
    if (storedDate === today) {
      const count = parseInt(localStorage.getItem("aiUsageCount") || "0");
      setQuestionsUsed(count);
    } else {
      localStorage.setItem("aiUsageDate", today);
      localStorage.setItem("aiUsageCount", "0");
    }

    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm Takudzwa, your personal ZIMSEC O-Level Mathematics tutor. I'm here to help you understand any maths topic or solve any problem. What would you like to learn today? 😊",
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem("zim_token");
const res = await fetch("http://localhost:5000/api/ai/suggestions", {
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});
      const data = await res.json();
      if (data.success) setSuggestions(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    if (questionsUsed >= FREE_LIMIT) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "You've used your 5 free questions for today! Upgrade to Premium for unlimited AI tutoring. Come back tomorrow for 5 more free questions. 🔓",
        },
      ]);
      return;
    }

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("zim_token");
      const res = await fetch("http://localhost:5000/api/ai/chat", {
    method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: text,
    history: messages.slice(-6),
  }),
});
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
        const newCount = questionsUsed + 1;
        setQuestionsUsed(newCount);
        localStorage.setItem("aiUsageCount", newCount.toString());
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I had trouble with that. Please try again!",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection error. Please check your internet and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <section className="bg-brand-800 text-white py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-bold">Takudzwa AI Tutor</h1>
              <p className="text-brand-200 text-sm">
                Powered by DeepSeek — ZIMSEC O-Level specialist
              </p>
            </div>
          </div>
          <div className="bg-brand-700 px-4 py-2 rounded-lg text-center">
            <p className="text-brand-200 text-xs">Free questions</p>
            <p className="text-white font-bold">
              {FREE_LIMIT - questionsUsed} / {FREE_LIMIT} left
            </p>
          </div>
        </div>
      </section>

      {/* Chat Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4 overflow-y-auto">
        {/* Suggestion chips */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">
              Quick questions to get started:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              "flex " + (msg.role === "user" ? "justify-end" : "justify-start")
            }
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                🤖
              </div>
            )}
            <div
              className={
                "max-w-xs md:max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none " +
                (msg.role === "user"
                  ? "bg-brand-700 text-white rounded-br-sm"
                  : "bg-white text-gray-800 shadow border border-gray-100 rounded-bl-sm")
              }
            >
              {/* 🔁 REPLACED: old renderMaths with ReactMarkdown */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 bg-brand-400 rounded-full flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm mr-2">
              🤖
            </div>
            <div className="bg-white shadow border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {questionsUsed >= FREE_LIMIT && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-3 flex justify-between items-center">
              <p className="text-yellow-700 text-sm font-medium">
                Daily limit reached — upgrade for unlimited AI tutoring
              </p>
              <a
                href="/register"
                className="bg-brand-700 text-white px-4 py-1 rounded-lg text-sm font-semibold"
              >
                Upgrade $3
              </a>
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about ZIMSEC O-Level Maths... (Press Enter to send)"
              rows={2}
              disabled={loading || questionsUsed >= FREE_LIMIT}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim() || questionsUsed >= FREE_LIMIT}
              className="bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Takudzwa only answers ZIMSEC O-Level Mathematics questions
          </p>
        </div>
      </div>
    </main>
  );
}