// c:\Users\USER\online-banking\client\src\services\accountService.js
const API_BASE_URL = '/api'; // This will be proxied by Vite to your backend

/**
 * Helper function to handle API responses specifically for this service.
 * If you have a global API handler (like in your api.js), consider reusing it.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<any>} - The JSON response or throws an error.
 */
async function handleAccountServiceResponse(response) {
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
        console.warn('Could not parse JSON error response in accountService, though content-type was application/json:', e);
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
        console.warn('Could not read error response as text in accountService:', e);
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
  // If successful but not JSON (e.g. just a 201 OK with no body, or text)
  // You might want to return response.text() or null depending on expectations
  // For createNewAccount, we expect a JSON object back.
  // If the backend sends a 201 with no body but it's application/json, .json() would fail.
  // However, your backend /api/accounts POST route sends back the newAccount object as JSON.
  return response.text().then(text => {
    if (text) {
        try {
            return JSON.parse(text); // Try to parse if text is not empty
        } catch (e) {
            console.warn('Successful response was not valid JSON in accountService, returning text:', text);
            return text; // Fallback to text if parsing fails
        }
    }
    return null; // Return null if text is empty
  });
}

/**
 * Helper function to get the auth token from localStorage.
 * @returns {string|null} - The token or null.
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Creates a new account for the authenticated user by calling the backend API.
 * This function is tailored to work with your `src/routes/accounts.js` backend endpoint.
 * @param {object} accountData - The account data.
 *   Expected to have `accountType` (string) and `initialBalance` (number).
 * @returns {Promise<object>} A promise that resolves to the new account object from the backend.
 * @throws {Error} If the API call fails or the backend returns an error.
 */
export const createNewAccount = async (accountData) => {
  console.log('Attempting to create new account via accountService.js with:', accountData);
  const token = getAuthToken();

  if (!token) {
    // It's often better to let the component handle UI for this,
    // but throwing an error here is also valid.
    throw new Error('Authentication error: You are not logged in.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(accountData), // Expects { accountType, initialBalance }
    });

    return await handleAccountServiceResponse(response);
  } catch (error) {
    // Log the error and re-throw to be caught by the calling component
    console.error('Error in createNewAccount service call:', error.message, error.data || '');
    // You might want to throw a more specific error or the original error
    throw error;
  }
};

