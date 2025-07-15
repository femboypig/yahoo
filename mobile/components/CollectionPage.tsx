import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { TitleBar } from './TitleBar';
import { useFonts } from 'expo-font';
import Button from './Button';
import Svg, { Path } from 'react-native-svg';

interface CollectionPageProps {
    onPageChange?: (page: string) => void;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({ onPageChange }) => {
    // Load the custom font
    const [fontsLoaded] = useFonts({
        'YSMusic-HeadlineBold': require('../assets/YSMusic-HeadlineBold.ttf'),
    });

    const [likesHovered, setLikesHovered] = useState(false);
    const [playlistsHovered, setPlaylistsHovered] = useState(false);

    // Create a ref for the ScrollView to track scroll position
    const scrollY = useRef(new Animated.Value(0)).current;

    // This would be fetched from backend in the future
    const likedTracksCount = 0;

    // Navigate to Library page
    const navigateToLibrary = () => {
        if (onPageChange) {
            onPageChange('library');
        }
    };

    // Navigate to Likes page
    const navigateToLikes = () => {
        if (onPageChange) {
            onPageChange('likes');
        }
    };

    const getMusicCountText = (count: number) => {
        if (count === 1) return '1 трек';
        if (count >= 2 && count <= 4) return `${count} трека`;
        return `${count} треков`;
    };

    return (
        <View style={styles.container}>
            <TitleBar title="Коллекция" scrollY={scrollY} />

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
            >
                {/* Like section with icon */}
                <View style={styles.sectionContainer}>
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPressIn={() => setLikesHovered(true)}
                        onPressOut={() => setLikesHovered(false)}
                        onPress={navigateToLikes}
                    >
                        <Image
                            source={require('../assets/like.png')}
                            style={styles.sectionIcon}
                            fadeDuration={0}
                        />
                        <View style={styles.sectionTextContainer}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>Мне нравится</Text>
                                <Svg
                                    width={25}
                                    height={24}
                                    viewBox="0 0 25 24"
                                    fill="none"
                                    style={[
                                        styles.arrowIcon,
                                        likesHovered && styles.arrowIconHovered
                                    ]}
                                >
                                    <Path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M11.6342 6.64947C13.0493 7.99138 15.0662 9.69101 17.4856 11.1426L17.4856 12.8576C15.0662 14.3092 13.0493 16.0088 11.6342 17.3507C10.9281 18.0203 10.3755 18.5973 10.0013 19.0047C9.81434 19.2083 9.67217 19.3692 9.57794 19.4778C9.53083 19.5321 9.49573 19.5732 9.47302 19.6001L9.44831 19.6295L9.44302 19.6358L9.4423 19.6367C9.44239 19.6366 9.44249 19.6365 8.67111 19.0001C7.89973 18.3637 7.89986 18.3636 7.9 18.3634L7.90035 18.363L7.90127 18.3619L7.90402 18.3585L7.91315 18.3476L7.94576 18.3088C7.97383 18.2756 8.0145 18.2279 8.06739 18.167C8.17316 18.0451 8.32786 17.8701 8.52837 17.6518C8.92922 17.2153 9.51409 16.6049 10.258 15.8995C11.4754 14.745 13.1285 13.3269 15.1068 12.0001C13.1285 10.6733 11.4754 9.25517 10.258 8.10072C9.51409 7.3953 8.92922 6.78485 8.52837 6.34843C8.32786 6.13013 8.17316 5.95512 8.06739 5.83324C8.0145 5.77229 7.97383 5.7246 7.94576 5.6914L7.91315 5.65262L7.90402 5.64166L7.90127 5.63833L7.90035 5.63722L7.9 5.6368C7.89986 5.63662 7.89973 5.63647 8.67111 5.00009C9.44249 4.36372 9.44239 4.3636 9.44229 4.36348L9.44302 4.36435L9.4483 4.3707L9.47302 4.40009C9.49573 4.42695 9.53083 4.46813 9.57794 4.52242C9.67217 4.63101 9.81434 4.79193 10.0013 4.99551C10.3755 5.40284 10.9281 5.97989 11.6342 6.64947ZM9.44216 4.36332C9.44211 4.36326 9.44212 4.36327 9.44217 4.36334L9.44216 4.36332Z"
                                        fill="rgba(255,255,255,0.6)"
                                    />
                                </Svg>
                            </View>
                            <Text style={styles.trackCount}>{getMusicCountText(likedTracksCount)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Likes placeholder */}
                <View style={styles.placeholderContainer}>
                    <View style={styles.iconCircle}>
                        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                            <Path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth={1.5}
                            />
                        </Svg>
                    </View>
                    <Text style={styles.placeholderTitle}>
                        Вам еще не нравятся композиции
                    </Text>
                    <Text style={styles.placeholderText}>
                        Отметьте понравившиеся треки, чтобы они появились здесь
                    </Text>
                    <Button onPress={navigateToLibrary} style={styles.addButton}>
                        Просмотреть библиотеку
                    </Button>
                </View>

                {/* Playlists section with icon */}
                <View style={[styles.sectionContainer, { marginTop: 24 }]}>
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPressIn={() => setPlaylistsHovered(true)}
                        onPressOut={() => setPlaylistsHovered(false)}
                    >
                        <Image
                            source={require('../assets/playlists.png')}
                            style={styles.sectionIcon}
                            fadeDuration={0}
                        />
                        <View style={styles.sectionTextContainer}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>Мои плейлисты</Text>
                                <Svg
                                    width={25}
                                    height={24}
                                    viewBox="0 0 25 24"
                                    fill="none"
                                    style={[
                                        styles.arrowIcon,
                                        playlistsHovered && styles.arrowIconHovered
                                    ]}
                                >
                                    <Path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M11.6342 6.64947C13.0493 7.99138 15.0662 9.69101 17.4856 11.1426L17.4856 12.8576C15.0662 14.3092 13.0493 16.0088 11.6342 17.3507C10.9281 18.0203 10.3755 18.5973 10.0013 19.0047C9.81434 19.2083 9.67217 19.3692 9.57794 19.4778C9.53083 19.5321 9.49573 19.5732 9.47302 19.6001L9.44831 19.6295L9.44302 19.6358L9.4423 19.6367C9.44239 19.6366 9.44249 19.6365 8.67111 19.0001C7.89973 18.3637 7.89986 18.3636 7.9 18.3634L7.90035 18.363L7.90127 18.3619L7.90402 18.3585L7.91315 18.3476L7.94576 18.3088C7.97383 18.2756 8.0145 18.2279 8.06739 18.167C8.17316 18.0451 8.32786 17.8701 8.52837 17.6518C8.92922 17.2153 9.51409 16.6049 10.258 15.8995C11.4754 14.745 13.1285 13.3269 15.1068 12.0001C13.1285 10.6733 11.4754 9.25517 10.258 8.10072C9.51409 7.3953 8.92922 6.78485 8.52837 6.34843C8.32786 6.13013 8.17316 5.95512 8.06739 5.83324C8.0145 5.77229 7.97383 5.7246 7.94576 5.6914L7.91315 5.65262L7.90402 5.64166L7.90127 5.63833L7.90035 5.63722L7.9 5.6368C7.89986 5.63662 7.89973 5.63647 8.67111 5.00009C9.44249 4.36372 9.44239 4.3636 9.44229 4.36348L9.44302 4.36435L9.4483 4.3707L9.47302 4.40009C9.49573 4.42695 9.53083 4.46813 9.57794 4.52242C9.67217 4.63101 9.81434 4.79193 10.0013 4.99551C10.3755 5.40284 10.9281 5.97989 11.6342 6.64947ZM9.44216 4.36332C9.44211 4.36326 9.44212 4.36327 9.44217 4.36334L9.44216 4.36332Z"
                                        fill="rgba(255,255,255,0.6)"
                                    />
                                </Svg>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Playlists placeholder */}
                <View style={styles.placeholderContainer}>
                    <View style={styles.iconCircle}>
                        <Svg
                            width={32}
                            height={32}
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <Path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth={1.5}
                            />
                        </Svg>
                    </View>
                    <Text style={styles.placeholderTitle}>
                        У вас пока нет плейлистов
                    </Text>
                    <Text style={styles.placeholderText}>
                        Создавайте плейлисты, чтобы они появились здесь
                    </Text>
                    <Button onPress={() => console.log('Create playlist')} style={styles.addButton}>
                        Создать плейлист
                    </Button>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 70,  // Increased to account for TitleBar height
        paddingBottom: 32,
    },
    sectionContainer: {
        marginTop: 8,
        marginBottom: 16,
    },
    sectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 5,
    },
    sectionIcon: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    sectionTextContainer: {
        flexDirection: 'column',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: 'YSMusic-HeadlineBold',
        color: 'white',
        fontSize: 24,
    },
    arrowIcon: {
        width: 24,
        height: 24,
        marginLeft: 6,
    },
    arrowIconHovered: {
        transform: [{ translateX: 3 }],
    },
    trackCount: {
        fontFamily: 'YSMusic-HeadlineBold',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        marginTop: -2,
    },
    placeholderContainer: {
        borderRadius: 12,
        padding: 28,
        marginTop: 16,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    placeholderTitle: {
        fontFamily: 'YSMusic-HeadlineBold',
        color: 'white',
        fontSize: 22,
        marginBottom: 8,
        textAlign: 'center',
    },
    placeholderText: {
        fontFamily: 'YSMusic-HeadlineBold',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    addButton: {
        marginTop: 16,
    }
}); 