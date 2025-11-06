import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { generateAIHelperResponse } from '../services/geminiService';

interface AIHelperBubbleProps {
  isModelLoaded: boolean;
  summary: string;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const AIHelperBubble: React.FC<AIHelperBubbleProps> = ({ isModelLoaded, summary }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        
        const userMessage: Message = { sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setPrompt('');
        setIsGenerating(true);

        try {
            const result = await generateAIHelperResponse(summary, prompt);
            const aiMessage: Message = { sender: 'ai', text: result };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: 'Sorry, there was an error getting a response.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={!isModelLoaded}
                title={isModelLoaded ? "Open AI Helper" : "Load a model on the Dashboard to enable the AI Helper"}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed z-20"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-20 transition-all duration-300">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">AI Helper</h3>
                        <p className="text-sm text-gray-500">Ask me anything about the summary!</p>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isGenerating && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2">
                                        <Spinner size="h-5 w-5" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleSubmit()}
                                placeholder="Type your message..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                disabled={isGenerating}
                            />
                            <Button onClick={handleSubmit} disabled={isGenerating || !prompt.trim()}>Send</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
