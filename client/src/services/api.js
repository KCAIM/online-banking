// c:\Users\USER\online-banking\client\src\services\api.js
const API_BASE_URL = '/api'; // Relative path for Render deployment

/**
 * Helper function to handle API responses.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<any>} - The JSON response or throws an error.
 */
async function handleResponse(response) {
  if (response.status === 204) { // No Content
    return null;
  }

  if (!response.ok) { // Covers 4xx and 5xx errors
    let errorData = { message: response.statusText || `HTTP error! status: ${response.status}` };
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.indexOf("application/json") !== -1) {
      try {
        const jsonError = await response.json();
        errorData = { ...jsonError, message: jsonError.message || errorData.message };
      } catch (e) {
        console.warn('Could not parse JSON error response, though content-type was application/json:', e);
        // Keep the initial errorData based on statusText
      }
    } else {
      // If not JSON, try to get text, but be prepared for it to be empty
      try {
        const textError = await response.text();
        if (textError) {
          errorData.message = textError;
        }
      } catch (e) {
        console.warn('Could not read error response as text:', e);
        // Keep the initial errorData based on statusText
      }
    }
    
    const error = new Error(errorData.message);
    error.status = response.status; // Attach status for more context
    error.data = errorData;       // Attach full error data if available
    throw error;
  }

  // If response.ok is true, try to parse as JSON
  // but handle cases where a successful response might not have a body or is not JSON
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  // If successful but not JSON (e.g. just a 200 OK with no body, or text)
  // You might want to return response.text() or null depending on expectations
  return response.text().then(text => text || null); // Return text or null if empty
}

/**
 * Helper function to get the auth token from localStorage.
 * @returns {string|null} - The token or null.
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Generic fetch wrapper.
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login').
 * @param {object} [options={}] - Fetch options (method, headers, body).
 * @returns {Promise<any>}
 */
async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response);
}

// Authentication API calls
export const loginUser = (credentials) => fetchApi('/auth/login', { method: 'POST', body: credentials });
export const signupUser = (userData) => fetchApi('/auth/signup', { method: 'POST', body: userData });
export const getCurrentUser = () => fetchApi('/auth/user');
export const logoutUser = () => {
    // For JWT, logout is primarily client-side by removing the token
    localStorage.removeItem('authToken');
    // Optionally, call a backend logout endpoint if it exists (e.g., for session invalidation)
    // return fetchApi('/auth/logout', { method: 'POST' });
    return Promise.resolve(); // Return a resolved promise for consistency
};

// Account API calls
export const getUserAccounts = () => fetchApi('/accounts');
export const createNewAccount = (accountData) => fetchApi('/accounts', { method: 'POST', body: accountData });
export const getAccountDetails = (accountId) => fetchApi(`/accounts/${accountId}`);

// Transaction API calls
export const getAccountTransactions = (accountId) => fetchApi(`/transactions/${accountId}`);
export const initiateWireTransfer = (transferData) => fetchApi('/transactions/wire', { method: 'POST', body: transferData });
export const performACHTransfer = (transferData) => fetchApi('/transactions/ach', { method: 'POST', body: transferData });
export const performBillPay = (billPayData) => fetchApi('/transactions/billpay', { method: 'POST', body: billPayData });

// Message API calls
export const getInboxMessages = () => fetchApi('/messages/inbox');
export const markMessageAsRead = (messageId) => fetchApi(`/messages/inbox/${messageId}/read`, { method: 'PUT' });
export const getFlashMessages = () => fetchApi('/messages/flash');

// Add more API functions as needed for admin panel, etc.
// Admin API calls (example, expand as needed)
export const getAllUsersForAdmin = () => fetchApi('/admin/users');
export const getUserDetailsForAdmin = (userId) => fetchApi(`/admin/users/${userId}`);
// Admin Account Management
export const getAllAccountsAdmin = () => fetchApi('/admin/accounts');
export const getAccountTransactionsAdmin = (accountId) => fetchApi(`/admin/accounts/${accountId}/transactions`);
export const toggleAccountTransfersAdmin = (accountId) => fetchApi(`/admin/accounts/${accountId}/toggle-transfers`, { method: 'PATCH' });
export const updateUserBalanceAdmin = (accountId, balanceData) => fetchApi(`/admin/accounts/${accountId}/balance`, { method: 'PUT', body: balanceData });

// Admin Transaction Management
export const createTransactionAdmin = (transactionData) => fetchApi('/admin/transactions', { method: 'POST', body: transactionData });
export const getAllTransactionsAdmin = () => fetchApi('/admin/transactions');

// Admin Settings Management
export const getActivitySettingsAdmin = () => fetchApi('/admin/settings/activities');
export const updateActivitySettingsAdmin = (settings) => fetchApi('/admin/settings/activities', { method: 'PUT', body: settings });

// Admin Message Management
export const sendMessageToUserAdmin = (messageData) => fetchApi('/admin/messages/inbox', { method: 'POST', body: messageData });
export const createFlashMessageAdmin = (flashData) => fetchApi('/admin/messages/flash', { method: 'POST', body: flashData });
export const deactivateFlashMessageAdmin = (messageId) => fetchApi(`/admin/messages/flash/${messageId}/deactivate`, { method: 'PUT' });

// Admin User Management (more specific if needed beyond getAllUsersForAdmin and getUserDetailsForAdmin)
// export const makeUserAdmin = (userId) => fetchApi(`/admin/users/${userId}/make-admin`, { method: 'POST' }); // Example
// export const removeUserAdmin = (userId) => fetchApi(`/admin/users/${userId}/remove-admin`, { method: 'POST' }); // Example
// export const getSystemSettings = () => fetchApi('/admin/settings'); // This might be redundant with getActivitySettingsAdmin
// export const updateSystemSettings = (settings) => fetchApi('/admin/settings', { method: 'PUT', body: settings });