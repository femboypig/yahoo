import React from 'react';
import yahooLogo from '../assets/yahoo.svg';
import noteIcon from '../assets/note.svg';
import hearthIcon from '../assets/hearth.svg';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  return (
    <div className="bg-black w-64">
      <div className="p-4">
        {/* Logo in sidebar - centered horizontally */}
        <div className="mb-6 mt-12 flex justify-center">
          <img 
            src={yahooLogo} 
            alt="Yahoo!" 
            className="h-6" 
            style={{ filter: 'invert(82%) sepia(51%) saturate(726%) hue-rotate(359deg) brightness(103%) contrast(103%)' }} 
          />
        </div>
        
        {/* Navigation items - left aligned */}
        <nav className="mt-8 ml-4 flex flex-col">
          <div 
            className={`ml-[7px] flex items-center p-2 rounded cursor-pointer ${activePage === 'home' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
            onClick={() => onPageChange('home')}
          >
            <img 
              src={noteIcon} 
              alt="Note" 
              className="h-7 w-auto mr-3" 
              style={{ 
                filter: activePage === 'home' 
                  ? 'brightness(0) invert(1)' 
                  : 'brightness(0) invert(0.5)'
              }}
            />
            <span className="text-xl" style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}>
              Главная
            </span>
          </div>
          
          {/* Collection navigation item */}
          <div 
            className={`flex items-center p-2 rounded cursor-pointer mt-2 ${activePage === 'collection' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors`}
            onClick={() => onPageChange('collection')}
          >
            <img 
              src={hearthIcon} 
              alt="Collection" 
              className="h-6 w-auto mr-3" 
              style={{ 
                filter: activePage === 'collection' 
                  ? 'brightness(0) invert(1)' 
                  : 'brightness(0) invert(0.5)'
              }}
            />
            <span className="text-xl" style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}>
              Коллекция
            </span>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 