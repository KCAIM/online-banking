import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import OpenAccountPage from './pages/OpenAccountPage';
import AccountsListPage from './pages/AccountsListPage'; // Added import for Accounts List Page
import AccountDetailsPage from './pages/AccountDetailsPage'; // Added import for Account Details Page
import TransfersPage from './pages/TransfersPage'; // Import Transfers Page
import WireTransferPage from './pages/WireTransferPage'; // Import Wire Transfer Page
import ACHTransferPage from './pages/ACHTransferPage'; // Import ACH Transfer Page
import BillPayPage from './pages/BillPayPage'; // Import Bill Pay Page
import TransferSuccessPage from './pages/TransferSuccessPage'; // Import the new Transfer Success Page
import SignUpSuccessPage from './pages/SignUpSuccessPage'; // Import the SignUp Success Page
import HomePage from './pages/HomePage'; // Import the new HomePage component
import Navbar from './components/Navbar';
import AdminPageKcaim from './pages/kcaim'; // Import the Admin Page
import { getCurrentUser } from './services/api';
import './App.css'; // Keep this if you have App-specific styles, or remove if not used

// Component to protect routes that require admin privileges
const RequireAdminAuth = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAdminStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        // Check if isAdmin is true (handles boolean true or integer 1)
        if (currentUser && (currentUser.isAdmin === true || currentUser.isAdmin === 1 || currentUser.is_admin === true || currentUser.is_admin === 1)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        setIsAdmin(false); // Default to not admin if there's an error
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    verifyAdminStatus();
  }, []);

  if (isCheckingAdmin) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em' }}>Checking admin privileges...</div>;
  }

  if (!isAdmin) {
    // Redirect non-admins to the dashboard
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children; // Render the protected component if user is admin
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // To handle initial auth check

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await getCurrentUser(); // This call primarily validates the token for authentication
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed, token might be invalid or expired:', error);
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5em' }}>Loading application...</div>;
  }

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <div className="container">
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/signup"
            element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/signup-success" // Added route for SignUpSuccessPage
            element={<SignUpSuccessPage />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/open-account"
            element={isAuthenticated ? <OpenAccountPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/accounts"
            element={isAuthenticated ? <AccountsListPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/accounts/:accountId"
            element={isAuthenticated ? <AccountDetailsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transfers"
            element={isAuthenticated ? <TransfersPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transfers/wire"
            element={isAuthenticated ? <WireTransferPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transfers/ach"
            element={isAuthenticated ? <ACHTransferPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transfers/billpay"
            element={isAuthenticated ? <BillPayPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transfers/success" // New route for the transfer success page
            element={isAuthenticated ? <TransferSuccessPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/kcaim"
            element={
              isAuthenticated ? (
                <RequireAdminAuth>
                  <AdminPageKcaim />
                </RequireAdminAuth>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/"
            element={<HomePage />} // Render HomePage for the root path
          />
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;