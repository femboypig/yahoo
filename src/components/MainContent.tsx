import React from 'react';

export const MainContent: React.FC = () => {
  return (
    <main className="flex-1 p-3 flex flex-col">
      {/* Top container */}
      <div
        className="border border-gray-800 rounded-xl flex-1 p-6 mb-3"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      >
        {/* Logo in top left */}
        <div className="">
          <h1
            className="text-5xl font-bold text-white"
            style={{ fontFamily: "Yahoo Wide Regular, sans-serif" }}
          >
            Коллекция
          </h1>
        </div>

        {/* Content area */}
        <div className="flex items-center justify-center h-full">
          {/* Your main content can go here */}
        </div>
      </div>
      
      {/* Bottom container - full width */}
      <div className="bg-black border border-gray-800 rounded-xl p-4 h-24">
        {/* Bottom content can go here */}
      </div>
    </main>
  );
};

export default MainContent; 