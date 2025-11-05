import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { ChatWindow } from "@/components/ChatWindow";
import type { ChatMessage } from "@/types";
import { usePaperAI } from "@/hooks/mutations/usePaperAI";

export default function SearchSection() {
  const [query, setQuery] = useState("");
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { getPaperAIResponse, isPending } = usePaperAI();
  const handleSearch = () => {
    if (!query.trim()) return;
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setIsChatActive(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const body = { query };
      getPaperAIResponse(body, {
        onError: (err) => {
          throw new Error(err.message);
        },
        onSuccess: async (reader) => {
          if (!reader) {
            setQuery("");
            return;
          }
          const aiMessageId = `msg_${Date.now()}_ai`;

          setMessages((prev) => [
            ...prev,
            {
              id: aiMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
            },
          ]);

          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          }
        },
      });
    } catch (err) {
      console.log(err);
    } finally {
      setQuery("");
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col items-center justify-center">
      {!isChatActive && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-blue-400 to-teal-400 text-5xl font-extrabold text-center mb-8"
        >
          Welcome to Research AI
        </motion.h1>
      )}

      <ChatWindow isChatActive={isChatActive} messages={messages} />

      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className={`w-full max-w-2xl flex gap-2 bg-zinc-800/40 backdrop-blur-xl p-2 rounded-2xl border border-zinc-700 shadow-lg transition-transform ${
          isChatActive ? "absolute bottom-10" : ""
        }`}
      >
        <Input
          type="text"
          placeholder="Search research papers, authors, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent text-slate-200 placeholder:text-zinc-500 border-none focus:ring-0 focus-visible:ring-0"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          variant="secondary"
          disabled={isPending}
          className="dark:bg-zinc-900 hover:dark:bg-zinc-800 text-white rounded-xl px-4 py-2"
        >
          <Search className="w-4 h-4 mr-1" />
          Search
        </Button>
      </motion.div>

      {/* Footer or Hint */}
      {!isChatActive && (
        <p className="mt-6 text-sm text-zinc-500 text-center">
          Try queries like{" "}
          <span className="text-slate-300">"Generative AI 2024"</span> or{" "}
          <span className="text-slate-300">"LLM reasoning benchmarks"</span>
        </p>
      )}
    </div>
  );
}
