function AnimeDetailsContent() {
  try {
    const [animeDetails, setAnimeDetails] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [isWatched, setIsWatched] = React.useState(false);
    const [isWatchlisted, setIsWatchlisted] = React.useState(false);
    const [userRating, setUserRating] = React.useState(0);
    const [showTrailer, setShowTrailer] = React.useState(false);
    const [watchCount, setWatchCount] = React.useState(0);
    const [similarAnime, setSimilarAnime] = React.useState([]);
    const [showMoreOverview, setShowMoreOverview] = React.useState(false);
    const [availableProviders, setAvailableProviders] = React.useState([]);
    const [watchedEpisodes, setWatchedEpisodes] = React.useState(new Set());

    React.useEffect(() => {
      loadAnimeDetails();
    }, []);

    const loadAnimeDetails = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const animeId = urlParams.get('id');

        if (!animeId) {
          setLoading(false);
          return;
        }

        const details = await AniListAPI.getAnimeDetails(animeId);
        if (details) {
          setAnimeDetails(details);
          loadSimilarAnime(animeId);
        } else {
          setAnimeDetails(getMockAnimeDetails());
        }
        
        const savedComments = localStorage.getItem(`anime_comments_${animeId}`);
        if (savedComments) {
          setComments(JSON.parse(savedComments));
        }

        const savedWatchCount = localStorage.getItem(`anime_watch_count_${animeId}`);
        if (savedWatchCount) {
          setWatchCount(parseInt(savedWatchCount));
          setIsWatched(parseInt(savedWatchCount) > 0);
        }

        const savedWatchedEpisodes = localStorage.getItem(`watched_anime_episodes_${animeId}`);
        if (savedWatchedEpisodes) {
          setWatchedEpisodes(new Set(JSON.parse(savedWatchedEpisodes)));
        }
      } catch (error) {
        console.error('Error loading anime details:', error);
        setAnimeDetails(getMockAnimeDetails());
      }
      setLoading(false);
    };

    const loadSimilarAnime = async (animeId) => {
      try {
        const similar = await AniListAPI.getTrendingAnime(12);
        setSimilarAnime(similar.slice(0, 12).map(anime => ({
          id: anime.id,
          title: anime.title?.english || anime.title?.romaji || anime.title?.native,
          poster: anime.coverImage?.large || anime.coverImage?.medium,
          rating: anime.averageScore ? anime.averageScore / 10 : 0,
          year: anime.startDate?.year || 'TBA'
        })));
      } catch (error) {
        console.error('Error loading similar anime:', error);
      }
    };

    const getMockAnimeDetails = () => ({
      id: 16498,
      title: 'Attack on Titan',
      poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      backdrop: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      logo: null,
      rating: 9.0,
      year: 2013,
      firstAirDate: '2013-04-07',
      lastAirDate: '2023-04-09',
      status: 'Completed',
      numberOfSeasons: 4,
      numberOfEpisodes: 87,
      episodeRunTime: 24,
      genres: [{id: 1, name: 'Action'}, {id: 2, name: 'Drama'}, {id: 3, name: 'Fantasy'}],
      overview: 'Humanity fights for survival against giant humanoid Titans in this epic dark fantasy series. When the Titans breach Wall Maria, Eren Yeager joins the Survey Corps to fight back and discover the truth behind the Titans origin and their connection to humanity.',
      cast: [
        {id: 1, name: 'Eren Yeager', character: 'Main Character', profile_path: '/path1.jpg'},
        {id: 2, name: 'Mikasa Ackerman', character: 'Main Character', profile_path: '/path2.jpg'}
      ],
      crew: [
        {id: 1, name: 'Hajime Isayama', job: 'Creator', department: 'Writing'},
        {id: 2, name: 'Tetsuro Araki', job: 'Director', department: 'Directing'}
      ],
      videos: [{key: 'dQw4w9WgXcQ', type: 'Trailer'}],
      watchProviders: {
        results: {
          US: {
            flatrate: [{provider_id: 1, provider_name: 'Crunchyroll', logo_path: '/crunchyroll.jpg'}],
            buy: [{provider_id: 2, provider_name: 'Amazon Prime', logo_path: '/amazon.jpg'}],
            rent: [{provider_id: 3, provider_name: 'Funimation', logo_path: '/funimation.jpg'}]
          }
        }
      }
    });

    const handleWatchedToggle = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const animeId = urlParams.get('id');
      
      if (isWatched) {
        setWatchCount(0);
        setIsWatched(false);
        localStorage.removeItem(`anime_watch_count_${animeId}`);
      } else {
        const newCount = watchCount + 1;
        setWatchCount(newCount);
        setIsWatched(true);
        localStorage.setItem(`anime_watch_count_${animeId}`, newCount.toString());
      }
    };

    const shareAnime = () => {
      if (navigator.share) {
        navigator.share({
          title: animeDetails.title,
          text: `Check out ${animeDetails.title}`,
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

    if (!animeDetails) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-tv text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Anime Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The requested anime could not be found</p>
              <button onClick={() => window.location.href = '/anime.html'} className="btn-primary">
                Browse Anime
              </button>
            </div>
          </div>
        </main>
      );
    }

    const streamingPlatforms = [
      {
        type: 'Stream',
        label: 'Stream',
        icon: 'play',
        providers: animeDetails.watchProviders?.results?.US?.flatrate || []
      },
      {
        type: 'Buy',
        label: 'Buy',
        icon: 'shopping-cart',
        providers: animeDetails.watchProviders?.results?.US?.buy || []
      },
      {
        type: 'Rent',
        label: 'Rent',
        icon: 'credit-card',
        providers: animeDetails.watchProviders?.results?.US?.rent || []
      }
    ].filter(platform => platform.providers.length > 0);

    const { directors, writers } = {
      directors: (animeDetails.crew || []).filter(member => member.department === 'Directing'),
      writers: (animeDetails.crew || []).filter(member => member.department === 'Writing')
    };

    return (
      <main className="py-0" data-name="anime-details-content" data-file="components/AnimeDetailsContent.js">
        {/* Premium OTT-Style Hero Section */}
        <div className="relative w-full min-h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${animeDetails.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
              <div className="grid lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-3">
                  <img 
                    src={animeDetails.poster} 
                    alt={animeDetails.title}
                    className="w-full max-w-sm mx-auto lg:max-w-none object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="lg:col-span-9 space-y-8">
                  <div>
                    {animeDetails.logo ? (
                      <img 
                        src={animeDetails.logo}
                        alt={animeDetails.title}
                        className="h-16 md:h-24 lg:h-32 max-w-full object-contain filter drop-shadow-2xl mb-6"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <h1 
                      className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 ${animeDetails.logo ? 'hidden' : 'block'}`}
                      style={{ textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 3px 6px rgba(139, 92, 246, 0.4)' }}
                    >
                      {animeDetails.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-lg">
                    <span className="font-semibold">
                      {new Date(animeDetails.firstAirDate).getFullYear()}
                      {animeDetails.lastAirDate && ` - ${new Date(animeDetails.lastAirDate).getFullYear()}`}
                    </span>
                    {animeDetails.episodeRunTime && (
                      <>
                        <span>•</span>
                        <span>{formatRuntime(animeDetails.episodeRunTime)} per episode</span>
                      </>
                    )}
                    <span>•</span>
                    <div className="flex items-center">
                      <div className="icon-star text-yellow-400 mr-2"></div>
                      <span className="font-semibold">{(animeDetails.rating || 0).toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{animeDetails.numberOfSeasons} seasons</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(animeDetails.genres || []).map(genre => (
                      <span key={genre.id} className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 backdrop-blur-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {streamingPlatforms.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/70 text-sm font-medium">Available on:</span>
                      <div className="flex space-x-3">
                        {streamingPlatforms[0].providers.slice(0, 6).map(provider => (
                          <button
                            key={provider.provider_id}
                            className="group relative w-10 h-10 rounded-lg overflow-hidden hover:scale-110 transition-transform duration-300"
                            title={`${streamingPlatforms[0].type} on ${provider.provider_name}`}
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
                    {showMoreOverview || (animeDetails.overview || '').length <= 200 
                      ? (animeDetails.overview || 'No overview available') 
                      : `${(animeDetails.overview || '').substring(0, 200)}...`
                    }
                    {(animeDetails.overview || '').length > 200 && (
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

                    {animeDetails.videos && animeDetails.videos.length > 0 && (
                      <button 
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center px-6 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="icon-play mr-2"></div>
                        Trailer
                      </button>
                    )}

                    <button 
                      onClick={shareAnime}
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
                { key: 'episodes', label: 'Episodes', icon: 'list', count: animeDetails.numberOfEpisodes || 0 },
                { key: 'streaming', label: 'Watch Options', icon: 'play', count: streamingPlatforms.length },
                { key: 'cast', label: 'Cast & Crew', icon: 'users', count: (animeDetails.cast || []).length },
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
                Anime Details
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-light)] mb-4">Synopsis</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">{animeDetails.overview || 'No synopsis available'}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-[var(--text-light)]">First Air Date:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{new Date(animeDetails.firstAirDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Seasons:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{animeDetails.numberOfSeasons}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Episodes:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{animeDetails.numberOfEpisodes}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Rating:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{(animeDetails.rating || 0).toFixed(1)}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Status:</span>
                    <span className="ml-2 text-[var(--text-muted)]">{animeDetails.status || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-light)]">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(animeDetails.genres || []).map(genre => (
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
              
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                  <div className="icon-tv text-3xl text-[var(--text-muted)]"></div>
                </div>
                <p className="text-[var(--text-muted)] text-lg">Episode information not available</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">This anime has {animeDetails.numberOfEpisodes} episodes</p>
              </div>
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
                              <button className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white py-2 px-4 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
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
                    {(animeDetails.cast || []).slice(0, 12).map(actor => (
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
              {similarAnime.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {similarAnime.map(anime => (
                    <div key={anime.id} className="group cursor-pointer" onClick={() => window.location.href = `anime-details.html?id=${anime.id}`}>
                      <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[2/3] bg-[var(--accent-color)]">
                        <img 
                          src={anime.poster}
                          alt={anime.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                          <div className="icon-star text-yellow-400 mr-1 text-xs"></div>
                          {anime.rating.toFixed(1)}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button 
                            className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white text-xs py-2 px-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `anime-details.html?id=${anime.id}`;
                            }}
                          >
                            More Info
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-[var(--text-light)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">{anime.title}</h4>
                      <p className="text-[var(--text-muted)] text-xs">{anime.year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                    <div className="icon-tv text-3xl text-[var(--text-muted)]"></div>
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">No similar anime found</p>
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
                      placeholder="Share your thoughts about this anime..."
                      className="w-full p-4 bg-[var(--accent-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-light)] placeholder-[var(--text-muted)] resize-none h-24 focus:border-[var(--primary-color)] focus:outline-none transition-colors"
                    />
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        if (newComment.trim()) {
                          const urlParams = new URLSearchParams(window.location.search);
                          const animeId = urlParams.get('id');
                          const newCommentObj = {
                            author: 'Anonymous User',
                            content: newComment,
                            date: new Date().toLocaleDateString()
                          };
                          const updatedComments = [...comments, newCommentObj];
                          setComments(updatedComments);
                          localStorage.setItem(`anime_comments_${animeId}`, JSON.stringify(updatedComments));
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

        {/* AceSync Meter Rating System - Bottom Center */}
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex justify-center">
            <AceMeter
              type="anime"
              itemId={animeDetails.id || new URLSearchParams(window.location.search).get('id')}
              traktScore={animeDetails.rating}
              tmdbScore={animeDetails.averageScore ? animeDetails.averageScore / 10 : null}
              onVote={async (rating, score) => {
                try {
                  NotificationToast.show(`Rated as ${rating}!`, 'success');
                } catch (error) {
                  NotificationToast.show('Rating saved locally', 'info');
                }
              }}
            />
          </div>
        </div>

        {/* Trailer Modal */}
        {showTrailer && animeDetails.videos && animeDetails.videos.length > 0 && (
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
                  src={`https://www.youtube.com/embed/${animeDetails.videos[0].key}${(() => {
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
    console.error('AnimeDetailsContent component error:', error);
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
