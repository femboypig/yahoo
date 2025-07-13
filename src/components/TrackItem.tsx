import React, { useState, useRef, useEffect } from 'react';
import ellipsisIcon from '../assets/ellipsis.svg';

// Define the music metadata interface
export interface MusicMetadata {
    id: string;
    title: string;
    artist: string;
    path: string;
    favorite: boolean;
    genre?: string;
    album?: string;
    album_art?: string; // Base64 encoded image data
    duration?: number; // Duration in seconds
}

interface TrackItemProps {
    track: MusicMetadata;
    index: number;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string, favorite: boolean) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, index, onDelete, onToggleFavorite }) => {
    // Music note icon for default album art placeholder
    const defaultAlbumArt = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='60' height='60'%3E%3Crect width='24' height='24' fill='%23333'/%3E%3Cpath fill='%23888' d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z'/%3E%3C/svg%3E";

    const [isHovering, setIsHovering] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const trackItemRef = useRef<HTMLDivElement>(null);

    // Format duration like "3:45"
    const formatDuration = (seconds?: number): string => {
        if (!seconds) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Use the actual track duration without default fallback
    const duration = formatDuration(track.duration);

    const handleEllipsisClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowContextMenu(!showContextMenu);
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowContextMenu(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowContextMenu(false);
            }
        };

        if (showContextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showContextMenu]);

    // Calculate menu position
    const getContextMenuPosition = () => {
        if (!trackItemRef.current || !buttonRef.current) return {};

        const rect = buttonRef.current.getBoundingClientRect();
        const trackRect = trackItemRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Available space below and above
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Available space on right and left
        const spaceRight = viewportWidth - rect.right;

        // Default position (below and to the left)
        let position: React.CSSProperties = {
            position: 'fixed',
            top: rect.bottom + 8,
            right: viewportWidth - rect.right,
        };

        // If not enough space below, position above
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
            position = {
                ...position,
                top: 'auto',
                bottom: viewportHeight - rect.top + 8,
            };
        }

        // Adjust horizontal position if needed
        if (spaceRight < 200) {
            position.right = 8;
        }

        return position;
    };

    return (
        <div
            ref={trackItemRef}
            className="flex items-center justify-between bg-gray-900/30 p-2 rounded-xl mb-2 transition-all duration-300 relative cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ backgroundColor: (isHovering || showContextMenu) ? 'rgba(42, 42, 42, 0.6)' : 'transparent' }}
        >
            <div className="flex items-center">
                {/* Album art */}
                <div className="w-10 h-10 rounded-lg mr-4 overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                    <img
                        src={track.album_art || defaultAlbumArt}
                        alt={`${track.title} cover`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = defaultAlbumArt;
                        }}
                    />
                </div>
                <div>
                    <h3 style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }} className="text-white text-medium">{track.title}</h3>
                    <p style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }} className="text-gray-400 text-xs">{track.artist}</p>
                </div>
            </div>
            <div className="flex items-center" >
                {/* Heart icon for favorites */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id, !track.favorite);
                    }}
                    className="text-gray-400 cursor-pointer"
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        marginRight: '1px',
                        transition: 'color 0.3s',
                        color: track.favorite ? '#ef4444' : '#9ca3af',
                    }}
                    title={track.favorite ? "Убрать из избранного" : "Добавить в избранное"}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={track.favorite ? "#ef4444" : "none"}
                        stroke={track.favorite ? "#ef4444" : "currentColor"}
                        strokeWidth="1.5"
                        className={`transition-all duration-300 ${track.favorite ? 'animate-flip' : ''}`}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </button>

                {/* Duration/Ellipsis toggle on hover */}
                <div className="w-16 text-right relative">
                    {/* Duration - show when not hovering */}
                    <span
                        className={`text-gray-400 text-sm transition-opacity duration-300 ${isHovering || showContextMenu ? 'opacity-0 absolute' : 'opacity-100'}`}
                        style={{
                            fontFamily: "Yahoo Wide Regular, sans-serif",
                            right: 8,
                        }}
                    >
                        {duration}
                    </span>

                    {/* Ellipsis - show when hovering */}
                    <button
                        ref={buttonRef}
                        onClick={handleEllipsisClick}
                        className={`cursor-pointer transition-all duration-300 ${isHovering || showContextMenu ? 'opacity-100' : 'opacity-0 absolute'}`}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none'
                        }}
                        title="Меню"
                    >
                        <img
                            src={ellipsisIcon}
                            alt="Menu"
                            className="w-5 h-5"
                            style={{ filter: 'invert(1)' }} // Makes black icon white
                        />
                    </button>
                </div>
            </div>

            {/* New Context Menu */}
            {showContextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-50"
                    style={{
                        ...getContextMenuPosition(),
                        width: '220px',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                >
                    {/* Glass panel with border */}
                    <div
                        className="rounded-lg overflow-hidden"
                        style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            backgroundColor: 'rgba(20, 20, 20, 0.85)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* Menu header */}
                        <div className="px-4 py-3  border-gray-700/50">
                            <div className="flex items-center">
                                {/* Small album art */}
                                <div className="w-8 h-8 rounded overflow-hidden mr-3 flex-shrink-0">
                                    <img
                                        src={track.album_art || defaultAlbumArt}
                                        alt={`${track.title} cover`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = defaultAlbumArt;
                                        }}
                                    />
                                </div>

                                {/* Track info */}
                                <div className="overflow-hidden">
                                    <p className="text-white text-sm font-medium truncate" style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}>
                                        {track.title}
                                    </p>
                                    <p className="text-gray-400 text-xs truncate" style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}>
                                        {track.artist}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-0">
                            <button
                                className="w-full text-left
                                text-white  
                                transition-colors flex items-center gap-3 text-sm"
                                style={{
                                    fontFamily: "Yahoo Wide Regular, sans-serif",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(track.id);
                                    setShowContextMenu(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackItem; 