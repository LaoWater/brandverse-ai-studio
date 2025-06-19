import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, ClipboardCopy, Check, Trash2, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from "@/integrations/supabase/client";




interface Message {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  containsHumanSupport?: boolean;
}

const INITIAL_ASSISTANT_MESSAGE: Message = {
  content: "🚀 **Welcome to Creators Multiverse!**\n\nI'm here to help you transform your brilliant ideas into viral content at light speed. Whether you need guidance on our features, content creation strategies, or getting started - I'm ready to assist!\n\n**Quick Start:**\n- **Multi-Platform Publishing** - Create once, share everywhere\n- **AI-Powered Optimization** - Content designed for maximum engagement  \n- **Creative Command Center** - Your workspace, supercharged\n\nWhat would you like to know about accelerating your content creation journey?",
  sender: 'assistant',
  timestamp: new Date()
};

const markdownProseClasses = (sender: 'user' | 'assistant') => `
  prose prose-sm
  max-w-none
  prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
  prose-p:my-1.5
  prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:leading-snug
  prose-blockquote:my-1.5 prose-blockquote:pl-3 prose-blockquote:border-l-2 prose-blockquote:italic
  ${sender === 'user' 
    ? 'prose-invert prose-blockquote:border-white/50' 
    : 'prose-blockquote:border-slate-300'} {/* Adjusted assistant blockquote border for bg-slate-50 */}
  prose-code:font-mono prose-code:text-xs prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm
  prose-code:before:content-[''] prose-code:after:content-['']
  prose-pre:font-mono prose-pre:text-xs prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-md prose-pre:overflow-x-auto
  ${sender === 'user' ? 'prose-invert' : ''} // Apply prose-invert only to user messages (dark background)
`;

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldGlowHumanSupport, setShouldGlowHumanSupport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClearChat = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInputText('');
    setShouldGlowHumanSupport(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleHumanSupport = () => {
    window.open('/contact', '_blank');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const newUserMessage: Message = { 
      content: inputText, 
      sender: 'user', 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);
    setShouldGlowHumanSupport(false);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { message: currentInput }
      });

      if (error) throw new Error(error.message || 'Failed to get response from assistant');
      
      if (data?.message) {
        const assistantMessage: Message = {
          content: data.message,
          sender: 'assistant',
          timestamp: new Date(),
          containsHumanSupport: data.containsHumanSupport || false
        };
        setMessages(prev => [...prev, assistantMessage]);
        if (data.containsHumanSupport) {
          setShouldGlowHumanSupport(true);
          setTimeout(() => setShouldGlowHumanSupport(false), 5000);
        }
      } else {
        throw new Error('No response received from assistant');
      }
    } catch (error) {
      console.error("Error calling assistant:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again or contact our human support team.";
      if (error instanceof Error) {
        errorMessage = `I'm having trouble connecting right now. ${error.message.includes('fetch') ? 'Please check your connection and try again.' : 'Please try again or contact our human support team.'}`;
      }
      setMessages(prev => [...prev, { 
        content: errorMessage, 
        sender: 'assistant', 
        timestamp: new Date(),
        containsHumanSupport: true
      }]);
      setShouldGlowHumanSupport(true);
      setTimeout(() => setShouldGlowHumanSupport(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractTextFromHastNode = (node: any): string => {
    let textContent = '';
    function getText(elementNode: any) {
      if (elementNode.type === 'text') textContent += elementNode.value;
      else if (elementNode.type === 'element' && elementNode.children) elementNode.children.forEach(getText);
    }
    if (node && node.children) node.children.forEach(getText);
    return textContent;
  };

  return (
    <div className="fixed bottom-12 right-8 z-[999]">
      {isOpen && (
        // MODIFIED: Main chat window background and border
        <div className="mb-4 w-[90vw] max-w-[900px] h-[80vh] max-h-[800px] bg-slate-200 rounded-xl shadow-2xl border border-slate-400 animate-fade-in overflow-hidden flex flex-col">
          <div className="p-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <img src="/chat-assistant.png" alt="Assistant" className="w-full h-full rounded-full" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Creators Multiverse Assistant</h3>
                <p className="text-xs text-white/80">Transform ideas into viral content ⚡</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={handleHumanSupport}
                className={`
                  px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 text-xs font-medium flex items-center space-x-1.5
                  ${shouldGlowHumanSupport ? 'animate-pulse bg-yellow-400/30 ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/25' : ''}
                `}
                title="Get help from our human support team"
              >
                <Headphones size={14} />
                <span className="hidden sm:inline">Human Support</span>
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
                title="Clear chat history"
                aria-label="Clear chat history"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={toggleChat} 
                className="p-1 rounded-full hover:bg-white/10 transition-colors" 
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MODIFIED: Scrollbar thumb color for new background */}
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-transparent">
            <div className="flex flex-col space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* MODIFIED: Assistant message bubble background, border, and text color */}
                  <div className={`p-3 rounded-xl max-w-[85%] shadow-md text-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800' 
                  }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ node, children, ...props }) => {
                          const codeNode = node?.children?.[0];
                          const textToCopy = codeNode ? extractTextFromHastNode(codeNode) : '';
                          const [copied, setCopied] = useState(false);
                          const handleCopy = async () => {
                            if (!textToCopy) return;
                            try {
                              await navigator.clipboard.writeText(textToCopy);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            } catch (err) { console.error('Failed to copy: ', err); }
                          };
                          // MODIFIED: Assistant's pre background to contrast with new bubble color
                          const preBg = message.sender === 'user' ? 'bg-black/30' : 'bg-slate-200'; 
                          return (
                            <div className="relative group my-2">
                              <pre {...props} className={`${props.className || ''} ${preBg} p-3 pt-9 rounded-md overflow-x-auto text-xs leading-relaxed`}>{children}</pre>
                              {textToCopy && (
                                <button onClick={handleCopy} className="absolute top-1.5 right-1.5 p-1 bg-slate-600/60 hover:bg-slate-500/80 rounded text-slate-100/80 hover:text-slate-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={copied ? "Copied!" : "Copy code"}>
                                  {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                                </button>
                              )}
                            </div>
                          );
                        },
                      }}
                      className={markdownProseClasses(message.sender)}
                    >{message.content}</ReactMarkdown>
                    {/* MODIFIED: Assistant timestamp border and text color */}
                    <p className={`text-xs mt-2 pt-1 border-t text-right ${
                      message.sender === 'user' 
                        ? 'border-white/20 text-blue-100 opacity-75' 
                        : 'border-slate-200/60 text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                   {/* MODIFIED: Loading indicator bubble background, border, and text color */}
                   <div className="p-3 rounded-lg max-w-[85%] bg-slate-50 border border-slate-200 shadow-md">
                     <div className="flex items-center space-x-2 text-sm text-slate-600">
                       <Loader2 size={16} className="animate-spin" />
                       <span>Assistant is crafting your response...</span>
                     </div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-3 border-t border-slate-700 bg-slate-900 shrink-0">
            <div className="flex items-center space-x-3">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-grow bg-slate-800 border-slate-700 text-gray-200 placeholder:text-gray-500 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!inputText.trim() || isLoading}
                className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-lg w-10 h-10"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={toggleChat} 
        className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group" 
        aria-label={isOpen ? "Close chat" : "Open Creators Multiverse assistant"}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-400 via-blue-400 to-indigo-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="absolute inset-0 creators-multiverse-glow"></div>
        
        {isOpen ? (
          <X size={32} className="relative z-10 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
        ) : (
          <img
            src="/chat-assistant.png"
            alt="Open Creators Multiverse assistant"
            className="relative z-10 w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
          />
        )}
      </button>
    </div>
  );
};

export default ChatButton;
