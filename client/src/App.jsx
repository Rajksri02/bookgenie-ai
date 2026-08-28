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

import OutlineGenerator from './features/editor/components/OutlineGenerator';
import OutlineEditor from './features/editor/components/OutlineEditor';
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import ForgotPassword from './features/auth/components/ForgotPassword';
import ResetPassword from './features/auth/components/ResetPassword';
import { bookApi } from './features/editor/api/bookApi';
import { useEffect, useState } from 'react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await bookApi.getBooks();
        setBooks(response.data || []);
      } catch (err) {
        console.error('Failed to fetch books', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);
  
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
        {isLoading ? (
          <div className="mt-8">
            <div className="animate-pulse flex flex-col space-y-4 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-20 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ) : books.length > 0 ? (
          <div className="mt-8">
            <OutlineEditor 
              initialOutline={books[0]} 
              onStartOver={() => setBooks([])}
              bookContext={books[0]}
            />
          </div>
        ) : (
          <div className="mt-8">
            <OutlineGenerator onGenerate={(newBook) => setBooks([newBook])} />
          </div>
        )}
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
