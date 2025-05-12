class StorageManager {
  /**
   * Generate a unique page identifier
   * @param {string} url - Current page URL
   * @returns {string} Unique page identifier
   */
  static generatePageId(url) {
    // Create a more robust page identification strategy
    const parsedUrl = new URL(url);
    // Combine hostname and path, ignore query parameters
    return `${parsedUrl.hostname}${parsedUrl.pathname}`;
  }

  /**
   * Save a note to local storage
   * @param {Object} note - Note object to save
   * @returns {Promise<void>}
   */
  static async saveNote(note) {
    try {
      const pageId = this.generatePageId(note.pageUrl);

      // Retrieve existing notes for this page
      const { pageNotes = {} } = await chrome.storage.local.get(pageId);

      // Add or update note
      pageNotes[note.id] = note;

      // Save updated notes
      await chrome.storage.local.set({
        [pageId]: pageNotes,
      });
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  }

  /**
   * Retrieve notes for a specific page
   * @param {string} url - Page URL to retrieve notes for
   * @returns {Promise<Object>} Notes for the page
   */
  static async getNotes(url) {
    try {
      const pageId = this.generatePageId(url);
      const result = await chrome.storage.local.get(pageId);
      return result[pageId] || {};
    } catch (error) {
      console.error("Failed to retrieve notes:", error);
      return {};
    }
  }

  /**
   * Delete a specific note
   * @param {string} url - Page URL
   * @param {string} noteId - ID of note to delete
   */
  static async deleteNote(url, noteId) {
    try {
      const pageId = this.generatePageId(url);
      const { pageNotes = {} } = await chrome.storage.local.get(pageId);

      delete pageNotes[noteId];

      await chrome.storage.local.set({
        [pageId]: pageNotes,
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  /**
   * Export notes for backup/sync
   * @returns {Promise<Object>} All stored notes
   */
  static async exportNotes() {
    try {
      const allNotes = await chrome.storage.local.get(null);
      return allNotes;
    } catch (error) {
      console.error("Failed to export notes:", error);
      return {};
    }
  }

  /**
   * Import notes from backup
   * @param {Object} notesBackup - Notes to import
   */
  static async importNotes(notesBackup) {
    try {
      await chrome.storage.local.set(notesBackup);
    } catch (error) {
      console.error("Failed to import notes:", error);
    }
  }
}

export default StorageManager;
