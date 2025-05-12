import StorageManager from "./utils/storage-manager.js";
import InputSanitizer from "./utils/input-sanitizer.js";
import RichTextEditor from "./components/rich-text-editor.js";

class WebNotesManager {
  constructor() {
    this.notes = {};
    this.mutationTimeout = null;
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners and note tracking
   */
  initializeEventListeners() {
    // Listen for keyboard shortcut
    document.addEventListener(
      "keydown",
      this.handleKeyboardShortcut.bind(this)
    );

    // Listen for messages from popup or background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Load existing notes when page loads
    this.loadExistingNotes();

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();
  }

  /**
   * Handle incoming messages
   * @param {Object} message - Message object
   * @param {Object} sender - Sender details
   * @param {Function} sendResponse - Response callback
   */
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "createFreeFloatingNote":
        this.createNoteAtPosition(message.position);
        return true;
      case "createHighlightBoundNote":
        this.createHighlightBoundNote();
        return true;
    }
  }

  /**
   * Handle keyboard shortcut for note creation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardShortcut(event) {
    // Ctrl/Cmd + Shift + N to create a note
    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key === "N"
    ) {
      event.preventDefault();
      this.createNoteAtCursor(event);
    }
  }

  /**
   * Create a note at the current cursor position
   * @param {Event} event - Event triggering note creation
   */
  createNoteAtCursor(event) {
    this.createNoteAtPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  /**
   * Create a note at a specific position
   * @param {Object} position - Note position
   */
  createNoteAtPosition(position) {
    const note = {
      id: Date.now().toString(),
      content: "",
      position: {
        x: position.x || 50,
        y: position.y || 50,
      },
      type: "free-floating",
      pageUrl: window.location.href,
      createdAt: Date.now(),
    };

    const sanitizedNote = InputSanitizer.validateNoteData(note);
    this.renderNote(sanitizedNote);
    StorageManager.saveNote(sanitizedNote);
  }

  /**
   * Create a highlight-bound note
   */
  createHighlightBoundNote() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (!selectedText) {
      alert("Select some text to create a highlight-bound note");
      return;
    }

    const rect = range.getBoundingClientRect();
    const note = {
      id: Date.now().toString(),
      content: "",
      position: {
        x: rect.left,
        y: rect.bottom + 10,
      },
      type: "highlight-bound",
      anchorRange: {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
      },
      selectedText: selectedText,
      pageUrl: window.location.href,
      createdAt: Date.now(),
    };

    const sanitizedNote = InputSanitizer.validateNoteData(note);
    this.renderNote(sanitizedNote);
    StorageManager.saveNote(sanitizedNote);
  }

  /**
   * Render a note on the page
   * @param {Object} note - Note to render
   */
  renderNote(note) {
    // Create note element
    const noteElement = document.createElement("div");
    noteElement.classList.add("web-note", `note-type-${note.type}`);
    noteElement.id = note.id;

    // Set positioning
    noteElement.style.position = "absolute";
    noteElement.style.left = `${note.position.x}px`;
    noteElement.style.top = `${note.position.y}px`;

    // Add note controls
    this.addNoteControls(noteElement, note);

    // Initialize rich text editor
    const editor = new RichTextEditor(noteElement, (content) =>
      this.updateNoteContent(note, content)
    );

    // Set initial content
    if (note.content) {
      editor.setContent(note.content);
    }

    // Add drag functionality for free-floating notes
    if (note.type === "free-floating") {
      this.makeDraggable(noteElement, note);
    }

    document.body.appendChild(noteElement);

    // Store reference
    this.notes[note.id] = {
      element: noteElement,
      note: note,
      editor: editor,
    };
  }

  /**
   * Update note content in storage
   * @param {Object} note - Note to update
   * @param {string} content - New note content
   */
  updateNoteContent(note, content) {
    const updatedNote = {
      ...note,
      content: content,
      updatedAt: Date.now(),
    };
    StorageManager.saveNote(updatedNote);
  }

  /**
   * Add controls to a note (edit, delete, etc.)
   * @param {HTMLElement} noteElement - Note element to add controls to
   * @param {Object} note - Note data
   */
  addNoteControls(noteElement, note) {
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("note-controls");

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.addEventListener("click", () => this.deleteNote(note));

    controlsContainer.appendChild(deleteButton);
    noteElement.appendChild(controlsContainer);
  }

  /**
   * Make a note draggable
   * @param {HTMLElement} noteElement - Note element to make draggable
   * @param {Object} note - Note data
   */
  makeDraggable(noteElement, note) {
    let isDragging = false;
    let initialX, initialY;

    const dragStart = (e) => {
      initialX = e.clientX - noteElement.offsetLeft;
      initialY = e.clientY - noteElement.offsetTop;
      isDragging = true;
    };

    const drag = (e) => {
      if (!isDragging) return;
      noteElement.style.left = `${e.clientX - initialX}px`;
      noteElement.style.top = `${e.clientY - initialY}px`;
    };

    const dragEnd = () => {
      isDragging = false;
      this.updateNotePosition(note);
      document.removeEventListener("mousemove", drag);
    };

    noteElement.addEventListener("mousedown", (e) => {
      dragStart(e);
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd, { once: true });
    });
  }

  /**
   * Update note position in storage
   * @param {Object} note - Note to update
   */
  updateNotePosition(note) {
    const noteRef = this.notes[note.id];
    if (!noteRef) return;

    const updatedNote = {
      ...note,
      position: {
        x: parseInt(noteRef.element.style.left, 10),
        y: parseInt(noteRef.element.style.top, 10),
      },
    };
    StorageManager.saveNote(updatedNote);
  }

  /**
   * Delete a note
   * @param {Object} note - Note to delete
   */
  async deleteNote(note) {
    const noteRef = this.notes[note.id];
    if (noteRef) {
      noteRef.element.remove();
      delete this.notes[note.id];
    }
    await StorageManager.deleteNote(note.pageUrl, note.id);
  }

  /**
   * Load existing notes for the current page
   */
  async loadExistingNotes() {
    const pageNotes = await StorageManager.getNotes(window.location.href);
    Object.values(pageNotes).forEach((note) => this.renderNote(note));
  }

  /**
   * Set up MutationObserver to handle dynamic content
   */
  setupMutationObserver() {
    const observer = new MutationObserver(() => {
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = setTimeout(() => this.reattachNotes(), 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Reattach notes after DOM changes
   */
  reattachNotes() {
    Object.values(this.notes).forEach((noteRef) => noteRef.element.remove());
    this.notes = {};
    this.loadExistingNotes();
  }
}

// Initialize Web Notes when script loads
const webNotesManager = new WebNotesManager();
export default webNotesManager;
