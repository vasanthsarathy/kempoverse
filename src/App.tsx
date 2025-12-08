import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-mark">
          <span className="logo-dot">●</span>
          <h1 className="logo-text">KEMPOVERSE</h1>
        </div>
        <p className="tagline">Your personal universe of kempo knowledge</p>
      </header>

      <main className="app-main">
        <div className="placeholder-content">
          <h2>Welcome to Kempoverse</h2>
          <p>Phase 0: Setup complete</p>
          <p className="status-text">
            Ready for Phase 1: Backend & API implementation
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>Kempoverse · Private training notes</p>
      </footer>
    </div>
  );
}

export default App;
