import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from '../services/api'; // Assuming signupUser handles the API call

function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '', // Added email field, common for signup
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  // success state is removed as its display is handled by SignUpSuccessPage
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Basic email validation (optional, can be more robust)
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
    }

    setIsLoading(true);
    try {
      const apiPayload = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      
      // Assuming signupUser sends the request and resolves if server acknowledges
      // or throws an error if the request itself fails (e.g., network issue, server error response)
      await signupUser(apiPayload);
      
      // On successful API call initiation, navigate to the success page
      // The actual account creation might still be processing in the background
      navigate('/signup-success');

    } catch (err) {
      console.error("SignupPage: Signup failed:", err);
      setError(err.message || 'Failed to sign up. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Consistent styling with other pages
  const commonInputStyle = { 
    width: '100%', 
    padding: '0.8em 1em', 
    marginBottom: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--input-border-color)',
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary-text)',
    fontSize: '1em',
    boxSizing: 'border-box'
  };
  const containerStyle = { 
    maxWidth: '500px', 
    margin: '3rem auto', 
    padding: '2.5rem', 
    backgroundColor: 'var(--secondary-bg)', 
    borderRadius: 'var(--border-radius-lg)', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.075)' 
  };
  const labelStyle = {
    fontWeight: 'bold',
    color: 'var(--secondary-text)',
    display: 'block',
    marginBottom: '0.5rem'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-text)' }}>Create Your Account</h2>
      
      {error && <p className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</p>}
      {/* Success message is now handled by SignUpSuccessPage */}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" style={labelStyle}>Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Choose a username"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="firstName" style={labelStyle}>First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Enter your first name"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="lastName" style={labelStyle}>Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Enter your last name"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Create a password"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={commonInputStyle}
            placeholder="Confirm your password"
            required
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="btn" 
          disabled={isLoading} 
          style={{ width: '100%', marginTop: '1rem', padding: '0.9em 1.5em' }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--secondary-text)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 'bold' }}>Log In</Link>
      </p>
    </div>
  );
}

export default SignupPage;