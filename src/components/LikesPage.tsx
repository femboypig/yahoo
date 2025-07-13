import React, { CSSProperties, useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';
import { invoke } from '@tauri-apps/api/core';
import likeIcon from '../assets/like.png';
import playIcon from '../assets/play.svg';
import searchIcon from '../assets/search.svg';
import Button from './Button';
import TrackItem, { MusicMetadata } from './TrackItem';

export const LikesPage: React.FC = () => {
    const [dominantColor, setDominantColor] = useState<[number, number, number]>([30, 30, 30]); // Default dark color
    const [colorPalette, setColorPalette] = useState<Array<[number, number, number]>>([]);
    const imageRef = useRef<HTMLImageElement>(null);
    const [musicList, setMusicList] = useState<MusicMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all favorite music on component mount
    useEffect(() => {
        loadFavoriteMusic();
    }, []);

    const loadFavoriteMusic = async () => {
        try {
            const allMusic: MusicMetadata[] = await invoke('get_all_music');
            const favorites = allMusic.filter(track => track.favorite);
            setMusicList(favorites);
        } catch (error) {
            console.error('Failed to load favorite music:', error);
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
            if (!isFavorite) {
                // Remove from favorites list if unliked
                setMusicList(prevList => prevList.filter(item => item.id !== id));
            } else {
                // Update the current item
                setMusicList(prevList =>
                    prevList.map(item =>
                        item.id === id ? { ...item, favorite: isFavorite } : item
                    )
                );
            }
        } catch (error) {
            console.error('Failed to update favorite status:', error);
        }
    };

    const filteredMusicList = musicList.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        // Extract colors when the image loads
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

    const containerStyle: CSSProperties = {
        position: 'relative',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        overflow: 'hidden',
    };

    const gradientOverlayStyle: CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: `linear-gradient(to bottom, ${getDarkendColor(dominantColor, 0.5)} 0%, ${getDarkendColor(dominantColor, 0.3)} 50%, rgba(10, 10, 10, 0) 100%)`,
        pointerEvents: 'none',
        zIndex: 1,
    };

    const contentStyle: CSSProperties = {
        position: 'relative',
        zIndex: 2,
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
        <div className="h-full overflow-y-auto custom-scrollbar" style={containerStyle}>
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
                            src={likeIcon}
                            alt="Likes"
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
                                Мне нравится
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
                                У вас пока нет избранных треков.
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

export default LikesPage; 