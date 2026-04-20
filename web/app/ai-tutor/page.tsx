"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const fixMath = (text: string) => {
  return text
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
};

export default function AITutorPage() {
  const { isPremium } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const FREE_LIMIT = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        content: "Hello! I'm Takudzwa, your personal ZIMSEC O-Level Mathematics tutor. I can help you solve any maths problem — you can also **upload a photo** of a question and I'll solve it for you! 😊",
      },
    ]);
  }, []);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem("zim_token");
      const res = await fetch(`${API_URL}/api/ai/suggestions`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSuggestions(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setSelectedImage({
        base64,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if ((!text && !selectedImage) || loading) return;

    if (questionsUsed >= FREE_LIMIT && !isPremium) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "You've used your 5 free questions for today! Upgrade to Premium for unlimited AI tutoring. Come back tomorrow for 5 more free questions. 🔓",
      }]);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: text || "Please solve this question from the image.",
      image: selectedImage?.preview,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const token = localStorage.getItem("zim_token");
      let res: Response;

      if (imageToSend) {
        res = await fetch(`${API_URL}/api/ai/chat-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text || "Please read this maths question and solve it step by step.",
            imageBase64: imageToSend.base64,
            mimeType: imageToSend.mimeType,
            history: messages.slice(-6),
          }),
        });
      } else {
        res = await fetch(`${API_URL}/api/ai/chat`, {
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
      }

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: fixMath(data.message),
        }]);
        if (!isPremium) {
          const newCount = questionsUsed + 1;
          setQuestionsUsed(newCount);
          localStorage.setItem("aiUsageCount", newCount.toString());
        }
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Sorry, I had trouble with that. Please try again!",
        }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Connection error. Please check your internet and try again.",
      }]);
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

  const limitReached = questionsUsed >= FREE_LIMIT && !isPremium;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <section className="bg-brand-800 text-white py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-2xl">🤖</div>
            <div>
              <h1 className="text-xl font-bold">Takudzwa AI Tutor</h1>
              <p className="text-brand-200 text-sm">Powered by DeepSeek — ZIMSEC O-Level specialist</p>
            </div>
          </div>
          <div className="bg-brand-700 px-4 py-2 rounded-lg text-center">
            <p className="text-brand-200 text-xs">Questions</p>
            <p className="text-white font-bold">
              {isPremium ? "∞ Unlimited" : `${Math.max(0, FREE_LIMIT - questionsUsed)} / ${FREE_LIMIT} left`}
            </p>
          </div>
        </div>
      </section>

      {/* Chat Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4 overflow-y-auto">
        {/* Suggestion chips */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 5).map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-3 py-2 rounded-lg text-sm font-medium transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => (
          <div key={index} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">🤖</div>
            )}
            <div className={
              "max-w-xs md:max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none " +
              (msg.role === "user"
                ? "bg-brand-700 text-white rounded-br-sm"
                : "bg-white text-gray-800 shadow border border-gray-100 rounded-bl-sm")
            }>
              {msg.image && (
                <img src={msg.image} alt="Uploaded question"
                  className="rounded-lg max-w-full mb-2 border border-white/20" />
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {msg.content}
              </ReactMarkdown>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 bg-brand-400 rounded-full flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">👤</div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm mr-2">🤖</div>
            <div className="bg-white shadow border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {limitReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-3 flex justify-between items-center">
              <p className="text-yellow-700 text-sm font-medium">Daily limit reached — upgrade for unlimited AI tutoring</p>
              <a href="/upgrade" className="bg-brand-700 text-white px-4 py-1 rounded-lg text-sm font-semibold">Upgrade $3</a>
            </div>
          )}

          {/* Image preview */}
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage.preview} alt="Selected"
                className="h-20 rounded-lg border border-gray-200 object-cover" />
              <button onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || limitReached}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 px-3 py-3 rounded-xl transition disabled:opacity-50 flex-shrink-0"
              title="Upload a photo of a question"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedImage ? "Add a message or just send the image..." : "Ask me anything about ZIMSEC O-Level Maths... (Press Enter to send)"}
              rows={2}
              disabled={loading || limitReached}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || (!input.trim() && !selectedImage) || limitReached}
              className="bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-3 rounded-xl font-semibold transition flex-shrink-0"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            📷 Upload a photo of a question — Takudzwa will read and solve it
          </p>
        </div>
      </div>
    </main>
  );
}
