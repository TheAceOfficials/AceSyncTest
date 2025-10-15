function Hero() {
  try {
    const isAuthenticated = TraktAPI && TraktAPI.isAuthenticated();

    if (isAuthenticated) {
      return (
        <section className="py-12 px-4 text-center relative overflow-hidden" data-name="hero" data-file="components/Hero.js">
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                Welcome back to AceSync
              </span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] mb-6">
              Continue your premium entertainment journey
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="py-16 px-4 text-center relative overflow-hidden" data-name="hero" data-file="components/Hero.js">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[var(--text-light)] to-[var(--text-muted)] bg-clip-text text-transparent">Premium.</span>
            <span className="bg-gradient-to-r from-[var(--text-light)] to-[var(--text-muted)] bg-clip-text text-transparent"> Sleek.</span>
            <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--gradient-to)] bg-clip-text text-transparent"> Synchronized.</span>
          </h1>
          
          <p className="text-xl text-[var(--text-muted)] mb-8 leading-relaxed max-w-2xl mx-auto">
            Experience the next level of entertainment tracking designed for premium users.
          </p>

          <button className="btn-primary text-lg" onClick={() => window.location.href = TraktAPI ? TraktAPI.getAuthUrl() : '#'}>
            Start Premium Experience
          </button>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Hero component error:', error);
    return null;
  }
}
