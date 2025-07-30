'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Moon, Sun } from 'lucide-react';

import BASE_URL from '../apiBaseUrl';

interface ApiResponse {
  message: string;
  type: 'success' | 'warning' | 'error' | 'answer' | 'email_required' | 'support_ticket_created';
  sessionId?: string;
  pendingQuestion?: string;
  warning?: string;
}

const TypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className="flex justify-start mb-2 px-4">
      <div className={`max-w-xs p-3 rounded-lg text-sm ${
        isDarkMode 
          ? 'bg-gray-700 text-gray-200' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
            }`}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
            }`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
            }`} style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Assistant is typing...
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; type?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForEmail, setIsWaitingForEmail] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: { sender: 'user' | 'bot'; text: string; type?: string } = { 
      sender: 'user', 
      text: input 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await fetch(`${BASE_URL}/simplify-question`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          question: currentInput,
          email: null
        }),
      });

      setIsTyping(false);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        let botReply: ApiResponse | string;
        
        if (contentType && contentType.includes('application/json')) {
          botReply = await response.json() as ApiResponse;
          
          const messageText = botReply.message;
          let messageType = '';
          
          switch (botReply.type) {
            case 'email_required':
              setIsWaitingForEmail(true);
              messageType = 'email_required';
              break;
            case 'success':
              setIsWaitingForEmail(false);
              messageType = 'success';
              break;
            case 'warning':
              setIsWaitingForEmail(false);
              messageType = 'warning';
              console.warn('Session warning:', botReply.warning);
              break;
            case 'support_ticket_created':
              setIsWaitingForEmail(false);
              messageType = 'success';
              break;
            case 'error':
              setIsWaitingForEmail(false);
              messageType = 'error';
              break;
            default:
              setIsWaitingForEmail(false);
          }
          
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: messageText,
            type: messageType
          }]);
          
        } else {
          botReply = await response.text();
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: typeof botReply === 'string' ? botReply : botReply.message 
          }]);
        }
        
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      setIsTyping(false);
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: '⚠️ Unable to reach the assistant. Please try again later.',
          type: 'error'
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to get message styling based on type
  const getMessageStyling = (msg: { sender: 'user' | 'bot'; text: string; type?: string }) => {
    if (msg.sender === 'user') {
      return isDarkMode 
        ? 'bg-blue-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md'
        : 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md';
    }
    
    // Bot message styling based on type
    const baseStyle = 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md';
    
    if (isDarkMode) {
      switch (msg.type) {
        case 'success':
          return `bg-green-900 text-green-200 border border-green-700 ${baseStyle}`;
        case 'warning':
          return `bg-yellow-900 text-yellow-200 border border-yellow-700 ${baseStyle}`;
        case 'error':
          return `bg-red-900 text-red-200 border border-red-700 ${baseStyle}`;
        case 'email_required':
          return `bg-blue-900 text-blue-200 border border-blue-700 ${baseStyle}`;
        default:
          return `bg-gray-700 text-gray-200 ${baseStyle}`;
      }
    } else {
      switch (msg.type) {
        case 'success':
          return `bg-green-100 text-green-800 border border-green-200 ${baseStyle}`;
        case 'warning':
          return `bg-yellow-100 text-yellow-800 border border-yellow-200 ${baseStyle}`;
        case 'error':
          return `bg-red-100 text-red-800 border border-red-200 ${baseStyle}`;
        case 'email_required':
          return `bg-blue-100 text-blue-800 border border-blue-200 ${baseStyle}`;
        default:
          return `bg-gray-200 text-gray-900 ${baseStyle}`;
      }
    }
  };

  return (
    <div className={`h-screen flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Header */}
      <div className={`border-b px-4 py-4 flex items-center justify-between shadow-sm ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div></div>
        <h1 className={`text-xl font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          🤖 JoinAI Support
        </h1>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full transition-colors duration-200 ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="py-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm px-4 py-8">
              <div className="bg-white rounded-lg p-6 mx-4 shadow-sm">
                👋 Hello! I&apos;m here to help you with questions about JoinAI. How can I assist you today?
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex px-4 mb-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md p-3 text-sm whitespace-pre-wrap shadow-sm ${getMessageStyling(msg)}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && <TypingIndicator isDarkMode={isDarkMode} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area - Sticky at bottom */}
      <div className="bg-white border-t border-gray-200 p-4">
        {isWaitingForEmail && (
          <div className="text-xs text-blue-600 text-center bg-blue-50 p-2 rounded-lg mb-3">
            💡 Tip: Just type your email address (e.g., &quot;user@example.com&quot;) and send it
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              className="w-full px-4 py-3 bg-gray-100 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-500 min-h-[44px] max-h-32"
              placeholder={
                isWaitingForEmail 
                  ? "Please provide your email address..." 
                  : "Type a message..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '44px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className={`text-xs text-center py-2 ${
        isDarkMode 
          ? 'bg-gray-800 text-gray-400' 
          : 'bg-gray-50 text-gray-500'
      }`}>
        Powered by JoinAI • © {new Date().getFullYear()}
      </div>
    </div>
  );
}