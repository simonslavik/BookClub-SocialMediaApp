import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiX, FiUnlock, FiLock, FiEyeOff } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import AuthContext from '@context/index';
import logger from '@utils/logger';
import { BOOKCLUB_CATEGORIES } from '@config/constants';

const categories = BOOKCLUB_CATEGORIES;

const NewBookClubPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'General',
        visibility: 'PUBLIC',
        requiresApproval: false
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!auth?.token) {
            setError('Please login to create a book club');
            return;
        }

        if (!form.name.trim()) {
            setError('Book club name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create bookclub with new API
            const response = await bookclubAPI.createBookclub({
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                visibility: form.visibility,
                requiresApproval: form.visibility === 'PRIVATE' ? form.requiresApproval : false,
            });

            // Response format: { success: true, data: { id, name, ... } }
            const bookClubId = response.success ? response.data.id : response.data?.data?.id || response.data.id;
            logger.debug('Created Bookclub:', bookClubId);

            // Upload image if selected (non-blocking — club already exists)
            if (selectedImage) {
                try {
                    const formData = new FormData();
                    formData.append('image', selectedImage);
                    await bookclubAPI.uploadImage(bookClubId, formData);
                } catch (imgErr) {
                    logger.error('Image upload failed:', imgErr);
                    // Club was created — navigate anyway but show the error briefly
                    navigate(`/bookclub/${bookClubId}`);
                    return;
                }
            }

            // Redirect to the bookclub chat page
            navigate(`/bookclub/${bookClubId}`);
        } catch (err) {
            logger.error('Error creating book club:', err);
            setError(err.response?.data?.error || 'Failed to create book club. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-300'>
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>Create Book Club</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Book Club Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Book Club Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter book club name"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your book club..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category *
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visibility Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Visibility *
                        </label>
                        <div className="space-y-2">
                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'PUBLIC' ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-stone-200 dark:hover:border-stone-500'
                            }`}>
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="PUBLIC"
                                    checked={form.visibility === 'PUBLIC'}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiUnlock className="w-4 h-4 text-green-600" />
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">Public</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Anyone can see and join instantly</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'PRIVATE' ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-stone-200 dark:hover:border-stone-500'
                            }`}>
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="PRIVATE"
                                    checked={form.visibility === 'PRIVATE'}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiLock className="w-4 h-4 text-yellow-600" />
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">Private</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Anyone can see, join requires approval</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'INVITE_ONLY' ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-stone-200 dark:hover:border-stone-500'
                            }`}>
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="INVITE_ONLY"
                                    checked={form.visibility === 'INVITE_ONLY'}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiEyeOff className="w-4 h-4 text-stone-700" />
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">Invite Only</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Only visible to members, join via invite</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Requires Approval (for PRIVATE) */}
                    {form.visibility === 'PRIVATE' && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="requiresApproval"
                                    checked={form.requiresApproval}
                                    onChange={handleChange}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Require admin approval for join requests</span>
                            </label>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Book Club Cover Image (Optional)
                        </label>
                        
                        {imagePreview ? (
                            <div className="relative">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <FiImage className="text-4xl text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</span>
                            </button>
                        )}
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !form.name.trim()}
                        className="w-full bg-stone-700 hover:bg-stone-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Book Club'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-300"
                    >
                        Cancel and go back
                    </button>
                </div>
            </div>
        </div>
    );
}   

export default NewBookClubPage;
