import StorageManager from "./utils/storage-manager.js";
import InputSanitizer from "./utils/input-sanitizer.js";

class WebNotesManager {
  constructor() {
    this.notes = {};
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners and note tracking
   */
  initializeEventListeners() {
    // Listen for keyboard shortcut to create note
    document.addEventListener(
      "keydown",
      this.handleKeyboardShortcut.bind(this)
    );

    // Load existing notes when page loads
    this.loadExistingNotes();

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();
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
    const note = {
      content: "",
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      type: "free-floating",
      pageUrl: window.location.href,
    };

    const sanitizedNote = InputSanitizer.validateNoteData(note);
    this.renderNote(sanitizedNote);
    StorageManager.saveNote(sanitizedNote);
  }

  /**
   * Load existing notes for the current page
   */
  async loadExistingNotes() {
    const pageNotes = await StorageManager.getNotes(window.location.href);

    Object.values(pageNotes).forEach((note) => {
      this.renderNote(note);
    });
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
    noteElement.innerHTML = note.content;

    // Set positioning
    noteElement.style.position = "absolute";
    noteElement.style.left = `${note.position.x}px`;
    noteElement.style.top = `${note.position.y}px`;

    // Add drag functionality for free-floating notes
    if (note.type === "free-floating") {
      this.makeDraggable(noteElement);
    }

    // Add note controls (edit, delete)
    this.addNoteControls(noteElement, note);

    // Append to body
    document.body.appendChild(noteElement);

    // Store reference
    this.notes[note.id] = noteElement;
  }

  /**
   * Make a note draggable
   * @param {HTMLElement} noteElement - Note element to make draggable
   */
  makeDraggable(noteElement) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    const dragStart = (e) => {
      initialX = e.clientX - noteElement.offsetLeft;
      initialY = e.clientY - noteElement.offsetTop;

      isDragging = true;
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    };

    const drag = (e) => {
      if (!isDragging) return;

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      noteElement.style.left = `${currentX}px`;
      noteElement.style.top = `${currentY}px`;
    };

    const dragEnd = () => {
      isDragging = false;
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);

      // Update note position in storage
      this.updateNotePosition(noteElement);
    };

    noteElement.addEventListener("mousedown", dragStart);
  }

  /**
   * Update note position in storage
   * @param {HTMLElement} noteElement - Note element to update
   */
  updateNotePosition(noteElement) {
    const note = this.notes[noteElement.id];
    if (!note) return;

    const updatedNote = {
      ...note,
      position: {
        x: parseInt(noteElement.style.left, 10),
        y: parseInt(noteElement.style.top, 10),
      },
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

    // Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "✏️";
    editButton.addEventListener("click", () =>
      this.editNote(noteElement, note)
    );

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.addEventListener("click", () => this.deleteNote(note));

    controlsContainer.appendChild(editButton);
    controlsContainer.appendChild(deleteButton);
    noteElement.appendChild(controlsContainer);
  }

  /**
   * Edit an existing note
   * @param {HTMLElement} noteElement - Note element to edit
   * @param {Object} note - Note data
   */
  editNote(noteElement, note) {
    // Create a textarea for editing
    const editor = document.createElement("textarea");
    editor.value = noteElement.innerHTML;
    editor.classList.add("note-editor");

    // Replace note content with editor
    const originalContent = noteElement.innerHTML;
    noteElement.innerHTML = "";
    noteElement.appendChild(editor);
    editor.focus();

    // Save changes on blur
    editor.addEventListener("blur", () => {
      const newContent = InputSanitizer.sanitizeHTML(editor.value);
      noteElement.innerHTML = newContent;

      // Update note in storage
      const updatedNote = {
        ...note,
        content: newContent,
        updatedAt: Date.now(),
      };
      StorageManager.saveNote(updatedNote);

      // Re-add controls
      this.addNoteControls(noteElement, updatedNote);
    });
  }

  /**
   * Delete a note
   * @param {Object} note - Note to delete
   */
  async deleteNote(note) {
    // Remove from DOM
    const noteElement = document.getElementById(note.id);
    if (noteElement) {
      noteElement.remove();
    }

    // Remove from storage
    await StorageManager.deleteNote(note.pageUrl, note.id);

    // Remove from local notes tracking
    delete this.notes[note.id];
  }

  /**
   * Set up MutationObserver to handle dynamic content
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Throttle reattachment to prevent performance issues
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = setTimeout(() => {
        this.reattachNotes();
      }, 300);
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
    // Remove existing notes
    Object.values(this.notes).forEach((note) => note.remove());
    this.notes = {};

    // Reload notes
    this.loadExistingNotes();
  }
}

// Initialize Web Notes when script loads
const webNotesManager = new WebNotesManager();

// Export for potential external use
export default webNotesManager;
