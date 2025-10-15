function SettingsContent() {
  const [settings, setSettings] = React.useState({
    trailerAutoplay: true,
    notifications: true,
    theme: 'dark',
    language: 'en'
  });

  React.useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('acesync_settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('acesync_settings', JSON.stringify(newSettings));
    NotificationToast.show(`${key === 'trailerAutoplay' ? 'Trailer autoplay' : key} updated`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[var(--text-light)] mb-4">Settings</h1>
        <p className="text-[var(--text-muted)] text-lg">Customize your AceSync experience</p>
      </div>

      {/* Playback Settings */}
      <div className="card">
        <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
          <div className="icon-play text-[var(--primary-color)] mr-3"></div>
          Playback Settings
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[var(--accent-color)] rounded-xl">
            <div>
              <h3 className="font-semibold text-[var(--text-light)] mb-1">Trailer Autoplay</h3>
              <p className="text-sm text-[var(--text-muted)]">Automatically play trailers when opened</p>
            </div>
            <button
              onClick={() => updateSetting('trailerAutoplay', !settings.trailerAutoplay)}
              className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${
                settings.trailerAutoplay ? 'bg-[var(--primary-color)]' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${
                settings.trailerAutoplay ? 'translate-x-6' : 'translate-x-0.5'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
          <div className="icon-bell text-[var(--primary-color)] mr-3"></div>
          Notifications
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[var(--accent-color)] rounded-xl">
            <div>
              <h3 className="font-semibold text-[var(--text-light)] mb-1">Push Notifications</h3>
              <p className="text-sm text-[var(--text-muted)]">Get notified about new releases</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', !settings.notifications)}
              className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${
                settings.notifications ? 'bg-[var(--primary-color)]' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${
                settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <h2 className="text-2xl font-bold text-[var(--text-light)] mb-6 flex items-center">
          <div className="icon-user text-[var(--primary-color)] mr-3"></div>
          Account
        </h2>
        
        <div className="space-y-4">
          <button className="w-full p-4 bg-[var(--accent-color)] rounded-xl text-left hover:bg-[var(--border-color)] transition-colors">
            <h3 className="font-semibold text-[var(--text-light)] mb-1">Connected Services</h3>
            <p className="text-sm text-[var(--text-muted)]">Manage your Trakt, Discord, and Simkl connections</p>
          </button>
          
          <button className="w-full p-4 bg-[var(--accent-color)] rounded-xl text-left hover:bg-[var(--border-color)] transition-colors">
            <h3 className="font-semibold text-[var(--text-light)] mb-1">Privacy Settings</h3>
            <p className="text-sm text-[var(--text-muted)]">Control your data sharing preferences</p>
          </button>
        </div>
      </div>
    </div>
  );
}