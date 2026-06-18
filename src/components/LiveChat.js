"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { usePlayWallet } from "@/hooks/usePlayWallet";
import { sanitizeChatContent } from "@/lib/chatSanitize";

function formatChatLabel(walletAddress) {
  const s = sanitizeChatContent(String(walletAddress || ""));
  if (!s || s === "guest") return "Guest";
  if (s.length <= 14) return s;
  if (s.startsWith("0x")) return `${s.slice(0, 6)}…${s.slice(-4)}`;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export default function LiveChat({ open, onClose }) {
  const { address, connected, chain } = usePlayWallet();
  const walletAddr = connected && address ? address : "guest";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const [minimized, setMinimized] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMinimized(true);
    }
    let channel;
    let poller;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, wallet_address, content, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages(data || []);

      try {
        channel = supabase
          .channel("public:chat_messages")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            (payload) => {
              setMessages((prev) => [...prev, payload.new]);
            },
          )
          .subscribe();
      } catch {
        /* realtime optional */
      }

      const fetchLatest = async () => {
        try {
          const { data: d } = await supabase
            .from("chat_messages")
            .select("id, wallet_address, content, created_at")
            .order("created_at", { ascending: true })
            .limit(200);
          if (Array.isArray(d)) setMessages(d);
        } catch {
          /* ignore */
        }
      };
      poller = setInterval(fetchLatest, 30_000);
    })();

    return () => {
      try {
        channel && supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
      try {
        poller && clearInterval(poller);
      } catch {
        /* ignore */
      }
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const content = sanitizeChatContent(text);
    if (!content) return;
    setText("");
    const temp = {
      id: `temp-${Date.now()}`,
      wallet_address: walletAddr,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          wallet: walletAddr,
          chain: connected ? chain : "guest",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.message) {
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        return;
      }
      const real = json.message;
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? real : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const node = (
    <div className="fixed z-[1000] inset-x-2 bottom-2 w-auto sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[360px] sm:max-w-[90vw] bg-[#0e0010]/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur">
      <div
        className={`p-3 border-b border-purple-500/20 flex items-center justify-between ${minimized ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (minimized) setMinimized(false);
        }}
      >
        <div className="text-white/80 text-sm">
          Live Chat
          {connected && (
            <span className="ml-2 text-[10px] text-emerald-400/80 uppercase tracking-wide">
              {chain}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-white/60 hover:text-white"
            onClick={() => setMinimized((v) => !v)}
          >
            {minimized ? "▢" : "–"}
          </button>
          <button type="button" className="text-white/60 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      {!minimized && (
        <div className="p-3 h-[360px] overflow-y-auto space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="text-white/80 text-sm">
              <span className="text-white/50 mr-2">
                {formatChatLabel(m.wallet_address)}
              </span>
              <span>{sanitizeChatContent(m.content)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      {!minimized && (
        <form onSubmit={sendMessage} className="p-3 border-t border-purple-500/20 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/30 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-md bg-gradient-to-r from-red-magic to-blue-magic text-white text-sm"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
  return createPortal(node, document.body);
}
