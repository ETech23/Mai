document.addEventListener("DOMContentLoaded", () => {
  const toggleButtons = document.querySelectorAll('[data-toggle="collapse"]');

  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetElement = document.querySelector(targetId);

      if (targetElement.classList.contains("show")) {
        // Collapse the content
        $(targetId).collapse('hide');
        this.style.display = "inline"; // Show the button again
      } else {
        // Expand the content
        $(targetId).collapse('show');
        this.style.display = "none"; // Hide the button
      }
    });
  });

  // Add event listeners to collapse content when clicking inside
  const collapsibleContents = document.querySelectorAll('.collapse');

  collapsibleContents.forEach((content) => {
    content.addEventListener("click", (event) => {
      // Prevent the event from bubbling up to the document
      event.stopPropagation();

      $(content).collapse('hide');
      const toggleButton = document.querySelector(`[data-target="#${content.id}"]`);
      if (toggleButton) toggleButton.style.display = "inline";
    });
  });
});