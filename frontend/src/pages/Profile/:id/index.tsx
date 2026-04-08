import { useState } from 'react';
import { FiBook } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import AddBookToLibraryModal from '@components/common/modals/AddBookToLibraryModal';
import BookDetailsModal from '@components/common/modals/BookDetails';
import { ProfileSkeleton } from '@components/common/Skeleton';
import useProfileData from './useProfileData';
import { ProfileHero, BookClubsGrid, BookLibrary } from './components';

const ProfilePage = () => {
    const {
        id, profile, allClubs,
        loading, error, isOwnProfile,
        imagePreview, uploadingImage, fileInputRef, handleImageSelect,
        friendRequestLoading, sendFriendRequest,
        favoriteBooks, booksReading, booksToRead, booksRead,
        fetchBooks, deleteBook, navigate,
    } = useProfileData();

    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    // ── Loading ──────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
                <HomePageHeader />
                <ProfileSkeleton />
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────
    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
                <HomePageHeader />
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
                    <div className="text-center max-w-sm">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                            <FiBook className="w-6 h-6 text-red-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-stone-800 dark:text-gray-100 mb-1 font-display">
                            {error ? 'Something Went Wrong' : 'Profile Not Found'}
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-gray-400 mb-6 font-outfit">
                            {error || "This profile doesn't exist or has been removed."}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors font-outfit"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
            <HomePageHeader />

            <ProfileHero
                profile={profile}
                isOwnProfile={isOwnProfile}
                imagePreview={imagePreview}
                uploadingImage={uploadingImage}
                fileInputRef={fileInputRef}
                onImageSelect={handleImageSelect}
                friendRequestLoading={friendRequestLoading}
                onSendFriendRequest={sendFriendRequest}
                clubCount={allClubs.length}
                navigate={navigate}
            />

            <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12 space-y-10">
                <BookClubsGrid
                    clubs={allClubs}
                    isOwnProfile={isOwnProfile}
                    profileName={profile.name}
                    profileId={id}
                    navigate={navigate}
                />

                <BookLibrary
                    favoriteBooks={favoriteBooks}
                    booksReading={booksReading}
                    booksToRead={booksToRead}
                    booksRead={booksRead}
                    isOwnProfile={isOwnProfile}
                    profileName={profile.name}
                    onAddBook={() => setShowAddBookModal(true)}
                    onDeleteBook={deleteBook}
                    onViewBook={(book) => setSelectedBook(book)}
                />
            </div>

            {/* Modals */}
            {showAddBookModal && (
                <AddBookToLibraryModal
                    onClose={() => setShowAddBookModal(false)}
                    onBookAdded={() => fetchBooks(id)}
                />
            )}
            {selectedBook && (
                <BookDetailsModal
                    onClose={() => setSelectedBook(null)}
                    book={selectedBook}
                />
            )}
        </div>
    );
};

export default ProfilePage;