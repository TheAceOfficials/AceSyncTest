function DiscoverContent() {
  try {
    const [activeTab, setActiveTab] = React.useState('all');
    const [activeSection, setActiveSection] = React.useState('trending');
    const [selectedGenre, setSelectedGenre] = React.useState('all');
    const [content, setContent] = React.useState({
      trending: { movies: [], shows: [] },
      popular: { movies: [], shows: [] },
      anticipated: { movies: [], shows: [] },
      recommended: { movies: [], shows: [] }
    });
    const [loading, setLoading] = React.useState(true);

    const genres = [
      'All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
      'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
      'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
    ];

    React.useEffect(() => {
      loadDiscoverContent();
    }, []);

    const loadDiscoverContent = async () => {
      setLoading(true);
      try {
        const [
          trendingMovies, trendingShows,
          popularMovies, popularShows,
          anticipatedMovies, anticipatedShows
        ] = await Promise.all([
          TraktAPI.makeRequest('/movies/trending?limit=20&extended=full'),
          TraktAPI.makeRequest('/shows/trending?limit=20&extended=full'),
          TraktAPI.makeRequest('/movies/popular?limit=20&extended=full'),
          TraktAPI.makeRequest('/shows/popular?limit=20&extended=full'),
          TraktAPI.makeRequest('/movies/anticipated?limit=20&extended=full'),
          TraktAPI.makeRequest('/shows/anticipated?limit=20&extended=full')
        ]);

        // Process content with images
        const processedContent = {
          trending: {
            movies: await TraktAPI.processContentWithImages(trendingMovies || [], 'movie'),
            shows: await TraktAPI.processContentWithImages(trendingShows || [], 'tv')
          },
          popular: {
            movies: await TraktAPI.processContentWithImages(popularMovies || [], 'movie'),
            shows: await TraktAPI.processContentWithImages(popularShows || [], 'tv')
          },
          anticipated: {
            movies: await TraktAPI.processContentWithImages(anticipatedMovies || [], 'movie'),
            shows: await TraktAPI.processContentWithImages(anticipatedShows || [], 'tv')
          },
          recommended: {
            movies: await TraktAPI.processContentWithImages((trendingMovies || []).slice(0, 10), 'movie'),
            shows: await TraktAPI.processContentWithImages((trendingShows || []).slice(0, 10), 'tv')
          }
        };

        setContent(processedContent);
      } catch (error) {
        console.error('Failed to load discover content:', error);
      } finally {
        setLoading(false);
      }
    };

    const getCurrentContent = () => {
      const sectionContent = content[activeSection];
      if (activeTab === 'all') {
        return [...(sectionContent.movies || []), ...(sectionContent.shows || [])];
      }
      return sectionContent[activeTab] || [];
    };

    const filteredContent = getCurrentContent().filter(item => {
      if (selectedGenre === 'all') return true;
      return item.genres?.some(genre => 
        genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    });

    const sections = [
      { id: 'trending', label: 'Trending Now', icon: 'trending-up' },
      { id: 'popular', label: 'Most Popular', icon: 'star' },
      { id: 'anticipated', label: 'Most Anticipated', icon: 'clock' },
      { id: 'recommended', label: 'Recommended', icon: 'heart' }
    ];

    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8" data-name="discover-content" data-file="components/DiscoverContent.js">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent mb-2">
            Discover Premium Content
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Explore trending movies, shows, and personalized recommendations
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-4 mb-8">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-lg'
                  : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)]'
              }`}
            >
              <div className={`icon-${section.icon} text-lg`}></div>
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Content Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[var(--text-muted)] font-medium">Type:</span>
              <div className="flex bg-[var(--accent-color)] rounded-lg p-1">
                {[
                  { id: 'all', label: 'All', icon: 'grid-3x3' },
                  { id: 'movies', label: 'Movies', icon: 'film' },
                  { id: 'shows', label: 'TV Shows', icon: 'tv' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
                    }`}
                  >
                    <div className={`icon-${tab.icon} text-sm`}></div>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[var(--text-muted)] font-medium">Genre:</span>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-[var(--accent-color)] border border-[var(--border-color)] text-[var(--text-light)] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre.toLowerCase()}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-[var(--text-muted)]">
              {filteredContent.length} results
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[var(--accent-color)] aspect-[2/3] rounded-xl mb-3"></div>
                <div className="bg-[var(--accent-color)] h-4 rounded mb-2"></div>
                <div className="bg-[var(--accent-color)] h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredContent.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && filteredContent.length === 0 && (
          <div className="text-center py-16">
            <div className="icon-search text-6xl text-[var(--text-muted)] mb-4"></div>
            <h3 className="text-xl font-semibold text-[var(--text-light)] mb-2">No content found</h3>
            <p className="text-[var(--text-muted)]">Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('DiscoverContent component error:', error);
    return null;
  }
}

function ContentCard({ item }) {
  try {
    const handleClick = () => {
      const type = item.type?.toLowerCase();
      if (type === 'movie') {
        window.location.href = `movie-details.html?id=${item.tmdb_id || item.trakt_id}`;
      } else {
        window.location.href = `show-details.html?id=${item.tmdb_id || item.trakt_id}`;
      }
    };

    return (
      <div 
        className="group cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={handleClick}
      >
        <div className="relative overflow-hidden rounded-xl mb-3 aspect-[2/3]">
          <img
            src={item.poster || TraktAPI.getFallbackImage(item.type?.toLowerCase())}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Rating Badge */}
          {item.rating > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
              <div className="flex items-center space-x-1">
                <div className="icon-star text-yellow-400 text-xs"></div>
                <span className="text-white text-xs font-medium">{item.rating.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2 left-2 bg-[var(--primary-color)]/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-white text-xs font-medium">{item.type}</span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-[var(--text-light)] mb-1 line-clamp-2 group-hover:text-[var(--primary-color)] transition-colors">
            {item.title}
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            {item.year} {item.runtime && `• ${TraktAPI.formatRuntime(item.runtime)}`}
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ContentCard component error:', error);
    return null;
  }
}