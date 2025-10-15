function TrendingSection() {
  try {
  const [ratings, setRatings] = React.useState({});
  const [watchedStatus, setWatchedStatus] = React.useState({});
  const [trendingShows, setTrendingShows] = React.useState([]);
  const [trendingMovies, setTrendingMovies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadTrendingContent = async () => {
        try {
          const [showsData, moviesData] = await Promise.all([
            TraktAPI.getTrendingShows(6),
            TraktAPI.getTrendingMovies(6)
          ]);

          const processedShows = await TraktAPI.processContentWithImages(showsData, 'tv');
          const processedMovies = await TraktAPI.processContentWithImages(moviesData, 'movie');

          // Apply synced watched status
          const showsWithStatus = processedShows.map(show => ({
            ...show,
            isWatched: TraktAPI.getShowWatchedStatus(show.tmdb_id)
          }));

          const moviesWithStatus = processedMovies.map(movie => ({
            ...movie,
            isWatched: TraktAPI.getMovieWatchedStatus(movie.tmdb_id)
          }));

          setTrendingShows(showsWithStatus);
          setTrendingMovies(moviesWithStatus);

          // Set initial watched status from sync
          const initialWatchedStatus = {};
          [...showsWithStatus, ...moviesWithStatus].forEach(item => {
            if (item.isWatched) {
              initialWatchedStatus[item.id] = true;
            }
          });
          setWatchedStatus(initialWatchedStatus);

        } catch (error) {
          console.error('Failed to load trending content:', error);
        } finally {
          setLoading(false);
        }
      };

      loadTrendingContent();
    }, []);

    const handleRating = async (item, ratingType) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to rate content');
        return;
      }

      try {
        const rating = ratingType === 'up' ? 10 : 1;
        const contentType = item.type === 'Movie' ? 'movies' : 'shows';
        
        await TraktAPI.rateContent(contentType, {
          ids: { trakt: item.trakt_id }
        }, rating);

        setRatings(prev => ({
          ...prev,
          [item.id]: prev[item.id] === ratingType ? null : ratingType
        }));
      } catch (error) {
        console.error('Failed to rate content:', error);
      }
    };

    const handleMarkAsWatched = async (item) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to mark content as watched');
        return;
      }

      try {
        const contentType = item.type === 'Movie' ? 'movies' : 'shows';
        const isCurrentlyWatched = watchedStatus[item.id];
        
        if (isCurrentlyWatched) {
          await TraktAPI.removeFromWatched(contentType, {
            ids: { trakt: item.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [item.id]: false
          }));
        } else {
          await TraktAPI.markAsWatched(contentType, {
            ids: { trakt: item.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [item.id]: true
          }));
        }
      } catch (error) {
        console.error('Failed to update watched status:', error);
      }
    };

    const allTrendingItems = [...trendingShows.slice(0, 2), ...trendingMovies.slice(0, 2)];

    return (
      <section className="py-16 px-4" data-name="trending" data-file="components/TrendingSection.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                Trending Now
              </span>
            </h2>
            <p className="text-xl text-[var(--text-muted)]">Discover what's captivating audiences worldwide</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card-compact animate-pulse">
                  <div className="w-full h-48 sm:h-56 md:h-64 bg-[var(--accent-color)] rounded-xl mb-4"></div>
                  <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                  <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {allTrendingItems.map(item => (
              <div key={item.id} className="card-compact group cursor-pointer" onClick={() => {
                if (item.type === 'Movie') {
                  window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                } else if (item.type === 'Show') {
                  window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                }
              }}>
                <div className="relative overflow-hidden rounded-xl mb-4">
                  <img 
                    src={item.poster} 
                    alt={item.title}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-8 h-8 bg-[var(--primary-color)] text-white rounded-full flex items-center justify-center hover:bg-[var(--primary-hover)]">
                      <div className="icon-plus text-sm"></div>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{item.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{item.type} • {item.year}</p>
                    {item.type === 'Movie' && item.runtime && (
                      <p className="text-[var(--primary-color)] text-xs">{item.runtime} min</p>
                    )}
                    {item.type === 'Show' && (
                      <p className="text-[var(--primary-color)] text-xs">
                        {item.seasons === 1 ? `${item.episodes} episodes` : `${item.seasons} seasons`}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleRating(item, 'up')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          ratings[item.id] === 'up' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                            : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-green-500/10 hover:text-green-400'
                        }`}
                      >
                        <div className="icon-thumbs-up text-xs"></div>
                      </button>
                      <button
                        onClick={() => handleRating(item, 'down')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          ratings[item.id] === 'down' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                            : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400'
                        }`}
                      >
                        <div className="icon-thumbs-down text-xs"></div>
                      </button>
                    </div>
                    <button
                      onClick={() => handleMarkAsWatched(item)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        watchedStatus[item.id] 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                          : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-400'
                      }`}
                      title={watchedStatus[item.id] ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      <div className={`icon-${watchedStatus[item.id] ? 'eye-off' : 'eye'} text-xs`}></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('TrendingSection component error:', error);
    return null;
  }
}