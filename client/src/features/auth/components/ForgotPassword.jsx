import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await authApi.forgotPassword(email);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.error?.message || err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm font-medium text-green-800">
                Check your email (and spam folder) for a reset link.
              </p>
            </div>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 inline-block">
              Return to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  status === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {status === 'loading' ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
            
            <div className="text-center">
              <Link to="/login" className="font-medium text-sm text-gray-600 hover:text-gray-900">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
