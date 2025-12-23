import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LocalModel, ModelStatus } from '../types';
import { MOCK_MODELS } from '../constants';

const StatusIndicator: React.FC<{ status: ModelStatus }> = ({ status }) => {
    const statusInfo = {
        [ModelStatus.Running]: { color: 'bg-green-500', text: 'Running' },
        [ModelStatus.Idle]: { color: 'bg-yellow-500', text: 'Idle' },
        [ModelStatus.NotDownloaded]: { color: 'bg-gray-400', text: 'Not Downloaded' },
    };
    const currentStatus = statusInfo[status];

    return (
        <div className="flex items-center space-x-2">
            <span className={`h-2.5 w-2.5 rounded-full ${currentStatus.color}`}></span>
            <span className="text-sm text-gray-500">{currentStatus.text}</span>
        </div>
    );
};

export const ModelManagementScreen: React.FC = () => {
    const [models, setModels] = useState<LocalModel[]>([]);
    const [ollamaAvailable, setOllamaAvailable] = useState(false);
    const [serverUp, setServerUp] = useState(false);
    const [loadingModel, setLoadingModel] = useState<string | null>(null);

    const RECOMMENDED_MODELS = [
        { name: 'qwen2.5:0.5b', size: '397MB' },
        { name: 'llama3.2:1b', size: '1.3GB' },
        { name: 'phi3:mini', size: '2.3GB' },
        { name: 'mistral:latest', size: '4.1GB' },
    ];

    const fetchModels = async () => {
        try {
            const [mResp, sResp] = await Promise.all([
                fetch('/api/models'), 
                fetch('/api/ollama/status')
            ]);
            
            let downloadedModels: any[] = [];
            let runningModels: string[] = [];

            if (sResp.ok) {
                const sd = await sResp.json();
                setOllamaAvailable(!!sd.cli_available);
                setServerUp(!!sd.server_up);
                runningModels = sd.running_models || [];
            }

            if (mResp.ok) {
                const md = await mResp.json();
                downloadedModels = md.models || [];
            }

            // Merge recommended with downloaded
            const allModels: LocalModel[] = RECOMMENDED_MODELS.map((rec, idx) => {
                const downloaded = downloadedModels.find(m => m.name.startsWith(rec.name) || rec.name.startsWith(m.name));
                const isRunning = runningModels.some(rm => rm.startsWith(rec.name) || rec.name.startsWith(rm));
                
                return {
                    id: `rec-${idx}`,
                    name: rec.name,
                    size: downloaded ? downloaded.size : rec.size,
                    status: isRunning ? ModelStatus.Running : (downloaded ? ModelStatus.Idle : ModelStatus.NotDownloaded),
                    isActive: isRunning
                };
            });

            // Add any other downloaded models not in recommended
            downloadedModels.forEach((dm, idx) => {
                if (!allModels.some(am => am.name === dm.name)) {
                    const isRunning = runningModels.some(rm => rm === dm.name);
                    allModels.push({
                        id: `dl-${idx}`,
                        name: dm.name,
                        size: dm.size,
                        status: isRunning ? ModelStatus.Running : ModelStatus.Idle,
                        isActive: isRunning
                    });
                }
            });

            setModels(allModels);
        } catch (e) {
            console.error("Failed to fetch models", e);
        }
    };

    useEffect(() => { 
        fetchModels(); 
        const interval = setInterval(fetchModels, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePull = async (name: string) => {
        setLoadingModel(name);
        try {
            const resp = await fetch('/api/models/pull', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: name }) 
            });
            const data = await resp.json();
            if (!data.ok) throw new Error(data.err || 'pull failed');
            fetchModels();
        } catch (e) {
            alert('Error pulling model: ' + (e as Error).message);
        } finally { setLoadingModel(null); }
    };

    const handleRemove = async (name: string) => {
        if (!confirm(`Remove model ${name}?`)) return;
        setLoadingModel(name);
        try {
            const resp = await fetch('/api/models/remove', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: name }) 
            });
            const data = await resp.json();
            if (!data.ok) throw new Error(data.err || 'remove failed');
            fetchModels();
        } catch (e) {
            alert('Error removing model: ' + (e as Error).message);
        } finally { setLoadingModel(null); }
    };

    const handleActivate = async (name: string) => {
        setLoadingModel(name);
        try {
            const resp = await fetch('/api/models/activate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: name }) 
            });
            const data = await resp.json();
            if (!data.ok) throw new Error(data.error || 'activate failed');
            // Wait a bit for ollama ps to reflect changes
            setTimeout(fetchModels, 2000);
        } catch (e) {
            alert('Error activating model: ' + (e as Error).message);
        } finally { setLoadingModel(null); }
    };

    const handleDeactivate = async (name: string) => {
        setLoadingModel(name);
        try {
            const resp = await fetch('/api/models/deactivate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: name }) 
            });
            const data = await resp.json();
            if (!data.ok) throw new Error(data.error || 'deactivate failed');
            setTimeout(fetchModels, 1000);
        } catch (e) {
            alert('Error deactivating model: ' + (e as Error).message);
        } finally { setLoadingModel(null); }
    };
    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-1">
                <h2 className="text-3xl font-bold text-gray-900">Model Management</h2>
                <Button variant="ghost" onClick={fetchModels} disabled={!!loadingModel}>Refresh</Button>
            </div>
            <p className="text-gray-500 mb-8">Select a local AI model for generating your summaries. Models are optimized for Apple Silicon.</p>

            {!ollamaAvailable && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <strong>Ollama CLI not found.</strong> Please install Ollama from <a href="https://ollama.com" target="_blank" className="underline">ollama.com</a> and ensure it's in your PATH.
                </div>
            )}

            {ollamaAvailable && !serverUp && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
                    <strong>Ollama server is not running.</strong> Please start the Ollama application or run <code>ollama serve</code> in your terminal.
                </div>
            )}

            <div className="space-y-4">
                {models.map(model => (
                    <div key={model.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all ${model.isActive ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-800">{model.name}</h3>
                                {model.isActive && (
                                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                                <p className="text-sm text-gray-500">{model.size}</p>
                                <StatusIndicator status={model.status} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {model.status === ModelStatus.NotDownloaded ? (
                                <Button 
                                    variant="primary" 
                                    onClick={() => handlePull(model.name)} 
                                    disabled={!!loadingModel}
                                    className="text-sm"
                                >
                                    {loadingModel === model.name ? 'Pulling...' : 'Download'}
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => handleRemove(model.name)} 
                                        disabled={!!loadingModel || model.isActive}
                                        className="text-sm text-red-600 hover:bg-red-50"
                                    >
                                        {loadingModel === model.name ? '...' : 'Remove'}
                                    </Button>
                                    <Button 
                                        variant={model.isActive ? 'secondary' : 'primary'} 
                                        onClick={() => model.isActive ? handleDeactivate(model.name) : handleActivate(model.name)} 
                                        disabled={!!loadingModel}
                                        className={`text-sm min-w-[100px] ${model.isActive ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' : ''}`}
                                    >
                                        {loadingModel === model.name 
                                            ? (model.isActive ? 'Stopping...' : 'Starting...') 
                                            : (model.isActive ? 'Stop Model' : 'Activate')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-6">Note: Models up to 4B parameters supported for local performance.</p>
        </div>
    );
};