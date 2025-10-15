function AceMeter({ type = 'movie', itemId, traktScore = null, tmdbScore = null, onVote }) {
  const [userRating, setUserRating] = React.useState(null);
  const [hoverRating, setHoverRating] = React.useState(null);
  
  // Use only Trakt data for the meter
  const meterScore = traktScore || 0;
  
  // Rating categories and colors based on Trakt score
  const getRatingCategory = (score) => {
    if (!score || score === 0) return { label: 'Not Rated', color: 'text-gray-400', barColor: 'var(--border-color)' };
    if (score >= 8.5) return { label: 'Cinema Gem', color: 'text-purple-400', barColor: '#a855f7' };
    if (score >= 6.5) return { label: 'Worth It', color: 'text-green-400', barColor: '#22c55e' };
    if (score >= 4.0) return { label: 'Casual Watch', color: 'text-orange-400', barColor: '#f97316' };
    return { label: 'Skip', color: 'text-red-400', barColor: '#ef4444' };
  };

  const category = getRatingCategory(meterScore);

  // Handle rating submission
  const handleRatingClick = (rating) => {
    const score = rating / 2; // Convert 10-star to 5-star
    setUserRating(score);
    if (onVote) {
      onVote(category.label, score);
    }
  };

  // Calculate semi-circle progress
  const circumference = Math.PI * 80; // Semi-circle circumference
  const strokeDasharray = `${circumference} ${circumference}`;
  const progress = meterScore ? (meterScore / 10) * circumference : 0;
  const strokeDashoffset = circumference - progress;

  try {
    return (
      <div className="card max-w-md mx-auto text-center" data-name="ace-meter" data-file="components/AceMeter.js">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-[var(--text-light)] mb-2">AceSync Meter</h3>
          <p className="text-sm text-[var(--text-muted)]">Community Rating System</p>
        </div>

        {/* Semi-Circle Meter Display */}
        <div className="mb-8">
          <div className="relative w-48 h-28 mx-auto mb-4">
            {/* Semi-Circle SVG */}
            <svg className="w-full h-full" viewBox="0 0 120 70">
              {/* Background Semi-Circle */}
              <path
                d="M 20 60 A 40 40 0 0 1 100 60"
                stroke="var(--border-color)"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
              />
              
              {/* Progress Semi-Circle */}
              {meterScore > 0 && (
                <path
                  d="M 20 60 A 40 40 0 0 1 100 60"
                  stroke={category.barColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              )}
            </svg>
            
            {/* Score Text */}
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--text-light)]">
                  {meterScore ? meterScore.toFixed(1) : '--'}
                </div>
                <div className="text-xs text-[var(--text-muted)]">/ 10</div>
              </div>
            </div>
          </div>
          
          <div className={`font-semibold mb-2 ${category.color}`}>
            {category.label}
          </div>
          
          <div className="text-sm text-[var(--text-muted)]">
            Based on Trakt community ratings
          </div>
        </div>

        {/* User Rating Stars */}
        <div className="mb-4">
          <div className="text-sm text-[var(--text-muted)] mb-3">Rate this {type}:</div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="w-6 h-6 transition-all duration-200 hover:scale-110"
              >
                <div 
                  className={`icon-star text-lg ${
                    star <= (hoverRating || userRating * 2 || 0) 
                      ? 'text-yellow-400' 
                      : 'text-[var(--border-color)]'
                  }`}
                ></div>
              </button>
            ))}
          </div>
          {userRating && (
            <div className="text-sm text-[var(--text-muted)] mt-2">
              Your rating: {userRating.toFixed(1)}/5
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 justify-center">
          <button className="btn-secondary text-sm py-2 px-4">
            <div className="icon-bookmark text-sm mr-2"></div>
            Watchlist
          </button>
          <button className="btn-secondary text-sm py-2 px-4">
            <div className="icon-check text-sm mr-2"></div>
            Watched
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AceMeter component error:', error);
    return (
      <div className="card max-w-md mx-auto text-center p-8">
        <div className="text-[var(--text-muted)]">Rating system unavailable</div>
      </div>
    );
  }
}