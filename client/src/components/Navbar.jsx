import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/api';
import './Navbar.css'; // We'll create this for Navbar specific styles

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); // Call API logout if it exists
    } catch (error) {
      console.error("Logout error (if backend endpoint exists):", error);
    } finally {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setIsMobileMenuOpen(false);
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          OnlineBank
        </Link>

        <div className="menu-icon" onClick={toggleMobileMenu}>
          {/* Simple Hamburger Icon */}
          <div className={isMobileMenuOpen ? 'bar1 change' : 'bar1'}></div>
          <div className={isMobileMenuOpen ? 'bar2 change' : 'bar2'}></div>
          <div className={isMobileMenuOpen ? 'bar3 change' : 'bar3'}></div>
        </div>

        <ul className={isMobileMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/accounts" className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                  Accounts
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/transfers" className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                  Transfers
                </Link>
              </li>
              {/* Add more authenticated links here */}
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-links-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/signup" className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;