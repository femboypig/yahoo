import React, { useState, useEffect, useRef, CSSProperties } from 'react';

export const Home: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        // Get scroll position
        const scrollPosition = contentRef.current.scrollTop;

        // Calculate scroll progress (0 to 1) over a range of 0-100px for smooth transition
        const progress = Math.min(1, Math.max(0, scrollPosition / 100));
        setScrollProgress(progress);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      // Initial check on mount
      handleScroll();
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Calculate styles based on scroll progress
  const titleContainerStyle: CSSProperties = {
    padding: `${8 - scrollProgress * 4}px ${24 - scrollProgress * 8}px`,
    paddingTop: `${16 - scrollProgress * 4}px`,
    paddingBottom: `${16 - scrollProgress * 4}px`,
    display: 'inline-block',
    marginBottom: `${32 * (1 - scrollProgress)}px`,
    marginTop: '4px',
    position: 'sticky' as 'sticky',
    top: '12px',
    zIndex: 10,
    width: 'auto',
    maxWidth: '80%',
    backgroundColor: scrollProgress > 0 ? `rgba(20, 20, 20, ${0.6 * scrollProgress})` : 'transparent',
    backdropFilter: scrollProgress > 0 ? `blur(${16 * scrollProgress}px) saturate(180%)` : 'none',
    WebkitBackdropFilter: scrollProgress > 0 ? `blur(${16 * scrollProgress}px) saturate(180%)` : 'none',
    boxShadow: scrollProgress > 0 ? `0 ${8 * scrollProgress}px ${32 * scrollProgress}px rgba(0, 0, 0, ${0.3 * scrollProgress})` : 'none',
    borderRadius: `${24 * scrollProgress}px`,
    border: scrollProgress > 0 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
  };

  const titleStyle: CSSProperties = {
    fontSize: `${2.25 - 0.75 * scrollProgress}rem`, // 4xl to 2xl
    fontFamily: "Yahoo Wide Regular, sans-serif",
    fontWeight: 'bold',
    color: 'white',
  };

  return (
    <div
      ref={contentRef}
      className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{ maxHeight: '100%' }}
    >
      <div className="px-4 pt-6">
        {/* Title that transforms into titlebar */}
        <div style={titleContainerStyle} className="transforming-title">
          <h1 style={titleStyle} className="transforming-title">
            Главная
          </h1>
        </div>

        {/* Main content area */}
        <div className="pb-8">
          {/* Your actual content will go here */}
        </div>
      </div>
    </div>
  );
};

export default Home; 