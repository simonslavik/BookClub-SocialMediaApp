import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from '@context/index';
import { FiX } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import ForgotPasswordModal from './ForgotPasswordModal';
import logger from '@utils/logger';

const Login = ({ onClose, onSwitchToRegister }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useContext(AuthContext);

    // Lock body scroll while modal is open
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, []);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const validate = () => {
        const errs = [];
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.push('Valid email is required');
        if (!formData.password || formData.password.length < 8) errs.push('Password must be at least 8 characters');
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear previous errors/messages while the user edits
        setMessage('');
        setErrors([]);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const v = validate();
        if (v.length) {
            setErrors(v);
            return;
        }
        setErrors([]);
        setLoading(true);
        try {
            const res = await axios.post('/v1/auth/login', formData);
            
            logger.debug('Login response:', res.data);
            
            // Extract token, refreshToken, and user from response
            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken || res?.data?.token;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;
            
            logger.debug('Extracted data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });
            
            if (!accessToken || !user) {
                logger.error('Missing required data - accessToken:', !!accessToken, 'user:', !!user);
                setErrors(['Login succeeded but received incomplete data from server']);
                return;
            }
            
            setAuth({ 
                token: accessToken,
                refreshToken: refreshToken,
                user: user
            });
            
            onClose && onClose();
            window.location.reload();
        } catch (err) {
            const respMsg = err?.response?.data?.message;
            const respErrors = err?.response?.data?.errors;
            if (respErrors && Array.isArray(respErrors)) setErrors(respErrors);
            else setErrors([respMsg || 'Login failed']);
        } finally {
            setLoading(false);
        }
    };

    // Handle Google OAuth login
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setErrors([]);
        setMessage('');
        
        try {
            const res = await axios.post('/v1/auth/google', {
                credential: credentialResponse.credential
            });

            logger.debug('Google login response:', res.data);

            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;

            logger.debug('Extracted Google data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });

            if (accessToken && user) {
                setAuth({ 
                    token: accessToken,
                    refreshToken: refreshToken,
                    user: user
                });
                
                onClose && onClose();
                window.location.reload();
            } else {
                setErrors(['Google login succeeded but received incomplete data from server']);
            }
        } catch (err) {
            const respMsg = err?.response?.data?.message;
            setErrors([respMsg || 'Google authentication failed']);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (error) => {
        logger.error('Google Sign-In error:', error);
        console.error('[Google OAuth] Login failed. Origin:', window.location.origin, 'Error:', error);
        setErrors(['Google authentication failed. Please check that popups are not blocked and try again.']);
    };

    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8' onClick={onClose}>
            <div className='bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative transition-colors duration-300 my-auto mx-4' onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <FiX size={24} />
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-block p-3 bg-stone-700 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className='text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2'>Welcome Back</h2>
                    <p className='text-gray-600 dark:text-gray-400'>Sign in to your account</p>
                </div>

                {/* Global error list */}
                {errors && errors.length > 0 && (
                    <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                        <strong className="font-semibold block mb-2">Please fix the following:</strong>
                        <ul className="list-disc list-inside space-y-1">
                            {errors.map((err, i) => (
                                <li key={i} className="text-sm">{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Informational / success message */}
                {message && (
                    <div role="status" className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input 
                            id="email"
                            name="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <input 
                            id="password"
                            name="password" 
                            type="password"
                            value={formData.password} 
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        />
                        <div className="text-right mt-1">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-stone-700 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-300"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className='w-full bg-stone-700 hover:bg-stone-800 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg mt-6'
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                {/* Google OAuth Button */}
                <div className="mt-6">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="outline"
                            size="large"
                            text="signin_with"
                            shape="rectangular"
                            width="100%"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Don't have an account?</span>
                    </div>
                </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal 
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />

                {/* Register Link */}
                <button 
                    onClick={onSwitchToRegister}
                    className='w-full border-2 border-stone-700 dark:border-stone-500 text-stone-700 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-gray-700 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02]'
                >
                    Create Account
                </button>
            </div>
        </div>
    );
};

export default Login;