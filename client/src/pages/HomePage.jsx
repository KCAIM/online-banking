import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We'll create this CSS file

// Note: The Navbar is handled in App.jsx and will appear above this content.
// This component focuses on the main page content below the Navbar.

const HomePage = () => {
  return (
    <div className="homepage-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container"> {/* Use the existing container class */}
          <h1>Welcome to YourBank</h1>
          <p className="subtitle">Secure, Simple, and Smart Online Banking for 2025.</p>
          <div className="hero-cta">
            {/* These links navigate to existing routes */}
            <Link to="/signup" className="btn btn-primary btn-large">Open an Account</Link>
            <Link to="/features" className="btn btn-outline btn-large">Learn More</Link> {/* Link to a potential features page or section */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container"> {/* Use the existing container class */}
          <h2>Why Choose YourBank?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">💻</div> {/* Replace with actual icon */}
              <h3>24/7 Online Access</h3>
              <p>Manage your finances anytime, anywhere, from any device.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div> {/* Replace with actual icon */}
              <h3>State-of-the-Art Security</h3>
              <p>Your peace of mind is our priority with multi-layered security.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div> {/* Replace with actual icon */}
              <h3>Mobile Banking App</h3>
              <p>Bank on the go with our intuitive and powerful mobile application.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div> {/* Replace with actual icon */}
              <h3>Dedicated Support</h3>
              <p>Our expert team is here to help you every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container"> {/* Use the existing container class */}
          <h2>Ready to Experience Modern Banking?</h2>
          <p>Join thousands of satisfied customers and take control of your financial future.</p>
          {/* This link navigates to the existing signup route */}
          <Link to="/signup" className="btn btn-primary btn-large">Get Started Today</Link>
        </div>
      </section>

      {/* Security Information Section */}
      <section className="security-info-section">
        <div className="container"> {/* Use the existing container class */}
          <h2>Your Security, Our Commitment</h2>
          <p>We employ advanced security measures to protect your information and transactions. Learn more about our security practices.</p>
          <div className="trust-badges">
            {/* Replace with actual trust badges/icons */}
            <span>FDIC Insured (if applicable)</span> | <span>SSL Encryption</span> | <span>Fraud Protection</span>
          </div>
        </div>
      </section>

      {/* Footer Section (Simple footer for the page content area) */}
      <footer className="homepage-footer">
        <div className="container"> {/* Use the existing container class */}
          <div className="footer-links">
            {/* These links would ideally go to separate pages */}
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/contact-us">Contact Us</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} YourBank. All rights reserved.</p>
          <p>YourBank is a fictional entity for demonstration purposes. This is not a real bank.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;