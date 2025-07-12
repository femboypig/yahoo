import React, { useState } from 'react';
import yahooLogo from '../assets/yahoo.svg';
import yahooVerticalLogo from '../assets/yahoo-v.svg';
import noteIcon from '../assets/note.svg';
import hearthIcon from '../assets/hearth.svg';
import arrowIcon from '../assets/arrow.svg';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  return (
    <div
      className={`bg-black sidebar-transition ${collapsed ? 'w-20' : 'w-64'}`}
      onMouseEnter={() => setShowArrow(true)}
      onMouseLeave={() => setShowArrow(false)}
    >
      <div className="p-4 relative">
        {/* Toggle arrow */}
        <div
          className={`absolute -right-3 top-16 bg-black p-1 mr-3 rounded-full cursor-pointer transition-opacity duration-300 ${showArrow ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <img
            src={arrowIcon}
            alt="Toggle sidebar"
            className={`h-6 w-6 transition-transform duration-500 ease-in-out ${collapsed ? 'rotate-180' : ''}`}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Logo in sidebar - centered horizontally */}
        <div className="flex justify-center mb-6 mt-12">
          {collapsed ? (
            <img
              src={yahooVerticalLogo}
              alt="Yahoo!"
              className="h-28 sidebar-content-transition"
              style={{ opacity: 1, transform: 'scale(1)', transitionDelay: '0.1s' }}
            />
          ) : (
            <img
              src={yahooLogo}
              alt="Yahoo!"
              className="h-6 sidebar-content-transition"
              style={{
                filter: 'invert(82%) sepia(51%) saturate(726%) hue-rotate(359deg) brightness(103%) contrast(103%)',
                opacity: 1,
                transform: 'scale(1)',
                transitionDelay: '0.1s'
              }}
            />
          )}
        </div>

        {/* Navigation items */}
        <nav className={`mt-8 flex flex-col ${collapsed ? 'items-center' : 'ml-4'} sidebar-content-transition`}>
          <div
            className={`flex items-center p-2 rounded cursor-pointer ${collapsed ? 'justify-center' : 'ml-[7px]'} ${activePage === 'home' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors duration-300`}
            onClick={() => onPageChange('home')}
          >
            <img
              src={noteIcon}
              alt="Note"
              className={`${collapsed ? 'h-7' : 'h-7 mr-3'} sidebar-content-transition`}
              style={{
                filter: activePage === 'home'
                  ? 'brightness(0) invert(1)'
                  : 'brightness(0) invert(0.5)'
              }}
            />
            <span
              className={`text-xl sidebar-content-transition ${collapsed ? 'opacity-0 absolute w-0 overflow-hidden' : 'opacity-100 w-auto'}`}
              style={{ fontFamily: "Yahoo Wide Regular, sans-serif", transformOrigin: 'left center' }}
            >
              Главная
            </span>
          </div>

          {/* Collection navigation item */}
          <div
            className={`flex items-center p-2 rounded cursor-pointer mt-2 ${collapsed ? 'justify-center' : ''} ${activePage === 'collection' ? 'text-white' : 'text-gray-500'} hover:text-white transition-colors duration-300`}
            onClick={() => onPageChange('collection')}
          >
            <img
              src={hearthIcon}
              alt="Collection"
              className={`${collapsed ? 'h-6' : 'h-6 mr-3'} sidebar-content-transition`}
              style={{
                filter: activePage === 'collection'
                  ? 'brightness(0) invert(1)'
                  : 'brightness(0) invert(0.5)'
              }}
            />
            <span
              className={`text-xl sidebar-content-transition ${collapsed ? 'opacity-0 absolute w-0 overflow-hidden' : 'opacity-100 w-auto'}`}
              style={{ fontFamily: "Yahoo Wide Regular, sans-serif", transformOrigin: 'left center' }}
            >
              Коллекция
            </span>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 