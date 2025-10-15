function NotificationToast({ message, type = 'success', isVisible, onClose }) {
  try {
    React.useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const bgColor = type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90';
    const icon = type === 'success' ? 'check-circle' : 'x-circle';

    return (
      <div 
        className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg backdrop-blur-md border border-white/20 z-50 transform transition-all duration-300 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        data-name="notification-toast" 
        data-file="components/NotificationToast.js"
      >
        <div className="flex items-center space-x-3">
          <div className={`icon-${icon} text-xl`}></div>
          <span className="font-medium">{message}</span>
          <button 
            onClick={onClose}
            className="icon-x text-lg hover:bg-white/20 rounded-full p-1 transition-colors"
          ></button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('NotificationToast component error:', error);
    return null;
  }
}