// c:\Users\USER\online-banking\client\src\pages\TransfersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserAccounts, getAccountTransactions } from '../services/api';

function TransfersPage() {
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [errorRecent, setErrorRecent] = useState('');

  useEffect(() => {
    const fetchRecentTransfers = async () => {
      setIsLoadingRecent(true);
      setErrorRecent('');
      try {
        const accounts = await getUserAccounts();
        if (accounts && accounts.length > 0) {
          let allTransactions = [];
          for (const account of accounts) {
            // getAccountTransactions now returns transactions with camelCase 'date'
            const transactions = await getAccountTransactions(account.id);
            allTransactions = [...allTransactions, ...transactions];
          }

          const transferTypes = ['wire_transfer_sent', 'ach_transfer_sent', 'bill_pay'];
          const filteredAndSorted = allTransactions
            .filter(tx => transferTypes.includes(tx.type))
            // Use camelCase property 'date' for sorting
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5); // Get latest 5

          setRecentTransfers(filteredAndSorted);
        }
      } catch (err) {
        console.error('Error fetching recent transfers:', err);
        setErrorRecent('Could not load recent transfer activity.');
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchRecentTransfers();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Transfers</h1>
      <p>Select a transfer type to proceed.</p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        {/* These will eventually be links or trigger modals/forms */}
        <Link to="/transfers/wire" className="btn btn-primary" style={{textDecoration: 'none'}}>Wire Transfer</Link>
        <Link to="/transfers/ach" className="btn btn-primary" style={{textDecoration: 'none'}}>ACH Transfer</Link>
        <Link to="/transfers/billpay" className="btn btn-primary" style={{textDecoration: 'none'}}>Bill Pay</Link>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2>Recent Transfer Activity</h2>
        {isLoadingRecent && <p>Loading recent activity...</p>}
        {errorRecent && <p className="error-message">{errorRecent}</p>}
        {!isLoadingRecent && !errorRecent && recentTransfers.length === 0 && (
          <p>No recent transfer activity found.</p>
        )}
        {!isLoadingRecent && !errorRecent && recentTransfers.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {recentTransfers.map(tx => (
              <li key={tx.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{tx.description}</p>
                  <p style={{ margin: '0', fontSize: '0.9em', color: '#555' }}>
                    {/* Use camelCase property 'date' */}
                    {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'} - {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <p style={{ margin: '0', fontWeight: 'bold', color: tx.amount < 0 ? 'red' : 'green' }}>
                  ${Math.abs(tx.amount).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TransfersPage;