import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignUpSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 4000); // Redirect after 4 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [navigate]);

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '5rem', padding: '3rem 2rem' }}>
      {/* Icon and its import have been removed */}
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-text)', fontSize: '2rem' }}>Account Created Successfully!</h2>
      <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
        Welcome aboard! Your account has been successfully created.
      </p>
      <p style={{ color: 'var(--secondary-text)', fontSize: '1rem', marginBottom: '2rem' }}>
        You will be automatically redirected to the login page in a few seconds.
      </p>
      <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
        If you are not redirected, <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>click here to log in</Link>.
      </p>
    </div>
  );
};

export default SignUpSuccessPage;