function Footer() {
  try {
    return (
      <footer className="bg-[var(--card-bg)] border-t border-[var(--border-color)] py-12 px-4 mt-16" data-name="footer" data-file="components/Footer.js">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--gradient-to)] rounded-lg flex items-center justify-center">
                  <div className="icon-zap text-white text-lg"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                  AceSync
                </span>
              </div>
              <p className="text-[var(--text-muted)] mb-4 max-w-md">
                The premium entertainment tracking platform designed for users who demand excellence, 
                sophistication, and seamless synchronization across all devices.
              </p>
              <div className="text-sm text-[var(--text-muted)]">
                Premium. Sleek. Synchronized.
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--text-light)] mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <button onClick={() => window.location.href = '/discover.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Discover</button>
                <button onClick={() => window.location.href = '/movies.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Movies</button>
                <button onClick={() => window.location.href = '/shows.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">TV Shows</button>
                <button onClick={() => window.location.href = '/anime.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Anime</button>
                <button onClick={() => window.location.href = '/watchlist.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Watchlist</button>
                <button onClick={() => window.location.href = '/profile.html'} className="block text-left text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Profile</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--text-light)] mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Help Center</a>
                <a href="#" className="block text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Premium API</a>
                <a href="#" className="block text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Privacy Policy</a>
                <a href="#" className="block text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[var(--text-muted)] text-sm mb-4 md:mb-0">
              © 2025 AceSync Premium. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
                <div className="icon-shield-check text-[var(--primary-color)]"></div>
                <span>Premium Secure</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
                <div className="icon-zap text-[var(--gradient-to)]"></div>
                <span>Lightning Fast</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  } catch (error) {
    console.error('Footer component error:', error);
    return null;
  }
}