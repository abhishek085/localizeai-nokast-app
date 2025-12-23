import React from 'react';
import { Button } from './Button';

const AppLogo: React.FC<{ className?: string }> = ({ className }) => (
    <img src="/logo.png" alt="Nokast Logo" className={className} onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<svg xmlns="http://www.w3.org/2000/svg" class="' + className + '" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>');
    }} />
);

const BulletPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start space-x-3">
        <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-gray-600">{children}</span>
    </li>
);

interface WelcomeScreenProps {
  onConnect: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onConnect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-lg w-full bg-white p-10 rounded-2xl shadow-lg border border-gray-200 text-center">
        <AppLogo className="h-16 w-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Nokast</h1>
        <p className="text-lg text-gray-500 mb-8">
          Your personal newsletter summarizer that puts privacy first.
        </p>
        
        <ul className="space-y-4 text-left mb-10">
            <BulletPoint>Connect your Gmail and enjoy daily or weekly summaries.</BulletPoint>
            <BulletPoint>All processing happens locally — your data never leaves your Mac.</BulletPoint>
            <BulletPoint>Summaries are generated and deleted automatically for your peace of mind.</BulletPoint>
        </ul>
        
        <Button onClick={onConnect} className="w-full py-3 text-base">
          Connect Gmail
        </Button>
      </div>
    </div>
  );
};