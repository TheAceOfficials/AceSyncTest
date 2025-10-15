function RecentlyWatched() {
  try {
    const [recentlyWatched, setRecentlyWatched] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadRecentlyWatched = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          const history = await TraktAPI.makeRequest('/users/me/history?limit=12');
          
          const processed = await Promise.all(history.map(async (item) => {
            if (item.movie) {
              const poster = await TraktAPI.getTMDBImage('movie', item.movie.ids?.tmdb) || 
                             TraktAPI.getFallbackImage('movie');
              return {
                id: item.movie.ids?.trakt || Math.random(),
                title: item.movie.title || 'Unknown Movie',
                type: 'Movie',
                poster,
                watchedAt: item.watched_at,
                year: item.movie.year,
                trakt_id: item.movie.ids?.trakt,
                tmdb_id: item.movie.ids?.tmdb
              };
            } else if (item.show && item.episode) {
              const poster = await TraktAPI.getTMDBImage('tv', item.show.ids?.tmdb) || 
                             TraktAPI.getFallbackImage('show');
              
              // Get episode thumbnail from TMDB
              let thumbnail = null;
              try {
                const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
                  item.show.ids?.tmdb,
                  item.episode.season,
                  item.episode.number
                );
                thumbnail = episodeDetails?.thumbnail;
              } catch (error) {
                console.error('Failed to get episode thumbnail:', error);
              }
              
              return {
                id: item.episode.ids?.trakt || Math.random(),
                title: item.show.title || 'Unknown Show',
                episode: item.episode.title || 'Episode',
                season: item.episode.season,
                number: item.episode.number,
                type: 'Episode',
                poster,
                thumbnail: thumbnail || poster, // Use episode thumbnail or fallback to show poster
                watchedAt: item.watched_at,
                trakt_id: item.show.ids?.trakt,
                tmdb_id: item.show.ids?.tmdb
              };
            }
            return null;
          })).then(items => items.filter(Boolean));

          setRecentlyWatched(processed);
        } catch (error) {
          console.error('Failed to load recently watched:', error);
        } finally {
          setLoading(false);
        }
      };

      loadRecentlyWatched();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && recentlyWatched.length === 0)) {
      return null;
    }

    const formatTimeAgo = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };

    return (
      <section className="py-8 px-4" data-name="recently-watched" data-file="components/RecentlyWatched.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">Recently Watched</h2>
          </div>
          
          {loading ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`flex-shrink-0 ${i % 2 === 0 ? 'w-40' : 'w-64'}`}>
                  <div className="card-compact animate-pulse">
                    <div className={`w-full bg-[var(--accent-color)] rounded-lg mb-3 ${i % 2 === 0 ? 'h-56' : 'h-36'}`}></div>
                    <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recentlyWatched.map(item => (
                <div key={item.id} className={`flex-shrink-0 ${item.type === 'Movie' ? 'w-40' : 'w-64'}`}>
                  <div className="card-compact group cursor-pointer" onClick={() => {
                    if (item.type === 'Movie') {
                      window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                    } else if (item.type === 'Episode' && item.tmdb_id && item.season && item.number) {
                      window.location.href = `episode-details.html?showId=${item.tmdb_id}&season=${item.season}&episode=${item.number}`;
                    }
                  }}>
                    {item.type === 'Movie' ? (
                      // Movie Poster (Portrait)
                      <div className="relative">
                        <img 
                          src={item.poster} 
                          alt={item.title}
                          className="w-full h-56 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                          Movie
                        </div>
                      </div>
                    ) : (
                      // Episode Thumbnail (Landscape)
                      <div className="relative">
                        <img 
                          src={item.thumbnail || item.poster} 
                          alt={`${item.title} - ${item.episode}`}
                          className="w-full h-36 object-cover rounded-xl mb-3 transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                          S{item.season}E{item.number}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-xl"></div>
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate mb-1">
                      {item.type === 'Episode' ? item.title : item.title}
                    </h3>
                    
                    {item.type === 'Episode' && item.episode && (
                      <p className="text-[var(--text-muted)] text-xs mb-1 truncate">
                        {item.episode}
                      </p>
                    )}
                    
                    <p className="text-[var(--text-muted)] text-xs mb-1">
                      {item.type === 'Episode' ? `Season ${item.season}` : item.year}
                    </p>
                    <p className="text-[var(--primary-color)] text-xs">{formatTimeAgo(item.watchedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('RecentlyWatched component error:', error);
    return null;
  }
}
