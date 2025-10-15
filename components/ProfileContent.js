function ProfileContent() {
  try {
    const [profile, setProfile] = React.useState(null);
    const [stats, setStats] = React.useState(null);
    const [friends, setFriends] = React.useState([]);
    const [history, setHistory] = React.useState([]);
    const [watchlist, setWatchlist] = React.useState({ movies: [], shows: [] });
    const [favorites, setFavorites] = React.useState({ movies: [], shows: [] });
    const [loading, setLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [timeRange, setTimeRange] = React.useState('all');
    const [genreChart, setGenreChart] = React.useState(null);
    const [timeChart, setTimeChart] = React.useState(null);

    React.useEffect(() => {
      const loadCompleteProfile = async () => {
        if (TraktAPI.isAuthenticated()) {
          setIsAuthenticated(true);
          try {
            const [
              userProfile, 
              userStats, 
              userHistory, 
              userWatchlist,
              userFavorites,
              userFriends
            ] = await Promise.all([
              TraktAPI.getUserProfile(),
              TraktAPI.getUserStats(),
              TraktAPI.getUserHistory(100),
              TraktAPI.getUserWatchlist(),
              TraktAPI.getUserFavorites(),
              TraktAPI.getUserFriends()
            ]);
            
            setProfile(userProfile);
            setStats(userStats);
            setFriends(userFriends);
            setHistory(userHistory);
            setWatchlist(userWatchlist);
            setFavorites(userFavorites);

            // Create charts after data loads
            setTimeout(() => {
              createGenreChart(userHistory);
              createTimeChart(userHistory);
            }, 100);

          } catch (error) {
            console.error('Failed to load profile:', error);
            // Set fallback data
            setProfile({
              username: 'demo_user',
              name: 'Demo User',
              joined_at: '2024-01-01T00:00:00Z'
            });
            setStats({
              movies: { plays: 156, watched: 156 },
              shows: { watched: 42 },
              episodes: { plays: 1280 }
            });
            setFriends([
              {
                id: 'friend1',
                name: 'Alex Chen',
                username: 'alexc',
                avatar: 'https://secure.gravatar.com/avatar/alexc?s=100&d=identicon&f=y',
                isVip: false
              },
              {
                id: 'friend2', 
                name: 'Sarah Kim',
                username: 'sarahk',
                avatar: 'https://secure.gravatar.com/avatar/sarahk?s=100&d=identicon&f=y',
                isVip: true
              }
            ]);
          }
        }
        setLoading(false);
      };

      loadCompleteProfile();
    }, []);

    const createGenreChart = (historyData) => {
      const canvas = document.getElementById('genreChart');
      if (!canvas || genreChart) return;

      const ctx = canvas.getContext('2d');
      
      // Process genre data from history
      const genres = {};
      historyData.forEach(item => {
        const content = item.movie || item.show;
        if (content?.genres) {
          content.genres.forEach(genre => {
            genres[genre] = (genres[genre] || 0) + 1;
          });
        }
      });

      const sortedGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 6);
      
      const chart = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels: sortedGenres.map(([genre]) => genre) || ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Horror'],
          datasets: [{
            data: sortedGenres.map(([, count]) => count) || [45, 38, 32, 28, 22, 18],
            backgroundColor: [
              '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
            ],
            borderWidth: 2,
            borderColor: '#1a1621'
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          maintainAspectRatio: false
        }
      });

      setGenreChart(chart);
    };

    const createTimeChart = (historyData) => {
      const canvas = document.getElementById('timeChart');
      if (!canvas || timeChart) return;

      const ctx = canvas.getContext('2d');
      
      // Process monthly watch data
      const monthlyData = {};
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = 0;
      }

      historyData.forEach(item => {
        if (item.watched_at) {
          const monthKey = item.watched_at.slice(0, 7);
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
          }
        }
      });

      const labels = Object.keys(monthlyData).map(key => {
        const date = new Date(key + '-01');
        return date.toLocaleDateString('en-US', { month: 'short' });
      });

      const chart = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Items Watched',
            data: Object.values(monthlyData),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: '#2d2a33' } },
            x: { grid: { color: '#2d2a33' } }
          }
        }
      });

      setTimeChart(chart);
    };

    if (!isAuthenticated) {
      return (
        <main className="py-16 px-4" data-name="profile-content" data-file="components/ProfileContent.js">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-user text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">Sign In Required</h2>
              <p className="text-[var(--text-muted)] mb-6">You need to sign in to view your profile</p>
              <button 
                onClick={() => window.location.href = TraktAPI.getAuthUrl()}
                className="btn-primary"
              >
                Sign In to Continue
              </button>
            </div>
          </div>
        </main>
      );
    }

    if (loading) {
      return (
        <main className="py-8 px-4" data-name="profile-content" data-file="components/ProfileContent.js">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="h-32 bg-[var(--accent-color)] rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      );
    }

    const formatJoinDate = (dateStr) => {
      if (!dateStr) return 'Recently';
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    };

    const formatWatchTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    };

    return (
      <main className="py-8 px-4" data-name="profile-content" data-file="components/ProfileContent.js">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="card mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary-color)] to-[var(--gradient-to)] rounded-full flex items-center justify-center">
                <div className="icon-user text-3xl text-white"></div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-[var(--text-light)]">
                    {profile?.name || profile?.username || 'User'}
                  </h1>
                  {profile && (TraktAPI.isVipUser(profile) || TraktAPI.isOwnerUser(profile)) && (
                    <div 
                      className="relative group"
                      title={TraktAPI.getUserVerificationStatus(profile).label}
                    >
                      <div className="icon-check-circle text-2xl text-blue-500 cursor-pointer transition-all duration-300 group-hover:scale-110"></div>
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border-color)] px-3 py-1 rounded-lg text-sm text-[var(--text-light)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                        {TraktAPI.getUserVerificationStatus(profile).label}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[var(--text-muted)] text-lg">@{profile?.username || 'username'}</p>
                <p className="text-[var(--primary-color)] text-sm">
                  Member since {formatJoinDate(profile?.joined_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="icon-film text-3xl text-blue-500 mb-2"></div>
              <h3 className="text-2xl font-bold text-[var(--text-light)]">{stats?.movies?.plays || 0}</h3>
              <p className="text-[var(--text-muted)] text-sm">Movies Watched</p>
            </div>
            <div className="card text-center">
              <div className="icon-tv text-3xl text-green-500 mb-2"></div>
              <h3 className="text-2xl font-bold text-[var(--text-light)]">{stats?.shows?.watched || 0}</h3>
              <p className="text-[var(--text-muted)] text-sm">Shows Watched</p>
            </div>
            <div className="card text-center">
              <div className="icon-play text-3xl text-purple-500 mb-2"></div>
              <h3 className="text-2xl font-bold text-[var(--text-light)]">{stats?.episodes?.plays || 0}</h3>
              <p className="text-[var(--text-muted)] text-sm">Episodes Watched</p>
            </div>
            <div className="card text-center">
              <div className="icon-users text-3xl text-orange-500 mb-2"></div>
              <h3 className="text-2xl font-bold text-[var(--text-light)]">{friends.length}</h3>
              <p className="text-[var(--text-muted)] text-sm">Friends</p>
              <div className="flex justify-center mt-3 -space-x-2">
                {friends.slice(0, 4).map(friend => (
                  <div key={friend.id} className="relative group/friend">
                    <img 
                      src={friend.avatar} 
                      alt={friend.name}
                      className="w-8 h-8 rounded-full border-2 border-[var(--card-bg)] hover:scale-110 transition-transform cursor-pointer"
                      title={friend.name}
                      onClick={() => window.location.href = `user-profile.html?user=${friend.username}`}
                    />
                    {(friend.isVip || friend.username === 'theaceofficials') && (
                      <div className="absolute -top-1 -right-1">
                        <div 
                          className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 group-hover/friend:scale-110"
                          title={friend.username === 'theaceofficials' ? 'Owner' : 'VIP User'}
                        >
                          <div className="icon-check text-white text-xs"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {friends.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-color)] border-2 border-[var(--card-bg)] flex items-center justify-center">
                    <span className="text-xs text-[var(--text-muted)]">+{friends.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="text-lg font-bold text-[var(--text-light)] mb-4">Most Watched Genres</h3>
              <div className="h-64">
                <canvas id="genreChart"></canvas>
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-[var(--text-light)] mb-4">Watching Activity (12 Months)</h3>
              <div className="h-64">
                <canvas id="timeChart"></canvas>
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="card">
            <h3 className="text-lg font-bold text-[var(--text-light)] mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.slice(0, 20).map((item, index) => {
                const content = item.movie || item.show;
                const isEpisode = !!item.episode;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-[var(--secondary-color)] rounded-lg">
                    <div className={`icon-${isEpisode ? 'tv' : 'film'} text-[var(--primary-color)]`}></div>
                    <div className="flex-1">
                      <p className="text-[var(--text-light)] text-sm">
                        {isEpisode ? 'Watched' : 'Watched'} <strong>{content?.title || 'Unknown'}</strong>
                        {isEpisode && item.episode && (
                          <span> S{item.episode.season}E{item.episode.number}</span>
                        )}
                      </p>
                      <p className="text-[var(--text-muted)] text-xs">
                        {item.watched_at ? new Date(item.watched_at).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('ProfileContent component error:', error);
    return null;
  }
}
