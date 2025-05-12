import StorageManager from "./utils/storage-manager.js";
import InputSanitizer from "./utils/input-sanitizer.js";

class WebNotesPopup {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.updateNotesStats();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.searchToggle = document.getElementById("searchToggle");
    this.searchSection = document.getElementById("searchSection");
    this.searchInput = document.getElementById("searchInput");
    this.searchResults = document.getElementById("searchResults");

    this.exportNotesBtn = document.getElementById("exportNotes");
    this.importNotesBtn = document.getElementById("importNotes");
    this.importFileInput = document.getElementById("importFileInput");

    this.freeFloatingBtn = document.getElementById("freeFloatingBtn");
    this.highlightBoundBtn = document.getElementById("highlightBoundBtn");

    this.totalNotesCount = document.getElementById("totalNotesCount");
    this.activePageNotesCount = document.getElementById("activePageNotesCount");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search toggle
    this.searchToggle.addEventListener("click", () =>
      this.searchSection.classList.toggle("hidden")
    );

    // Search input
    this.searchInput.addEventListener(
      "input",
      this.debounce(this.performSearch.bind(this), 300)
    );

    // Export notes
    this.exportNotesBtn.addEventListener("click", this.exportNotes.bind(this));

    // Import notes
    this.importNotesBtn.addEventListener("click", () =>
      this.importFileInput.click()
    );
    this.importFileInput.addEventListener(
      "change",
      this.importNotes.bind(this)
    );

    // Note type selection
    this.freeFloatingBtn.addEventListener(
      "click",
      this.createFreeFloatingNote.bind(this)
    );
    this.highlightBoundBtn.addEventListener(
      "click",
      this.createHighlightBoundNote.bind(this)
    );
  }

  /**
   * Debounce function to limit search frequency
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Perform notes search
   */
  async performSearch() {
    const query = InputSanitizer.sanitizeSearchQuery(this.searchInput.value);

    if (query.length < 2) {
      this.searchResults.innerHTML = "";
      return;
    }

    // Retrieve all notes and filter
    const allNotes = await StorageManager.exportNotes();
    const matchingNotes = this.filterNotes(allNotes, query);

    // Display results
    this.displaySearchResults(matchingNotes);
  }

  /**
   * Filter notes based on search query
   * @param {Object} allNotes - All stored notes
   * @param {string} query - Search query
   * @returns {Array} Matching notes
   */
  filterNotes(allNotes, query) {
    const results = [];

    Object.values(allNotes).forEach((pageNotes) => {
      Object.values(pageNotes).forEach((note) => {
        // Search in content and tags
        const searchText = `${note.content} ${note.tags.join(
          " "
        )}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push(note);
        }
      });
    });

    return results;
  }

  /**
   * Display search results
   * @param {Array} notes - Matching notes
   */
  displaySearchResults(notes) {
    this.searchResults.innerHTML = notes.length
      ? notes
          .map(
            (note) => `
          <div class="search-result">
            <p>${note.content.slice(0, 100)}...</p>
            <small>Page: ${new URL(note.pageUrl).hostname}</small>
          </div>
        `
          )
          .join("")
      : "<p>No notes found</p>";
  }

  /**
   * Export all notes to a JSON file
   */
  async exportNotes() {
    const allNotes = await StorageManager.exportNotes();

    const blob = new Blob([JSON.stringify(allNotes, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `web-notes-export-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Import notes from a JSON file
   * @param {Event} event - File input change event
   */
  async importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const notesBackup = JSON.parse(text);

      await StorageManager.importNotes(notesBackup);

      // Refresh stats
      this.updateNotesStats();

      alert("Notes imported successfully!");
    } catch (error) {
      console.error("Failed to import notes:", error);
      alert("Failed to import notes. Please check the file format.");
    }
  }

  /**
   * Create a free-floating note
   */
  async createFreeFloatingNote() {
    // Send message to active tab to create a note
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id, {
      action: "createFreeFloatingNote",
      position: {
        x: window.screenX + 50,
        y: window.screenY + 50,
      },
    });

    window.close(); // Close popup after triggering note creation
  }

  /**
   * Create a highlight-bound note
   */
  async createHighlightBoundNote() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id, {
      action: "createHighlightBoundNote",
    });

    window.close(); // Close popup after triggering note creation
  }

  /**
   * Update notes statistics
   */
  async updateNotesStats() {
    const allNotes = await StorageManager.exportNotes();

    // Total notes across all pages
    const totalNotes = Object.values(allNotes).reduce(
      (total, pageNotes) => total + Object.keys(pageNotes).length,
      0
    );

    // Notes on current page (if possible)
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const currentPageNotes = currentTab
      ? Object.values(
          allNotes[StorageManager.generatePageId(currentTab.url)] || {}
        ).length
      : 0;

    // Update DOM
    this.totalNotesCount.textContent = totalNotes;
    this.activePageNotesCount.textContent = currentPageNotes;
  }
}

// Initialize popup
new WebNotesPopup();
