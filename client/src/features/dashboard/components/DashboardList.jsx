import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Plus, Clock, Edit, Trash2, Copy, Download, Search, Filter, ArrowDownUp, MoreVertical, FileText, CheckCircle2, Moon, Sun, GripVertical, Activity } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { bookApi } from '../../editor/api/bookApi';
import toast from 'react-hot-toast';
import { PageWrapper } from '../../../components/PageWrapper';
import { useTheme } from '../../../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <PageWrapper className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name || 'User'}!</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard/analytics"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 font-medium"
              title="Usage Analytics"
            >
              <Activity size={18} />
              <span className="hidden sm:inline text-sm">Analytics</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {children}
      </div>
    </PageWrapper>
  );
};

const BookCard = ({ book, onDelete, onDuplicate, onExport, isDragEnabled }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book._id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };
  
  const totalChapters = book.chapters?.length || 0;
  const chaptersWithContent = book.chapters?.filter(ch => ch.content && ch.content.length > 50).length || 0;
  const progressPercent = totalChapters > 0 ? Math.round((chaptersWithContent / totalChapters) * 100) : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout={!isDragEnabled}
      className="h-full"
    >
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${isDragging ? 'border-primary-500 shadow-xl opacity-80' : 'border-slate-100 dark:border-slate-800'} hover:shadow-md transition-shadow group flex flex-col h-full relative`}
      >
      <div className="absolute top-2 right-2 z-30">
        {isDragEnabled && (
          <div 
            {...attributes}
            {...listeners}
            className="absolute -left-10 bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 p-1.5 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-800 shadow-sm cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={18} />
          </div>
        )}
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); setShowExportMenu(false); }}
          className="bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 p-1.5 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-800 shadow-sm"
        >
          <MoreVertical size={18} />
        </button>
        
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-30"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigate(`/dashboard/edit/${book._id}`); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit size={14} /> Edit
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onDuplicate(book._id); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Copy size={14} /> Duplicate
              </button>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2"><Download size={14} /> Export</div>
                  <span className="text-xs text-slate-400">▶</span>
                </button>
                {showExportMenu && (
                  <div className="absolute top-0 right-full mr-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowExportMenu(false); onExport(book._id, 'pdf'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowExportMenu(false); onExport(book._id, 'docx'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      DOCX
                    </button>
                  </div>
                )}
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(book._id); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="aspect-[2/1] bg-slate-100 dark:bg-slate-800 relative overflow-hidden rounded-t-xl">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
            <BookOpen size={32} className="opacity-50" />
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1" title={book.title}>{book.title || 'Untitled Book'}</h4>
          {progressPercent === 100 && (
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-1" title="Completed" />
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{book.description || book.topic || 'No description available.'}</p>
        
        <div className="mb-4 mt-auto">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-1.5 rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary-500'}`} 
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-4">
          <span className="flex items-center gap-1"><Clock size={14} /> {(book.updatedAt || book.createdAt) ? new Date(book.updatedAt || book.createdAt).toLocaleDateString() : 'Just now'}</span>
          <span className="flex items-center gap-1"><FileText size={14} /> {totalChapters} Chapters</span>
        </div>
        
        <button 
          onClick={() => navigate(`/dashboard/edit/${book._id}`)}
          className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-primary-600 dark:text-primary-400 font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
        >
          <Edit size={16} />
          Continue Editing
        </button>
      </div>
      
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => { setShowMenu(false); setShowExportMenu(false); }}
        />
      )}
      </div>
    </motion.div>
  );
};

export const DashboardList = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('custom');
  
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = books.findIndex(b => b._id === active.id);
      const newIndex = books.findIndex(b => b._id === over.id);

      const oldBooks = [...books];
      const newBooks = arrayMove(books, oldIndex, newIndex);
      setBooks(newBooks);

      try {
        await bookApi.reorderBooks(newBooks.map(b => b._id));
      } catch (err) {
        toast.error('Failed to save new order');
        setBooks(oldBooks);
      }
    }
  };

  const handleDelete = (bookId) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Delete Book?</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All associated chapters will be permanently deleted.</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await bookApi.deleteBook(bookId);
                toast.success('Book deleted');
                setBooks(books.filter(b => b._id !== bookId));
              } catch (err) {
                toast.error('Failed to delete book');
              }
            }}
            className="w-full border border-transparent rounded-none rounded-tr-xl p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleDuplicate = async (bookId) => {
    const toastId = toast.loading('Duplicating book...');
    try {
      const response = await bookApi.duplicateBook(bookId);
      toast.success('Book duplicated successfully', { id: toastId });
      setBooks([response.data, ...books]); // Add new book to top
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
      
      if (!jobId) throw new Error('No job ID returned');

      toast.loading('Generating document...', { id: toastId });
      
      const checkStatus = async () => {
        try {
          const statusRes = await bookApi.getExportJobStatus(jobId);
          const job = statusRes.data;
          
          if (job.status === 'completed') {
            toast.success('Export complete! Downloading...', { id: toastId });
            
            let serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
            if (serverUrl.endsWith('/api')) {
              serverUrl = serverUrl.slice(0, -4);
            }
            if (serverUrl.endsWith('/')) {
              serverUrl = serverUrl.slice(0, -1);
            }
            
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
            setTimeout(checkStatus, 1000);
          }
        } catch (err) {
          toast.error('Failed to check export status', { id: toastId });
        }
      };
      setTimeout(checkStatus, 1000);
    } catch (err) {
      toast.error('Failed to export book', { id: toastId });
    }
  };

  const allGenres = useMemo(() => {
    const genres = new Set(books.map(b => b.genre).filter(Boolean));
    return ['All', ...Array.from(genres)];
  }, [books]);

  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        (b.title && b.title.toLowerCase().includes(query)) ||
        (b.description && b.description.toLowerCase().includes(query)) ||
        (b.topic && b.topic.toLowerCase().includes(query))
      );
    }
    if (genreFilter !== 'All') result = result.filter(b => b.genre === genreFilter);
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
    result.sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'mostChapters') return (b.chapters?.length || 0) - (a.chapters?.length || 0);
      if (sortBy === 'custom') return 0;
      return 0;
    });
    return result;
  }, [books, searchQuery, genreFilter, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Books</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
           <div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-10 w-full sm:w-1/3 rounded-xl"></div>
           <div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-10 w-24 rounded-xl"></div>
           <div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-10 w-24 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 h-[380px] flex flex-col overflow-hidden"
            >
              <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse w-full"></div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-full"></div>
                <div className="mt-auto h-2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-full mb-4"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl w-full mt-auto"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Books</h3>
          <Link 
            to="/dashboard/new"
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Create New Book
          </Link>
        </div>

        {books.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search books..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-shadow"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 hidden sm:block" />
                <select 
                  value={genreFilter} 
                  onChange={e => setGenreFilter(e.target.value)}
                  className="w-full sm:w-auto bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                >
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
                <ArrowDownUp size={16} className="text-slate-400 hidden sm:block" />
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full sm:w-auto bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                >
                  <option value="custom">Custom Order</option>
                  <option value="recent">Recently Edited</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="mostChapters">Most Chapters</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {books.length > 0 ? (
          filteredAndSortedBooks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredAndSortedBooks.map(b => b._id)}
                strategy={rectSortingStrategy}
              >
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredAndSortedBooks.map(book => (
                      <BookCard 
                        key={book._id} 
                        book={book} 
                        onDelete={handleDelete} 
                        onDuplicate={handleDuplicate}
                        onExport={handleExport}
                        isDragEnabled={sortBy === 'custom' && !searchQuery && genreFilter === 'All' && statusFilter === 'All'}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No books match your filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setGenreFilter('All'); setStatusFilter('All'); }}
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create your first ebook</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">You haven't generated any books yet. Start by generating an AI-powered outline in seconds.</p>
            <Link 
              to="/dashboard/new"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create First Book
            </Link>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
