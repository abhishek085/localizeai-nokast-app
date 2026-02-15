import React from 'react';
import { Button } from './Button';
import { Story } from '../types';

interface DashboardScreenProps {
  stories: Story[];
  isModelLoaded: boolean;
  onLoadModel: () => void;
  onGenerate: () => void;
  onExport: () => void;
  onSendWhatsApp?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ stories, isModelLoaded, onLoadModel, onGenerate, onExport, onSendWhatsApp }) => {
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
                        className={!isModelLoaded ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" : "flex items-center gap-2"}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {isModelLoaded ? 'Regenerate' : 'Regenerate (Disabled)'}
                    </Button>
                    {stories.length > 0 && onSendWhatsApp && (
                        <Button onClick={onSendWhatsApp} variant="secondary" className="!bg-emerald-50 !text-emerald-700 !border-emerald-200 hover:!bg-emerald-100 flex items-center gap-2">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.006L0 24l6.135-1.61a11.811 11.811 0 005.912 1.569h.005c6.636 0 12.032-5.396 12.035-12.031a11.77 11.77 0 00-3.522-8.497" />
                            </svg>
                            WhatsApp
                        </Button>
                    )}
                    <Button onClick={onExport} className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Text
                    </Button>
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