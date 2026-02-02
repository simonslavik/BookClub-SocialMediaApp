import React from 'react';
import { FiImage } from 'react-icons/fi';
import { FiTrash2 } from 'react-icons/fi';


const BookClubImage = ({ bookClub, auth, uploadingImage, fileInputRef, handleImageUpload, handleDeleteImage }) => {
    return (
        <div className="relative mb-3 group">
                    <img 
                      src={bookClub?.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'}
                      alt={bookClub?.name}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => { e.target.src = '/images/IMG_2650.jpg'; }}
                    />
                    {auth?.user && auth.user.id === bookClub?.creatorId && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                          title="Change Image"
                        >
                          <FiImage />
                        </button>
                        {bookClub?.imageUrl && (
                          <button
                            onClick={handleDeleteImage}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            title="Delete Image"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
    )
};

export default BookClubImage;