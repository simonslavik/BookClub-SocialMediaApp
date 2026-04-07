import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePageHeader from '@components/layout/Header';
import useHomeData from '@hooks/useHomeData';
import {
  HeroSection,
  FeatureSection,
  TopChartingSection,
  PopularClubsSection,
  MyClubsCarousel,
  FriendsPanel,
  MemberTooltip,
} from './components';

const Home = () => {
  const {
    auth,
    bookClubs,
    allMyBookClubs,
    friends,
    suggestedUsers,
    handleSendFriendRequest,
  } = useHomeData();

  const navigate = useNavigate();

  const [filterCreatedByMe, setFilterCreatedByMe] = useState(false);
  const [hoveredMember, setHoveredMember] = useState(null);

  const handleToggleFilter = useCallback(() => {
    setFilterCreatedByMe((prev) => !prev);
  }, []);

  return (
    <div>
      <HomePageHeader />

      {/* ===== LOGGED-OUT LANDING PAGE ===== */}
      {!auth?.user && (
        <div className="min-h-screen bg-parchment dark:bg-gray-900 transition-colors duration-300">
          <HeroSection />

          <FeatureSection
            initial="C"
            text="reate your own bookclub channel and have whole bookloving community together."
            bgClass="bg-[#F0EFEB] dark:bg-gray-800"
          />

          <FeatureSection
            initial="D"
            text="iscover new reads, share reviews, and discuss your favorite chapters with readers who get&nbsp;it."
            reverse
            bgClass="bg-parchment dark:bg-gray-900"
          />

          <FeatureSection
            initial="C"
            text="reate your own bookclub channel and have whole bookloving community together."
            bgClass="bg-[#F0EFEB] dark:bg-gray-800"
          />

          <TopChartingSection bookClubs={bookClubs} />

          {/* Discover More CTA */}
          <section className="flex justify-center pb-20">
            <button
              onClick={() => navigate('/discover')}
              className="px-8 py-3 bg-stone-600 dark:bg-warmgray-300 dark:text-stone-900 text-white rounded-md hover:bg-stone-500 dark:hover:bg-warmgray-400 transition-colors text-sm font-medium cursor-pointer"
            >
              Discover More
            </button>
          </section>
        </div>
      )}

      {/* ===== LOGGED-IN DASHBOARD ===== */}
      {auth?.user && (
        <div className="flex flex-col p-4 md:p-8 w-full min-h-screen gap-4 bg-parchment dark:bg-gray-900 transition-colors duration-300">
          <MyClubsCarousel
            allMyBookClubs={allMyBookClubs}
            filterCreatedByMe={filterCreatedByMe}
            onToggleFilter={handleToggleFilter}
            onSetHoveredMember={setHoveredMember}
          />

          <div className="flex justify-center mt-8 md:mt-16">
            <button
              onClick={() => navigate('/discover')}
              className="font-medium rounded-lg px-5 py-2.5 bg-stone-800 text-white cursor-pointer hover:bg-stone-700 transition-colors text-sm"
            >
              Discover More Book Clubs
            </button>
          </div>

          <PopularClubsSection bookClubs={bookClubs} />

          <FriendsPanel
            friends={friends}
            suggestedUsers={suggestedUsers}
            onSendFriendRequest={handleSendFriendRequest}
          />
        </div>
      )}

      {/* Portal tooltip for member avatars */}
      <MemberTooltip member={hoveredMember} />
    </div>
  );
};

export default Home;
