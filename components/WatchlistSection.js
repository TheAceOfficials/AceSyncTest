function WatchlistSection() {
  try {
    const [watchlist, setWatchlist] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadWatchlist = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          const watchlistData = await TraktAPI.getUserWatchlist();
          
          const processed = await Promise.all(watchlistData.slice(0, 6).map(async (item) => {
            if (item.movie) {
              const poster = await TraktAPI.getTMDBImage('movie', item.movie.ids?.tmdb) || 
                             TraktAPI.getFallbackImage('movie');
              return {
                id: item.movie.ids?.trakt || Math.random(),
                title: item.movie.title || 'Unknown Movie',
                type: 'Movie',
                poster,
                year: item.movie.year || 2024,
                trakt_id: item.movie.ids?.trakt,
                tmdb_id: item.movie.ids?.tmdb
              };
            } else if (item.show) {
              const poster = await TraktAPI.getTMDBImage('tv', item.show.ids?.tmdb) || 
                             TraktAPI.getFallbackImage('show');
              return {
                id: item.show.ids?.trakt || Math.random(),
                title: item.show.title || 'Unknown Show',
                type: 'Show',
                poster,
                year: item.show.year || 2024,
                trakt_id: item.show.ids?.trakt,
                tmdb_id: item.show.ids?.tmdb
              };
            }
          })).then(items => items.filter(Boolean));
          
          setWatchlist(processed);
        } catch (error) {
          console.error('Failed to load watchlist:', error);
        } finally {
          setLoading(false);
        }
      };

      loadWatchlist();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && watchlist.length === 0)) {
      return null;
    }

    return (
      <section className="py-8 px-4" data-name="watchlist-section" data-file="components/WatchlistSection.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">Your Watchlist</h2>
            <a href="watchlist.html" className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] text-sm font-medium">
              View All
            </a>
          </div>
          
          {loading ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex-shrink-0 w-40">
                  <div className="card-compact animate-pulse">
                    <div className="w-full h-56 bg-[var(--accent-color)] rounded-lg mb-3"></div>
                    <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {watchlist.map(item => (
                <div key={item.id} className="flex-shrink-0 w-40">
                  <div className="card-compact group cursor-pointer" onClick={() => {
                    if (item.type === 'Movie') {
                      window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                    } else if (item.type === 'Show') {
                      window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                    }
                  }}>
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-56 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate mb-1">{item.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{item.type} • {item.year}</p>
                    {item.type === 'Movie' && item.runtime && (
                      <p className="text-[var(--primary-color)] text-xs">{item.runtime} min</p>
                    )}
                    {item.type === 'Show' && (item.seasons > 0 || item.episodes > 0) && (
                      <p className="text-[var(--primary-color)] text-xs">
                        {item.seasons === 1 ? `${item.episodes} episodes` : `${item.seasons} seasons`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('WatchlistSection component error:', error);
    return null;
  }
}