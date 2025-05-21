// c:\Users\USER\online-banking\client\src\pages\WireTransferPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAccounts, initiateWireTransfer } from '../services/api';

function WireTransferPage() {
  const [fromAccountId, setFromAccountId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [beneficiaryBankName, setBeneficiaryBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'confirmation'
  const [transferSummary, setTransferSummary] = useState(null);

  const [userAccounts, setUserAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // successMessage state is removed as its display is handled by TransferSuccessPage
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
        console.error("WireTransferPage: Error fetching accounts:", err);
      }
    };
    fetchAccounts();
  }, []);

  // Removed useEffect for timed navigation from this page

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

  const handleConfirmAndInitiateTransfer = () => { // No longer async for the immediate navigation
    if (!transferSummary || !transferSummary.originalDetails) {
        setError('Error with transfer details. Please start over.');
        setStep('form');
        return;
    }

    setIsLoading(true); // Set loading briefly for UI feedback
    setError('');
    console.log('WireTransferPage: [handleConfirmAndInitiateTransfer] Process started.');

    // Navigate immediately to the success page
    console.log('WireTransferPage: [handleConfirmAndInitiateTransfer] Navigating immediately to /transfers/success.');
    navigate('/transfers/success');

    // Perform the API call in the background (fire and forget for UI navigation purposes)
    const apiPayload = {
      ...transferSummary.originalDetails,
      amount: transferSummary.transferAmount,
    };
    
    console.log('WireTransferPage: [handleConfirmAndInitiateTransfer] Initiating background API call. Payload:', apiPayload);
    initiateWireTransfer(apiPayload)
      .then(response => {
        console.log('WireTransferPage: [handleConfirmAndInitiateTransfer] Background API call successful. Response:', JSON.stringify(response, null, 2));
        // Handle successful API response in the background if needed (e.g., update global state, notifications)
        // For example, you might want to refetch account balances or transaction history elsewhere.
      })
      .catch(err => {
        console.error('WireTransferPage: [handleConfirmAndInitiateTransfer] Background API call FAILED. Error object:', err);
        // Handle critical failure: e.g., log to a monitoring service,
        // or use a global notification system to inform the user that the optimistic "success" was incorrect.
      })
      .finally(() => {
        setIsLoading(false); // Reset loading state once background task is done
        console.log('WireTransferPage: [handleConfirmAndInitiateTransfer] Background API call finished.');
      });

    // Reset form state for this component instance, as navigation has occurred
    setFromAccountId(userAccounts.length > 0 ? userAccounts[0].id : '');
    setBeneficiaryName('');
    setBeneficiaryAccountNumber('');
    setBeneficiaryBankName('');
    setRoutingNumber('');
    setAmount('');
    setCurrency('USD');
    setPurpose('');
    setTransferSummary(null); // Clear summary
    setStep('form'); // Reset step for when/if user navigates back here
  };

  const commonInputStyle = { width: '100%', padding: '0.75rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {step === 'form' && 'Initiate Wire Transfer'}
        {step === 'confirmation' && 'Confirm Wire Transfer'}
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
      {/* Success UI removed from here */}
    </div>
  );
}

export default WireTransferPage;