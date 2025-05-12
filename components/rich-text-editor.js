class RichTextEditor {
  /**
   * Create a rich text editor for notes
   * @param {HTMLElement} containerElement - Container to attach the editor
   * @param {Function} onChangeCallback - Callback for content changes
   */
  constructor(containerElement, onChangeCallback) {
    this.container = containerElement;
    this.onChangeCallback = onChangeCallback;
    this.createEditorStructure();
  }

  /**
   * Create the editor structure
   */
  createEditorStructure() {
    // Create main editor container
    this.editorContainer = document.createElement("div");
    this.editorContainer.classList.add("web-note-editor");

    // Toolbar for formatting
    this.toolbar = this.createToolbar();

    // Content editable area
    this.editorContent = document.createElement("div");
    this.editorContent.contentEditable = "true";
    this.editorContent.classList.add("web-note-content");
    this.editorContent.setAttribute(
      "data-placeholder",
      "Write your note here..."
    );

    // Append elements
    this.editorContainer.appendChild(this.toolbar);
    this.editorContainer.appendChild(this.editorContent);

    // Replace container content
    this.container.innerHTML = "";
    this.container.appendChild(this.editorContainer);

    // Bind events
    this.bindEvents();
  }

  /**
   * Create formatting toolbar
   * @returns {HTMLElement} Toolbar element
   */
  createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.classList.add("web-note-toolbar");

    // Formatting buttons
    const formatOptions = [
      {
        name: "bold",
        icon: "𝐁",
        action: () => this.applyFormat("bold"),
      },
      {
        name: "italic",
        icon: "𝐼",
        action: () => this.applyFormat("italic"),
      },
      {
        name: "underline",
        icon: "𝐔",
        action: () => this.applyFormat("underline"),
      },
      {
        name: "list",
        icon: "•",
        action: () => this.applyFormat("insertUnorderedList"),
      },
    ];

    formatOptions.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option.icon;
      button.title = option.name;
      button.addEventListener("click", option.action);
      toolbar.appendChild(button);
    });

    return toolbar;
  }

  /**
   * Apply text formatting
   * @param {string} command - Formatting command
   */
  applyFormat(command) {
    document.execCommand(command, false, null);
    this.editorContent.focus();
    this.notifyContentChange();
  }

  /**
   * Bind content change events
   */
  bindEvents() {
    // Content change event
    this.editorContent.addEventListener("input", () => {
      this.notifyContentChange();
    });

    // Prevent unnecessary line breaks
    this.editorContent.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
      }
    });
  }

  /**
   * Notify parent of content changes
   */
  notifyContentChange() {
    if (this.onChangeCallback) {
      // Sanitize HTML to prevent XSS
      const sanitizedContent = this.sanitizeHTML(this.editorContent.innerHTML);
      this.onChangeCallback(sanitizedContent);
    }
  }

  /**
   * Sanitize HTML content
   * @param {string} html - Raw HTML content
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Remove potentially dangerous attributes
    const allowedTags = ["b", "i", "u", "ul", "li", "div"];
    const elements = temp.getElementsByTagName("*");

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];

      // Remove non-allowed tags
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        element.remove();
        continue;
      }

      // Remove all attributes
      while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
      }
    }

    return temp.innerHTML;
  }

  /**
   * Set initial content
   * @param {string} content - Initial HTML content
   */
  setContent(content) {
    this.editorContent.innerHTML = content || "";
  }

  /**
   * Get current content
   * @returns {string} Current HTML content
   */
  getContent() {
    return this.editorContent.innerHTML;
  }
}

export default RichTextEditor;
