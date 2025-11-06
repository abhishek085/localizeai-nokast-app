import React from 'react';
import { Button } from './Button';

interface DashboardScreenProps {
  summary: string | null;
  isModelLoaded: boolean;
  onLoadModel: () => void;
  onGenerate: () => void;
  onExport: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ summary, isModelLoaded, onLoadModel, onGenerate, onExport }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
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
      )}
    </div>
  );
};