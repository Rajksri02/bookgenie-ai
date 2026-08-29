import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

// Temporary components for routing demonstration
const HomePage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">BookGenie AI</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">AI-assisted ebook generation platform.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/login" className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm">
          Login
        </Link>
        <Link to="/dashboard" className="bg-white text-primary-600 border border-slate-200 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
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
import { Toaster } from 'react-hot-toast';
import { LogOut, BookOpen, Plus, Clock, Edit } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'editor', 'generator'
  const [activeBook, setActiveBook] = useState(null);

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
  
  const handleStartNew = () => {
    setActiveBook(null);
    setCurrentView('generator');
  };

  const handleEditBook = (book) => {
    setActiveBook(book);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setActiveBook(null);
    setCurrentView('dashboard');
    // Re-fetch books in case of changes
    setIsLoading(true);
    bookApi.getBooks().then(res => {
      setBooks(res.data || []);
      setIsLoading(false);
    });
  };

  if (currentView === 'generator') {
    return (
      <div className="min-h-screen p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={handleBackToDashboard}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
          <OutlineGenerator onGenerate={(newBook) => {
            setActiveBook(newBook);
            setCurrentView('editor');
          }} />
        </div>
      </div>
    );
  }

  if (currentView === 'editor' && activeBook) {
    return (
      <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
        <button 
          onClick={handleBackToDashboard}
          className="max-w-4xl mx-auto block mb-4 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
        >
          &larr; Back to Dashboard
        </button>
        <OutlineEditor 
          initialOutline={activeBook} 
          onStartOver={handleStartNew}
          bookContext={activeBook}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            <p className="text-slate-500 mt-1">Welcome back, {user?.name || 'User'}!</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium px-4 py-2 hover:bg-slate-50 rounded-lg"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8">
            <div className="animate-pulse flex flex-col space-y-4 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Your Books</h3>
              <button 
                onClick={handleStartNew}
                className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Create New Book
              </button>
            </div>

            {books.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map(book => (
                  <div key={book._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                    <div className="aspect-[2/1] bg-slate-100 relative overflow-hidden">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                          <BookOpen size={32} className="opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{book.title || 'Untitled Book'}</h4>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{book.description || book.topic || 'No description available.'}</p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(book.updatedAt || book.createdAt).toLocaleDateString()}</span>
                        <span>{book.chapters?.length || 0} Chapters</span>
                      </div>
                      
                      <button 
                        onClick={() => handleEditBook(book)}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-primary-600 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
                      >
                        <Edit size={16} />
                        Continue Editing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                  <BookOpen size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No books yet</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">You haven't generated any books. Get started by creating your first AI-generated outline!</p>
                <button 
                  onClick={handleStartNew}
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create First Book
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            borderRadius: '1rem',
            background: '#333',
            color: '#fff',
          },
        }} 
      />
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
