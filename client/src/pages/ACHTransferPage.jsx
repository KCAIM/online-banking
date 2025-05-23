// c:\Users\USER\online-banking\client\src\pages\ACHTransferPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAccounts, performACHTransfer } from '../services/api';

function ACHTransferPage() {
  const [fromAccountId, setFromAccountId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [beneficiaryAccountType, setBeneficiaryAccountType] = useState('CHECKING'); // CHECKING or SAVINGS
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [secCode, setSecCode] = useState('PPD'); // Standard Entry Class Code: PPD, CCD etc.
  const [purpose, setPurpose] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'confirmation'
  const [transferSummary, setTransferSummary] = useState(null);

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
        console.error("ACHTransferPage: Error fetching accounts:", err);
      }
    };
    fetchAccounts();
  }, []);

  // Removed useEffect for timed navigation from this page

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const transferAmount = parseFloat(amount);
    if (!fromAccountId || !beneficiaryName || !beneficiaryAccountNumber || !routingNumber || !transferAmount || transferAmount <= 0) {
      setError('Please fill in all required fields and ensure amount is positive.');
      return;
    }

    const transferDetails = {
      fromAccountId: parseInt(fromAccountId, 10),
      beneficiaryName,
      beneficiaryAccountNumber,
      beneficiaryAccountType,
      routingNumber,
      amount: transferAmount,
      secCode,
      purpose,
    };

    const selectedAccount = userAccounts.find(acc => acc.id === transferDetails.fromAccountId);
    if (!selectedAccount) {
        setError('Invalid source account selected.');
        return;
    }

    if (selectedAccount.balance < transferAmount) {
        setError(`Insufficient funds. You need $${transferAmount.toFixed(2)} but have $${selectedAccount.balance.toFixed(2)}.`);
        return;
    }

    setTransferSummary({
        fromAccountDisplay: `${selectedAccount.accountType} - ${selectedAccount.accountNumber}`,
        ...transferDetails, // Spread the original details
        totalDebit: transferAmount // No fee for ACH, so totalDebit is same as amount
    });
    setStep('confirmation');
  };

  const handleConfirmAndInitiateTransfer = () => { // No longer async for immediate navigation
    if (!transferSummary) {
        setError('Error with transfer details. Please start over.');
        setStep('form');
        return;
    }
    setIsLoading(true); // Set loading briefly
    setError('');
    console.log('ACHTransferPage: [handleConfirmAndInitiateTransfer] Process started.');

    // Navigate immediately to the success page
    console.log('ACHTransferPage: [handleConfirmAndInitiateTransfer] Navigating immediately to /transfers/success.');
    navigate('/transfers/success');

    // Perform the API call in the background
    // Create a clean payload for the API, excluding UI-specific properties
    const apiPayload = { 
        fromAccountId: transferSummary.fromAccountId,
        beneficiaryName: transferSummary.beneficiaryName,
        beneficiaryAccountNumber: transferSummary.beneficiaryAccountNumber,
        beneficiaryAccountType: transferSummary.beneficiaryAccountType,
        routingNumber: transferSummary.routingNumber,
        amount: transferSummary.amount,
        secCode: transferSummary.secCode,
        purpose: transferSummary.purpose,
    };
      
    console.log('ACHTransferPage: [handleConfirmAndInitiateTransfer] Initiating background API call. Payload:', apiPayload);
    performACHTransfer(apiPayload)
      .then(response => {
        console.log('ACHTransferPage: [handleConfirmAndInitiateTransfer] Background API call successful. Response:', JSON.stringify(response, null, 2));
        // Handle successful API response in the background if needed
      })
      .catch(err => {
        console.error('ACHTransferPage: [handleConfirmAndInitiateTransfer] Background API call FAILED. Error object:', err);
        // Handle critical failure in the background
      })
      .finally(() => {
        setIsLoading(false); // Reset loading state once background task is done
        console.log('ACHTransferPage: [handleConfirmAndInitiateTransfer] Background API call finished.');
      });
      
    // Reset form state for this component instance
    setFromAccountId(userAccounts.length > 0 ? userAccounts[0].id : '');
    setBeneficiaryName('');
    setBeneficiaryAccountNumber('');
    setBeneficiaryAccountType('CHECKING');
    setRoutingNumber('');
    setAmount('');
    setSecCode('PPD');
    setPurpose('');
    setTransferSummary(null); // Clear summary
    setStep('form'); // Reset step
  };

  const commonInputStyle = { width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {step === 'form' && 'Initiate ACH Transfer'}
        {step === 'confirmation' && 'Confirm ACH Transfer'}
        {/* Success step UI is removed */}
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
          <div><label>Beneficiary Account Type:</label><select value={beneficiaryAccountType} onChange={(e) => setBeneficiaryAccountType(e.target.value)} style={commonInputStyle} disabled={isLoading}>
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
          </select></div>
          <div><label>Routing Number (ABA):</label><input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} required style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>Amount:</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" style={commonInputStyle} disabled={isLoading} /></div>
          <div><label>SEC Code:</label><select value={secCode} onChange={(e) => setSecCode(e.target.value)} style={commonInputStyle} disabled={isLoading}>
            <option value="PPD">PPD (Prearranged Payment and Deposit)</option>
            <option value="CCD">CCD (Cash Concentration or Disbursement)</option>
            {/* Add other relevant SEC codes if needed */}
          </select></div>
          <div><label>Purpose of Transfer (Optional):</label><textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} style={{...commonInputStyle, height: '80px'}} disabled={isLoading}></textarea></div>

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Review ACH Transfer
          </button>
        </form>
      )}

      {step === 'confirmation' && transferSummary && (
        <div>
          <p><strong>From Account:</strong> {transferSummary.fromAccountDisplay}</p>
          <p><strong>Beneficiary Name:</strong> {transferSummary.beneficiaryName}</p>
          <p><strong>Beneficiary Account:</strong> {transferSummary.beneficiaryAccountNumber} ({transferSummary.beneficiaryAccountType})</p>
          <p><strong>Routing Number:</strong> {transferSummary.routingNumber}</p>
          <hr style={{margin: '1rem 0'}} />
          <p><strong>Transfer Amount:</strong> ${transferSummary.amount.toFixed(2)}</p>
          <p><strong>Total Debit:</strong> ${transferSummary.totalDebit.toFixed(2)}</p>
          {transferSummary.purpose && <p><strong>Purpose:</strong> {transferSummary.purpose}</p>}
          <hr style={{margin: '1rem 0'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem'}}>
            <button onClick={() => { setStep('form'); setError(''); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }} disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleConfirmAndInitiateTransfer} disabled={isLoading} style={{ padding: '0.75rem 1.5rem', backgroundColor: isLoading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
              {isLoading ? 'Processing...' : 'Complete ACH Transfer'}
            </button>
          </div>
        </div>
      )}
      {/* Success UI removed from here */}
    </div>
  );
}

export default ACHTransferPage;