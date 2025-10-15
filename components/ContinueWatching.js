function ContinueWatching() {
  try {
    const [continueWatching, setContinueWatching] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const loadContinueWatching = async () => {
        if (!TraktAPI.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const continueItems = [];

          // First try to get playback progress (paused episodes)
          const playbackProgress = await TraktAPI.makeRequest('/sync/playback/episodes?extended=full');
          
          if (playbackProgress && playbackProgress.length > 0) {
            // Process playback progress entries
            for (const progressItem of playbackProgress.slice(0, 6)) {
              try {
                const show = progressItem.show;
                const episode = progressItem.episode;
                
                if (!show || !episode || !show.ids?.tmdb) continue;

                // Get poster image
                const tmdbDetails = await TraktAPI.getTMDBDetails('tv', show.ids.tmdb);
                const poster = tmdbDetails?.poster || TraktAPI.getFallbackImage('show');

                // Get episode thumbnail
                const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
                  show.ids.tmdb,
                  episode.season,
                  episode.number
                );

                const nextEpisode = {
                  season: episode.season || 1,
                  number: episode.number || 1,
                  name: episode.title || `Episode ${episode.number}`,
                  thumbnail: episodeDetails?.thumbnail || poster,
                  runtime: episode.runtime || episodeDetails?.runtime || 45,
                  progress: Math.round(progressItem.progress || 0)
                };

                continueItems.push({
                  id: show.ids?.trakt || Math.random(),
                  title: show.title || 'Unknown Show',
                  poster,
                  nextEpisode,
                  trakt_id: show.ids?.trakt,
                  tmdb_id: show.ids?.tmdb,
                  type: 'Show',
                  lastWatched: progressItem.paused_at || new Date().toISOString()
                });
              } catch (error) {
                console.error('Failed to process progress item:', error);
              }
            }
          }

          // If no progress items, get recent episode history to find shows to continue
          if (continueItems.length === 0) {
            const recentHistory = await TraktAPI.getUserHistory(30);
            
            if (recentHistory && recentHistory.length > 0) {
              const episodeHistory = recentHistory.filter(h => h.episode && h.show);
              const showGroups = {};

              // Group episodes by show
              episodeHistory.forEach(historyItem => {
                const showId = historyItem.show.ids?.trakt;
                if (showId) {
                  if (!showGroups[showId]) {
                    showGroups[showId] = {
                      show: historyItem.show,
                      episodes: []
                    };
                  }
                  showGroups[showId].episodes.push(historyItem);
                }
              });

              // Process each show to find next episodes
              const showEntries = Object.entries(showGroups).slice(0, 6);
              
              for (const [showId, showGroup] of showEntries) {
                try {
                  const show = showGroup.show;
                  const episodes = showGroup.episodes.sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at));
                  const lastEpisode = episodes[0].episode;
                  
                  // Get poster image
                  const tmdbDetails = await TraktAPI.getTMDBDetails('tv', show.ids.tmdb);
                  const poster = tmdbDetails?.poster || TraktAPI.getFallbackImage('show');

                  // Try to find the next episode after the last watched one
                  let nextEpisode = null;
                  
                  try {
                    const seasonEpisodes = await TraktAPI.getShowEpisodes(show.ids.trakt, lastEpisode.season);
                    
                    if (seasonEpisodes && seasonEpisodes.length > 0) {
                      const currentIndex = seasonEpisodes.findIndex(ep => ep.number === lastEpisode.number);
                      
                      if (currentIndex !== -1 && currentIndex < seasonEpisodes.length - 1) {
                        // Next episode in same season
                        const nextEp = seasonEpisodes[currentIndex + 1];
                        const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
                          show.ids.tmdb,
                          lastEpisode.season,
                          nextEp.number
                        );
                        
                        nextEpisode = {
                          season: lastEpisode.season,
                          number: nextEp.number,
                          name: nextEp.title || `Episode ${nextEp.number}`,
                          thumbnail: episodeDetails?.thumbnail || poster,
                          runtime: nextEp.runtime || episodeDetails?.runtime || 45
                        };
                      } else {
                        // Try first episode of next season
                        const nextSeasonEpisodes = await TraktAPI.getShowEpisodes(show.ids.trakt, lastEpisode.season + 1);
                        if (nextSeasonEpisodes && nextSeasonEpisodes.length > 0) {
                          const firstEp = nextSeasonEpisodes[0];
                          const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
                            show.ids.tmdb,
                            lastEpisode.season + 1,
                            firstEp.number
                          );
                          
                          nextEpisode = {
                            season: lastEpisode.season + 1,
                            number: firstEp.number,
                            name: firstEp.title || `Episode ${firstEp.number}`,
                            thumbnail: episodeDetails?.thumbnail || poster,
                            runtime: firstEp.runtime || episodeDetails?.runtime || 45
                          };
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Failed to get next episode:', error);
                  }

                  // If no next episode found, use the last watched episode as "continue"
                  if (!nextEpisode) {
                    const episodeDetails = await TraktAPI.getTMDBEpisodeDetails(
                      show.ids.tmdb,
                      lastEpisode.season,
                      lastEpisode.number
                    );
                    
                    nextEpisode = {
                      season: lastEpisode.season,
                      number: lastEpisode.number,
                      name: lastEpisode.title || `Episode ${lastEpisode.number}`,
                      thumbnail: episodeDetails?.thumbnail || poster,
                      runtime: lastEpisode.runtime || episodeDetails?.runtime || 45
                    };
                  }

                  continueItems.push({
                    id: show.ids?.trakt || Math.random(),
                    title: show.title || 'Unknown Show',
                    poster,
                    nextEpisode,
                    trakt_id: show.ids?.trakt,
                    tmdb_id: show.ids?.tmdb,
                    type: 'Show',
                    lastWatched: episodes[0].watched_at || new Date().toISOString()
                  });
                } catch (error) {
                  console.error('Failed to process show for continue watching:', error);
                }
              }
            }
          }

          // Remove duplicates and sort by last watched date
          const uniqueItems = continueItems.filter((item, index, self) => 
            index === self.findIndex(t => t.trakt_id === item.trakt_id)
          );
          
          uniqueItems.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
          setContinueWatching(uniqueItems.slice(0, 6));

        } catch (error) {
          console.error('Failed to load continue watching:', error);
          setContinueWatching([]);
        } finally {
          setLoading(false);
        }
      };

      loadContinueWatching();
    }, []);

    if (!TraktAPI.isAuthenticated() || (!loading && continueWatching.length === 0)) {
      return null;
    }

    return (
      <section className="py-8 px-4" data-name="continue-watching" data-file="components/ContinueWatching.js">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-light)]">Continue Watching</h2>
            <button 
              onClick={() => window.location.href = 'continue-watching.html'}
              className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] text-sm font-medium transition-colors"
            >
              View All
            </button>
          </div>
          
          {loading ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-shrink-0 w-48">
                  <div className="card-compact animate-pulse">
                    <div className="w-full h-32 bg-[var(--accent-color)] rounded-lg mb-3"></div>
                    <div className="h-4 bg-[var(--accent-color)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--accent-color)] rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {continueWatching.map(item => (
                <div key={item.id} className="flex-shrink-0 w-64">
                  <div className="card-compact group cursor-pointer" onClick={() => {
                    if (item.nextEpisode) {
                      window.location.href = `episode-details.html?showId=${item.tmdb_id}&season=${item.nextEpisode.season}&episode=${item.nextEpisode.number}`;
                    } else {
                      window.location.href = `show-details.html?id=${item.tmdb_id || item.id}`;
                    }
                  }}>
                    <div className="relative overflow-hidden rounded-lg mb-3">
                      <img 
                        src={item.nextEpisode?.thumbnail || item.poster} 
                        alt={item.title}
                        className="w-full h-36 object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="icon-play text-white text-2xl"></div>
                      </div>
                      
                      {/* Content type badge */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                        TV Show
                      </div>
                      
                      {/* Episode info */}
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {item.nextEpisode?.runtime ? `${item.nextEpisode.runtime}m` : 
                         item.nextEpisode ? `S${item.nextEpisode.season}E${item.nextEpisode.number}` : 
                         'Continue'
                        }
                      </div>
                      

                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[var(--text-light)] text-sm truncate">{item.title}</h3>
                      {item.nextEpisode && (
                        <div className="space-y-1">
                          <p className="text-[var(--text-muted)] text-xs truncate">
                            S{item.nextEpisode.season}E{item.nextEpisode.number}: {item.nextEpisode.name}
                          </p>
                          {item.nextEpisode.runtime && (
                            <p className="text-[var(--primary-color)] text-xs font-medium">
                              {item.nextEpisode.runtime} minutes
                            </p>
                          )}
                        </div>
                      )}
                      {!item.nextEpisode && (
                        <p className="text-[var(--text-muted)] text-xs">
                          Continue watching
                        </p>
                      )}
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
    console.error('ContinueWatching component error:', error);
    return null;
  }
}