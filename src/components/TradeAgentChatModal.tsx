import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  RefreshCw,
  User
} from 'lucide-react';
import { OptionCandidate, PlacedTrade, StayExitDecision } from '../types.ts';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  parsedRanks?: number[];
  ingestedTrades?: PlacedTrade[];
}

interface TradeAgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: OptionCandidate[];
  activeTrades: PlacedTrade[];
  stayExitDecisions: StayExitDecision[];
  onIngestByRank: (ranks: number[]) => void;
  onRefreshDecisions: () => void;
}

export const TradeAgentChatModal: React.FC<TradeAgentChatModalProps> = ({
  isOpen,
  onClose,
  candidates,
  activeTrades,
  stayExitDecisions,
  onIngestByRank,
  onRefreshDecisions,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hello! I am your Daily Options Trade Agent.\n\nDid you place any of today's suggested trades? You can tell me the Rank Numbers you traded (for example, "I placed trades for Rank 1 and Rank 3"), and I will ingest their exact parameters and calculate your Stay/Exit decisions each morning.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      if (data.success) {
        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          parsedRanks: data.parsedRanks,
          ingestedTrades: data.newlyIngested,
        };
        setMessages(prev => [...prev, agentMsg]);
        onRefreshDecisions();
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `I encountered an issue processing your request: ${err.message}. If you placed a trade, you can also enter the rank directly using the quick input bar.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="trade-agent-chat-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Daily Trade Management Agent</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Active tracking: {activeTrades.length} position{activeTrades.length !== 1 ? 's' : ''} monitored
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isAgent
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-700 text-slate-200 border border-slate-600'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isAgent
                      ? 'bg-slate-950/90 text-slate-200 border border-slate-800'
                      : 'bg-cyan-600 text-white font-medium'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Ingested Trade confirmation badge if any */}
                  {msg.ingestedTrades && msg.ingestedTrades.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Ingested to Active Portfolio:
                      </span>
                      {msg.ingestedTrades.map(t => (
                        <div key={t.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-white">#{t.rankNumber} {t.ticker}</span>
                            <span className="text-slate-400 ml-1.5 font-mono">
                              ${t.entryStockPrice.toFixed(2)} ({t.strategy})
                            </span>
                          </div>
                          <span className="text-cyan-300 font-mono">
                            Stop: ${(t.entryStockPrice * 0.97).toFixed(2)} | Target: ${(t.entryStockPrice * 1.06).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] opacity-50 block mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Agent is analyzing trades and market data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0">Suggestions:</span>
          <button
            onClick={() => handleQuickPrompt("I executed Rank 1 today with 1 contract.")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
          >
            &quot;I executed Rank 1 today&quot;
          </button>
          <button
            onClick={() => handleQuickPrompt("What trades are currently active in my portfolio?")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
          >
            &quot;What trades are currently active?&quot;
          </button>
          <button
            onClick={() => handleQuickPrompt("Give me a Stay/Exit summary on all open positions.")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
          >
            &quot;Stay/Exit summary&quot;
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            id="agent-chat-input"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tell the agent which Rank # you placed or ask for position advice..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            id="btn-send-agent-chat"
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center ${
              inputMessage.trim() && !isSending
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
