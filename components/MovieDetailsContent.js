function MovieDetailsContent() {
  try {
    const [movieDetails, setMovieDetails] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [isWatched, setIsWatched] = React.useState(false);
    const [isWatchlisted, setIsWatchlisted] = React.useState(false);
    const [userRating, setUserRating] = React.useState(0);
    const [showTrailer, setShowTrailer] = React.useState(false);
    const [watchCount, setWatchCount] = React.useState(0);
    const [similarMovies, setSimilarMovies] = React.useState([]);
    const [showMoreOverview, setShowMoreOverview] = React.useState(false);
    const [availableProviders, setAvailableProviders] = React.useState([]);
    const [traktMovieId, setTraktMovieId] = React.useState(null);
    const [syncedWatchData, setSyncedWatchData] = React.useState(null);

    React.useEffect(() => {
      loadMovieDetails();
    }, []);

    React.useEffect(() => {
      if (TraktAPI.isAuthenticated() && traktMovieId) {
        syncWatchedData();
      }
    }, [traktMovieId]);

    const syncWatchedData = async () => {
      try {
        if (!traktMovieId || !TraktAPI.isAuthenticated()) return;

        // Sync all watched content from Trakt
        const syncData = await TraktAPI.syncWatchedContent();
        setSyncedWatchData(syncData);

        // Check if movie is watched
        const movieWatched = TraktAPI.getMovieWatchedStatus(traktMovieId);
        setIsWatched(movieWatched);

        // Check if movie is in watchlist
        const watchlistStatus = TraktAPI.getWatchlistStatus('movie', traktMovieId);
        setIsWatchlisted(watchlistStatus);

        // Get watch count from Trakt if available
        const traktWatchCount = TraktAPI.getMovieWatchCount(traktMovieId);
        if (traktWatchCount > 0) {
          setWatchCount(traktWatchCount);
        }

      } catch (error) {
        console.error('Error syncing watched data:', error);
      }
    };

    const loadMovieDetails = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
          setLoading(false);
          return;
        }

        const details = await TMDB_API.getMovieDetails(movieId);
        if (details) {
          setMovieDetails(details);
          setTraktMovieId(movieId); // Set Trakt movie ID for syncing
          loadSimilarMovies(movieId);
          
          const providers = TMDB_API.getAllProviders(details.watchProviders);
          setAvailableProviders(providers);
        }
        
        const savedComments = localStorage.getItem(`movie_comments_${movieId}`);
        if (savedComments) {
          setComments(JSON.parse(savedComments));
        }

        // Load local data as fallback if not authenticated with Trakt
        const savedWatchCount = localStorage.getItem(`movie_watch_count_${movieId}`);
        if (savedWatchCount && !TraktAPI.isAuthenticated()) {
          setWatchCount(parseInt(savedWatchCount));
          setIsWatched(parseInt(savedWatchCount) > 0);
        }

        // Load local watchlist status as fallback
        const savedWatchlist = localStorage.getItem(`movie_watchlist_${movieId}`);
        if (savedWatchlist && !TraktAPI.isAuthenticated()) {
          setIsWatchlisted(JSON.parse(savedWatchlist));
        }
      } catch (error) {
        console.error('Error loading movie details:', error);
      }
      setLoading(false);
    };

    const loadSimilarMovies = async (movieId) => {
      try {
        const similar = await TMDB_API.getSimilarMovies(movieId);
        setSimilarMovies(similar.slice(0, 12));
      } catch (error) {
        console.error('Error loading similar movies:', error);
      }
    };

    const handleWatchedToggle = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const movieId = urlParams.get('id');
      
      try {
        if (TraktAPI.isAuthenticated() && movieDetails) {
          // Use Trakt API for authenticated users
          const movieItem = {
            ids: {
              trakt: parseInt(movieId),
              tmdb: movieDetails.id
            }
          };

          if (isWatched) {
            await TraktAPI.removeFromWatched('movies', movieItem);
            setIsWatched(false);
            setWatchCount(0);
            NotificationToast.show('Removed from watched movies', 'success');
          } else {
            await TraktAPI.markAsWatched('movies', movieItem);
            setIsWatched(true);
            const newCount = watchCount + 1;
            setWatchCount(newCount);
            NotificationToast.show('Marked as watched!', 'success');
          }

          // Refresh watched data from Trakt
          await syncWatchedData();
        } else {
          // Fallback to local storage for non-authenticated users
          if (isWatched) {
            setWatchCount(0);
            setIsWatched(false);
            localStorage.removeItem(`movie_watch_count_${movieId}`);
            NotificationToast.show('Removed from watched', 'info');
          } else {
            const newCount = watchCount + 1;
            setWatchCount(newCount);
            setIsWatched(true);
            localStorage.setItem(`movie_watch_count_${movieId}`, newCount.toString());
            NotificationToast.show('Marked as watched!', 'success');
          }
        }
      } catch (error) {
        console.error('Error toggling watched status:', error);
        NotificationToast.show('Error updating watched status', 'error');
      }
    };

    const shareMovie = () => {
      if (navigator.share) {
        navigator.share({
          title: movieDetails.title,
          text: `Check out ${movieDetails.title}`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    if (loading) {
      return (
        <main className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="card animate-pulse">
              <div className="h-96 bg-[var(--accent-color)] rounded-xl"></div>
            </div>
          </div>
        </main>
      );
    }

    if (!movieDetails) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-film text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Movie Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The requested movie could not be found</p>
              <button onClick={() => window.location.href = '/movies.html'} className="btn-primary">
                Browse Movies
              </button>
            </div>
          </div>
        </main>
      );
    }

    const streamingPlatforms = TMDB_API.getStreamingPlatforms(movieDetails.watchProviders);
    const { directors, writers } = TMDB_API.getKeyCrewMembers(movieDetails.crew);

    return (
      <main className="py-0" data-name="movie-details-content" data-file="components/MovieDetailsContent.js">
        {/* Premium OTT-Style Hero Section */}
        <div className="relative w-full min-h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${movieDetails.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
              <div className="grid lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-3">
                  <img 
                    src={movieDetails.poster} 
                    alt={movieDetails.title}
                    className="w-full max-w-sm mx-auto lg:max-w-none object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="lg:col-span-9 space-y-8">
                  <div>
                    {movieDetails.logo ? (
                      <img 
                        src={movieDetails.logo}
                        alt={movieDetails.title}
                        className="h-16 md:h-24 lg:h-32 max-w-full object-contain filter drop-shadow-2xl mb-6"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <h1 
                      className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 ${movieDetails.logo ? 'hidden' : 'block'}`}
                      style={{ textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 3px 6px rgba(139, 92, 246, 0.4)' }}
                    >
                      {movieDetails.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-lg">
                    <span className="font-semibold">{new Date(movieDetails.releaseDate).getFullYear()}</span>
                    {movieDetails.runtime && (
                      <>
                        <span>•</span>
                        <span>{TraktAPI.formatRuntime(parseInt(movieDetails.runtime.replace(/\D/g, '')))}</span>
                      </>
                    )}
                    <span>•</span>
                    <div className="flex items-center">
                      <div className="icon-star text-yellow-400 mr-2"></div>
                      <span className="font-semibold">{movieDetails.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {movieDetails.genres.map(genre => (
                      <span key={genre.id} className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 backdrop-blur-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {availableProviders.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/70 text-sm font-medium">Available on:</span>
                      <div className="flex space-x-3">
                        {availableProviders.slice(0, 6).map(provider => (
                          <button
                            key={provider.provider_id}
                            onClick={() => provider.link && window.open(provider.link, '_blank')}
                            className="group relative w-10 h-10 rounded-lg overflow-hidden hover:scale-110 transition-transform duration-300"
                            title={`${provider.type} on ${provider.provider_name}`}
                          >
                            <img 
                              src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300"></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-white/90 text-lg leading-relaxed max-w-4xl">
                    {showMoreOverview || movieDetails.overview.length <= 200 
                      ? movieDetails.overview 
                      : `${movieDetails.overview.substring(0, 200)}...`
                    }
                    {movieDetails.overview.length > 200 && (
                      <button 
                        onClick={() => setShowMoreOverview(!showMoreOverview)}
                        className="ml-2 text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                      >
                        {showMoreOverview ? 'Less' : 'More'}
                      </button>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={async () => {
                        try {
                          const urlParams = new URLSearchParams(window.location.search);
                          const movieId = urlParams.get('id');

                          if (TraktAPI.isAuthenticated() && movieDetails) {
                            // Use Trakt API for authenticated users
                            const movieItem = {
                              ids: {
                                trakt: parseInt(movieId),
                                tmdb: movieDetails.id
                              }
                            };

                            if (isWatchlisted) {
                              await TraktAPI.removeFromWatchlist('movies', movieItem);
                              setIsWatchlisted(false);
                              NotificationToast.show('Removed from watchlist', 'success');
                            } else {
                              await TraktAPI.addToWatchlist('movies', movieItem);
                              setIsWatchlisted(true);
                              NotificationToast.show('Added to watchlist!', 'success');
                            }

                            // Refresh watchlist data from Trakt
                            await syncWatchedData();
                          } else {
                            // Fallback to local storage
                            const newStatus = !isWatchlisted;
                            setIsWatchlisted(newStatus);
                            localStorage.setItem(`movie_watchlist_${movieId}`, JSON.stringify(newStatus));
                            NotificationToast.show(
                              newStatus ? 'Added to watchlist!' : 'Removed from watchlist', 
                              'info'
                            );
                          }
                        } catch (error) {
                          console.error('Error toggling watchlist status:', error);
                          NotificationToast.show('Error updating watchlist', 'error');
                        }
                      }}
                      className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                        isWatchlisted 
                          ? 'bg-white/20 text-white border border-white/40 hover:bg-white/30' 
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      <div className={`icon-${isWatchlisted ? 'check' : 'plus'} mr-3 text-xl`}></div>
                      Watchlist
                    </button>
                    
                    <button 
                      onClick={handleWatchedToggle}
                      className={`flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                        isWatched
                          ? 'bg-blue-600/80 text-white border border-blue-400 hover:bg-blue-600'
                          : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      <div className={`icon-${isWatched ? 'rotate-ccw' : 'eye'} mr-2`}></div>
                      {isWatched ? 'Watched' : 'Mark Watched'}
                    </button>

                    {movieDetails.videos && movieDetails.videos.length > 0 && (
                      <button 
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center px-6 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="icon-play mr-2"></div>
                        Trailer
                      </button>
                    )}

                    <button 
                      onClick={shareMovie}
                      className="flex items-center justify-center w-12 h-12 bg-white/10 text-white border border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300"
                      title="Share"
                    >
                      <div className="icon-share"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="card mb-8">
            <div className="flex flex-wrap gap-2 p-2">
              {[
                { key: 'overview', label: 'Details & Info', icon: 'info', count: null },
                { key: 'streaming', label: 'Watch Options', icon: 'play', count: streamingPlatforms.length },
                { key: 'cast', label: 'Cast & Crew', icon: 'users', count: movieDetails.cast.length },
                { key: 'similar', label: 'More Like This', icon: 'grid-3x3', count: null },
                { key: 'discussion', label: 'Reviews', icon: 'message-circle', count: comments.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-lg transform scale-105'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)] hover:scale-105'
                  }`}
                >
                  <div className={`icon-${tab.icon} text-lg`}></div>
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.key 
                        ? 'bg-white/20' 
                        : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-info text-[var(--primary-color)] mr-3"></div>
                Movie Details
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-light)] mb-4">Synopsis</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{movieDetails.overview}</p>
                  
                  {(movieDetails.budget > 0 || movieDetails.revenue > 0) && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-[var(--text-light)] mb-4">Box Office</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[var(--accent-color)] rounded-lg">
                          <span className="text-[var(--text-muted)] flex items-center">
                            <div className="icon-dollar-sign mr-2 text-blue-400"></div>
                            Budget
                          </span>
                          <span className="font-medium text-[var(--text-light)]">{TMDB_API.formatCurrency(movieDetails.budget)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--accent-color)] rounded-lg">
                          <span className="text-[var(--text-muted)] flex items-center">
                            <div className="icon-trending-up mr-2 text-green-400"></div>
                            Revenue
                          </span>
                          <span className="font-medium text-[var(--text-light)]">{TMDB_API.formatCurrency(movieDetails.revenue)}</span>
                        </div>
                        {movieDetails.budget > 0 && movieDetails.revenue > 0 && (
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[var(--primary-color)]/10 to-[var(--gradient-to)]/10 rounded-lg border border-[var(--primary-color)]/20">
                            <span className="text-[var(--text-muted)] flex items-center">
                              <div className="icon-target mr-2 text-[var(--primary-color)]"></div>
                              Performance
                            </span>
                            <span className={`font-medium ${TMDB_API.getBoxOfficePerformance(movieDetails.budget, movieDetails.revenue).color}`}>
                              {TMDB_API.getBoxOfficePerformance(movieDetails.budget, movieDetails.revenue).text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Release Date:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{new Date(movieDetails.releaseDate).toLocaleDateString()}</span>
                  </div>
                  {movieDetails.runtime && (
                    <div>
                      <span className="font-medium text-[var(--text-light)]">Runtime:</span>
                      <span className="ml-2 text-[var(--text-muted)]">{TraktAPI.formatRuntime(parseInt(movieDetails.runtime.replace(/\D/g, '')))}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Rating:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{movieDetails.rating.toFixed(1)}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {movieDetails.genres.map(genre => (
                        <span key={genre.id} className="px-3 py-1 bg-[var(--accent-color)] text-[var(--text-light)] rounded-lg text-sm">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {movieDetails.countries && movieDetails.countries.length > 0 && (
                    <div>
                      <span className="font-medium text-[var(--text-light)]">Countries:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {movieDetails.countries.slice(0, 3).map(country => (
                          <span key={country.iso_3166_1} className="px-2 py-1 bg-[var(--border-color)] text-[var(--text-muted)] rounded text-xs">
                            {country.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {movieDetails.companies && movieDetails.companies.length > 0 && (
                    <div>
                      <span className="font-medium text-[var(--text-light)]">Production:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {movieDetails.companies.slice(0, 2).map(company => (
                          <span key={company.id} className="px-2 py-1 bg-[var(--border-color)] text-[var(--text-muted)] rounded text-xs">
                            {company.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'streaming' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-play text-[var(--primary-color)] mr-3"></div>
                Watch Options
              </h2>
              {streamingPlatforms.length > 0 ? (
                <div className="space-y-8">
                  {streamingPlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[var(--text-light)] mb-4 flex items-center">
                        <div className={`icon-${platform.icon} mr-2 text-[var(--primary-color)]`}></div>
                        {platform.label || platform.type}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {platform.providers.map(provider => (
                          <div key={provider.provider_id} className="group relative overflow-hidden rounded-2xl bg-[var(--accent-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-all duration-300 hover:scale-105">
                            <div className="aspect-square bg-white/5 flex items-center justify-center p-6">
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                alt={provider.provider_name}
                                className="w-16 h-16 rounded-xl object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <p className="text-[var(--text-light)] text-sm font-medium mb-2 truncate">{provider.provider_name}</p>
                              <button 
                                onClick={() => {
                                  const link = TMDB_API.getProviderLink(provider.provider_name);
                                  if (link) window.open(link, '_blank');
                                }}
                                className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white py-2 px-4 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                              >
                                {platform.label === 'Stream' ? 'Watch Now' : platform.label || 'Watch Now'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                    <div className="icon-tv text-3xl text-[var(--text-muted)]"></div>
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">No streaming information available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-users text-[var(--primary-color)] mr-3"></div>
                Cast & Crew
              </h2>
              
              <div className="space-y-10">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-light)] mb-6">Main Cast</h3>
                  <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                    {movieDetails.cast.slice(0, 12).map(actor => (
                      <div 
                        key={actor.id} 
                        className="flex-shrink-0 group cursor-pointer w-32"
                        onClick={() => window.location.href = `cast-details.html?id=${actor.id}`}
                      >
                        <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[3/4] bg-[var(--accent-color)]">
                          <img 
                            src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/185x278/2d2a33/8b5cf6?text=No+Image'}
                            alt={actor.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                            <div className="text-white text-xs">
                              <div className="font-semibold truncate">{actor.name}</div>
                              <div className="text-white/80 truncate">{actor.character}</div>
                            </div>
                          </div>
                        </div>
                        <h4 className="font-medium text-[var(--text-light)] text-sm mb-1 truncate group-hover:text-[var(--primary-color)] transition-colors">{actor.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-light)] mb-6">Crew</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {directors.map(director => (
                      <div key={director.id} className="card-compact">
                        <h4 className="font-medium text-[var(--text-light)] text-sm">{director.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs">Director</p>
                      </div>
                    ))}
                    {writers.map(writer => (
                      <div key={writer.id} className="card-compact">
                        <h4 className="font-medium text-[var(--text-light)] text-sm">{writer.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs">Writer</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-grid-3x3 text-[var(--primary-color)] mr-3"></div>
                More Like This
              </h2>
              {similarMovies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {similarMovies.map(movie => (
                    <div key={movie.id} className="group cursor-pointer" onClick={() => window.location.href = `movie-details.html?id=${movie.id}`}>
                      <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[2/3] bg-[var(--accent-color)]">
                        <img 
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                          <div className="icon-star text-yellow-400 mr-1 text-xs"></div>
                          {movie.rating.toFixed(1)}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button 
                            className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white text-xs py-2 px-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `movie-details.html?id=${movie.id}`;
                            }}
                          >
                            More Info
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{movie.title}</h4>
                      <p className="text-[var(--text-muted)] text-xs">{movie.year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                    <div className="icon-film text-3xl text-[var(--text-muted)]"></div>
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">No similar movies found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-message-circle text-[var(--primary-color)] mr-3"></div>
                Reviews & Discussion
              </h2>
              
              {/* AceSync Meter at top of Reviews */}
              <div className="mb-8 flex justify-center">
                <AceMeter
                  type="movie"
                  itemId={movieDetails.id || new URLSearchParams(window.location.search).get('id')}
                  traktScore={movieDetails.rating}
                  tmdbScore={movieDetails.vote_average}
                  onVote={async (rating, score) => {
                    try {
                      const movieId = new URLSearchParams(window.location.search).get('id');
                      await TraktAPI.rateMovie(movieId, Math.round(score * 10));
                      NotificationToast.show(`Rated as ${rating}!`, 'success');
                    } catch (error) {
                      NotificationToast.show('Rating saved locally', 'info');
                    }
                  }}
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="card-compact">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          {comment.author[0]}
                        </div>
                        <span className="font-medium text-[var(--text-light)]">{comment.author}</span>
                        <span className="text-[var(--text-muted)] text-sm ml-auto">{comment.date}</span>
                      </div>
                      <p className="text-[var(--text-muted)]">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-[var(--border-color)] pt-6">
                  <h3 className="font-semibold text-[var(--text-light)] mb-4">Add Your Review</h3>
                  <div className="space-y-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this movie..."
                      className="w-full p-4 bg-[var(--accent-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-light)] placeholder-[var(--text-muted)] resize-none h-24 focus:border-[var(--primary-color)] focus:outline-none transition-colors"
                    />
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        if (newComment.trim()) {
                          const urlParams = new URLSearchParams(window.location.search);
                          const movieId = urlParams.get('id');
                          const newCommentObj = {
                            author: 'Anonymous User',
                            content: newComment,
                            date: new Date().toLocaleDateString()
                          };
                          const updatedComments = [...comments, newCommentObj];
                          setComments(updatedComments);
                          localStorage.setItem(`movie_comments_${movieId}`, JSON.stringify(updatedComments));
                          setNewComment('');
                        }
                      }}
                    >
                      Post Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trailer Modal */}
        {showTrailer && movieDetails.videos && movieDetails.videos.length > 0 && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--text-light)]">Trailer</h3>
                <button 
                  onClick={() => setShowTrailer(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-light)] transition-colors"
                >
                  <div className="icon-x text-2xl"></div>
                </button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${movieDetails.videos[0].key}${(() => {
                    const settings = JSON.parse(localStorage.getItem('acesync_settings') || '{}');
                    return settings.trailerAutoplay !== false ? '?autoplay=1' : '';
                  })()}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </main>
    );

  } catch (error) {
    console.error('MovieDetailsContent component error:', error);
    return (
      <div className="py-16 px-4 text-center">
        <div className="card max-w-md mx-auto">
          <div className="icon-alert-circle text-4xl text-red-500 mb-4"></div>
          <h2 className="text-xl font-bold text-[var(--text-light)] mb-2">Something went wrong</h2>
          <p className="text-[var(--text-muted)]">Please try refreshing the page</p>
        </div>
      </div>
    );
  }
}
