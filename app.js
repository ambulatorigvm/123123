```javascript
"use strict";

/* =========================================================
   AMBULATORI GVM
   VERSION: GVM-20260923-02
   ========================================================= */

const APP_VERSION = "GVM-20260923-02";

console.log("========================================");
console.log("AMBULATORI GVM");
console.log("APP VERSION:", APP_VERSION);
console.log("APP.JS U NGARKUA");
console.log("========================================");


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";


let supabaseClient = null;


try {

  if (
    typeof window.supabase === "undefined"
  ) {

    throw new Error(
      "Supabase library nuk u ngarkua."
    );

  }

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  console.log("SUPABASE U KRIJUA");

} catch (error) {

  console.error(
    "SUPABASE ERROR:",
    error
  );

}


/* =========================================================
   SETTINGS
   ========================================================= */

const START_HOUR = 8;
const END_HOUR = 18;

const SLOT_MINUTES = 15;


/* =========================================================
   STATE
   ========================================================= */

let selectedDate = new Date();

let realtimeChannel = null;

let applicationStarted = false;

let applicationStarting = false;

let loginInProgress = false;

let currentAppointments = [];


/* =========================================================
   HELPERS
   ========================================================= */

function pad(number) {

  return String(number).padStart(2, "0");

}


function formatDate(date) {

  const year =
    date.getFullYear();

  const month =
    pad(date.getMonth() + 1);

  const day =
    pad(date.getDate());

  return `${year}-${month}-${day}`;

}


function normalizeTime(time) {

  if (!time) {
    return "";
  }

  return String(time)
    .trim()
    .substring(0, 5);

}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function formatDateForDisplay(date) {

  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(date);

}


function statusText(status) {

  switch (status) {

    case "arrived":
      return "Erdhi";

    case "finished":
      return "Përfundoi";

    case "cancelled":
      return "Anuluar";

    case "planned":
    default:
      return "Planifikuar";

  }

}


function statusClass(status) {

  switch (status) {

    case "arrived":
      return "status-arrived";

    case "finished":
      return "status-finished";

    case "cancelled":
      return "status-cancelled";

    default:
      return "";

  }

}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function showLogin() {

  const app =
    document.getElementById("app");

  if (!app) {
    return;
  }

  app.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <div class="login-icon">
          ✚
        </div>

        <h1>
          AMBULATORI GVM
        </h1>

        <div class="login-subtitle">
          Sistemi i recepsionit
        </div>

        <div class="form-group">

          <label>
            Email
          </label>

          <input
            id="loginEmail"
            type="email"
            autocomplete="username"
            placeholder="Shkruaj email-in"
          >

        </div>

        <div class="form-group">

          <label>
            Fjalëkalimi
          </label>

          <input
            id="loginPassword"
            type="password"
            autocomplete="current-password"
            placeholder="Shkruaj fjalëkalimin"
          >

        </div>

        <button
          id="loginButton"
          class="login-btn"
        >
          Hyr në sistem
        </button>

        <div id="loginMessage"></div>

      </div>

    </div>

  `;


  const loginButton =
    document.getElementById(
      "loginButton"
    );


  const emailInput =
    document.getElementById(
      "loginEmail"
    );


  const passwordInput =
    document.getElementById(
      "loginPassword"
    );


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      login
    );

  }


  if (passwordInput) {

    passwordInput.addEventListener(
      "keydown",
      function(event) {

        if (
          event.key === "Enter"
        ) {

          login();

        }

      }
    );

  }


  if (emailInput) {

    emailInput.focus();

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

  if (loginInProgress) {
    return;
  }

  if (!supabaseClient) {

    showLoginMessage(
      "Supabase nuk është ngarkuar.",
      true
    );

    return;

  }


  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const button =
    document.getElementById(
      "loginButton"
    );


  const email =
    emailInput
      ? emailInput.value.trim()
      : "";

  const password =
    passwordInput
      ? passwordInput.value
      : "";


  if (!email || !password) {

    showLoginMessage(
      "Plotëso email-in dhe fjalëkalimin.",
      true
    );

    return;

  }


  loginInProgress = true;


  if (button) {

    button.disabled = true;

    button.textContent =
      "Po hyhet...";

  }


  showLoginMessage(
    "Po kontrollohen të dhënat...",
    false
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {

      throw error;

    }


    console.log(
      "LOGIN OK:",
      data
    );


    await startApplication();


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    showLoginMessage(
      error.message ||
      "Nuk u bë hyrja në sistem.",
      true
    );


    if (button) {

      button.disabled = false;

      button.textContent =
        "Hyr në sistem";

    }


    loginInProgress = false;

  }

}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "loginMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.style.color =
    isError
      ? "#a33f3f"
      : "#4c7482";

}


/* =========================================================
   CHECK SESSION
   ========================================================= */

async function checkSession() {

  console.log(
    "Po kontrollohet sesioni..."
  );


  if (!supabaseClient) {

    showLogin();

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {

      throw error;

    }


    console.log(
      "Session:",
      data
    );


    if (
      data &&
      data.session
    ) {

      await startApplication();

    } else {

      showLogin();

    }


  } catch (error) {

    console.error(
      "CHECK SESSION ERROR:",
      error
    );


    showLogin();

  }

}


/* =========================================================
   START APPLICATION
   ========================================================= */

async function startApplication() {

  if (applicationStarted) {

    console.log(
      "Aplikacioni është tashmë i hapur."
    );

    return;

  }


  if (applicationStarting) {

    console.log(
      "Aplikacioni po hapet tashmë."
    );

    return;

  }


  applicationStarting = true;


  try {

    await showApp();

    applicationStarted = true;

    console.log(
      "APLIKACIONI U HAP"
    );


  } catch (error) {

    console.error(
      "START APPLICATION ERROR:",
      error
    );


    applicationStarted = false;


    const app =
      document.getElementById(
        "app"
      );


    if (app) {

      app.innerHTML = `

        <div class="error-box">

          Gabim gjatë hapjes së aplikacionit:

          <br><br>

          ${escapeHtml(
            error.message
          )}

        </div>

      `;

    }


  } finally {

    applicationStarting = false;

    loginInProgress = false;

  }

}


/* =========================================================
   MAIN APP
   ========================================================= */

async function showApp() {

  const app =
    document.getElementById(
      "app"
    );


  if (!app) {

    throw new Error(
      "Elementi #app nuk u gjet."
    );

  }


  app.innerHTML = `

    <header class="topbar">

      <div class="brand">

        <div class="brand-icon">
          ✚
        </div>

        <div>

          <div class="brand-title">
            AMBULATORI GVM
          </div>

          <span class="brand-subtitle">
            Sistemi i recepsionit
          </span>

        </div>

      </div>


      <div class="topbar-right">

        <div class="topbar-status">

          <span class="online-dot"></span>

          Online

        </div>

        <button
          id="logoutButton"
          class="logout-btn"
        >
          Dil
        </button>

      </div>

    </header>


    <main class="page">

      <div class="page-heading">

        <div>

          <h1>
            Orari i ambulancës
          </h1>

          <p>
            Menaxho vizitat dhe pacientët
          </p>

        </div>


        <div class="status-online">

          <span class="online-dot"></span>

          Sistemi aktiv

        </div>

      </div>


      <div class="date-panel">

        <div class="date-side">

          <button
            id="previousDay"
            class="date-nav"
            title="Dita e mëparshme"
          >
            ‹
          </button>

        </div>


        <div class="date-center">

          <div class="date-label">
            Data
          </div>

          <div id="dateTitle">
            —
          </div>

        </div>


        <div class="date-side right">

          <button
            id="todayButton"
            class="today-btn"
          >
            Sot
          </button>

          <button
            id="nextDay"
            class="date-nav"
            title="Dita tjetër"
          >
            ›
          </button>

        </div>

      </div>


      <div class="main-grid">


        <!-- FORM -->

        <section class="card">

          <div class="card-header">

            <div class="card-icon">
              +
            </div>

            <div>

              <h2>
                Shto vizitë
              </h2>

              <p>
                Regjistro një pacient të ri
              </p>

            </div>

          </div>


          <div class="form-body">


            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                id="firstName"
                type="text"
                placeholder="Emri i pacientit"
              >

            </div>


            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                id="lastName"
                type="text"
                placeholder="Mbiemri i pacientit"
              >

            </div>


            <div class="form-group">

              <label>
                Numri i kartelës
              </label>

              <input
                id="cardNumber"
                type="text"
                placeholder="Nr. i kartelës"
              >

            </div>


            <div class="form-group">

              <label>
                Ora
              </label>

              <select id="appointmentTime">

                <option value="">
                  Zgjidh orën
                </option>

              </select>

            </div>


            <button
              id="addAppointment"
              class="add-btn"
            >
              + Shto vizitën
            </button>


            <div id="message"></div>


          </div>

        </section>


        <!-- SCHEDULE -->

        <section class="card">

          <div class="schedule-header">

            <div class="schedule-title-row">

              <div class="hospital-symbol">
                🩺
              </div>

              <div>

                <h2>
                  Orari ditor
                </h2>

                <p>
                  Vizitat e ditës
                </p>

              </div>

            </div>


            <div class="appointment-count">

              <span id="appointmentCount">
                0
              </span>

              vizita

            </div>

          </div>


          <div id="appointments">

            <div class="loading">
              Po ngarkohet orari...
            </div>

          </div>


        </section>


      </div>

    </main>

  `;


  setupEventListeners();

  updateDateTitle();

  populateTimeSlots();

  await loadAppointments();

  startRealtime();

}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEventListeners() {


  const addButton =
    document.getElementById(
      "addAppointment"
    );


  if (addButton) {

    addButton.addEventListener(
      "click",
      addAppointment
    );

  }


  const previousDay =
    document.getElementById(
      "previousDay"
    );


  if (previousDay) {

    previousDay.addEventListener(
      "click",
      async function() {

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        updateDateTitle();

        await loadAppointments();

      }
    );

  }


  const nextDay =
    document.getElementById(
      "nextDay"
    );


  if (nextDay) {

    nextDay.addEventListener(
      "click",
      async function() {

        selectedDate.setDate(
          selectedDate.getDate() + 1
        );

        updateDateTitle();

        await loadAppointments();

      }
    );

  }


  const todayButton =
    document.getElementById(
      "todayButton"
    );


  if (todayButton) {

    todayButton.addEventListener(
      "click",
      async function() {

        selectedDate =
          new Date();

        updateDateTitle();

        await loadAppointments();

      }
    );

  }


  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );

  }


}


/* =========================================================
   DATE TITLE
   ========================================================= */

function updateDateTitle() {

  const title =
    document.getElementById(
      "dateTitle"
    );


  if (!title) {
    return;
  }


  title.textContent =
    formatDateForDisplay(
      selectedDate
    );

}


/* =========================================================
   TIME SELECT
   ========================================================= */

function populateTimeSlots() {

  const select =
    document.getElementById(
      "appointmentTime"
    );


  if (!select) {
    return;
  }


  select.innerHTML = `

    <option value="">
      Zgjidh orën
    </option>

  `;


  for (
    let hour = START_HOUR;
    hour < END_HOUR;
    hour++
  ) {

    for (
      let minute = 0;
      minute < 60;
      minute += SLOT_MINUTES
    ) {

      const time =
        `${pad(hour)}:${pad(minute)}`;


      const option =
        document.createElement(
          "option"
        );


      option.value =
        time;


      option.textContent =
        time;


      select.appendChild(
        option
      );

    }

  }

}


/* =========================================================
   LOAD APPOINTMENTS
   ========================================================= */

async function loadAppointments() {

  const container =
    document.getElementById(
      "appointments"
    );


  if (container) {

    container.innerHTML = `

      <div class="loading">

        <div class="spinner"></div>

        Po ngarkohet orari...

      </div>

    `;

  }


  const date =
    formatDate(
      selectedDate
    );


  console.log(
    "Po ngarkohen vizitat për:",
    date
  );


  if (!supabaseClient) {

    renderError(
      "Supabase nuk është i disponueshëm."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "appointment_date",
          date
        )
        .order(
          "appointment_time",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    currentAppointments =
      Array.isArray(data)
        ? data
        : [];


    console.log(
      "Vizitat e gjetura:",
      currentAppointments
    );


    console.log(
      "Numri i vizitave:",
      currentAppointments.length
    );


    renderAppointments(
      currentAppointments
    );


  } catch (error) {

    console.error(
      "LOAD APPOINTMENTS ERROR:",
      error
    );


    renderError(
      error.message ||
      "Nuk u ngarkuan vizitat."
    );

  }

}


/* =========================================================
   RENDER APPOINTMENTS
   ========================================================= */

function renderAppointments(
  appointments
) {

  const container =
    document.getElementById(
      "appointments"
    );


  if (!container) {

    console.error(
      "Elementi #appointments nuk ekziston."
    );

    return;

  }


  const count =
    document.getElementById(
      "appointmentCount"
    );


  if (count) {

    count.textContent =
      appointments.length;

  }


  const appointmentMap =
    new Map();


  appointments.forEach(
    appointment => {

      const normalized =
        normalizeTime(
          appointment.appointment_time
        );


      if (normalized) {

        appointmentMap.set(
          normalized,
          appointment
        );

      }

    }
  );


  let html = "";


  for (
    let hour = START_HOUR;
    hour < END_HOUR;
    hour++
  ) {

    for (
      let minute = 0;
      minute < 60;
      minute += SLOT_MINUTES
    ) {

      const time =
        `${pad(hour)}:${pad(minute)}`;


      const appointment =
        appointmentMap.get(
          time
        );


      if (appointment) {

        html += renderAppointment(
          appointment,
          time
        );

      } else {

        html += renderEmptySlot(
          time
        );

      }

    }

  }


  /*
    Nëse ka ndonjë vizitë në databazë me orë
    që nuk përputhet me slotet 08:00–18:00,
    e shfaqim përsëri në fund që të mos humbasë.
  */

  const visibleIds =
    new Set();


  appointments.forEach(
    appointment => {

      visibleIds.add(
        String(appointment.id)
      );

    }
  );


  const unmatched =
    appointments.filter(
      appointment => {

        const time =
          normalizeTime(
            appointment.appointment_time
          );

        return !appointmentMap.has(
          time
        ) && time;

      }
    );


  if (unmatched.length > 0) {

    unmatched.forEach(
      appointment => {

        html += renderAppointment(
          appointment,
          normalizeTime(
            appointment.appointment_time
          )
        );

      }
    );

  }


  if (!html) {

    html = `

      <div class="loading">

        Nuk ka vizita për këtë ditë.

      </div>

    `;

  }


  container.innerHTML =
    html;


  /*
    Debug i dobishëm:
    na tregon sa elemente janë futur realisht
    në ekran.
  */

  console.log(
    "Rreshtat e krijuar në ekran:",
    container.querySelectorAll(
      ".time-slot"
    ).length
  );

}


/* =========================================================
   RENDER ONE APPOINTMENT
   ========================================================= */

function renderAppointment(
  appointment,
  time
) {

  const firstName =
    escapeHtml(
      appointment.first_name
    );


  const lastName =
    escapeHtml(
      appointment.last_name
    );


  const cardNumber =
    escapeHtml(
      appointment.card_number
    );


  const status =
    appointment.status ||
    "planned";


  return `

    <div
      class="time-slot"
      data-id="${escapeHtml(
        appointment.id
      )}"
    >

      <div class="slot-time">
        ${escapeHtml(time)}
      </div>


      <div class="slot-content">

        <div class="patient-name">

          ${firstName}
          ${lastName}

        </div>

        <div class="patient-card">

          Kartela:
          ${cardNumber || "—"}

        </div>

      </div>


      <div class="slot-status">

        <span
          class="status ${statusClass(
            status
          )}"
        >
          ${statusText(status)}
        </span>

      </div>


      <div class="appointment-actions">

        ${
          status !== "arrived" &&
          status !== "finished" &&
          status !== "cancelled"

          ? `

            <button
              class="arrived-btn"
              onclick="changeStatus('${appointment.id}', 'arrived')"
            >
              Erdhi
            </button>

          `

          : ""
        }


        ${
          status === "arrived"

          ? `

            <button
              class="finish-btn"
              onclick="changeStatus('${appointment.id}', 'finished')"
            >
              Përfundoi
            </button>

          `

          : ""
        }


        ${
          status !== "finished" &&
          status !== "cancelled"

          ? `

            <button
              class="cancel-btn"
              onclick="changeStatus('${appointment.id}', 'cancelled')"
            >
              Anulo
            </button>

          `

          : ""
        }


        <button
          class="delete-btn"
          onclick="deleteAppointment('${appointment.id}')"
        >
          Fshi
        </button>


      </div>

    </div>

  `;

}


/* =========================================================
   EMPTY SLOT
   ========================================================= */

function renderEmptySlot(
  time
) {

  return `

    <div
      class="time-slot"
      data-empty-time="${time}"
    >

      <div class="slot-time">
        ${time}
      </div>


      <div
        class="slot-content"
        onclick="selectTime('${time}')"
        style="cursor:pointer"
      >

        <div class="empty-title">
          Orar i lirë
        </div>

        <div class="empty-subtitle">
          Kliko për të shtuar vizitë
        </div>

      </div>


      <div class="empty-plus">
        +
      </div>


      <div></div>

    </div>

  `;

}


/* =========================================================
   SELECT TIME
   ========================================================= */

function selectTime(time) {

  const select =
    document.getElementById(
      "appointmentTime"
    );


  if (!select) {
    return;
  }


  select.value =
    time;


  const firstName =
    document.getElementById(
      "firstName"
    );


  if (firstName) {

    firstName.focus();

  }

}


/* =========================================================
   ADD APPOINTMENT
   ========================================================= */

async function addAppointment() {

  const firstNameInput =
    document.getElementById(
      "firstName"
    );


  const lastNameInput =
    document.getElementById(
      "lastName"
    );


  const cardNumberInput =
    document.getElementById(
      "cardNumber"
    );


  const timeInput =
    document.getElementById(
      "appointmentTime"
    );


  const firstName =
    firstNameInput
      ? firstNameInput.value.trim()
      : "";


  const lastName =
    lastNameInput
      ? lastNameInput.value.trim()
      : "";


  const cardNumber =
    cardNumberInput
      ? cardNumberInput.value.trim()
      : "";


  const appointmentTime =
    timeInput
      ? timeInput.value
      : "";


  if (!firstName) {

    showMessage(
      "Shkruaj emrin.",
      true
    );

    return;

  }


  if (!lastName) {

    showMessage(
      "Shkruaj mbiemrin.",
      true
    );

    return;

  }


  if (!cardNumber) {

    showMessage(
      "Shkruaj numrin e kartelës.",
      true
    );

    return;

  }


  if (!appointmentTime) {

    showMessage(
      "Zgjidh orën.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "addAppointment"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "Po ruhet...";

  }


  try {

    const date =
      formatDate(
        selectedDate
      );


    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert([
          {
            first_name:
              firstName,

            last_name:
              lastName,

            card_number:
              cardNumber,

            appointment_date:
              date,

            appointment_time:
              appointmentTime,

            status:
              "planned"
          }
        ])
        .select();


    if (error) {

      throw error;

    }


    console.log(
      "Vizita u shtua:",
      data
    );


    showMessage(
      "Vizita u shtua me sukses.",
      false
    );


    if (firstNameInput) {
      firstNameInput.value = "";
    }

    if (lastNameInput) {
      lastNameInput.value = "";
    }

    if (cardNumberInput) {
      cardNumberInput.value = "";
    }

    if (timeInput) {
      timeInput.value = "";
    }


    await loadAppointments();


  } catch (error) {

    console.error(
      "ADD APPOINTMENT ERROR:",
      error
    );


    showMessage(
      error.message ||
      "Vizita nuk u shtua.",
      true
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "+ Shto vizitën";

    }

  }

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "message"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    isError
      ? "error-message"
      : "success-message";


  setTimeout(
    function() {

      if (element) {

        element.textContent = "";

        element.className = "";

      }

    },
    4000
  );

}


/* =========================================================
   CHANGE STATUS
   ========================================================= */

async function changeStatus(
  id,
  status
) {

  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({
          status: status
        })
        .eq(
          "id",
          id
        );


    if (error) {

      throw error;

    }


    await loadAppointments();


  } catch (error) {

    console.error(
      "CHANGE STATUS ERROR:",
      error
    );


    alert(
      error.message ||
      "Statusi nuk u ndryshua."
    );

  }

}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteAppointment(
  id
) {

  const confirmed =
    confirm(
      "A je i sigurt që dëshiron ta fshish këtë vizitë?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      throw error;

    }


    await loadAppointments();


  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );


    alert(
      error.message ||
      "Vizita nuk u fshi."
    );

  }

}


/* =========================================================
   REALTIME
   ========================================================= */

async function stopRealtime() {

  if (!realtimeChannel) {
    return;
  }


  console.log(
    "Po mbyllet realtime..."
  );


  try {

    await supabaseClient
      .removeChannel(
        realtimeChannel
      );

  } catch (error) {

    console.error(
      "REMOVE REALTIME ERROR:",
      error
    );

  }


  realtimeChannel = null;

}


/* =========================================================
   START REALTIME
   ========================================================= */

function startRealtime() {

  if (!supabaseClient) {
    return;
  }


  /*
    Mos krijo kanal të dytë.
  */

  if (realtimeChannel) {

    console.log(
      "Realtime është tashmë aktiv."
    );

    return;

  }


  console.log(
    "Po aktivizohet realtime..."
  );


  const channelName =
    "appointments-realtime";


  const channel =
    supabaseClient
      .channel(channelName);


  /*
    E vendosim menjëherë në state.
    Kjo parandalon krijimin e dy kanaleve
    nëse funksioni thirret përsëri.
  */

  realtimeChannel =
    channel;


  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "appointments"
    },
    function(payload) {

      console.log(
        "REALTIME EVENT:",
        payload
      );


      loadAppointments();

    }
  );


  channel.subscribe(
    function(status) {

      console.log(
        "REALTIME STATUS:",
        status
      );


      if (
        status ===
        "CHANNEL_ERROR"
      ) {

        console.error(
          "Realtime CHANNEL_ERROR"
        );

      }

    }
  );

}


/* =========================================================
   ERROR
   ========================================================= */

function renderError(
  message
) {

  const container =
    document.getElementById(
      "appointments"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      style="
        margin:15px;
        padding:15px;
        border:1px solid #efcccc;
        background:#fff4f4;
        color:#a64242;
        border-radius:9px;
        font-size:12px;
        line-height:1.5;
      "
    >

      <strong>
        Gabim
      </strong>

      <br><br>

      ${escapeHtml(message)}

    </div>

  `;

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  try {

    await stopRealtime();


    await supabaseClient
      .auth
      .signOut();


    applicationStarted =
      false;


    applicationStarting =
      false;


    currentAppointments =
      [];


    showLogin();


  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

if (supabaseClient) {

  supabaseClient.auth
    .onAuthStateChange(
      function(event, session) {

        console.log(
          "Auth event:",
          event
        );


        /*
          INITIAL_SESSION:
          checkSession() merret me të.
        */

        if (
          event ===
          "INITIAL_SESSION"
        ) {

          return;

        }


        /*
          SIGNED_IN:
          mos e hap aplikacionin përsëri.
          Kjo ishte një nga problemet e versionit
          të vjetër.
        */

        if (
          event ===
          "SIGNED_IN"
        ) {

          console.log(
            "SIGNED_IN u mor - aplikacioni nuk hapet përsëri."
          );

          return;

        }


        /*
          SIGNED_OUT
        */

        if (
          event ===
          "SIGNED_OUT"
        ) {

          applicationStarted =
            false;

          applicationStarting =
            false;

          currentAppointments =
            [];

          stopRealtime();

          showLogin();

        }

      }
    );

}


/* =========================================================
   WINDOW LOAD
   ========================================================= */

window.addEventListener(
  "load",
  async function() {

    console.log(
      "========================================"
    );

    console.log(
      "WINDOW LOADED"
    );

    console.log(
      "VERSION:",
      APP_VERSION
    );

    console.log(
      "========================================"
    );


    await checkSession();

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.selectTime =
  selectTime;

window.changeStatus =
  changeStatus;

window.deleteAppointment =
  deleteAppointment;


/* =========================================================
   END
   ========================================================= */
```
