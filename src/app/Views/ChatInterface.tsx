'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';
import BASE_URL from '../apiBaseUrl';

interface ApiResponse {
  message: string;
  type: 'success' | 'warning' | 'error' | 'answer' | 'email_required' | 'support_ticket_created';
  sessionId?: string;
  pendingQuestion?: string;
  warning?: string;
}

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
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; type?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForEmail, setIsWaitingForEmail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Function to check session status (for debugging)
  const checkSessionStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/session-status`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
      });
      const status = await response.json();
      console.log('Session Status:', status);
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

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
        credentials: 'include', // This is crucial for maintaining sessions
        body: JSON.stringify({ 
          question: currentInput,
          email: null // Let the backend handle email extraction from the question
        }),
      });

      setIsTyping(false);

      if (response.ok) {
        // Try to parse as JSON first (new format)
        const contentType = response.headers.get('content-type');
        let botReply: ApiResponse | string;
        
        if (contentType && contentType.includes('application/json')) {
          botReply = await response.json() as ApiResponse;
          
          // Store session ID for debugging
          if (botReply.sessionId) {
            setSessionId(botReply.sessionId);
          }
          
          // Handle different response types
          let messageText = botReply.message;
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
          // Fallback for plain text response (old format)
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
      return 'bg-blue-600 text-white';
    }
    
    // Bot message styling based on type
    switch (msg.type) {
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'email_required':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-4">
      <div className="w-full max-w-2xl flex flex-col gap-3 mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-center text-gray-800">🤖 JoinAI Support Assistant</h1>
          {sessionId && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Session: {sessionId.substring(0, 8)}...
            </div>
          )}
        </div>
        
        {/* Debug button - remove in production */}
        <button 
          onClick={checkSessionStatus}
          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 self-start"
        >
          🐛 Check Session (Debug)
        </button>
        
        <div className="bg-white p-4 rounded-xl shadow-md flex-1 h-[500px] overflow-y-auto space-y-2 border">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-8">
              👋 Hello! I'm here to help you with questions about JoinAI. How can I assist you today?
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg text-sm whitespace-pre-wrap ${getMessageStyling(msg)}`}
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
            placeholder={
              isWaitingForEmail 
                ? "Please provide your email address..." 
                : "Ask your question..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
        
        {isWaitingForEmail && (
          <div className="text-xs text-blue-600 text-center bg-blue-50 p-2 rounded">
            💡 Tip: Just type your email address (e.g., "user@example.com") and send it
          </div>
        )}
      </div>
      
      <footer className="text-xs text-gray-500 mt-4 mb-2">
        Powered by JoinAI • © {new Date().getFullYear()}
      </footer>
    </div>
  );
}