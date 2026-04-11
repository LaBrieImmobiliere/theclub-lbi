"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send } from "lucide-react";

interface UserInfo { id: string; name: string | null; email: string; role: string; }
interface Conversation { user: UserInfo; lastMessage: { id: string; content: string; createdAt: string; senderId: string; } | null; unreadCount: number; }
interface Message { id: string; senderId: string; receiverId: string; content: string; read: boolean; createdAt: string; sender: UserInfo; receiver: UserInfo; }

export default function NegociateurMessageriePage() {
  const { data: session } = useSession();
  const currentUser = session?.user as { id?: string; role?: string } | undefined;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try { const r = await fetch("/api/messages"); if (r.ok) { const d = await r.json(); setConversations(d.conversations || []); } } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try { const r = await fetch(`/api/messages/${userId}`); if (r.ok) setMessages(await r.json()); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(() => { fetchConversations(); if (selectedUserId) fetchMessages(selectedUserId); }, 10000);
    return () => clearInterval(iv);
  }, [fetchConversations, fetchMessages, selectedUserId]);

  useEffect(() => { if (selectedUserId) fetchMessages(selectedUserId); }, [selectedUserId, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    try {
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: selectedUserId, content: newMessage.trim() }) });
      if (r.ok) { setNewMessage(""); await fetchMessages(selectedUserId); await fetchConversations(); }
    } catch { /* ignore */ }
  };

  const formatTime = (d: string) => {
    const date = new Date(d); const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diff === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  const selectedConv = conversations.find((c) => c.user.id === selectedUserId);
  const showThread = !!selectedUserId;

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-4rem)]"><p className="text-gray-400 text-sm">Chargement...</p></div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8">
      {/* Conversation list */}
      <div className={`w-full lg:w-80 border-r border-gray-200 flex flex-col bg-white ${showThread ? "hidden lg:flex" : "flex"}`}>
        <div className="px-4 py-3 bg-[#030A24]">
          <h2 className="text-lg font-semibold text-white">Messagerie</h2>
          <p className="text-xs text-[#D1B280]">Vos ambassadeurs</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune conversation</p>
              <p className="text-xs text-gray-400 mt-1">Vos échanges avec les ambassadeurs apparaîtront ici.</p>
            </div>
          ) : conversations.map((conv) => (
            <button key={conv.user.id} onClick={() => setSelectedUserId(conv.user.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 transition-colors ${selectedUserId === conv.user.id ? "bg-[#f9f6f1]" : "hover:bg-gray-50"}`}>
              <div className="w-10 h-10 bg-[#030A24] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(conv.user.name || conv.user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">{conv.user.name || conv.user.email}</p>
                  {conv.lastMessage && <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessage.createdAt)}</span>}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage ? `${conv.lastMessage.senderId === currentUser?.id ? "Vous: " : ""}${conv.lastMessage.content}` : "Démarrer la conversation"}</p>
                  {conv.unreadCount > 0 && <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#D1B280]">{conv.unreadCount}</span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Ambassadeur</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!showThread ? "hidden lg:flex" : "flex"}`}>
        {selectedUserId && selectedConv ? (
          <>
            <div className="px-4 sm:px-6 py-3 bg-[#030A24] flex items-center gap-3 border-b border-gray-200">
              <button onClick={() => setSelectedUserId(null)} className="lg:hidden text-white/70 hover:text-white mr-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-9 h-9 bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(selectedConv.user.name || selectedConv.user.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedConv.user.name || selectedConv.user.email}</p>
                <p className="text-xs text-[#D1B280]">Ambassadeur</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 ${isMine ? "bg-[#030A24] text-white" : "bg-[#f9f6f1] text-gray-900"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Écrire un message..." className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-[#D1B280]" />
                <button onClick={handleSend} disabled={!newMessage.trim()}
                  className="px-3 sm:px-4 py-2.5 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] disabled:opacity-50 flex items-center gap-2 transition-colors">
                  <Send className="w-4 h-4" /><span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 text-sm">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
