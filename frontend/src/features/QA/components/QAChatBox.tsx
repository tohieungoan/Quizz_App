import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Lock } from 'lucide-react'

export interface ChatMessage {
  id?: string
  sender: string
  text: string
  avatar?: string | null
  timestamp?: string
  isSelf?: boolean
}

interface QAChatBoxProps {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  currentNickname: string
  currentAvatar?: string | null
  allowAnonymousQuestion?: boolean
  isGuestUser?: boolean
}

const ChatUserAvatar: React.FC<{
  avatarUrl: string | null
  senderName: string
  isHost: boolean
  isMe: boolean
  initialLetter: string
}> = ({ avatarUrl, senderName, isHost, isMe, initialLetter }) => {
  const [imgError, setImgError] = useState(false)

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={senderName}
        onError={() => setImgError(true)}
        className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
      />
    )
  }

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 shadow-2xs ${
        isHost
          ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
          : isMe
          ? 'bg-gradient-to-tr from-primary to-indigo-600'
          : 'bg-slate-500'
      }`}
    >
      {isHost ? '👑' : initialLetter}
    </div>
  )
}

export const QAChatBox: React.FC<QAChatBoxProps> = ({
  messages,
  onSendMessage,
  currentNickname,
  currentAvatar,
  allowAnonymousQuestion = true,
  isGuestUser = false
}) => {
  const [inputText, setInputText] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border-2 border-slate-200/80 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Live Q&A Chat</span>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] min-h-[240px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 text-center">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-primary" />
            <p className="text-xs font-bold text-slate-600">No chat messages yet.</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = Boolean(msg.sender === currentNickname || msg.isSelf)
            const isHost = Boolean(msg.sender === 'Host' || (msg.sender && msg.sender.toLowerCase().includes('host')))
            let rawAvatar = msg.avatar || (isMe ? currentAvatar : (isHost ? currentAvatar : null))
            
            // Resolve avatar path / preset if string
            let avatarUrl: string | null = null
            if (rawAvatar) {
              if (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('/')) {
                avatarUrl = rawAvatar
              } else if (rawAvatar.includes('.')) {
                avatarUrl = `/${rawAvatar}`
              } else {
                avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.sender)}`
              }
            }

            const initialLetter = isHost ? '👑' : (msg.sender || 'U').slice(0, 1).toUpperCase()

            return (
              <div
                key={index}
                className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[90%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <ChatUserAvatar
                  avatarUrl={avatarUrl}
                  senderName={msg.sender}
                  isHost={isHost}
                  isMe={isMe}
                  initialLetter={initialLetter}
                />

                {/* Message Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-extrabold text-slate-500 mb-0.5 px-1 flex items-center gap-1">
                    {msg.sender}
                    {isHost && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8px] px-1 py-0.2 rounded font-black">
                        HOST
                      </span>
                    )}
                  </span>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs font-semibold leading-relaxed shadow-2xs text-left ${
                      isMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : isHost
                        ? 'bg-amber-500 text-white rounded-tl-none font-bold'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Message Input */}
      {allowAnonymousQuestion === false && isGuestUser ? (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs font-extrabold flex items-center justify-center gap-2 text-center">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Anonymous Q&A is disabled by Host. Please log in to post questions.</span>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-outline-variant/20 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or question..."
            className="flex-1 bg-white border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
