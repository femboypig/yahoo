import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import myMusicIcon from '../assets/my_music.png';
import arrowIcon from '../assets/arrow.svg';
import Button from './Button';
import TrackItem, { MusicMetadata } from './TrackItem';
import { invoke } from '@tauri-apps/api/core';

interface LibraryProps {
    onPageChange?: (page: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onPageChange }) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [myMusicHovered, setMyMusicHovered] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [musicList, setMusicList] = useState<MusicMetadata[]>([]);

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

    // Fetch all music on component mount
    useEffect(() => {
        loadAllMusic();
    }, []);

    const loadAllMusic = async () => {
        try {
            const music: MusicMetadata[] = await invoke('get_all_music');
            setMusicList(music);
        } catch (error) {
            console.error('Failed to load music:', error);
        }
    };

    const handleDeleteMusic = async (id: string) => {
        try {
            await invoke('delete_music', { id });
            setMusicList(prevList => prevList.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete music:', error);
        }
    };

    const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
        try {
            await invoke('set_favorite', { id, favorite: isFavorite });
            setMusicList(prevList =>
                prevList.map(item =>
                    item.id === id ? { ...item, favorite: isFavorite } : item
                )
            );
        } catch (error) {
            console.error('Failed to update favorite status:', error);
        }
    };

    // Navigate to My Music page
    const navigateToMyMusic = () => {
        if (onPageChange) {
            onPageChange('mymusic');
        }
    };

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

    const subtitles: CSSProperties = {
        fontFamily: "Yahoo Wide Regular, sans-serif",
        fontWeight: 'bold',
        color: 'white',
    };

    const arrowStyle: CSSProperties = {
        width: '24px',
        height: '24px',
        marginLeft: '6px',
        filter: 'invert(0.6) brightness(0.8)', // This makes it grayish
        transform: myMusicHovered ? 'translateX(3px)' : 'translateX(0)',
        transition: 'transform 0.2s ease-in-out',
    };

    const hoverSectionStyle: CSSProperties = {
        cursor: 'pointer',
    };

    const placeholderStyle: CSSProperties = {
        borderRadius: '12px',
        padding: '28px 20px',
        marginTop: '16px',
        marginLeft: '16px',
        marginRight: '16px',
    };

    // Split tracks into two columns if there are more than 4
    const renderTracks = () => {
        if (musicList.length === 0) {
            return (
                <div style={placeholderStyle} className="flex flex-col items-center justify-center text-center">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                        </svg>
                    </div>
                    <h3
                        style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}
                        className="text-white text-2xl font-bold mb-2"
                    >
                        В вашей коллекции пока нет музыки
                    </h3>
                    <p style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }} className="text-gray-400 text-lg mb-3">
                        Добавляйте музыку, чтобы она появилась здесь
                    </p>
                    <Button className="mt-4">
                        Добавить музыку
                    </Button>
                </div>
            );
        }

        // Check if we're on mobile
        const isMobile = window.innerWidth < 768; // Adjust breakpoint as needed
        const maxItemsToShow = isMobile ? 3 : 6;

        if (musicList.length <= 4) {
            // Single column layout - show up to 3 tracks on mobile
            const displayList = isMobile ? musicList.slice(0, maxItemsToShow) : musicList;

            return (
                <div className="mt-4 px-4">
                    <div className="flex flex-col space-y-2">
                        {displayList.map((track, index) => (
                            <TrackItem
                                key={track.id}
                                track={track}
                                index={index}
                                onDelete={handleDeleteMusic}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        ))}
                    </div>
                </div>
            );
        } else {
            // Two column layout - limit to 3 tracks per column (6 total)
            const displayList = musicList.slice(0, maxItemsToShow);
            const firstColumn = displayList.slice(0, Math.ceil(displayList.length / 2));
            const secondColumn = displayList.slice(Math.ceil(displayList.length / 2));

            return (
                <div className="mt-4 px-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* First column */}
                        <div className="flex flex-col space-y-2">
                            {firstColumn.map((track, index) => (
                                <TrackItem
                                    key={track.id}
                                    track={track}
                                    index={index}
                                    onDelete={handleDeleteMusic}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))}
                        </div>
                        {/* Second column */}
                        <div className="flex flex-col space-y-2">
                            {secondColumn.map((track, index) => (
                                <TrackItem
                                    key={track.id}
                                    track={track}
                                    index={index + firstColumn.length}
                                    onDelete={handleDeleteMusic}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
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
                        Библиотека
                    </h1>
                </div>

                {/* My Music section with icon */}
                <div className="flex items-start mt-2 mb-4">
                    <div className="flex flex-col">
                        <div
                            className="flex items-center"
                            style={hoverSectionStyle}
                            onMouseEnter={() => setMyMusicHovered(true)}
                            onMouseLeave={() => setMyMusicHovered(false)}
                            onClick={navigateToMyMusic}
                        >
                            <img src={myMusicIcon} alt="My Music" className="w-15 h-15 mr-3 ml-5 rounded-md" />
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    <span style={subtitles} className="text-white text-2xl">Моя музыка</span>
                                    <img src={arrowIcon} alt="Arrow" style={arrowStyle} />
                                </div>
                                <span
                                    className="text-gray-400 text-sm"
                                    style={{
                                        marginTop: "-2px",
                                        fontFamily: "Yahoo Wide Regular, sans-serif",
                                        fontWeight: "bold"
                                    }}
                                >
                                    {musicList.length} {
                                        musicList.length === 1 ? 'трек' :
                                            musicList.length >= 2 && musicList.length <= 4 ? 'трека' :
                                                'треков'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracks display area */}
                {renderTracks()}

                {/* Main content area */}
                <div className="pb-8"></div>
            </div>
        </div>
    );
};

export default Library; 