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

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  
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
        {children}
      </div>
    </div>
  );
};

const DashboardList = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const response = await bookApi.getBooks();
      setBooks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book? All associated chapters will also be deleted. This cannot be undone.')) {
      try {
        await bookApi.deleteBook(bookId);
        toast.success('Book deleted successfully');
        setBooks(books.filter(b => b._id !== bookId));
      } catch (err) {
        console.error('Delete error', err);
        toast.error('Failed to delete book');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mt-8">
          <div className="animate-pulse flex flex-col space-y-4 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Your Books</h3>
          <Link 
            to="/dashboard/new"
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Create New Book
          </Link>
        </div>

        {books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <div key={book._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full relative">
                <button 
                  onClick={() => handleDelete(book._id)}
                  className="absolute top-2 right-2 z-10 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Delete Book"
                >
                  <Trash2 size={16} />
                </button>
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
                    onClick={() => navigate(`/dashboard/edit/${book._id}`)}
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
            <Link 
              to="/dashboard/new"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create First Book
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

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
          navigate('/dashboard/edit/new', { state: { bookContext: newBook } });
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
    if (bookId === 'new') {
      const handleNew = () => {
        // Try getting from navigation state first
        if (location.state?.bookContext) {
          setBook({
            ...location.state.bookContext.book,
            chapters: location.state.bookContext.chapters
          });
          setIsLoading(false);
          return;
        }
        
        // Fallback: check localStorage
        const draft = localStorage.getItem('bookgenie_draft');
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
      };
      
      handleNew();
    } else {
      // Fetch existing book from API
      bookApi.getBooks().then(res => {
        const found = (res.data || []).find(b => b._id === bookId);
        if (found) {
          setBook(found);
        } else {
          navigate('/dashboard', { replace: true });
        }
        setIsLoading(false);
      }).catch(() => {
        navigate('/dashboard', { replace: true });
      });
    }
  }, [bookId, navigate, location.state]);

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
