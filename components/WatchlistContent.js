function WatchlistContent() {
  try {
    const [watchlist, setWatchlist] = React.useState([]);
    const [filteredWatchlist, setFilteredWatchlist] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [activeFilter, setActiveFilter] = React.useState('all');

    React.useEffect(() => {
      const loadWatchlist = async () => {
        const authenticated = TraktAPI.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          try {
            const watchlistData = await TraktAPI.getUserWatchlist();
            
            const processedWatchlist = await Promise.all(watchlistData.map(async (item) => {
              if (item.movie) {
                const tmdbDetails = await TraktAPI.getTMDBDetails('movie', item.movie.ids?.tmdb);
                const poster = tmdbDetails?.poster || TraktAPI.getFallbackImage('movie');
                return {
                  id: item.movie.ids?.trakt || Math.random(),
                  title: item.movie.title || 'Unknown Movie',
                  type: 'Movie',
                  poster,
                  year: item.movie.year || 2024,
                  runtime: tmdbDetails?.runtime || null,
                  trakt_id: item.movie.ids?.trakt,
                  tmdb_id: item.movie.ids?.tmdb
                };
              } else if (item.show) {
                const tmdbDetails = await TraktAPI.getTMDBDetails('tv', item.show.ids?.tmdb);
                const poster = tmdbDetails?.poster || TraktAPI.getFallbackImage('show');
                return {
                  id: item.show.ids?.trakt || Math.random(),
                  title: item.show.title || 'Unknown Show',
                  type: 'Show',
                  poster,
                  year: item.show.year || 2024,
                  seasons: tmdbDetails?.seasons || 0,
                  episodes: tmdbDetails?.episodes || 0,
                  trakt_id: item.show.ids?.trakt,
                  tmdb_id: item.show.ids?.tmdb
                };
              }
            })).then(items => items.filter(Boolean));
            
            setWatchlist(processedWatchlist);
            setFilteredWatchlist(processedWatchlist);
          } catch (error) {
            console.error('Failed to load watchlist:', error);
            setWatchlist([]);
          }
        }
        setLoading(false);
      };

      loadWatchlist();
    }, []);

    React.useEffect(() => {
      filterWatchlist();
    }, [activeFilter, watchlist]);

    const filterWatchlist = () => {
      let filtered = watchlist;
      
      switch (activeFilter) {
        case 'movies':
          filtered = watchlist.filter(item => item.type === 'Movie');
          break;
        case 'shows':
          filtered = watchlist.filter(item => item.type === 'Show');
          break;
        case 'all':
        default:
          filtered = watchlist;
      }
      
      setFilteredWatchlist(filtered);
    };

    const removeFromWatchlist = async (item) => {
      try {
        const contentType = item.type === 'Movie' ? 'movies' : 'shows';
        await TraktAPI.removeFromWatchlist(contentType, {
          ids: { trakt: item.trakt_id }
        });
        
        setWatchlist(prev => prev.filter(watchlistItem => watchlistItem.id !== item.id));
      } catch (error) {
        console.error('Failed to remove from watchlist:', error);
      }
    };

    if (!isAuthenticated) {
      return (
        <main className="py-16 px-4" data-name="watchlist-content" data-file="components/WatchlistContent.js">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-user text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Sign In Required</h2>
              <p className="text-[var(--text-muted)] mb-6">You need to sign in to view your watchlist</p>
              <button 
                onClick={() => window.location.href = TraktAPI.getAuthUrl()}
                className="btn-primary"
              >
                Sign In to Continue
              </button>
            </div>
          </div>
        </main>
      );
    }

    const getFilterCounts = () => {
      const movies = watchlist.filter(item => item.type === 'Movie').length;
      const shows = watchlist.filter(item => item.type === 'Show').length;
      return { all: watchlist.length, movies, shows };
    };

    const counts = getFilterCounts();

    return (
      <main className="py-8 px-4" data-name="watchlist-content" data-file="components/WatchlistContent.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                My Watchlist
              </span>
            </h1>
            <p className="text-xl text-[var(--text-muted)]">Movies and shows you want to watch</p>
          </div>

          {/* Filter Tabs */}
          {isAuthenticated && !loading && watchlist.length > 0 && (
            <div className="flex justify-center mb-8">
              <div className="card-compact">
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: `All (${counts.all})`, icon: 'list' },
                    { key: 'movies', label: `Movies (${counts.movies})`, icon: 'film' },
                    { key: 'shows', label: `Shows (${counts.shows})`, icon: 'tv' }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeFilter === filter.key
                          ? 'bg-[var(--primary-color)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
                      }`}
                    >
                      <div className={`icon-${filter.icon} text-sm`}></div>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="card-compact animate-pulse">
                  <div className="w-full h-64 bg-[var(--accent-color)] rounded-lg mb-3"></div>
                  <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                  <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-16">
              <div className="card max-w-md mx-auto">
                <div className="icon-user text-4xl text-[var(--primary-color)] mb-4"></div>
                <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Sign In Required</h2>
                <p className="text-[var(--text-muted)] mb-6">You need to sign in to view your watchlist</p>
                <button 
                  onClick={() => window.location.href = TraktAPI.getAuthUrl()}
                  className="btn-primary"
                >
                  Sign In to Continue
                </button>
              </div>
            </div>
          ) : filteredWatchlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="icon-bookmark text-4xl text-[var(--text-muted)] mb-4"></div>
              <h3 className="text-xl font-bold text-[var(--text-light)] mb-2">
                {activeFilter === 'all' ? 'Your watchlist is empty' : 
                 activeFilter === 'movies' ? 'No movies in watchlist' : 'No shows in watchlist'}
              </h3>
              <p className="text-[var(--text-muted)] mb-6">Start adding content you want to watch</p>
              <div className="space-x-4">
                <button onClick={() => window.location.href = '/movies.html'} className="btn-primary">Browse Movies</button>
                <button onClick={() => window.location.href = '/shows.html'} className="btn-secondary">Browse Shows</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredWatchlist.map(item => (
                <div key={item.id} className="card-compact group cursor-pointer" onClick={() => {
                  if (item.type === 'Movie') {
                    window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                  } else if (item.type === 'Show') {
                    window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                  }
                }}>
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{item.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{item.type} • {item.year}</p>
                    {item.type === 'Movie' && item.runtime && (
                      <p className="text-[var(--primary-color)] text-xs">{item.runtime} min</p>
                    )}
                    {item.type === 'Show' && (item.seasons > 0 || item.episodes > 0) && (
                      <p className="text-[var(--primary-color)] text-xs">
                        {item.seasons === 1 ? `${item.episodes} episodes` : `${item.seasons} seasons`}
                      </p>
                    )}
                    
                    <button
                      onClick={() => removeFromWatchlist(item)}
                      className="w-full bg-red-500/20 text-red-400 py-2 rounded-lg text-xs hover:bg-red-500/30 transition-colors border border-red-500/40 font-medium"
                    >
                      Remove from Watchlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('WatchlistContent component error:', error);
    return null;
  }
}