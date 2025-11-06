import React from 'react';
import { Screen } from '../types';

interface HeaderProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
  isOnline: boolean;
}

const AppLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

const NavItem: React.FC<{
  screen: Screen;
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
  children: React.ReactNode;
}> = ({ screen, activeScreen, setScreen, children }) => {
  const isActive = activeScreen === screen;
  return (
    <button
      onClick={() => setScreen(screen)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
};

const StatusIndicator: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
    <div className="flex items-center space-x-2">
        <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        <span className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ activeScreen, setScreen, isOnline }) => {
  const screens: { screen: Screen; label: string }[] = [
      { screen: Screen.Home, label: 'Home' },
      { screen: Screen.Dashboard, label: 'Dashboard' },
      { screen: Screen.ModelManagement, label: 'Models' },
      { screen: Screen.Settings, label: 'Settings' },
      { screen: Screen.About, label: 'About' },
  ];
  
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <AppLogo className="h-7 w-7 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-800">LocalizeAI</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-2">
              {screens.map(({screen, label}) => (
                <NavItem key={screen} screen={screen} activeScreen={activeScreen} setScreen={setScreen}>
                  {label}
                </NavItem>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <StatusIndicator isOnline={isOnline} />
          </div>
        </div>
      </div>
    </header>
  );
};