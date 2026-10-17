import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Overview from './pages/Overview';
import Generate from './pages/Generate';
import ResumeTailor from './pages/ResumeTailor';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import History from './pages/History';
import Tracker from './pages/Tracker';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CopyrightPolicy from './pages/CopyrightPolicy';
import { useAuth } from './context/AuthContext';

function App() {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public legal pages */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/copyright" element={<CopyrightPolicy />} />

                {/* Protected app */}
                <Route path="/dashboard" element={user ? <Layout /> : <Navigate to="/login" />}>
                    <Route index element={<Overview />} />
                    <Route path="generate" element={<Generate />} />
                    <Route path="resume" element={<ResumeTailor />} />
                    <Route path="tracker" element={<Tracker />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="billing" element={<Billing />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
