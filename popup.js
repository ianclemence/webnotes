let selectedColor = "#ffda79";

document.addEventListener("DOMContentLoaded", function () {
  // Set up color selection
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", function () {
      selectedColor = this.getAttribute("data-color");
      // Visual feedback for selection
      colorOptions.forEach((opt) => (opt.style.border = "none"));
      this.style.border = "2px solid #333";
    });
  });

  // Default selected color
  document.querySelector(".yellow").style.border = "2px solid #333";

  // Add note button
  document.getElementById("addNote").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "addNote",
        color: selectedColor,
      });
    });
  });

  // Clear notes button
  document.getElementById("clearNotes").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "clearNotes",
      });
    });
  });
});
