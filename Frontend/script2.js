document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("emailInput");
  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  const messageElement = document.getElementById("message");
  const emailDisplay = document.getElementById("emailDisplay");
  const statusDisplay = document.getElementById("statusDisplay");
  const verificationIcon = document.getElementById("verificationIcon");
  const emailVerificationSection = document.querySelector('.email-verification-section');

  // Hide email verification section by default
  if (emailVerificationSection) {
    emailVerificationSection.style.display = 'none';
  }

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
        const token = localStorage.getItem('token'); // Optional token handling
        const response = await fetch("https://mai-vmox.onrender.com/api/auth/request-email-verification", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        // Update message style based on response
        if (response.ok) {
          messageElement.textContent = data.message;
          messageElement.className = "text-center text-green-500 mt-2";
          
          // Optional: Clear input after successful request
          emailInput.value = '';
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
    try {
      const res = await fetch(`https://mai-vmox.onrender.com/api/auth/verify-email?token=${token}`);
      const data = await res.json();
      
      const verifyMessage = document.getElementById("message");
      
      if (data.message.toLowerCase().includes("successfully")) {
        verifyMessage.textContent = data.message;
        verifyMessage.className = "text-center text-green-500 mt-2";
        
        // Reload profile page after successful verification
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000); // 2-second delay to show success message
      } else {
        verifyMessage.textContent = data.message;
        verifyMessage.className = "text-center text-red-500 mt-2";
      }
    } catch (error) {
      const verifyMessage = document.getElementById("message");
      verifyMessage.textContent = "Verification failed. Please try again.";
      verifyMessage.className = "text-center text-red-500 mt-2";
    }
  }

  // Fetch and Display Verification Status
  if (statusDisplay && verificationIcon) {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user details from backend
      const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/details", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        // Improved error handling without automatic logout
        statusDisplay.textContent = "Unable to fetch user details";
        statusDisplay.classList.add("unverified");
        verificationIcon.setAttribute("data-feather", "alert-circle");
        verificationIcon.classList.add("unverified");
        feather.replace();
        
        console.error("Failed to fetch user details:", response.status);
        return;
      }
      
      const user = await response.json();
      console.log("User details fetched:", user);

      const { username, email, balance, referrals, referralCode, name } = user;
      
      // Update email display
      if (emailDisplay) {
        emailDisplay.textContent = email;
      }

      // Check verification status
      const verificationResponse = await fetch(`https://mai-vmox.onrender.com/api/auth/verification-status?email=${email}`);
      const verificationData = await verificationResponse.json();

      if (verificationData.isVerified) {
        // Hide email verification input section for verified users
        if (emailVerificationSection) {
          emailVerificationSection.style.display = 'none';
        }

        statusDisplay.textContent = "Verified";
        statusDisplay.classList.add("verified");
        verificationIcon.setAttribute("data-feather", "check-circle");
        verificationIcon.classList.add("verified");
      } else {
        // Show email verification section for unverified users
        if (emailVerificationSection) {
          emailVerificationSection.style.display = 'block';
        }

        statusDisplay.textContent = "Not Verified";
        statusDisplay.classList.add("unverified");
        verificationIcon.setAttribute("data-feather", "x-circle");
        verificationIcon.classList.add("unverified");
      }
      
      // Refresh Feather icons after dynamic insertion
      feather.replace();

    } catch (error) {
      console.error("Error fetching user details or verification status:", error);
      
      statusDisplay.textContent = "Status Unavailable";
      statusDisplay.classList.add("unverified");
      verificationIcon.setAttribute("data-feather", "alert-circle");
      verificationIcon.classList.add("unverified");
      feather.replace();
    }
  }
});