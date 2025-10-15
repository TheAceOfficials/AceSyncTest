function ShowsContent() {
  try {
    const [trendingShows, setTrendingShows] = React.useState([]);
    const [popularShows, setPopularShows] = React.useState([]);
    const [recommendedShows, setRecommendedShows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [ratings, setRatings] = React.useState({});
    const [watchedStatus, setWatchedStatus] = React.useState({});
    const [activeSection, setActiveSection] = React.useState('trending');
    const [selectedGenres, setSelectedGenres] = React.useState([]);
    const [filteredShows, setFilteredShows] = React.useState([]);

    const genres = [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
      'Science Fiction', 'Thriller', 'War', 'Western', 'Reality'
    ];

    React.useEffect(() => {
      const loadShows = async () => {
        try {
          const [trending, popular] = await Promise.all([
            TraktAPI.getTrendingShows(24),
            TraktAPI.makeRequest('/shows/popular?limit=24')
          ]);
          
          const processedTrending = await TraktAPI.processContentWithImages(trending, 'tv');
          const processedPopular = await TraktAPI.processContentWithImages(popular, 'tv');

          // Apply synced watched status
          const trendingWithStatus = processedTrending.map(show => ({
            ...show,
            isWatched: TraktAPI.getShowWatchedStatus(show.tmdb_id)
          }));

          const popularWithStatus = processedPopular.map(show => ({
            ...show,
            isWatched: TraktAPI.getShowWatchedStatus(show.tmdb_id)
          }));

          setTrendingShows(trendingWithStatus);
          setPopularShows(popularWithStatus);

          // Set initial watched status from sync
          const initialWatchedStatus = {};
          [...trendingWithStatus, ...popularWithStatus].forEach(show => {
            if (show.isWatched) {
              initialWatchedStatus[show.id] = true;
            }
          });
          setWatchedStatus(initialWatchedStatus);

          // Load recommendations if authenticated
          if (TraktAPI.isAuthenticated()) {
            try {
              const recommendations = await TraktAPI.makeRequest('/recommendations/shows?limit=24');
              const processedRecs = await TraktAPI.processContentWithImages(recommendations, 'tv');
              setRecommendedShows(processedRecs);
            } catch (error) {
              console.error('Failed to load recommendations:', error);
            }
          }
        } catch (error) {
          console.error('Failed to load shows:', error);
        } finally {
          setLoading(false);
        }
      };

      loadShows();
    }, []);

    // Filter shows by selected genres
    React.useEffect(() => {
      const currentShows = getCurrentShows();
      if (selectedGenres.length === 0) {
        setFilteredShows(currentShows);
      } else {
        const filtered = currentShows.filter(show => 
          show.genres && selectedGenres.some(genre => 
            show.genres.includes(genre.toLowerCase())
          )
        );
        setFilteredShows(filtered);
      }
    }, [selectedGenres, activeSection, trendingShows, popularShows, recommendedShows]);

    const handleRating = async (show, ratingType) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to rate shows');
        return;
      }

      try {
        const rating = ratingType === 'up' ? 10 : 1;
        await TraktAPI.rateContent('shows', {
          ids: { trakt: show.trakt_id }
        }, rating);

        setRatings(prev => ({
          ...prev,
          [show.id]: prev[show.id] === ratingType ? null : ratingType
        }));
      } catch (error) {
        console.error('Failed to rate show:', error);
      }
    };

    const addToWatchlist = async (show) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to add to watchlist');
        return;
      }

      try {
        await TraktAPI.addToWatchlist('shows', {
          ids: { trakt: show.trakt_id }
        });
        alert('Added to watchlist!');
      } catch (error) {
        console.error('Failed to add to watchlist:', error);
      }
    };

    const handleMarkAsWatched = async (show) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to mark show as watched');
        return;
      }

      try {
        const isCurrentlyWatched = watchedStatus[show.id];
        
        if (isCurrentlyWatched) {
          await TraktAPI.removeFromWatched('shows', {
            ids: { trakt: show.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [show.id]: false
          }));
        } else {
          await TraktAPI.markAsWatched('shows', {
            ids: { trakt: show.trakt_id }
          });
          setWatchedStatus(prev => ({
            ...prev,
            [show.id]: true
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

    const getCurrentShows = () => {
      switch (activeSection) {
        case 'trending': return trendingShows;
        case 'popular': return popularShows;
        case 'recommended': return recommendedShows;
        default: return trendingShows;
      }
    };

    const getDisplayShows = () => {
      return selectedGenres.length > 0 ? filteredShows : getCurrentShows();
    };

    const getSectionTitle = () => {
      switch (activeSection) {
        case 'trending': return 'Trending Shows';
        case 'popular': return 'Popular Shows';
        case 'recommended': return 'Recommended For You';
        default: return 'Trending Shows';
      }
    };

    return (
      <main className="py-8 px-4" data-name="shows-content" data-file="components/ShowsContent.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                TV Shows
              </span>
            </h1>
            <p className="text-xl text-[var(--text-muted)]">Discover amazing series and binge-worthy content</p>
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
              {getDisplayShows().length} shows
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
              {getDisplayShows().map(show => (
                <div key={show.id} className="card-compact group cursor-pointer" onClick={() => window.location.href = `show-details.html?id=${show.tmdb_id || show.id}`}>
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img 
                      src={show.poster} 
                      alt={show.title}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => addToWatchlist(show)}
                        className="w-8 h-8 bg-[var(--primary-color)] text-white rounded-full flex items-center justify-center hover:bg-[var(--primary-hover)]"
                      >
                        <div className="icon-plus text-sm"></div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{show.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{show.year}</p>
                    {(show.seasons > 0 || show.episodes > 0) && (
                      <p className="text-[var(--primary-color)] text-xs font-medium">
                        {show.seasons === 1 ? `${show.episodes} episodes` : `${show.seasons} seasons`}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleRating(show, 'up')}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            ratings[show.id] === 'up' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                              : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-green-500/10 hover:text-green-400'
                          }`}
                        >
                          <div className="icon-thumbs-up text-xs"></div>
                        </button>
                        <button
                          onClick={() => handleRating(show, 'down')}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            ratings[show.id] === 'down' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                              : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400'
                          }`}
                        >
                          <div className="icon-thumbs-down text-xs"></div>
                        </button>
                      </div>
                      <button
                        onClick={() => handleMarkAsWatched(show)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                          watchedStatus[show.id] 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                            : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-400'
                        }`}
                        title={watchedStatus[show.id] ? 'Mark as unwatched' : 'Mark as watched'}
                      >
                        <div className={`icon-${watchedStatus[show.id] ? 'eye-off' : 'eye'} text-xs`}></div>
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
    console.error('ShowsContent component error:', error);
    return null;
  }
}
