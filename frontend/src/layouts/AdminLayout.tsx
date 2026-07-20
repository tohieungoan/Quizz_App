import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header as AdminHeader } from './AdminHeader';
import { Footer } from './Footer';
import { ViewState } from '../types';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (view: ViewState, context?: any) => {
    if (view === 'quiz-creator') {
      if (context && context.id) navigate(`/admin/quizzes/edit/${context.id}`, { state: context });
      else navigate(`/admin/quizzes/create`);
    } else if (view === 'reports' && context && (context.roomId || context.id)) {
      navigate(`/admin/reports/${context.roomId || context.id}`, { state: context });
    } else if (view === 'live-rooms') {
      navigate(`/admin/rooms`);
    } else {
      navigate(`/admin/${view}`, { state: context });
    }
  };

  const currentPath = location.pathname;
  let currentView: ViewState = 'dashboard';
  if (currentPath.includes('/admin/quizzes/create') || currentPath.includes('/admin/quizzes/edit')) currentView = 'quiz-creator';
  else if (currentPath.includes('/admin/quizzes')) currentView = 'quizzes';
  else if (currentPath.includes('/admin/rooms')) currentView = 'live-rooms';
  else if (currentPath.includes('/admin/users')) currentView = 'users';
  else if (currentPath.includes('/admin/reports')) currentView = 'reports';
  else if (currentPath.includes('/admin/notifications')) currentView = 'notifications';
  else if (currentPath.includes('/admin/settings')) currentView = 'settings';

  return (
    <div className="antialiased min-h-screen flex text-on-surface bg-surface-bright font-sans flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
          <AdminHeader 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            onNavigate={handleNavigate} 
          />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
