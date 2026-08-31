import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import OutlineGenerator from './features/editor/components/OutlineGenerator';
import OutlineEditor from './features/editor/components/OutlineEditor';
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import ForgotPassword from './features/auth/components/ForgotPassword';
import ResetPassword from './features/auth/components/ResetPassword';
import { bookApi } from './features/editor/api/bookApi';
import { DashboardList } from './features/dashboard/components/DashboardList';
import { Toaster } from 'react-hot-toast';
import { LogOut, BookOpen, Plus, Clock, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

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



const DashboardNew = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Link 
          to="/dashboard"
          className="mb-6 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors w-fit"
        >
          &larr; Back to Dashboard
        </Link>
        <OutlineGenerator onGenerate={(newBook) => {
          const bookId = newBook._id || newBook.book?._id || 'new';
          navigate(`/dashboard/edit/${bookId}`, { state: { bookContext: newBook } });
        }} />
      </div>
    </div>
  );
};

const DashboardEdit = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = async () => {
      // Removed location.state fast-path because history state survives reloads 
      // and overwrites newer database changes (e.g. AI Cover Images, chapter content)


      if (bookId === 'new') {
        // Fallback: check localStorage for a generic draft
        const draft = localStorage.getItem('bookgenie_draft_new');
        if (draft) {
          const parsed = JSON.parse(draft);
          setBook({
            ...parsed.metadata,
            chapters: parsed.chapters
          });
          setIsLoading(false);
        } else {
          // No state and no draft, send back to generator
          navigate('/dashboard/new', { replace: true });
        }
      } else {
        // Fetch existing book from API
        try {
          const res = await bookApi.getBooks();
          const found = (res.data || []).find(b => b._id === bookId);
          if (found) {
            setBook(found);
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          navigate('/dashboard', { replace: true });
        }
        setIsLoading(false);
      }
    };
    
    handleLoad();
  }, [bookId, navigate]);

  if (isLoading) return <div className="min-h-screen p-8 bg-slate-50 flex justify-center"><div className="animate-pulse">Loading...</div></div>;
  if (!book) return null; // Prevent crash while navigating away

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
      <Link 
        to="/dashboard"
        className="max-w-4xl mx-auto block mb-4 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors w-fit"
      >
        &larr; Back to Dashboard
      </Link>
      <OutlineEditor 
        initialOutline={book} 
        onStartOver={() => navigate('/dashboard/new', { replace: true })}
        bookContext={book}
      />
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
            <Route path="/dashboard" element={<DashboardList />} />
            <Route path="/dashboard/new" element={<DashboardNew />} />
            <Route path="/dashboard/edit/:bookId" element={<DashboardEdit />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
