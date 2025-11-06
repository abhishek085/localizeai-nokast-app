import React from 'react';
import { Screen } from '../types';

interface SidebarProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
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
  // Fix: Explicitly set the icon's props type to `any`. This resolves an error
  // on line 32 where TypeScript couldn't verify that `className` was a valid
  // prop for the cloned element.
  icon: React.ReactElement<any>;
}> = ({ screen, activeScreen, setScreen, children, icon }) => {
  const isActive = activeScreen === screen;
  return (
    <button
      onClick={() => setScreen(screen)}
      className={`flex items-center w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {React.cloneElement(icon, { className: 'h-5 w-5 mr-3 flex-shrink-0' })}
      <span className="font-medium text-sm">{children}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setScreen }) => {
  return (
    <aside className="w-64 bg-gray-100/80 border-r border-gray-200 p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center space-x-2 mb-8 px-2">
        <AppLogo className="h-7 w-7 text-blue-600" />
        <h1 className="text-base font-bold text-gray-800">LocalizeAI by Nokast</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavItem 
          screen={Screen.Dashboard} 
          activeScreen={activeScreen} 
          setScreen={setScreen}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
        >
          Dashboard
        </NavItem>
        <NavItem 
          screen={Screen.ModelManagement} 
          activeScreen={activeScreen} 
          setScreen={setScreen}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
        >
          Model Management
        </NavItem>
        <NavItem 
          screen={Screen.Settings} 
          activeScreen={activeScreen} 
          setScreen={setScreen}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.554-.225 1.151-.242 1.709-.045.562.199 1.044.57 1.371 1.045.327.476.438 1.06.334 1.621l-.362 1.725a.375.375 0 00.228.396l1.053.372c.563.2 1.004.656 1.11 1.226.105.57-.023 1.171-.334 1.621a2.247 2.247 0 01-1.371 1.045c-.558.198-1.155.182-1.71-.045a2.247 2.247 0 01-1.11-1.226l-.362-1.725a.375.375 0 00-.396-.228l-1.053.372c-.563.2-1.166-.024-1.621-.334a2.247 2.247 0 01-1.045-1.371c-.198-.558-.182-1.155.045-1.71.225-.554.656-1.004 1.226-1.11l1.053-.372a.375.375 0 00.396-.228l.362-1.725z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        >
          Settings
        </NavItem>
      </nav>
      <div className="mt-auto">
        <NavItem 
          screen={Screen.About} 
          activeScreen={activeScreen} 
          setScreen={setScreen}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          About & Open Source
        </NavItem>
      </div>
    </aside>
  );
};