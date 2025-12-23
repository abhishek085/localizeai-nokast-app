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
import { Screen, SummaryPreferences, Newsletter, Story } from './types';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pipelineStatus, setPipelineStatus] = useState<any>(null);

    const [preferences, setPreferences] = useState<SummaryPreferences>({
        frequency: 'Daily',
        time: '08:00',
        notifications: true,
    });
    const [selectedNewsletters, setSelectedNewsletters] = useState<Newsletter[]>([]);
    const [priorityKeywords, setPriorityKeywords] = useState<string[]>([]);
    const [stories, setStories] = useState<Story[]>([]);

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

    // Load newsletters and priority keywords from backend on mount
    useEffect(() => {
        const loadLists = async () => {
            try {
                const [nlResp, kwResp, secResp, storiesResp, ollamaResp] = await Promise.all([
                    fetch('/api/newsletters'),
                    fetch('/api/priority-keywords'),
                    fetch('/api/secrets/status'),
                    fetch('/api/stories'),
                    fetch('/api/ollama/status')
                ]);
                if (nlResp.ok) {
                    const data = await nlResp.json();
                    setSelectedNewsletters((data.newsletters || []).map((n: any) => ({ id: n.id, sender: n.sender || n.email, email: n.email || '', priority: n.priority || 5 })));
                }
                if (kwResp.ok) {
                    const d = await kwResp.json();
                    setPriorityKeywords((d.keywords || []).map((k: any) => (k.keyword || k)));
                }
                if (secResp.ok) {
                    const d = await secResp.json();
                    if (d.secrets?.google_credentials?.exists) {
                        setIsGmailConnected(true);
                    }
                }
                if (storiesResp.ok) {
                    const d = await storiesResp.json();
                    setStories(d.stories || []);
                }
                if (ollamaResp.ok) {
                    const d = await ollamaResp.json();
                    setIsModelLoaded(!!d.running);
                }
            } catch (e) {
                // ignore
            }
        };
        loadLists();
    }, []);

    // Global polling for pipeline and model status every 8 seconds
    useEffect(() => {
        const pollStatus = async () => {
            try {
                const [statusResp, ollamaResp] = await Promise.all([
                    fetch('/api/status'),
                    fetch('/api/ollama/status')
                ]);

                if (statusResp.ok) {
                    const data = await statusResp.json();
                    setPipelineStatus(data);
                    // If pipeline just finished, refresh stories
                    if (isGenerating && data.last_run?.running === false) {
                        const storiesResp = await fetch('/api/stories');
                        if (storiesResp.ok) {
                            const d = await storiesResp.json();
                            setStories(d.stories || []);
                        }
                        setIsGenerating(false);
                    }
                }

                if (ollamaResp.ok) {
                    const d = await ollamaResp.json();
                    setIsModelLoaded(!!d.running);
                }
            } catch (e) {
                console.error("Status poll failed", e);
            }
        };

        const interval = setInterval(pollStatus, 8000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleSaveNewsletters = async (newslettersToSave: Newsletter[]) => {
        try {
            const resp = await fetch('/api/newsletters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newsletters: newslettersToSave }) });
            if (!resp.ok) throw new Error('Failed to save newsletters');
            const data = await resp.json();
            alert(`Saved ${data.count || newslettersToSave.length} newsletters`);
            setSelectedNewsletters(newslettersToSave);
        } catch (e) {
            alert('Error saving newsletters: ' + (e as Error).message);
        }
    };

    const handleSavePriorityKeywords = async (keywords: string[]) => {
        try {
            const resp = await fetch('/api/priority-keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords }) });
            if (!resp.ok) throw new Error('Failed to save priority keywords');
            const data = await resp.json();
            alert(`Saved ${data.count || keywords.length} keywords`);
            setPriorityKeywords(keywords);
        } catch (e) {
            alert('Error saving keywords: ' + (e as Error).message);
        }
    };

    const handleGenerateSummary = async () => {
        if (selectedNewsletters.length === 0) {
            alert("Please add some newsletters in Settings first.");
            return;
        }
        setIsGenerating(true);
        try {
            // 1. Trigger the pipeline
            await summarizeNewsletters(selectedNewsletters);
            
            // 2. Polling is now handled by the global useEffect
        } catch (error) {
            alert("Pipeline error: " + (error as Error).message);
            setIsGenerating(false);
        }
    };

    const handleConnectAndUploadCredentials = async () => {
        // Create a file input to let the user select their Google credentials JSON
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,application/*+json';
        input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            try {
                const resp = await fetch('/api/upload-google-credentials', { method: 'POST', body: fd });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data?.error || JSON.stringify(data));
                alert('Credentials uploaded successfully. The app will use them when you run the pipeline.');
                setIsGmailConnected(true);
            } catch (err) {
                alert('Failed to upload credentials: ' + (err as Error).message);
            }
        };
        input.click();
    };

    const handleUploadToken = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,application/*+json';
        input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            try {
                const resp = await fetch('/api/upload-google-token', { method: 'POST', body: fd });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data?.error || JSON.stringify(data));
                alert('Token uploaded successfully.');
                setIsGmailConnected(true);
            } catch (err) {
                alert('Failed to upload token: ' + (err as Error).message);
            }
        };
        input.click();
    };

    const handleDeleteCredentials = async () => {
        if (!confirm('Delete stored Google credentials and token? This cannot be undone (you can re-upload later).')) return;
        try {
            const resp = await fetch('/api/delete-credentials', { method: 'POST' });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || JSON.stringify(data));
            alert('Credentials deleted: ' + (data.removed || []).join(', '));
            setIsGmailConnected(false);
        } catch (err) {
            alert('Failed to delete credentials: ' + (err as Error).message);
        }
    };
    
    const handleExport = () => {
        if(stories.length > 0) {
            const text = stories.map(s => `${s.title}\n${s.summary}`).join('\n\n');
            navigator.clipboard.writeText(text);
            alert("Stories copied to clipboard!");
        }
    };

    const renderScreen = () => {
        if (isGenerating) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Spinner size="h-16 w-16" />
                    <p className="mt-4 text-gray-600 text-lg">Generating your summary...</p>
                    <p className="text-sm text-gray-400">This may take a few minutes. Polling every 8s.</p>
                </div>
            )
        }
        switch (activeScreen) {
            case Screen.Home:
                return <HomeScreen 
                            isGmailConnected={isGmailConnected}
                            stories={stories}
                            selectedNewsletters={selectedNewsletters}
                            onNavigate={setActiveScreen}
                            onGenerate={handleGenerateSummary}
                        />;
            case Screen.Dashboard:
                return <DashboardScreen 
                            stories={stories}
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
                                                                    onConnect={handleConnectAndUploadCredentials}
                                                                    onUploadToken={handleUploadToken}
                                                                    onDeleteCredentials={handleDeleteCredentials}
                        onDisconnect={() => {
                          setIsGmailConnected(false);
                          setSelectedNewsletters([]);
                        }}
                                                        selectedNewsletters={selectedNewsletters}
                                                        onSaveNewsletters={handleSaveNewsletters}
                                                        priorityKeywords={priorityKeywords}
                                                        onSavePriorityKeywords={handleSavePriorityKeywords}
                    />
                );
            case Screen.About:
                return <AboutScreen />;
            default:
                return <HomeScreen 
                            isGmailConnected={isGmailConnected}
                            stories={stories}
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
                <AIHelperBubble isModelLoaded={isModelLoaded} summary={stories.length > 0 ? stories[0].summary : ''} />
            </main>
        </div>
    );
};

export default App;