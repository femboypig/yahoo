import React, { useState, CSSProperties, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsActive(false);
    };

    const baseStyle: CSSProperties = {
        backgroundColor: isActive
            ? 'rgba(255, 255, 255, 0.08)'
            : isHovered
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '8px 20px',
        fontFamily: 'Yahoo Wide Regular, sans-serif',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.12s ease-in-out',
        transform: isActive ? 'scale(0.97)' : 'scale(1)',
        boxShadow: isActive
            ? 'inset 0 2px 3px rgba(0, 0, 0, 0.15)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
        outline: 'none',
    };

    // Secondary variant styles
    const secondaryStyle: CSSProperties = variant === 'secondary' ? {
        backgroundColor: isActive
            ? 'rgba(50, 50, 50, 0.6)'
            : isHovered
                ? 'rgba(50, 50, 50, 0.4)'
                : 'rgba(50, 50, 50, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    } : {};

    // Combine styles
    const buttonStyle = {
        ...baseStyle,
        ...secondaryStyle
    };

    return (
        <button
            style={buttonStyle}
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button; 