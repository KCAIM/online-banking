// c:\Users\USER\online-banking\client\src\pages\DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { getCurrentUser, getUserAccounts, getFlashMessages } from '../services/api';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [flashMessages, setFlashMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        const accountsData = await getUserAccounts();
        setAccounts(accountsData);
        const flashData = await getFlashMessages();
        setFlashMessages(flashData);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (error) return <p className="error-message">{error}</p>;
  if (!user) return <p>Loading dashboard...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Welcome, {user.username}!</h1>
        <Link
          to="/open-account"
          className="btn btn-success" // Using a common class for button styling
          style={{
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            // Add more inline styles if btn btn-success isn't defined elsewhere
            // backgroundColor: '#28a745',
            // color: 'white',
            // borderRadius: '0.25rem'
          }}
        >
          Open New Account
        </Link>
      </div>
      {flashMessages.map(fm => <p key={fm.id} className="success-message">{fm.message}</p>)}
      <h2 style={{ marginTop: '2rem' }}>Your Accounts</h2>
      {accounts.length > 0 ? (
        <ul>
          {accounts.map(account => (
            <li key={account.id}>
              {/* Use camelCase properties */}
              {account.accountType}: {account.accountNumber} - Balance: ${account.balance.toFixed(2)}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          You have no accounts yet. <Link to="/open-account" className="btn btn-primary">Open New Account</Link>
        </p>
      )}
      {/* More dashboard content here: recent transactions, quick actions, etc. */}
    </div>
  );
}

export default DashboardPage;