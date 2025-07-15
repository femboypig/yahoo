import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
    onPress?: () => void;
    style?: any;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    onPress,
    style,
    ...props
}) => {
    const [isActive, setIsActive] = useState(false);
    // Animation value for pressed state
    const animatedScale = useRef(new Animated.Value(1)).current;
    const animatedOpacity = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        setIsActive(true);
        Animated.parallel([
            Animated.timing(animatedScale, {
                toValue: 0.97,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(animatedOpacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePressOut = () => {
        setIsActive(false);
        Animated.parallel([
            Animated.timing(animatedScale, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(animatedOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    };

    const buttonStyles = [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : styles.primaryButton,
        style
    ];

    const textStyles = [
        styles.text,
    ];

    return (
        <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
            <TouchableOpacity
                style={buttonStyles}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.95}
                {...props}
            >
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.overlay,
                        { opacity: animatedOpacity }
                    ]}
                />
                <Text style={textStyles}>
                    {children}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    primaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButton: {
        backgroundColor: 'rgba(50, 50, 50, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        position: 'absolute',
        borderRadius: 24,
    },
    text: {
        color: 'white',
        fontFamily: 'YSMusic-HeadlineBold',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default Button; 