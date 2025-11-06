import React, { useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { generateAIHelperResponse } from '../services/geminiService';

interface DashboardScreenProps {
  summary: string | null;
  isModelLoaded: boolean;
  onLoadModel: () => void;
  onGenerate: () => void;
  onExport: () => void;
}

const AIHelper: React.FC<{ summary: string }> = ({ summary }) => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const quickActions = [
        "Create a Tweet from this summary",
        "Write a LinkedIn post about the key findings",
        "Draft a short email update based on this",
        "How does this application work?"
    ];

    const handleSubmit = async (currentPrompt: string) => {
        if (!currentPrompt.trim()) return;
        setIsGenerating(true);
        setResponse('');
        try {
            const result = await generateAIHelperResponse(summary, currentPrompt);
            setResponse(result);
        } catch (error) {
            setResponse('Sorry, there was an error getting a response.');
        } finally {
            setIsGenerating(false);
            setPrompt('');
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI Helper</h3>
            <div className="flex-1 space-y-4">
                <div className="space-x-2">
                    {quickActions.map(action => (
                        <button key={action} onClick={() => handleSubmit(action)} disabled={isGenerating} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors">
                            {action}
                        </button>
                    ))}
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask the AI to create content or ask a question..."
                    className="w-full h-24 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    disabled={isGenerating}
                />
                <Button onClick={() => handleSubmit(prompt)} disabled={isGenerating || !prompt.trim()} className="w-full">
                    {isGenerating ? <span className="flex items-center justify-center"><Spinner size="h-5 w-5 mr-2" /> Generating...</span> : 'Generate'}
                </Button>
            </div>
            
            {response && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">AI Response:</h4>
                    <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200" style={{ whiteSpace: 'pre-wrap' }}>
                        {response}
                    </div>
                </div>
            )}
        </div>
    );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ summary, isModelLoaded, onLoadModel, onGenerate, onExport }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Your summary and AI-powered tools.</p>
        </div>
      </div>
      
      {!isModelLoaded ? (
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Model Not Loaded</h3>
            <p className="text-gray-600 mb-6">Load the AI model into memory to generate summaries and use the AI Helper.</p>
            <Button onClick={onLoadModel}>Load Model</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Latest Summary</h3>
                    <div className="space-x-2">
                        <Button onClick={onGenerate} variant="secondary">Regenerate</Button>
                        <Button onClick={onExport}>Export</Button>
                    </div>
                </div>
                {summary ? (
                     <div className="prose prose-lg max-w-none" style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-500">No summary generated yet for this session.</p>
                        <Button onClick={onGenerate} className="mt-4">Generate First Summary</Button>
                    </div>
                )}
            </div>
            <AIHelper summary={summary || "No summary available."} />
        </div>
      )}
    </div>
  );
};