import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';

interface BottomBarProps {
    activePage: string;
    onPageChange: (page: string) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ activePage, onPageChange }) => {
    // Read SVG files and use their content
    const [svgs, setSvgs] = React.useState<{ [key: string]: string }>({
        note: '',
        lib: '',
        hearth: ''
    });

    React.useEffect(() => {
        // Hardcoded SVGs as fallback (in case we can't read the files)
        const noteSvgFallback = `<svg width="48" height="78" viewBox="0 0 48 78" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M47.7051 17.7559V3.15634C47.7051 1.05664 45.9961 -0.359359 43.8965 0.0801407L23.7793 4.47464C21.1426 5.06064 19.7266 6.42774 19.7266 8.72274V51.6914C19.9707 53.4492 19.1406 54.5723 17.5782 54.8652L11.4746 56.1348C3.66208 57.7949 0 61.7988 0 67.7559C0 73.7618 4.63868 77.961 11.1328 77.961C16.8457 77.961 25.4395 73.7129 25.4395 62.3848V27.0332C25.4395 25.0801 25.7813 24.7871 27.4903 24.4453L45.5078 20.4414C46.8262 20.1484 47.7051 19.1231 47.7051 17.7559Z" fill="white"/>
</svg>`;

        const libSvgFallback = `<svg width="95" height="86" viewBox="0 0 95 86" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M56.4453 85.498H66.4063C69.3848 85.498 71.0938 83.789 71.0938 80.8593V4.6386C71.0938 1.7089 69.3848 0 66.4063 0H56.4453C53.4668 0 51.8067 1.7089 51.8067 4.6386V80.8593C51.8067 83.789 53.4668 85.498 56.4453 85.498ZM26.3184 85.498H42.334C45.3125 85.498 47.0215 83.789 47.0215 80.8593V28.8574C47.0215 25.9277 45.3125 24.2187 42.334 24.2187H26.3184C23.3887 24.2187 21.6797 25.9277 21.6797 28.8574V80.8593C21.6797 83.789 23.3887 85.498 26.3184 85.498ZM4.63868 85.498H12.2559C15.1856 85.498 16.8946 83.789 16.8946 80.8593V15.7226C16.8946 12.7929 15.1856 11.0839 12.2559 11.0839H4.63868C1.70898 11.0839 0 12.7929 0 15.7226V80.8593C0 83.789 1.70898 85.498 4.63868 85.498ZM83.3985 85.6445L89.9903 84.6679C92.8714 84.2285 94.3364 82.4218 93.9944 79.4921L86.1817 14.8925C85.8887 11.9628 84.0332 10.4003 81.0547 10.8398L74.4629 11.8164C71.5821 12.2558 70.1172 14.0625 70.459 16.9921L78.2715 81.5918C78.6133 84.5214 80.4199 86.0839 83.3985 85.6445ZM30.4688 38.7207C28.9063 38.7207 27.7344 37.5488 27.7344 36.0351C27.7344 34.5703 28.9063 33.3984 30.4688 33.3984H38.3301C39.8438 33.3984 40.9668 34.5703 40.9668 36.0351C40.9668 37.5488 39.8438 38.7207 38.3301 38.7207H30.4688ZM30.4688 76.3671C28.9063 76.3671 27.7344 75.1464 27.7344 73.6816C27.7344 72.2167 28.9063 71.0449 30.4688 71.0449H38.3301C39.8438 71.0449 40.9668 72.2167 40.9668 73.6816C40.9668 75.1464 39.8438 76.3671 38.3301 76.3671H30.4688Z" fill="white"/>
</svg>`;

        const hearthSvgFallback = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="white"/>
</svg>`;

        // Try to read files, fall back to hardcoded if needed
        const readSvgFiles = async () => {
            try {
                // Use FileSystem to read files
                const noteFilePath = FileSystem.documentDirectory + 'assets/note.svg';
                const libFilePath = FileSystem.documentDirectory + 'assets/lib.svg';
                const hearthFilePath = FileSystem.documentDirectory + 'assets/hearth.svg';

                // Set fallbacks as default
                setSvgs({
                    note: noteSvgFallback,
                    lib: libSvgFallback,
                    hearth: hearthSvgFallback
                });

                // Try to read actual files (this might not work in this context)
                try {
                    const noteSvg = await FileSystem.readAsStringAsync(noteFilePath);
                    const libSvg = await FileSystem.readAsStringAsync(libFilePath);
                    const hearthSvg = await FileSystem.readAsStringAsync(hearthFilePath);

                    setSvgs({
                        note: noteSvg || noteSvgFallback,
                        lib: libSvg || libSvgFallback,
                        hearth: hearthSvg || hearthSvgFallback
                    });
                } catch (error) {
                    console.log('Using fallback SVGs');
                }
            } catch (error) {
                console.error('Error setting up SVGs:', error);
            }
        };

        readSvgFiles();
    }, []);

    // Function to apply color to SVG based on active state
    const getColoredSvg = (svgContent: string, isActive: boolean) => {
        if (!svgContent) return '';
        return svgContent.replace('fill="white"', isActive ? 'fill="white"' : 'fill="#8A8A8A"');
    };

    return (
        <View className="absolute bottom-0 left-0 right-0 h-16" style={{ zIndex: 100 }}>
            {/* Apply consistent blur effect for all platforms */}
            <View
                className="absolute w-full h-full"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
            />
            <BlurView
                intensity={80}
                tint="dark"
                className="absolute w-full h-full"
            />

            <View className="w-full h-full flex-row justify-around items-center">
                <TouchableOpacity
                    className="items-center justify-center py-2 px-4"
                    onPress={() => onPageChange('home')}
                >
                    {svgs.note && (
                        <SvgXml
                            xml={getColoredSvg(svgs.note, activePage === 'home')}
                            width={28}
                            height={28}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="items-center justify-center py-2 px-4"
                    onPress={() => onPageChange('library')}
                >
                    {svgs.lib && (
                        <SvgXml
                            xml={getColoredSvg(svgs.lib, activePage === 'library')}
                            width={28}
                            height={28}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="items-center justify-center py-2 px-4"
                    onPress={() => onPageChange('collection')}
                >
                    {svgs.hearth && (
                        <SvgXml
                            xml={getColoredSvg(svgs.hearth, activePage === 'collection')}
                            width={28}
                            height={28}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}; 