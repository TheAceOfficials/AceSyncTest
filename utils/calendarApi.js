// Calendar API utilities for Trakt integration
const CalendarAPI = {
  // Convert UTC date to Indian Standard Time
  convertToIST(utcDate) {
    const date = new Date(utcDate);
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + istOffset);
  },

  // Format date for API calls (YYYY-MM-DD)
  formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
  },

  // Get calendar data for user's followed shows
  async getMyShowsCalendar(startDate, days = 30) {
    try {
      const formattedDate = this.formatDateForAPI(startDate);
      return await TraktAPI.makeRequest(`/calendars/my/shows/${formattedDate}/${days}`);
    } catch (error) {
      console.error('Failed to fetch my shows calendar:', error);
      return [];
    }
  },

  // Get calendar data for user's watchlist movies
  async getMyMoviesCalendar(startDate, days = 30) {
    try {
      const formattedDate = this.formatDateForAPI(startDate);
      return await TraktAPI.makeRequest(`/calendars/my/movies/${formattedDate}/${days}`);
    } catch (error) {
      console.error('Failed to fetch my movies calendar:', error);
      return [];
    }
  },

  // Get new season premieres
  async getPremieres(startDate, days = 30) {
    try {
      const formattedDate = this.formatDateForAPI(startDate);
      return await TraktAPI.makeRequest(`/calendars/all/shows/${formattedDate}/${days}?filter=premieres`);
    } catch (error) {
      console.error('Failed to fetch premieres:', error);
      return [];
    }
  },

  // Get comprehensive calendar data
  async getCalendarData(startDate = new Date(), days = 30) {
    try {
      const [myShows, myMovies, premieres] = await Promise.all([
        this.getMyShowsCalendar(startDate, days),
        this.getMyMoviesCalendar(startDate, days),
        this.getPremieres(startDate, days)
      ]);

      return {
        shows: myShows || [],
        movies: myMovies || [],
        premieres: premieres || [],
        all: [...(myShows || []), ...(myMovies || []), ...(premieres || [])]
      };
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      return { shows: [], movies: [], premieres: [], all: [] };
    }
  },

  // Process calendar items with TMDB images and IST conversion
  async processCalendarItems(items, type = 'mixed') {
    const processed = await Promise.all(items.map(async (item) => {
      let content, contentType, releaseDate;
      
      if (item.movie) {
        content = item.movie;
        contentType = 'movie';
        releaseDate = item.released;
      } else if (item.show && item.episode) {
        content = item.show;
        contentType = 'episode';
        releaseDate = item.first_aired;
      } else if (item.show) {
        content = item.show;
        contentType = 'show';
        releaseDate = item.first_aired;
      }

      // Convert release date to IST
      const istDate = releaseDate ? this.convertToIST(releaseDate) : new Date();
      
      // Get TMDB poster
      const tmdbId = content?.ids?.tmdb;
      let poster = null;
      if (tmdbId) {
        const tmdbType = contentType === 'movie' ? 'movie' : 'tv';
        poster = await TraktAPI.getTMDBImage(tmdbType, tmdbId);
      }
      
      // Fallback poster
      if (!poster) {
        poster = contentType === 'movie' 
          ? TraktAPI.getFallbackImage('movie')
          : TraktAPI.getFallbackImage('show');
      }

      return {
        id: `${contentType}-${content?.ids?.trakt || Math.random()}`,
        title: content?.title || 'Unknown Title',
        type: contentType,
        poster,
        releaseDate: istDate,
        utcDate: new Date(releaseDate),
        episode: item.episode || null,
        year: content?.year || new Date().getFullYear(),
        trakt_id: content?.ids?.trakt,
        tmdb_id: content?.ids?.tmdb,
        overview: content?.overview || '',
        runtime: content?.runtime || null
      };
    }));

    return processed.sort((a, b) => a.releaseDate - b.releaseDate);
  },

  // Calculate time until release
  getTimeUntilRelease(releaseDate) {
    const now = new Date();
    const release = new Date(releaseDate);
    const diff = release - now;

    if (diff <= 0) return 'Released';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  // Check if item should be hidden (removed from watchlist)
  async shouldHideItem(item) {
    try {
      if (!TraktAPI.isAuthenticated()) return false;
      
      const watchlist = await TraktAPI.getUserWatchlist();
      const itemInWatchlist = watchlist.some(wItem => {
        const wContent = wItem.movie || wItem.show;
        return wContent?.ids?.trakt === item.trakt_id;
      });
      
      return !itemInWatchlist;
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return false;
    }
  },

  // Group calendar items by date
  groupByDate(items) {
    const grouped = {};
    
    items.forEach(item => {
      const dateKey = this.formatDateForAPI(item.releaseDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  },

  // Get mock calendar data for fallback
  getMockCalendarData() {
    const mockItems = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (Math.random() > 0.7) {
        const isMovie = Math.random() > 0.5;
        mockItems.push({
          id: `mock-${i}`,
          title: isMovie ? `Movie Release ${i + 1}` : `TV Show Episode ${i + 1}`,
          type: isMovie ? 'movie' : 'episode',
          poster: isMovie 
            ? 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
            : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
          releaseDate: date,
          utcDate: date,
          episode: isMovie ? null : { season: 1, number: i + 1 },
          year: 2025,
          trakt_id: Math.random() * 10000,
          overview: 'Mock content for demonstration purposes.'
        });
      }
    }
    
    return mockItems;
  }
};