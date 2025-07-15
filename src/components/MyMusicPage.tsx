import React, { CSSProperties, useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import myMusicIcon from '../assets/my_music.png';
import playIcon from '../assets/play.svg';
import searchIcon from '../assets/search.svg';
import Button from './Button';
import TrackItem, { MusicMetadata } from './TrackItem';

export const MyMusicPage: React.FC = () => {
    const [dominantColor, setDominantColor] = useState<[number, number, number]>([30, 30, 30]); // Default dark color
    const [colorPalette, setColorPalette] = useState<Array<[number, number, number]>>([]);
    const imageRef = useRef<HTMLImageElement>(null);
    const [musicList, setMusicList] = useState<MusicMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);

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

    const handleUploadMusic = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Audio',
                    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
                }]
            });

            if (selected && !Array.isArray(selected)) {
                setIsUploading(true);
                const metadata: MusicMetadata = await invoke('upload_music_file', { filePath: selected });
                setMusicList(prevList => [...prevList, metadata]);
                setIsUploading(false);
            }
        } catch (error) {
            console.error('Failed to upload music:', error);
            setIsUploading(false);
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

    const filteredMusicList = musicList.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Extract colors when the image loads
    useEffect(() => {
        const extractColors = () => {
            if (imageRef.current && imageRef.current.complete) {
                try {
                    const colorThief = new ColorThief();
                    const dominant = colorThief.getColor(imageRef.current);
                    const palette = colorThief.getPalette(imageRef.current, 5);

                    setDominantColor(dominant);
                    setColorPalette(palette);
                } catch (e) {
                    console.error('Error extracting colors:', e);
                }
            }
        };

        if (imageRef.current) {
            if (imageRef.current.complete) {
                extractColors();
            } else {
                imageRef.current.addEventListener('load', extractColors);
            }
        }

        return () => {
            if (imageRef.current) {
                imageRef.current.removeEventListener('load', extractColors);
            }
        };
    }, []);

    // Calculate background style based on dominant color
    const getDarkendColor = (color: [number, number, number], amount: number = 0.7): string => {
        const [r, g, b] = color;
        const darkenedR = Math.floor(r * amount);
        const darkenedG = Math.floor(g * amount);
        const darkenedB = Math.floor(b * amount);
        return `rgb(${darkenedR}, ${darkenedG}, ${darkenedB})`;
    };

    // Hide scrollbar styles but keep scrolling functionality
    const scrollbarHideStyle = `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
    `;

    const pageContainerStyle: CSSProperties = {
        position: 'relative',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        overflow: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        zIndex: 1,
    };

    const gradientOverlayStyle: CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,

        height: '300px',
        background: `linear-gradient(to bottom, ${getDarkendColor(dominantColor, 0.5)} 0%, ${getDarkendColor(dominantColor, 0.3)} 50%, rgba(10, 10, 10, 0) 100%)`,
        pointerEvents: 'none',
        zIndex: 0,
    };

    const contentStyle: CSSProperties = {
        position: 'relative',
        zIndex: 2,
    };

    const yellowButtonStyle: CSSProperties = {
        backgroundColor: '#FFD52E',
        color: 'black',
        border: 'none',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        paddingLeft: '16px',
        paddingRight: '20px',
        fontFamily: "Yahoo Wide Regular, sans-serif",
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
    };

    const iconButtonStyle: CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'transparent',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        marginLeft: '10px'
    };

    const searchContainerStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        padding: '0 24px',
        marginTop: '20px',
        marginBottom: '20px',
    };

    const searchBarStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '48px',
        backgroundColor: 'transparent',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '0 24px',
        gap: '12px',
        transition: 'border-color 0.2s ease',
    };

    const searchInputStyle: CSSProperties = {
        flex: '1',
        background: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        fontFamily: 'Yahoo Wide Regular, sans-serif',
        outline: 'none',
        padding: '0',
    };

    return (
        <div className="scrollbar-hide rounded-xl" style={pageContainerStyle}>
            {/* Injecting CSS for hiding scrollbars */}
            <style>{scrollbarHideStyle}</style>

            {/* Gradient overlay at the top based on dominant color */}
            <div style={gradientOverlayStyle}></div>

            {/* Content */}
            <div className="px-8 pt-6" style={contentStyle}>
                {/* Header section with icon and title */}
                <div className="flex items-start">
                    {/* Large icon with ref for color extraction */}
                    <div className="mr-6">
                        <img
                            ref={imageRef}
                            src={myMusicIcon}
                            alt="My Music"
                            className="w-56 h-56 rounded-lg shadow-lg"
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Title and buttons */}
                    <div className="flex flex-col justify-end h-56">
                        <div>
                            <p
                                className="text-gray-400 text-sm font-medium mb-1"
                                style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}
                            >
                                Плейлист
                            </p>
                            <h1
                                className="text-5xl font-bold mb-6 text-white"
                                style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}
                            >
                                Моя музыка
                            </h1>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center mt-6">
                            <Button
                                className="mr-3 px-8"
                                style={yellowButtonStyle}
                            >
                                <img
                                    src={playIcon}
                                    alt="Play"
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }} // Make it black
                                />
                                <span style={{ fontWeight: 'bold' }}>Слушать</span>
                            </Button>

                            {/* Download button with inline SVG */}
                            <button
                                style={iconButtonStyle}
                                className="hover:bg-gray-800 transition-colors"
                                title="Загрузить музыку"
                                onClick={handleUploadMusic}
                                disabled={isUploading}
                            >
                                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 60 82" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M59.1387 43.8223C59.1387 41.6738 57.5273 40.0137 55.3301 40.0137C54.3047 40.0137 53.2793 40.3555 52.5957 41.0879L45.6133 47.8262L30.8184 64.2812L33.3086 65.1602L33.7969 53.1484V4.46677C33.7969 2.17187 32.1367 0.609375 29.8418 0.609375C27.5469 0.609375 25.8867 2.17187 25.8867 4.46677V53.1484L26.375 65.1602L28.9141 64.2812L14.0703 47.8262L7.0879 41.0879C6.4043 40.3555 5.3789 40.0137 4.3535 40.0137C2.1563 40.0137 0.544922 41.6738 0.544922 43.8223C0.544922 44.8965 0.935502 45.8242 1.7656 46.7031L26.9121 71.8984C27.7422 72.8261 28.7676 73.2656 29.8418 73.2656C30.916 73.2656 31.9414 72.8261 32.7715 71.8984L57.918 46.7031C58.7481 45.8242 59.1387 44.8965 59.1387 43.8223ZM59.1387 77.2207C59.1387 74.9258 57.5762 73.2656 55.3301 73.2656H4.4512C2.1563 73.2656 0.544922 74.9258 0.544922 77.2207C0.544922 79.5156 2.1563 81.1269 4.4512 81.1269H55.3301C57.5762 81.1269 59.1387 79.5156 59.1387 77.2207Z" fill="white" />
                                    </svg>
                                </div>
                            </button>

                            {/* Ellipsis button with SVG */}
                            <button
                                style={iconButtonStyle}
                                className="hover:bg-gray-800 transition-colors"
                            >
                                <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="5" viewBox="0 0 76 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(0.6)' }}>
                                        <path d="M8.67385 16.8027C13.2636 16.8027 16.8769 13.2871 16.8769 8.79488C16.8769 4.35158 13.2636 0.738281 8.67385 0.738281C4.23045 0.738281 0.617188 4.35158 0.617188 8.79488C0.617188 13.2871 4.23045 16.8027 8.67385 16.8027Z" fill="white" />
                                        <path d="M37.8242 16.8027C42.3164 16.8027 45.8808 13.2871 45.8808 8.79488C45.8808 4.35158 42.3164 0.738281 37.8242 0.738281C33.3808 0.738281 29.8164 4.35158 29.8164 8.79488C29.8164 13.2871 33.3808 16.8027 37.8242 16.8027Z" fill="white" />
                                        <path d="M67.0234 16.8027C71.4667 16.8027 75.08 13.2871 75.08 8.79488C75.08 4.35158 71.4667 0.738281 67.0234 0.738281C62.4335 0.738281 58.8203 4.35158 58.8203 8.79488C58.8203 13.2871 62.4335 16.8027 67.0234 16.8027Z" fill="white" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div style={searchContainerStyle}>
                    <div style={searchBarStyle} className="hover:border-white focus-within:border-white">
                        <img
                            src={searchIcon}
                            alt="Search"
                            className="w-5 h-5"
                            style={{ filter: 'invert(100%)' }} // Make it white
                        />
                        <input
                            type="text"
                            placeholder="Поиск по трекам"
                            style={searchInputStyle}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Music list */}
                <div className="mt-4 pb-16">
                    {filteredMusicList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <p style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }} className="text-gray-400 text-lg">
                                {isUploading
                                    ? 'Загрузка музыки...'
                                    : 'Здесь будет отображаться ваша музыкальная коллекция.'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-2">
                            {filteredMusicList.map((track, index) => (
                                <TrackItem
                                    key={track.id}
                                    track={track}
                                    index={index}
                                    onDelete={handleDeleteMusic}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyMusicPage; 