class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--secondary-color)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-light)] mb-4">Something went wrong</h1>
            <p className="text-[var(--text-muted)] mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ShowDetailsApp() {
  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background-dark)] to-[var(--secondary-color)]" data-name="show-details-app" data-file="show-details-app.js">
        <Header />
        <ShowDetailsContent />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('ShowDetailsApp component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <ShowDetailsApp />
  </ErrorBoundary>
);