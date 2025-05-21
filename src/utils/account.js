/**
 * Generates a random 10-digit account number string.
 * IMPORTANT: For a real banking system, this needs to be much more robust,
 * potentially involving check digits, bank codes, and ensuring true uniqueness
 * within the database with proper constraints and retry logic.
 * This is a placeholder.
 * @returns {string} A 10-digit account number string.
 */
const generateAccountNumber = () => {
  // Generate a number between 1,000,000,000 and 9,999,999,999
  const min = 1000000000; // Smallest 10-digit number
  const max = 9999999999; // Largest 10-digit number
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(randomNumber);
};

module.exports = {
  generateAccountNumber,
};