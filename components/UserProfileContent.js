function UserProfileContent() {
  try {
    const [userProfile, setUserProfile] = React.useState(null);
    const [userStats, setUserStats] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [username, setUsername] = React.useState('');

    React.useEffect(() => {
      // Get username from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const usernameParam = urlParams.get('user');
      
      if (usernameParam) {
        setUsername(usernameParam);
        loadUserProfile(usernameParam);
      } else {
        setLoading(false);
      }
    }, []);

    const loadUserProfile = async (targetUsername) => {
      try {
        const [profile, stats] = await Promise.all([
          TraktAPI.getUserProfileByUsername(targetUsername),
          TraktAPI.getUserStatsByUsername(targetUsername)
        ]);

        setUserProfile(profile);
        setUserStats(stats);

        // Check if currently following this user
        if (TraktAPI.isAuthenticated()) {
          const followingStatus = await TraktAPI.isFollowingUser(targetUsername);
          setIsFollowing(followingStatus);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleFollowToggle = async () => {
      if (!TraktAPI.isAuthenticated()) {
        alert('Please sign in to follow users');
        return;
      }

      try {
        if (isFollowing) {
          await TraktAPI.unfollowUser(username);
          setIsFollowing(false);
        } else {
          await TraktAPI.followUser(username);
          setIsFollowing(true);
        }
      } catch (error) {
        console.error('Failed to toggle follow status:', error);
        alert('Failed to update follow status');
      }
    };

    if (loading) {
      return (
        <main className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="card animate-pulse">
              <div className="h-32 bg-[var(--accent-color)] rounded"></div>
            </div>
          </div>
        </main>
      );
    }

    if (!username) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-user text-4xl text-[var(--primary-color)] mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">No User Specified</h2>
              <p className="text-[var(--text-muted)] mb-6">Please specify a username in the URL</p>
              <button onClick={() => window.location.href = '/'} className="btn-primary">
                Go Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    if (!userProfile) {
      return (
        <main className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <div className="icon-user-x text-4xl text-red-500 mb-4"></div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-4">User Not Found</h2>
              <p className="text-[var(--text-muted)] mb-6">The user "{username}" could not be found</p>
              <button onClick={() => window.location.href = '/'} className="btn-primary">
                Go Home
              </button>
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

    return (
      <main className="py-8 px-4" data-name="user-profile-content" data-file="components/UserProfileContent.js">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary-color)] to-[var(--gradient-to)] rounded-full flex items-center justify-center">
                  <div className="icon-user text-3xl text-white"></div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-[var(--text-light)]">
                      {userProfile.name || userProfile.username}
                    </h1>
                    {(TraktAPI.isVipUser(userProfile) || TraktAPI.isOwnerUser(userProfile)) && (
                      <div 
                        className="relative group"
                        title={TraktAPI.getUserVerificationStatus(userProfile).label}
                      >
                        <div className="icon-check-circle text-2xl text-blue-500 cursor-pointer transition-all duration-300 group-hover:scale-110"></div>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border-color)] px-3 py-1 rounded-lg text-sm text-[var(--text-light)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10">
                          {TraktAPI.getUserVerificationStatus(userProfile).label}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)] text-lg">@{userProfile.username}</p>
                  <p className="text-[var(--primary-color)] text-sm">
                    Member since {formatJoinDate(userProfile.joined_at)}
                  </p>
                  {userProfile.location && (
                    <p className="text-[var(--text-muted)] text-sm flex items-center mt-1">
                      <div className="icon-map-pin text-xs mr-1"></div>
                      {userProfile.location}
                    </p>
                  )}
                </div>
              </div>
              
              {TraktAPI.isAuthenticated() && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    isFollowing
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                      : 'btn-primary'
                  }`}
                >
                  <div className={`icon-${isFollowing ? 'user-minus' : 'user-plus'} text-sm mr-2 inline`}></div>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
            
            {userProfile.about && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-[var(--text-muted)]">{userProfile.about}</p>
              </div>
            )}
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card text-center">
                <div className="icon-film text-3xl text-blue-500 mb-2"></div>
                <h3 className="text-2xl font-bold text-[var(--text-light)]">{userStats.movies?.plays || 0}</h3>
                <p className="text-[var(--text-muted)] text-sm">Movies Watched</p>
              </div>
              <div className="card text-center">
                <div className="icon-tv text-3xl text-green-500 mb-2"></div>
                <h3 className="text-2xl font-bold text-[var(--text-light)]">{userStats.shows?.watched || 0}</h3>
                <p className="text-[var(--text-muted)] text-sm">Shows Watched</p>
              </div>
              <div className="card text-center">
                <div className="icon-play text-3xl text-purple-500 mb-2"></div>
                <h3 className="text-2xl font-bold text-[var(--text-light)]">{userStats.episodes?.plays || 0}</h3>
                <p className="text-[var(--text-muted)] text-sm">Episodes</p>
              </div>
              <div className="card text-center">
                <div className="icon-users text-3xl text-orange-500 mb-2"></div>
                <h3 className="text-2xl font-bold text-[var(--text-light)]">{userStats.network?.friends || 0}</h3>
                <p className="text-[var(--text-muted)] text-sm">Friends</p>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('UserProfileContent component error:', error);
    return null;
  }
}