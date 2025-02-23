// DOM Elements
const formContainer = document.getElementById("form-container");
const authForm = document.getElementById("auth-form");
const toggleFormText = document.getElementById("toggle-form");
const loginFields = document.getElementById("login-fields");
const registerFields = document.getElementById("register-fields");
const authSubmit = document.getElementById("auth-submit");
const formTitle = document.getElementById("form-title");
const nameInput = document.getElementById("name");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordRegisterInput = document.getElementById("password-register");
const miningPageLink = document.createElement("a"); // Link to mining page

// Create and style the "Go to mining page" link
miningPageLink.textContent = "Go to mining page";
miningPageLink.href = "index.html"; // Update with your mining page URL
miningPageLink.className = "block text-center mt-4 text-blue-500 hover:underline";
miningPageLink.style.display = "none"; // Initially hidden

// Append the link to the form container
formContainer.appendChild(miningPageLink);

// **Handle Form Submission**
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const identifier = document.getElementById("identifier").value.trim();
  const password = document.getElementById("password").value.trim();
  const isRegistering = formTitle.textContent === "Register";
  const payload = isRegistering
    ? {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        username: usernameInput.value.trim(),
        password: passwordRegisterInput.value.trim(),
        referredBy: document.getElementById("referral-input").value.trim(),
      }
    : { identifier, password };

  try {
    const response = await fetch(
      `https://mai.fly.dev/api/auth/${isRegistering ? "register" : "login"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (response.ok) {
      if (isRegistering) {
        alert("Registration successful! You can now log in.");
      } else {
        alert("Logged in successfully!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem("minedBalance", data.balance.toFixed(4));

        // Hide the form and show the "Go to mining page" link
        authForm.style.display = "none";
        miningPageLink.style.display = "block";
      }
    } else {
      alert(data.message || "Something went wrong!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
});

// **Toggle Between Login and Registration Form**
toggleFormText.addEventListener("click", () => {
  if (formTitle.textContent === "Login") {
    // Switch to Registration Form
    formTitle.textContent = "Register";
    authSubmit.textContent = "Register";
    loginFields.classList.add("hidden");
    registerFields.classList.remove("hidden");

    // Add required attributes to registration fields
    document.getElementById("name").setAttribute("required", true);
    document.getElementById("username").setAttribute("required", true);
    document.getElementById("email").setAttribute("required", true);
    document.getElementById("password-register").setAttribute("required", true);

    // Remove required attributes from login fields
    document.getElementById("identifier").removeAttribute("required");
    document.getElementById("password").removeAttribute("required");

    toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
  } else {
    // Switch to Login Form
    formTitle.textContent = "Login";
    authSubmit.textContent = "Login";
    loginFields.classList.remove("hidden");
    registerFields.classList.add("hidden");

    // Add required attributes to login fields
    document.getElementById("identifier").setAttribute("required", true);
    document.getElementById("password").setAttribute("required", true);

    // Remove required attributes from registration fields
    document.getElementById("name").removeAttribute("required");
    document.getElementById("username").removeAttribute("required");
    document.getElementById("email").removeAttribute("required");
    document.getElementById("password-register").removeAttribute("required");

    toggleFormText.innerHTML = 'Don’t have an account? <span>Register here</span>';
  }
});

// Automatically Switch to Registration Form if Referral Code Exists
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
  console.log("Referral Code Detected:", referralCode);

  // Switch to Registration Form
  formTitle.textContent = "Register";
  authSubmit.textContent = "Register";
  loginFields.classList.add("hidden");
  registerFields.classList.remove("hidden");

  // Add required attributes to registration fields
  document.getElementById("name").setAttribute("required", true);
  document.getElementById("username").setAttribute("required", true);
  document.getElementById("email").setAttribute("required", true);
  document.getElementById("password-register").setAttribute("required", true);

  // Remove required attributes from login fields
  document.getElementById("identifier").removeAttribute("required");
  document.getElementById("password").removeAttribute("required");

  // Prefill the referral code
  const referralInput = document.getElementById("referral-input");
  if (referralInput) {
    referralInput.value = referralCode;
  }
}


const token = localStorage.getItem("token");
if (token){
    
    formContainer.classList.add("hidden")
};

const footer = document.getElementById("footer");
let lastScrollPosition = window.scrollY;

window.addEventListener("scroll", () => {
  const currentScrollPosition = window.scrollY;

  // Show footer when scrolling down
  if (currentScrollPosition > lastScrollPosition) {
    footer.classList.add("visible");
  } 
  // Hide footer when scrolling up
  else {
    footer.classList.remove("visible");
  }

  // Update the last scroll position
  lastScrollPosition = currentScrollPosition;
});