function UpcomingContent() {
  const [upcomingData, setUpcomingData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const fetchUpcomingContent = React.useCallback(async () => {
    try {
      setLoading(true);
      
      if (!TraktAPI.isAuthenticated()) {
        // Generate mock data for demonstration
        const mockData = generateMockUpcomingData();
        setUpcomingData(mockData);
        return;
      }

      // Fetch real upcoming data
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      const [watchlistMovies, followedShows, animeData] = await Promise.all([
        fetchWatchlistMovies(startDate, endDate),
        fetchFollowedShows(startDate, endDate),
        fetchUpcomingAnime(startDate, endDate)
      ]);

      setUpcomingData({
        movies: watchlistMovies,
        shows: followedShows,
        anime: animeData,
        all: [...watchlistMovies, ...followedShows, ...animeData]
      });

    } catch (error) {
      console.error('Error fetching upcoming content:', error);
      setUpcomingData(generateMockUpcomingData());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWatchlistMovies = async (startDate, endDate) => {
    try {
      const watchlist = await TraktAPI.getUserWatchlist();
      const movies = watchlist.filter(item => item.movie);
      
      const upcomingMovies = [];
      for (const item of movies.slice(0, 10)) {
        const movie = item.movie;
        if (movie.released && new Date(movie.released) >= startDate) {
          const tmdbData = await TraktAPI.getTMDBData('movie', movie.ids.tmdb);
          upcomingMovies.push({
            id: movie.ids.trakt,
            title: movie.title,
            type: 'movie',
            releaseDate: new Date(movie.released),
            poster: tmdbData?.poster_path 
              ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
              : TraktAPI.getFallbackImage('movie'),
            backdrop: tmdbData?.backdrop_path 
              ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`
              : null,
            overview: tmdbData?.overview || movie.overview || '',
            rating: tmdbData?.vote_average || 0,
            year: movie.year
          });
        }
      }
      
      return upcomingMovies.sort((a, b) => a.releaseDate - b.releaseDate);
    } catch (error) {
      console.error('Error fetching watchlist movies:', error);
      return [];
    }
  };

  const fetchFollowedShows = async (startDate, endDate) => {
    try {
      const calendarData = await CalendarAPI.getMyShowsCalendar(startDate, 30);
      const processedShows = await CalendarAPI.processCalendarItems(calendarData, 'show');
      
      return processedShows.slice(0, 15).map(show => ({
        ...show,
        type: 'episode',
        backdrop: show.poster
      }));
    } catch (error) {
      console.error('Error fetching followed shows:', error);
      return [];
    }
  };

  const fetchUpcomingAnime = async (startDate, endDate) => {
    try {
      // Mock anime data for now
      return [
        {
          id: 'anime-1',
          title: 'Attack on Titan Final Season',
          type: 'anime',
          releaseDate: new Date(2025, 9, 20),
          poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80',
          backdrop: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1280&q=80',
          overview: 'The final season continues with epic battles.',
          rating: 9.2,
          episode: { season: 4, number: 15 }
        }
      ];
    } catch (error) {
      console.error('Error fetching anime data:', error);
      return [];
    }
  };

  const generateMockUpcomingData = () => {
    const mockMovies = [
      {
        id: 'mock-movie-1',
        title: 'Dune: Part Three',
        type: 'movie',
        releaseDate: new Date(2025, 10, 15),
        poster: 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?w=300&q=80',
        backdrop: 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?w=1280&q=80',
        overview: 'The epic conclusion to the Dune saga.',
        rating: 8.9,
        year: 2025
      }
    ];

    const mockShows = [
      {
        id: 'mock-show-1',
        title: 'Stranger Things S5E1',
        type: 'episode',
        releaseDate: new Date(2025, 9, 18),
        poster: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&q=80',
        backdrop: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1280&q=80',
        overview: 'The final season begins.',
        rating: 9.1,
        episode: { season: 5, number: 1 }
      }
    ];

    const mockAnime = [
      {
        id: 'mock-anime-1',
        title: 'One Piece Episode 1200',
        type: 'anime',
        releaseDate: new Date(2025, 9, 22),
        poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80',
        backdrop: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1280&q=80',
        overview: 'The adventure continues.',
        rating: 8.7,
        episode: { season: 1, number: 1200 }
      }
    ];

    return {
      movies: mockMovies,
      shows: mockShows,
      anime: mockAnime,
      all: [...mockMovies, ...mockShows, ...mockAnime]
    };
  };

  React.useEffect(() => {
    fetchUpcomingContent();
  }, [fetchUpcomingContent]);

  const getCurrentData = () => {
    return upcomingData[selectedCategory] || [];
  };

  const getCountdown = (releaseDate) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diff = release - now;

    if (diff <= 0) return 'Available now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl text-[var(--text-muted)]">Loading upcoming content...</div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent">
          Up Next
        </h1>
        <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto leading-relaxed">
          Never miss a release from your watchlist. Track upcoming movies, episodes, and anime with precision timing.
        </p>
      </div>

      {/* Category Navigation */}
      <div className="flex justify-center">
        <div className="glass-effect rounded-2xl p-2">
          {['all', 'movies', 'shows', 'anime'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-8 py-3 rounded-xl transition-all duration-300 capitalize font-medium ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-xl'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
              }`}
            >
              {category === 'all' ? 'All Content' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentData.map((item) => {
          const countdown = getCountdown(item.releaseDate);
          const releaseDate = new Date(item.releaseDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return (
            <div key={item.id} className="apple-card group">
              <div className="relative h-96 bg-gradient-to-b from-transparent via-black/20 to-black/80">
                <img
                  src={item.backdrop || item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === 'movie' ? 'bg-purple-400' : 
                          item.type === 'episode' ? 'bg-cyan-400' : 'bg-orange-400'
                        }`} />
                        <span className="text-sm text-white/80 capitalize font-medium">{item.type}</span>
                        {item.episode && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded text-white">
                            S{item.episode.season}E{item.episode.number}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-white/70 line-clamp-2 mb-3">
                        {item.overview}
                      </p>
                    </div>
                    
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded-lg ml-4 shadow-lg"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-white mb-1">{countdown}</div>
                      <div className="text-xs text-white/60">{releaseDate}</div>
                    </div>
                    
                    {item.rating && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                        <div className="icon-star text-xs text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-medium">
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentData.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-[var(--text-light)] mb-2">No Upcoming Content</h3>
          <p className="text-[var(--text-muted)]">
            Add movies and shows to your watchlist to see upcoming releases here.
          </p>
        </div>
      )}
    </div>
  );
}