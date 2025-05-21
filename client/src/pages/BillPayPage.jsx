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
  const [step, setStep] = useState('form'); // 'form', 'confirmation'
  const [paymentSummary, setPaymentSummary] = useState(null);

  const [userAccounts, setUserAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // successMessage state is removed as its display is handled by TransferSuccessPage
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
        console.error('BillPayPage: Error fetching accounts for Bill Pay:', err);
      }
    };
    fetchAccounts();
  }, []);

  // Removed useEffect for timed navigation from this page

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const paymentAmount = parseFloat(amount);
    if (!fromAccountId || !payeeName || !paymentAmount || paymentAmount <= 0) {
      setError('Please select an account, enter payee name, and a positive amount.');
      return;
    }

    const paymentDetails = {
      fromAccountId: parseInt(fromAccountId, 10),
      payeeName,
      payeeAccountNumber, 
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
        fromAccountDisplay: `${selectedAccount.accountType} - ${selectedAccount.accountNumber}`,
        ...paymentDetails,
        totalDebit: paymentAmount // No fee for Bill Pay
    });
    setStep('confirmation');
  };

  const handleConfirmAndMakePayment = () => { // No longer async for immediate navigation
    if (!paymentSummary) {
        setError('Error with payment details. Please start over.');
        setStep('form');
        return;
    }
    setIsLoading(true); // Set loading briefly
    setError('');
    console.log('BillPayPage: [handleConfirmAndMakePayment] Process started.');

    // Navigate immediately to the success page
    console.log('BillPayPage: [handleConfirmAndMakePayment] Navigating immediately to /transfers/success.');
    navigate('/transfers/success');

    // Perform the API call in the background
    const apiPayload = {
      fromAccountId: paymentSummary.fromAccountId,
      payeeName: paymentSummary.payeeName,
      amount: paymentSummary.amount,
      ...(paymentSummary.payeeAccountNumber && { payeeAccountNumber: paymentSummary.payeeAccountNumber }),
      ...(paymentSummary.memo && { memo: paymentSummary.memo }),
    };
      
    console.log('BillPayPage: [handleConfirmAndMakePayment] Initiating background API call. Payload:', apiPayload);
    performBillPay(apiPayload)
      .then(response => {
        console.log('BillPayPage: [handleConfirmAndMakePayment] Background API call successful. Response:', JSON.stringify(response, null, 2));
        // Handle successful API response in the background if needed
      })
      .catch(err => {
        console.error('BillPayPage: [handleConfirmAndMakePayment] Background API call FAILED. Error object:', err);
        // Handle critical failure in the background
      })
      .finally(() => {
        setIsLoading(false); // Reset loading state once background task is done
        console.log('BillPayPage: [handleConfirmAndMakePayment] Background API call finished.');
      });
      
    // Reset form state for this component instance
    setFromAccountId(userAccounts.length > 0 ? userAccounts[0].id : '');
    setPayeeName('');
    setPayeeAccountNumber('');
    setAmount('');
    setMemo('');
    setPaymentSummary(null); // Clear summary
    setStep('form'); // Reset step
  };

  const commonInputStyle = { width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {step === 'form' && 'Make a Bill Payment'}
        {step === 'confirmation' && 'Confirm Bill Payment'}
        {/* Success step UI is removed */}
      </h2>

      {error && (step === 'form' || step === 'confirmation') && <div style={{ color: 'red', backgroundColor: '#ffebee', marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', border: '1px solid red' }}>{error}</div>}

      {step === 'form' && (
        <form onSubmit={handleFormSubmit}>
          <div><label>From Account:</label><select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required style={commonInputStyle} disabled={isLoading}>
            <option value="">Select Account</option>
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
      {/* Success UI removed from here */}
    </div>
  );
}

export default BillPayPage;