function Recommendations() {
  try {
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadRecommendations = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          // Get recommendations from Trakt API
          const [movieRecs, showRecs] = await Promise.all([
            TraktAPI.makeRequest('/recommendations/movies'),
            TraktAPI.makeRequest('/recommendations/shows')
          ]);

          const processedMovies = await TraktAPI.processContentWithImages(movieRecs.slice(0, 3), 'movie');
          const processedShows = await TraktAPI.processContentWithImages(showRecs.slice(0, 3), 'tv');

          // Ensure all items have tmdb_id for navigation
          const allProcessed = [...processedMovies, ...processedShows].map(item => ({
            ...item,
            tmdb_id: item.tmdb_id || item.id
          }));

          setRecommendations(allProcessed);
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        } finally {
          setLoading(false);
        }
      };

      loadRecommendations();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && recommendations.length === 0)) {
      return null;
    }

    return (
      <section className="py-8 px-4" data-name="recommendations" data-file="components/Recommendations.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-light)]">Recommended For You</h2>
              <p className="text-[var(--text-muted)] text-sm">Based on your watch history</p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex-shrink-0 w-48">
                  <div className="card-compact animate-pulse">
                    <div className="w-full h-64 bg-[var(--accent-color)] rounded-lg mb-3"></div>
                    <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recommendations.map(item => (
                <div key={item.id} className="flex-shrink-0 w-48">
                  <div className="card-compact group cursor-pointer" onClick={() => {
                    if (item.type === 'Movie') {
                      window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                    } else if (item.type === 'Show') {
                      window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                    }
                  }}>
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-64 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <h3 className="font-semibold text-[var(--text-light)] text-sm truncate mb-1">{item.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-2">{item.type} • {item.year}</p>
                    <button className="w-full btn-primary text-xs py-2">
                      Add to Watchlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('Recommendations component error:', error);
    return null;
  }
}