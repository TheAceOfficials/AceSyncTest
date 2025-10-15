class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Anime Details App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-[var(--text-light)] mb-4">Something went wrong</h1>
                        <button 
                            className="btn-primary"
                            onClick={() => window.location.reload()}
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

function AnimeDetailsApp() {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-[var(--background-dark)] to-[var(--secondary-color)]">
                <Header />
                <AnimeDetailsContent />
                <Footer />
            </div>
        </ErrorBoundary>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AnimeDetailsApp />);