// Notification API utilities for managing user preferences and release alerts
window.NotificationAPI = (() => {
  
  // Get user notification preferences
  const getNotificationPreferences = () => {
    const stored = localStorage.getItem('acesync_notification_prefs');
    return stored ? JSON.parse(stored) : {
      enableNotifications: true,
      emailNotifications: false,
      pushNotifications: true,
      watchlistNotifications: true,
      newEpisodes: true,
      newMovies: true,
      newSeasons: true,
      upcomingReleases: true,
      notifyBefore: 24, // hours
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  };

  // Save notification preferences
  const saveNotificationPreferences = (preferences) => {
    localStorage.setItem('acesync_notification_prefs', JSON.stringify(preferences));
    return Promise.resolve(preferences);
  };

  // Get user's tracked content for notifications
  const getTrackedContent = () => {
    const stored = localStorage.getItem('acesync_tracked_content');
    return stored ? JSON.parse(stored) : [];
  };

  // Add content to tracking list
  const addToTracking = (content) => {
    const tracked = getTrackedContent();
    const exists = tracked.find(item => item.id === content.id && item.type === content.type);
    
    if (!exists) {
      tracked.push({
        ...content,
        trackedAt: new Date().toISOString(),
        notifyFor: ['new_episodes', 'new_seasons']
      });
      localStorage.setItem('acesync_tracked_content', JSON.stringify(tracked));
    }
    
    return Promise.resolve(tracked);
  };

  // Remove content from tracking
  const removeFromTracking = (contentId, type) => {
    const tracked = getTrackedContent();
    const updated = tracked.filter(item => !(item.id === contentId && item.type === type));
    localStorage.setItem('acesync_tracked_content', JSON.stringify(updated));
    return Promise.resolve(updated);
  };

  // Get recent notifications
  const getRecentNotifications = () => {
    const stored = localStorage.getItem('acesync_notifications');
    return stored ? JSON.parse(stored) : generateMockNotifications();
  };

  // Generate mock notifications for demo
  const generateMockNotifications = () => {
    const now = new Date();
    return [
      {
        id: 1,
        type: 'new_episode',
        title: 'New Episode Available',
        message: 'Stranger Things S5E3 "The Upside Down Returns" is now available',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        contentId: 'tt4574334',
        contentType: 'show'
      },
      {
        id: 2,
        type: 'upcoming_release',
        title: 'Upcoming Release',
        message: 'The Batman 2 releases tomorrow on HBO Max',
        timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        read: false,
        contentId: 'tt1877830',
        contentType: 'movie'
      },
      {
        id: 3,
        type: 'watchlist_available',
        title: 'Watchlist Item Available',
        message: 'Dune: Part Three is now streaming on Netflix',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        contentId: 'tt15239678',
        contentType: 'movie'
      }
    ];
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    const notifications = getRecentNotifications();
    const updated = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('acesync_notifications', JSON.stringify(updated));
    return Promise.resolve(updated);
  };

  // Check for new releases (mock implementation)
  const checkForNewReleases = async () => {
    // In a real app, this would call external APIs
    const tracked = getTrackedContent();
    const newReleases = [];
    
    // Mock some new releases
    tracked.forEach(item => {
      if (Math.random() > 0.8) { // 20% chance of new content
        newReleases.push({
          ...item,
          newContent: item.type === 'show' ? 'New Episode Available' : 'Now Available to Stream'
        });
      }
    });
    
    return newReleases;
  };

  return {
    getNotificationPreferences,
    saveNotificationPreferences,
    getTrackedContent,
    addToTracking,
    removeFromTracking,
    getRecentNotifications,
    markAsRead,
    checkForNewReleases
  };
})();