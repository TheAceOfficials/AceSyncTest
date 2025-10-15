function AnimeContent() {
  try {
    const [trendingAnime, setTrendingAnime] = React.useState([]);
    const [popularAnime, setPopularAnime] = React.useState([]);
    const [topRatedAnime, setTopRatedAnime] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [ratings, setRatings] = React.useState({});
    const [watchedStatus, setWatchedStatus] = React.useState({});
    const [activeSection, setActiveSection] = React.useState('trending');
    const [genreFilter, setGenreFilter] = React.useState('all');

    React.useEffect(() => {
      const loadAnime = async () => {
        try {
          const [trending, popular] = await Promise.all([
            AniListAPI.getTrendingAnime(24),
            AniListAPI.getPopularAnime(24)
          ]);
          
          console.log('AniList Response - Trending:', trending);
          console.log('AniList Response - Popular:', popular);
          
          const processedTrending = processAnimeData(trending || []);
          const processedPopular = processAnimeData(popular || []);

          setTrendingAnime(processedTrending);
          setPopularAnime(processedPopular);
          setTopRatedAnime(processedPopular.slice(0, 12)); // Use popular for top rated
        } catch (error) {
          console.error('Failed to load anime:', error);
          const mockAnime = getMockAnimeData();
          setTrendingAnime(mockAnime);
          setPopularAnime(mockAnime);
          setTopRatedAnime(mockAnime);
        } finally {
          setLoading(false);
        }
      };

      loadAnime();
    }, []);

    // Process AniList anime data
    const processAnimeData = (animeList) => {
      if (!Array.isArray(animeList)) {
        console.warn('processAnimeData received non-array data:', animeList);
        return [];
      }
      
      return animeList.map(anime => ({
        id: anime.id,
        title: anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown Title',
        poster: anime.coverImage?.large || anime.coverImage?.medium || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300',
        rating: anime.averageScore ? anime.averageScore / 10 : 0,
        year: anime.startDate?.year || 'TBA',
        genres: anime.genres?.slice(0, 3) || ['Anime'],
        synopsis: anime.description ? anime.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No synopsis available.',
        episodes: anime.episodes || 'Unknown',
        status: anime.status || 'Unknown'
      }));
    };

    const getMockAnimeData = () => {
      return [
        {
          id: 1,
          title: 'Attack on Titan',
          type: 'Anime',
          poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          year: 2013,
          rating: 9.0,
          episodes: 87,
          genres: ['Action', 'Drama', 'Fantasy'],
          overview: 'Humanity fights for survival against giant humanoid Titans.',
          simkl_id: 'mock-1'
        }
      ];
    };

    const filterByGenre = (animeList) => {
      if (genreFilter === 'all') return animeList;
      return animeList.filter(anime => {
        if (!anime.genres || anime.genres.length === 0) return false;
        return anime.genres.some(genre => 
          genre.toLowerCase().includes(genreFilter.toLowerCase())
        );
      });
    };

    const getCurrentAnime = () => {
      let baseAnime;
      switch (activeSection) {
        case 'trending': baseAnime = trendingAnime; break;
        case 'popular': baseAnime = popularAnime; break;
        case 'top-rated': baseAnime = topRatedAnime; break;
        default: baseAnime = trendingAnime;
      }
      return filterByGenre(baseAnime);
    };

    const getSectionTitle = () => {
      const sectionName = activeSection === 'trending' ? 'Trending Anime' :
                         activeSection === 'popular' ? 'Popular Anime' : 'Top Rated Anime';
      const genreName = genreFilter === 'all' ? '' : ` • ${genreFilter.charAt(0).toUpperCase() + genreFilter.slice(1)}`;
      return sectionName + genreName;
    };

    return (
      <main className="py-8 px-4" data-name="anime-content" data-file="components/AnimeContent.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                Anime
              </span>
            </h1>
            <p className="text-xl text-[var(--text-muted)]">Discover amazing anime powered by AniList</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="card-compact">
              <div className="flex space-x-1">
                {[
                  { key: 'trending', label: 'Trending', icon: 'trending-up' },
                  { key: 'popular', label: 'Popular', icon: 'star' },
                  { key: 'top-rated', label: 'Top Rated', icon: 'award' }
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

          <div className="flex justify-center mb-6">
            <div className="card-compact">
              <div className="flex flex-wrap gap-2">
                <span className="text-[var(--text-muted)] text-sm font-medium px-3 py-2">Genre:</span>
                <button
                  onClick={() => setGenreFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    genreFilter === 'all'
                      ? 'bg-[var(--primary-color)] text-white'
                      : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary-color)]'
                  }`}
                >
                  All Genres
                </button>
                {['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Slice of Life', 'Thriller'].map(genre => (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genre.toLowerCase())}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      genreFilter === genre.toLowerCase()
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary-color)]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">{getSectionTitle()}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Powered by AniList API • {getCurrentAnime().length} results
            </p>
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
              {getCurrentAnime().map(animeItem => (
                <div 
                  key={animeItem.id} 
                  className="card-compact group cursor-pointer"
                  onClick={() => window.location.href = `anime-details.html?id=${animeItem.id}`}
                >
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img 
                      src={animeItem.poster} 
                      alt={animeItem.title}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{animeItem.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{animeItem.year}</p>
                    {animeItem.episodes && animeItem.episodes !== 'Unknown' && (
                      <p className="text-[var(--primary-color)] text-xs font-medium">
                        {animeItem.episodes} episodes
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('AnimeContent component error:', error);
    return null;
  }
}