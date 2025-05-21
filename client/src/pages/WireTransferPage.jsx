// c:\Users\USER\online-banking\client\src\pages\WireTransferPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAccounts, initiateWireTransfer } from '../services/api'; // Ensure initiateWireTransfer is imported

function WireTransferPage() {
  const [fromAccountId, setFromAccountId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [beneficiaryBankName, setBeneficiaryBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'confirmation', 'success'
  const [transferSummary, setTransferSummary] = useState(null);

  const [userAccounts, setUserAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const WIRE_TRANSFER_FEE = 15.00;


  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accounts = await getUserAccounts();
        setUserAccounts(accounts);
        if (accounts.length > 0) {
          setFromAccountId(accounts[0].id); // Default to the first account
        }
      } catch (err) {
        setError('Failed to load your accounts. Please try again.');
        console.error("Error fetching accounts:", err);
      }
    };
    fetchAccounts();
  }, []);

  // useEffect to handle navigation after success message is shown
  useEffect(() => {
    let timerId;
    if (step === 'success' && successMessage) {
      timerId = setTimeout(() => {
        navigate('/transfers');
        // Optionally reset step to 'form' if user might navigate back to this instance
        // without a full remount, though typically not needed if navigating away.
        // setStep('form'); 
      }, 4000); // Duration to show success message before redirecting
    }
    return () => {
      clearTimeout(timerId); // Cleanup timeout if component unmounts or dependencies change
    };
  }, [step, successMessage, navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const transferAmount = parseFloat(amount);
    if (!fromAccountId || !beneficiaryName || !beneficiaryAccountNumber || !beneficiaryBankName || !routingNumber || !transferAmount || transferAmount <= 0) {
      setError('Please fill in all required fields and ensure amount is positive.');
      return;
    }

    const transferDetails = {
      fromAccountId: parseInt(fromAccountId, 10),
      beneficiaryName,
      beneficiaryAccountNumber,
      beneficiaryBankName,
      routingNumber,
      amount: transferAmount,
      currency,
      purpose,
    };

    const selectedAccount = userAccounts.find(acc => acc.id === transferDetails.fromAccountId);
    if (!selectedAccount) {
        setError('Invalid source account selected.');
        return;
    }

    const totalDebitAmount = transferAmount + WIRE_TRANSFER_FEE;
    if (selectedAccount.balance < totalDebitAmount) {
        setError(`Insufficient funds. You need $${totalDebitAmount.toFixed(2)} (including $${WIRE_TRANSFER_FEE.toFixed(2)} fee) but have $${selectedAccount.balance.toFixed(2)}.`);
        return;
    }

    setTransferSummary({
        fromAccountDisplay: `${selectedAccount.accountType} - ${selectedAccount.accountNumber}`,
        beneficiaryName: transferDetails.beneficiaryName,
        beneficiaryAccountNumber: transferDetails.beneficiaryAccountNumber,
        beneficiaryBankName: transferDetails.beneficiaryBankName,
        routingNumber: transferDetails.routingNumber,
        transferAmount: transferAmount,
        fee: WIRE_TRANSFER_FEE,
        totalDebit: totalDebitAmount,
        currency: transferDetails.currency,
        purpose: transferDetails.purpose,
        originalDetails: transferDetails
    });
    setStep('confirmation');
  };

  const handleConfirmAndInitiateTransfer = async () => {
    if (!transferSummary || !transferSummary.originalDetails) {
        setError('Error with transfer details. Please start over.');
        setStep('form');
        return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const apiPayload = {
        ...transferSummary.originalDetails,
        amount: transferSummary.transferAmount,
      };
      
      const response = await initiateWireTransfer(apiPayload);
      
      setSuccessMessage(response.message || 'Wire transfer initiated successfully!');
      
      // Clear form fields on success
      setFromAccountId(userAccounts.length > 0 ? userAccounts[0].id : '');
      setBeneficiaryName('');
      setBeneficiaryAccountNumber('');
      setBeneficiaryBankName('');
      setRoutingNumber('');
      setAmount('');
      setCurrency('USD');
      setPurpose('');
      
      setStep('success'); // This will trigger the useEffect for navigation

    } catch (err) {
      console.error('Wire Transfer Page Error:', err);
      setError(err.message || 'Failed to initiate wire transfer.');
      setStep('form'); 
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputStyle = { width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {step === 'form' && 'Initiate Wire Transfer'}
        {step === 'confirmation' && 'Confirm Wire Transfer'}
        {step === 'success' && 'Transfer Status'}
      </h2>

      {error && (step === 'form' || step === 'confirmation') && <div style={{ color: 'red', backgroundColor: '#ffebee', marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', border: '1px solid red' }}>{error}</div>}

      {step === 'form' && (
        <form onSubmit={handleFormSubmit}>
          <div><label>From Account:</label><select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required style={commonInputStyle} disabled={isLoading}>
            <option value="">Select Account</option>
            {userAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountType} - {acc.accountNumber} (Balance: ${acc.balance.toFixed(2)})</option>)}
          </select></div>

          <div><label>Beneficiary Name:</label><input type="text" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Beneficiary Account Number:</label><input type="text" value={beneficiaryAccountNumber} onChange={(e) => setBeneficiaryAccountNumber(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Beneficiary Bank Name:</label><input type="text" value={beneficiaryBankName} onChange={(e) => setBeneficiaryBankName(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Routing Number (ABA/SWIFT):</label><input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>

          <div><label>Amount:</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Currency:</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={commonInputStyle} disabled={isLoading}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select></div>

          <div><label>Purpose of Transfer (Optional):</label><textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} style={{...commonInputStyle, height: '80px'}} disabled={isLoading}></textarea></div>

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Review Transfer
          </button>
        </form>
      )}

      {step === 'confirmation' && transferSummary && (
        <div>
          <p><strong>From Account:</strong> {transferSummary.fromAccountDisplay}</p>
          <p><strong>Beneficiary Name:</strong> {transferSummary.beneficiaryName}</p>
          <p><strong>Beneficiary Account:</strong> {transferSummary.beneficiaryAccountNumber}</p>
          <p><strong>Beneficiary Bank:</strong> {transferSummary.beneficiaryBankName}</p>
          <p><strong>Routing Number:</strong> {transferSummary.routingNumber}</p>
          <hr style={{margin: '1rem 0'}} />
          <p><strong>Transfer Amount:</strong> ${transferSummary.transferAmount.toFixed(2)} {transferSummary.currency}</p>
          <p><strong>Wire Transfer Fee:</strong> ${transferSummary.fee.toFixed(2)}</p>
          <p><strong>Total Debit:</strong> ${transferSummary.totalDebit.toFixed(2)} {transferSummary.currency}</p>
          {transferSummary.purpose && <p><strong>Purpose:</strong> {transferSummary.purpose}</p>}
          <hr style={{margin: '1rem 0'}} />
          {error && <div style={{ color: 'red', backgroundColor: '#ffebee', marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', border: '1px solid red' }}>{error}</div>}
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem'}}>
            <button onClick={() => { setStep('form'); setError(''); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }} disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleConfirmAndInitiateTransfer} disabled={isLoading} style={{ padding: '0.75rem 1.5rem', backgroundColor: isLoading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
              {isLoading ? 'Processing...' : 'Complete Transfer'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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

export default WireTransferPage;