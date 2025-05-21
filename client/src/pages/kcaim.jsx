import React, { useState, useEffect } from 'react';

// Helper function to get the auth token
const getAuthToken = () => localStorage.getItem('authToken');

// API service for admin operations
const adminApiService = {
  // User Management API Methods
  getUsers: async () => {
    const token = getAuthToken();
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
      throw new Error(errorData.message || 'Failed to fetch users');
    }
    return response.json();
  },

  createUser: async (userData) => {
    const token = getAuthToken();
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
      throw new Error(errorData.message || 'Failed to create user');
    }
    return response.json(); // Assuming backend returns the created user object
  },

  updateUser: async (userId, updatedData) => {
    const token = getAuthToken();
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update user' }));
      throw new Error(errorData.message || 'Failed to update user');
    }
    return response.json(); // Assuming backend returns the updated user object
  },

  toggleUserStatus: async (userId) => {
    const token = getAuthToken();
    const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to toggle user status' }));
      throw new Error(errorData.message || 'Failed to toggle user status');
    }
    return response.json(); // Assuming backend returns the updated user object
  },

  // === Account Oversight API Methods ===
  getAllAccounts: async () => {
    const token = getAuthToken();
    const response = await fetch('/api/admin/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch accounts' }));
      throw new Error(errorData.message || 'Failed to fetch accounts');
    }
    return response.json();
  },

  getAccountTransactions: async (accountId) => {
    const token = getAuthToken();
    const response = await fetch(`/api/admin/accounts/${accountId}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch transactions' }));
      throw new Error(errorData.message || 'Failed to fetch transactions');
    }
    return response.json();
  },

  toggleAccountTransferStatus: async (accountId) => {
    const token = getAuthToken();
    const response = await fetch(`/api/admin/accounts/${accountId}/toggle-transfers`, {
      method: 'PATCH', // Or PUT, depending on your API design
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to toggle account transfer status' }));
      throw new Error(errorData.message || 'Failed to toggle account transfer status');
    }
    return response.json(); // Assuming backend returns the updated account object
  },
};

const AdminPageKcaim = () => {
  // User management state
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const initialUserFormState = { username: '', email: '', fullName: '', role: 'user', password: '' };
  const [userFormData, setUserFormData] = useState(initialUserFormState);

  // Account Oversight State
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState(null);
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false);

  // General state
  const [error, setError] = useState(null); // General error for the page
  const [successMessage, setSuccessMessage] = useState(''); // General success message


  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      // setError(null); // Clear specific errors if needed, or handle globally
      // setSuccessMessage('');
      const fetchedUsers = await adminApiService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.message || "Failed to load users. Please try again.");
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      // setError(null); // Clear previous errors for this specific fetch if needed
      const fetchedAccounts = await adminApiService.getAllAccounts();
      console.log('Fetched accounts:', fetchedAccounts); // For debugging
      setAccounts(fetchedAccounts);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setError(err.message || "Failed to load accounts. Please try again.");
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAccounts(); // Fetch accounts on component mount
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setUserFormData(initialUserFormState);
    setError(null);
    setSuccessMessage('');
    setShowCreateUserModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userFormData.username || !userFormData.email || !userFormData.fullName || !userFormData.password) {
        setError("All fields including password are required for new user.");
        return;
    }
    try {
      setError(null);
      setSuccessMessage('');
      const newUser = await adminApiService.createUser(userFormData);
      setShowCreateUserModal(false);
      if (newUser && newUser.username) {
        setSuccessMessage(`User "${newUser.username}" created successfully!`);
      } else {
        setSuccessMessage('User created successfully!');
      }
      fetchUsers(); // Refresh user list
      setUserFormData(initialUserFormState);
    } catch (err) {
      console.error("Failed to create user:", err);
      setError(err.message || "Could not create user.");
      setSuccessMessage('');
    }
  };

  const handleOpenEditModal = (user) => {
    setCurrentUserToEdit(user);
    const roleForForm = (user.is_admin === true || user.is_admin === 1) ? 'admin' : 'user';
    setUserFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: roleForForm
        // Password is not pre-filled for editing
    });
    setError(null);
    setSuccessMessage('');
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!currentUserToEdit) return;
    if (!userFormData.username || !userFormData.email || !userFormData.fullName || !userFormData.role) {
        setError("Username, email, full name, and role are required.");
        return;
    }
    try {
      setError(null);
      setSuccessMessage('');
      // Exclude password if not changing; backend should handle this logic if password field is optional on update
      const { password, ...updatePayload } = userFormData; 
      const payloadToSend = password ? userFormData : updatePayload; // Send password only if it's entered

      const updatedUser = await adminApiService.updateUser(currentUserToEdit.id, payloadToSend);
      setShowEditUserModal(false);
      setCurrentUserToEdit(null);
      if (updatedUser && updatedUser.username) {
        setSuccessMessage(`User "${updatedUser.username}" updated successfully!`);
      } else {
        setSuccessMessage('User updated successfully!');
      }
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(err.message || "Could not update user.");
      setSuccessMessage('');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      setError(null);
      setSuccessMessage('');
      const updatedUser = await adminApiService.toggleUserStatus(userId);
      if (updatedUser && typeof updatedUser.username !== 'undefined' && typeof updatedUser.isActive !== 'undefined') {
        const statusText = (updatedUser.isActive === true || updatedUser.isActive === 1) ? 'Active' : 'Disabled';
        setSuccessMessage(`User "${updatedUser.username}" status toggled to ${statusText}.`);
      } else {
        setSuccessMessage('User status toggled.');
      }
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      setError(err.message || "Could not toggle user status.");
      setSuccessMessage('');
    }
  };

  // === Account Oversight Handlers ===
  const handleViewAccountDetails = async (account) => {
    setSelectedAccountDetails(account);
    setShowAccountDetailsModal(true);
    setIsLoadingTransactions(true);
    setError(null); // Clear general errors when opening modal
    setSuccessMessage('');
    try {
      const transactions = await adminApiService.getAccountTransactions(account.id || account._id);
      setAccountTransactions(transactions);
    } catch (err) {
      console.error(`Failed to fetch transactions for account ${account.id || account._id}:`, err);
      // Set error specific to this modal action if desired, or use general error
      setError(err.message || "Could not load transactions."); 
      setAccountTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleToggleAccountTransfers = async (accountId) => {
    try {
      setError(null);
      setSuccessMessage('');
      const updatedAccount = await adminApiService.toggleAccountTransferStatus(accountId);
      if (updatedAccount && updatedAccount.accountNumber) {
        const statusText = (updatedAccount.transfersEnabled === true || updatedAccount.transfersEnabled === 1) ? 'Enabled' : 'Disabled';
        setSuccessMessage(`Transfers for account ${updatedAccount.accountNumber} ${statusText}.`);
      } else {
        setSuccessMessage('Account transfer status toggled.');
      }
      fetchAccounts(); // Refresh account list
    } catch (err) {
      console.error("Failed to toggle account transfer status:", err);
      setError(err.message || "Could not toggle account transfer status.");
      setSuccessMessage('');
    }
  };

  const closeAccountDetailsModal = () => {
    setShowAccountDetailsModal(false);
    setSelectedAccountDetails(null);
    setAccountTransactions([]);
    // Optionally clear errors specific to this modal if you set them, or leave general error handling
    // setError(null); 
  };

  const closeModalAndClearMessages = () => {
    setShowCreateUserModal(false);
    setShowEditUserModal(false);
    closeAccountDetailsModal();
    setError(null);
    setSuccessMessage('');
  };


  return (
    <div className="admin-page" style={{ padding: '20px' }}>
      <h1>Admin Dashboard (kcaim.jsx)</h1>
      <p>Welcome to the admin control panel.</p>

      {/* General Error and Success Messages */}
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>Error: {error}</p>}
      {successMessage && <p style={{ color: 'green', border: '1px solid green', padding: '10px', marginBottom: '15px' }}>{successMessage}</p>}

      {/* User Management Section */}
      <section className="admin-section" style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>User Management</h2>
        <p>Viewing, creating, editing, and disabling users.</p>
        <button onClick={handleOpenCreateModal} style={{ marginBottom: '15px' }}>Create New User</button>

        {isLoadingUsers && <p>Loading users...</p>}
        {!isLoadingUsers && !error && users.length === 0 && <p>No users found.</p>}
        {!isLoadingUsers && users.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Username</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Full Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id || user._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{user.username}</td>
                  <td style={{ padding: '8px' }}>{user.fullName}</td>
                  <td style={{ padding: '8px' }}>{user.email}</td>
                  <td style={{ padding: '8px' }}>{(user.is_admin === true || user.is_admin === 1) ? 'Admin' : 'User'}</td>
                  <td style={{ padding: '8px' }}>
                    {typeof user.isActive !== 'undefined' ? ((user.isActive === true || user.isActive === 1) ? 'Active' : 'Disabled') : 'N/A'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleOpenEditModal(user)} style={{ marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleToggleUserStatus(user.id || user._id)}>
                      {typeof user.isActive !== 'undefined' ? ((user.isActive === true || user.isActive === 1) ? 'Disable' : 'Enable') : 'Toggle Status'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Create User Modal/Form */}
       {showCreateUserModal && (
        <div className="modal" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '500px', maxHeight: '85vh', overflowY: 'auto', background: 'white',
          padding: '25px', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px'
        }}>
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
              <input type="text" name="username" value={userFormData.username} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input type="email" name="email" value={userFormData.email} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Full Name:</label>
              <input type="text" name="fullName" value={userFormData.fullName} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
              <input type="password" name="password" value={userFormData.password} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
              <select name="role" value={userFormData.role} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px 15px', marginRight: '10px' }}>Create User</button>
            <button type="button" onClick={closeModalAndClearMessages} style={{ padding: '10px 15px' }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Edit User Modal/Form */}
      {showEditUserModal && currentUserToEdit && (
        <div className="modal" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '500px', maxHeight: '85vh', overflowY: 'auto', background: 'white',
          padding: '25px', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px'
        }}>
          <h3>Edit User: {currentUserToEdit.username}</h3>
          <form onSubmit={handleUpdateUser}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
              <input type="text" name="username" value={userFormData.username} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input type="email" name="email" value={userFormData.email} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Full Name:</label>
              <input type="text" name="fullName" value={userFormData.fullName} onChange={handleInputChange} required style={{ width: 'calc(100% - 12px)', padding: '8px' }}/>
            </div>
             <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>New Password (optional):</label>
              <input type="password" name="password" value={userFormData.password || ''} onChange={handleInputChange} style={{ width: 'calc(100% - 12px)', padding: '8px' }} placeholder="Leave blank to keep current password"/>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
              <select name="role" value={userFormData.role} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px 15px', marginRight: '10px' }}>Update User</button>
            <button type="button" onClick={closeModalAndClearMessages} style={{ padding: '10px 15px' }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Account Oversight Section */}
      <section className="admin-section" style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>Account Oversight</h2>
        <p>Viewing account details, transaction histories, enabling and disabling transfers.</p>

        {isLoadingAccounts && <p>Loading accounts...</p>}
        {!isLoadingAccounts && accounts.length === 0 && !error && <p>No accounts found.</p>} 
        {/* Note: The !error condition above might hide "No accounts found" if there was a fetch error. 
            Consider if you want to show "No accounts found" even if there was an error, or handle error display separately.
            For now, it prioritizes showing the error message if one exists. */}
        {!isLoadingAccounts && accounts.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Account Number</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>User (Username)</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Balance</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Transfers</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id || account._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{account.accountNumber}</td>
                  {/* Adjust based on your API: account.user.username, account.userFullName, or account.userId to look up in users state */}
                  <td style={{ padding: '8px' }}>{account.user?.username || users.find(u => u.id === account.userId)?.username || account.userId || 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{account.accountType}</td>
                  <td style={{ padding: '8px' }}>${typeof account.balance === 'number' ? account.balance.toFixed(2) : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>
                    {(account.transfersEnabled === true || account.transfersEnabled === 1) ? 'Enabled' : 'Disabled'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleViewAccountDetails(account)} style={{ marginRight: '10px' }}>
                      View Details
                    </button>
                    <button onClick={() => handleToggleAccountTransfers(account.id || account._id)}>
                      {(account.transfersEnabled === true || account.transfersEnabled === 1) ? 'Disable Transfers' : 'Enable Transfers'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Account Details Modal */}
      {showAccountDetailsModal && selectedAccountDetails && (
        <div className="modal" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'white',
          padding: '25px', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px'
        }}>
          <h3>Account Details: {selectedAccountDetails.accountNumber}</h3>
          <div style={{ marginBottom: '15px' }}>
            {/* Adjust based on your API and how user info is linked/available */}
            <p><strong>Account Holder:</strong> {selectedAccountDetails.user?.fullName || users.find(u => u.id === selectedAccountDetails.userId)?.fullName || selectedAccountDetails.userId || 'N/A'}</p>
            <p><strong>Account Type:</strong> {selectedAccountDetails.accountType}</p>
            <p><strong>Balance:</strong> ${typeof selectedAccountDetails.balance === 'number' ? selectedAccountDetails.balance.toFixed(2) : 'N/A'}</p>
            <p><strong>Transfers Status:</strong> {(selectedAccountDetails.transfersEnabled === true || selectedAccountDetails.transfersEnabled === 1) ? 'Enabled' : 'Disabled'}</p>
            {/* Add more account details as needed e.g., dateOpened: new Date(selectedAccountDetails.createdAt).toLocaleDateString() */}
          </div>

          <h4>Transaction History</h4>
          {isLoadingTransactions && <p>Loading transactions...</p>}
          {!isLoadingTransactions && accountTransactions.length === 0 && <p>No transactions found for this account.</p>}
          {!isLoadingTransactions && accountTransactions.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Balance After</th> {/* Optional */}
                </tr>
              </thead>
              <tbody>
                {accountTransactions.map(tx => (
                  <tr key={tx.id || tx._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{new Date(tx.date || tx.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{tx.type}</td>
                    <td style={{ padding: '8px' }}>{tx.description}</td>
                    <td style={{ textAlign: 'right', padding: '8px', color: tx.amount < 0 ? 'red' : 'green' }}>
                      {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>
                        {typeof tx.balanceAfter === 'number' ? `$${tx.balanceAfter.toFixed(2)}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button type="button" onClick={closeModalAndClearMessages} style={{ marginTop: '20px', padding: '10px 15px' }}>Close</button>
        </div>
      )}


      {/* Overlay for modals */}
      {(showCreateUserModal || showEditUserModal || showAccountDetailsModal) && (
        <div onClick={closeModalAndClearMessages} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      {/* Other Admin Sections (Placeholders) */}
      <section className="admin-section" style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>Content Management</h2>
        <p>Managing content for public-facing parts of the site.</p>
        {/* TODO: Implement Content Management UI and Logic */}
      </section>

      <section className="admin-section" style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>Report Generation</h2>
        <p>Generating various system and financial reports.</p>
        {/* TODO: Implement Report Generation UI and Logic */}
      </section>
    </div>
  );
};

export default AdminPageKcaim;