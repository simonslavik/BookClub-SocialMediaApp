import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WATERMARK_TEXT } from './watermarkText';

/**
 * Full-width hero section shown to logged-out visitors.
 * Displays the tagline along with a decorative watermark background.
 */
const HeroSection = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
  <section className="relative overflow-hidden px-6 md:px-16 py-16 md:py-20">
    {/* Background watermark text */}
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.06] dark:opacity-[0.04] pt-1">
      <p className="text-[1rem] md:text-[1.1rem] leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
        {WATERMARK_TEXT}
      </p>
    </div>

    <div className={`relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="w-full md:w-1/2">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-stone-900 dark:text-warmgray-100 tracking-tight">
          &ldquo;Connect With<br />Your Fellow<br />BookLovers&rdquo;
        </h1>
        <div className='flex justify-end'>
          <img src="/images/logo5.png" alt="MyBookClubs" className="h-6 -mt-2 opacity-70 dark:invert" />
          <img src="/images/logo5.png" alt="MyBookClubs" className="h-9 mt-2 opacity-70 dark:invert" />
          <img src="/images/logo5.png" alt="MyBookClubs" className="w-8   opacity-60 dark:invert" />
          <img src="/images/logo5.png" alt="MyBookClubs" className="h-12 mt-4 opacity-50 dark:invert" />
          
        </div>
      </div>

      {/* Image placeholder */}
      <div className={`w-full md:w-1/2 aspect-[4/3] bg-stone-700 dark:bg-gray-700 rounded-sm overflow-hidden transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-full h-full bg-stone-700 dark:bg-gray-700" />
      </div>

    </div>

    {/* CTA buttons */}
    <div className={`relative z-10 flex justify-center gap-4 mt-12 transition-all duration-700 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <button
        onClick={() => window.dispatchEvent(new Event('open-login'))}
        className="px-8 py-3 bg-stone-800 dark:bg-warmgray-200 text-white dark:text-stone-900 rounded-md hover:bg-stone-700 dark:hover:bg-warmgray-300 transition-colors text-sm font-medium cursor-pointer"
      >
        OPEN APP
      </button>
      <button
        onClick={() => navigate('/discover')}
        className="px-8 py-3 border border-stone-800 dark:border-warmgray-300 text-stone-800 dark:text-warmgray-200 rounded-md hover:bg-stone-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer bg-white"
      >
        FIND BOOKCLUBS
      </button>
    </div>
  </section>
  );
};

export default HeroSection;
