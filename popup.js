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
      // Check if we have a valid tab
      if (tabs && tabs[0] && tabs[0].id) {
        // Add error handling
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "addNote",
            color: selectedColor,
          },
          function (response) {
            // Handle potential error
            if (chrome.runtime.lastError) {
              console.log("Error:", chrome.runtime.lastError.message);
              // If you want to show the error to the user:
              // alert("Please refresh the page and try again.");
            }
          }
        );
      }
    });
  });

  // Clear notes button
  document.getElementById("clearNotes").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "clearNotes",
          },
          function (response) {
            if (chrome.runtime.lastError) {
              console.log("Error:", chrome.runtime.lastError.message);
            }
          }
        );
      }
    });
  });
});
