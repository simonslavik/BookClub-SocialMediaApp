import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiX, FiUnlock, FiLock, FiEyeOff } from 'react-icons/fi';
import { bookclubAPI } from '../../api/bookclub.api';
import AuthContext from '../../context';

const categories = [
    'General',
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Thriller',
    'Biography',
    'Self-Help',
    'History',
    'Poetry',
    'Young Adult',
    'Classic Literature',
    'Horror',
    'Philosophy'
];

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
            console.log('Created Bookclub:', bookClubId);

            // Upload image if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);

                await bookclubAPI.uploadImage(bookClubId, formData);
            }

            // Redirect to the bookclub chat page
            navigate(`/bookclub/${bookClubId}`);
        } catch (err) {
            console.error('Error creating book club:', err);
            setError(err.response?.data?.error || 'Failed to create book club. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <h2 className='text-2xl font-bold text-gray-800'>Create Book Club</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Book Club Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Book Club Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter book club name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your book club..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visibility Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Visibility *
                        </label>
                        <div className="space-y-2">
                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'PUBLIC' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
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
                                        <span className="font-semibold text-gray-900">Public</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Anyone can see and join instantly</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'PRIVATE' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
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
                                        <span className="font-semibold text-gray-900">Private</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Anyone can see, join requires approval</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                form.visibility === 'INVITE_ONLY' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
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
                                        <FiEyeOff className="w-4 h-4 text-purple-600" />
                                        <span className="font-semibold text-gray-900">Invite Only</span>
                                    </div>
                                    <p className="text-xs text-gray-600">Only visible to members, join via invite</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Requires Approval (for PRIVATE) */}
                    {form.visibility === 'PRIVATE' && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="requiresApproval"
                                    checked={form.requiresApproval}
                                    onChange={handleChange}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-semibold text-gray-900">Require admin approval for join requests</span>
                            </label>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-colors"
                            >
                                <FiImage className="text-4xl text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload image</span>
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
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Book Club'}
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
        </div>
    );
}   

export default NewBookClubPage;
