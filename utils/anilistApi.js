// AniList API Configuration for Anime
const ANILIST_CONFIG = {
  CLIENT_ID: '31226',
  CLIENT_SECRET: 'nIqR1hSuIj7gpZVmqjKJ9MN1jTjFyi7HdsLLzkdJ',
  BASE_URL: 'https://graphql.anilist.co',
  AUTH_URL: 'https://anilist.co/api/v2/oauth/authorize',
  TOKEN_URL: 'https://anilist.co/api/v2/oauth/token'
};

// AniList API Manager
window.AniListAPI = {
  // Make GraphQL request
  async makeRequest(query, variables = {}) {
    try {
      const response = await fetch(ANILIST_CONFIG.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      return result.data;
    } catch (error) {
      console.error('AniList API request failed:', error);
      throw error;
    }
  },

  // Get trending anime
  async getTrendingAnime(limit = 24) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            averageScore
            episodes
            genres
            status
            startDate {
              year
            }
            description
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page: 1, perPage: limit });
      return data.Page.media || [];
    } catch (error) {
      console.error('Failed to fetch trending anime:', error);
      return [];
    }
  },

  // Get popular anime
  async getPopularAnime(limit = 24) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            averageScore
            episodes
            genres
            status
            startDate {
              year
            }
            description
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page: 1, perPage: limit });
      return data.Page.media || [];
    } catch (error) {
      console.error('Failed to fetch popular anime:', error);
      return [];
    }
  },

  // Get anime details
  async getAnimeDetails(animeId) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          averageScore
          episodes
          duration
          genres
          status
          description
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          studios {
            nodes {
              name
            }
          }
          characters(page: 1, perPage: 10, sort: ROLE) {
            nodes {
              name {
                full
              }
              image {
                medium
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { id: parseInt(animeId) });
      return this.processAnimeDetails(data.Media);
    } catch (error) {
      console.error('Failed to fetch anime details:', error);
      return null;
    }
  },

  // Process anime details
  processAnimeDetails(anime) {
    if (!anime) return null;
    
    return {
      id: anime.id,
      title: anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown Title',
      poster: anime.coverImage?.extraLarge || anime.coverImage?.large,
      backdrop: anime.bannerImage || anime.coverImage?.extraLarge,
      rating: anime.averageScore ? anime.averageScore / 10 : 0,
      year: anime.startDate?.year || 'TBA',
      status: anime.status || 'Unknown',
      episodes: anime.episodes || 'Unknown',
      duration: anime.duration || 24,
      genres: anime.genres || [],
      synopsis: anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No synopsis available.',
      studios: anime.studios?.nodes?.map(studio => studio.name) || [],
      aired: this.formatAirDate(anime.startDate, anime.endDate),
      characters: anime.characters?.nodes || []
    };
  },

  // Format air date
  formatAirDate(startDate, endDate) {
    const formatDate = (date) => {
      if (!date) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.month - 1]} ${date.day}, ${date.year}`;
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start && end) {
      return `${start} to ${end}`;
    } else if (start) {
      return `${start} to ?`;
    } else {
      return 'Unknown';
    }
  }
};
