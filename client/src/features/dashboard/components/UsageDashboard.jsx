import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../../components/PageWrapper';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Zap, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const UsageDashboard = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const result = await analyticsApi.getUsageStats();
        setData(result);
      } catch (error) {
        toast.error('Failed to load analytics data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsage();
  }, []);

  const totalTokens = data.reduce((acc, curr) => acc + (curr.totalTokens || 0), 0);
  const totalGenerations = data.reduce((acc, curr) => acc + (curr.generate_chapter || 0) + (curr.generate_outline || 0), 0);
  const totalChecks = data.reduce((acc, curr) => acc + (curr.consistency_check || 0), 0);

  return (
    <PageWrapper className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Link 
              to="/dashboard"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors w-fit mb-2"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Usage Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track your AI usage over the last 30 days.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Tokens Used</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalTokens.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Content Generations</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalGenerations.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Consistency Checks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalChecks.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Daily Token Usage</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" name="Tokens Used" dataKey="totalTokens" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actions Breakdown</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar name="Chapters Generated" dataKey="generate_chapter" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                    <Bar name="Consistency Checks" dataKey="consistency_check" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default UsageDashboard;
