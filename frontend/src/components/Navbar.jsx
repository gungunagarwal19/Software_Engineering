import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <Link to="/movies" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-pink-500">CineVibe</h1>
            </Link>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleProfile}
                className="p-2 rounded-full text-gray-300 hover:text-pink-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <FaUser className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-300 hover:text-pink-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <FaSignOutAlt className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Panel Overlay */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleProfile}></div>
          
          {/* Profile Panel */}
          <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-gray-900 to-black transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-pink-500">Profile</h2>
                <button
                  onClick={toggleProfile}
                  className="p-2 rounded-full text-gray-400 hover:text-pink-500 hover:bg-gray-800"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <Link
                  to="/profile"
                  className="block w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={toggleProfile}
                >
                  View Full Profile
                </Link>
                
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 