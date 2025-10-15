function HeroSlider() {
  try {
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const [slides, setSlides] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
    const [logoCache, setLogoCache] = React.useState({});
    const slideInterval = React.useRef(null);

    // Function to fetch logo for a specific item
    const fetchLogo = async (item) => {
      if (!item.tmdb_id || logoCache[item.tmdb_id]) return logoCache[item.tmdb_id] || null;
      
      try {
        let logoUrl = null;
        
        if (item.type === 'Movie') {
          const movieDetails = await TraktAPI.getTMDBMovieDetails(item.tmdb_id);
          logoUrl = movieDetails?.logo || null;
        } else {
          const showDetails = await TraktAPI.getTMDBShowDetails(item.tmdb_id);
          logoUrl = showDetails?.logo || null;
        }
        
        setLogoCache(prev => ({ ...prev, [item.tmdb_id]: logoUrl }));
        return logoUrl;
      } catch (error) {
        console.error('Error fetching logo for', item.title, ':', error);
        setLogoCache(prev => ({ ...prev, [item.tmdb_id]: null }));
        return null;
      }
    };

    // Fetch latest releases
    React.useEffect(() => {
      const fetchLatestReleases = async () => {
        try {
          const [trendingMovies, trendingShows] = await Promise.all([
            TraktAPI.getTrendingMovies(6),
            TraktAPI.getTrendingShows(6)
          ]);

          // Process and combine data with backdrop images for hero display
          const movieSlides = await TraktAPI.processContentWithImages(trendingMovies.slice(0, 3), 'movie', true);
          const showSlides = await TraktAPI.processContentWithImages(trendingShows.slice(0, 3), 'tv', true);

          // Filter out items without proper IDs and combine
          const validMovieSlides = movieSlides.filter(item => item && (item.tmdb_id || item.trakt_id));
          const validShowSlides = showSlides.filter(item => item && (item.tmdb_id || item.trakt_id));
          
          const allSlides = [...validMovieSlides, ...validShowSlides].sort(() => Math.random() - 0.5);
          
          const finalSlides = allSlides.slice(0, 5); // Show 5 slides max
          setSlides(finalSlides);
          
          // Preload logos for all hero items
          finalSlides.forEach(item => {
            if (item.tmdb_id) {
              fetchLogo(item);
            }
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch hero slides:', error);
          // Use fallback slides with proper TMDB structure
          setSlides([
            {
              id: 550,
              title: "Featured Movie",
              type: "Movie",
              year: 2024,
              rating: 8.5,
              runtime: 142,
              poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
              backdrop: "https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
              overview: "An incredible cinematic experience that will keep you on the edge of your seat.",
              tmdb_id: 550,
              trakt_id: 1,
              imdb_id: "tt0137523"
            }
          ]);
          
          // Preload logos for fallback items
          const fallbackSlides = [
            {
              id: 550,
              title: "Featured Movie",
              type: "Movie",
              year: 2024,
              rating: 8.5,
              runtime: 142,
              poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
              backdrop: "https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
              overview: "An incredible cinematic experience that will keep you on the edge of your seat.",
              tmdb_id: 550,
              trakt_id: 1,
              imdb_id: "tt0137523"
            }
          ];
          
          fallbackSlides.forEach(item => {
            if (item.tmdb_id) {
              fetchLogo(item);
            }
          });
          
          setLoading(false);
        }
      };

      fetchLatestReleases();
    }, []);

    // Auto-slide functionality
    React.useEffect(() => {
      if (isAutoPlaying && slides.length > 1) {
        slideInterval.current = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
      }

      return () => {
        if (slideInterval.current) {
          clearInterval(slideInterval.current);
        }
      };
    }, [isAutoPlaying, slides.length]);

    const goToSlide = (index) => {
      setCurrentSlide(index);
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
    };

    const nextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleMoreInfo = (item) => {
      try {
        if (!item) {
          console.error('Invalid item data for navigation');
          return;
        }
        
        // Ensure we have TMDB ID for navigation
        if (!item.tmdb_id) {
          console.error('No TMDB ID available for navigation');
          return;
        }
        
        // Determine the correct detail page based on content type
        const isMovie = item.type === 'Movie';
        const detailsPage = isMovie ? 'movie-details.html' : 'show-details.html';
        
        // Build clean URL with id parameter using TMDB ID
        const url = `${detailsPage}?id=${item.tmdb_id}`;
        console.log(`Navigating to ${isMovie ? 'movie' : 'show'} details:`, url);
        window.location.href = url;
        
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation to content listing pages
        const fallbackPage = item?.type === 'Movie' ? 'movies.html' : 'shows.html';
        console.log('Fallback navigation to:', fallbackPage);
        window.location.href = fallbackPage;
      }
    };

    const handleAddToWatchlist = async (item) => {
      try {
        if (!TraktAPI.isAuthenticated()) {
          const authUrl = TraktAPI.getAuthUrl();
          if (authUrl) {
            window.location.href = authUrl;
          } else {
            console.error('Unable to get authentication URL');
          }
          return;
        }

        if (!item || (!item.trakt_id && !item.tmdb_id)) {
          console.error('Invalid item data for watchlist');
          return;
        }

        const type = item.type === 'Movie' ? 'movies' : 'shows';
        const itemData = {
          ids: {}
        };
        
        if (item.trakt_id) itemData.ids.trakt = item.trakt_id;
        if (item.tmdb_id) itemData.ids.tmdb = item.tmdb_id;
        if (item.imdb_id) itemData.ids.imdb = item.imdb_id;
        
        await TraktAPI.addToWatchlist(type, itemData);
        console.log(`Added ${item.title} to watchlist successfully`);
        
        // Show success feedback
        if (window.showNotification) {
          window.showNotification(`Added ${item.title} to watchlist`, 'success');
        }
      } catch (error) {
        console.error('Failed to add to watchlist:', error);
        if (window.showNotification) {
          window.showNotification('Failed to add to watchlist', 'error');
        }
      }
    };

    const handleMarkWatched = async (item) => {
      try {
        if (!TraktAPI.isAuthenticated()) {
          const authUrl = TraktAPI.getAuthUrl();
          if (authUrl) {
            window.location.href = authUrl;
          } else {
            console.error('Unable to get authentication URL');
          }
          return;
        }

        if (!item || (!item.trakt_id && !item.tmdb_id)) {
          console.error('Invalid item data for marking watched');
          return;
        }

        const type = item.type === 'Movie' ? 'movies' : 'shows';
        const itemData = {
          ids: {}
        };
        
        if (item.trakt_id) itemData.ids.trakt = item.trakt_id;
        if (item.tmdb_id) itemData.ids.tmdb = item.tmdb_id;
        if (item.imdb_id) itemData.ids.imdb = item.imdb_id;
        
        await TraktAPI.markAsWatched(type, itemData);
        console.log(`Marked ${item.title} as watched successfully`);
        
        // Show success feedback
        if (window.showNotification) {
          window.showNotification(`Marked ${item.title} as watched`, 'success');
        }
      } catch (error) {
        console.error('Failed to mark as watched:', error);
        if (window.showNotification) {
          window.showNotification('Failed to mark as watched', 'error');
        }
      }
    };

    if (loading) {
      return (
        <div className="relative h-[70vh] bg-gradient-to-br from-[var(--background-dark)] via-[var(--secondary-color)] to-[var(--accent-color)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--text-muted)]">Loading latest releases...</p>
          </div>
        </div>
      );
    }

    if (!slides.length) {
      return null;
    }

    const currentItem = slides[currentSlide];

    return (
      <div className="relative mx-4 my-6" data-name="hero-slider" data-file="components/HeroSlider.js">
        <div className="relative h-[65vh] overflow-hidden rounded-2xl shadow-2xl">
          {/* Background Images */}
          <div className="absolute inset-0">
            {slides.map((slide, index) => (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={slide.backdrop || slide.poster || TraktAPI.getHeroFallbackImage()}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
              </div>
            ))}
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8">
            {/* Top Section with Type Badge */}
            <div className="flex justify-between items-start">
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md ${
                currentItem.type === 'Movie' 
                  ? 'bg-blue-500/25 text-blue-200 border border-blue-400/30' 
                  : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
              }`}>
                <div className={`icon-${currentItem.type === 'Movie' ? 'film' : 'tv'} text-sm mr-2`}></div>
                {currentItem.type}
              </span>
              
              {/* Slide Indicators */}
              <div className="flex space-x-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white shadow-lg w-6' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Section with Content */}
            <div className="space-y-6">
              {/* Title with Enhanced TMDb Logo Support */}
              <div className="mb-4">
                {logoCache[currentItem.tmdb_id] ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoCache[currentItem.tmdb_id]}
                      alt={currentItem.title}
                      className="h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28 max-w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-contain"
                      style={{
                        filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.95)) drop-shadow(0 4px 12px rgba(139, 92, 246, 0.5)) drop-shadow(0 2px 6px rgba(6, 182, 212, 0.3))'
                      }}
                      onError={(e) => {
                        console.log('Logo failed to load for', currentItem.title);
                        setLogoCache(prev => ({ ...prev, [currentItem.tmdb_id]: null }));
                      }}
                    />
                  </div>
                ) : (
                  <h1 
                    className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                    style={{
                      textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 3px 6px rgba(139, 92, 246, 0.5), 0 1px 3px rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    {currentItem.title}
                  </h1>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center space-x-6 text-sm text-gray-300">
                <span className="text-white font-medium">{currentItem.year}</span>
                {currentItem.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="icon-star text-yellow-400 text-sm"></div>
                    <span>{currentItem.rating.toFixed(1)}</span>
                  </div>
                )}
                {currentItem.runtime && (
                  <div className="flex items-center space-x-1">
                    <div className="icon-clock text-gray-400 text-sm"></div>
                    <span>{currentItem.runtime}m</span>
                  </div>
                )}
                {currentItem.seasons > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="icon-layers text-gray-400 text-sm"></div>
                    <span>{currentItem.seasons} Season{currentItem.seasons > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-200 max-w-2xl leading-relaxed text-lg opacity-90">
                {currentItem.overview || `Experience the ${currentItem.type.toLowerCase()} that's captivating audiences worldwide. Don't miss out on this trending content.`}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => handleMoreInfo(currentItem)}
                  className="bg-white/90 hover:bg-white text-black px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
                >
                  <div className="icon-info text-lg"></div>
                  <span>More Info</span>
                </button>
                
                <button 
                  onClick={() => handleAddToWatchlist(currentItem)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 border border-white/30"
                >
                  <div className="icon-plus text-lg"></div>
                  <span>Add to List</span>
                </button>

                <button 
                  onClick={() => handleMarkWatched(currentItem)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 border border-white/30"
                >
                  <div className="icon-check text-lg"></div>
                  <span>Mark Watched</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border border-white/20"
              >
                <div className="icon-chevron-left text-white text-xl"></div>
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border border-white/20"
              >
                <div className="icon-chevron-right text-white text-xl"></div>
              </button>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('HeroSlider component error:', error);
    return null;
  }
}