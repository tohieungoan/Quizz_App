import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatbotService } from '@/services';

interface AiSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AiSupportModal: React.FC<AiSupportModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your QuizzApp AI Assistant. How can I help you with your studies, live exams, or platform features today?',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    'How to join a live exam room?',
    'Explain quiz scoring & streaks',
    'How to equip a display title?',
    'Reset account password',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await chatbotService.sendChatMessage(text.trim());
      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.answer || 'No response generated.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackReply =
        err?.message || 'Sorry, I encountered an issue connecting to the AI Assistant. Please check server settings.';
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden flex flex-col h-[580px] animate-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                AI Support Assistant <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
              </h3>
              <p className="text-xs text-indigo-100 font-medium">Ready 24/7 to assist you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 bg-white hover:bg-primary/10 hover:text-primary text-on-surface-variant border border-outline-variant/40 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-surface-bright">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-on-surface border border-outline-variant/30 rounded-tl-xs shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="text-on-surface space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_strong]:text-primary [&_p]:my-1.5 [&_li]:my-1 [&_li]:leading-normal">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
                <span
                  className={`text-[10px] block mt-1.5 ${
                    msg.sender === 'user' ? 'text-indigo-100 text-right' : 'text-on-surface-variant'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant italic">
              <Bot className="w-4 h-4 text-primary animate-bounce" />
              <span>AI is typing a response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-outline-variant/30 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary text-on-surface"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
