// c:\Users\USER\online-banking\client\src\services\accountService.js
import { fetchApi } from './api'; // Import the centralized API handler from api.js

/**
 * Creates a new account for the authenticated user by calling the backend API.
 * This function is tailored to work with your `src/routes/accounts.js` backend endpoint
 * and now uses the central `fetchApi` utility for consistency and correct API base URL handling.
 * @param {object} accountData - The account data.
 *   Expected to have `accountType` (string) and `initialBalance` (number).
 * @returns {Promise<object>} A promise that resolves to the new account object from the backend.
 * @throws {Error} If the API call fails or the backend returns an error.
 */
export const createNewAccount = async (accountData) => {
  console.log('Attempting to create new account via accountService.js (using fetchApi) with:', accountData);
  
  // The explicit token check (if (!token) { ... }) previously here can often be omitted.
  // fetchApi (from api.js) will include the token if available.
  // If the token is missing and required by the backend, the API call will result
  // in an error (e.g., 401 Unauthorized), which handleResponse (used by fetchApi) will process.
  // This keeps authentication logic primarily on the backend and in the central API handler.

  try {
    // Delegate to fetchApi for the actual API call.
    // fetchApi handles:
    // - Prepending the correct API_BASE_URL (from VITE_API_URL in production, or '' for local proxy)
    // - Setting 'Content-Type': 'application/json'
    // - Stringifying the body
    // - Adding the Authorization header with the token
    // - Handling the response (parsing JSON, error handling via handleResponse)
    const newAccount = await fetchApi('/api/accounts', {
      method: 'POST',
      body: accountData, // fetchApi will stringify this object
    });
    return newAccount;
  } catch (error) {
    // Log the error with context from this service and re-throw
    // This allows the calling component (e.g., in your UI) to catch and handle it further.
    console.error('Error in accountService.js createNewAccount service call:', error.message, error.data || '');
    throw error; 
  }
};