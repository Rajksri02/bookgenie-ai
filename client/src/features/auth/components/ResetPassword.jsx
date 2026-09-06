import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { setMemoryToken } from '../../../lib/apiClient';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(true);
      setTimeout(() => setShowPassword(false), 2000);
    } else {
      setShowConfirmPassword(true);
      setTimeout(() => setShowConfirmPassword(false), 2000);
    }
  };

  const validate = () => {
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await authApi.resetPassword(token, formData.password);
      
      // Auto-login user with returned token
      setMemoryToken(res.accessToken);
      
      // Give them a moment to see the success state
      setStatus('success');
      setTimeout(() => {
        // Trigger a hard reload to /dashboard to re-initialize useAuth completely
        window.location.href = '/dashboard';
      }, 1500);

    } catch (err) {
      if (err.error?.details && err.error.details.length > 0) {
        setErrorMsg(err.error.details[0].message);
      } else {
        setErrorMsg(err.error?.message || err.message || 'Invalid or expired token.');
      }
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new strong password below.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm font-medium text-green-800">
                Password updated successfully! Logging you in...
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters and contain 1 uppercase letter, 1 lowercase letter, and 1 number.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  status === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {status === 'loading' ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
            
            <div className="text-center">
              <Link to="/login" className="font-medium text-sm text-gray-600 hover:text-gray-900">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
