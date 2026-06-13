// Main Execution
document.addEventListener('DOMContentLoaded', () => {
  if (window.UIComponents) {
    // Initialize all modules
    window.UIComponents.initNavigation();
    window.UIComponents.initAuth();
    window.UIComponents.initHome();
    window.UIComponents.initContacts();
    window.UIComponents.initCampaigns();
    window.UIComponents.initLiveMonitor();
    window.UIComponents.initLogs();
    window.UIComponents.initLiveClock();
    window.UIComponents.initContactSearch();
    window.UIComponents.initExpandableLogs();
    window.UIComponents.initAnalyticsChart();
    window.UIComponents.initLogout();
    
    // Brief load delay to show greeting toast
    setTimeout(() => {
      window.UIComponents.showToast('System Online. Obsidian Conductor loaded.', 'success');
    }, 500);
  }
});
