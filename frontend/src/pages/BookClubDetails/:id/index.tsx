import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiBook } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import LoginModule from '@components/common/modals/loginModule';
import RegisterModule from '@components/common/modals/registerModule';
import useBookClubPreview from './useBookClubPreview';
import { ClubHero, CurrentBookCard, UpcomingBooks, CompletedBooks, MembersSidebar, ClubStats } from './components';

const BookClubPage = () => {
    const {
        bookClub, members, connectedUsers,
        currentBooks, upcomingBooks, completedBooks,
        loading, error, totalBooks,
        handleAction, actionLabel, navigate,
    } = useBookClubPreview();

    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);

    const onAction = async () => {
        const result = await handleAction();
        if (result === 'login') setOpenLogin(true);
    };

    // ── Loading ──────────────────────────────────────────
    if (loading) {
        return (
            <>
                <HomePageHeader />
                <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
                    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-12 space-y-6">
                        <div className="animate-pulse bg-stone-200 dark:bg-gray-800 h-56 rounded-2xl" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                {[1, 2].map(i => <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-32" />)}
                            </div>
                            <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-64" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Error ────────────────────────────────────────────
    if (error) {
        return (
            <>
                <HomePageHeader />
                <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
                    <div className="text-center max-w-sm">
                        <FiBook className="mx-auto text-4xl text-stone-300 dark:text-gray-600 mb-4" />
                        <h2 className="text-lg font-semibold text-stone-800 dark:text-gray-100 mb-1 font-display">Couldn't Load Club</h2>
                        <p className="text-sm text-stone-500 dark:text-gray-400 mb-6 font-outfit">{error}</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => window.location.reload()} className="px-5 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors">Retry</button>
                            <button onClick={() => navigate('/')} className="px-5 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors">Go Home</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Main ─────────────────────────────────────────────
    return (
        <>
            <HomePageHeader />
            <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
                <ClubHero
                    bookClub={bookClub}
                    members={members}
                    totalBooks={totalBooks}
                    currentBooks={currentBooks}
                    actionLabel={actionLabel}
                    onAction={onAction}
                />

                <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <CurrentBookCard books={currentBooks} />
                            <UpcomingBooks books={upcomingBooks} />
                            <CompletedBooks books={completedBooks} />
                        </div>

                        <div className="space-y-6">
                            <MembersSidebar members={members} connectedUsers={connectedUsers} />
                            <ClubStats completedBooks={completedBooks} upcomingBooks={upcomingBooks} members={members} connectedUsers={connectedUsers} />
                        </div>
                    </div>
                </div>
            </div>

            {openLogin && createPortal(
                <LoginModule
                    onClose={() => setOpenLogin(false)}
                    onSwitchToRegister={() => { setOpenLogin(false); setOpenRegister(true); }}
                />,
                document.body
            )}
            {openRegister && createPortal(
                <RegisterModule
                    onClose={() => setOpenRegister(false)}
                    onSwitchToLogin={() => { setOpenRegister(false); setOpenLogin(true); }}
                />,
                document.body
            )}
        </>
    );
};

export default BookClubPage;
