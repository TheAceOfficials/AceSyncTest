function CastDetailsContent() {
  try {
    const [castDetails, setCastDetails] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('filmography');
    const [movies, setMovies] = React.useState([]);
    const [tvShows, setTvShows] = React.useState([]);
    const [sortBy, setSortBy] = React.useState('year');
    const [filterType, setFilterType] = React.useState('all');
    const [viewMode, setViewMode] = React.useState('grid');

    React.useEffect(() => {
      loadCastDetails();
    }, []);

    const calculateAge = (birthdate) => {
      if (!birthdate) return null;
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const loadCastDetails = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const castId = urlParams.get('id');

        if (!castId) {
          setLoading(false);
          return;
        }

        const details = await TMDB_API.getCastDetails(castId);
        if (details) {
          setCastDetails(details);
          setMovies(details.movieCredits || []);
          setTvShows(details.tvCredits || []);
        }
      } catch (error) {
        console.error('Error loading cast details:', error);
      }
      setLoading(false);
    };

    const getFilteredContent = () => {
      let content = [];
      
      if (filterType === 'all' || filterType === 'movies') {
        content = content.concat(movies.map(item => ({ ...item, type: 'movie' })));
      }
      
      if (filterType === 'all' || filterType === 'tv') {
        content = content.concat(tvShows.map(item => ({ ...item, type: 'tv' })));
      }

      // Sort content
      content.sort((a, b) => {
        if (sortBy === 'year') {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          return yearB - yearA;
        } else if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        } else {
          return (a.title || '').localeCompare(b.title || '');
        }
      });

      return content;
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

    if (!castDetails) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-user text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Cast Member Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The requested cast member could not be found</p>
              <button onClick={() => window.history.back()} className="btn-primary">
                Go Back
              </button>
            </div>
          </div>
        </main>
      );
    }

    const filteredContent = getFilteredContent();

    return (
      <main className="py-0" data-name="cast-details-content" data-file="components/CastDetailsContent.js">
        {/* Hero Section */}
        <div className="relative w-full py-16 bg-gradient-to-r from-[var(--background-dark)] via-[var(--secondary-color)] to-[var(--background-dark)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-3">
                <img 
                  src={castDetails.profileImage || 'https://via.placeholder.com/300x450/2d2a33/8b5cf6?text=No+Image'}
                  alt={castDetails.name}
                  className="w-full max-w-sm mx-auto object-cover rounded-2xl shadow-2xl"
                />
              </div>

              <div className="lg:col-span-9 space-y-6">
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-light)] leading-tight mb-4">
                    {castDetails.name}
                  </h1>
                  <p className="text-xl text-[var(--text-muted)] mb-4">{castDetails.knownFor}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-[var(--text-muted)]">
                  {castDetails.birthday && (
                    <div className="flex items-center">
                      <div className="icon-calendar mr-2 text-[var(--primary-color)]"></div>
                      <span>
                        Born {new Date(castDetails.birthday).toLocaleDateString()}
                        {calculateAge(castDetails.birthday) && ` (${calculateAge(castDetails.birthday)} years old)`}
                      </span>
                    </div>
                  )}
                  {castDetails.birthPlace && (
                    <div className="flex items-center">
                      <div className="icon-map-pin mr-2 text-[var(--primary-color)]"></div>
                      <span>{castDetails.birthPlace}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="icon-film mr-2 text-[var(--primary-color)]"></div>
                    <span>{(movies.length || 0) + (tvShows.length || 0)} Credits</span>
                  </div>
                </div>

                {/* Social Media Links */}
                {(castDetails.socialMedia || castDetails.externalIds) && (
                  <div className="flex flex-wrap items-center gap-4">
                    {castDetails.externalIds?.instagram_id && (
                      <a
                        href={`https://instagram.com/${castDetails.externalIds.instagram_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-sm font-medium"
                      >
                        <div className="icon-instagram mr-2"></div>
                        Instagram
                      </a>
                    )}
                    {castDetails.externalIds?.twitter_id && (
                      <a
                        href={`https://twitter.com/${castDetails.externalIds.twitter_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 text-sm font-medium"
                      >
                        <div className="icon-twitter mr-2"></div>
                        Twitter
                      </a>
                    )}
                    {castDetails.externalIds?.facebook_id && (
                      <a
                        href={`https://facebook.com/${castDetails.externalIds.facebook_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 text-sm font-medium"
                      >
                        <div className="icon-facebook mr-2"></div>
                        Facebook
                      </a>
                    )}
                    {castDetails.homepage && (
                      <a
                        href={castDetails.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-[var(--accent-color)] border border-[var(--border-color)] text-[var(--text-light)] rounded-xl hover:bg-[var(--card-bg)] transition-all duration-300 text-sm font-medium"
                      >
                        <div className="icon-globe mr-2"></div>
                        Website
                      </a>
                    )}
                  </div>
                )}

                {castDetails.biography && (
                  <p className="text-[var(--text-muted)] leading-relaxed max-w-4xl">
                    {castDetails.biography.length > 300 
                      ? `${castDetails.biography.substring(0, 300)}...` 
                      : castDetails.biography
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Filters */}
          <div className="card mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: filteredContent.length },
                  { key: 'movies', label: 'Movies', count: movies.length },
                  { key: 'tv', label: 'TV Shows', count: tvShows.length }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      filterType === filter.key
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filterType === filter.key 
                        ? 'bg-white/20' 
                        : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex bg-[var(--accent-color)] rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
                    }`}
                  >
                    <div className="icon-grid-3x3 text-sm"></div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
                    }`}
                  >
                    <div className="icon-list text-sm"></div>
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-[var(--accent-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-light)] focus:border-[var(--primary-color)] focus:outline-none"
                >
                  <option value="year">Sort by Year</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filmography */}
          <div className="card">
            <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
              <div className="icon-film text-[var(--primary-color)] mr-3"></div>
              Filmography
            </h2>

            {filteredContent.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredContent.map(item => (
                    <div 
                      key={`${item.type}_${item.id}`} 
                      className="group cursor-pointer"
                      onClick={() => {
                        if (item.type === 'movie') {
                          window.location.href = `movie-details.html?id=${item.id}`;
                        } else {
                          window.location.href = `show-details.html?id=${item.id}`;
                        }
                      }}
                    >
                      <div className="relative overflow-hidden rounded-xl mb-3 aspect-[2/3] bg-[var(--accent-color)]">
                        <img 
                          src={item.poster || 'https://via.placeholder.com/300x450/2d2a33/8b5cf6?text=No+Image'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-semibold backdrop-blur-sm">
                          {item.type === 'movie' ? 'Movie' : 'TV Show'}
                        </div>
                        
                        {/* Rating Badge */}
                        {item.rating > 0 && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                            <div className="icon-star text-yellow-400 mr-1 text-xs"></div>
                            {item.rating.toFixed(1)}
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Character Info */}
                        {item.character && (
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <p className="text-white text-xs font-medium">as {item.character}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-semibold text-[var(--text-light)] text-xs group-hover:text-[var(--primary-color)] transition-colors truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span className="text-xs">{item.year || 'TBA'}</span>
                          {item.character && (
                            <span className="text-[var(--primary-color)] font-medium text-xs truncate ml-2">as {item.character}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContent.map(item => (
                    <div 
                      key={`${item.type}_${item.id}`} 
                      className="flex items-start space-x-4 p-4 bg-[var(--accent-color)] rounded-xl hover:bg-[var(--card-bg)] transition-colors duration-300 cursor-pointer group"
                      onClick={() => {
                        if (item.type === 'movie') {
                          window.location.href = `movie-details.html?id=${item.id}`;
                        } else {
                          window.location.href = `show-details.html?id=${item.id}`;
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <img 
                          src={item.poster || 'https://via.placeholder.com/100x150/2d2a33/8b5cf6?text=No+Image'}
                          alt={item.title}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[var(--text-light)] mb-1 group-hover:text-[var(--primary-color)] transition-colors">
                              {item.title}
                            </h4>
                            {item.character && (
                              <p className="text-[var(--primary-color)] text-sm font-medium mb-2">
                                as {item.character}
                              </p>
                            )}
                            {item.overview && (
                              <p className="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-2">
                                {item.overview}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 ml-4 text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                item.type === 'movie' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {item.type === 'movie' ? 'Movie' : 'TV Show'}
                              </span>
                              {item.rating > 0 && (
                                <div className="flex items-center text-yellow-400 text-sm">
                                  <div className="icon-star mr-1 text-xs"></div>
                                  {item.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <p className="text-[var(--text-muted)] text-sm">
                              {item.year || 'TBA'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                  <div className="icon-film text-3xl text-[var(--text-muted)]"></div>
                </div>
                <p className="text-[var(--text-muted)] text-lg">No filmography available</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );

  } catch (error) {
    console.error('CastDetailsContent component error:', error);
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