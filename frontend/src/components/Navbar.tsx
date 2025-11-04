import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Show additional nav items when on expenses or any related pages
  const showExtendedNav = ['/expenses', '/budget-planner', '/financial-goals', '/savings', '/community-savings'].some(
    path => location.pathname.startsWith(path)
  );

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to={isAuthenticated ? "/home" : "/"} className="navbar-brand">
            WEALTHWISE
          </Link>

          <div className="navbar-menu">
            {!isAuthenticated ? (
              <div className="navbar-actions">
                <Link to="/login" className="btn btn-outline-primary">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="navbar-actions">
                <div className="nav-items-left">
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                    <i className="bi bi-speedometer2"></i> Dashboard
                  </Link>

                  {isActive('/dashboard') && (
                    <Link to="/reports" className="nav-link">
                      <i className="bi bi-file-earmark-bar-graph"></i> Reports
                    </Link>
                  )}

                  <Link to="/expenses" className={`nav-link ${isActive('/expenses') ? 'active' : ''}`}>
                    <i className="bi bi-wallet2"></i> Expenses
                  </Link>

                  {showExtendedNav && (
                    <>
                      <Link to="/budget-planner" className={`nav-link ${isActive('/budget-planner') ? 'active' : ''}`}>
                        <i className="bi bi-calculator"></i> Budget
                      </Link>
                      <Link to="/financial-goals" className={`nav-link ${isActive('/financial-goals') ? 'active' : ''}`}>
                        <i className="bi bi-bullseye"></i> Goals
                      </Link>
                      <Link to="/savings" className={`nav-link ${isActive('/savings') ? 'active' : ''}`}>
                        <i className="bi bi-piggy-bank"></i> Savings
                      </Link>
                      <Link to="/community-savings" className={`nav-link ${location.pathname.startsWith('/community-savings') ? 'active' : ''}`}>
                        <i className="bi bi-people"></i> Community
                      </Link>
                    </>
                  )}
                </div>

                <div className="nav-items-right">
                  <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                    <i className="bi bi-person-circle"></i> Profile
                  </Link>

                  <button onClick={handleLogout} className="btn btn-outline-primary">
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
