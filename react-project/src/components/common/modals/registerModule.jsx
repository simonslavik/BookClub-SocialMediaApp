import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import AuthContext from '../../../context';
import { FiX } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';

const RegisterModule = ({ onClose, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const { setAuth } = useContext(AuthContext);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const validate = () => {
        const errs = [];
        if (!form.name || form.name.trim().length < 3) errs.push('Name must be at least 3 characters');
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Valid email is required');
        
        // Enhanced password validation
        if (!form.password || form.password.length < 8) {
            errs.push('Password must be at least 8 characters');
        } else {
            if (!/[A-Z]/.test(form.password)) errs.push('Password must contain at least one uppercase letter');
            if (!/[a-z]/.test(form.password)) errs.push('Password must contain at least one lowercase letter');
            if (!/[0-9]/.test(form.password)) errs.push('Password must contain at least one number');
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.push('Password must contain at least one special character');
        }
        
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear previous messages/errors when user edits fields
        setMessage('');
        setErrors([]);
        setForm(prev => ({ ...prev, [name]: value }));
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
            const res = await axios.post('/v1/auth/register', form);
            
            console.log('Register response:', res.data);
            
            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken || res?.data?.token;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;
            
            console.log('Extracted register data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });
            
            if (!accessToken || !user) {
                console.error('Missing required data - accessToken:', !!accessToken, 'user:', !!user);
                setErrors(['Registration succeeded but received incomplete data from server']);
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
            else setMessage(respMsg || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Handle Google OAuth registration (same endpoint as login)
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setErrors([]);
        setMessage('');
        
        try {
            const res = await axios.post('/v1/auth/google', {
                credential: credentialResponse.credential
            });

            console.log('Google register response:', res.data);

            // Handle both nested and direct response formats
            const responseData = res?.data?.data || res?.data;
            const accessToken = responseData?.accessToken || res?.data?.accessToken;
            const refreshToken = responseData?.refreshToken || res?.data?.refreshToken;
            const user = responseData?.user || res?.data?.user;

            console.log('Extracted Google register data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });

            if (accessToken && user) {
                setAuth({ 
                    token: accessToken,
                    refreshToken: refreshToken,
                    user: user
                });
                
                onClose && onClose();
                window.location.reload();
            } else {
                setErrors(['Google registration succeeded but received incomplete data from server']);
            }
        } catch (err) {
            const respMsg = err?.response?.data?.message;
            setErrors([respMsg || 'Google registration failed']);
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
                <div className="mb-2 text-center">
                    <h2 className='text-3xl font-bold text-gray-800 mb-2'>Create Account</h2>
                    <p className='text-gray-600'>Join our bookclub community</p>
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

                <form onSubmit={handleSubmit} className="space-y-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input 
                            id="name"
                            name="name" 
                            value={form.name} 
                            onChange={handleChange} 
                            placeholder="Enter your username" 
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none'
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input 
                            id="email"
                            name="email" 
                            type="email"
                            value={form.email} 
                            onChange={handleChange} 
                            placeholder="email@example.com" 
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none'
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
                            value={form.password} 
                            onChange={handleChange} 
                            placeholder="Choose a strong password" 
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none'
                        />
                        
                        {/* Password Requirements */}
                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-600">Password must contain:</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${form.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs ${form.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                                    At least 8 characters
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs ${/[A-Z]/.test(form.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                    One uppercase letter
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs ${/[a-z]/.test(form.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                    One lowercase letter
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs ${/[0-9]/.test(form.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                    One number
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                    One special character (!@#$%^&*...)
                                </span>
                            </div>
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
                                Creating account...
                            </span>
                        ) : 'Create Account'}
                    </button>
                </form>

                {/* Google OAuth Button */}
                <div className="mt-6">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="outline"
                            size="large"
                            text="signup_with"
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
                        <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                    </div>
                </div>

                {/* Login Link */}
                <button 
                    onClick={onSwitchToLogin}
                    className='w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02]'
                >
                    Sign In
                </button>
            </div>
        </div>
    );
};

export default RegisterModule;