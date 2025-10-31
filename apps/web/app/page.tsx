'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to AutoBrain! How can I help you today?' }
  ]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);


  const send = async () => {
    if (!msg.trim()) return;

    const userMessage: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setMsg('');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + chunk }
          ];
        }
        return prev;
      });
    }
  }

  return (
    <div className="bg-gray-800 text-white h-screen flex flex-col font-sans">
      <header className="bg-gray-900 p-4 shadow-md">
        <h1 className="text-2xl font-bold">AutoBrain</h1>
        <p className="text-sm text-gray-400">Your Autonomous Knowledge Assistant</p>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0"></div>
              )}
              <div className={`p-4 rounded-2xl max-w-lg ${m.role === 'user' ? 'bg-gray-700' : 'bg-gray-900'}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
               {m.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0"></div>
              )}
            </div>
          ))}
           <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-900 p-4 border-t border-gray-700">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <input
            className="bg-gray-700 text-white rounded-lg p-3 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Type your message..."
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            onClick={send}
            disabled={!msg.trim()}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  )
}
