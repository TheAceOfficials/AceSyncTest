function ShowDetailsContent() {
  try {
    const [showDetails, setShowDetails] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [isWatched, setIsWatched] = React.useState(false);
    const [isWatchlisted, setIsWatchlisted] = React.useState(false);
    const [userRating, setUserRating] = React.useState(0);
    const [showTrailer, setShowTrailer] = React.useState(false);
    const [watchCount, setWatchCount] = React.useState(0);
    const [similarShows, setSimilarShows] = React.useState([]);
    const [selectedSeason, setSelectedSeason] = React.useState(1);
    const [showMoreOverview, setShowMoreOverview] = React.useState(false);
    const [availableProviders, setAvailableProviders] = React.useState([]);
    const [seasons, setSeasons] = React.useState([]);
    const [episodes, setEpisodes] = React.useState([]);
    const [episodesLoading, setEpisodesLoading] = React.useState(false);
    const [watchedEpisodes, setWatchedEpisodes] = React.useState(new Set());
    const [watchedSeasons, setWatchedSeasons] = React.useState(new Set());
    const [traktShowId, setTraktShowId] = React.useState(null);
    const [syncedWatchData, setSyncedWatchData] = React.useState(null);

    React.useEffect(() => {
      loadShowDetails();
    }, []);

    React.useEffect(() => {
      if (TraktAPI.isAuthenticated()) {
        syncWatchedData();
      }
    }, [traktShowId]);

    const syncWatchedData = async () => {
      try {
        if (!traktShowId || !TraktAPI.isAuthenticated()) return;

        // Sync all watched content from Trakt
        const syncData = await TraktAPI.syncWatchedContent();
        setSyncedWatchData(syncData);

        // Check if show is watched
        const showWatched = TraktAPI.getShowWatchedStatus(traktShowId);
        setIsWatched(showWatched);

        // Get all episode watch statuses for the show
        const episodeStatuses = TraktAPI.getShowEpisodesWatchedStatus(traktShowId);
        const watchedEps = new Set();
        const watchedSeasons = new Set();

        // Parse episode watch data
        Object.keys(episodeStatuses).forEach(episodeKey => {
          if (episodeStatuses[episodeKey]) {
            const [season, episode] = episodeKey.split('_');
            watchedEps.add(`${traktShowId}_${season}_${episode}`);
            
            // Check if entire season is watched
            const seasonEpisodes = episodes.filter(ep => ep.season_number === parseInt(season));
            const seasonWatchedCount = seasonEpisodes.filter(ep => 
              episodeStatuses[`${season}_${ep.episode_number}`]
            ).length;
            
            if (seasonWatchedCount === seasonEpisodes.length && seasonEpisodes.length > 0) {
              watchedSeasons.add(parseInt(season));
            }
          }
        });

        setWatchedEpisodes(watchedEps);
        setWatchedSeasons(watchedSeasons);

      } catch (error) {
        console.error('Error syncing watched data:', error);
      }
    };

    const loadShowDetails = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const showId = urlParams.get('id');

        if (!showId) {
          setLoading(false);
          return;
        }

        const details = await TMDB_API.getShowDetails(showId);
        if (details) {
          setShowDetails(details);
          setSeasons(details.seasons);
          setTraktShowId(showId); // Set Trakt show ID for syncing
          loadEpisodes(showId, 1);
          loadSimilarShows(showId);
          
          const providers = TMDB_API.getAllProviders(details.watchProviders);
          setAvailableProviders(providers);
        }
        
        const savedComments = localStorage.getItem(`show_comments_${showId}`);
        if (savedComments) {
          setComments(JSON.parse(savedComments));
        }

        // Load local data as fallback
        const savedWatchCount = localStorage.getItem(`show_watch_count_${showId}`);
        if (savedWatchCount) {
          setWatchCount(parseInt(savedWatchCount));
          if (!TraktAPI.isAuthenticated()) {
            setIsWatched(parseInt(savedWatchCount) > 0);
          }
        }

        if (!TraktAPI.isAuthenticated()) {
          // Load local watched data if not authenticated
          const savedWatchedEpisodes = localStorage.getItem(`watched_episodes_${showId}`);
          if (savedWatchedEpisodes) {
            setWatchedEpisodes(new Set(JSON.parse(savedWatchedEpisodes)));
          }

          const savedWatchedSeasons = localStorage.getItem(`watched_seasons_${showId}`);
          if (savedWatchedSeasons) {
            setWatchedSeasons(new Set(JSON.parse(savedWatchedSeasons)));
          }
        }
      } catch (error) {
        console.error('Error loading show details:', error);
      }
      setLoading(false);
    };

    const loadEpisodes = async (showId, seasonNumber) => {
      setEpisodesLoading(true);
      try {
        const episodesList = await TMDB_API.getSeasonEpisodes(showId, seasonNumber);
        setEpisodes(episodesList);
      } catch (error) {
        console.error('Error loading episodes:', error);
      }
      setEpisodesLoading(false);
    };

    const loadSimilarShows = async (showId) => {
      try {
        const similar = await TMDB_API.getSimilarShows(showId);
        setSimilarShows(similar.slice(0, 12));
      } catch (error) {
        console.error('Error loading similar shows:', error);
      }
    };

    const handleWatchedToggle = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const showId = urlParams.get('id');
      
      try {
        if (TraktAPI.isAuthenticated() && showDetails) {
          // Use Trakt API for authenticated users
          const showItem = {
            ids: {
              trakt: parseInt(showId),
              tmdb: showDetails.id
            }
          };

          if (isWatched) {
            await TraktAPI.removeFromWatched('shows', showItem);
            setIsWatched(false);
            setWatchCount(0);
            NotificationToast.show('Removed from watched shows', 'success');
          } else {
            await TraktAPI.markAsWatched('shows', showItem);
            setIsWatched(true);
            setWatchCount(watchCount + 1);
            NotificationToast.show('Marked as watched!', 'success');
          }

          // Refresh watched data
          await syncWatchedData();
        } else {
          // Fallback to local storage
          if (isWatched) {
            setWatchCount(0);
            setIsWatched(false);
            localStorage.removeItem(`show_watch_count_${showId}`);
          } else {
            const newCount = watchCount + 1;
            setWatchCount(newCount);
            setIsWatched(true);
            localStorage.setItem(`show_watch_count_${showId}`, newCount.toString());
          }
        }
      } catch (error) {
        console.error('Error toggling watched status:', error);
        NotificationToast.show('Error updating watched status', 'error');
      }
    };

    const toggleEpisodeWatched = async (episodeId, episodeData = null) => {
      const urlParams = new URLSearchParams(window.location.search);
      const showId = urlParams.get('id');
      
      try {
        const episodeKey = `${showId}_${selectedSeason}_${episodeData?.episode_number || episodeId}`;
        const isCurrentlyWatched = watchedEpisodes.has(episodeKey);

        if (TraktAPI.isAuthenticated() && episodeData && showDetails) {
          // Use Trakt API for authenticated users
          const episodeItem = {
            ids: {
              trakt: episodeData.id,
              tmdb: episodeData.id
            }
          };

          if (isCurrentlyWatched) {
            await TraktAPI.removeFromWatched('episodes', episodeItem);
            NotificationToast.show('Episode unmarked', 'success');
          } else {
            await TraktAPI.markAsWatched('episodes', episodeItem);
            NotificationToast.show('Episode marked as watched!', 'success');
          }

          // Refresh watched data from Trakt
          await syncWatchedData();
        } else {
          // Fallback to local storage
          const newWatchedEpisodes = new Set(watchedEpisodes);
          if (isCurrentlyWatched) {
            newWatchedEpisodes.delete(episodeKey);
          } else {
            newWatchedEpisodes.add(episodeKey);
          }
          
          setWatchedEpisodes(newWatchedEpisodes);
          localStorage.setItem(`watched_episodes_${showId}`, JSON.stringify([...newWatchedEpisodes]));
        }
      } catch (error) {
        console.error('Error toggling episode watched status:', error);
        NotificationToast.show('Error updating episode status', 'error');
      }
    };

    const toggleSeasonWatched = async (seasonNumber) => {
      const urlParams = new URLSearchParams(window.location.search);
      const showId = urlParams.get('id');
      
      try {
        const isSeasonWatched = watchedSeasons.has(seasonNumber);

        if (TraktAPI.isAuthenticated() && showDetails && episodes.length > 0) {
          // Use Trakt API for authenticated users
          const episodeItems = episodes.map(episode => ({
            ids: {
              trakt: episode.id,
              tmdb: episode.id
            }
          }));

          if (isSeasonWatched) {
            // Remove all episodes from watched
            for (const episodeItem of episodeItems) {
              await TraktAPI.removeFromWatched('episodes', episodeItem);
            }
            NotificationToast.show(`Season ${seasonNumber} unmarked`, 'success');
          } else {
            // Mark all episodes as watched
            for (const episodeItem of episodeItems) {
              await TraktAPI.markAsWatched('episodes', episodeItem);
            }
            NotificationToast.show(`Season ${seasonNumber} marked as watched!`, 'success');
          }

          // Refresh watched data from Trakt
          await syncWatchedData();
        } else {
          // Fallback to local storage
          const newWatchedSeasons = new Set(watchedSeasons);
          const newWatchedEpisodes = new Set(watchedEpisodes);
          
          if (isSeasonWatched) {
            // Mark season as unwatched
            newWatchedSeasons.delete(seasonNumber);
            // Remove all episodes from this season from watched list
            episodes.forEach(episode => {
              const episodeKey = `${showId}_${seasonNumber}_${episode.episode_number}`;
              newWatchedEpisodes.delete(episodeKey);
            });
          } else {
            // Mark season as watched
            newWatchedSeasons.add(seasonNumber);
            // Add all episodes from this season to watched list
            episodes.forEach(episode => {
              const episodeKey = `${showId}_${seasonNumber}_${episode.episode_number}`;
              newWatchedEpisodes.add(episodeKey);
            });
          }
          
          setWatchedSeasons(newWatchedSeasons);
          setWatchedEpisodes(newWatchedEpisodes);
          localStorage.setItem(`watched_seasons_${showId}`, JSON.stringify([...newWatchedSeasons]));
          localStorage.setItem(`watched_episodes_${showId}`, JSON.stringify([...newWatchedEpisodes]));
        }
      } catch (error) {
        console.error('Error toggling season watched status:', error);
        NotificationToast.show('Error updating season status', 'error');
      }
    };

    const shareShow = () => {
      if (navigator.share) {
        navigator.share({
          title: showDetails.title,
          text: `Check out ${showDetails.title}`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    const formatRuntime = (runtime) => {
      if (!runtime) return '';
      if (runtime < 60) return `${runtime}min`;
      const hours = Math.floor(runtime / 60);
      const mins = runtime % 60;
      return mins > 0 ? `${hours}hr ${mins}min` : `${hours}hr`;
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

    if (!showDetails) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-tv text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Show Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The requested show could not be found</p>
              <button onClick={() => window.location.href = '/shows.html'} className="btn-primary">
                Browse Shows
              </button>
            </div>
          </div>
        </main>
      );
    }

    const streamingPlatforms = TMDB_API.getStreamingPlatforms(showDetails.watchProviders);
    const { directors, writers } = TMDB_API.getKeyCrewMembers(showDetails.crew);

    return (
      <main className="py-0" data-name="show-details-content" data-file="components/ShowDetailsContent.js">
        {/* Premium OTT-Style Hero Section */}
        <div className="relative w-full min-h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${showDetails.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
              <div className="grid lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-3">
                  <img 
                    src={showDetails.poster} 
                    alt={showDetails.title}
                    className="w-full max-w-sm mx-auto lg:max-w-none object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="lg:col-span-9 space-y-8">
                  <div>
                    {showDetails.logo ? (
                      <img 
                        src={showDetails.logo}
                        alt={showDetails.title}
                        className="h-16 md:h-24 lg:h-32 max-w-full object-contain filter drop-shadow-2xl mb-6"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <h1 
                      className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 ${showDetails.logo ? 'hidden' : 'block'}`}
                      style={{ textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 3px 6px rgba(139, 92, 246, 0.4)' }}
                    >
                      {showDetails.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-lg">
                    <span className="font-semibold">
                      {new Date(showDetails.firstAirDate).getFullYear()}
                      {showDetails.lastAirDate && ` - ${new Date(showDetails.lastAirDate).getFullYear()}`}
                    </span>
                    {showDetails.episodeRunTime && (
                      <>
                        <span>•</span>
                        <span>{formatRuntime(showDetails.episodeRunTime)} per episode</span>
                      </>
                    )}
                    <span>•</span>
                    <div className="flex items-center">
                      <div className="icon-star text-yellow-400 mr-2"></div>
                      <span className="font-semibold">{showDetails.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{showDetails.numberOfSeasons} seasons</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {showDetails.genres.map(genre => (
                      <span key={genre.id} className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 backdrop-blur-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {availableProviders.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/70 text-sm font-medium">Available on:</span>
                      <div className="flex space-x-3">
                        {availableProviders.slice(0, 6).map(provider => (
                          <button
                            key={provider.provider_id}
                            onClick={() => provider.link && window.open(provider.link, '_blank')}
                            className="group relative w-10 h-10 rounded-lg overflow-hidden hover:scale-110 transition-transform duration-300"
                            title={`${provider.type} on ${provider.provider_name}`}
                          >
                            <img 
                              src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300"></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-white/90 text-lg leading-relaxed max-w-4xl">
                    {showMoreOverview || showDetails.overview.length <= 200 
                      ? showDetails.overview 
                      : `${showDetails.overview.substring(0, 200)}...`
                    }
                    {showDetails.overview.length > 200 && (
                      <button 
                        onClick={() => setShowMoreOverview(!showMoreOverview)}
                        className="ml-2 text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                      >
                        {showMoreOverview ? 'Less' : 'More'}
                      </button>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setIsWatchlisted(!isWatchlisted)}
                      className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                        isWatchlisted 
                          ? 'bg-white/20 text-white border border-white/40 hover:bg-white/30' 
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      <div className={`icon-${isWatchlisted ? 'check' : 'plus'} mr-3 text-xl`}></div>
                      Watchlist
                    </button>

                    {showDetails.videos && showDetails.videos.length > 0 && (
                      <button 
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center px-6 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="icon-play mr-2"></div>
                        Trailer
                      </button>
                    )}

                    <button 
                      onClick={shareShow}
                      className="flex items-center justify-center w-12 h-12 bg-white/10 text-white border border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300"
                      title="Share"
                    >
                      <div className="icon-share"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="card mb-8">
            <div className="flex flex-wrap gap-2 p-2">
              {[
                { key: 'overview', label: 'Details & Info', icon: 'info', count: null },
                { key: 'episodes', label: 'Episodes', icon: 'list', count: episodes.length },
                { key: 'streaming', label: 'Watch Options', icon: 'play', count: streamingPlatforms.length },
                { key: 'cast', label: 'Cast & Crew', icon: 'users', count: showDetails.cast.length },
                { key: 'similar', label: 'More Like This', icon: 'grid-3x3', count: null },
                { key: 'discussion', label: 'Reviews', icon: 'message-circle', count: comments.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-lg transform scale-105'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-light)] hover:bg-[var(--accent-color)] hover:scale-105'
                  }`}
                >
                  <div className={`icon-${tab.icon} text-lg`}></div>
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.key 
                        ? 'bg-white/20' 
                        : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-info text-[var(--primary-color)] mr-3"></div>
                Show Details
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-light)] mb-4">Synopsis</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{showDetails.overview}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-[var(--text-light)]">First Air Date:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{new Date(showDetails.firstAirDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Seasons:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{showDetails.numberOfSeasons}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Episodes:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{showDetails.numberOfEpisodes}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Rating:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{showDetails.rating.toFixed(1)}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Status:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{showDetails.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {showDetails.genres.map(genre => (
                        <span key={genre.id} className="px-3 py-1 bg-[var(--accent-color)] text-[var(--text-light)] rounded-lg text-sm">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'episodes' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-list text-[var(--primary-color)] mr-3"></div>
                Episodes
              </h2>
              
              {seasons.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {seasons.map(season => (
                      <button
                        key={season.id}
                        onClick={() => {
                          setSelectedSeason(season.season_number);
                          loadEpisodes(showDetails.id, season.season_number);
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                          selectedSeason === season.season_number
                            ? 'bg-[var(--primary-color)] text-white'
                            : 'bg-[var(--accent-color)] text-[var(--text-light)] hover:bg-[var(--primary-color)]/20'
                        }`}
                      >
                        Season {season.season_number}
                        {watchedSeasons.has(season.season_number) && (
                          <div className="icon-check ml-2 text-sm"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[var(--accent-color)] rounded-xl">
                    <div>
                      <h3 className="font-semibold text-[var(--text-light)]">Season {selectedSeason}</h3>
                      <p className="text-[var(--text-muted)] text-sm">
                        {episodes.filter(ep => watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${ep.episode_number}`)).length} of {episodes.length} episodes watched
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSeasonWatched(selectedSeason)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        watchedSeasons.has(selectedSeason)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]'
                      }`}
                    >
                      <div className={`icon-${watchedSeasons.has(selectedSeason) ? 'rotate-ccw' : 'eye'} mr-2`}></div>
                      {watchedSeasons.has(selectedSeason) ? 'Mark Unwatched' : 'Mark Season Watched'}
                    </button>
                  </div>
                </div>
              )}

              {episodesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-[var(--text-muted)]">Loading episodes...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {episodes.map(episode => (
                    <div key={episode.id} className="group cursor-pointer">
                      <div 
                        className="relative overflow-hidden rounded-2xl mb-4 bg-[var(--accent-color)]"
                        onClick={() => {
                          const urlParams = new URLSearchParams(window.location.search);
                          const showId = urlParams.get('id');
                          window.location.href = `episode-details.html?showId=${showId}&season=${selectedSeason}&episode=${episode.episode_number}`;
                        }}
                      >
                        <div className="aspect-video">
                          <img 
                            src={episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : showDetails.backdrop}
                            alt={episode.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Episode Number Badge */}
                          <div className="absolute top-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                            {episode.episode_number}
                          </div>
                          
                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                            <div className="icon-star text-yellow-400 mr-1 text-xs"></div>
                            {episode.vote_average.toFixed(1)}
                          </div>

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="w-16 h-16 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                              <div className="icon-play text-2xl ml-1"></div>
                            </button>
                          </div>

                          {/* Runtime Badge */}
                          {episode.runtime && (
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                              {episode.runtime}min
                            </div>
                          )}

                          {/* Watched Indicator Overlay */}
                          {watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${episode.episode_number}`) && (
                            <div className="absolute inset-0 bg-green-600/30 flex items-center justify-center">
                              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                                <div className="icon-check text-white text-xl"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 
                          className="font-semibold text-[var(--text-light)] text-lg leading-tight group-hover:text-[var(--primary-color)] transition-colors cursor-pointer"
                          onClick={() => {
                            const urlParams = new URLSearchParams(window.location.search);
                            const showId = urlParams.get('id');
                            window.location.href = `episode-details.html?showId=${showId}&season=${selectedSeason}&episode=${episode.episode_number}`;
                          }}
                        >
                          {episode.name}
                        </h4>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-3">{episode.overview}</p>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2">
                          <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => toggleEpisodeWatched(episode.id, episode)}
                              className={`flex items-center space-x-1 transition-colors px-2 py-1 rounded ${
                                watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${episode.episode_number}`)
                                  ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                                  : 'hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10'
                              }`}
                              title={watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${episode.episode_number}`) ? "Mark as unwatched" : "Mark as watched"}
                            >
                              <div className={`icon-${watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${episode.episode_number}`) ? 'eye-off' : 'eye'}`}></div>
                              <span className="text-xs">
                                {watchedEpisodes.has(`${traktShowId}_${selectedSeason}_${episode.episode_number}`) ? 'Watched' : 'Watch'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'streaming' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-play text-[var(--primary-color)] mr-3"></div>
                Watch Options
              </h2>
              {streamingPlatforms.length > 0 ? (
                <div className="space-y-8">
                  {streamingPlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[var(--text-light)] mb-4 flex items-center">
                        <div className={`icon-${platform.icon} mr-2 text-[var(--primary-color)]`}></div>
                        {platform.label || platform.type}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {platform.providers.map(provider => (
                          <div key={provider.provider_id} className="group relative overflow-hidden rounded-2xl bg-[var(--accent-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-all duration-300 hover:scale-105">
                            <div className="aspect-square bg-white/5 flex items-center justify-center p-6">
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                alt={provider.provider_name}
                                className="w-16 h-16 rounded-xl object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <p className="text-[var(--text-light)] text-sm font-medium mb-2 truncate">{provider.provider_name}</p>
                              <button 
                                onClick={() => {
                                  const link = TMDB_API.getProviderLink(provider.provider_name);
                                  if (link) window.open(link, '_blank');
                                }}
                                className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white py-2 px-4 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                              >
                                {platform.label === 'Stream' ? 'Watch Now' : platform.label || 'Watch Now'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                    <div className="icon-tv text-3xl text-[var(--text-muted)]"></div>
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">No streaming information available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-users text-[var(--primary-color)] mr-3"></div>
                Cast & Crew
              </h2>
              
              <div className="space-y-10">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-light)] mb-6">Main Cast</h3>
                  <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                    {showDetails.cast.slice(0, 12).map(actor => (
                      <div 
                        key={actor.id} 
                        className="flex-shrink-0 group cursor-pointer w-32"
                        onClick={() => window.location.href = `cast-details.html?id=${actor.id}`}
                      >
                        <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[3/4] bg-[var(--accent-color)]">
                          <img 
                            src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/185x278/2d2a33/8b5cf6?text=No+Image'}
                            alt={actor.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                            <div className="text-white text-xs">
                              <div className="font-semibold truncate">{actor.name}</div>
                              <div className="text-white/80 truncate">{actor.character}</div>
                            </div>
                          </div>
                        </div>
                        <h4 className="font-medium text-[var(--text-light)] text-sm mb-1 truncate group-hover:text-[var(--primary-color)] transition-colors">{actor.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-light)] mb-6">Crew</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {directors.map(director => (
                      <div key={director.id} className="card-compact">
                        <h4 className="font-medium text-[var(--text-light)] text-sm">{director.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs">Director</p>
                      </div>
                    ))}
                    {writers.map(writer => (
                      <div key={writer.id} className="card-compact">
                        <h4 className="font-medium text-[var(--text-light)] text-sm">{writer.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs">Writer</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-grid-3x3 text-[var(--primary-color)] mr-3"></div>
                More Like This
              </h2>
              {similarShows.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {similarShows.map(show => (
                    <div key={show.id} className="group cursor-pointer" onClick={() => window.location.href = `show-details.html?id=${show.id}`}>
                      <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[2/3] bg-[var(--accent-color)]">
                        <img 
                          src={show.poster}
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                          <div className="icon-star text-yellow-400 mr-1 text-xs"></div>
                          {show.rating.toFixed(1)}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button 
                            className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white text-xs py-2 px-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `show-details.html?id=${show.id}`;
                            }}
                          >
                            More Info
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{show.title}</h4>
                      <p className="text-[var(--text-muted)] text-xs">{show.year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                    <div className="icon-tv text-3xl text-[var(--text-muted)]"></div>
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">No similar shows found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
                <div className="icon-message-circle text-[var(--primary-color)] mr-3"></div>
                Reviews & Discussion
              </h2>
              
              {/* AceSync Meter at top of Reviews */}
              <div className="mb-8 flex justify-center">
                <AceMeter
                  type="show"
                  itemId={showDetails.id || new URLSearchParams(window.location.search).get('id')}
                  traktScore={showDetails.rating}
                  tmdbScore={showDetails.vote_average}
                  onVote={async (rating, score) => {
                    try {
                      const showId = new URLSearchParams(window.location.search).get('id');
                      await TraktAPI.rateShow(showId, Math.round(score * 10));
                      NotificationToast.show(`Rated as ${rating}!`, 'success');
                    } catch (error) {
                      NotificationToast.show('Rating saved locally', 'info');
                    }
                  }}
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="card-compact">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          {comment.author[0]}
                        </div>
                        <span className="font-medium text-[var(--text-light)]">{comment.author}</span>
                        <span className="text-[var(--text-muted)] text-sm ml-auto">{comment.date}</span>
                      </div>
                      <p className="text-[var(--text-muted)]">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-[var(--border-color)] pt-6">
                  <h3 className="font-semibold text-[var(--text-light)] mb-4">Add Your Review</h3>
                  <div className="space-y-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this show..."
                      className="w-full p-4 bg-[var(--accent-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-light)] placeholder-[var(--text-muted)] resize-none h-24 focus:border-[var(--primary-color)] focus:outline-none transition-colors"
                    />
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        if (newComment.trim()) {
                          const urlParams = new URLSearchParams(window.location.search);
                          const showId = urlParams.get('id');
                          const newCommentObj = {
                            author: 'Anonymous User',
                            content: newComment,
                            date: new Date().toLocaleDateString()
                          };
                          const updatedComments = [...comments, newCommentObj];
                          setComments(updatedComments);
                          localStorage.setItem(`show_comments_${showId}`, JSON.stringify(updatedComments));
                          setNewComment('');
                        }
                      }}
                    >
                      Post Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trailer Modal */}
        {showTrailer && showDetails.videos && showDetails.videos.length > 0 && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--text-light)]">Trailer</h3>
                <button 
                  onClick={() => setShowTrailer(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-light)] transition-colors"
                >
                  <div className="icon-x text-2xl"></div>
                </button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${showDetails.videos[0].key}${(() => {
                    const settings = JSON.parse(localStorage.getItem('acesync_settings') || '{}');
                    return settings.trailerAutoplay !== false ? '?autoplay=1' : '';
                  })()}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </main>
    );

  } catch (error) {
    console.error('ShowDetailsContent component error:', error);
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