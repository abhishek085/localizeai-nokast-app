import React from 'react';
import { Newsletter, Screen } from '../types';
import { Button } from './Button';

interface HomeScreenProps {
    isGmailConnected: boolean;
    summary: string | null;
    selectedNewsletters: Newsletter[];
    onNavigate: (screen: Screen) => void;
    onGenerate: () => void;
}

// Fix: Made the `value` prop optional and conditionally rendered it to support cards without a primary value.
const StatCard: React.FC<{ title: string; value?: React.ReactNode; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
        {value != null && <p className="text-3xl font-bold text-gray-900">{value}</p>}
        {children}
    </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ isGmailConnected, summary, selectedNewsletters, onNavigate, onGenerate }) => {
    
    const summaryPreview = summary ? summary.substring(0, 200) + '...' : 'No summary generated for this session.';

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Home</h2>
                <p className="text-gray-500">Your personal status page for LocalizeAI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Gmail Connection" value={isGmailConnected ? "Connected" : "Disconnected"}>
                    <Button variant="secondary" className="mt-4 text-sm !py-1.5" onClick={() => onNavigate(Screen.Settings)}>
                        Go to Settings
                    </Button>
                </StatCard>
                <StatCard title="Selected Newsletters" value={selectedNewsletters.length}>
                    <Button variant="secondary" className="mt-4 text-sm !py-1.5" onClick={() => onNavigate(Screen.Settings)}>
                        Edit Selection
                    </Button>
                </StatCard>
                 <StatCard title="Quick Actions">
                    <div className="flex items-center space-x-2 mt-2">
                        <Button className="text-sm !py-1.5" onClick={onGenerate}>Generate Summary</Button>
                        <Button className="text-sm !py-1.5" variant="secondary" onClick={() => onNavigate(Screen.Dashboard)}>View Dashboard</Button>
                    </div>
                 </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Summary Preview</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{summaryPreview}</p>
                    {summary && (
                         <Button className="mt-6" onClick={() => onNavigate(Screen.Dashboard)}>View Full Summary & AI Helper</Button>
                    )}
                </div>
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your Newsletters</h3>
                    {selectedNewsletters.length > 0 ? (
                        <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                            {selectedNewsletters.map(nl => (
                                <li key={nl.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                    <span className="font-medium text-gray-700">{nl.sender}</span>
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        P: {nl.priority}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No newsletters selected. Please connect Gmail and choose your newsletters in Settings.</p>
                    )}
                </div>
            </div>
        </div>
    );
};