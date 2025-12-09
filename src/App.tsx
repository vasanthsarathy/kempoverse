import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateEntry from './pages/CreateEntry';
import EditEntry from './pages/EditEntry';
import EntryDetail from './components/EntryDetail';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <div className="logo-mark">
              <span className="logo-dot">●</span>
              <h1 className="logo-text">KEMPOVERSE</h1>
            </div>
          </Link>
          <p className="tagline">Your personal universe of kempo knowledge</p>
        </div>
        <div className="header-actions">
          {isAuthenticated ? (
            <button onClick={logout} className="auth-button">
              Logout
            </button>
          ) : (
            <Link to="/login" className="auth-button">
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entry/:id" element={<EntryDetail />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/entries/new"
            element={
              <ProtectedRoute>
                <CreateEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entries/:id/edit"
            element={
              <ProtectedRoute>
                <EditEntry />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Kempoverse · Private training notes</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
