function Header() {
  try {
  const [isSmartSearchOpen, setIsSmartSearchOpen] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState([]);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);
  const [notification, setNotification] = React.useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = React.useState('');

  // Get current page from URL
  React.useEffect(() => {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    setCurrentPage(filename);
  }, []);

    const showNotification = (message, type = 'success') => {
      setNotification({ show: true, message, type });
    };

    const hideNotification = () => {
      setNotification({ show: false, message: '', type: 'success' });
    };

  React.useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('acesync_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }

    // Check authentication status
    const checkAuth = async () => {
      try {
        if (TraktAPI && TraktAPI.isAuthenticated()) {
          setIsAuthenticated(true);
          // Load real user profile
          try {
            const profile = await TraktAPI.getUserProfile();
            setUserProfile(profile);
            
            // Sync watched content on app load
            await TraktAPI.syncWatchedContent();
          } catch (error) {
            console.error('Failed to load user profile:', error);
            setUserProfile({ username: 'demo_user', name: 'Demo User' });
          }
        }

        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          try {
            // Exchange code for token
            await TraktAPI.exchangeCodeForToken(code, state);
            setIsAuthenticated(true);
            
            // Load user profile after authentication
            try {
              const profile = await TraktAPI.getUserProfile();
              setUserProfile(profile);
            } catch (error) {
              console.error('Failed to load profile after auth:', error);
              setUserProfile({ username: 'demo_user', name: 'Demo User' });
            }
            
            // Sync watched content from Trakt
            try {
              await TraktAPI.syncWatchedContent();
              console.log('Synced watched content from Trakt');
            } catch (error) {
              console.error('Failed to sync watched content:', error);
            }
            
            // Show success notification
            showNotification('Successfully signed in and synced your watch history!', 'success');
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('Authentication failed:', error);
            showNotification('Sign in failed. Please try again.', 'error');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  const openSmartSearch = () => {
    setIsSmartSearchOpen(true);
  };

  const closeSmartSearch = () => {
    setIsSmartSearchOpen(false);
  };

    const handleLogin = () => {
      window.location.href = TraktAPI.getAuthUrl();
    };

    const handleLogout = () => {
      if (TraktAPI) {
        TraktAPI.logout();
      }
      setIsAuthenticated(false);
      setUserProfile(null);
      showNotification('Successfully signed out', 'success');
    };

    return (
      <>
        <NotificationToast 
          message={notification.message}
          type={notification.type}
          isVisible={notification.show}
          onClose={hideNotification}
        />
        <SmartSearch isOpen={isSmartSearchOpen} onClose={closeSmartSearch} />
        <header className="glass-effect sticky top-0 z-30 border-b border-[var(--border-color)]" data-name="header" data-file="components/Header.js">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Page Title */}
            <div className="flex items-center space-x-6">
              {/* AceSync Logo - Clickable */}
              <a href="index.html" className="text-2xl font-bold text-[var(--primary-color)] hover:text-[var(--primary-hover)] transition-colors">
                AceSync
              </a>
              
              {/* Page Title - Dynamic based on current page */}
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-[var(--text-light)]">
                  {currentPage === 'index.html' || currentPage === '' ? 'Dashboard' : 
                   currentPage === 'discover.html' ? 'Discover' :
                   currentPage === 'movies.html' ? 'Movies' :
                   currentPage === 'shows.html' ? 'TV Shows' :
                   currentPage === 'watchlist.html' ? 'My Watchlist' :
                   currentPage === 'calendar.html' ? 'Release Calendar' :
                   currentPage === 'profile.html' ? 'My Profile' :
                   currentPage === 'notifications.html' ? 'Notifications' : ''}
                </h1>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Smart Search Button */}
              <button
                onClick={openSmartSearch}
                className="flex items-center space-x-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-light)] px-4 py-2 rounded-xl hover:bg-[var(--accent-color)] transition-all"
              >
                <div className="icon-search text-lg"></div>
                <span className="hidden sm:inline text-sm">Smart Search</span>
              </button>

              {/* Authentication Actions */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {userProfile && (
                    <a href="profile.html" className="text-[var(--text-muted)] hover:text-[var(--text-light)] font-medium">
                      Hi, {userProfile.name || userProfile.username}
                    </a>
                  )}
                  <button onClick={handleLogout} className="btn-secondary">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button onClick={handleLogin} className="btn-secondary">
                    Sign In
                  </button>
                  <button onClick={handleLogin} className="btn-primary">
                    Join Premium
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      </>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}