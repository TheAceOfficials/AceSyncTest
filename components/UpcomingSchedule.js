function UpcomingSchedule() {
  try {
    const [schedule, setSchedule] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadSchedule = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          // Get user's show calendar for the next 7 days
          const today = new Date().toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const calendar = await TraktAPI.makeRequest(`/calendars/my/shows/${today}/${7}`);
          
          const processed = await Promise.all(calendar.slice(0, 10).map(async (item) => {
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
              trakt_id: item.show?.ids?.trakt
            };
          }));

          setSchedule(processed);
        } catch (error) {
          console.error('Failed to load schedule:', error);
        } finally {
          setLoading(false);
        }
      };

      loadSchedule();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && schedule.length === 0)) {
      return null;
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return { date: 'TBA', time: '' };
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
    };

    return (
      <section className="py-8 px-4" data-name="upcoming-schedule" data-file="components/UpcomingSchedule.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">Upcoming Schedule</h2>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="card-compact animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[var(--accent-color)] rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                      <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                    </div>
                    <div className="w-20 h-8 bg-[var(--accent-color)] rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map(item => {
                const { date, time } = formatDateTime(item.airDate);
                return (
                  <div key={item.id} className="card-compact hover:bg-[var(--accent-color)]/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={item.thumbnail || item.poster} 
                          alt={item.episode}
                          className="w-16 h-10 object-cover rounded"
                        />
                        {item.runtime && (
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                            {item.runtime}m
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-light)] text-sm truncate">{item.show}</h3>
                        <p className="text-[var(--text-muted)] text-xs truncate">
                          S{item.season}E{item.number} • {item.episode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--primary-color)] text-sm font-medium">{date}</p>
                        <p className="text-[var(--text-muted)] text-xs">{time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error('UpcomingSchedule component error:', error);
    return null;
  }
}