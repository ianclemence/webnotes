class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param {string} input - Raw input string
   * @returns {string} Sanitized HTML
   */
  static sanitizeHTML(input) {
    // Create a temporary div to process the input
    const temp = document.createElement("div");
    temp.textContent = input;

    // Basic sanitization: convert to text and escape HTML
    return temp.innerHTML;
  }

  /**
   * Validate and sanitize note metadata
   * @param {Object} noteData - Raw note data
   * @returns {Object} Sanitized note data
   */
  static validateNoteData(noteData) {
    // Validate and sanitize each note property
    const sanitizedNote = {
      id: this.generateUniqueId(),
      content: this.sanitizeHTML(noteData.content || ""),
      type:
        noteData.type === "highlight-bound"
          ? "highlight-bound"
          : "free-floating",
      position: {
        x: Math.max(0, Number(noteData.position?.x) || 0),
        y: Math.max(0, Number(noteData.position?.y) || 0),
      },
      tags: Array.isArray(noteData.tags)
        ? noteData.tags.slice(0, 5).map((tag) => this.sanitizeHTML(tag))
        : [],
      pageUrl: noteData.pageUrl || window.location.href,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return sanitizedNote;
  }

  /**
   * Generate a unique ID for notes
   * @returns {string} Unique identifier
   */
  static generateUniqueId() {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract and sanitize tags from content
   * @param {string} content - Note content
   * @returns {string[]} Extracted tags
   */
  static extractTags(content) {
    // Regex to find hashtags, limit to 5 tags
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex) || [];

    return matches
      .slice(0, 5)
      .map((tag) => tag.replace("#", ""))
      .map((tag) => this.sanitizeHTML(tag));
  }

  /**
   * Validate search query
   * @param {string} query - Search query
   * @returns {string} Sanitized query
   */
  static sanitizeSearchQuery(query) {
    // Limit query length and remove special characters
    return query
      .trim()
      .slice(0, 100)
      .replace(/[^\w\s#]/g, "");
  }
}

export default InputSanitizer;
