// c:\Users\USER\online-banking\client\src\pages\AccountsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserAccounts } from '../services/api';

function AccountsListPage() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await getUserAccounts();
        setAccounts(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch accounts.');
        console.error('Error fetching accounts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  if (isLoading) {
    return <p>Loading accounts...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Your Accounts</h1>
      {accounts.length === 0 ? (
        <p>You don't have any accounts yet. <Link to="/open-account">Open a new account</Link>.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {accounts.map(account => (
            <li key={account.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '5px' }}>
              <Link to={`/accounts/${account.id}`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                {/* Use camelCase properties */}
                {account.accountType} - {account.accountNumber}
              </Link>
              <p>Balance: ${account.balance.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AccountsListPage;