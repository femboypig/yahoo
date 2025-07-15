import './global.css';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { BottomBar } from './components/BottomBar';
import { HomePage } from './components/HomePage';
import { LibraryPage } from './components/LibraryPage';
import { CollectionPage } from './components/CollectionPage';
import { MyMusicPage } from './components/MyMusicPage';
import { LikesPage } from './components/LikesPage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Images to preload
const IMAGES_TO_PRELOAD = [
  require('./assets/my_music_exp.png'),
  require('./assets/my_music.png'),
  require('./assets/like.png'),
  require('./assets/like_exp.png'),
  require('./assets/playlists.png'),
  // Add other images here as needed
];

// Define page relationships for gallery view
const PAGE_RELATIONSHIPS = {
  'library': ['mymusic'],
  'collection': ['likes'],
  'mymusic': { parent: 'library' },
  'likes': { parent: 'collection' },
};

// Helper function to determine transition direction
const getTransitionDirection = (currentPage: string, nextPage: string): string => {
  // Going deeper (library -> mymusic or collection -> likes)
  if (
    (currentPage === 'library' && nextPage === 'mymusic') ||
    (currentPage === 'collection' && nextPage === 'likes')
  ) {
    return 'forward';
  }

  // Going back (mymusic -> library or likes -> collection)
  if (
    (currentPage === 'mymusic' && nextPage === 'library') ||
    (currentPage === 'likes' && nextPage === 'collection')
  ) {
    return 'back';
  }

  // Bottom navigation - determine by position
  const pageOrder = ['home', 'library', 'collection'];
  const currentIndex = pageOrder.indexOf(currentPage);
  const nextIndex = pageOrder.indexOf(nextPage);

  if (currentIndex !== -1 && nextIndex !== -1) {
    return nextIndex > currentIndex ? 'forward' : 'back';
  }

  // Default
  return 'forward';
};

// Главный компонент приложения
export default function App() {
  // Состояния для страниц и предзагрузки
  const [activePage, setActivePage] = useState('home');
  const [appReady, setAppReady] = useState(false);

  // Анимационные значения для каждой страницы
  const animations: Record<string, Animated.Value> = {
    home: useRef(new Animated.Value(0)).current,
    library: useRef(new Animated.Value(-SCREEN_WIDTH)).current,
    collection: useRef(new Animated.Value(-SCREEN_WIDTH)).current,
    mymusic: useRef(new Animated.Value(-SCREEN_WIDTH)).current,
    likes: useRef(new Animated.Value(-SCREEN_WIDTH)).current,
  };

  // Вместо простого флага для блокировки, будем хранить текущий переход
  const currentTransition = useRef<{ from: string, to: string } | null>(null);

  // Предварительная загрузка изображений
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const imageAssets = IMAGES_TO_PRELOAD.map(image => Asset.fromModule(image).downloadAsync());
        await Promise.all(imageAssets);
        setAppReady(true);
      } catch (error) {
        console.log('Error preloading assets:', error);
        setAppReady(true);
      }
    };

    preloadAssets();

    // Очистка всех анимаций при размонтировании
    return () => {
      Object.values(animations).forEach(anim => {
        anim.stopAnimation();
      });
    };
  }, []);

  // Обработчик смены страницы
  const handlePageChange = (newPage: string) => {
    const currentPage = activePage;

    // Игнорируем переходы на ту же страницу
    if (newPage === activePage) {
      return;
    }

    // Если уже идет другой переход - прерываем его
    if (currentTransition.current) {
      // Завершаем текущие анимации немедленно
      Animated.timing(animations[currentTransition.current.from], {
        toValue: -SCREEN_WIDTH * 2, // Отправляем далеко за пределы экрана
        duration: 1,
        useNativeDriver: true
      }).start();

      Animated.timing(animations[currentTransition.current.to], {
        toValue: SCREEN_WIDTH * 2, // Отправляем далеко за пределы экрана
        duration: 1,
        useNativeDriver: true
      }).start();
    }

    // Запоминаем текущий переход
    currentTransition.current = { from: currentPage, to: newPage };

    // Определяем направление перехода
    const direction = getTransitionDirection(currentPage, newPage);

    // Позиционируем новую страницу за пределами экрана
    const startPosition = direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    if (animations[newPage]) {
      animations[newPage].setValue(startPosition);
    }

    // Устанавливаем новую активную страницу немедленно
    setActivePage(newPage);

    // Запускаем анимацию ухода текущей страницы
    if (animations[currentPage]) {
      Animated.spring(animations[currentPage], {
        toValue: direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH,
        tension: 120,
        friction: 8,
        useNativeDriver: true
      }).start();
    }

    // Запускаем анимацию появления новой страницы
    if (animations[newPage]) {
      Animated.spring(animations[newPage], {
        toValue: 0,
        tension: 120,
        friction: 8,
        useNativeDriver: true
      }).start(() => {
        // После завершения анимации
        if (currentTransition.current &&
          currentTransition.current.from === currentPage &&
          currentTransition.current.to === newPage) {
          currentTransition.current = null;
        }
      });
    }
  };

  // Создаем объект пропсов для передачи страницам
  const pageProps = {
    onPageChange: handlePageChange
  };

  // Экран загрузки
  if (!appReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFD52E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" translucent={true} />

      {/* Контейнер страниц */}
      <View className="flex-1 overflow-hidden">
        {/* Все страницы всегда рендерятся, но находятся за пределами экрана */}
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ translateX: animations.home }],
          }}
        >
          <HomePage />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ translateX: animations.library }],
          }}
        >
          <LibraryPage {...pageProps} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ translateX: animations.collection }],
          }}
        >
          <CollectionPage {...pageProps} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ translateX: animations.mymusic }],
          }}
        >
          <MyMusicPage {...pageProps} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ translateX: animations.likes }],
          }}
        >
          <LikesPage {...pageProps} />
        </Animated.View>
      </View>

      {/* Нижняя панель навигации */}
      <BottomBar
        activePage={activePage}
        onPageChange={handlePageChange}
      />
    </View>
  );
}
