/**
 * Web Notes Background Service Worker
 * Handles extension-wide events and messaging
 */
class WebNotesBackground {
  constructor() {
    this.initializeListeners();
  }

  /**
   * Initialize event listeners
   */
  initializeListeners() {
    // Listen for keyboard shortcut
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  /**
   * Handle extension commands
   * @param {string} command - Triggered command
   */
  handleCommand(command) {
    switch (command) {
      case "create-note":
        this.createNoteOnActiveTab();
        break;
    }
  }

  /**
   * Create a note on the active tab
   */
  async createNoteOnActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to content script to create a note
      chrome.tabs.sendMessage(tab.id, {
        action: "createFreeFloatingNote",
        position: {
          x: 50,
          y: 50,
        },
      });
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  /**
   * Handle messages from different parts of the extension
   * @param {Object} message - Message object
   * @param {Object} sender - Sender details
   * @param {Function} sendResponse - Response callback
   */
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "createFreeFloatingNote":
        // Potential future extensibility for preprocessing
        return true;

      case "createHighlightBoundNote":
        // Potential future extensibility for preprocessing
        return true;

      default:
        return false;
    }
  }
}

// Initialize background service
new WebNotesBackground();
