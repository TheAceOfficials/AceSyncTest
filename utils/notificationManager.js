// Notification Manager for calendar reminders
class NotificationManager {
  constructor() {
    this.reminders = JSON.parse(localStorage.getItem('acesync_reminders') || '[]');
    this.checkInterval = null;
    this.init();
  }

  // Initialize notification system
  init() {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    
    // Start checking for due reminders every minute
    this.startReminderCheck();
  }

  // Add reminder for a calendar item
  addReminder(item) {
    const reminder = {
      id: `reminder-${item.id}-${Date.now()}`,
      itemId: item.id,
      title: item.title,
      type: item.type,
      poster: item.poster,
      releaseDate: item.releaseDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    this.reminders.push(reminder);
    this.saveReminders();
    
    return reminder;
  }

  // Remove reminder
  removeReminder(itemId) {
    this.reminders = this.reminders.filter(r => r.itemId !== itemId);
    this.saveReminders();
  }

  // Check if item has reminder
  hasReminder(itemId) {
    return this.reminders.some(r => r.itemId === itemId);
  }

  // Get all reminders
  getAllReminders() {
    return this.reminders;
  }

  // Save reminders to localStorage
  saveReminders() {
    localStorage.setItem('acesync_reminders', JSON.stringify(this.reminders));
  }

  // Start checking for due reminders
  startReminderCheck() {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, 60000); // Check every minute
  }

  // Stop reminder checking
  stopReminderCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for due reminders
  checkDueReminders() {
    const now = new Date();
    const dueReminders = this.reminders.filter(reminder => {
      const releaseDate = new Date(reminder.releaseDate);
      const timeDiff = releaseDate - now;
      
      // Trigger notification 30 minutes before release
      return timeDiff <= 30 * 60 * 1000 && timeDiff > 0;
    });

    dueReminders.forEach(reminder => {
      this.showNotification(reminder);
      // Remove after showing to prevent duplicate notifications
      this.removeReminder(reminder.itemId);
    });
  }

  // Show browser notification
  showNotification(reminder) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const typeText = reminder.type === 'movie' ? 'Movie' : 'Episode';
    const notification = new Notification(`${typeText} Releasing Soon!`, {
      body: `${reminder.title} releases in 30 minutes`,
      icon: reminder.poster || '/favicon.ico',
      badge: reminder.poster || '/favicon.ico',
      tag: reminder.id
    });

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Get reminders count
  getReminderCount() {
    return this.reminders.length;
  }

  // Clear all reminders
  clearAllReminders() {
    this.reminders = [];
    this.saveReminders();
  }
}

// Global notification manager instance
const notificationManager = new NotificationManager();