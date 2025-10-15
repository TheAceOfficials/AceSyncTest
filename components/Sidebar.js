function Sidebar() {
  try {
    const [isHovered, setIsHovered] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState('');

    // Get current page from URL
    React.useEffect(() => {
      const path = window.location.pathname;
      const filename = path.split('/').pop() || 'index.html';
      setCurrentPage(filename);
    }, []);

    const navigationItems = [
      { 
        id: 'home', 
        icon: 'house', 
        label: 'Home', 
        href: 'index.html',
        active: currentPage === 'index.html' || currentPage === ''
      },
      { 
        id: 'discover', 
        icon: 'compass', 
        label: 'Discover', 
        href: 'discover.html',
        active: currentPage === 'discover.html'
      },
      { 
        id: 'movies', 
        icon: 'film', 
        label: 'Movies', 
        href: 'movies.html',
        active: currentPage === 'movies.html'
      },
      { 
        id: 'shows', 
        icon: 'tv', 
        label: 'TV Shows', 
        href: 'shows.html',
        active: currentPage === 'shows.html'
      },
      { 
        id: 'watchlist', 
        icon: 'bookmark', 
        label: 'Watchlist', 
        href: 'watchlist.html',
        active: currentPage === 'watchlist.html'
      },
      { 
        id: 'calendar', 
        icon: 'calendar', 
        label: 'Calendar', 
        href: 'calendar.html',
        active: currentPage === 'calendar.html'
      },
      { 
        id: 'upcoming', 
        icon: 'clock', 
        label: 'Upcoming', 
        href: 'upcoming.html',
        active: currentPage === 'upcoming.html'
      },
      { 
        id: 'profile', 
        icon: 'user', 
        label: 'Profile', 
        href: 'profile.html',
        active: currentPage === 'profile.html'
      },
      { 
        id: 'settings', 
        icon: 'settings', 
        label: 'Settings', 
        href: 'settings.html',
        active: currentPage === 'settings.html'
      }
    ];

    const handleNavigation = (href) => {
      if (href !== '#') {
        window.location.href = href;
      }
    };

    return (
      <div 
        className={`fixed left-0 top-0 h-full z-40 glass-effect border-r border-[var(--border-color)] transition-all duration-500 ease-in-out ${
          isHovered ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-name="sidebar" 
        data-file="components/Sidebar.js"
      >
        {/* Logo Section */}
        <div className="flex items-center p-6 border-b border-[var(--border-color)]">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--gradient-to)] rounded-lg flex items-center justify-center flex-shrink-0">
            <div className="icon-zap text-white text-lg"></div>
          </div>
          <div className={`ml-3 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'} overflow-hidden`}>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent whitespace-nowrap">
              AceSync
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 pt-6">
          <div className="space-y-2 px-3">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 group ${
                  item.active 
                    ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-lg' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${
                  item.active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--primary-color)]'
                }`}>
                  <div className={`icon-${item.icon} text-xl transition-all duration-300 ${
                    isHovered ? 'scale-100' : 'scale-110'
                  }`}></div>
                </div>
                <span className={`ml-4 font-medium whitespace-nowrap transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                } overflow-hidden`}>
                  {item.label}
                </span>
                {item.active && (
                  <div className={`ml-auto w-1 h-6 bg-white rounded-full transition-all duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[var(--border-color)]">
          <div className={`text-xs text-[var(--text-muted)] text-center transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="font-semibold">Premium</p>
            <p>© 2025 AceSync</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Sidebar component error:', error);
    return null;
  }
}