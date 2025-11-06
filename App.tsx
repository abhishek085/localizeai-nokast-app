import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ModelManagementScreen } from './components/ModelManagementScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AboutScreen } from './components/AboutScreen';
import { AIHelperBubble } from './components/AIHelperBubble';
import { MOCK_SUMMARY } from './constants';
import { summarizeNewsletters } from './services/geminiService';
import { Screen, SummaryPreferences, Newsletter } from './types';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isGenerating, setIsGenerating] = useState(false);

    const [preferences, setPreferences] = useState<SummaryPreferences>({
        frequency: 'Daily',
        time: '08:00',
        notifications: true,
    });
    const [selectedNewsletters, setSelectedNewsletters] = useState<Newsletter[]>([]);
    const [summary, setSummary] = useState<string | null>(null);

    // Effect to handle online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleGenerateSummary = async () => {
        if (selectedNewsletters.length === 0) {
            alert("Please add some newsletters in Settings first.");
            return;
        }
        setIsGenerating(true);
        try {
            // Using the real service, but with mock content for newsletters
            // const newSummary = await summarizeNewsletters(selectedNewsletters);
            // Using mock summary for quick demo
            await new Promise(res => setTimeout(res, 1500)); // Simulate API call
            const newSummary = MOCK_SUMMARY;
            setSummary(newSummary);
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExport = () => {
        if(summary) {
            navigator.clipboard.writeText(summary);
            alert("Summary copied to clipboard!");
        }
    };

    const renderScreen = () => {
        if (isGenerating) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Spinner size="h-16 w-16" />
                    <p className="mt-4 text-gray-600 text-lg">Generating your summary...</p>
                </div>
            )
        }
        switch (activeScreen) {
            case Screen.Home:
                return <HomeScreen 
                            isGmailConnected={isGmailConnected}
                            summary={summary}
                            selectedNewsletters={selectedNewsletters}
                            onNavigate={setActiveScreen}
                            onGenerate={handleGenerateSummary}
                        />;
            case Screen.Dashboard:
                return <DashboardScreen 
                            summary={summary}
                            isModelLoaded={isModelLoaded}
                            onLoadModel={() => setIsModelLoaded(true)}
                            onGenerate={handleGenerateSummary}
                            onExport={handleExport}
                        />;
            case Screen.ModelManagement:
                return <ModelManagementScreen />;
            case Screen.Settings:
                return (
                    <SettingsScreen
                        initialPrefs={preferences}
                        onSavePrefs={setPreferences}
                        isGmailConnected={isGmailConnected}
                        onConnect={() => setIsGmailConnected(true)}
                        onDisconnect={() => {
                          setIsGmailConnected(false);
                          setSelectedNewsletters([]);
                        }}
                        selectedNewsletters={selectedNewsletters}
                        onSaveNewsletters={setSelectedNewsletters}
                    />
                );
            case Screen.About:
                return <AboutScreen />;
            default:
                return <HomeScreen 
                            isGmailConnected={isGmailConnected}
                            summary={summary}
                            selectedNewsletters={selectedNewsletters}
                            onNavigate={setActiveScreen}
                            onGenerate={handleGenerateSummary}
                        />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-gray-800 font-sans">
            <Header activeScreen={activeScreen} setScreen={setActiveScreen} isOnline={isOnline} />
            <main className="flex-1 overflow-y-auto relative">
                {renderScreen()}
                <AIHelperBubble isModelLoaded={isModelLoaded} summary={summary ?? ''} />
            </main>
        </div>
    );
};

export default App;