# 📝 Web Notes Chrome Extension

## Overview
Web Notes is a powerful Chrome extension that allows users to create persistent, interactive sticky notes directly on web pages. With support for free-floating and highlight-bound notes, rich text editing, and advanced search capabilities, Web Notes transforms how you annotate and remember web content.

## 🌟 Key Features

### 1. Note Types
- **Free-Floating Notes**: Drag and place notes anywhere on the page
- **Highlight-Bound Notes**: Anchor notes to specific text selections

### 2. Persistent Annotations
- Notes survive page refreshes
- Automatically adapt to dynamic content
- Stored using Chrome's local storage

### 3. Rich Functionality
- Rich text editing
- Drag-and-drop note positioning
- Search across all notes
- Export/Import notes
- Keyboard shortcuts

## 🚀 Installation

### From Chrome Web Store
1. Open Chrome Web Store
2. Search for "Web Notes"
3. Click "Add to Chrome"

### Manual Installation
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

## 💡 Usage

### Creating Notes
- Click extension icon and choose note type
- Use keyboard shortcut `Ctrl+Shift+N`
- Notes can be dragged, edited, and deleted

### Managing Notes
- Search notes across all pages
- Export/Import notes as JSON
- View note statistics in popup

## 🛠 Development

### Prerequisites
- Node.js
- Chrome Browser

### Setup
```bash
git clone https://github.com/ianclemence/webnotes.git
cd webnotes
npm install  # If using build tools
```

### Key Technologies
- Vanilla JavaScript
- Chrome Extension API
- Chrome Storage API
- MutationObserver for dynamic content

## 🔒 Security
- Input sanitization
- XSS prevention
- Secure note storage

## 🔮 Future Roadmap
- Collaborative note sharing
- AI-powered note summarization
- Cross-browser support
- Advanced tagging system

## 📄 License
MIT License

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support
For issues or feature requests, please [open an issue](https://github.com/ianclemence/webnotes/issues)