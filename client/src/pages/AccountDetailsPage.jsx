// c:\Users\USER\online-banking\client\src\pages\AccountDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccountDetails, getAccountTransactions } from '../services/api';

function AccountDetailsPage() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        const accountData = await getAccountDetails(accountId);
        setAccount(accountData);
        const transactionsData = await getAccountTransactions(accountId);
        setTransactions(transactionsData);
      } catch (err) {
        setError(err.message || 'Failed to fetch account details.');
        console.error('Error fetching account data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (accountId) {
      fetchData();
    }
  }, [accountId]);

  if (isLoading) {
    return <p>Loading account details...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!account) {
    return <p>Account not found.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/accounts" style={{ marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Accounts</Link>
      <h1>Account Details</h1>
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '5px' }}>
        {/* Use camelCase properties */}
        <p><strong>Account Number:</strong> {account.accountNumber}</p>
        <p><strong>Account Type:</strong> {account.accountType}</p>
        {/* Add checks for balance and createdAt in case they are null/undefined */}
        <p><strong>Balance:</strong> <strong>${account.balance ? account.balance.toFixed(2) : '0.00'}</strong></p>
        <p><strong>Opened On:</strong> {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}</p>
      </div>

      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found for this account.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount</th>
              {/* Optional: Add Balance After column if your transaction data includes it */}
              {transactions.length > 0 && transactions[0].balanceAfter !== undefined && (
                 <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Balance After</th>
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                {/* Use camelCase property 'date' */}
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.type}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: tx.amount < 0 ? 'red' : 'green' }}>
                  ${typeof tx.amount === 'number' ? tx.amount.toFixed(2) : '0.00'}
                </td>
                 {/* Optional: Display Balance After */}
                {transactions.length > 0 && transactions[0].balanceAfter !== undefined && (
                   <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                       {typeof tx.balanceAfter === 'number' ? `$${tx.balanceAfter.toFixed(2)}` : 'N/A'}
                   </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AccountDetailsPage;