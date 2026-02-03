import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from '../../../context';
import { FiX } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login = ({ onClose, onSwitchToRegister }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useContext(AuthContext);
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
            
            console.log('Login response:', res.data);
            
            // Extract token, refreshToken, and user from response
            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken || res?.data?.token;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;
            
            console.log('Extracted data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });
            
            if (!accessToken || !user) {
                console.error('Missing required data - accessToken:', !!accessToken, 'user:', !!user);
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

            console.log('Google login response:', res.data);

            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;

            console.log('Extracted Google data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });

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

    const handleGoogleError = () => {
        setErrors(['Google authentication failed. Please try again.']);
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={onClose}>
            <div className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative' onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FiX size={24} />
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-block p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className='text-3xl font-bold text-gray-800 mb-2'>Welcome Back</h2>
                    <p className='text-gray-600'>Sign in to your account</p>
                </div>

                {/* Global error list */}
                {errors && errors.length > 0 && (
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
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
                    <div role="status" className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input 
                            id="email"
                            name="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input 
                            id="password"
                            name="password" 
                            type="password"
                            value={formData.password} 
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                        />
                        <div className="text-right mt-1">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-purple-600 hover:text-purple-700"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg mt-6'
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
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
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
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
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
                    className='w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02]'
                >
                    Create Account
                </button>
            </div>
        </div>
    );
};

export default Login;