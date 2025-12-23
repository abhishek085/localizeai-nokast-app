import React from 'react';
import { Newsletter, Screen, Story } from '../types';
import { Button } from './Button';

interface HomeScreenProps {
    isGmailConnected: boolean;
    stories: Story[];
    selectedNewsletters: Newsletter[];
    onNavigate: (screen: Screen) => void;
    onGenerate: () => void;
}

const StatCard: React.FC<{ title: string; value?: React.ReactNode; children?: React.ReactNode; icon: React.ReactNode }> = ({ title, value, children, icon }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
                {value != null && <p className="text-3xl font-bold text-gray-900">{value}</p>}
            </div>
            {icon}
        </div>
        {children && <div className="mt-4">{children}</div>}
    </div>
);

const ConnectionIcon: React.FC<{ connected: boolean }> = ({ connected }) => (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${connected ? 'bg-green-100' : 'bg-red-100'}`}>
        {connected ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
        )}
    </div>
);

const NewsletterIcon = () => (
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-3-4h.01" /></svg>
    </div>
);

const ActionsIcon = () => (
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ isGmailConnected, stories, selectedNewsletters, onNavigate, onGenerate }) => {
    
    const summaryPreview = stories.length > 0 
        ? stories[0].title + ": " + stories[0].summary.substring(0, 150) + '...' 
        : 'No summary generated for this session.';

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Home</h2>
                <p className="text-gray-500">Your personal status page for Nokast.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Gmail Connection" value={isGmailConnected ? "Connected" : "Disconnected"} icon={<ConnectionIcon connected={isGmailConnected} />}>
                    <Button variant="secondary" className="text-sm !py-1.5" onClick={() => onNavigate(Screen.Settings)}>
                        Go to Settings
                    </Button>
                </StatCard>
                <StatCard title="Selected Newsletters" value={selectedNewsletters.length} icon={<NewsletterIcon />}>
                    <Button variant="secondary" className="text-sm !py-1.5" onClick={() => onNavigate(Screen.Settings)}>
                        Edit Selection
                    </Button>
                </StatCard>
                 <StatCard title="Quick Actions" icon={<ActionsIcon />}>
                    <div className="flex items-center space-x-2">
                        <Button className="text-sm !py-1.5" onClick={onGenerate}>Generate</Button>
                        <Button className="text-sm !py-1.5" variant="secondary" onClick={() => onNavigate(Screen.Dashboard)}>Dashboard</Button>
                    </div>
                 </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Summary Preview</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{summaryPreview}</p>
                    {stories.length > 0 && (
                         <Button className="mt-6" onClick={() => onNavigate(Screen.Dashboard)}>View Full Summary & AI Helper</Button>
                    )}
                </div>
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your Newsletters</h3>
                    {selectedNewsletters.length > 0 ? (
                        <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                            {selectedNewsletters.map(nl => (
                                <li key={nl.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                    <span className="font-medium text-gray-700">{nl.sender}</span>
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        P: {nl.priority}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No newsletters selected. Go to Settings to add some.</p>
                    )}
                </div>
            </div>
        </div>
    );
};