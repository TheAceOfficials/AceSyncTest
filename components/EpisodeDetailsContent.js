function EpisodeDetailsContent() {
  try {
    const [episodeDetails, setEpisodeDetails] = React.useState(null);
    const [showDetails, setShowDetails] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [isWatched, setIsWatched] = React.useState(false);
    const [userRating, setUserRating] = React.useState(0);
    const [otherEpisodes, setOtherEpisodes] = React.useState([]);

    React.useEffect(() => {
      const loadEpisodeDetails = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const showId = urlParams.get('showId');
        const seasonNumber = urlParams.get('season');
        const episodeNumber = urlParams.get('episode');
        
        if (!showId || !seasonNumber || !episodeNumber) {
          // Create mock data if parameters are missing
          setShowDetails(createMockShowData());
          setEpisodeDetails(createMockEpisodeData());
          setOtherEpisodes(createMockOtherEpisodes());
          setLoading(false);
          return;
        }

        try {
          // Try to load real data first
          const [show, episodes] = await Promise.all([
            TMDB_API.getShowDetails(showId),
            TMDB_API.getSeasonEpisodes(showId, seasonNumber)
          ]);

          if (show && episodes) {
            setShowDetails(show);
            
            // Find the specific episode
            const episode = episodes.find(ep => ep.episode_number === parseInt(episodeNumber));
            if (episode) {
              setEpisodeDetails({
                ...episode,
                showId,
                seasonNumber: parseInt(seasonNumber)
              });
              
              // Get other episodes from the same season
              const otherEps = episodes.filter(ep => ep.episode_number !== parseInt(episodeNumber));
              setOtherEpisodes(otherEps.slice(0, 6));
            } else {
              // Episode not found, use mock data
              setEpisodeDetails(createMockEpisodeData(showId, seasonNumber, episodeNumber));
              setOtherEpisodes(createMockOtherEpisodes());
            }
          } else {
            // API failed, use mock data
            setShowDetails(createMockShowData());
            setEpisodeDetails(createMockEpisodeData(showId, seasonNumber, episodeNumber));
            setOtherEpisodes(createMockOtherEpisodes());
          }

          // Load comments
          const savedComments = localStorage.getItem(`episode_comments_${showId}_${seasonNumber}_${episodeNumber}`);
          if (savedComments) {
            setComments(JSON.parse(savedComments));
          }

          // Load watched status from local storage
          const watchedKey = `${seasonNumber}_${episodeNumber}`;
          const localWatchedData = JSON.parse(localStorage.getItem(`show_${showId}_episodes_watched`) || '{}');
          const localWatched = !!localWatchedData[watchedKey];
          
          setIsWatched(localWatched);

        } catch (error) {
          console.error('Failed to load episode details:', error);
          // Use mock data as fallback
          setShowDetails(createMockShowData());
          setEpisodeDetails(createMockEpisodeData(showId, seasonNumber, episodeNumber));
          setOtherEpisodes(createMockOtherEpisodes());
        } finally {
          setLoading(false);
        }
      };

      loadEpisodeDetails();
    }, []);

    const createMockShowData = () => ({
      id: 'mock-show',
      title: 'Breaking Bad',
      backdrop: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
    });

    const createMockEpisodeData = (showId = 'mock-show', season = '1', episode = '1') => ({
      id: `mock-ep-${episode}`,
      episode_number: parseInt(episode),
      seasonNumber: parseInt(season),
      showId: showId,
      name: 'Pilot',
      overview: 'The series begins when Walter White, a struggling high school chemistry teacher, is diagnosed with stage III lung cancer.',
      still_path: null,
      air_date: '2008-01-20',
      runtime: 58,
      vote_average: 8.2,
      vote_count: 1200
    });

    const createMockOtherEpisodes = () => [
      {
        id: 2,
        episode_number: 2,
        name: 'Cat\'s in the Bag...',
        overview: 'Walter and Jesse attempt to tie up loose ends.',
        still_path: null,
        air_date: '2008-01-27',
        vote_average: 8.1
      },
      {
        id: 3,
        episode_number: 3,
        name: '...And the Bag\'s in the River',
        overview: 'Walter makes a decision about Krazy-8.',
        still_path: null,
        air_date: '2008-02-10',
        vote_average: 8.3
      }
    ];

    const handleAddComment = () => {
      if (!newComment.trim()) return;
      
      const comment = {
        id: Date.now(),
        text: newComment,
        author: 'Current User',
        timestamp: new Date().toISOString(),
        likes: 0
      };
      
      const updatedComments = [comment, ...comments];
      setComments(updatedComments);
      setNewComment('');
      
      const urlParams = new URLSearchParams(window.location.search);
      const showId = urlParams.get('showId');
      const seasonNumber = urlParams.get('season');
      const episodeNumber = urlParams.get('episode');
      localStorage.setItem(`episode_comments_${showId}_${seasonNumber}_${episodeNumber}`, JSON.stringify(updatedComments));
    };

    const handleWatchedToggle = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const showId = urlParams.get('showId');
      const seasonNumber = urlParams.get('season');
      
      const watchedKey = `${seasonNumber}_${episodeDetails.id}`;
      const currentWatched = JSON.parse(localStorage.getItem(`show_${showId}_episodes_watched`) || '{}');
      
      if (isWatched) {
        delete currentWatched[watchedKey];
        setIsWatched(false);
      } else {
        currentWatched[watchedKey] = true;
        setIsWatched(true);
      }
      
      localStorage.setItem(`show_${showId}_episodes_watched`, JSON.stringify(currentWatched));
    };

    const formatRuntime = (minutes) => {
      if (!minutes) return 'Unknown';
      if (minutes < 60) return `${minutes}min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
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

    if (!episodeDetails || !showDetails) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-tv text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Episode Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The requested episode could not be found</p>
              <button onClick={() => window.location.href = '/shows.html'} className="btn-primary">
                Browse Shows
              </button>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="py-8 px-4" data-name="episode-details-content" data-file="components/EpisodeDetailsContent.js">
        <div className="max-w-6xl mx-auto">
          {/* Episode Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden mb-8 min-h-[60vh]">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105 transform"
              style={{ 
                backgroundImage: `url(${
                  episodeDetails.still_path 
                    ? `https://image.tmdb.org/t/p/w1280${episodeDetails.still_path}` 
                    : showDetails.backdrop
                })` 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30"></div>
            </div>

            <div className="relative z-10 p-8 md:p-12 flex items-end min-h-[60vh]">
              <div className="w-full">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <button 
                        onClick={() => window.location.href = `show-details.html?id=${episodeDetails.showId}`}
                        className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium text-lg transition-colors"
                      >
                        {showDetails.title}
                      </button>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300">Season {episodeDetails.seasonNumber}</span>
                    </div>
                    
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                      Episode {episodeDetails.episode_number}: {episodeDetails.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      {episodeDetails.air_date && (
                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-full">
                          <div className="icon-calendar text-[var(--primary-color)] mr-2"></div>
                          <span className="text-white font-medium">
                            {new Date(episodeDetails.air_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {episodeDetails.runtime && (
                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-full">
                          <div className="icon-clock text-[var(--gradient-to)] mr-2"></div>
                          <span className="text-white font-medium">{formatRuntime(episodeDetails.runtime)}</span>
                        </div>
                      )}
                      {episodeDetails.vote_average > 0 && (
                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-full">
                          <div className="icon-star text-yellow-400 mr-2"></div>
                          <span className="text-white font-medium text-lg">{episodeDetails.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {episodeDetails.overview && (
                      <p className="text-gray-100 text-lg leading-relaxed mb-8 max-w-4xl font-light">
                        {episodeDetails.overview}
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleWatchedToggle}
                        className={`flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                          isWatched 
                            ? 'bg-green-600 hover:bg-green-500 text-white' 
                            : 'btn-primary'
                        }`}
                      >
                        <div className={`icon-${isWatched ? 'check' : 'eye'} mr-3 text-xl`}></div>
                        {isWatched ? 'Watched' : 'Mark as Watched'}
                      </button>
                      
                      <button 
                        onClick={() => window.location.href = `show-details.html?id=${episodeDetails.showId}`}
                        className="flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all duration-300 border border-white/30 backdrop-blur-sm"
                      >
                        <div className="icon-tv mr-3 text-xl"></div>
                        View Show
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="card mb-8">
            <div className="flex flex-wrap gap-2 p-2">
              {[
                { key: 'overview', label: 'Episode Info', icon: 'info' },
                { key: 'other', label: 'Other Episodes', icon: 'list' },
                { key: 'discussion', label: 'Reviews', icon: 'message-circle' }
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
                  {tab.key === 'discussion' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.key 
                        ? 'bg-white/20' 
                        : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]'
                    }`}>
                      {comments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6">Episode Details</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] mb-2">Show</h3>
                    <button 
                      onClick={() => window.location.href = `show-details.html?id=${episodeDetails.showId}`}
                      className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] transition-colors"
                    >
                      {showDetails.title}
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] mb-2">Season</h3>
                    <p className="text-[var(--text-muted)]">Season {episodeDetails.seasonNumber}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] mb-2">Episode Number</h3>
                    <p className="text-[var(--text-muted)]">Episode {episodeDetails.episode_number}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] mb-2">Air Date</h3>
                    <p className="text-[var(--text-muted)]">
                      {episodeDetails.air_date 
                        ? new Date(episodeDetails.air_date).toLocaleDateString() 
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-light)] mb-2">Runtime</h3>
                    <p className="text-[var(--text-muted)]">{formatRuntime(episodeDetails.runtime)}</p>
                  </div>
                  {episodeDetails.vote_average > 0 && (
                    <div>
                      <h3 className="font-semibold text-[var(--text-light)] mb-2">Rating</h3>
                      <div className="flex items-center">
                        <div className="icon-star text-yellow-400 mr-2"></div>
                        <span className="text-[var(--text-light)]">{episodeDetails.vote_average.toFixed(1)}/10</span>
                        {episodeDetails.vote_count && (
                          <span className="text-[var(--text-muted)] ml-2">({episodeDetails.vote_count} votes)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'other' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6">More from Season {episodeDetails.seasonNumber}</h2>
              {otherEpisodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherEpisodes.map(episode => (
                    <div 
                      key={episode.id}
                      onClick={() => window.location.href = `episode-details.html?showId=${episodeDetails.showId}&season=${episodeDetails.seasonNumber}&episode=${episode.episode_number}`}
                      className="card-compact cursor-pointer hover:scale-105 transition-transform"
                    >
                      {episode.still_path && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                          alt={episode.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-[var(--text-light)] text-sm mb-1">
                        Episode {episode.episode_number}: {episode.name}
                      </h3>
                      {episode.overview && (
                        <p className="text-[var(--text-muted)] text-xs line-clamp-2 mb-2">
                          {episode.overview}
                        </p>
                      )}
                      {episode.vote_average > 0 && (
                        <div className="flex items-center">
                          <div className="icon-star text-yellow-400 text-xs mr-1"></div>
                          <span className="text-[var(--text-muted)] text-xs">{episode.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="icon-tv text-4xl text-[var(--text-muted)] mb-4"></div>
                  <p className="text-[var(--text-muted)]">No other episodes available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-xl font-bold text-[var(--text-light)] mb-4">Rate This Episode</h3>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex space-x-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setUserRating(rating)}
                        className={`w-8 h-8 rounded-full transition-colors ${
                          rating <= userRating 
                            ? 'bg-[var(--primary-color)] text-white' 
                            : 'bg-[var(--accent-color)] text-[var(--text-muted)] hover:bg-[var(--primary-color)]/30'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  {userRating > 0 && (
                    <span className="text-[var(--primary-color)] font-semibold">You rated: {userRating}/10</span>
                  )}
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6">Episode Reviews</h2>
                
                <div className="mb-6 p-6 bg-gradient-to-r from-[var(--secondary-color)] to-[var(--accent-color)] rounded-2xl border border-[var(--border-color)]">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this episode..."
                    className="w-full bg-[var(--card-bg)] text-[var(--text-light)] p-4 rounded-xl border border-[var(--border-color)] resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] placeholder-[var(--text-muted)]"
                  />
                  <button onClick={handleAddComment} className="mt-4 btn-primary">
                    Post Review
                  </button>
                </div>

                <div className="space-y-6">
                  {comments.map(comment => (
                    <div key={comment.id} className="p-6 bg-gradient-to-r from-[var(--secondary-color)]/50 to-[var(--accent-color)]/30 rounded-2xl border border-[var(--border-color)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary-color)] to-[var(--gradient-to)] rounded-full flex items-center justify-center">
                            <div className="icon-user text-white"></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--text-light)]">{comment.author}</h4>
                            <span className="text-[var(--text-muted)] text-sm">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[var(--text-light)] mb-4 leading-relaxed">{comment.text}</p>
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">
                          <div className="icon-thumbs-up text-lg"></div>
                          <span>{comment.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="icon-message-circle text-4xl text-[var(--primary-color)] mb-4"></div>
                      <h3 className="text-lg font-semibold text-[var(--text-light)] mb-2">No reviews yet</h3>
                      <p className="text-[var(--text-muted)]">Be the first to share your thoughts about this episode!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('EpisodeDetailsContent component error:', error);
    return null;
  }
}