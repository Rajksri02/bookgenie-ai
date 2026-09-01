import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider } from './features/auth/hooks/useAuth';
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
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './components/PageWrapper';

const HomePage = () => (
  <PageWrapper className="flex flex-col items-center justify-center bg-slate-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">BookGenie AI</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">AI-assisted ebook generation platform.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/login" className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm">
          Login
        </Link>
        <Link to="/dashboard" className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-primary-400 text-primary-600 border border-slate-200 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          Go to Dashboard
        </Link>
      </div>
    </div>
  </PageWrapper>
);

const DashboardNew = () => {
  const navigate = useNavigate();
  return (
    <PageWrapper className="p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Link 
          to="/dashboard"
          className="mb-6 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors w-fit"
        >
          &larr; Back to Dashboard
        </Link>
        <OutlineGenerator onGenerate={(newBook) => {
          const bookId = newBook._id || newBook.book?._id || 'new';
          navigate(`/dashboard/edit/${bookId}`, { state: { bookContext: newBook } });
        }} />
      </div>
    </PageWrapper>
  );
};

const DashboardEdit = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = async () => {
      if (bookId === 'new') {
        const draft = localStorage.getItem('bookgenie_draft_new');
        if (draft) {
          const parsed = JSON.parse(draft);
          setBook({
            ...parsed.metadata,
            chapters: parsed.chapters
          });
          setIsLoading(false);
        } else {
          navigate('/dashboard/new', { replace: true });
        }
      } else {
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

  if (isLoading) return <PageWrapper className="p-8 bg-slate-50 flex justify-center items-center"><div className="animate-pulse dark:text-slate-400">Loading...</div></PageWrapper>;
  if (!book) return null;

  return (
    <PageWrapper className="p-4 sm:p-8 bg-slate-50">
      <Link 
        to="/dashboard"
        className="max-w-4xl mx-auto block mb-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors w-fit"
      >
        &larr; Back to Dashboard
      </Link>
      <OutlineEditor 
        initialOutline={book} 
        onStartOver={() => navigate('/dashboard/new', { replace: true })}
        bookContext={book}
      />
    </PageWrapper>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardList />} />
          <Route path="/dashboard/new" element={<DashboardNew />} />
          <Route path="/dashboard/edit/:bookId" element={<DashboardEdit />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            borderRadius: '1rem',
            background: theme === 'dark' ? '#1e293b' : '#333',
            color: '#fff',
            border: theme === 'dark' ? '1px solid #334155' : 'none',
          },
        }} 
      />
      <AnimatedRoutes />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
