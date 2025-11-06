
import React, { useState } from 'react';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { SummaryPreferences } from '../types';

interface PreferencesScreenProps {
  initialPrefs: SummaryPreferences;
  onSave: (prefs: SummaryPreferences) => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ initialPrefs, onSave }) => {
  const [prefs, setPrefs] = useState<SummaryPreferences>(initialPrefs);

  const handleSave = () => {
    onSave(prefs);
  };
  
  const RadioButton = ({ value, label }: { value: 'Daily' | 'Weekly', label: string }) => (
      <label className="flex items-center space-x-3 cursor-pointer">
          <input
              type="radio"
              name="frequency"
              value={value}
              checked={prefs.frequency === value}
              onChange={() => setPrefs(p => ({ ...p, frequency: value }))}
              className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-500"
          />
          <span className="text-gray-300">{label}</span>
      </label>
  );

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-2 text-white">Summary Preferences</h2>
      <p className="text-gray-400 mb-8">Customize how and when you receive your summaries.</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
          <div className="flex space-x-6">
            <RadioButton value="Daily" label="Daily" />
            <RadioButton value="Weekly" label="Weekly" />
          </div>
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">
            Summary Time
          </label>
          <input
            type="time"
            id="time"
            value={prefs.time}
            onChange={e => setPrefs(p => ({ ...p, time: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="border-t border-gray-700 pt-6">
           <Toggle 
              label="Enable desktop notifications"
              enabled={prefs.notifications}
              onChange={enabled => setPrefs(p => ({ ...p, notifications: enabled }))}
           />
        </div>
      </div>
      
      <div className="mt-8 text-right">
        <Button onClick={handleSave}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
