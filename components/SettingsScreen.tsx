import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { WhatsAppConnect } from './WhatsAppConnect';
import { SummaryPreferences, Newsletter } from '../types';

interface SettingsScreenProps {
  initialPrefs: SummaryPreferences;
  onSavePrefs: (prefs: SummaryPreferences) => void;
  isGmailConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  selectedNewsletters: Newsletter[];
  onSaveNewsletters: (newsletters: Newsletter[]) => void;
  onUploadToken?: () => void;
  onDeleteCredentials?: () => void;
  priorityKeywords?: string[];
  onSavePriorityKeywords?: (keywords: string[]) => void;
}

const NewsletterManager: React.FC<{
    initialNewsletters: Newsletter[];
    onSave: (newsletters: Newsletter[]) => void;
}> = ({ initialNewsletters, onSave }) => {
    const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters);
    const [newNewsletterName, setNewNewsletterName] = useState('');
    const [newNewsletterEmail, setNewNewsletterEmail] = useState('');

    const handleAdd = () => {
        if (newNewsletterName.trim() === '' || newNewsletterEmail.trim() === '') {
            alert("Please enter both a name and an email address.");
            return;
        }
        const newNewsletter: Newsletter = {
            id: Date.now().toString(),
            sender: newNewsletterName.trim(),
            email: newNewsletterEmail.trim().toLowerCase(),
            priority: 5,
        };
        setNewsletters([...newsletters, newNewsletter]);
        setNewNewsletterName('');
        setNewNewsletterEmail('');
    };
    
    const handleRemove = (id: string) => {
        setNewsletters(newsletters.filter(nl => nl.id !== id));
    };

    const handlePriorityChange = (id: string, priority: number) => {
        setNewsletters(newsletters.map(nl => nl.id === id ? { ...nl, priority } : nl));
    };

    const handleEmailChange = (id: string, email: string) => {
        setNewsletters(newsletters.map(nl => nl.id === id ? { ...nl, email } : nl));
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                    type="text"
                    value={newNewsletterName}
                    onChange={(e) => setNewNewsletterName(e.target.value)}
                    placeholder="Newsletter Name (e.g., Tech Weekly)"
                    className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                    <input
                        type="email"
                        value={newNewsletterEmail}
                        onChange={(e) => setNewNewsletterEmail(e.target.value)}
                        placeholder="Sender Email (e.g., news@tech.com)"
                        className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button onClick={handleAdd}>Add</Button>
                </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border-t border-b border-gray-200 py-4">
                {newsletters.map(newsletter => (
                    <div key={newsletter.id} className="p-3 rounded-lg border bg-white border-gray-200">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <span className="font-medium text-gray-800">{newsletter.sender}</span>
                                <input 
                                    type="text"
                                    value={newsletter.email}
                                    onChange={(e) => handleEmailChange(newsletter.id, e.target.value)}
                                    placeholder="email@example.com"
                                    className="text-sm text-gray-500 bg-transparent border-none focus:ring-0 p-0"
                                />
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

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ initialPrefs, onSavePrefs, isGmailConnected, onConnect, onDisconnect, selectedNewsletters, onSaveNewsletters, onUploadToken, onDeleteCredentials, priorityKeywords, onSavePriorityKeywords }) => {
  const [prefs, setPrefs] = useState<SummaryPreferences>(initialPrefs);
  const [secretsStatus, setSecretsStatus] = useState<null | Record<string, { exists: boolean; path: string }>>(null);
  const [keywords, setKeywords] = useState<string[]>(priorityKeywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({
    FETCH_LIMIT: '10',
    TOP_N: '10',
    SIMILARITY_THRESHOLD: '0.85',
    OLLAMA_MODEL: 'qwen3:8b'
  });

  const fetchConfig = async () => {
    try {
      const resp = await fetch('/api/config');
      const data = await resp.json();
      if (resp.ok && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error("Failed to fetch config", e);
    }
  };

  const fetchSecretsStatus = async () => {
    // ... existing code ...
  };

  useEffect(() => {
    fetchSecretsStatus();
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (resp.ok) {
        alert("Configuration saved!");
      }
    } catch (e) {
      alert("Failed to save configuration");
    }
  };

  useEffect(() => {
    if (priorityKeywords) setKeywords(priorityKeywords);
  }, [priorityKeywords]);

  const handleAddKeyword = () => {
    const v = newKeyword.trim();
    if (!v) return;
    if (!keywords.includes(v)) setKeywords(k => [...k, v]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (k: string) => setKeywords(ks => ks.filter(x => x !== k));

  const handleSaveKeywords = async () => {
    if (!onSavePriorityKeywords) return;
    await onSavePriorityKeywords(keywords);
  };

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
                    <div className="text-xs text-gray-500 mt-1">
                      {secretsStatus ? (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <span className={`px-2 py-0.5 rounded ${secretsStatus.google_credentials?.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {secretsStatus.google_credentials?.exists ? '✓ Credentials' : '✗ Missing Credentials'}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${secretsStatus.google_token?.exists ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {secretsStatus.google_token?.exists ? '✓ Token' : '✗ Missing Token'}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${secretsStatus.env?.exists ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>.env</span>
                            <span className={`px-2 py-0.5 rounded ${secretsStatus.duckdb?.exists ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>DuckDB</span>
                          </div>
                          
                          {!secretsStatus.google_credentials?.exists && (
                            <p className="text-red-600 font-medium">
                              Please upload `Google_credentials.json` to enable Gmail fetching.
                            </p>
                          )}
                          {secretsStatus.google_credentials?.exists && !secretsStatus.google_token?.exists && (
                            <p className="text-yellow-700">
                              Credentials found. Run the pipeline once to generate the access token.
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Checking secrets...</span>
                      )}
                    </div>
                </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => onUploadToken && onUploadToken()}>Upload token</Button>
          <Button variant="danger" onClick={() => onDeleteCredentials && onDeleteCredentials()}>Delete credentials</Button>
          <Button variant="ghost" onClick={onDisconnect}>Disconnect</Button>
          <Button variant="secondary" onClick={fetchSecretsStatus}>Refresh</Button>
        </div>
            </div>
        ) : (
            <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-gray-300">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">To connect your Gmail, you must first upload your <strong>Google_credentials.json</strong> file obtained from the Google Cloud Console.</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={onConnect}>Upload Credentials</Button>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
                    <Button variant="ghost">Open Cloud Console</Button>
                  </a>
                </div>
                <p className="mt-4 text-xs text-gray-400">See README for detailed instructions on generating this file.</p>
            </div>
        )}
      </div>

      {/* WhatsApp Connection */}
      <WhatsAppConnect />

      {/* Newsletter Management */}
      {isGmailConnected && (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">Manage Newsletters</h2>
            <p className="text-gray-500 mb-6">Manually add the names of newsletters you want to include in your summaries.</p>
            <NewsletterManager initialNewsletters={selectedNewsletters} onSave={onSaveNewsletters} />
        </div>
      )}

    {/* Priority Keywords Editor */}
    {isGmailConnected && (
    <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Priority Keywords</h2>
      <p className="text-gray-500 mb-4">Keywords used to boost story scoring. Add, remove, and save your own list.</p>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {keywords.map(k => (
            <div key={k} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
              <span>{k}</span>
              <button onClick={() => handleRemoveKeyword(k)} className="text-red-500">✕</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex space-x-2 mb-4">
        <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Add keyword" className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2" />
        <Button onClick={handleAddKeyword}>Add</Button>
      </div>
      <div className="text-right">
        <Button onClick={handleSaveKeywords}>Save Keywords</Button>
      </div>
    </div>
    )}

    {/* Pipeline Configuration */}
    {isGmailConnected && (
    <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Pipeline Settings</h2>
      <p className="text-gray-500 mb-6">Fine-tune how the AI fetches and processes your newsletters.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Fetch Limit (Emails)</label>
          <input 
            type="number" 
            value={config.FETCH_LIMIT} 
            onChange={e => setConfig({...config, FETCH_LIMIT: e.target.value})}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">Max emails to fetch from Gmail per run.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Top Stories (Output)</label>
          <input 
            type="number" 
            value={config.TOP_N} 
            onChange={e => setConfig({...config, TOP_N: e.target.value})}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">Number of stories to include in the final summary.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Similarity Threshold</label>
          <input 
            type="number" 
            step="0.05"
            min="0"
            max="1"
            value={config.SIMILARITY_THRESHOLD} 
            onChange={e => setConfig({...config, SIMILARITY_THRESHOLD: e.target.value})}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">0.85 is recommended for deduplication.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Ollama Model</label>
          <input 
            type="text" 
            value={config.OLLAMA_MODEL} 
            onChange={e => setConfig({...config, OLLAMA_MODEL: e.target.value})}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">The model name to use for extraction.</p>
        </div>
      </div>
      <div className="mt-6 text-right">
        <Button onClick={handleSaveConfig}>Save Pipeline Settings</Button>
      </div>
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