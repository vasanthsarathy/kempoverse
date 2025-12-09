import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import EntryDetail from './components/EntryDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="logo-link">
            <div className="logo-mark">
              <span className="logo-dot">●</span>
              <h1 className="logo-text">KEMPOVERSE</h1>
            </div>
          </Link>
          <p className="tagline">Your personal universe of kempo knowledge</p>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Kempoverse · Private training notes</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
