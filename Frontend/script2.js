document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailInput");
  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  const messageElement = document.getElementById("message");
  const emailDisplay = document.getElementById("emailDisplay");
  const statusDisplay = document.getElementById("statusDisplay");
  const verificationIcon = document.getElementById("verificationIcon");

  // Email Verification Request
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();

      if (!email) {
        messageElement.textContent = "Please enter a valid email address";
        messageElement.className = "text-center text-red-500 mt-2";
        return;
      }

      try {
        const response = await fetch("https://your-backend.com/auth/request-email-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        // Update message style based on response
        if (response.ok) {
          messageElement.textContent = data.message;
          messageElement.className = "text-center text-green-500 mt-2";
        } else {
          messageElement.textContent = data.message || "Verification request failed";
          messageElement.className = "text-center text-red-500 mt-2";
        }
      } catch (error) {
        messageElement.textContent = "Network error. Please try again.";
        messageElement.className = "text-center text-red-500 mt-2";
      }
    });
  }

  // Email Verification Confirmation
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (token) {
    fetch(`https://your-backend.com/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        const verifyMessage = document.getElementById("message");
        
        if (data.message.toLowerCase().includes("successfully")) {
          verifyMessage.textContent = data.message;
          verifyMessage.className = "text-center text-green-500 mt-2";
        } else {
          verifyMessage.textContent = data.message;
          verifyMessage.className = "text-center text-red-500 mt-2";
        }
      })
      .catch(error => {
        const verifyMessage = document.getElementById("message");
        verifyMessage.textContent = "Verification failed. Please try again.";
        verifyMessage.className = "text-center text-red-500 mt-2";
      });
  }

  // Fetch and Display Verification Status
  if (statusDisplay && verificationIcon) {
    // In a real app, replace with actual email retrieval method
    const email = "user@example.com"; 
    
    fetch(`https://your-backend.com/auth/verification-status?email=${email}`)
      .then(res => res.json())
      .then(data => {
        if (data.isVerified) {
          statusDisplay.textContent = "Verified";
          statusDisplay.classList.add("verified");
          verificationIcon.setAttribute("data-feather", "check-circle");
          verificationIcon.classList.add("verified");
        } else {
          statusDisplay.textContent = "Not Verified";
          statusDisplay.classList.add("unverified");
          verificationIcon.setAttribute("data-feather", "x-circle");
          verificationIcon.classList.add("unverified");
        }
        
        // Refresh Feather icons after dynamic insertion
        feather.replace();
      })
      .catch(error => {
        statusDisplay.textContent = "Status Unavailable";
        statusDisplay.classList.add("unverified");
        verificationIcon.setAttribute("data-feather", "alert-circle");
        verificationIcon.classList.add("unverified");
        feather.replace();
      });
  }
});