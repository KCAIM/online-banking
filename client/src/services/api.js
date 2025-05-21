// c:\Users\USER\online-banking\client\src\services\api.js

// Read the API URL from environment variables (set on Render to your backend's base URL, e.g., https://your-backend.onrender.com)
// Fallback to an empty string for local development; Vite proxy will handle paths starting with /api.
// Ensure VITE_API_URL is set in Render environment variables for the frontend service.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
 * @param {string} endpoint - The API endpoint (e.g., '/api/auth/login').
 * @param {object} [options={}] - Fetch options (method, headers, body).
 * @returns {Promise<any>}
 */
export async function fetchApi(endpoint, options = {}) { // Added export here
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
export const loginUser = (credentials) => fetchApi('/api/auth/login', { method: 'POST', body: credentials });
export const signupUser = (userData) => fetchApi('/api/auth/signup', { method: 'POST', body: userData });
export const getCurrentUser = () => fetchApi('/api/auth/user');
export const logoutUser = () => {
    // For JWT, logout is primarily client-side by removing the token
    localStorage.removeItem('authToken');
    // Optionally, call a backend logout endpoint if it exists (e.g., for session invalidation)
    // return fetchApi('/api/auth/logout', { method: 'POST' });
    return Promise.resolve(); // Return a resolved promise for consistency
};

// Account API calls
export const getUserAccounts = () => fetchApi('/api/accounts');
export const createNewAccount = (accountData) => fetchApi('/api/accounts', { method: 'POST', body: accountData });
export const getAccountDetails = (accountId) => fetchApi(`/api/accounts/${accountId}`);

// Transaction API calls
export const getAccountTransactions = (accountId) => fetchApi(`/api/transactions/${accountId}`);
export const initiateWireTransfer = (transferData) => fetchApi('/api/transactions/wire', { method: 'POST', body: transferData });
export const performACHTransfer = (transferData) => fetchApi('/api/transactions/ach', { method: 'POST', body: transferData });
export const performBillPay = (billPayData) => fetchApi('/api/transactions/billpay', { method: 'POST', body: billPayData });

// Message API calls
export const getInboxMessages = () => fetchApi('/api/messages/inbox');
export const markMessageAsRead = (messageId) => fetchApi(`/api/messages/inbox/${messageId}/read`, { method: 'PUT' });
export const getFlashMessages = () => fetchApi('/api/messages/flash');

// Admin API calls
export const getAllUsersForAdmin = () => fetchApi('/api/admin/users');
export const getUserDetailsForAdmin = (userId) => fetchApi(`/api/admin/users/${userId}`);
export const getAllAccountsAdmin = () => fetchApi('/api/admin/accounts');
export const getAccountTransactionsAdmin = (accountId) => fetchApi(`/api/admin/accounts/${accountId}/transactions`);
export const toggleAccountTransfersAdmin = (accountId) => fetchApi(`/api/admin/accounts/${accountId}/toggle-transfers`, { method: 'PATCH' });
export const updateUserBalanceAdmin = (accountId, balanceData) => fetchApi(`/api/admin/accounts/${accountId}/balance`, { method: 'PUT', body: balanceData });
export const createTransactionAdmin = (transactionData) => fetchApi('/api/admin/transactions', { method: 'POST', body: transactionData });
export const getAllTransactionsAdmin = () => fetchApi('/api/admin/transactions');
export const getActivitySettingsAdmin = () => fetchApi('/api/admin/settings/activities');
export const updateActivitySettingsAdmin = (settings) => fetchApi('/api/admin/settings/activities', { method: 'PUT', body: settings });
export const sendMessageToUserAdmin = (messageData) => fetchApi('/api/admin/messages/inbox', { method: 'POST', body: messageData });
export const createFlashMessageAdmin = (flashData) => fetchApi('/api/admin/messages/flash', { method: 'POST', body: flashData });
export const deactivateFlashMessageAdmin = (messageId) => fetchApi(`/api/admin/messages/flash/${messageId}/deactivate`, { method: 'PUT' });