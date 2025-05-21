// c:\Users\USER\online-banking\client\src\pages\BillPayPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAccounts, performBillPay } from '../services/api';

function BillPayPage() {
  const [fromAccountId, setFromAccountId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [payeeAccountNumber, setPayeeAccountNumber] = useState(''); // Optional, for reference
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState(''); // Optional memo/notes
  const [step, setStep] = useState('form'); // 'form', 'confirmation', 'success'
  const [paymentSummary, setPaymentSummary] = useState(null);

  const [userAccounts, setUserAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accounts = await getUserAccounts();
        setUserAccounts(accounts);
        if (accounts.length > 0) {
          setFromAccountId(accounts[0].id);
        }
      } catch (err) {
        setError('Failed to load your accounts. Please try again.');
        console.error('Error fetching accounts for Bill Pay:', err);
      }
    };
    fetchAccounts();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const paymentAmount = parseFloat(amount);
    if (!fromAccountId || !payeeName || !paymentAmount || paymentAmount <= 0) {
      setError('Please select an account, enter payee name, and a positive amount.');
      return;
    }

    const paymentDetails = {
      fromAccountId: parseInt(fromAccountId, 10),
      payeeName,
      payeeAccountNumber, // Will be sent to backend
      amount: paymentAmount,
      memo,
    };

    const selectedAccount = userAccounts.find(acc => acc.id === paymentDetails.fromAccountId);
    if (!selectedAccount) {
        setError('Invalid source account selected.');
        return;
    }

    if (selectedAccount.balance < paymentAmount) {
        setError(`Insufficient funds. You need $${paymentAmount.toFixed(2)} but have $${selectedAccount.balance.toFixed(2)}.`);
        return;
    }

    setPaymentSummary({
        // Use camelCase properties
        fromAccountDisplay: `${selectedAccount.accountType} - ${selectedAccount.accountNumber}`,
        ...paymentDetails,
        totalDebit: paymentAmount // No fee for Bill Pay
    });
    setStep('confirmation');
  };

  const handleConfirmAndMakePayment = async () => {
    if (!paymentSummary) {
        setError('Error with payment details. Please start over.');
        setStep('form');
        return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    console.log('BillPayPage: [handleConfirmAndMakePayment] Set isLoading to true');


    try {
      // Backend expects fromAccountId, payeeName, amount. payeeAccountNumber and memo are optional.
      const apiPayload = {
        fromAccountId: paymentSummary.fromAccountId,
        payeeName: paymentSummary.payeeName,
        amount: paymentSummary.amount,
        ...(paymentSummary.payeeAccountNumber && { payeeAccountNumber: paymentSummary.payeeAccountNumber }),
        ...(paymentSummary.memo && { memo: paymentSummary.memo }),
      };

      const response = await performBillPay(apiPayload);
      console.log('BillPayPage: [handleConfirmAndMakePayment] API response received', response);

      setSuccessMessage(response.message || 'Bill payment successful!');
      console.log('BillPayPage: [handleConfirmAndMakePayment] Success message set:', response.message || 'Bill payment successful!');

      setFromAccountId(userAccounts.length > 0 ? userAccounts[0].id : '');
      setPayeeName('');
      setPayeeAccountNumber('');
      setAmount('');
      setMemo('');

      setStep('success');
      console.log('BillPayPage: [handleConfirmAndMakePayment] Step set to "success"');

      setTimeout(() => {
        console.log('BillPayPage: [handleConfirmAndMakePayment] Navigating to /transfers after timeout');
        navigate('/transfers');
        setStep('form');
      }, 4000);
    } catch (err) {
      console.error('Bill Pay Page Error:', err);
      setError(err.message || 'Failed to make bill payment.');
      setStep('form');
    } finally {
      setIsLoading(false);
      console.log('BillPayPage: [handleConfirmAndMakePayment] Set isLoading to false in finally block');
    }
  };

  const commonInputStyle = { width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {step === 'form' && 'Make a Bill Payment'}
        {step === 'confirmation' && 'Confirm Bill Payment'}
        {step === 'success' && 'Payment Status'}
      </h2>

      {error && (step === 'form' || step === 'confirmation') && <div style={{ color: 'red', backgroundColor: '#ffebee', marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', border: '1px solid red' }}>{error}</div>}

      {step === 'form' && (
        <form onSubmit={handleFormSubmit}>
          <div><label>From Account:</label><select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required style={commonInputStyle} disabled={isLoading}>
            <option value="">Select Account</option>
            {/* Use camelCase properties */}
            {userAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountType} - {acc.accountNumber} (Balance: ${acc.balance.toFixed(2)})</option>)}
          </select></div>

          <div><label>Payee Name:</label><input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Payee Account Number (Optional):</label><input type="text" value={payeeAccountNumber} onChange={(e) => setPayeeAccountNumber(e.target.value)} style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Amount:</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Memo (Optional):</label><textarea value={memo} onChange={(e) => setMemo(e.target.value)} style={{...commonInputStyle, height: '80px'}} disabled={isLoading}></textarea></div>

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Review Payment
          </button>
        </form>
      )}

      {step === 'confirmation' && paymentSummary && (
        <div>
          <p><strong>From Account:</strong> {paymentSummary.fromAccountDisplay}</p>
          <p><strong>Payee Name:</strong> {paymentSummary.payeeName}</p>
          {paymentSummary.payeeAccountNumber && <p><strong>Payee Account Number:</strong> {paymentSummary.payeeAccountNumber}</p>}
          <hr style={{margin: '1rem 0'}} />
          <p><strong>Payment Amount:</strong> ${paymentSummary.amount.toFixed(2)}</p>
          <p><strong>Total Debit:</strong> ${paymentSummary.totalDebit.toFixed(2)}</p>
          {paymentSummary.memo && <p><strong>Memo:</strong> {paymentSummary.memo}</p>}
          <hr style={{margin: '1rem 0'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem'}}>
            <button onClick={() => { setStep('form'); setError(''); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }} disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleConfirmAndMakePayment} disabled={isLoading} style={{ padding: '0.75rem 1.5rem', backgroundColor: isLoading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
              {isLoading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {console.log('BillPayPage: [Render] RENDERING SUCCESS STEP UI, successMessage:', successMessage)}
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="green" className="bi bi-check-circle-fill" viewBox="0 0 16 16" style={{marginBottom: '1rem'}}>
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
          <h3 style={{color: 'green'}}>{successMessage}</h3>
          <p>You will be redirected shortly...</p>
        </div>
      )}
    </div>
  );
}

export default BillPayPage;