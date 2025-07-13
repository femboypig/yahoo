import React, { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Collection from "./components/Collection";
import Home from "./components/Home";
import Library from "./components/Library";
import LikesPage from "./components/LikesPage";
import MyMusicPage from "./components/MyMusicPage";

function App() {
  const [activePage, setActivePage] = useState('home');

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  return (
    <div className="flex min-h-screen bg-black overflow-hidden">
      {/* Invisible titlebar for dragging */}
      <div data-tauri-drag-region className="fixed top-0 left-0 w-full h-8 z-10" />

      {/* Components */}
      <Sidebar onPageChange={handlePageChange} activePage={activePage} />

      {/* Main Content Area with fixed height */}
      <main className="flex-1 p-3 pl-0 flex flex-col h-screen overflow-hidden">
        {/* Top container - fixed height with internal scrolling */}
        <div
          className="border border-gray-800 rounded-xl flex-1 mb-3 overflow-hidden"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            height: "calc(100vh - 124px)" // Fixed height: viewport height minus padding and bottom container
          }}
        >
          <div className="h-full overflow-hidden">
            {activePage === 'home' && <Home />}
            {activePage === 'library' && <Library onPageChange={handlePageChange} />}
            {activePage === 'collection' && <Collection onPageChange={handlePageChange} />}
            {activePage === 'likes' && <LikesPage />}
            {activePage === 'mymusic' && <MyMusicPage />}
          </div>
        </div>

        {/* Bottom container - fixed height */}
        <div className="bg-black border border-gray-800 rounded-xl p-4 h-24 flex-shrink-0">
          {/* Bottom content can go here */}
        </div>
      </main>
    </div>
  );
}

export default App;
