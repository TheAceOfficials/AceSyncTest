function QuickActions() {
  try {
    const actions = [
      {
        icon: 'search',
        title: 'Discover Premium',
        description: 'AI-powered content recommendations',
        gradient: 'from-blue-500/20 to-blue-600/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/30'
      },
      {
        icon: 'bookmark',
        title: 'Smart Watchlist',
        description: 'Curated lists with sync across devices',
        gradient: 'from-purple-500/20 to-purple-600/20',
        iconColor: 'text-purple-400',
        borderColor: 'border-purple-500/30'
      },
      {
        icon: 'trending-up',
        title: 'Analytics',
        description: 'Deep insights into viewing patterns',
        gradient: 'from-green-500/20 to-green-600/20',
        iconColor: 'text-green-400',
        borderColor: 'border-green-500/30'
      },
      {
        icon: 'users',
        title: 'Social Sync',
        description: 'Connect and share with premium users',
        gradient: 'from-orange-500/20 to-orange-600/20',
        iconColor: 'text-orange-400',
        borderColor: 'border-orange-500/30'
      }
    ];

    return (
      <section className="py-16 px-4" data-name="quick-actions" data-file="components/QuickActions.js">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-light)] mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                Premium Features
              </span>
            </h2>
            <p className="text-xl text-[var(--text-muted)]">Unlock the full potential of entertainment tracking</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {actions.map((action, index) => (
              <div key={index} className="card group cursor-pointer hover:scale-105 transition-all duration-300 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mx-auto mb-4 border ${action.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`icon-${action.icon} text-2xl ${action.iconColor}`}></div>
                </div>
                <h3 className="font-bold text-[var(--text-light)] mb-2 group-hover:text-[var(--primary-color)] transition-colors">{action.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('QuickActions component error:', error);
    return null;
  }
}