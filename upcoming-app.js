// Upcoming Content App Entry Point
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Upcoming Content App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-dark)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Something went wrong</h2>
            <p className="text-[var(--text-muted)] mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function UpcomingApp() {
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[var(--background-dark)] to-[var(--secondary-color)]">
        <Header />
        <div className="flex">
          <Sidebar 
            expanded={sidebarExpanded} 
            setExpanded={setSidebarExpanded}
          />
          <main className="flex-1 transition-all duration-300">
            <UpcomingContent />
          </main>
        </div>
        <Footer />
        <NotificationToast />
      </div>
    </ErrorBoundary>
  );
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UpcomingApp />);