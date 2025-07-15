import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder, StatusBar, Platform, ScrollView, Image, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { TitleBar } from './TitleBar';
import { useFonts } from 'expo-font';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Height constants for the bottom sheet
const BOTTOM_SHEET_MIN_HEIGHT = 250; // Initial height
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT; // Full screen

// Content position constants
const CONTENT_TOP_POSITION = 150; // Starting position for main content
const CONTENT_COLLAPSED_POSITION = 220; // Position when panel is collapsed (lower than starting)

// Define music data type
interface MusicItem {
    id: number;
    title: string;
    artist: string;
    color: string;
}

// Empty music data - removed all tracks
const sampleMusicData: MusicItem[] = [];

interface LikesPageProps {
    onPageChange?: (page: string) => void;
}

export const LikesPage: React.FC<LikesPageProps> = ({ onPageChange }) => {
    // Load the custom font
    const [fontsLoaded] = useFonts({
        'YSMusic-HeadlineBold': require('../assets/YSMusic-HeadlineBold.ttf'),
    });

    // State to track if bottom sheet is expanded
    const [isExpanded, setIsExpanded] = useState(false);

    // State to track if scrolling should be enabled (separate from isExpanded)
    const [scrollingEnabled, setScrollingEnabled] = useState(false);

    // Animation progress value (0 = collapsed, 1 = expanded)
    const animationProgress = useRef(new Animated.Value(0)).current;

    // Effect to update scrolling status based on animation progress
    useEffect(() => {
        const listenerId = animationProgress.addListener(({ value }) => {
            // Disable scrolling when animation value is less than 0.9
            setScrollingEnabled(value > 0.9);
        });

        return () => {
            animationProgress.removeListener(listenerId);
        };
    }, []);

    // Scroll position for the music list
    const scrollY = useRef(new Animated.Value(0)).current;

    // Scroll position for the expanded view (separate from main scrollY)
    const expandedScrollY = useRef(new Animated.Value(0)).current;

    // Ref to track if the user is currently scrolling
    const isScrolling = useRef(false);

    // Ref to the scroll view to control scrolling programmatically
    const scrollViewRef = useRef<ScrollView>(null);

    // Ref to track if scroll is at top position
    const isScrollAtTop = useRef(true);

    // Swipe down to collapse when expanded
    const expandedPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only capture swipe down when scrolled to top position
                if (!isExpanded || !isScrollAtTop.current) return false;

                const dy = gestureState.dy;
                const dx = Math.abs(gestureState.dx);

                // Only respond to primarily downward gestures
                return dy > 20 && dy > dx * 2;
            },
            onPanResponderGrant: () => {
                // Initial touch - remember current position
                animationProgress.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                // Only handle downward movement when expanded
                if (isExpanded && gestureState.dy > 0) {
                    const dragDistance = -gestureState.dy / (SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
                    animationProgress.setValue(dragDistance);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Flatten offset and value
                animationProgress.flattenOffset();

                // If significant downward swipe or velocity, collapse the panel
                const shouldCollapse = gestureState.dy > 100 || gestureState.vy > 0.5;

                if (shouldCollapse) {
                    // Immediately disable scrolling
                    setScrollingEnabled(false);

                    // First smoothly scroll to top
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: 0, animated: true });
                    }

                    // After small delay to allow scroll to start, begin collapsing
                    setTimeout(() => {
                        Animated.spring(animationProgress, {
                            toValue: 0,
                            useNativeDriver: false,
                            tension: 25,
                            friction: 8,
                            restDisplacementThreshold: 0.001,
                            restSpeedThreshold: 0.001,
                            overshootClamping: false
                        }).start(() => {
                            setIsExpanded(false);
                        });
                    }, 100);
                } else {
                    // Return to expanded state and enable scrolling
                    Animated.spring(animationProgress, {
                        toValue: 1,
                        useNativeDriver: false,
                        tension: 25,
                        friction: 8,
                    }).start(() => {
                        setScrollingEnabled(true);
                    });
                }
            }
        })
    ).current;

    // Separate pan responder just for handle dragging
    const handlePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // For vertical movements only
                const dx = Math.abs(gestureState.dx);
                const dy = Math.abs(gestureState.dy);

                return dy > dx && dy > 5;
            },
            onPanResponderGrant: () => {
                // Initial touch - remember current position
                animationProgress.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                // When dragging up, use negative value (negative dy)
                // When dragging down, use positive value (positive dy)
                const dragDistance = -gestureState.dy / (SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);

                if (isExpanded) {
                    // When expanded, only allow dragging down (negative values)
                    if (dragDistance <= 0) {
                        animationProgress.setValue(dragDistance);
                    }
                } else {
                    // When collapsed, only allow dragging up (positive values)
                    if (dragDistance >= 0) {
                        animationProgress.setValue(dragDistance);
                    }
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Flatten offset and value
                animationProgress.flattenOffset();

                // Get current value using a variable
                let currentValue = 0;
                const id = animationProgress.addListener(({ value }) => {
                    currentValue = value;
                });
                // Remove listener to avoid memory leaks
                animationProgress.removeListener(id);

                // Velocity threshold for quick flicks
                const velocityThreshold = isExpanded ? 0.3 : -0.3;

                // Position threshold
                const positionThreshold = 0.25; // 25% of the way

                // Determine if we should expand or collapse
                let shouldExpand;

                if (isExpanded) {
                    // When expanded, should we keep it expanded?
                    // Collapse if dragged down more than threshold or flicked down quickly
                    shouldExpand = currentValue > -positionThreshold && gestureState.vy < velocityThreshold;
                } else {
                    // When collapsed, should we expand?
                    // Expand if dragged up more than threshold or flicked up quickly
                    shouldExpand = currentValue > positionThreshold || gestureState.vy < velocityThreshold;
                }

                Animated.spring(animationProgress, {
                    toValue: shouldExpand ? 1 : 0,
                    useNativeDriver: false,
                    tension: 25,
                    friction: 8,
                    restDisplacementThreshold: 0.001,
                    restSpeedThreshold: 0.001,
                    overshootClamping: false
                }).start(() => {
                    setIsExpanded(shouldExpand);

                    // If we collapsed the panel, scroll back to top
                    if (!shouldExpand && scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: 0, animated: false });
                    }
                });
            }
        })
    ).current;

    // Pan handlers for collapsed state to expand the panel
    const collapsedPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to primarily upward gestures
                const dy = gestureState.dy;
                const dx = Math.abs(gestureState.dx);

                return !isExpanded && dy < -20 && Math.abs(dy) > dx * 1.5;
            },
            onPanResponderGrant: () => {
                // Initial touch - remember current position
                animationProgress.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                // Only handle upward movement when collapsed
                if (!isExpanded && gestureState.dy < 0) {
                    const dragDistance = -gestureState.dy / (SCREEN_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
                    if (dragDistance >= 0) {
                        animationProgress.setValue(dragDistance);
                    }
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Flatten offset and value
                animationProgress.flattenOffset();

                // If significant upward swipe or velocity, expand the panel
                const shouldExpand = gestureState.dy < -100 || gestureState.vy < -0.5;

                if (shouldExpand) {
                    // Make sure we start from top when expanding
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: 0, animated: false });
                    }

                    Animated.spring(animationProgress, {
                        toValue: 1,
                        useNativeDriver: false,
                        tension: 25,
                        friction: 8,
                        restDisplacementThreshold: 0.001,
                        restSpeedThreshold: 0.001,
                        overshootClamping: false
                    }).start(() => {
                        setIsExpanded(true);
                    });
                } else {
                    // Return to collapsed state
                    Animated.spring(animationProgress, {
                        toValue: 0,
                        useNativeDriver: false,
                        tension: 25,
                        friction: 8,
                    }).start();
                }
            }
        })
    ).current;

    // Function to expand the panel
    const expandPanel = () => {
        if (!isExpanded) {
            // Make sure we start from top when expanding
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: false });
            }

            Animated.spring(animationProgress, {
                toValue: 1,
                useNativeDriver: false,
                tension: 25,
                friction: 8,
                restDisplacementThreshold: 0.001,
                restSpeedThreshold: 0.001,
                overshootClamping: false
            }).start(() => {
                setIsExpanded(true);
                setScrollingEnabled(true);
            });
        }
    };

    // Function to collapse the panel
    const collapsePanel = () => {
        if (isExpanded) {
            // Immediately disable scrolling
            setScrollingEnabled(false);

            // First smoothly scroll to top
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }

            // After small delay to allow scroll to start, begin collapsing
            setTimeout(() => {
                Animated.spring(animationProgress, {
                    toValue: 0,
                    useNativeDriver: false,
                    tension: 25,
                    friction: 8,
                    restDisplacementThreshold: 0.001,
                    restSpeedThreshold: 0.001,
                    overshootClamping: false
                }).start(() => {
                    setIsExpanded(false);
                });
            }, 100);
        }
    };

    // Handle navigation back
    const handleGoBack = () => {
        if (onPageChange) {
            onPageChange('collection');
        }
    };

    // Interpolated styles based on animation progress

    // 1. Bottom sheet height
    const bottomSheetAnimatedStyle = {
        height: animationProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [BOTTOM_SHEET_MIN_HEIGHT, BOTTOM_SHEET_MAX_HEIGHT],
            extrapolate: 'clamp'
        }),
        backgroundColor: '#000000', // Always black
        borderTopLeftRadius: animationProgress.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [16, 8, 0],
            extrapolate: 'clamp'
        }),
        borderTopRightRadius: animationProgress.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [16, 8, 0],
            extrapolate: 'clamp'
        })
    };

    // 2. Main content position
    const mainContentAnimatedStyle = {
        transform: [{
            translateY: animationProgress.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, -50, -120, -CONTENT_COLLAPSED_POSITION],
                extrapolate: 'clamp'
            })
        }]
    };

    // 3. Main content opacity
    const mainContentOpacity = animationProgress.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [1, 0.8, 0.3, 0],
        extrapolate: 'clamp'
    });

    // 4. Title bar opacity in expanded state
    const expandedTitleBarOpacity = animationProgress.interpolate({
        inputRange: [0.5, 0.7, 0.8, 1],
        outputRange: [0, 0.5, 0.8, 1],
        extrapolate: 'clamp'
    });

    // 5. Background overlay opacity
    const backgroundOverlayOpacity = animationProgress.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        extrapolate: 'clamp'
    });

    // 6. Title bar vertical position (to ensure smooth appearance)
    const titleBarTranslateY = animationProgress.interpolate({
        inputRange: [0.5, 0.8, 1],
        outputRange: [-20, -10, 0],
        extrapolate: 'clamp'
    });

    // 7. Drag handle opacity (fades out instead of abruptly disappearing)
    const dragHandleOpacity = animationProgress.interpolate({
        inputRange: [0, 0.3],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    // 8. Content top margin (smoothly transitions between states)
    const contentTopMargin = animationProgress.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [15, 25, 35, 40], // Reduced margins in both states
        extrapolate: 'clamp'
    });

    // 9. Text position for placeholder text
    const placeholderTextTranslateY = animationProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 30], // Move down slightly when expanded
        extrapolate: 'clamp'
    });

    // 10. Non-expanded titlebar opacity (transparent when expanded)
    const nonExpandedTitleBarOpacity = animationProgress.interpolate({
        inputRange: [0, 0.3],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    // 11. Top titlebar background opacity (only visible when scrolled)
    const topBarBackgroundOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.8],
        extrapolate: 'clamp'
    });

    // Render music item
    const renderMusicItem = (item: MusicItem, index: number) => {
        return (
            <View key={item.id} style={[styles.musicItem, { marginBottom: index === sampleMusicData.length - 1 ? 100 : 12 }]}>
                <View style={[styles.musicCover, { backgroundColor: item.color }]}>
                    <Svg height="24" width="24" viewBox="0 0 24 24">
                        <Path
                            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                            fill="white"
                        />
                    </Svg>
                </View>
                <View style={styles.musicInfo}>
                    <Text style={styles.musicTitle}>{item.title}</Text>
                    <Text style={styles.musicArtist}>{item.artist}</Text>
                </View>
                <TouchableOpacity style={styles.musicMoreButton}>
                    <Svg height="24" width="24" viewBox="0 0 24 24">
                        <Circle cx="5" cy="12" r="2" fill="white" />
                        <Circle cx="12" cy="12" r="2" fill="white" />
                        <Circle cx="19" cy="12" r="2" fill="white" />
                    </Svg>
                </TouchableOpacity>
            </View>
        );
    };

    // Handle animation end for specific cases
    const handlePanelAnimationEnd = (shouldBeExpanded: boolean) => {
        setIsExpanded(shouldBeExpanded);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background image */}
            <View style={styles.fullScreenContainer}>
                <ImageBackground
                    source={require('../assets/like_exp.png')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                        style={styles.gradient}
                        locations={[0.2, 0.7, 1]}
                    >
                        {/* Transparent top titlebar (when not expanded) */}
                        <Animated.View
                            style={[
                                styles.topTitleBarContainer,
                                { opacity: nonExpandedTitleBarOpacity }
                            ]}
                            pointerEvents={isExpanded ? 'none' : 'auto'}
                        >
                            <Animated.View
                                style={[
                                    styles.topTitleBarBackground,
                                    { opacity: topBarBackgroundOpacity }
                                ]}
                            />
                            <TitleBar>
                                <View style={styles.titleBarContent}>
                                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <Path
                                                d="M19 12H5"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <Path
                                                d="M12 19L5 12L12 5"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </Svg>
                                    </TouchableOpacity>

                                    <View style={styles.titleBarIcons}>
                                        {/* Search icon */}
                                        <TouchableOpacity style={styles.iconButton}>
                                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                                <Path
                                                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </Svg>
                                        </TouchableOpacity>

                                        {/* Three dots menu */}
                                        <TouchableOpacity style={styles.iconButton}>
                                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                                <Circle cx="5" cy="12" r="2" stroke="white" fill="white" />
                                                <Circle cx="12" cy="12" r="2" stroke="white" fill="white" />
                                                <Circle cx="19" cy="12" r="2" stroke="white" fill="white" />
                                            </Svg>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TitleBar>
                        </Animated.View>

                        {/* Darkening overlay that appears when panel is expanding */}
                        <Animated.View
                            style={[
                                styles.darkOverlay,
                                { opacity: backgroundOverlayOpacity }
                            ]}
                            pointerEvents="none"
                        />

                        {/* Animated main content (title and buttons) */}
                        <Animated.View
                            style={[
                                styles.textOverlay,
                                mainContentAnimatedStyle,
                                { opacity: mainContentOpacity }
                            ]}
                        >
                            <Text style={styles.title}>Мне нравится</Text>

                            {/* Buttons section */}
                            <View style={styles.buttonsContainer}>
                                {/* Listen button */}
                                <View style={styles.buttonWithLabel}>
                                    <TouchableOpacity style={styles.circleButtonYellow}>
                                        <Svg width={30} height={28} viewBox="0 0 31 28" fill="none">
                                            <Path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M4.66666 1.16663V14H25.6667V13.125C16.9167 9.91663 6.70833 1.16663 6.70833 1.16663H4.66666ZM4.66666 26.8333V14H25.6667V14.875C16.9167 18.0833 6.70833 26.8333 6.70833 26.8333H4.66666Z"
                                                fill="#000000"
                                            />
                                        </Svg>
                                    </TouchableOpacity>
                                    <Text style={styles.buttonLabel}>Слушать</Text>
                                </View>

                                {/* Upload button */}
                                <View style={styles.buttonWithLabel}>
                                    <TouchableOpacity style={styles.circleButton}>
                                        <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                                            <Path
                                                d="M12 4L12 20M4 12L20 12"
                                                stroke="white"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                            />
                                        </Svg>
                                    </TouchableOpacity>
                                    <Text style={styles.buttonLabel}>Добавить</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </LinearGradient>
                </ImageBackground>

                {/* Bottom Sheet Panel */}
                <Animated.View
                    style={[styles.bottomSheet, bottomSheetAnimatedStyle]}
                    {...(isExpanded ? expandedPanResponder.panHandlers : collapsedPanResponder.panHandlers)}
                >
                    {/* Title Bar (only visible when expanded) */}
                    <Animated.View
                        style={[
                            styles.titleBarWrapper,
                            {
                                opacity: expandedTitleBarOpacity,
                                transform: [{ translateY: titleBarTranslateY }]
                            }
                        ]}
                        pointerEvents="auto"
                    >
                        <TitleBar scrollY={expandedScrollY}>
                            <View style={styles.titleBarContent}>
                                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <Path
                                            d="M19 12H5"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <Path
                                            d="M12 19L5 12L12 5"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </Svg>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={collapsePanel}>
                                    <Text style={styles.titleBarText}>Мне нравится</Text>
                                </TouchableOpacity>

                                <View style={styles.titleBarIcons}>
                                    {/* Search icon */}
                                    <TouchableOpacity style={styles.iconButton}>
                                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                            <Path
                                                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </Svg>
                                    </TouchableOpacity>

                                    {/* Three dots menu */}
                                    <TouchableOpacity style={styles.iconButton}>
                                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                            <Circle cx="5" cy="12" r="2" stroke="white" fill="white" />
                                            <Circle cx="12" cy="12" r="2" stroke="white" fill="white" />
                                            <Circle cx="19" cy="12" r="2" stroke="white" fill="white" />
                                        </Svg>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TitleBar>
                    </Animated.View>

                    {/* Drag Handle (always present but fades out) */}
                    <Animated.View
                        style={[styles.dragHandle, { opacity: dragHandleOpacity, zIndex: 20 }]}
                        {...handlePanResponder.panHandlers}
                    >
                        <TouchableOpacity
                            style={styles.dragHandleTouch}
                            onPress={isExpanded ? collapsePanel : expandPanel}
                        >
                            <View style={styles.dragHandleBar}></View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Make the entire bottom sheet content scrollable */}
                    <Animated.ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        scrollEnabled={scrollingEnabled}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: isExpanded ? expandedScrollY : scrollY } } }],
                            {
                                useNativeDriver: false,
                                listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                                    // Track if scroll is at top position
                                    const offsetY = event.nativeEvent.contentOffset.y;
                                    isScrollAtTop.current = offsetY <= 1;
                                }
                            }
                        )}
                        contentContainerStyle={styles.scrollViewContent}
                        onScrollBeginDrag={() => { isScrolling.current = true; }}
                        onScrollEndDrag={() => { setTimeout(() => { isScrolling.current = false; }, 50); }}
                        onMomentumScrollBegin={() => { isScrolling.current = true; }}
                        onMomentumScrollEnd={() => { setTimeout(() => { isScrolling.current = false; }, 50); }}
                    >
                        <View style={styles.scrollViewTopPadding} />

                        {/* Content of the bottom sheet */}
                        <Animated.View
                            style={[
                                styles.bottomSheetContent,
                                { marginTop: contentTopMargin }
                            ]}
                        >
                            {sampleMusicData.length === 0 ? (
                                <Animated.View
                                    style={[
                                        styles.placeholderContainer,
                                        { transform: [{ translateY: placeholderTextTranslateY }] }
                                    ]}
                                >
                                    <Text style={styles.placeholderText}>
                                        Здесь будет отображаться понравившаяся вам музыка
                                    </Text>
                                </Animated.View>
                            ) : (
                                <View>
                                    {sampleMusicData.map((item, index) => renderMusicItem(item, index))}
                                </View>
                            )}
                        </Animated.View>
                    </Animated.ScrollView>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullScreenContainer: {
        flex: 1,
        position: 'relative',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%', // Cover the entire image with gradient
        justifyContent: 'flex-end', // Align content to bottom
    },
    topTitleBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    topTitleBarBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: '#000',
    },
    darkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 1,
    },
    textOverlay: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 250, // Increased to move content higher up on screen
        zIndex: 2,
    },
    title: {
        color: 'white',
        fontSize: 36,
        fontFamily: 'YSMusic-HeadlineBold',
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    buttonWithLabel: {
        alignItems: 'center',
        marginHorizontal: 15,
    },
    circleButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    circleButtonYellow: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFD52E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonLabel: {
        color: 'white',
        fontFamily: 'YSMusic-HeadlineBold',
        fontSize: 16,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        zIndex: 10,
    },
    titleBarWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 80,
    },
    dragHandle: {
        width: '100%',
        height: 20, // Reduced from 30
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 5, // Reduced from 10
        left: 0,
        right: 0,
        zIndex: 10,
    },
    dragHandleBar: {
        width: 70, // Increased from 40
        height: 3, // Reduced from 5
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 1.5,
    },
    bottomSheetContent: {
        paddingHorizontal: 0, // Changed from 16 to 0 for full-width tracks
    },
    titleBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
    },
    titleBarText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'YSMusic-HeadlineBold',
        fontWeight: 'bold',
    },
    titleBarIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 10,
        marginLeft: 10,
    },
    backButton: {
        padding: 10,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    placeholderText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 16,
        fontFamily: 'YSMusic-HeadlineBold',
        textAlign: 'center',
    },
    scrollViewContent: {
        paddingBottom: 20,
        paddingTop: 30, // Reduced from 50
        position: 'relative',
    },
    scrollViewTopPadding: {
        height: 10, // Reduced from 20
    },
    musicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    musicCover: {
        width: 50,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    musicInfo: {
        flex: 1,
    },
    musicTitle: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'YSMusic-HeadlineBold',
        marginBottom: 4,
    },
    musicArtist: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    musicMoreButton: {
        padding: 8,
    },
    dragHandleTouch: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LikesPage; 