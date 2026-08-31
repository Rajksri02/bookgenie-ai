import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Plus, Clock, Edit, Trash2, Copy, Download, Search, Filter, ArrowDownUp, MoreVertical, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { bookApi } from '../../editor/api/bookApi';
import toast from 'react-hot-toast';

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

const BookCard = ({ book, onDelete, onDuplicate, onExport }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Calculate progress
  const totalChapters = book.chapters?.length || 0;
  const chaptersWithContent = book.chapters?.filter(ch => ch.content && ch.content.length > 50).length || 0;
  const progressPercent = totalChapters > 0 ? Math.round((chaptersWithContent / totalChapters) * 100) : 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col h-full relative">
      {/* Quick Actions Menu Trigger */}
      <div className="absolute top-2 right-2 z-30">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); setShowExportMenu(false); }}
          className="bg-white/90 text-slate-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
        >
          <MoreVertical size={18} />
        </button>
        
        {showMenu && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigate(`/dashboard/edit/${book._id}`); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit size={14} /> Edit
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDuplicate(book._id); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy size={14} /> Duplicate
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2"><Download size={14} /> Export</div>
                <span className="text-xs text-slate-400">▶</span>
              </button>
              {showExportMenu && (
                <div className="absolute top-0 right-full mr-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowExportMenu(false); onExport(book._id, 'pdf'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    PDF
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowExportMenu(false); onExport(book._id, 'docx'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    DOCX
                  </button>
                </div>
              )}
            </div>
            <div className="h-px bg-slate-100 my-1"></div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(book._id); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="aspect-[2/1] bg-slate-100 relative overflow-hidden rounded-t-xl">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <BookOpen size={32} className="opacity-50" />
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-lg text-slate-900 line-clamp-1" title={book.title}>{book.title || 'Untitled Book'}</h4>
          {progressPercent === 100 && (
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-1" title="Completed" />
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{book.description || book.topic || 'No description available.'}</p>
        
        {/* Progress Bar */}
        <div className="mb-4 mt-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary-500'}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(book.updatedAt || book.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><FileText size={14} /> {totalChapters} Chapters</span>
        </div>
        
        <button 
          onClick={() => navigate(`/dashboard/edit/${book._id}`)}
          className="w-full bg-slate-50 hover:bg-slate-100 text-primary-600 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
        >
          <Edit size={16} />
          Continue Editing
        </button>
      </div>
      
      {/* Click outside listener for menu - simple hack for React component */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => { setShowMenu(false); setShowExportMenu(false); }}
        />
      )}
    </div>
  );
};

export const DashboardList = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  
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
      toast.error('Failed to load books');
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

  const handleDuplicate = async (bookId) => {
    const toastId = toast.loading('Duplicating book...');
    try {
      const response = await bookApi.duplicateBook(bookId);
      toast.success('Book duplicated successfully', { id: toastId });
      setBooks([response.data.data, ...books]); // Add new book to top
    } catch (err) {
      console.error('Duplicate error', err);
      toast.error('Failed to duplicate book', { id: toastId });
    }
  };

  const handleExport = async (bookId, format) => {
    const toastId = toast.loading(`Initiating ${format.toUpperCase()} export...`);
    try {
      const response = await bookApi.exportBook(bookId, format);
      const jobId = response.data?.jobId;
      
      if (!jobId) {
        throw new Error('No job ID returned');
      }

      toast.loading('Generating document...', { id: toastId });
      
      const checkStatus = async () => {
        try {
          const statusRes = await bookApi.getExportJobStatus(jobId);
          const job = statusRes.data;
          
          if (job.status === 'completed') {
            toast.success('Export complete! Downloading...', { id: toastId });
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
            const serverUrl = baseUrl.replace('/api', '');
            
            const link = document.createElement('a');
            link.href = `${serverUrl}${job.fileUrl}`;
            link.target = '_blank';
            link.download = `export_${jobId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
          } else if (job.status === 'failed') {
            toast.error('Export failed: ' + (job.error || 'Unknown error'), { id: toastId });
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          console.error('Status check error', err);
          toast.error('Failed to check export status', { id: toastId });
        }
      };
      
      setTimeout(checkStatus, 2000);

    } catch (err) {
      console.error('Export error', err);
      toast.error('Failed to export book', { id: toastId });
    }
  };

  // Derive genres for filter
  const allGenres = useMemo(() => {
    const genres = new Set(books.map(b => b.genre).filter(Boolean));
    return ['All', ...Array.from(genres)];
  }, [books]);

  // Apply filters and sort
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        (b.title && b.title.toLowerCase().includes(query)) ||
        (b.description && b.description.toLowerCase().includes(query)) ||
        (b.topic && b.topic.toLowerCase().includes(query))
      );
    }

    // Genre Filter
    if (genreFilter !== 'All') {
      result = result.filter(b => b.genre === genreFilter);
    }

    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(b => {
        const total = b.chapters?.length || 0;
        const withContent = b.chapters?.filter(ch => ch.content && ch.content.length > 50).length || 0;
        const isComplete = total > 0 && total === withContent;
        if (statusFilter === 'Completed') return isComplete;
        if (statusFilter === 'Draft') return !isComplete;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      } else if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'mostChapters') {
        return (b.chapters?.length || 0) - (a.chapters?.length || 0);
      }
      return 0;
    });

    return result;
  }, [books, searchQuery, genreFilter, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Your Books</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="animate-pulse bg-slate-200 h-10 w-full sm:w-1/3 rounded-lg"></div>
           <div className="animate-pulse bg-slate-200 h-10 w-24 rounded-lg"></div>
           <div className="animate-pulse bg-slate-200 h-10 w-24 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm border border-slate-100 h-[380px] flex flex-col">
              <div className="h-40 bg-slate-200 w-full"></div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="mt-auto h-2 bg-slate-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-slate-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
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

        {/* Filters and Controls */}
        {books.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search books..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm">
                <Filter size={16} className="text-slate-400" />
                <select 
                  value={genreFilter} 
                  onChange={e => setGenreFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ArrowDownUp size={16} className="text-slate-400" />
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="recent">Recently Edited</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="mostChapters">Most Chapters</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grid or Empty State */}
        {books.length > 0 ? (
          filteredAndSortedBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBooks.map(book => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  onDelete={handleDelete} 
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 mb-2">No books match your filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setGenreFilter('All'); setStatusFilter('All'); }}
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Create your first ebook</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">You haven't generated any books yet. Start by generating an AI-powered outline in seconds.</p>
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
