function CalendarContent() {
  const [currentDate, setCurrentDate] = React.useState(new Date(2025, 9, 15));
  const [calendarData, setCalendarData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('all');
  const [autoUpdateInterval, setAutoUpdateInterval] = React.useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchCalendarData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      if (!TraktAPI.isAuthenticated()) {
        const mockItems = CalendarAPI.getMockCalendarData();
        const processedItems = await CalendarAPI.processCalendarItems(mockItems);
        const groupedData = CalendarAPI.groupByDate(processedItems);
        setCalendarData(groupedData);
        return;
      }

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const rawData = await CalendarAPI.getCalendarData(startDate, 30);
      
      const [processedShows, processedMovies, processedPremieres] = await Promise.all([
        CalendarAPI.processCalendarItems(rawData.shows, 'show'),
        CalendarAPI.processCalendarItems(rawData.movies, 'movie'),
        CalendarAPI.processCalendarItems(rawData.premieres, 'premiere')
      ]);

      const filteredShows = [];
      const filteredMovies = [];
      const filteredPremieres = [];

      for (const item of processedShows) {
        const shouldHide = await CalendarAPI.shouldHideItem(item);
        if (!shouldHide) filteredShows.push(item);
      }

      for (const item of processedMovies) {
        const shouldHide = await CalendarAPI.shouldHideItem(item);
        if (!shouldHide) filteredMovies.push(item);
      }

      for (const item of processedPremieres) {
        filteredPremieres.push(item);
      }

      const allItems = [...filteredShows, ...filteredMovies, ...filteredPremieres];
      
      setCalendarData({
        all: CalendarAPI.groupByDate(allItems),
        shows: CalendarAPI.groupByDate(filteredShows),
        movies: CalendarAPI.groupByDate(filteredMovies),
        premieres: CalendarAPI.groupByDate(filteredPremieres)
      });

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      const mockItems = CalendarAPI.getMockCalendarData();
      const processedItems = await CalendarAPI.processCalendarItems(mockItems);
      const groupedData = CalendarAPI.groupByDate(processedItems);
      setCalendarData({ all: groupedData, shows: {}, movies: {}, premieres: {} });
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  React.useEffect(() => {
    fetchCalendarData();
    
    if (autoUpdateInterval) {
      clearInterval(autoUpdateInterval);
    }
    
    const interval = setInterval(() => {
      console.log('Auto-updating calendar data...');
      fetchCalendarData();
    }, 60 * 60 * 1000);
    
    setAutoUpdateInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchCalendarData]);

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2025, 9, 15));
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handleReminderToggle = (item) => {
    const hasReminder = notificationManager.hasReminder(item.id);
    
    if (hasReminder) {
      notificationManager.removeReminder(item.id);
    } else {
      notificationManager.addReminder(item);
    }
    
    setSelectedDate(prev => prev ? {...prev} : null);
  };

  const getCurrentTabData = () => {
    if (typeof calendarData === 'object' && calendarData[activeTab]) {
      return calendarData[activeTab];
    }
    return calendarData.all || calendarData || {};
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="shine-text text-xl">Loading your followed content...</div>
      </div>
    );
  }

  const days = getCalendarDays();
  const today = new Date(2025, 9, 15);
  const currentTabData = getCurrentTabData();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent mb-4">
          Release Calendar
        </h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
          Stay updated with upcoming releases from your watchlist and followed shows. All times shown in Indian Standard Time.
        </p>
      </div>

      <div className="glass-effect rounded-2xl p-8">
        <div className="flex justify-center mb-8">
          <div className="flex bg-[var(--accent-color)] rounded-xl p-1">
            {['all', 'shows', 'movies', 'premieres'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg transition-all duration-300 capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] text-white shadow-lg'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
                }`}
              >
                {tab === 'all' ? 'All Content' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--text-light)]">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button onClick={previousMonth} 
                  className="flex items-center gap-2 btn-secondary">
            <div className="icon-chevron-left text-xl"></div>
            Previous
          </button>
          
          <button onClick={goToToday} className="btn-primary">
            Today
          </button>
          
          <button onClick={nextMonth} 
                  className="flex items-center gap-2 btn-secondary">
            Next
            <div className="icon-chevron-right text-xl"></div>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-[var(--text-muted)]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayData = currentTabData[dateKey] || [];
            const isToday = day.toDateString() === today.toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            
            return (
              <div
                key={index}
                className={`min-h-[140px] p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isToday 
                    ? 'bg-gradient-to-br from-[var(--primary-color)]/30 to-[var(--gradient-to)]/20 border-[var(--primary-color)] shadow-lg' 
                    : isCurrentMonth
                      ? 'bg-[var(--accent-color)] border-[var(--border-color)] hover:bg-[var(--accent-color)]/80' 
                      : 'bg-[var(--secondary-color)]/30 border-[var(--border-color)]/30 opacity-60'
                } ${dayData.length > 0 ? 'hover:shadow-lg hover:shadow-purple-500/10' : ''}`}
                onClick={() => dayData.length > 0 && setSelectedDate({ date: dateKey, data: dayData })}
              >
                <div className={`text-lg font-bold mb-2 ${
                  isToday ? 'text-white' : isCurrentMonth ? 'text-[var(--text-light)]' : 'text-[var(--text-muted)]'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayData.slice(0, 2).map((item, i) => {
                    const countdown = CalendarAPI.getTimeUntilRelease(item.releaseDate);
                    return (
                      <div key={`${dateKey}-${i}-${item.id}`} 
                           className="flex items-center gap-2 p-1 bg-[var(--card-bg)]/50 rounded text-xs">
                        {item.poster && (
                          <img src={item.poster} alt="" className="w-4 h-6 object-cover rounded flex-shrink-0"/>
                        )}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.type === 'episode' ? 'bg-cyan-400' : item.type === 'movie' ? 'bg-purple-400' : 'bg-orange-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white truncate">{item.title}</div>
                          <div className="text-[var(--text-muted)] text-[10px]">{countdown}</div>
                        </div>
                      </div>
                    );
                  })}
                  {dayData.length > 2 && (
                    <div className="text-xs text-[var(--text-muted)] text-center py-1">
                      +{dayData.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
             onClick={(e) => e.target === e.currentTarget && setSelectedDate(null)}>
          <div className="glass-effect rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[var(--text-light)]">
                Releases on {new Date(selectedDate.date).toLocaleDateString('en-IN', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </h3>
              <button onClick={() => setSelectedDate(null)} 
                      className="w-8 h-8 rounded-lg bg-[var(--accent-color)] flex items-center justify-center hover:bg-[var(--border-color)] transition-colors">
                <div className="icon-x text-xl text-white"></div>
              </button>
            </div>
            
            <div className="grid gap-4">
              {selectedDate.data.map((item, index) => {
                const hasReminder = notificationManager.hasReminder(item.id);
                const countdown = CalendarAPI.getTimeUntilRelease(item.releaseDate);
                const istTime = item.releaseDate ? item.releaseDate.toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }) : '';
                
                return (
                  <div key={`modal-${selectedDate.date}-${index}-${item.id}`} 
                       className="flex items-start gap-4 p-4 bg-[var(--background-dark)] rounded-xl">
                    {item.poster && (
                      <img src={item.poster} alt={item.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0"/>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === 'episode' ? 'bg-cyan-400' : item.type === 'movie' ? 'bg-purple-400' : 'bg-orange-400'
                        }`}></div>
                        <span className="text-sm font-medium text-[var(--primary-color)] capitalize">{item.type}</span>
                        <span className="text-sm text-[var(--text-muted)]">{istTime}</span>
                        <span className="text-xs bg-[var(--accent-color)] px-2 py-1 rounded text-[var(--text-light)]">{countdown}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-[var(--text-light)] mb-2">{item.title}</h4>
                      {item.episode && (
                        <div className="text-sm text-[var(--text-muted)] mb-2">
                          Season {item.episode.season}, Episode {item.episode.number}
                        </div>
                      )}
                      {item.overview && (
                        <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-3">{item.overview}</p>
                      )}
                      <button
                        onClick={() => handleReminderToggle(item)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          hasReminder
                            ? 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]'
                            : 'bg-[var(--accent-color)] text-[var(--text-light)] hover:bg-[var(--border-color)]'
                        }`}
                      >
                        <div className={`icon-bell text-sm ${hasReminder ? 'text-white' : 'text-[var(--primary-color)]'}`}></div>
                        {hasReminder ? 'Reminder Set' : 'Remind Me'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}