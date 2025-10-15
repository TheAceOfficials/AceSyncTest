// TMDB API utility for fetching posters and metadata
class TMDBAPI {
  constructor() {
    this.baseURL = 'https://api.themoviedb.org/3';
    this.imageBaseURL = 'https://image.tmdb.org/t/p';
    // Using a demo API key - in production, this should be environment variable
    this.apiKey = '4e44d9029b1270a757cddc766a1bcb63'; // Demo key
  }

  // Search for movie by title and year
  async searchMovie(title, year = null) {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: title,
        ...(year && { year: year })
      });

      const targetUrl = `${this.baseURL}/search/movie?${params}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results?.[0] || null;
    } catch (error) {
      console.error('TMDB movie search failed:', error);
      return null;
    }
  }

  // Get movie details
  async getMovieDetails(movieId) {
    try {
      const targetUrl = `${this.baseURL}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=credits,videos,watch/providers,images`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.id) {
        return this.processMovieData(data);
      }
      throw new Error('Invalid movie data received');
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  }

  // Get show details
  async getShowDetails(showId) {
    try {
      const targetUrl = `${this.baseURL}/tv/${showId}?api_key=${this.apiKey}&append_to_response=credits,videos,watch/providers,images`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.id) {
        return this.processShowData(data);
      }
      throw new Error('Invalid show data received');
    } catch (error) {
      console.error('Error fetching show details:', error);
      return null;
    }
  }

  // Get season episodes
  async getSeasonEpisodes(showId, seasonNumber) {
    try {
      const targetUrl = `${this.baseURL}/tv/${showId}/season/${seasonNumber}?api_key=${this.apiKey}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.episodes && Array.isArray(data.episodes)) {
        return data.episodes;
      }
      throw new Error('Invalid episodes data received');
    } catch (error) {
      console.error('Error fetching season episodes:', error);
      return [];
    }
  }

  // Get episode details
  async getEpisodeDetails(showId, seasonNumber, episodeNumber) {
    try {
      const targetUrl = `${this.baseURL}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${this.apiKey}&append_to_response=credits,images`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.id) {
        return this.processEpisodeData(data);
      }
      throw new Error('Invalid episode data received');
    } catch (error) {
      console.error('Error fetching episode details:', error);
      return null;
    }
  }

  // Get similar movies
  async getSimilarMovies(movieId) {
    try {
      const targetUrl = `${this.baseURL}/movie/${movieId}/similar?api_key=${this.apiKey}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results?.map(movie => ({
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path ? this.getPosterURL(movie.poster_path) : 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        rating: movie.vote_average || 0,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'
      })) || [];
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      return [];
    }
  }

  // Get similar shows
  async getSimilarShows(showId) {
    try {
      const targetUrl = `${this.baseURL}/tv/${showId}/similar?api_key=${this.apiKey}`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results?.map(show => ({
        id: show.id,
        title: show.name,
        poster: show.poster_path ? this.getPosterURL(show.poster_path) : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        rating: show.vote_average || 0,
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'TBA'
      })) || [];
    } catch (error) {
      console.error('Error fetching similar shows:', error);
      return [];
    }
  }

  // Process movie data
  processMovieData(data) {
    return {
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster: data.poster_path ? this.getPosterURL(data.poster_path) : 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      backdrop: data.backdrop_path ? this.getBackdropURL(data.backdrop_path) : 'https://images.unsplash.com/photo-1489599849827-2e8d2a9a3bd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      logo: this.getLogoURL(data.images?.logos),
      releaseDate: data.release_date,
      runtime: data.runtime ? `${data.runtime} min` : null,
      rating: data.vote_average || 0,
      voteCount: data.vote_count || 0,
      genres: data.genres || [],
      cast: data.credits?.cast?.slice(0, 10) || [],
      crew: data.credits?.crew || [],
      countries: data.production_countries || [],
      companies: data.production_companies || [],
      languages: data.spoken_languages || [],
      videos: data.videos?.results || [],
      watchProviders: data['watch/providers']?.results?.US || null,
      budget: data.budget || 0,
      revenue: data.revenue || 0
    };
  }

  // Process show data
  processShowData(data) {
    return {
      id: data.id,
      title: data.name,
      overview: data.overview,
      poster: data.poster_path ? this.getPosterURL(data.poster_path) : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      backdrop: data.backdrop_path ? this.getBackdropURL(data.backdrop_path) : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      logo: this.getLogoURL(data.images?.logos),
      firstAirDate: data.first_air_date,
      lastAirDate: data.last_air_date,
      status: data.status,
      episodeRunTime: data.episode_run_time?.[0] || null,
      numberOfSeasons: data.number_of_seasons || 0,
      numberOfEpisodes: data.number_of_episodes || 0,
      rating: data.vote_average || 0,
      genres: data.genres || [],
      networks: data.networks || [],
      cast: data.credits?.cast?.slice(0, 10) || [],
      crew: data.credits?.crew || [],
      videos: data.videos?.results || [],
      seasons: data.seasons || [],
      watchProviders: data['watch/providers']?.results?.US || null
    };
  }

  // Process episode data
  processEpisodeData(data) {
    return {
      id: data.id,
      title: data.name,
      overview: data.overview,
      seasonNumber: data.season_number,
      episodeNumber: data.episode_number,
      airDate: data.air_date,
      runtime: data.runtime,
      rating: data.vote_average || 0,
      voteCount: data.vote_count || 0,
      stillPath: data.still_path ? this.getPosterURL(data.still_path) : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      cast: data.credits?.cast?.slice(0, 10) || [],
      crew: data.credits?.crew || []
    };
  }

  // Get poster URL from TMDB path
  getPosterURL(posterPath, size = 'w300') {
    if (!posterPath) return null;
    return `${this.imageBaseURL}/${size}${posterPath}`;
  }

  // Get backdrop URL from TMDB path
  getBackdropURL(backdropPath, size = 'w1280') {
    if (!backdropPath) return null;
    return `${this.imageBaseURL}/${size}${backdropPath}`;
  }

  // Get streaming platforms with enhanced provider links
  getStreamingPlatforms(watchProviders) {
    if (!watchProviders) return [];
    
    const platforms = [];
    
    if (watchProviders.flatrate) {
      platforms.push({
        type: 'Stream',
        icon: 'play',
        providers: watchProviders.flatrate,
        label: 'Included'
      });
    }
    
    if (watchProviders.rent) {
      platforms.push({
        type: 'Rent',
        icon: 'dollar-sign',
        providers: watchProviders.rent,
        label: 'Rent'
      });
    }
    
    if (watchProviders.buy) {
      platforms.push({
        type: 'Buy',
        icon: 'shopping-cart',
        providers: watchProviders.buy,
        label: 'Buy'
      });
    }
    
    return platforms;
  }

  // Get provider direct links
  getProviderLink(providerName) {
    const providers = {
      'Netflix': 'https://netflix.com',
      'Amazon Prime Video': 'https://primevideo.com',
      'Disney Plus': 'https://disneyplus.com',
      'HBO Max': 'https://max.com',
      'Hulu': 'https://hulu.com',
      'Apple TV Plus': 'https://tv.apple.com',
      'Paramount Plus': 'https://paramountplus.com',
      'Peacock': 'https://peacocktv.com',
      'YouTube': 'https://youtube.com/movies',
      'Google Play Movies & TV': 'https://play.google.com/store/movies',
      'Vudu': 'https://vudu.com',
      'Microsoft Store': 'https://microsoft.com/movies-and-tv'
    };
    return providers[providerName] || null;
  }

  // Get all available providers for platform icons
  getAllProviders(watchProviders) {
    if (!watchProviders) return [];
    
    const allProviders = [];
    
    // Combine all provider types
    ['flatrate', 'rent', 'buy'].forEach(type => {
      if (watchProviders[type]) {
        watchProviders[type].forEach(provider => {
          if (!allProviders.find(p => p.provider_id === provider.provider_id)) {
            allProviders.push({
              ...provider,
              type: type === 'flatrate' ? 'Stream' : type === 'rent' ? 'Rent' : 'Buy',
              link: this.getProviderLink(provider.provider_name)
            });
          }
        });
      }
    });
    
    return allProviders;
  }

  // Get cast member details and filmography
  async getCastDetails(castId) {
    try {
      const targetUrl = `${this.baseURL}/person/${castId}?api_key=${this.apiKey}&append_to_response=movie_credits,tv_credits,images,external_ids`;
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.id) {
        return this.processCastData(data);
      }
      throw new Error('Invalid cast data received');
    } catch (error) {
      console.error('Error fetching cast details:', error);
      return null;
    }
  }

  // Process cast member data
  processCastData(data) {
    return {
      id: data.id,
      name: data.name,
      biography: data.biography,
      birthday: data.birthday,
      deathday: data.deathday,
      birthPlace: data.place_of_birth,
      knownFor: data.known_for_department,
      profileImage: data.profile_path ? this.getPosterURL(data.profile_path, 'w500') : null,
      popularity: data.popularity,
      homepage: data.homepage,
      externalIds: {
        instagram_id: data.external_ids?.instagram_id,
        twitter_id: data.external_ids?.twitter_id,
        facebook_id: data.external_ids?.facebook_id,
        imdb_id: data.external_ids?.imdb_id
      },
      movieCredits: this.processCredits(data.movie_credits?.cast || [], 'movie'),
      tvCredits: this.processCredits(data.tv_credits?.cast || [], 'tv')
    };
  }

  // Process movie/TV credits
  processCredits(credits, type) {
    return credits.map(credit => ({
      id: credit.id,
      title: type === 'movie' ? credit.title : credit.name,
      character: credit.character,
      poster: credit.poster_path ? this.getPosterURL(credit.poster_path) : null,
      year: type === 'movie' 
        ? (credit.release_date ? new Date(credit.release_date).getFullYear() : null)
        : (credit.first_air_date ? new Date(credit.first_air_date).getFullYear() : null),
      rating: credit.vote_average || 0,
      overview: credit.overview
    })).sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  // Get logo URL from images array
  getLogoURL(logos) {
    if (!logos || !Array.isArray(logos) || logos.length === 0) return null;
    
    // Prefer English logos first, then any other language
    const englishLogo = logos.find(logo => logo.iso_639_1 === 'en');
    const anyLogo = logos[0];
    
    const selectedLogo = englishLogo || anyLogo;
    return selectedLogo ? `${this.imageBaseURL}/w500${selectedLogo.file_path}` : null;
  }

  // Get key crew members
  getKeyCrewMembers(crew) {
    const directors = crew.filter(person => person.job === 'Director');
    const writers = crew.filter(person => 
      person.job === 'Writer' || 
      person.job === 'Screenplay' || 
      person.job === 'Story'
    );
    
    return { directors, writers };
  }

  // Format currency for budget/revenue display
  formatCurrency(amount) {
    if (!amount || amount === 0) return 'Unknown';
    
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    
    return `$${amount.toLocaleString()}`;
  }

  // Get box office performance text
  getBoxOfficePerformance(budget, revenue) {
    if (!budget || !revenue || budget === 0 || revenue === 0) {
      return { text: 'Unknown', color: 'text-[var(--text-muted)]' };
    }
    
    const profitRatio = revenue / budget;
    
    if (profitRatio >= 3) {
      return { text: 'Blockbuster Success', color: 'text-green-400' };
    } else if (profitRatio >= 2) {
      return { text: 'Strong Performance', color: 'text-green-300' };
    } else if (profitRatio >= 1.5) {
      return { text: 'Profitable', color: 'text-cyan-400' };
    } else if (profitRatio >= 1) {
      return { text: 'Break Even', color: 'text-yellow-400' };
    } else {
      return { text: 'Box Office Disappointment', color: 'text-red-400' };
    }
  }
}

// Create global instance
const TMDB_API = new TMDBAPI();

// Legacy support
const tmdbAPI = TMDB_API;
