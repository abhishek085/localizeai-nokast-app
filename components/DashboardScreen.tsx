import React from 'react';
import { Button } from './Button';
import { Story } from '../types';

interface DashboardScreenProps {
  stories: Story[];
  isModelLoaded: boolean;
  onLoadModel: () => void;
  onGenerate: () => void;
  onExport: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ stories, isModelLoaded, onLoadModel, onGenerate, onExport }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Your curated stories and AI-powered tools.</p>
        </div>
        {!isModelLoaded && stories.length > 0 && (
            <div className="flex items-center bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                <span className="text-amber-700 text-sm font-medium mr-3">AI Model Offline</span>
                <Button onClick={onLoadModel} variant="secondary" className="!py-1 !px-3 text-xs">Load Model</Button>
            </div>
        )}
      </div>
      
      {stories.length === 0 && !isModelLoaded ? (
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Model Not Loaded</h3>
            <p className="text-gray-600 mb-6">Load the AI model into memory to generate summaries and use the AI Helper.</p>
            <Button onClick={onLoadModel}>Load Model</Button>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Latest Stories</h3>
                    {!isModelLoaded && (
                        <p className="text-xs text-amber-600 font-medium mt-1 flex items-center">
                            <span className="h-1.5 w-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                            AI Model Offline - Load a model to enable regeneration
                        </p>
                    )}
                </div>
                <div className="space-x-2 flex items-center">
                    <Button 
                        onClick={onGenerate} 
                        variant={isModelLoaded ? "secondary" : "ghost"} 
                        disabled={!isModelLoaded}
                        className={!isModelLoaded ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" : ""}
                    >
                        {isModelLoaded ? 'Regenerate' : 'Regenerate (Disabled)'}
                    </Button>
                    <Button onClick={onExport}>Export All</Button>
                </div>
            </div>

            {stories.length > 0 ? (
                <div className="space-y-6">
                    {stories.map((story) => (
                        <div key={story.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-2xl font-bold text-gray-900">{story.title}</h4>
                                <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                                    Score: {story.score.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
                                <div className="flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {story.sender_email}
                                </div>
                                <div className="flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(story.date_iso).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="prose prose-lg max-w-none text-gray-700 mb-6 leading-relaxed">
                                {story.summary}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn Post</h5>
                                    <p className="text-sm text-gray-600 italic">"{story.linkedIn}"</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">X Post</h5>
                                    <p className="text-sm text-gray-600 italic">"{story.x_post}"</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-sm font-medium text-indigo-600">{story.branding_tag}</span>
                                <span className="text-sm text-gray-400 italic">Suggestion: {story.action_suggestion}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500">No stories generated yet for today.</p>
                    <p className="text-sm text-gray-400 mt-1">The pipeline will only fetch emails received today from your whitelisted newsletters.</p>
                    <div className="mt-6 flex flex-col items-center">
                        <Button 
                            onClick={onGenerate} 
                            disabled={!isModelLoaded}
                            className={!isModelLoaded ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            {isModelLoaded ? "Fetch & Summarize Today's News" : "Regenerate (Model Offline)"}
                        </Button>
                        {!isModelLoaded && (
                            <button 
                                onClick={onLoadModel}
                                className="mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-500 underline"
                            >
                                Go to Model Management to Load Model
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};