import React, { useState } from 'react';
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
    const [models, setModels] = useState<LocalModel[]>(MOCK_MODELS);

    const handleActivate = (id: string) => {
        setModels(models.map(model => 
            model.id === id 
            ? { ...model, isActive: true, status: ModelStatus.Running } 
            : { ...model, isActive: false, status: model.status === ModelStatus.Running ? ModelStatus.Idle : model.status }
        ));
    };

    const handleDeactivate = (id: string) => {
        setModels(models.map(model => 
            model.id === id 
            ? { ...model, isActive: false, status: ModelStatus.Idle } 
            : model
        ));
    };

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-1 text-gray-900">Model Management</h2>
            <p className="text-gray-500 mb-8">Select a local AI model for generating your summaries. Models are optimized for Apple Silicon.</p>

            <div className="space-y-4">
                {models.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{model.name}</h3>
                            <div className="flex items-center space-x-4">
                                <p className="text-sm text-gray-500">{model.size}</p>
                                <StatusIndicator status={model.status} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {model.status === ModelStatus.NotDownloaded ? (
                                <Button variant="secondary">Download</Button>
                            ) : model.isActive ? (
                                <Button variant="secondary" onClick={() => handleDeactivate(model.id)}>Deactivate</Button>
                            ) : (
                                <Button variant="primary" onClick={() => handleActivate(model.id)}>Activate</Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-6">Note: Models up to 4B parameters supported for local performance.</p>
        </div>
    );
};