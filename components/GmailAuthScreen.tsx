import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { MOCK_NEWSLETTERS } from '../constants';
import { Newsletter } from '../types';
import { Spinner } from './Spinner';

interface GmailAuthScreenProps {
  onProceed: (selected: Newsletter[]) => void;
}

export const GmailAuthScreen: React.FC<GmailAuthScreenProps> = ({ onProceed }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedNewsletters, setSelectedNewsletters] = useState<Set<string>>(new Set());

  const handleAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setIsAuthenticated(true);
    }, 1500);
  };

  const handleSelect = (id: string) => {
    const newSelection = new Set(selectedNewsletters);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNewsletters(newSelection);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNewsletters(new Set(MOCK_NEWSLETTERS.map(n => n.id)));
    } else {
      setSelectedNewsletters(new Set());
    }
  };

  const handleProceed = () => {
    const selected = MOCK_NEWSLETTERS.filter(n => selectedNewsletters.has(n.id));
    onProceed(selected);
  };
  
  const allSelected = selectedNewsletters.size === MOCK_NEWSLETTERS.length && MOCK_NEWSLETTERS.length > 0;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
            {isAuthenticating ? (
                <>
                    <Spinner size="h-12 w-12 mx-auto"/>
                    <p className="mt-4 text-gray-600">Connecting to Gmail...</p>
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Connect Your Gmail Account</h2>
                    <p className="text-gray-500 mb-6">We need read-only access to identify your newsletters. Your credentials are never stored.</p>
                    <Button onClick={handleAuth}>Login with Gmail</Button>
                </>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Select Newsletters</h2>
            <div className="group relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    Select the newsletters you want to include in your summaries.
                </div>
            </div>
        </div>
        <p className="text-gray-500 mb-6">Choose the newsletters you want summarized. You can select as many as you like.</p>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <Checkbox 
            id="select-all"
            label={<span className="font-semibold text-gray-800">Select All</span>}
            checked={allSelected}
            onChange={handleSelectAll}
          />
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {MOCK_NEWSLETTERS.map(newsletter => (
            <div key={newsletter.id} className="bg-gray-100 p-3 rounded-lg border border-gray-200">
              <Checkbox
                id={newsletter.id}
                label={
                  <div>
                    <span className="font-medium text-gray-800">{newsletter.sender}</span>
                    <span className="block text-sm text-gray-500">{newsletter.email}</span>
                  </div>
                }
                checked={selectedNewsletters.has(newsletter.id)}
                onChange={() => handleSelect(newsletter.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 text-right">
          <Button onClick={handleProceed} disabled={selectedNewsletters.size === 0}>
            Next: Set summary preferences
          </Button>
        </div>
      </div>
    </div>
  );
};