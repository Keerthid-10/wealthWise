import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            WEALTHWISE
          </Link>

          <div className="navbar-menu">
            {!isAuthenticated ? (
              <div className="navbar-actions">
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/signup" className="nav-link signup-btn">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="navbar-actions">
                <span className="nav-link user-greeting">
                  Hello, {user?.name || 'User'}
                </span>
                <Link to="/home" className="nav-link">
                  Home
                </Link>
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
                <NotificationBell />
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
