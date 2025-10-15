// Trakt API Configuration
const TRAKT_CONFIG = {
  CLIENT_ID: '5697e68ebb013d189eca500c72a4027452aaac08a7064e516318f77f98d4c3c8',
  CLIENT_SECRET: '857103045089929edee01693bd46f28b94f6160998f7e266505f598b885d8bf0',
  BASE_URL: 'https://api.trakt.tv',
  REDIRECT_URI: 'https://c608pa8pwp3v.trickle.host/index.html/callback',
  API_VERSION: '2'
};

// TMDB Configuration for fetching images
const TMDB_CONFIG = {
  API_KEY: 'cb4e63ae4b1c01d8d4c210c06aafed9f',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500'
};

// Trakt API utility functions
const TraktAPI = {
  // Generate OAuth authorization URL
  getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: TRAKT_CONFIG.CLIENT_ID,
      redirect_uri: TRAKT_CONFIG.REDIRECT_URI,
      state: Math.random().toString(36).substring(7)
    });
    
    localStorage.setItem('trakt_auth_state', params.get('state'));
    return `${TRAKT_CONFIG.BASE_URL}/oauth/authorize?${params.toString()}`;
  },

  // Exchange code for access token
  async exchangeCodeForToken(code, state) {
    try {
      const storedState = localStorage.getItem('trakt_auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      const requestBody = {
        code,
        client_id: TRAKT_CONFIG.CLIENT_ID,
        client_secret: TRAKT_CONFIG.CLIENT_SECRET,
        redirect_uri: TRAKT_CONFIG.REDIRECT_URI,
        grant_type: 'authorization_code'
      };

      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(TRAKT_CONFIG.BASE_URL + '/oauth/token')}`;
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('trakt_access_token', data.access_token);
        localStorage.setItem('trakt_refresh_token', data.refresh_token);
        localStorage.removeItem('trakt_auth_state');
        return data;
      }
      throw new Error('Failed to get access token');
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  },

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('trakt_access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      'trakt-api-version': TRAKT_CONFIG.API_VERSION,
      'trakt-api-key': TRAKT_CONFIG.CLIENT_ID,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(TRAKT_CONFIG.BASE_URL + endpoint)}`;
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // Get trending shows
  async getTrendingShows(limit = 10) {
    try {
      return await this.makeRequest(`/shows/trending?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch trending shows:', error);
      return [];
    }
  },

  // Get trending movies  
  async getTrendingMovies(limit = 10) {
    try {
      return await this.makeRequest(`/movies/trending?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch trending movies:', error);
      return [];
    }
  },

  // Get popular movies
  async getPopularMovies(limit = 20) {
    try {
      return await this.makeRequest(`/movies/popular?limit=${limit}&extended=full`);
    } catch (error) {
      console.error('Failed to fetch popular movies:', error);
      return [];
    }
  },

  // Get popular shows
  async getPopularShows(limit = 20) {
    try {
      return await this.makeRequest(`/shows/popular?limit=${limit}&extended=full`);
    } catch (error) {
      console.error('Failed to fetch popular shows:', error);
      return [];
    }
  },

  // Get anticipated movies
  async getAnticipatedMovies(limit = 20) {
    try {
      return await this.makeRequest(`/movies/anticipated?limit=${limit}&extended=full`);
    } catch (error) {
      console.error('Failed to fetch anticipated movies:', error);
      return [];
    }
  },

  // Get anticipated shows
  async getAnticipatedShows(limit = 20) {
    try {
      return await this.makeRequest(`/shows/anticipated?limit=${limit}&extended=full`);
    } catch (error) {
      console.error('Failed to fetch anticipated shows:', error);
      return [];
    }
  },

  // Get recommended movies for user
  async getRecommendedMovies(limit = 20) {
    try {
      if (this.isAuthenticated()) {
        return await this.makeRequest(`/recommendations/movies?limit=${limit}&extended=full`);
      } else {
        // Fallback to trending for non-authenticated users
        return await this.makeRequest(`/movies/trending?limit=${limit}&extended=full`);
      }
    } catch (error) {
      console.error('Failed to fetch recommended movies:', error);
      return [];
    }
  },

  // Get recommended shows for user
  async getRecommendedShows(limit = 20) {
    try {
      if (this.isAuthenticated()) {
        return await this.makeRequest(`/recommendations/shows?limit=${limit}&extended=full`);
      } else {
        // Fallback to trending for non-authenticated users
        return await this.makeRequest(`/shows/trending?limit=${limit}&extended=full`);
      }
    } catch (error) {
      console.error('Failed to fetch recommended shows:', error);
      return [];
    }
  },

  // Rate movie
  async rateMovie(movieId, rating) {
    const token = localStorage.getItem('traktAccessToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseURL}/sync/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'trakt-api-version': '2',
        'trakt-api-key': this.clientId
      },
      body: JSON.stringify({
        movies: [{
          ids: { trakt: movieId },
          rating: rating
        }]
      })
    });

    if (!response.ok) throw new Error('Failed to rate movie');
    return response.json();
  },

  // Rate show
  async rateShow(showId, rating) {
    const token = localStorage.getItem('traktAccessToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseURL}/sync/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'trakt-api-version': '2',
        'trakt-api-key': this.clientId
      },
      body: JSON.stringify({
        shows: [{
          ids: { trakt: showId },
          rating: rating
        }]
      })
    });

    if (!response.ok) throw new Error('Failed to rate show');
    return response.json();
  },

  // Get user profile
  async getUserProfile() {
    try {
      return await this.makeRequest('/users/me');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  },

  // Get user watchlist
  async getUserWatchlist() {
    try {
      const movies = await this.makeRequest('/sync/watchlist/movies');
      const shows = await this.makeRequest('/sync/watchlist/shows');
      return [...movies, ...shows];
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      return [];
    }
  },

  // Add to watchlist
  async addToWatchlist(type, item) {
    try {
      const endpoint = `/sync/watchlist`;
      const body = { [type]: [item] };
      return await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      throw error;
    }
  },

  // Remove from watchlist
  async removeFromWatchlist(type, item) {
    try {
      const endpoint = `/sync/watchlist/remove`;
      const body = { [type]: [item] };
      return await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      throw error;
    }
  },

  // Rate content
  async rateContent(type, item, rating) {
    try {
      const endpoint = `/sync/ratings`;
      const body = { [type]: [{ ...item, rating }] };
      return await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to rate content:', error);
      throw error;
    }
  },

  // Get user stats
  async getUserStats() {
    try {
      return await this.makeRequest('/users/me/stats');
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return null;
    }
  },

  // Calculate actual watch time from history and watched content
  async calculateWatchTime() {
    try {
      const [history, watchedMovies, watchedShows] = await Promise.all([
        this.getUserHistory(500), // Get more history for accurate calculation
        this.makeRequest('/users/me/watched/movies?extended=full'),
        this.makeRequest('/users/me/watched/shows?extended=full')
      ]);

      let totalMinutes = 0;

      // Calculate time from watched movies
      if (watchedMovies) {
        for (const movieItem of watchedMovies) {
          const movie = movieItem.movie;
          if (movie?.ids?.tmdb) {
            try {
              const tmdbDetails = await this.getTMDBDetails('movie', movie.ids.tmdb);
              if (tmdbDetails?.runtime) {
                totalMinutes += tmdbDetails.runtime * movieItem.plays;
              } else {
                // Fallback: average movie runtime
                totalMinutes += 120 * movieItem.plays;
              }
            } catch (error) {
              // Fallback for API errors
              totalMinutes += 120 * movieItem.plays;
            }
          }
        }
      }

      // Calculate time from watched shows/episodes
      if (watchedShows) {
        for (const showItem of watchedShows) {
          const show = showItem.show;
          if (show?.ids?.tmdb && showItem.seasons) {
            for (const season of showItem.seasons) {
              if (season.episodes) {
                for (const episode of season.episodes) {
                  // Try to get episode runtime, fallback to 45 minutes
                  try {
                    const episodeDetails = await this.getTMDBEpisodeDetails(
                      show.ids.tmdb, 
                      season.number, 
                      episode.number
                    );
                    const runtime = episodeDetails?.runtime || 45;
                    totalMinutes += runtime * episode.plays;
                  } catch (error) {
                    totalMinutes += 45 * episode.plays; // Default episode length
                  }
                }
              }
            }
          }
        }
      }

      return {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60),
        totalDays: Math.round(totalMinutes / (60 * 24))
      };
    } catch (error) {
      console.error('Failed to calculate watch time:', error);
      return { totalMinutes: 0, totalHours: 0, totalDays: 0 };
    }
  },

  // Get user's recent watch history
  async getUserHistory(limit = 50) {
    try {
      return await this.makeRequest(`/users/me/history?limit=${limit}&extended=full`);
    } catch (error) {
      console.error('Failed to fetch user history:', error);
      return [];
    }
  },

  // Get user's favorite movies and shows
  async getUserFavorites() {
    try {
      const [movies, shows] = await Promise.all([
        this.makeRequest('/users/me/lists/favorites/movies'),
        this.makeRequest('/users/me/lists/favorites/shows')
      ]);
      return { movies: movies || [], shows: shows || [] };
    } catch (error) {
      console.error('Failed to fetch user favorites:', error);
      return { movies: [], shows: [] };
    }
  },

  // Get user's ratings
  async getUserRatings() {
    try {
      const [movies, shows] = await Promise.all([
        this.makeRequest('/users/me/ratings/movies'),
        this.makeRequest('/users/me/ratings/shows')
      ]);
      return { movies: movies || [], shows: shows || [] };
    } catch (error) {
      console.error('Failed to fetch user ratings:', error);
      return { movies: [], shows: [] };
    }
  },

  // Get user's watched movies and shows
  async getUserWatched() {
    try {
      const [movies, shows] = await Promise.all([
        this.makeRequest('/users/me/watched/movies?extended=full'),
        this.makeRequest('/users/me/watched/shows?extended=full')
      ]);
      return { movies: movies || [], shows: shows || [] };
    } catch (error) {
      console.error('Failed to fetch user watched content:', error);
      return { movies: [], shows: [] };
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('trakt_access_token');
  },

  // Check if user has VIP status
  isVipUser(userProfile) {
    return userProfile?.vip || false;
  },

  // Check if user is owner/admin
  isOwnerUser(userProfile) {
    const ownerUsernames = ['theaceofficials'];
    const username = userProfile?.username?.toLowerCase() || '';
    return ownerUsernames.includes(username);
  },

  // Get user verification status
  getUserVerificationStatus(userProfile) {
    if (this.isOwnerUser(userProfile)) {
      return { type: 'owner', label: 'Owner' };
    }
    if (this.isVipUser(userProfile)) {
      return { type: 'vip', label: 'VIP User' };
    }
    return { type: 'none', label: '' };
  },

  // Format runtime to "1hr 20min" format
  formatRuntime(minutes) {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}hr ${mins}min` : `${hours}hr`;
  },

  // Get TMDB image for movie/show
  async getTMDBImage(type, tmdbId) {
    try {
      if (!tmdbId) return null;
      
      const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(TMDB_CONFIG.BASE_URL + endpoint + '?api_key=' + TMDB_CONFIG.API_KEY)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.poster_path ? `${TMDB_CONFIG.IMAGE_BASE_URL}${data.poster_path}` : null;
    } catch (error) {
      console.error('Failed to fetch TMDB image:', error);
      return null;
    }
  },

  // Get detailed TMDB information including runtime and seasons
  async getTMDBDetails(type, tmdbId, includeBanner = false) {
    try {
      if (!tmdbId) return null;
      
      const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(TMDB_CONFIG.BASE_URL + endpoint + '?api_key=' + TMDB_CONFIG.API_KEY)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      const baseReturn = {
        poster: data.poster_path ? `${TMDB_CONFIG.IMAGE_BASE_URL}${data.poster_path}` : null,
        backdrop: includeBanner && data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null
      };
      
      if (type === 'movie') {
        return {
          ...baseReturn,
          runtime: data.runtime || null
        };
      } else {
        return {
          ...baseReturn,
          seasons: data.number_of_seasons || 0,
          episodes: data.number_of_episodes || 0
        };
      }
    } catch (error) {
      console.error('Failed to fetch TMDB details:', error);
      return null;
    }
  },

  // Get TMDB episode details and thumbnail
  async getTMDBEpisodeDetails(showTmdbId, seasonNumber, episodeNumber) {
    try {
      if (!showTmdbId || !seasonNumber || !episodeNumber) return null;
      
      const endpoint = `/tv/${showTmdbId}/season/${seasonNumber}/episode/${episodeNumber}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(TMDB_CONFIG.BASE_URL + endpoint + '?api_key=' + TMDB_CONFIG.API_KEY)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        name: data.name || 'Episode',
        overview: data.overview || '',
        runtime: data.runtime || null,
        thumbnail: data.still_path ? `${TMDB_CONFIG.IMAGE_BASE_URL}${data.still_path}` : null,
        airDate: data.air_date || null,
        voteAverage: data.vote_average || 0
      };
    } catch (error) {
      console.error('Failed to fetch TMDB episode details:', error);
      return null;
    }
  },

  // Get show episode details from Trakt
  async getShowEpisodes(traktId, season) {
    try {
      const endpoint = `/shows/${traktId}/seasons/${season}/episodes?extended=full`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to fetch show episodes:', error);
      return [];
    }
  },

  // Get fallback image based on type
  getFallbackImage(type) {
    const movieFallback = `https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80`;
    const showFallback = `https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80`;
    
    return type === 'movie' ? movieFallback : showFallback;
  },

  // Get hero fallback image for slider
  getHeroFallbackImage() {
    return `https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`;
  },

  // Process content with real images
  async processContentWithImages(items, contentType, includeBanner = false) {
    const processed = await Promise.all(items.map(async (item) => {
      let content, type, tmdbId;
      
      if (item.movie) {
        content = item.movie;
        type = 'movie';
        tmdbId = content.ids?.tmdb;
      } else if (item.show) {
        content = item.show;
        type = 'tv';
        tmdbId = content.ids?.tmdb;
      } else {
        content = item;
        type = contentType;
        tmdbId = content.ids?.tmdb;
      }

      // Get detailed TMDB information including poster and runtime/seasons
      let tmdbDetails = await this.getTMDBDetails(type, tmdbId, includeBanner);
      
      // Fallback to basic image if detailed fetch failed
      if (!tmdbDetails || !tmdbDetails.poster) {
        const poster = await this.getTMDBImage(type, tmdbId) || this.getFallbackImage(type === 'tv' ? 'show' : type);
        tmdbDetails = { poster, runtime: null, seasons: 0, episodes: 0, backdrop: null };
      }

      return {
        id: content.ids?.trakt || Math.random(),
        title: content.title || `Unknown ${type === 'tv' ? 'Show' : 'Movie'}`,
        type: type === 'tv' ? 'Show' : 'Movie',
        poster: tmdbDetails.poster,
        backdrop: tmdbDetails.backdrop,
        year: content.year || 2024,
        rating: content.rating || 0,
        votes: content.votes || 0,
        runtime: tmdbDetails.runtime || null,
        seasons: tmdbDetails.seasons || 0,
        episodes: tmdbDetails.episodes || 0,
        trakt_id: content.ids?.trakt,
        tmdb_id: content.ids?.tmdb,
        imdb_id: content.ids?.imdb,
        overview: content.overview || ''
      };
    }));

    return processed;
  },

  // Search movies
  async searchMovies(query) {
    try {
      return await this.makeRequest(`/search/movie?query=${encodeURIComponent(query)}&extended=full`);
    } catch (error) {
      console.error('Failed to search movies:', error);
      return [];
    }
  },

  // Search TV shows
  async searchShows(query) {
    try {
      return await this.makeRequest(`/search/show?query=${encodeURIComponent(query)}&extended=full`);
    } catch (error) {
      console.error('Failed to search shows:', error);
      return [];
    }
  },

  // Search users (Trakt users)
  async searchUsers(query) {
    try {
      // Since Trakt doesn't have a direct user search, we'll use a workaround
      // by searching for popular users or getting users from followers/following lists
      const response = await this.makeRequest(`/users/popular?limit=20`);
      
      // Filter results based on query if we have real user data
      if (query && query.trim()) {
        const filteredUsers = response.filter(item => {
          const user = item.user || item;
          const username = user.username?.toLowerCase() || '';
          const name = user.name?.toLowerCase() || '';
          const searchTerm = query.toLowerCase();
          return username.includes(searchTerm) || name.includes(searchTerm);
        });
        return filteredUsers.length > 0 ? filteredUsers : response.slice(0, 10);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to search users:', error);
      // Fallback to mock data if API fails
      return this.getMockUsers(query);
    }
  },

  // Get mock users as fallback
  getMockUsers(query = '') {
    const mockUsers = [
      {
        user: {
          username: 'theaceofficials',
          name: 'TheAceOfficials',
          joined_at: '2020-01-01T00:00:00Z',
          location: 'Global',
          about: 'Owner of AceSync - Premium entertainment tracking platform.',
          ids: { slug: 'theaceofficials' },
          vip: false
        }
      },
      {
        user: {
          username: 'moviebuff2024',
          name: 'Movie Enthusiast',
          joined_at: '2024-01-15T10:30:00Z',
          location: 'Los Angeles, CA',
          about: 'Love watching indie films and classic movies. Always looking for recommendations!',
          ids: { slug: 'moviebuff2024' },
          vip: true
        }
      },
      {
        user: {
          username: 'tvshowaddict',
          name: 'Sarah Thompson',
          joined_at: '2023-06-20T14:45:00Z',
          location: 'New York, NY',
          about: 'Binge-watcher extraordinaire. Currently obsessed with sci-fi series.',
          ids: { slug: 'tvshowaddict' }
        }
      },
      {
        user: {
          username: 'animelover',
          name: 'Alex Chen',
          joined_at: '2023-11-08T09:15:00Z',
          location: 'Tokyo, Japan',
          about: 'Anime connoisseur and manga reader. Always up for discussing the latest releases.',
          ids: { slug: 'animelover' }
        }
      },
      {
        user: {
          username: 'criticalview',
          name: 'Mike Rodriguez',
          joined_at: '2024-03-12T16:20:00Z',
          location: 'Chicago, IL',
          about: 'Film critic and review writer. Passionate about cinematography and storytelling.',
          ids: { slug: 'criticalview' }
        }
      }
    ];

    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      return mockUsers.filter(item => {
        const user = item.user;
        return user.username.toLowerCase().includes(searchTerm) || 
               user.name.toLowerCase().includes(searchTerm);
      });
    }

    return mockUsers;
  },

  // Get user profile by username
  async getUserProfileByUsername(username) {
    try {
      return await this.makeRequest(`/users/${username}?extended=full`);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  // Get user stats by username
  async getUserStatsByUsername(username) {
    try {
      return await this.makeRequest(`/users/${username}/stats`);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  },

  // Get user followers
  async getUserFollowers(username) {
    try {
      return await this.makeRequest(`/users/${username}/followers`);
    } catch (error) {
      console.error('Failed to get user followers:', error);
      return [];
    }
  },

  // Get user following (friends)
  async getUserFollowing(username = 'me') {
    try {
      return await this.makeRequest(`/users/${username}/following`);
    } catch (error) {
      console.error('Failed to get user following:', error);
      return [];
    }
  },

  // Get friends data with profile pictures
  async getUserFriends() {
    try {
      const following = await this.getUserFollowing();
      
      // Process friends data
      const friends = following.slice(0, 8).map(item => {
        const user = item.user || item;
        const username = user.username || user.ids?.slug || 'unknown';
        
        return {
          id: user.ids?.slug || username || Math.random(),
          name: user.name || username,
          username: username,
          avatar: user.avatar || `https://secure.gravatar.com/avatar/${username}?s=100&d=identicon&f=y`,
          isVip: user.vip || false,
          isPrivate: user.private || false
        };
      });

      return friends;
    } catch (error) {
      console.error('Failed to get friends data:', error);
      // Return mock friends data as fallback
      return [
        {
          id: 'theaceofficials',
          name: 'TheAceOfficials',
          username: 'theaceofficials',
          avatar: 'https://secure.gravatar.com/avatar/theaceofficials?s=100&d=identicon&f=y',
          isVip: false
        },
        {
          id: 'friend2', 
          name: 'Sarah Kim',
          username: 'sarahk',
          avatar: 'https://secure.gravatar.com/avatar/sarahk?s=100&d=identicon&f=y',
          isVip: true
        },
        {
          id: 'friend3',
          name: 'Mike Johnson',
          username: 'mikej',
          avatar: 'https://secure.gravatar.com/avatar/mikej?s=100&d=identicon&f=y',
          isVip: false
        },
        {
          id: 'friend4',
          name: 'Emma Wilson',
          username: 'emmaw',
          avatar: 'https://secure.gravatar.com/avatar/emmaw?s=100&d=identicon&f=y',
          isVip: false
        }
      ];
    }
  },

  // Follow user
  async followUser(username) {
    try {
      return await this.makeRequest(`/users/${username}/follow`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  // Unfollow user
  async unfollowUser(username) {
    try {
      return await this.makeRequest(`/users/${username}/follow`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Check if following user
  async isFollowingUser(username) {
    try {
      const following = await this.makeRequest('/users/me/following');
      return following.some(user => user.user?.username === username);
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return false;
    }
  },

  // Mark content as watched
  async markAsWatched(type, item, watchedAt = new Date().toISOString()) {
    try {
      const endpoint = `/sync/history`;
      const body = { [type]: [{ ...item, watched_at: watchedAt }] };
      return await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      throw error;
    }
  },

  // Check if content is watched
  async getWatchedStatus(type, traktId) {
    try {
      const endpoint = `/sync/watched/${type}`;
      const watchedItems = await this.makeRequest(endpoint);
      return watchedItems.some(item => {
        const content = item.movie || item.show;
        return content?.ids?.trakt === traktId;
      });
    } catch (error) {
      console.error('Failed to check watched status:', error);
      return false;
    }
  },

  // Sync all watched content from Trakt
  async syncWatchedContent() {
    if (!this.isAuthenticated()) return { movies: {}, shows: {}, episodes: {} };

    try {
      const [watchedMovies, watchedShows] = await Promise.all([
        this.makeRequest('/sync/watched/movies?extended=full'),
        this.makeRequest('/sync/watched/shows?extended=full')
      ]);

      const syncData = {
        movies: {},
        shows: {},
        episodes: {}
      };

      // Process watched movies
      if (watchedMovies) {
        watchedMovies.forEach(item => {
          const movie = item.movie;
          if (movie?.ids?.tmdb) {
            syncData.movies[movie.ids.tmdb] = {
              watched: true,
              plays: item.plays || 1,
              lastWatched: item.last_watched_at
            };
          }
        });
      }

      // Process watched shows and episodes
      if (watchedShows) {
        watchedShows.forEach(item => {
          const show = item.show;
          if (show?.ids?.tmdb) {
            syncData.shows[show.ids.tmdb] = {
              watched: true,
              seasons: {}
            };

            // Process seasons and episodes
            if (item.seasons) {
              item.seasons.forEach(season => {
                syncData.shows[show.ids.tmdb].seasons[season.number] = {
                  watched: true,
                  episodes: {}
                };

                if (season.episodes) {
                  season.episodes.forEach(episode => {
                    const episodeKey = `${season.number}_${episode.number}`;
                    syncData.episodes[`${show.ids.tmdb}_${episodeKey}`] = {
                      watched: true,
                      plays: episode.plays || 1,
                      lastWatched: episode.last_watched_at
                    };
                  });
                }
              });
            }
          }
        });
      }

      // Store synced data in localStorage
      localStorage.setItem('trakt_synced_movies', JSON.stringify(syncData.movies));
      localStorage.setItem('trakt_synced_shows', JSON.stringify(syncData.shows));
      localStorage.setItem('trakt_synced_episodes', JSON.stringify(syncData.episodes));

      return syncData;
    } catch (error) {
      console.error('Failed to sync watched content:', error);
      return { movies: {}, shows: {}, episodes: {} };
    }
  },

  // Get synced watched status for movie
  getMovieWatchedStatus(tmdbId) {
    const syncedMovies = JSON.parse(localStorage.getItem('trakt_synced_movies') || '{}');
    return syncedMovies[tmdbId]?.watched || false;
  },

  // Get synced watched status for show
  getShowWatchedStatus(tmdbId) {
    const syncedShows = JSON.parse(localStorage.getItem('trakt_synced_shows') || '{}');
    return syncedShows[tmdbId]?.watched || false;
  },

  // Get synced watched status for episode
  getEpisodeWatchedStatus(showTmdbId, season, episode) {
    const syncedEpisodes = JSON.parse(localStorage.getItem('trakt_synced_episodes') || '{}');
    const episodeKey = `${showTmdbId}_${season}_${episode}`;
    return syncedEpisodes[episodeKey]?.watched || false;
  },

  // Get all synced episode statuses for a show
  getShowEpisodesWatchedStatus(showTmdbId) {
    const syncedEpisodes = JSON.parse(localStorage.getItem('trakt_synced_episodes') || '{}');
    const showEpisodes = {};
    
    Object.keys(syncedEpisodes).forEach(key => {
      if (key.startsWith(`${showTmdbId}_`)) {
        const episodePart = key.replace(`${showTmdbId}_`, '');
        showEpisodes[episodePart] = syncedEpisodes[key].watched;
      }
    });
    
    return showEpisodes;
  },

  // Get watched episodes for a specific show and season
  getSeasonWatchedEpisodes(showTmdbId, seasonNumber) {
    const syncedEpisodes = JSON.parse(localStorage.getItem('trakt_synced_episodes') || '{}');
    const seasonEpisodes = {};
    
    Object.keys(syncedEpisodes).forEach(key => {
      if (key.startsWith(`${showTmdbId}_${seasonNumber}_`)) {
        const episodeNumber = key.split('_')[2];
        seasonEpisodes[episodeNumber] = syncedEpisodes[key].watched;
      }
    });
    
    return seasonEpisodes;
  },

  // Check if entire season is watched
  isSeasonFullyWatched(showTmdbId, seasonNumber, totalEpisodes) {
    const seasonWatched = this.getSeasonWatchedEpisodes(showTmdbId, seasonNumber);
    const watchedCount = Object.values(seasonWatched).filter(watched => watched).length;
    return watchedCount === totalEpisodes && totalEpisodes > 0;
  },

  // Get movie watched status
  getMovieWatchedStatus(movieTmdbId) {
    const syncedMovies = JSON.parse(localStorage.getItem('trakt_synced_movies') || '{}');
    return syncedMovies[movieTmdbId]?.watched || false;
  },

  // Get movie watch count
  getMovieWatchCount(movieTmdbId) {
    const syncedMovies = JSON.parse(localStorage.getItem('trakt_synced_movies') || '{}');
    return syncedMovies[movieTmdbId]?.plays || 0;
  },

  // Get watchlist status for movies or shows
  getWatchlistStatus(type, itemId) {
    const watchlistKey = `trakt_watchlist_${type}s`;
    const watchlist = JSON.parse(localStorage.getItem(watchlistKey) || '{}');
    return watchlist[itemId] || false;
  },

  // Remove from watched history
  async removeFromWatched(type, item) {
    try {
      const endpoint = `/sync/history/remove`;
      const body = { [type]: [item] };
      return await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to remove from watched:', error);
      throw error;
    }
  },

  // Get user's followed shows calendar
  async getFollowedCalendar(startDate, days = 30) {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Get user's followed shows calendar
      const shows = await this.makeRequest(`/calendars/my/shows/${startStr}/${days}`);
      
      const allItems = [];
      
      // Add shows/episodes
      if (shows && Array.isArray(shows)) {
        shows.forEach(item => {
          if (item.show && item.episode && item.first_aired) {
            allItems.push({
              type: 'episode',
              show: item.show,
              episode: item.episode,
              first_aired: item.first_aired,
              ids: item.episode.ids
            });
          }
        });
      }

      return allItems;
    } catch (error) {
      console.error('Failed to fetch followed calendar:', error);
      return this.getMockFollowedData(startDate, 30);
    }
  },

  // Get user's watchlist movies releases
  async getWatchlistMovies() {
    try {
      const movies = await this.makeRequest('/sync/watchlist/movies');
      return movies || [];
    } catch (error) {
      console.error('Failed to fetch watchlist movies:', error);
      return [];
    }
  },

  // Get calendar data for date range
  async getCalendar(startDate, endDate) {
    try {
      // Get upcoming movies and shows for the date range
      const [movies, shows] = await Promise.all([
        this.makeRequest(`/calendars/all/movies/${startDate}/${endDate}`),
        this.makeRequest(`/calendars/all/shows/${startDate}/${endDate}`)
      ]);

      // Combine and format the data
      const allItems = [];
      
      // Add movies
      if (movies && Array.isArray(movies)) {
        movies.forEach(item => {
          if (item.movie && item.released) {
            allItems.push({
              type: 'movie',
              movie: item.movie,
              first_aired: item.released
            });
          }
        });
      }
      
      // Add shows/episodes
      if (shows && Array.isArray(shows)) {
        shows.forEach(item => {
          if (item.show && item.episode && item.first_aired) {
            allItems.push({
              type: 'episode',
              show: item.show,
              episode: item.episode,
              first_aired: item.first_aired
            });
          }
        });
      }

      return allItems;
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      // Return mock data as fallback
      return this.getMockCalendarData(startDate, endDate);
    }
  },

  // Mock followed calendar data
  getMockFollowedData(startDate, days) {
    const mockShows = [
      'The Office', 'Breaking Bad', 'Stranger Things', 'Game of Thrones', 
      'Friends', 'The Witcher', 'House of Cards', 'Narcos', 'Ozark'
    ];
    
    const mockData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      if (Math.random() > 0.6) { // 40% chance of episodes
        const dateStr = currentDate.toISOString().split('T')[0];
        const showTitle = mockShows[Math.floor(Math.random() * mockShows.length)];
        
        mockData.push({
          type: 'episode',
          show: {
            title: showTitle,
            year: 2020 + Math.floor(Math.random() * 5),
            ids: { 
              trakt: Math.floor(Math.random() * 10000),
              tmdb: Math.floor(Math.random() * 100000)
            }
          },
          episode: {
            season: Math.floor(Math.random() * 3) + 1,
            number: Math.floor(Math.random() * 12) + 1,
            title: `Episode ${Math.floor(Math.random() * 12) + 1}`,
            ids: { trakt: Math.floor(Math.random() * 10000) }
          },
          first_aired: dateStr + 'T20:00:00.000Z'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return mockData;
  },

  // Mock calendar data as fallback
  getMockCalendarData(startDate, endDate) {
    const mockData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate some mock entries
    const currentDate = new Date(start);
    while (currentDate <= end) {
      if (Math.random() > 0.7) { // 30% chance of having content on any day
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Add mock movie
        if (Math.random() > 0.5) {
          mockData.push({
            type: 'movie',
            movie: {
              title: `Movie Release ${Math.floor(Math.random() * 100)}`,
              year: 2025,
              ids: { trakt: Math.floor(Math.random() * 10000) }
            },
            first_aired: dateStr + 'T00:00:00.000Z'
          });
        }
        
        // Add mock episode
        if (Math.random() > 0.5) {
          mockData.push({
            type: 'episode',
            show: {
              title: `TV Show ${Math.floor(Math.random() * 50)}`,
              year: 2025,
              ids: { trakt: Math.floor(Math.random() * 10000) }
            },
            episode: {
              season: Math.floor(Math.random() * 5) + 1,
              number: Math.floor(Math.random() * 20) + 1,
              title: `Episode ${Math.floor(Math.random() * 20) + 1}`,
              ids: { trakt: Math.floor(Math.random() * 10000) }
            },
            first_aired: dateStr + 'T00:00:00.000Z'
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return mockData;
  },

  // Logout user
  logout() {
    localStorage.removeItem('trakt_access_token');
    localStorage.removeItem('trakt_refresh_token');
    localStorage.removeItem('trakt_auth_state');
  }
};
