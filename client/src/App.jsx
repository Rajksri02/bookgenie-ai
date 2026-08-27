import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

// Temporary components for routing demonstration
const HomePage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">BookGenie AI</h1>
      <p className="text-lg text-gray-600 mb-8">AI-assisted ebook generation platform.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Login
        </Link>
        <Link to="/dashboard" className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const { login } = useAuth();
  
  // Minimal login form logic for now
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <p className="text-gray-600 mb-4">Login UI goes here</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    </div>
  );
};

import OutlineGenerator from './features/editor/components/OutlineGenerator';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}!</p>
          </div>
          <button 
            onClick={logout}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        
        {/* Mount OutlineGenerator for Phase 5 Testing */}
        <div className="mt-8">
          <OutlineGenerator />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          
          {/* Temporarily unprotected for Phase 5 Testing */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Real dashboard will go back here later */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
