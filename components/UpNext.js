function UpNext() {
  try {
    const [upNext, setUpNext] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadUpNext = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          // Get calendar for upcoming episodes
          const calendar = await TraktAPI.makeRequest('/calendars/my/shows');
          
          const processed = await Promise.all(calendar.slice(0, 8).map(async (item) => {
            const poster = await TraktAPI.getTMDBImage('tv', item.show?.ids?.tmdb) || 
                           TraktAPI.getFallbackImage('show');
            
            // Get detailed episode information from TMDB
            const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
              item.show?.ids?.tmdb,
              item.episode?.season,
              item.episode?.number
            );
            
            return {
              id: item.episode?.ids?.trakt || Math.random(),
              show: item.show?.title || 'Unknown Show',
              episode: episodeDetails?.name || item.episode?.title || 'Episode',
              season: item.episode?.season || 1,
              number: item.episode?.number || 1,
              airDate: item.first_aired,
              poster,
              thumbnail: episodeDetails?.thumbnail || poster,
              runtime: episodeDetails?.runtime || null,
              overview: episodeDetails?.overview || '',
              trakt_id: item.show?.ids?.trakt,
              tmdb_id: item.show?.ids?.tmdb,
              type: 'Show'
            };
          }));

          setUpNext(processed);
        } catch (error) {
          console.error('Failed to load up next:', error);
        } finally {
          setLoading(false);
        }
      };

      loadUpNext();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && upNext.length === 0)) {
      return null;
    }

    const formatAirDate = (dateStr) => {
      if (!dateStr) return 'TBA';
      const date = new Date(dateStr);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = itemDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays > 0) return `In ${diffDays} days`;
      return date.toLocaleDateString();
    };

    return (
      <section className="py-8 px-4" data-name="up-next" data-file="components/UpNext.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">Up Next</h2>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card-compact animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-16 h-16 bg-[var(--accent-color)] rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                      <div className="h-3 bg-[var(--accent-color)] rounded mb-1"></div>
                      <div className="h-3 bg-[var(--accent-color)] rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upNext.map(item => (
            <div key={item.id} className="flex-shrink-0 w-48">
              <div className="card-compact group cursor-pointer" onClick={() => {
                if (item.type === 'Movie') {
                  window.location.href = `movie-details.html?id=${item.tmdb_id || item.id}`;
                } else if (item.type === 'Show') {
                  // Navigate to episode details if we have episode info, otherwise to show details
                  if (item.season && item.number && item.tmdb_id) {
                    window.location.href = `episode-details.html?showId=${item.tmdb_id}&season=${item.season}&episode=${item.number}`;
                  } else {
                    window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                  }
                }
              }}>
                <div className="relative overflow-hidden rounded-lg mb-3">
                  <img 
                    src={item.poster} 
                    alt={item.title}
                    className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                      {item.runtime && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {item.runtime}m
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-light)] text-sm truncate">{item.show}</h3>
                      <p className="text-[var(--text-muted)] text-xs mb-1">
                        S{item.season}E{item.number} • {item.episode}
                      </p>
                      <p className="text-[var(--primary-color)] text-xs font-medium">
                        {formatAirDate(item.airDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('UpNext component error:', error);
    return null;
  }
}