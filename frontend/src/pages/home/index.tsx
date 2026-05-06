import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePageHeader from '@components/layout/Header';
import useHomeData from '@hooks/useHomeData';
import useScrollReveal from '@hooks/useScrollReveal';
import {
  HeroSection,
  FeatureSection,
  TopChartingSection,
  MyClubsCarousel,
  MemberTooltip,
} from './components';

/** Lightweight scroll-reveal wrapper for inline use */
const Reveal = ({ children, className = '', delay = 0 }) => {
  const { ref, isVisible } = useScrollReveal(0.2);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

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

          <Reveal className="flex justify-center -mt-8 dark:bg-gray-800">
            <img src="/images/logo4.png" alt="" className="h-14 opacity-60 dark:invert" />
            <img src="/images/logo4.png" alt="" className="h-14 opacity-60 dark:invert" />
            <img src="/images/logo4.png" alt="" className="h-14 opacity-60 dark:invert" />
          </Reveal>

          <FeatureSection
            initial="C"
            text="reate your own bookclub channel and have whole bookloving community together."
            bgClass="bg-[#F0EFEB] dark:bg-gray-800"
          />

          <Reveal className="flex justify-center -mt-10 bg-parchment dark:bg-gray-900">
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
            <img src="/images/grass2.png" alt="" className="h-14 -ml-4 opacity-60 dark:invert" />
          </Reveal>

          <FeatureSection
            initial="D"
            text="iscover new reads, share reviews, and discuss your favorite chapters with readers who get&nbsp;it."
            reverse
            bgClass="bg-parchment dark:bg-gray-900"
          />

          <Reveal className="flex justify-center bg-parchment dark:bg-gray-900">
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-2 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-2 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/flowers.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
          </Reveal>

          <FeatureSection
            initial="T"
            text="rack your reading progress, set goals, and celebrate milestones with friends who share your&nbsp;passion."
            bgClass="bg-[#F0EFEB] dark:bg-gray-800"
          />

          <Reveal className="flex justify-center -mt-2 bg-parchment dark:bg-gray-900">
            <img src="/images/balls.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/balls.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/balls.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/balls.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />
            <img src="/images/balls.png" alt="" className="h-14 -ml-1 opacity-60 dark:invert" />

          </Reveal>

          <TopChartingSection bookClubs={bookClubs} />

          {/* Discover More CTA */}
          <Reveal className="flex justify-center pb-20">
            <button
              onClick={() => navigate('/discover')}
              className="px-8 py-3 bg-stone-600 dark:bg-warmgray-300 dark:text-stone-900 text-white rounded-md hover:bg-stone-500 dark:hover:bg-warmgray-400 transition-colors text-sm font-medium cursor-pointer"
            >
              Discover More
            </button>
          </Reveal>
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

        </div>
      )}

      {/* Portal tooltip for member avatars */}
      <MemberTooltip member={hoveredMember} />
    </div>
  );
};

export default Home;
