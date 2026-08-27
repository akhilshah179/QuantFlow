import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { wsClient } from '../websocket/wsClient';

export const MainLayout: React.FC = () => {
  useEffect(() => {
    wsClient.connect();
    return () => {
      // Keep WS connected during page transitions
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#131722] flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#f8f9fd]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
