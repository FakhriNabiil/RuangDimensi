import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isReady } = useAuth();
  const location = useLocation();

  // Wait for the AuthContext to finish checking localStorage before deciding,
  // otherwise a logged-in user gets bounced to /login on every hard refresh.
  if (!isReady) {
    return <LoadingSpinner label="Checking session" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
