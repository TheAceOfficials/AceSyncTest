class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Cast Details App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { 
        className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900' 
      },
        React.createElement('div', { className: 'text-center text-white' },
          React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Something went wrong'),
          React.createElement('button', {
            className: 'bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded',
            onClick: () => window.location.reload()
          }, 'Reload Page')
        )
      );
    }

    return this.props.children;
  }
}

function CastDetailsApp() {
  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background-dark)] to-[var(--secondary-color)]" data-name="cast-details-app" data-file="cast-details-app.js">
        <Header />
        <CastDetailsContent />
        <Footer />
        <NotificationToast />
      </div>
    );
  } catch (error) {
    console.error('CastDetailsApp component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(ErrorBoundary, {},
    React.createElement(CastDetailsApp)
  )
);