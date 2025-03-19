let notes = [];
const NOTES_KEY = "stickyNotes";

// Set up connection as soon as content script loads
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addNote") {
    createNote(request.color);
    // Send acknowledgment
    sendResponse({ status: "success" });
  } else if (request.action === "clearNotes") {
    clearAllNotes();
    // Send acknowledgment
    sendResponse({ status: "success" });
  }
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Load notes when page loads
window.addEventListener("load", function () {
  loadNotes();
});

// Load notes from storage
function loadNotes() {
  const url = window.location.href;
  chrome.storage.local.get([NOTES_KEY], function (result) {
    const allNotes = result[NOTES_KEY] || {};
    const pageNotes = allNotes[url] || [];

    pageNotes.forEach((noteData) => {
      createNoteFromData(noteData);
    });
  });
}

// Save notes to storage
function saveNotes() {
  const url = window.location.href;

  // Get existing notes
  chrome.storage.local.get([NOTES_KEY], function (result) {
    const allNotes = result[NOTES_KEY] || {};

    // Update notes for current URL
    allNotes[url] = notes
      .map((note) => {
        const noteElement = document.getElementById(note.id);
        if (noteElement) {
          return {
            id: note.id,
            content: noteElement.querySelector(".note-content").innerText,
            left: noteElement.style.left,
            top: noteElement.style.top,
            color: noteElement.style.backgroundColor,
            zIndex: noteElement.style.zIndex,
          };
        }
        return null;
      })
      .filter(Boolean); // Remove any null entries

    // Save back to storage
    chrome.storage.local.set({ [NOTES_KEY]: allNotes });
  });
}

// Create a new note
function createNote(color = "#ffda79") {
  const noteId = "note-" + Date.now();
  const note = document.createElement("div");
  note.id = noteId;
  note.className = "sticky-note";
  note.style.left = "20px";
  note.style.top = "20px";
  note.style.backgroundColor = color;
  note.style.zIndex = 1000 + notes.length;

  note.innerHTML = `
    <div class="note-header">
      <div class="note-drag-handle">⋮⋮</div>
      <div class="note-close">✕</div>
    </div>
    <div class="note-content" contenteditable="true">Add your note here...</div>
    <div class="note-resize-handle">⌟</div>
  `;

  document.body.appendChild(note);
  makeDraggable(note);
  makeResizable(note);

  // Setup note events
  setupNoteEvents(note);

  // Add to notes array
  notes.push({ id: noteId });

  // Save to storage
  saveNotes();

  // Focus the new note
  note.querySelector(".note-content").focus();
}

// Create note from saved data
function createNoteFromData(noteData) {
  const note = document.createElement("div");
  note.id = noteData.id;
  note.className = "sticky-note";
  note.style.left = noteData.left;
  note.style.top = noteData.top;
  note.style.backgroundColor = noteData.color;
  note.style.zIndex = noteData.zIndex;

  note.innerHTML = `
    <div class="note-header">
      <div class="note-drag-handle">⋮⋮</div>
      <div class="note-close">✕</div>
    </div>
    <div class="note-content" contenteditable="true">${noteData.content}</div>
    <div class="note-resize-handle">⌟</div>
  `;

  document.body.appendChild(note);
  makeDraggable(note);
  makeResizable(note);

  // Setup note events
  setupNoteEvents(note);

  // Add to notes array
  notes.push({ id: noteData.id });
}

// Make element draggable
function makeDraggable(element) {
  const dragHandle = element.querySelector(".note-drag-handle");
  let isDragging = false;
  let offsetX, offsetY;

  dragHandle.addEventListener("mousedown", function (e) {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;

    // Bring to front
    notes.forEach((note) => {
      const noteEl = document.getElementById(note.id);
      if (noteEl && noteEl !== element) {
        noteEl.style.zIndex = 1000;
      }
    });
    element.style.zIndex = 2000;

    // Prevent text selection during drag
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    element.style.left = e.clientX - offsetX + "px";
    element.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      saveNotes();
    }
  });
}

// Make element resizable
function makeResizable(element) {
  const resizeHandle = element.querySelector(".note-resize-handle");
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  resizeHandle.addEventListener("mousedown", function (e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    );
    startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    );
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!isResizing) return;

    const width = startWidth + (e.clientX - startX);
    const height = startHeight + (e.clientY - startY);

    element.style.width = (width > 150 ? width : 150) + "px";
    element.style.height = (height > 100 ? height : 100) + "px";
  });

  document.addEventListener("mouseup", function () {
    if (isResizing) {
      isResizing = false;
      saveNotes();
    }
  });
}

// Setup note events
function setupNoteEvents(note) {
  // Close button
  const closeBtn = note.querySelector(".note-close");
  closeBtn.addEventListener("click", function () {
    // Remove from DOM
    note.remove();

    // Remove from notes array
    notes = notes.filter((n) => n.id !== note.id);

    // Save to storage
    saveNotes();
  });

  // Auto-save content when changed
  const content = note.querySelector(".note-content");
  content.addEventListener("blur", function () {
    saveNotes();
  });

  // Bring to front when clicked
  note.addEventListener("mousedown", function () {
    notes.forEach((n) => {
      const noteEl = document.getElementById(n.id);
      if (noteEl && noteEl !== note) {
        noteEl.style.zIndex = 1000;
      }
    });
    note.style.zIndex = 2000;
    saveNotes();
  });
}

// Clear all notes
function clearAllNotes() {
  notes.forEach((note) => {
    const noteElement = document.getElementById(note.id);
    if (noteElement) {
      noteElement.remove();
    }
  });

  notes = [];

  // Clear from storage
  const url = window.location.href;
  chrome.storage.local.get([NOTES_KEY], function (result) {
    const allNotes = result[NOTES_KEY] || {};
    delete allNotes[url];
    chrome.storage.local.set({ [NOTES_KEY]: allNotes });
  });
}
