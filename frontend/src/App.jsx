import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Studio from './pages/Studio';
import Dashboard from './pages/Dashboard';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'dashboard'
  const [selectedDocId, setSelectedDocId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Đang khởi động StudySummarizer...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSelectDocument = (docId) => {
    setSelectedDocId(docId);
    setActiveTab('studio');
  };

  const handleNewDocument = () => {
    setSelectedDocId(null);
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 pb-16">
        {activeTab === 'studio' ? (
          <Studio
            selectedDocId={selectedDocId}
            onClearSelectedDoc={() => setSelectedDocId(null)}
          />
        ) : (
          <Dashboard
            onSelectDocument={handleSelectDocument}
            onNewDocument={handleNewDocument}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
