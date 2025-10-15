// Simkl API Configuration for Anime
const SIMKL_CONFIG = {
  CLIENT_ID: '9ad0f006474456ebc95829f8101ff7f109007bbac426b72928faaaeb91a22db5',
  CLIENT_SECRET: '92e22e6b8d1f0e8cba01edff10a3eda52c54c65a857bbf3b1baf9206c4094f8a',
  BASE_URL: 'https://api.simkl.com',
  API_VERSION: '1'
};

// Simkl API utility functions
const SimklAPI = {
  // Make API request to Simkl
  async makeRequest(endpoint, options = {}) {
    const headers = {
      'simkl-api-key': SIMKL_CONFIG.CLIENT_ID,
      ...options.headers
    };

    try {
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(SIMKL_CONFIG.BASE_URL + endpoint)}`;
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`Simkl API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Simkl API request error:', error);
      throw error;
    }
  },

  // Get trending anime
  async getTrendingAnime(limit = 24) {
    try {
      const response = await this.makeRequest(`/anime/trending?limit=${limit}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch trending anime:', error);
      return [];
    }
  },

  // Get popular anime
  async getPopularAnime(limit = 24) {
    try {
      const response = await this.makeRequest(`/anime/popular?limit=${limit}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch popular anime:', error);
      return [];
    }
  },

  // Get top rated anime
  async getTopRatedAnime(limit = 24) {
    try {
      const response = await this.makeRequest(`/anime/best?limit=${limit}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch top rated anime:', error);
      return [];
    }
  },

  // Search anime
  async searchAnime(query, limit = 24) {
    try {
      return await this.makeRequest(`/search/anime?q=${encodeURIComponent(query)}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to search anime:', error);
      return [];
    }
  },

  // Get anime by genre
  async getAnimeByGenre(genre, limit = 24) {
    try {
      return await this.makeRequest(`/anime/genres/${genre}?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch anime by genre:', error);
      return [];
    }
  },

  // Process anime data for display
  processAnimeData(animeList) {
    if (!Array.isArray(animeList)) {
      console.warn('processAnimeData received non-array data:', animeList);
      return [];
    }
    
    return animeList.map(anime => ({
      id: anime.ids?.simkl || anime.simkl_id || Math.random(),
      title: anime.title || 'Unknown Anime',
      type: 'Anime',
      poster: anime.poster || this.getFallbackImage(),
      backdrop: anime.fanart || null,
      year: anime.year || new Date().getFullYear(),
      rating: anime.rating || 0,
      votes: anime.votes || 0,
      episodes: anime.total_episodes || anime.episodes || 0,
      seasons: anime.seasons || 0,
      status: anime.status || 'unknown',
      genres: anime.genres || [],
      overview: anime.overview || anime.plot || '',
      simkl_id: anime.ids?.simkl || anime.simkl_id,
      mal_id: anime.ids?.mal || anime.mal_id,
      anidb_id: anime.ids?.anidb || anime.anidb_id,
      runtime: anime.runtime || null,
      aired_from: anime.aired?.from || anime.first_aired || null,
      aired_to: anime.aired?.to || null
    }));
  },

  // Get fallback image for anime
  getFallbackImage() {
    return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
  },

  // Filter anime by genre
  filterAnimeByGenres(animeList, selectedGenres) {
    if (!selectedGenres || selectedGenres.length === 0) {
      return animeList;
    }

    return animeList.filter(anime => {
      if (!anime.genres || anime.genres.length === 0) {
        return false;
      }
      
      return selectedGenres.some(selectedGenre => 
        anime.genres.some(animeGenre => 
          animeGenre.toLowerCase().includes(selectedGenre.toLowerCase())
        )
      );
    });
  },

  // Get anime genres
  getAnimeGenres() {
    return [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
      'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
      'Thriller', 'Mystery', 'Historical', 'Psychological', 'Mecha'
    ];
  }
};