import React, { useState } from 'react';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { SummaryPreferences, Newsletter } from '../types';

interface SettingsScreenProps {
  initialPrefs: SummaryPreferences;
  onSavePrefs: (prefs: SummaryPreferences) => void;
  isGmailConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  selectedNewsletters: Newsletter[];
  onSaveNewsletters: (newsletters: Newsletter[]) => void;
}

const NewsletterManager: React.FC<{
    initialNewsletters: Newsletter[];
    onSave: (newsletters: Newsletter[]) => void;
}> = ({ initialNewsletters, onSave }) => {
    const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters);
    const [newNewsletterName, setNewNewsletterName] = useState('');

    const handleAdd = () => {
        if (newNewsletterName.trim() === '') return;
        const newNewsletter: Newsletter = {
            id: Date.now().toString(),
            sender: newNewsletterName.trim(),
            email: '', // Not needed for manual entry
            priority: 5,
        };
        setNewsletters([...newsletters, newNewsletter]);
        setNewNewsletterName('');
    };
    
    const handleRemove = (id: string) => {
        setNewsletters(newsletters.filter(nl => nl.id !== id));
    };

    const handlePriorityChange = (id: string, priority: number) => {
        setNewsletters(newsletters.map(nl => nl.id === id ? { ...nl, priority } : nl));
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={newNewsletterName}
                    onChange={(e) => setNewNewsletterName(e.target.value)}
                    placeholder="Enter newsletter name (e.g., Tech Weekly)"
                    className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button onClick={handleAdd}>Add</Button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border-t border-b border-gray-200 py-4">
                {newsletters.map(newsletter => (
                    <div key={newsletter.id} className="p-3 rounded-lg border bg-white border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium text-gray-800">{newsletter.sender}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-500">Priority:</label>
                                    <select
                                        value={newsletter.priority}
                                        onChange={(e) => handlePriorityChange(newsletter.id, parseInt(e.target.value, 10))}
                                        className="bg-gray-100 border-gray-300 rounded-md p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={() => handleRemove(newsletter.id)} className="text-red-500 hover:text-red-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-right">
                <Button onClick={() => onSave(newsletters)}>Save Selection</Button>
            </div>
        </div>
    );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ initialPrefs, onSavePrefs, isGmailConnected, onConnect, onDisconnect, selectedNewsletters, onSaveNewsletters }) => {
  const [prefs, setPrefs] = useState<SummaryPreferences>(initialPrefs);

  const handleSave = () => {
    onSavePrefs(prefs);
    alert("Preferences saved!");
  };
  
  const RadioButton = ({ value, label }: { value: 'Daily' | 'Weekly', label: string }) => (
      <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 bg-white">
          <input
              type="radio"
              name="frequency"
              value={value}
              checked={prefs.frequency === value}
              onChange={() => setPrefs(p => ({ ...p, frequency: value }))}
              className="form-radio h-4 w-4 text-blue-600 bg-gray-100 border-gray-200 focus:ring-blue-500"
          />
          <span className="text-gray-700">{label}</span>
      </label>
  );

  return (
    <div className="p-10 max-w-3xl mx-auto space-y-10">

      {/* Account Settings */}
      <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Account</h2>
        <p className="text-gray-500 mb-6">Connect your Gmail account to start summarizing newsletters.</p>
        
        {isGmailConnected ? (
             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-gray-200">
                <div>
                    <p className="font-medium text-gray-800">Gmail Account</p>
                    <p className="text-sm text-green-600">Connected</p>
                </div>
                <Button variant="danger" onClick={onDisconnect}>Disconnect</Button>
            </div>
        ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4">Upload your credentials to securely connect your account. Your data remains local.</p>
                <Button onClick={onConnect}>Connect with Gmail</Button>
            </div>
        )}
      </div>

      {/* Newsletter Management */}
      {isGmailConnected && (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">Manage Newsletters</h2>
            <p className="text-gray-500 mb-6">Manually add the names of newsletters you want to include in your summaries.</p>
            <NewsletterManager initialNewsletters={selectedNewsletters} onSave={onSaveNewsletters} />
        </div>
      )}

      {/* Summary Preferences */}
      <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Summary Preferences</h2>
        <p className="text-gray-500 mb-8">Customize how and when you receive your summaries.</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Frequency</label>
            <div className="flex space-x-4">
              <RadioButton value="Daily" label="Daily" />
              <RadioButton value="Weekly" label="Weekly" />
            </div>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-600 mb-2">
              Summary Time
            </label>
            <input
              type="time"
              id="time"
              value={prefs.time}
              onChange={e => setPrefs(p => ({ ...p, time: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <Toggle 
                label="Notify me"
                enabled={prefs.notifications}
                onChange={enabled => setPrefs(p => ({ ...p, notifications: enabled }))}
            />
            <p className="text-xs text-gray-500 mt-2">Enable notifications to get alerts when your summary is ready.</p>
          </div>
        </div>
        
        <div className="mt-8 text-right">
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};