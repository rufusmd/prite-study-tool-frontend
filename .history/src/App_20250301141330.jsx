// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import { AuthContext } from './contexts/AuthContext';
import CapturePage from './pages/CapturePage';

// Layout
import MobileLayout from './layouts/MobileLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import CapturePage from './pages/CapturePage';
import BrowsePage from './pages/BrowsePage';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <QuestionProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MobileLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HomePage />} />
              <Route path="study" element={<StudyPage />} />
              <Route path="capture" element={<CapturePage />} />
              <Route path="browse" element={<BrowsePage />} />
            </Route>
          </Routes>
        </Router>
      </QuestionProvider>
    </AuthProvider>
  );
}

export default App;