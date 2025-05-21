// c:\Users\USER\online-banking\client\src\pages\TransferSuccessPage.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function TransferSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // You can customize the default message if no message is passed via state
  const message = location.state?.message || 'Transfer action processed!'; 

  useEffect(() => {
    console.log('TransferSuccessPage: Mounted. Message from state:', location.state?.message);
    const timer = setTimeout(() => {
      console.log('TransferSuccessPage: Timer elapsed, navigating to /transfers');
      navigate('/transfers');
    }, 5000); // Redirect after 5 seconds

    return () => {
      console.log('TransferSuccessPage: Cleanup, clearing timer');
      clearTimeout(timer);
    };
  }, [navigate, location.state]); // Rerun effect if location.state changes, though typically not needed for this simple case

  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 100px)', // Adjust 100px based on your header/footer height
        padding: '2rem', 
        textAlign: 'center' 
    }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="100"  // Increased size
        height="100" // Increased size
        fill="green" 
        className="bi bi-check-circle-fill" 
        viewBox="0 0 16 16" 
        style={{marginBottom: '1.5rem'}} // Increased margin
      >
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
      <h2 style={{color: 'green', fontSize: '2rem', marginBottom: '1rem'}}>Transfer Successful</h2>
      <p style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>{message}</p>
      <p style={{fontSize: '1rem', color: '#555'}}>You will be redirected to the transfers page shortly.</p>
      <div style={{marginTop: '2rem'}}>
        <Link 
            to="/transfers" 
            className="btn btn-primary" 
            style={{
                marginRight: '10px', 
                padding: '12px 24px', // Larger padding
                textDecoration: 'none', 
                color: 'white', 
                backgroundColor: '#007bff', 
                borderRadius: '5px',
                fontSize: '1rem'
            }}
        >
            Go to Transfers Now
        </Link>
        <Link 
            to="/dashboard" 
            className="btn btn-secondary" 
            style={{
                padding: '12px 24px',  // Larger padding
                textDecoration: 'none', 
                color: 'white', 
                backgroundColor: '#6c757d', 
                borderRadius: '5px',
                fontSize: '1rem'
            }}
        >
            Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default TransferSuccessPage;