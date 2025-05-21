// c:\Users\USER\online-banking\client\src\pages\OpenAccountPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewAccount } from '../services/accountService'; // Ensure this points to your updated service

function OpenAccountPage() {
  const [accountType, setAccountType] = useState('SAVINGS');
  const [initialBalance, setInitialBalance] = useState(''); // State variable matches backend field
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const balanceAmount = parseFloat(initialBalance);

    // Client-side validation (backend also validates)
    if (isNaN(balanceAmount) || balanceAmount < 0) {
      setError('Initial balance must be a non-negative number.');
      setIsLoading(false);
      return;
    }
    // You might want to enforce a minimum deposit greater than 0 on the client-side
    // if your business logic requires it, even if the backend allows 0.
    // For example:
    // if (balanceAmount <= 0) {
    //   setError('Initial deposit must be a positive number.');
    //   setIsLoading(false);
    //   return;
    // }


    try {
      // The 'newAccount' object is returned directly on success by your service
      const newAccount = await createNewAccount({
        accountType,
        initialBalance: balanceAmount, // Key matches backend expectation
      });

      // If createNewAccount was successful, newAccount will be populated
      // Use camelCase property 'accountNumber'
      setMessage(`Account created successfully! Account Number: ${newAccount.accountNumber || newAccount.id}. You will be redirected to the dashboard.`);
      setAccountType('SAVINGS');
      setInitialBalance(''); // Reset the form field
      setTimeout(() => {
        // Optionally signal dashboard to refresh its account list
        navigate('/dashboard', { state: { refreshAccounts: true } });
      }, 3000);
    } catch (err) {
      console.error('Error opening new account:', err);
      // err.message should contain the message from your backend or the service
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Open New Account</h2>
      {message && <div style={{ color: 'green', backgroundColor: '#e6ffed', marginBottom: '1rem', border: '1px solid green', padding: '0.75rem', borderRadius: '4px' }}>{message}</div>}
      {error && <div style={{ color: 'red', backgroundColor: '#ffebee', marginBottom: '1rem', border: '1px solid red', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="accountType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Account Type:</label>
          <select
            id="accountType"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            disabled={isLoading}
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="SAVINGS">Savings Account</option>
            <option value="CHECKING">Checking Account</option>
            {/* Add other account types as needed */}
          </select>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="initialBalance" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Initial Deposit ($):</label>
          <input
            type="number"
            id="initialBalance" // id matches the label's htmlFor
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="e.g., 100.00"
            min="0" // Allow 0, backend handles logic for 0 deposit
            step="0.01"
            required
            disabled={isLoading}
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: isLoading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
        >
          {isLoading ? 'Processing...' : 'Open Account'}
        </button>
      </form>
    </div>
  );
}

export default OpenAccountPage;