function MoviesContent() {
  try {
    const [trendingMovies, setTrendingMovies] = React.useState([]);
    const [popularMovies, setPopularMovies] = React.useState([]);
    const [recommendedMovies, setRecommendedMovies] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [ratings, setRatings] = React.useState({});
    const [watchedStatus, setWatchedStatus] = React.useState({});
    const [activeSection, setActiveSection] = React.useState('trending');
    const [selectedGenres, setSelectedGenres] = React.useState([]);
    const [filteredMovies, setFilteredMovies] = React.useState([]);

    const genres = [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
      'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
    ];

    React.useEffect(() => {
      const loadMovies = async () => {
        try {
          const [trending, popular] = await Promise.all([
            TraktAPI.getTrendingMovies(24),
            TraktAPI.makeRequest('/movies/popular?limit=24')
          ]);
          
          const processedTrending = await TraktAPI.processContentWithImages(trending, 'movie');
          const processedPopular = await TraktAPI.processContentWithImages(popular, 'movie');

          // Apply synced watched status
          const trendingWithStatus = processedTrending.map(movie => ({
            ...movie,
            isWatched: TraktAPI.getMovieWatchedStatus(movie.tmdb_id)
          }));

          const popularWithStatus = processedPopular.map(movie => ({
            ...movie,
            isWatched: TraktAPI.getMovieWatchedStatus(movie.tmdb_id)
          }));

          setTrendingMovies(trendingWithStatus);
          setPopularMovies(popularWithStatus);

          // Set initial watched status from sync
          const initialWatchedStatus = {};
          [...trendingWithStatus, ...popularWithStatus].forEach(movie => {
            if (movie.isWatched) {
              initialWatchedStatus[movie.id] = true;
            }
          });
          setWatchedStatus(initialWatchedStatus);

          // Load recommendations if authenticated
          if (TraktAPI.isAuthenticated()) {
            try {
              const recommendations = await TraktAPI.makeRequest('/recommendations/movies?limit=24');
              const processedRecs = await TraktAPI.processContentWithImages(recommendations, 'movie');
              setRecommendedMovies(processedRecs);
            } catch (error) {
              console.error('Failed to load recommendations:', error);
            }
          }
        } catch (error) {
          console.error('Failed to load movies:', error);
        } finally {
          setLoading(false);
        }
      };

      loadMovies();
    }, []);

    // Filter movies by selected genres
    React.useEffect(() => {
      const currentMovies = getCurrentMovies();
      if (selectedGenres.length === 0) {
        setFilteredMovies(currentMovies);
      } else {
        const filtered = currentMovies.filter(movie => 
          movie.genres && selectedGenres.some(genre => 
            movie.genres.includes(genre.toLowerCase())
          )
        );
        setFilteredMovies(filtered);
      }
    }, [selectedGenres, activeSection, trendingMovies, popularMovies, recommendedMovies]);

    const handleRating = async (movie, ratingType) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to rate movies');
        return;
      }

      try {
        const rating = ratingType === 'up' ? 10 : 1;
        await TraktAPI.rateContent('movies', {
          ids: { trakt: movie.trakt_id }
        }, rating);

        setRatings(prev => ({
          ...prev,
          [movie.id]: prev[movie.id] === ratingType ? null : ratingType
        }));
      } catch (error) {
        console.error('Failed to rate movie:', error);
      }
    };

    const addToWatchlist = async (movie) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to add to watchlist');
        return;
      }

      try {
        await TraktAPI.addToWatchlist('movies', {
          ids: { trakt: movie.trakt_id }
        });
        alert('Added to watchlist!');
      } catch (error) {
        console.error('Failed to add to watchlist:', error);
      }
    };

    const handleMarkAsWatched = async (movie) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to mark movie as watched');
        return;
      }

      try {
        const isCurrentlyWatched = watchedStatus[movie.id];
        
        if (isCurrentlyWatched) {
          await TraktAPI.removeFromWatched('movies', {
            ids: { trakt: movie.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [movie.id]: false
          }));
        } else {
          await TraktAPI.markAsWatched('movies', {
            ids: { trakt: movie.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [movie.id]: true
          }));
        }
      } catch (error) {
        console.error('Failed to update watched status:', error);
      }
    };

    const toggleGenre = (genre) => {
      setSelectedGenres(prev => 
        prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre]
      );
    };

    const clearGenres = () => {
      setSelectedGenres([]);
    };

    const getCurrentMovies = () => {
      switch (activeSection) {
        case 'trending': return trendingMovies;
        case 'popular': return popularMovies;
        case 'recommended': return recommendedMovies;
        default: return trendingMovies;
      }
    };

    const getDisplayMovies = () => {
      return selectedGenres.length > 0 ? filteredMovies : getCurrentMovies();
    };

    const getSectionTitle = () => {
      switch (activeSection) {
        case 'trending': return 'Trending Movies';
        case 'popular': return 'Popular Movies';
        case 'recommended': return 'Recommended For You';
        default: return 'Trending Movies';
      }
    };

    return (
      <main className="py-8 px-4" data-name="movies-content" data-file="components/MoviesContent.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                Movies
              </span>
            </h1>
            <p className="text-xl text-[var(--text-muted)]">Discover amazing films and blockbusters</p>
          </div>

          {/* Section Tabs */}
          <div className="flex justify-center mb-8">
            <div className="card-compact">
              <div className="flex space-x-1">
                {[
                  { key: 'trending', label: 'Trending', icon: 'trending-up' },
                  { key: 'popular', label: 'Popular', icon: 'star' },
                  ...(TraktAPI.isAuthenticated() ? [{ key: 'recommended', label: 'For You', icon: 'heart' }] : [])
                ].map(section => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeSection === section.key
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
                    }`}
                  >
                    <div className={`icon-${section.icon} text-sm`}></div>
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Genre Filter */}
          <div className="mb-8">
            <div className="card-compact">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-light)]">Filter by Genre</h3>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={clearGenres}
                    className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] text-sm font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedGenres.includes(genre)
                        ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-purple-500/20'
                        : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-[var(--primary-color)] hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">
              {getSectionTitle()}
              {selectedGenres.length > 0 && (
                <span className="text-[var(--text-muted)] text-lg ml-2">
                  • {selectedGenres.join(', ')}
                </span>
              )}
            </h2>
            <div className="text-[var(--text-muted)] text-sm">
              {getDisplayMovies().length} movies
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="card-compact animate-pulse">
                  <div className="w-full h-64 bg-[var(--accent-color)] rounded-lg mb-3"></div>
                  <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                  <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getDisplayMovies().map(movie => (
                <div key={movie.id} className="card-compact group cursor-pointer" onClick={() => window.location.href = `movie-details.html?id=${movie.tmdb_id || movie.id}`}>
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img 
                      src={movie.poster} 
                      alt={movie.title}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => addToWatchlist(movie)}
                        className="w-8 h-8 bg-[var(--primary-color)] text-white rounded-full flex items-center justify-center hover:bg-[var(--primary-hover)]"
                      >
                        <div className="icon-plus text-sm"></div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{movie.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{movie.year}</p>
                    {movie.runtime && (
                      <p className="text-[var(--primary-color)] text-xs font-medium">{movie.runtime} min</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleRating(movie, 'up')}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            ratings[movie.id] === 'up' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                              : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-green-500/10 hover:text-green-400'
                          }`}
                        >
                          <div className="icon-thumbs-up text-xs"></div>
                        </button>
                        <button
                          onClick={() => handleRating(movie, 'down')}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            ratings[movie.id] === 'down' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                              : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400'
                          }`}
                        >
                          <div className="icon-thumbs-down text-xs"></div>
                        </button>
                      </div>
                      <button
                        onClick={() => handleMarkAsWatched(movie)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                          watchedStatus[movie.id] 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                            : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-400'
                        }`}
                        title={watchedStatus[movie.id] ? 'Mark as unwatched' : 'Mark as watched'}
                      >
                        <div className={`icon-${watchedStatus[movie.id] ? 'eye-off' : 'eye'} text-xs`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('MoviesContent component error:', error);
    return null;
  }
}