import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { signupUser } from '../services/api';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!username || !password || !confirmPassword) {
        setError("All fields are required.");
        return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true); // Start loading
    try {
      // Assuming signupUser throws an error on failure and resolves on success
      await signupUser({ username, password });
      
      // On successful signup, set success message and navigate immediately
      setSuccess('Signup successful! Redirecting to login...');
      // Navigate directly without setTimeout
      navigate('/login'); 

    } catch (err) {
      console.error("Signup failed:", err); // Log the actual error
      setError(err.message || 'Failed to sign up. Please try again.');
      setSuccess(''); // Clear success message on error
    } finally {
      setIsLoading(false); // Stop loading regardless of success or failure
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} /> {/* Disable while loading */}
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} /> {/* Disable while loading */}
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading} // Disable while loading
          />
        </div>
        {/* Disable button while loading and update text */}
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link> {/* Use Link component */}
      </p>
    </div>
  );
}

export default SignupPage;