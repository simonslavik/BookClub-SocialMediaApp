import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@api/axios';
import AuthContext from '@context/index';
import { FiImage, FiX, FiTrash2, FiUser, FiLock } from 'react-icons/fi';
import ChangePasswordModal from '@components/common/modals/ChangePasswordModal';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

const ChangeProfilePage = () => {
    const { auth, setAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentProfileImage, setCurrentProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    const [error, setError] = useState('');
    const [deleteImage, setDeleteImage] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    // Fetch current profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth?.token) {
                navigate('/login');
                return;
            }

            try {
                const { data } = await apiClient.get(`/v1/profile/${auth.user.id}`);
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch profile');
                }

                const userData = data.data;
                setForm({ name: userData.name });
                if (userData.profileImage) {
                    setCurrentProfileImage(userData.profileImage); // Store just the path
                    setImagePreview(getProfileImageUrl(userData.profileImage)); // Display with full URL
                }
            } catch (err) {
                logger.error('Error fetching profile:', err);
                setError('Failed to load profile data');
            } finally {
                setFetchingProfile(false);
            }
        };

        fetchProfile();
    }, [auth, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setDeleteImage(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setDeleteImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!auth?.token) {
            setError('Please login to change profile');
            navigate('/login');
            return;
        }

        if (!form.name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Update user name
            const profileResponse = await apiClient.put(
                `/v1/profile`,
                { name: form.name.trim() }
            );

            let updatedImageUrl = currentProfileImage;

            // Delete image if requested
            if (deleteImage && currentProfileImage) {
                await apiClient.delete(`/v1/profile/image`);
                updatedImageUrl = null;
            }

            // Upload new profile image if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);

                const imageResponse = await apiClient.post(
                    `/v1/profile/image`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                // Store just the path, not the full URL
                updatedImageUrl = imageResponse.data.imageUrl;
            }

            // Update auth context with new user data
            setAuth({
                user: {
                    ...auth.user,
                    name: form.name.trim(),
                    profileImage: updatedImageUrl
                },
                token: auth.token,
                refreshToken: auth.refreshToken
            });

            // Go back to previous page
            navigate(-1);
        } catch (err) {
            logger.error('Error changing profile:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to change profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProfile) {
        return (
            <div className='flex items-center justify-center min-h-screen bg-gray-100'>
                <div className="text-gray-600 text-lg">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <h2 className='text-2xl font-bold text-gray-800'>Change Profile</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Picture
                        </label>
                        
                        <div className="flex flex-col items-center">
                            {imagePreview ? (
                                <div className="relative mb-4">
                                    <img 
                                        src={imagePreview} 
                                        alt="Profile Preview" 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
                                        onError={(e) => { e.target.src = '/images/default-avatar.png'; }}
                                    />
                                    {/* Only show delete button if user has a custom profile image or selected a new one */}
                                    {(currentProfileImage || selectedImage) && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                            title="Remove image"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 border-4 border-gray-300">
                                    <FiUser className="text-6xl text-gray-400" />
                                </div>
                            )}
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                            >
                                <FiImage className="inline mr-2" />
                                {imagePreview ? 'Change Picture' : 'Upload Picture'}
                            </button>
                            <span className="text-xs text-gray-400 mt-2">PNG, JPG, GIF, WEBP up to 5MB</span>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>
                    
                    {/* Username */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    

                    {/* Change Password Button - Only show for non-OAuth users */}
                    {auth?.user?.authProvider !== 'google' ? (
                        <button
                            type="button"
                            onClick={() => setShowChangePassword(true)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FiLock />
                            Change Password
                        </button>
                    ) : (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">You're signed in with Google</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Password changes are managed through your Google account.
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !form.name.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Changing...' : 'Change Profile'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Cancel and go back
                    </button>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal 
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />
        </div>
    );
}   

export default ChangeProfilePage;
