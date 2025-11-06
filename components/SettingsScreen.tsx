import React, { useState } from 'react';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { Checkbox } from './Checkbox';
import { Spinner } from './Spinner';
import { SummaryPreferences, Newsletter } from '../types';
import { MOCK_NEWSLETTERS } from '../constants';

interface SettingsScreenProps {
  initialPrefs: SummaryPreferences;
  onSavePrefs: (prefs: SummaryPreferences) => void;
  isGmailConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveNewsletters: (newsletters: Newsletter[]) => void;
}

const PrioritySelector: React.FC<{ newsletterId: string; priority: number; onPriorityChange: (id: string, priority: number) => void }> = ({ newsletterId, priority, onPriorityChange }) => (
    <div className="flex items-center space-x-2">
        <label htmlFor={`priority-${newsletterId}`} className="text-sm text-gray-500">Priority:</label>
        <select
            id={`priority-${newsletterId}`}
            value={priority}
            onChange={(e) => onPriorityChange(newsletterId, parseInt(e.target.value, 10))}
            className="bg-gray-100 border-gray-300 rounded-md p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
        >
            {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>{p}</option>
            ))}
        </select>
    </div>
);


const NewsletterManager: React.FC<{ onSave: (newsletters: Newsletter[]) => void }> = ({ onSave }) => {
    const [isFetching, setIsFetching] = useState(false);
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [priorities, setPriorities] = useState<{ [key: string]: number }>({});

    const handleFetch = () => {
        setIsFetching(true);
        setTimeout(() => {
            const fetched = MOCK_NEWSLETTERS;
            setNewsletters(fetched);
            const initialPriorities: { [key: string]: number } = {};
            fetched.forEach(n => { initialPriorities[n.id] = 5; });
            setPriorities(initialPriorities);
            setSelectedIds(new Set(fetched.map(n => n.id)));
            setIsFetching(false);
        }, 1500);
    };

    const handleSelect = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) { newSelection.delete(id); } else { newSelection.add(id); }
        setSelectedIds(newSelection);
    };
    
    const handlePriorityChange = (id: string, priority: number) => {
        setPriorities(prev => ({ ...prev, [id]: priority }));
    };

    const handleSaveSelection = () => {
        const selectedWithPriorities: Newsletter[] = newsletters
            .filter(n => selectedIds.has(n.id))
            .map(n => ({ ...n, priority: priorities[n.id] || 5 }));
        onSave(selectedWithPriorities);
    };

    if (newsletters.length === 0) {
        return (
            <div className="text-center p-4">
                <Button onClick={handleFetch} disabled={isFetching}>
                    {isFetching ? <span className="flex items-center"><Spinner size="h-5 w-5 mr-2" /> Fetching...</span> : 'Fetch & Select Newsletters'}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-4">
             <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border-t border-b border-gray-200 py-4">
                {newsletters.map(newsletter => (
                    <div key={newsletter.id} className={`p-3 rounded-lg border transition-colors ${selectedIds.has(newsletter.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                            <Checkbox
                                id={`nl-${newsletter.id}`}
                                label={
                                    <div>
                                        <span className="font-medium text-gray-800">{newsletter.sender}</span>
                                        <span className="block text-sm text-gray-500">{newsletter.email}</span>
                                    </div>
                                }
                                checked={selectedIds.has(newsletter.id)}
                                onChange={() => handleSelect(newsletter.id)}
                            />
                            {selectedIds.has(newsletter.id) && (
                                <PrioritySelector newsletterId={newsletter.id} priority={priorities[newsletter.id]} onPriorityChange={handlePriorityChange} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-right">
                <Button onClick={handleSaveSelection} disabled={selectedIds.size === 0}>Save Selection</Button>
            </div>
        </div>
    );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ initialPrefs, onSavePrefs, isGmailConnected, onConnect, onDisconnect, onSaveNewsletters }) => {
  const [prefs, setPrefs] = useState<SummaryPreferences>(initialPrefs);

  const handleSave = () => {
    onSavePrefs(prefs);
  };
  
  const RadioButton = ({ value, label }: { value: 'Daily' | 'Weekly', label: string }) => (
      <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
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
      <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Account</h2>
        <p className="text-gray-500 mb-6">Connect your Gmail account to start summarizing newsletters.</p>
        
        {isGmailConnected ? (
             <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                <div>
                    <p className="font-medium text-gray-800">Gmail Account</p>
                    <p className="text-sm text-gray-500">Connected</p>
                </div>
                <Button variant="danger" onClick={onDisconnect}>Disconnect</Button>
            </div>
        ) : (
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4">Upload your credentials to securely connect your account. Your data remains local.</p>
                <Button onClick={onConnect}>Connect with Gmail</Button>
            </div>
        )}
      </div>

      {/* Newsletter Management */}
      {isGmailConnected && (
        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">Manage Newsletters</h2>
            <p className="text-gray-500 mb-6">Choose which newsletters to include in your summaries and set their importance.</p>
            <NewsletterManager onSave={onSaveNewsletters} />
        </div>
      )}

      {/* Summary Preferences */}
      <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200">
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
