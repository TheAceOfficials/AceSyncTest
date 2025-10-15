function SmartSearch({ isOpen, onClose }) {
  try {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState({ movies: [], shows: [], people: [] });
    const [isSearching, setIsSearching] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('all');
    const [filters, setFilters] = React.useState({
      year: '',
      genre: '',
      rating: '',
      country: ''
    });
    const [sortBy, setSortBy] = React.useState('relevance');
    const [isListening, setIsListening] = React.useState(false);
    const [followingStatus, setFollowingStatus] = React.useState({});

    const performAdvancedSearch = async (query, searchFilters = filters, tab = activeTab) => {
      if (!query.trim()) return;
      
      setIsSearching(true);
      try {
        let searchPromises = [];
        
        if (tab === 'all' || tab === 'movies') {
          searchPromises.push(TraktAPI.searchMovies(query));
        }
        if (tab === 'all' || tab === 'shows') {
          searchPromises.push(TraktAPI.searchShows(query));
        }
        if (tab === 'all' || tab === 'people') {
          searchPromises.push(TraktAPI.searchUsers(query));
        }
        
        const results = await Promise.all(searchPromises);
        
        let movies = [];
        let shows = [];
        let people = [];
        
        if (tab === 'all') {
          movies = results[0] || [];
          shows = results[1] || [];
          people = results[2] || [];
        } else if (tab === 'movies') {
          movies = results[0] || [];
        } else if (tab === 'shows') {
          shows = results[0] || [];
        } else if (tab === 'people') {
          people = results[0] || [];
        }

        // Process and filter results
        const processedMovies = await TraktAPI.processContentWithImages(
          filterResults(movies, searchFilters, 'movie').slice(0, 20), 'movie'
        );
        const processedShows = await TraktAPI.processContentWithImages(
          filterResults(shows, searchFilters, 'show').slice(0, 20), 'tv'
        );

        // Process people results (Trakt users)
        const processedPeople = people.slice(0, 20).map(item => {
          const user = item.user || item;
          const username = user.username || user.ids?.slug || 'unknown';
          const joinedDate = user.joined_at ? new Date(user.joined_at).getFullYear() : 'Recently';
          
        return {
          id: user.ids?.slug || username || Math.random(),
          name: user.name || username,
          username: username,
          biography: user.about || `Trakt user since ${joinedDate}`,
          location: user.location || '',
          joinedAt: user.joined_at,
          avatar: user.avatar || `https://secure.gravatar.com/avatar/${username}?s=200&d=identicon&f=y`,
          type: 'Person',
          isPrivate: user.private || false,
          isVip: user.vip || false
        };
        });

        setSearchResults({
          movies: sortResults(processedMovies, sortBy),
          shows: sortResults(processedShows, sortBy),
          people: processedPeople
        });
      } catch (error) {
        console.error('Advanced search failed:', error);
        setSearchResults({ movies: [], shows: [], people: [] });
      } finally {
        setIsSearching(false);
      }
    };

    const startVoiceSearch = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice search is not supported in your browser');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        performAdvancedSearch(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    };

    const handleFollowUser = async (user) => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to follow users');
        return;
      }

      try {
        const isCurrentlyFollowing = followingStatus[user.id];
        
        if (isCurrentlyFollowing) {
          await TraktAPI.unfollowUser(user.username);
          setFollowingStatus(prev => ({
            ...prev,
            [user.id]: false
          }));
        } else {
          await TraktAPI.followUser(user.username);
          setFollowingStatus(prev => ({
            ...prev,
            [user.id]: true
          }));
        }
      } catch (error) {
        console.error('Failed to update follow status:', error);
        alert('Failed to update follow status');
      }
    };

    const filterResults = (results, searchFilters, type) => {
      return results.filter(item => {
        const content = item[type] || item;
        
        // Year filter
        if (searchFilters.year && content.year) {
          const itemYear = parseInt(content.year);
          const filterYear = parseInt(searchFilters.year);
          if (Math.abs(itemYear - filterYear) > 2) return false;
        }
        
        // Rating filter
        if (searchFilters.rating && content.rating) {
          const minRating = parseFloat(searchFilters.rating);
          if (content.rating < minRating) return false;
        }
        
        return true;
      });
    };

    const sortResults = (results, sortType) => {
      const sorted = [...results];
      switch (sortType) {
        case 'year':
          return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        case 'rating':
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'title':
          return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
          return sorted;
      }
    };

    const handleSearch = (e) => {
      e.preventDefault();
      performAdvancedSearch(searchQuery);
    };

    const resetFilters = () => {
      setFilters({ year: '', genre: '', rating: '', country: '' });
      setSortBy('relevance');
      if (searchQuery) {
        performAdvancedSearch(searchQuery, { year: '', genre: '', rating: '', country: '' });
      }
    };

    React.useEffect(() => {
      if (searchQuery && searchQuery.length > 2) {
        const timeoutId = setTimeout(() => {
          performAdvancedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [searchQuery, filters, sortBy, activeTab]);

    if (!isOpen) return null;

    const getAllResults = () => {
      return [...searchResults.movies, ...searchResults.shows];
    };

    const getCurrentResults = () => {
      switch (activeTab) {
        case 'movies': return searchResults.movies;
        case 'shows': return searchResults.shows;
        case 'people': return searchResults.people;
        default: return getAllResults();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20" data-name="smart-search" data-file="components/SmartSearch.js">
        <div className="w-full max-w-4xl mx-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] max-h-[80vh] flex flex-col">
          {/* Search Header */}
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-light)]">Smart Search</h2>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-light)]">
                <div className="icon-x text-xl"></div>
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, shows, people... (try voice search!)"
                  className="w-full bg-[var(--secondary-color)] text-[var(--text-light)] px-4 py-3 pr-20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] border border-[var(--border-color)]"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={startVoiceSearch}
                    className={`text-lg transition-colors ${
                      isListening 
                        ? 'text-red-500 animate-pulse' 
                        : 'text-[var(--text-muted)] hover:text-[var(--primary-color)]'
                    }`}
                    title="Voice search"
                  >
                    <div className="icon-mic"></div>
                  </button>
                  <button type="submit" className="text-[var(--primary-color)]">
                    <div className={`icon-${isSearching ? 'loader' : 'search'} text-lg ${isSearching ? 'animate-spin' : ''}`}></div>
                  </button>
                </div>
              </div>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                className="bg-[var(--secondary-color)] text-[var(--text-light)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm"
              >
                <option value="">Any Year</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
              
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="bg-[var(--secondary-color)] text-[var(--text-light)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm"
              >
                <option value="">Any Rating</option>
                <option value="8">8.0+</option>
                <option value="7">7.0+</option>
                <option value="6">6.0+</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--secondary-color)] text-[var(--text-light)] px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
                <option value="title">Title</option>
              </select>

              <button
                onClick={resetFilters}
                className="px-3 py-2 text-[var(--primary-color)] hover:bg-[var(--accent-color)] rounded-lg text-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-[var(--secondary-color)] p-1 rounded-lg">
              {[
                { key: 'all', label: 'All', count: getAllResults().length },
                { key: 'movies', label: 'Movies', count: searchResults.movies.length },
                { key: 'shows', label: 'Shows', count: searchResults.shows.length },
                { key: 'people', label: 'People', count: searchResults.people.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-[var(--primary-color)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="icon-loader animate-spin text-2xl text-[var(--primary-color)]"></div>
                <span className="ml-3 text-[var(--text-muted)]">Searching...</span>
              </div>
            ) : getCurrentResults().length === 0 ? (
              <div className="text-center py-12">
                <div className="icon-search text-4xl text-[var(--text-muted)] mb-4"></div>
                <h3 className="text-lg font-semibold text-[var(--text-light)] mb-2">
                  {searchQuery ? 'No results found' : 'Start searching'}
                </h3>
                <p className="text-[var(--text-muted)]">
                  {searchQuery ? 'Try different keywords or adjust filters' : 'Enter keywords to search for movies, shows, and people'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getCurrentResults().map(item => (
                  <div key={item.id} className="card-compact group">
                    {item.type === 'Person' ? (
                      // User/Person Card
                      <div className="text-center">
                        <div className="relative inline-block mb-3">
                          <img 
                            src={item.avatar} 
                            alt={item.name}
                            className="w-16 h-16 rounded-full mx-auto transform group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.isVip && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                              <div className="icon-crown text-white text-xs"></div>
                            </div>
                          )}
                          {item.isPrivate && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                              <div className="icon-lock text-white text-xs"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mb-1">
                          <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">
                            {item.name}
                          </h3>
                          {(item.isVip || item.username === 'theaceofficials') && (
                            <div 
                              className="relative group/badge"
                              title={item.username === 'theaceofficials' ? 'Owner' : 'VIP User'}
                            >
                              <div className="icon-check-circle text-sm text-blue-500 cursor-pointer transition-all duration-300 group-hover/badge:scale-110"></div>
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border-color)] px-2 py-1 rounded text-xs text-[var(--text-light)] opacity-0 group-hover/badge:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20">
                                {item.username === 'theaceofficials' ? 'Owner' : 'VIP User'}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[var(--text-muted)] text-xs mb-1">@{item.username}</p>
                        {item.location && (
                          <p className="text-[var(--text-muted)] text-xs mb-1 flex items-center justify-center">
                            <div className="icon-map-pin text-xs mr-1"></div>
                            {item.location}
                          </p>
                        )}
                        {item.biography && (
                          <p className="text-[var(--text-muted)] text-xs mb-3 line-clamp-2" title={item.biography}>
                            {item.biography}
                          </p>
                        )}
                        {TraktAPI.isAuthenticated() && !item.isPrivate && (
                          <button
                            onClick={() => handleFollowUser(item)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                              followingStatus[item.id]
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                                : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)] border border-[var(--primary-color)]/40 hover:bg-[var(--primary-color)]/30'
                            }`}
                          >
                            <div className={`icon-${followingStatus[item.id] ? 'user-minus' : 'user-plus'} text-xs mr-1 inline`}></div>
                            {followingStatus[item.id] ? 'Unfollow' : 'Follow'}
                          </button>
                        )}
                        {item.isPrivate && (
                          <p className="text-[var(--text-muted)] text-xs italic">Private Profile</p>
                        )}
                      </div>
                    ) : (
                      // Movie/Show Card
                      <div className="cursor-pointer" onClick={() => {
                        if (item.type === 'Movie') {
                          window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                        } else if (item.type === 'Show') {
                          window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                        }
                      }}>
                        <img 
                          src={item.poster} 
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <h3 className="font-semibold text-[var(--text-light)] text-sm truncate mb-1 group-hover:text-[var(--primary-color)] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[var(--text-muted)] text-xs mb-1">{item.type} • {item.year}</p>
                        {item.type === 'Movie' && item.runtime && (
                          <p className="text-[var(--primary-color)] text-xs">{item.runtime} min</p>
                        )}
                        {item.type === 'Show' && (item.seasons > 0 || item.episodes > 0) && (
                          <p className="text-[var(--primary-color)] text-xs">
                            {item.seasons === 1 ? `${item.episodes} episodes` : `${item.seasons} seasons`}
                          </p>
                        )}
                        {item.rating > 0 && (
                          <div className="flex items-center mt-1">
                            <div className="icon-star text-yellow-400 text-xs mr-1"></div>
                            <span className="text-[var(--text-muted)] text-xs">{item.rating}/10</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SmartSearch component error:', error);
    return null;
  }
}