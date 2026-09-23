```javascript
// ======================================================
// AMBULATORI GVM
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


// ======================================================
// VARIABLES
// ======================================================

let selectedDate = new Date();

let realtimeChannel = null;

const START_HOUR = 8;
const END_HOUR = 18;


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function displayDate(date) {

  return date.toLocaleDateString(
    "sq-AL",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


// ======================================================
// SECURITY
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// START / SESSION
// ======================================================

async function checkSession() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getSession();

  if (error) {

    console.error(
      "Session error:",
      error
    );

    showLogin();

    return;
  }

  if (!data.session) {

    showLogin();

    return;
  }

  console.log(
    "User është i kyçur."
  );

  showApp();
}


// ======================================================
// LOGIN
// ======================================================

function showLogin() {

  const app =
    document.getElementById("app");

  if (!app) {
    return;
  }

  app.innerHTML = `

    <div class="login-page">

      <div class="login-box">

        <h2>
          AMBULATORI GVM
        </h2>

        <p>
          Hyrje në sistem
        </p>

        <input
          id="loginEmail"
          type="email"
          placeholder="Email"
          autocomplete="username"
        >

        <input
          id="loginPassword"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
        >

        <button
          id="loginButton"
        >
          Hyr
        </button>

        <div id="loginMessage"></div>

      </div>

    </div>

  `;


  document
    .getElementById("loginButton")
    .addEventListener(
      "click",
      login
    );
}


// ======================================================
// LOGIN FUNCTION
// ======================================================

async function login() {

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      .value;

  const message =
    document.getElementById(
      "loginMessage"
    );


  if (
    !email ||
    !password
  ) {

    message.textContent =
      "Plotëso email-in dhe password-in.";

    message.style.color =
      "#bd4b4b";

    return;
  }


  message.textContent =
    "Duke u kyçur...";

  message.style.color =
    "#526674";


  const {
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({

        email,

        password

      });


  if (error) {

    console.error(
      "Login error:",
      error
    );

    message.textContent =
      error.message;

    message.style.color =
      "#bd4b4b";

    return;
  }


  showApp();
}


// ======================================================
// MAIN APP
// ======================================================

function showApp() {

  const app =
    document.getElementById("app");

  if (!app) {
    return;
  }


  app.innerHTML = `

    <header class="topbar">

      <div class="brand">

        <div class="brand-icon">
          +
        </div>

        <div class="brand-text">

          <h1>
            AMBULATORI GVM
          </h1>

          <span>
            Sistemi i menaxhimit të vizitave
          </span>

        </div>

      </div>


      <div class="top-status">

        <span class="online-dot"></span>

        Sistemi aktiv

        <button
          id="logoutButton"
          class="logout-btn"
        >
          Dil
        </button>

      </div>

    </header>


    <main class="page">


      <!-- PAGE TITLE -->

      <div class="page-title">

        <h2>
          Orari i vizitave
        </h2>

        <p>
          Menaxhimi i termineve dhe pacientëve
        </p>

      </div>


      <!-- DATE -->

      <div class="date-panel">

        <div class="date-left">

          <div class="date-icon">
            📅
          </div>

          <div>

            <span class="date-label">
              Data e punës
            </span>

            <span id="currentDate">
              Po ngarkohet...
            </span>

          </div>

        </div>


        <div class="date-buttons">

          <button id="prevDay">
            ← Dita e kaluar
          </button>

          <button
            id="todayBtn"
            class="today-btn"
          >
            Sot
          </button>

          <button id="nextDay">
            Dita tjetër →
          </button>

        </div>

      </div>


      <!-- MAIN GRID -->

      <div class="main-grid">


        <!-- =====================================
             ADD APPOINTMENT
        ====================================== -->

        <div class="card">

          <div class="card-header">

            <h3>
              Shto vizitë
            </h3>

            <p>
              Regjistro një termin të ri
            </p>

          </div>


          <div class="form-body">


            <!-- FIRST NAME -->

            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                id="firstName"
                type="text"
                p
```
