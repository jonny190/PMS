import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import MyDay from './pages/MyDay';
import EndOfDay from './pages/EndOfDay';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  const { token, user, isAuthenticated } = useAuthStore();

  if (!token) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        {/* End User Routes */}
        <Route
          path="/"
          element={isAuthenticated ? <MyDay /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-day"
          element={isAuthenticated ? <MyDay /> : <Navigate to="/login" />}
        />
        <Route
          path="/end-of-day"
          element={isAuthenticated ? <EndOfDay /> : <Navigate to="/login" />}
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard"
          element={user?.role === 'user' ? <MyDay /> : <Dashboard />}
        />
        <Route
          path="/admin"
          element={user?.role === 'platform_admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />}
        />

        {/* Redirect for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;