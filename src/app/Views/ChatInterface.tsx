'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';
import BASE_URL from '../apiBaseUrl';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-xs p-3 rounded-lg text-sm bg-gray-200 text-gray-900">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-gray-500 text-xs">Assistant is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: { sender: 'user' | 'bot'; text: string } = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true); // Show typing indicator
    
    try {
      const res = await fetch(`${BASE_URL}/simplify-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const botReply = await res.text();
      setIsTyping(false); // Hide typing indicator
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch {
      setIsTyping(false); // Hide typing indicator on error
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: '⚠️ Unable to reach the assistant. Please try again later.' },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-4 ">
      <div className="w-full max-w-2xl flex flex-col gap-3 mt-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">🤖 JoinAI Support Assistant</h1>
        <div className="bg-white p-4 rounded-xl shadow-md flex-1 h-[500px] overflow-y-auto space-y-2 border">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="text-black flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ask your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={isTyping}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
      <footer className="text-xs text-gray-500 mt-4 mb-2">
        Powered by JoinAI • © {new Date().getFullYear()}
      </footer>
    </div>
  );
}