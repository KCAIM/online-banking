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

    setIsLoading(true); // Set loading state, user will be navigated away quickly

    // Navigate immediately after validation passes
    // The API call will be made in the background.
    navigate('/signup-success');

    // Perform the API call in the background without awaiting it here
    const performSignupInBackground = async () => {
      const apiPayload = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      try {
        // signupUser will handle the actual API interaction
        await signupUser(apiPayload);
        console.log("SignupPage: Background signup process initiated successfully.");
        // No UI update here as user is on another page.
        // Success is handled by SignUpSuccessPage's existence.
      } catch (err) {
        console.error("SignupPage: Background signup failed:", err);
        // Error handling for the background process.
        // User is already on SignUpSuccessPage, so direct UI error feedback here is not possible.
        // This error should be logged server-side or handled in a way that admin can review if critical.
      } finally {
        // This setIsLoading(false) is for the background task, not directly affecting the navigated-away UI.
        // It's good practice if this component instance somehow persisted, but less critical here.
        // If you want to ensure isLoading is reset even if the component *doesn't* unmount immediately (unlikely here),
        // you could consider a separate mechanism or simply accept that this page's isLoading state
        // becomes irrelevant post-navigation. For this immediate navigation pattern,
        // the primary purpose of setIsLoading(true) is for the brief moment before navigation.
      }
    };

    performSignupInBackground();
    // The isLoading state on this page is mostly for the brief moment before navigation.
    // If the component unmounts, the setIsLoading(false) in the background task's finally block
    // won't affect this unmounted component's state.
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