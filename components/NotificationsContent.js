// NotificationsList Component
function NotificationsList({ notifications, onMarkRead }) {
  try {
    if (notifications.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="icon-bell-off text-4xl text-[var(--text-muted)] mb-4"></div>
          <h3 className="text-xl font-semibold text-[var(--text-light)] mb-2">No notifications yet</h3>
          <p className="text-[var(--text-muted)]">We'll notify you when there's something new</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {notifications.map(notification => (
          <div key={notification.id} className={`card p-4 cursor-pointer ${!notification.read ? 'border-[var(--primary-color)]' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`icon-${notification.type === 'new_episode' ? 'tv' : notification.type === 'upcoming_release' ? 'calendar' : 'heart'} text-lg text-[var(--primary-color)]`}></div>
                  <h4 className="font-semibold text-[var(--text-light)]">{notification.title}</h4>
                  {!notification.read && <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full"></div>}
                </div>
                <p className="text-[var(--text-muted)] mb-2">{notification.message}</p>
                <p className="text-sm text-[var(--text-muted)]">{new Date(notification.timestamp).toLocaleString()}</p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] text-sm font-medium"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('NotificationsList error:', error);
    return null;
  }
}

// NotificationPreferences Component
function NotificationPreferences({ preferences, onUpdate }) {
  try {
    const handleToggle = (key, value) => {
      onUpdate({ ...preferences, [key]: value });
    };

    return (
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-xl font-semibold text-[var(--text-light)] mb-4">General Settings</h3>
          <div className="space-y-4">
            <ToggleSwitch
              label="Enable Notifications"
              description="Receive notifications for new releases"
              checked={preferences.enableNotifications}
              onChange={(checked) => handleToggle('enableNotifications', checked)}
            />
            <ToggleSwitch
              label="Email Notifications"
              description="Get notified via email"
              checked={preferences.emailNotifications}
              onChange={(checked) => handleToggle('emailNotifications', checked)}
            />
            <ToggleSwitch
              label="Push Notifications"
              description="Browser push notifications"
              checked={preferences.pushNotifications}
              onChange={(checked) => handleToggle('pushNotifications', checked)}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-[var(--text-light)] mb-4">Content Notifications</h3>
          <div className="space-y-4">
            <ToggleSwitch
              label="New Episodes"
              description="When new episodes are released"
              checked={preferences.newEpisodes}
              onChange={(checked) => handleToggle('newEpisodes', checked)}
            />
            <ToggleSwitch
              label="New Movies"
              description="When new movies become available"
              checked={preferences.newMovies}
              onChange={(checked) => handleToggle('newMovies', checked)}
            />
            <ToggleSwitch
              label="New Seasons"
              description="When new seasons start"
              checked={preferences.newSeasons}
              onChange={(checked) => handleToggle('newSeasons', checked)}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('NotificationPreferences error:', error);
    return null;
  }
}

// TrackedContentList Component
function TrackedContentList({ content, onRemove }) {
  try {
    if (content.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="icon-heart text-4xl text-[var(--text-muted)] mb-4"></div>
          <h3 className="text-xl font-semibold text-[var(--text-light)] mb-2">No tracked content</h3>
          <p className="text-[var(--text-muted)]">Start tracking shows and movies to get notified</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.map(item => (
          <div key={`${item.id}-${item.type}`} className="card">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-[var(--text-light)]">{item.title}</h4>
              <button
                onClick={() => onRemove(item.id, item.type)}
                className="text-red-400 hover:text-red-300"
              >
                <div className="icon-x text-lg"></div>
              </button>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-3">{item.type === 'show' ? 'TV Show' : 'Movie'}</p>
            <div className="text-xs text-[var(--text-muted)]">
              Tracking since {new Date(item.trackedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('TrackedContentList error:', error);
    return null;
  }
}

// ToggleSwitch Component
function ToggleSwitch({ label, description, checked, onChange }) {
  try {
    return (
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[var(--text-light)] font-medium">{label}</div>
          <div className="text-[var(--text-muted)] text-sm">{description}</div>
        </div>
        <button
          onClick={() => onChange(!checked)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            checked ? 'bg-[var(--primary-color)]' : 'bg-[var(--accent-color)]'
          }`}
        >
          <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          } top-0.5`}></div>
        </button>
      </div>
    );
  } catch (error) {
    console.error('ToggleSwitch error:', error);
    return null;
  }
}

function NotificationsContent() {
  try {
    const [activeTab, setActiveTab] = React.useState('notifications');
    const [preferences, setPreferences] = React.useState(null);
    const [notifications, setNotifications] = React.useState([]);
    const [trackedContent, setTrackedContent] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadNotificationData();
    }, []);

    const loadNotificationData = async () => {
      try {
        setLoading(true);
        const prefs = NotificationAPI.getNotificationPreferences();
        const notifs = NotificationAPI.getRecentNotifications();
        const tracked = NotificationAPI.getTrackedContent();
        
        setPreferences(prefs);
        setNotifications(notifs);
        setTrackedContent(tracked);
      } catch (error) {
        console.error('Error loading notification data:', error);
      } finally {
        setLoading(false);
      }
    };

    const updatePreferences = async (newPrefs) => {
      try {
        await NotificationAPI.saveNotificationPreferences(newPrefs);
        setPreferences(newPrefs);
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    const markNotificationRead = async (notificationId) => {
      try {
        const updated = await NotificationAPI.markAsRead(notificationId);
        setNotifications(updated);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };

    const removeTrackedContent = async (contentId, type) => {
      try {
        const updated = await NotificationAPI.removeFromTracking(contentId, type);
        setTrackedContent(updated);
      } catch (error) {
        console.error('Error removing tracked content:', error);
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-color)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[var(--text-muted)]">Loading notifications...</p>
          </div>
        </div>
      );
    }

    return (
      <main className="container mx-auto px-4 py-8" data-name="notifications-content" data-file="components/NotificationsContent.js">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-[var(--text-muted)] mt-2">Manage your preferences and stay updated with new releases</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-[var(--card-bg)] p-2 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-[var(--primary-color)] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
            }`}
          >
            <div className="icon-bell text-lg mr-2"></div>
            Recent Alerts
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'preferences'
                ? 'bg-[var(--primary-color)] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
            }`}
          >
            <div className="icon-settings text-lg mr-2"></div>
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'tracking'
                ? 'bg-[var(--primary-color)] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-light)]'
            }`}
          >
            <div className="icon-heart text-lg mr-2"></div>
            Tracking ({trackedContent.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'notifications' && (
          <NotificationsList 
            notifications={notifications} 
            onMarkRead={markNotificationRead}
          />
        )}
        
        {activeTab === 'preferences' && preferences && (
          <NotificationPreferences 
            preferences={preferences} 
            onUpdate={updatePreferences}
          />
        )}
        
        {activeTab === 'tracking' && (
          <TrackedContentList 
            content={trackedContent} 
            onRemove={removeTrackedContent}
          />
        )}
      </main>
    );
  } catch (error) {
    console.error('NotificationsContent error:', error);
    return null;
  }
}