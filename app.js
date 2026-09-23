// ======================================================
// AMBULATORI GVM
// SISTEMI I RECEPSIONIT
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

let allAppointmentsCache = [];

let currentPage = "dashboard";

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
// SESSION
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

        <div class="login-logo">
          +
        </div>

        <h2>
          AMBULATORI GVM
        </h2>

        <p>
          Sistemi i menaxhimit të ambulancës
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

        <button id="loginButton">
          Hyr në sistem
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

  document
    .getElementById("loginPassword")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          login();

        }

      }
    );
}


// ======================================================
// LOGIN FUNCTION
// ======================================================

async function login() {

  const emailElement =
    document.getElementById(
      "loginEmail"
    );

  const passwordElement =
    document.getElementById(
      "loginPassword"
    );

  const message =
    document.getElementById(
      "loginMessage"
    );

  if (
    !emailElement ||
    !passwordElement ||
    !message
  ) {

    return;

  }

  const email =
    emailElement
      .value
      .trim();

  const password =
    passwordElement
      .value;

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

    <div class="app-layout">


      <!-- =================================================
           SIDEBAR
      ================================================== -->

      <aside class="sidebar">

        <div class="sidebar-brand">

          <div class="sidebar-logo">
            +
          </div>

          <div>

            <h1>
              AMBULATORI GVM
            </h1>

            <span>
              Medical Reception
            </span>

          </div>

        </div>


        <div class="sidebar-section-title">
          MENU
        </div>


        <div class="sidebar-menu">

          <button
            id="menuDashboard"
            class="active"
          >

            <span class="menu-icon">
              🏥
            </span>

            <span>
              Dashboard
            </span>

          </button>


          <button
            id="menuAppointments"
          >

            <span class="menu-icon">
              📅
            </span>

            <span>
              Vizitat
            </span>

          </button>


          <button
            id="menuPatients"
          >

            <span class="menu-icon">
              👤
            </span>

            <span>
              Pacientët
            </span>

          </button>


          <button
            id="menuSchedule"
          >

            <span class="menu-icon">
              🕐
            </span>

            <span>
              Orari
            </span>

          </button>


          <button
            id="menuDocuments"
          >

            <span class="menu-icon">
              📄
            </span>

            <span>
              Dokumentet
            </span>

          </button>

        </div>


        <div class="sidebar-bottom">
          AMBULATORI GVM<br>
          Sistemi aktiv
        </div>

      </aside>


      <!-- =================================================
           MAIN AREA
      ================================================== -->

      <div class="main-area">


        <!-- TOPBAR -->

        <header class="topbar">

          <div class="topbar-title">

            <h2 id="topbarTitle">
              Dashboard
            </h2>

            <span>
              Sistemi i menaxhimit të pacientëve
            </span>

          </div>


          <div class="topbar-right">

            <div class="system-status">

              <span class="online-dot"></span>

              Sistemi aktiv

            </div>


            <button
              id="logoutButton"
              class="logout-btn"
            >
              Dil
            </button>

          </div>

        </header>


        <!-- PAGE -->

        <main class="page">

          <div id="pageContent"></div>

        </main>


      </div>

    </div>

  `;


  // ====================================================
  // BUTTONS
  // ====================================================

  document
    .getElementById("logoutButton")
    .addEventListener(
      "click",
      logout
    );


  document
    .getElementById("menuDashboard")
    .addEventListener(
      "click",
      () => switchPage("dashboard")
    );


  document
    .getElementById("menuAppointments")
    .addEventListener(
      "click",
      () => switchPage("appointments")
    );


  document
    .getElementById("menuPatients")
    .addEventListener(
      "click",
      () => switchPage("patients")
    );


  document
    .getElementById("menuSchedule")
    .addEventListener(
      "click",
      () => switchPage("schedule")
    );


  document
    .getElementById("menuDocuments")
    .addEventListener(
      "click",
      () => switchPage("documents")
    );


  switchPage("dashboard");

  startRealtime();

}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  try {

    await supabaseClient
      .auth
      .signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  if (realtimeChannel) {

    try {

      await supabaseClient
        .removeChannel(
          realtimeChannel
        );

    } catch (error) {

      console.error(
        error
      );

    }

    realtimeChannel = null;

  }


  showLogin();
}


// ======================================================
// PAGE SWITCH
// ======================================================

function switchPage(page) {

  currentPage = page;

  document
    .querySelectorAll(
      ".sidebar-menu button"
    )
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  const titles = {

    dashboard:
      "Dashboard",

    appointments:
      "Vizitat",

    patients:
      "Pacientët",

    schedule:
      "Orari",

    documents:
      "Dokumentet"

  };


  const title =
    document.getElementById(
      "topbarTitle"
    );

  if (title) {

    title.textContent =
      titles[page] ||
      "AMBULATORI GVM";

  }


  const activeButton =
    document.getElementById(
      "menu" +
      page.charAt(0).toUpperCase() +
      page.slice(1)
    );

  if (activeButton) {

    activeButton.classList.add(
      "active"
    );

  }


  if (page === "dashboard") {

    renderDashboard();

  }

  else if (
    page === "appointments"
  ) {

    renderAppointmentsPage();

  }

  else if (
    page === "patients"
  ) {

    renderPatientsPage();

  }

  else if (
    page === "schedule"
  ) {

    renderSchedulePage();

  }

  else if (
    page === "documents"
  ) {

    renderDocumentsPage();

  }

}


// ======================================================
// GET TIME SLOTS
// ======================================================

function getTimeSlots() {

  const slots = [];

  for (
    let hour = START_HOUR;
    hour <= END_HOUR;
    hour++
  ) {

    for (
      let minute = 0;
      minute < 60;
      minute += 15
    ) {

      if (
        hour === END_HOUR &&
        minute > 0
      ) {

        continue;

      }

      const time =
        `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;

      slots.push(time);

    }

  }

  return slots;
}


// ======================================================
// LOAD ALL APPOINTMENTS
// ======================================================

async function loadAllAppointments() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .order(
        "appointment_date",
        {
          ascending: false
        }
      )
      .order(
        "appointment_time",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "Load all appointments error:",
      error
    );

    return [];

  }

  allAppointmentsCache =
    data || [];

  return allAppointmentsCache;
}


// ======================================================
// LOAD DAY
// ======================================================

async function loadAppointments() {

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

    console.error(
      "Load error:",
      error
    );

    return [];

  }

  return data || [];
}


// ======================================================
// DASHBOARD
// ======================================================

async function renderDashboard() {

  const content =
    document.getElementById(
      "pageContent"
    );

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="page-heading">

      <h1>
        Mirë se erdhe në AMBULATORI GVM
      </h1>

      <p>
        Përmbledhje e aktivitetit të ambulancës
      </p>

    </div>


    <div class="stats-grid">

      <div class="stat-card">

        <div class="stat-icon">
          📅
        </div>

        <div>

          <div class="stat-label">
            Vizita sot
          </div>

          <div
            id="statToday"
            class="stat-number"
          >
            ...
          </div>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon">
          👤
        </div>

        <div>

          <div class="stat-label">
            Pacientë gjithsej
          </div>

          <div
            id="statPatients"
            class="stat-number"
          >
            ...
          </div>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon">
          ✓
        </div>

        <div>

          <div class="stat-label">
            Përfunduar sot
          </div>

          <div
            id="statFinished"
            class="stat-number"
          >
            ...
          </div>

        </div>

      </div>


      <div class="stat-card">

        <div class="stat-icon">
          🕐
        </div>

        <div>

          <div class="stat-label">
            Në pritje
          </div>

          <div
            id="statWaiting"
            class="stat-number"
          >
            ...
          </div>

        </div>

      </div>

    </div>


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
            ${escapeHtml(
              displayDate(selectedDate)
            )}
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


    <div class="main-grid">

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

          <div class="form-group">

            <label>
              Emri
            </label>

            <input
              id="firstName"
              type="text"
              placeholder="Emri i pacientit"
              autocomplete="off"
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
              autocomplete="off"
            >

          </div>


          <div class="form-group">

            <label>
              Numri i kartelës
            </label>

            <input
              id="cardNumber"
              type="text"
              placeholder="Numri i kartelës"
              autocomplete="off"
            >

          </div>


          <div class="form-group">

            <label>
              Ora e vizitës
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

      </div>


      <div class="card schedule-card">

        <div class="schedule-header">

          <h3>
            Orari ditor
          </h3>

          <span>
            08:00 — 18:00
          </span>

        </div>


        <div id="appointments">

          <div class="loading">
            Po ngarkohet orari...
          </div>

        </div>

      </div>

    </div>

  `;


  document
    .getElementById("prevDay")
    .addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        renderDashboard();

      }
    );


  document
    .getElementById("nextDay")
    .addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() + 1
        );

        renderDashboard();

      }
    );


  document
    .getElementById("todayBtn")
    .addEventListener(
      "click",
      () => {

        selectedDate =
          new Date();

        renderDashboard();

      }
    );


  document
    .getElementById("addAppointment")
    .addEventListener(
      "click",
      addAppointment
    );


  const appointments =
    await loadAppointments();


  renderSchedule(
    appointments
  );

  populateTimeSlots(
    appointments
  );


  const all =
    await loadAllAppointments();

  updateDashboardStats(
    all
  );
}


// ======================================================
// DASHBOARD STATS
// ======================================================

function updateDashboardStats(
  appointments
) {

  const today =
    formatDate(
      new Date()
    );


  const todayAppointments =
    appointments.filter(
      appointment =>
        String(
          appointment.appointment_date
        ).substring(0,10) === today
    );


  const patients =
    new Set(

      appointments.map(
        appointment =>
          (
            String(
              appointment.first_name || ""
            ).trim()
            +
            "|"
            +
            String(
              appointment.last_name || ""
            ).trim()
            +
            "|"
            +
            String(
              appointment.card_number || ""
            ).trim()
          )
      )

    );


  const finished =
    todayAppointments.filter(
      appointment =>
        appointment.status ===
        "finished"
    ).length;


  const waiting =
    todayAppointments.filter(
      appointment =>
        appointment.status ===
        "planned"
    ).length;


  const statToday =
    document.getElementById(
      "statToday"
    );

  const statPatients =
    document.getElementById(
      "statPatients"
    );

  const statFinished =
    document.getElementById(
      "statFinished"
    );

  const statWaiting =
    document.getElementById(
      "statWaiting"
    );


  if (statToday) {
    statToday.textContent =
      todayAppointments.length;
  }

  if (statPatients) {
    statPatients.textContent =
      patients.size;
  }

  if (statFinished) {
    statFinished.textContent =
      finished;
  }

  if (statWaiting) {
    statWaiting.textContent =
      waiting;
  }
}


// ======================================================
// APPOINTMENTS PAGE
// ======================================================

async function renderAppointmentsPage() {

  const content =
    document.getElementById(
      "pageContent"
    );

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="page-heading">

      <h1>
        Vizitat
      </h1>

      <p>
        Lista e vizitave të regjistruara
      </p>

    </div>


    <div class="section-card">

      <div class="section-header">

        <div>

          <h3>
            Vizitat e pacientëve
          </h3>

          <p>
            Të gjitha terminet e regjistruara
          </p>

        </div>

      </div>


      <div id="appointmentsTable">

        <div class="loading">
          Po ngarkohet...
        </div>

      </div>

    </div>

  `;


  const appointments =
    await loadAllAppointments();


  const table =
    document.getElementById(
      "appointmentsTable"
    );

  if (!table) {
    return;
  }


  if (!appointments.length) {

    table.innerHTML = `
      <div class="empty-message">
        Nuk ka vizita të regjistruara.
      </div>
    `;

    return;
  }


  table.innerHTML = `

    <div class="patient-table-wrap">

      <table class="patient-table">

        <thead>

          <tr>

            <th>
              Data
            </th>

            <th>
              Ora
            </th>

            <th>
              Pacienti
            </th>

            <th>
              Kartela
            </th>

            <th>
              Statusi
            </th>

            <th>
              Veprime
            </th>

          </tr>

        </thead>

        <tbody>

          ${appointments.map(
            appointment =>
              appointmentTableRow(
                appointment
              )
          ).join("")}

        </tbody>

      </table>

    </div>

  `;
}


// ======================================================
// APPOINTMENT TABLE ROW
// ======================================================

function appointmentTableRow(
  appointment
) {

  let statusText =
    "Planifikuar";

  if (
    appointment.status ===
    "arrived"
  ) {
    statusText =
      "Ka ardhur";
  }

  if (
    appointment.status ===
    "finished"
  ) {
    statusText =
      "Përfunduar";
  }

  if (
    appointment.status ===
    "cancelled"
  ) {
    statusText =
      "Anuluar";
  }


  const date =
    String(
      appointment.appointment_date ||
      ""
    ).substring(0,10);


  const time =
    String(
      appointment.appointment_time ||
      ""
    ).substring(0,5);


  const name =
    `${appointment.first_name || ""} ${appointment.last_name || ""}`
      .trim();


  return `

    <tr>

      <td>
        ${escapeHtml(date)}
      </td>

      <td>
        <strong>
          ${escapeHtml(time)}
        </strong>
      </td>

      <td>
        ${escapeHtml(name)}
      </td>

      <td>
        ${escapeHtml(
          appointment.card_number ||
          "-"
        )}
      </td>

      <td>
        ${escapeHtml(statusText)}
      </td>

      <td>

        <button
          onclick="
            deleteAppointment(
              '${escapeHtml(appointment.id)}'
            )
          "
          style="
            border:1px solid #ead0d0;
            background:#fff;
            color:#a34a4a;
            border-radius:6px;
            padding:6px 9px;
            font-size:10px;
          "
        >
          Fshi
        </button>

      </td>

    </tr>

  `;
}


// ======================================================
// PATIENTS PAGE
// ======================================================

async function renderPatientsPage() {

  const content =
    document.getElementById(
      "pageContent"
    );

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="page-heading">

      <h1>
        Pacientët
      </h1>

      <p>
        Kërko pacientët nga vizitat e regjistruara
      </p>

    </div>


    <div class="section-card">

      <div class="section-header">

        <div>

          <h3>
            Lista e pacientëve
          </h3>

          <p>
            Kërko sipas emrit, mbiemrit ose kartelës
          </p>

        </div>


        <input
          id="patientSearch"
          class="patient-search"
          type="text"
          placeholder="🔎 Kërko pacient..."
          autocomplete="off"
        >

      </div>


      <div id="patientsTable">

        <div class="loading">
          Po ngarkohet...
        </div>

      </div>

    </div>

  `;


  const appointments =
    await loadAllAppointments();


  renderPatientsTable(
    appointments
  );


  const search =
    document.getElementById(
      "patientSearch"
    );


  if (search) {

    search.addEventListener(
      "input",
      () => {

        const query =
          search.value
            .trim()
            .toLowerCase();

        const filtered =
          appointments.filter(
            appointment => {

              const text =
                (
                  `${appointment.first_name || ""} ` +
                  `${appointment.last_name || ""} ` +
                  `${appointment.card_number || ""}`
                )
                .toLowerCase();

              return text.includes(
                query
              );

            }
          );


        renderPatientsTable(
          filtered
        );

      }
    );

  }
}


// ======================================================
// PATIENT TABLE
// ======================================================

function renderPatientsTable(
  appointments
) {

  const container =
    document.getElementById(
      "patientsTable"
    );

  if (!container) {
    return;
  }


  const map =
    new Map();


  appointments.forEach(
    appointment => {

      const key =
        (
          `${appointment.first_name || ""} ` +
          `${appointment.last_name || ""} ` +
          `${appointment.card_number || ""}`
        )
        .trim()
        .toLowerCase();


      if (!map.has(key)) {

        map.set(
          key,
          appointment
        );

      }

    }
  );


  const patients =
    Array.from(
      map.values()
    );


  if (!patients.length) {

    container.innerHTML = `

      <div class="empty-message">
        Nuk u gjet asnjë pacient.
      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="patient-table-wrap">

      <table class="patient-table">

        <thead>

          <tr>

            <th>
              Emri
            </th>

            <th>
              Mbiemri
            </th>

            <th>
              Nr. kartelë
            </th>

            <th>
              Data e fundit
            </th>

            <th>
              Ora
            </th>

          </tr>

        </thead>

        <tbody>

          ${patients.map(
            patient => `

              <tr>

                <td>
                  ${escapeHtml(
                    patient.first_name
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    patient.last_name
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    patient.card_number ||
                    "-"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    String(
                      patient.appointment_date ||
                      ""
                    ).substring(0,10)
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    String(
                      patient.appointment_time ||
                      ""
                    ).substring(0,5)
                  )}
                </td>

              </tr>

            `
          ).join("")}

        </tbody>

      </table>

    </div>

  `;
}


// ======================================================
// SCHEDULE PAGE
// ======================================================

async function renderSchedulePage() {

  const content =
    document.getElementById(
      "pageContent"
    );

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="page-heading">

      <h1>
        Orari
      </h1>

      <p>
        Orari i vizitave për ditën e zgjedhur
      </p>

    </div>


    <div class="date-panel">

      <div class="date-left">

        <div class="date-icon">
          📅
        </div>

        <div>

          <span class="date-label">
            Data
          </span>

          <span id="currentDate">
            ${escapeHtml(
              displayDate(selectedDate)
            )}
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


    <div class="section-card">

      <div class="schedule-header">

        <h3>
          Orari ditor
        </h3>

        <span>
          08:00 — 18:00
        </span>

      </div>


      <div id="appointments">

        <div class="loading">
          Po ngarkohet...
        </div>

      </div>

    </div>

  `;


  document
    .getElementById("prevDay")
    .addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        renderSchedulePage();

      }
    );


  document
    .getElementById("nextDay")
    .addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() + 1
        );

        renderSchedulePage();

      }
    );


  document
    .getElementById("todayBtn")
    .addEventListener(
      "click",
      () => {

        selectedDate =
          new Date();

        renderSchedulePage();

      }
    );


  const appointments =
    await loadAppointments();


  renderSchedule(
    appointments
  );

}


// ======================================================
// RENDER SCHEDULE
// ======================================================

function renderSchedule(
  appointments
) {

  const container =
    document.getElementById(
      "appointments"
    );

  if (!container) {
    return;
  }


  const byTime =
    new Map();


  appointments.forEach(
    appointment => {

      const time =
        String(
          appointment.appointment_time
        ).substring(0,5);

      byTime.set(
        time,
        appointment
      );

    }
  );


  container.innerHTML =
    getTimeSlots()
      .map(
        time => {

          const appointment =
            byTime.get(time);


          if (!appointment) {

            return `

              <div
                class="time-slot empty-slot"
                onclick="
                  selectTimeSlot('${time}')
                "
                title="
                  Kliko për të zgjedhur orën ${time}
                "
              >

                <div class="slot-time">
                  ${time}
                </div>

                <div class="slot-content">

                  <span>
                    Orar i lirë — kliko për ta zgjedhur
                  </span>

                </div>

              </div>

            `;

          }


          let statusText =
            "Planifikuar";

          let statusClass =
            "";


          if (
            appointment.status ===
            "arrived"
          ) {

            statusText =
              "Ka ardhur";

            statusClass =
              "status-arrived";

          }


          if (
            appointment.status ===
            "finished"
          ) {

            statusText =
              "Përfunduar";

            statusClass =
              "status-finished";

          }


          if (
            appointment.status ===
            "cancelled"
          ) {

            statusText =
              "Anuluar";

            statusClass =
              "status-cancelled";

          }


          const fullName =
            `${appointment.first_name || ""} ${appointment.last_name || ""}`
              .trim();


          const cardNumber =
            appointment.card_number ||
            "Pa numër kartelë";


          let actions = "";


          if (
            appointment.status ===
            "planned"
          ) {

            actions += `

              <button
                class="arrived-btn"
                onclick="
                  changeStatus(
                    '${appointment.id}',
                    'arrived'
                  )
                "
              >
                ✓ Erdhi
              </button>

            `;

          }


          if (
            appointment.status ===
            "arrived"
          ) {

            actions += `

              <button
                class="finish-btn"
                onclick="
                  changeStatus(
                    '${appointment.id}',
                    'finished'
                  )
                "
              >
                ✓ Përfundoi
              </button>

            `;

          }


          if (
            appointment.status !==
              "cancelled" &&
            appointment.status !==
              "finished"
          ) {

            actions += `

              <button
                class="cancel-btn"
                onclick="
                  changeStatus(
                    '${appointment.id}',
                    'cancelled'
                  )
                "
              >
                Anulo
              </button>

            `;

          }


          actions += `

            <button
              class="delete-btn"
              onclick="
                deleteAppointment(
                  '${appointment.id}'
                )
              "
            >
              Fshi
            </button>

          `;


          return `

            <div class="time-slot">

              <div class="slot-time">
                ${escapeHtml(time)}
              </div>


              <div class="slot-content">

                <div class="patient-info">

                  <span class="patient-name">
                    ${escapeHtml(fullName)}
                  </span>

                  <span class="patient-card">
                    Kartela:
                    ${escapeHtml(cardNumber)}
                  </span>

                </div>


                <span
                  class="
                    status
                    ${statusClass}
                  "
                >
                  ${escapeHtml(statusText)}
                </span>

              </div>


              <div class="appointment-actions">

                ${actions}

              </div>

            </div>

          `;

        }
      )
      .join("");
}


// ======================================================
// POPULATE TIME SELECT
// ======================================================

function populateTimeSlots(
  appointments
) {

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


  const bookedTimes =
    new Set(

      appointments

        .filter(
          appointment =>
            appointment.status !==
            "cancelled"
        )

        .map(
          appointment =>
            String(
              appointment.appointment_time
            ).substring(0,5)
        )

    );


  getTimeSlots()
    .forEach(
      time => {

        if (
          bookedTimes.has(time)
        ) {

          return;

        }


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
    );
}


// ======================================================
// SELECT TIME
// ======================================================

function selectTimeSlot(
  time
) {

  const select =
    document.getElementById(
      "appointmentTime"
    );


  if (select) {

    select.value =
      time;

  }


  const firstName =
    document.getElementById(
      "firstName"
    );


  if (firstName) {

    firstName.focus();

  }

}


// ======================================================
// ADD APPOINTMENT
// ======================================================

async function addAppointment() {

  const firstName =
    document
      .getElementById("firstName")
      .value
      .trim();


  const lastName =
    document
      .getElementById("lastName")
      .value
      .trim();


  const cardNumber =
    document
      .getElementById("cardNumber")
      .value
      .trim();


  const appointmentTime =
    document
      .getElementById("appointmentTime")
      .value;


  const message =
    document.getElementById(
      "message"
    );


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    message.style.color =
      "#bd4b4b";

    return;

  }


  const appointmentDate =
    formatDate(
      selectedDate
    );


  message.textContent =
    "Duke kontrolluar orarin...";

  message.style.color =
    "#526674";


  const {
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("appointments")
      .select(
        "id,status,appointment_date,appointment_time"
      )
      .eq(
        "appointment_date",
        appointmentDate
      )
      .eq(
        "appointment_time",
        appointmentTime
      );


  if (checkError) {

    console.error(
      checkError
    );

    message.textContent =
      "Gabim gjatë kontrollit të orarit.";

    message.style.color =
      "#bd4b4b";

    alert(
      "NUK MUND TË KONTROLLOHET ORARI\n\n" +
      checkError.message
    );

    return;

  }


  const rows =
    existing || [];


  const activeAppointment =
    rows.find(
      appointment =>
        appointment.status !==
        "cancelled"
    );


  if (activeAppointment) {

    message.textContent =
      "Ky orar është tashmë i zënë.";

    message.style.color =
      "#bd4b4b";

    alert(
      "KJO ORË ËSHTË E ZËNË\n\n" +
      "Zgjidh një orar tjetër."
    );

    return;

  }


  const cancelledAppointment =
    rows.find(
      appointment =>
        appointment.status ===
        "cancelled"
    );


  if (cancelledAppointment) {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({

          first_name:
            firstName,

          last_name:
            lastName,

          card_number:
            cardNumber ||
            null,

          status:
            "planned"

        })
        .eq(
          "id",
          cancelledAppointment.id
        );


    if (error) {

      console.error(
        error
      );

      message.textContent =
        "Vizita nuk u ruajt.";

      message.style.color =
        "#bd4b4b";

      alert(
        error.message
      );

      return;

    }


    clearForm();

    message.textContent =
      "Vizita u shtua me sukses.";

    message.style.color =
      "#2e8b57";


    if (
      currentPage ===
      "dashboard"
    ) {

      renderDashboard();

    }

    else if (
      currentPage ===
      "schedule"
    ) {

      renderSchedulePage();

    }

    return;

  }


  const appointmentData = {

    first_name:
      firstName,

    last_name:
      lastName,

    card_number:
      cardNumber ||
      null,

    appointment_date:
      appointmentDate,

    appointment_time:
      appointmentTime,

    status:
      "planned"

  };


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .insert(
        appointmentData
      );


  if (error) {

    console.error(
      "Insert error:",
      error
    );


    if (
      error.code ===
      "23505"
    ) {

      message.textContent =
        "Ky orar është tashmë i zënë.";

      message.style.color =
        "#bd4b4b";

      alert(
        "KJO ORË ËSHTË E ZËNË"
      );

      return;

    }


    message.textContent =
      "Vizita nuk u shtua.";

    message.style.color =
      "#bd4b4b";


    alert(
      "VIZITA NUK U SHTUA\n\n" +
      "CODE: " +
      (error.code || "N/A") +
      "\n\nMESSAGE: " +
      (error.message || "N/A")
    );

    return;

  }


  clearForm();


  message.textContent =
    "Vizita u shtua me sukses.";

  message.style.color =
    "#2e8b57";


  if (
    currentPage ===
    "dashboard"
  ) {

    renderDashboard();

  }

}


// ======================================================
// CLEAR FORM
// ======================================================

function clearForm() {

  const firstName =
    document.getElementById(
      "firstName"
    );

  const lastName =
    document.getElementById(
      "lastName"
    );

  const cardNumber =
    document.getElementById(
      "cardNumber"
    );

  const appointmentTime =
    document.getElementById(
      "appointmentTime"
    );


  if (firstName) {
    firstName.value = "";
  }

  if (lastName) {
    lastName.value = "";
  }

  if (cardNumber) {
    cardNumber.value = "";
  }

  if (appointmentTime) {
    appointmentTime.value = "";
  }

}


// ======================================================
// CHANGE STATUS
// ======================================================

async function changeStatus(
  id,
  status
) {

  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update({

        status:
          status

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      error
    );

    alert(
      "Statusi nuk u ndryshua.\n\n" +
      error.message
    );

    return;

  }


  if (
    currentPage ===
    "dashboard"
  ) {

    renderDashboard();

  }

  else if (
    currentPage ===
    "appointments"
  ) {

    renderAppointmentsPage();

  }

  else if (
    currentPage ===
    "schedule"
  ) {

    renderSchedulePage();

  }

  else if (
    currentPage ===
    "patients"
  ) {

    renderPatientsPage();

  }

}


// ======================================================
// DELETE
// ======================================================

async function deleteAppointment(
  id
) {

  const confirmed =
    confirm(
      "A dëshiron ta fshish këtë vizitë?"
    );


  if (!confirmed) {
    return;
  }


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

    console.error(
      error
    );

    alert(
      "Vizita nuk u fshi.\n\n" +
      error.message
    );

    return;

  }


  if (
    currentPage ===
    "dashboard"
  ) {

    renderDashboard();

  }

  else if (
    currentPage ===
    "appointments"
  ) {

    renderAppointmentsPage();

  }

  else if (
    currentPage ===
    "schedule"
  ) {

    renderSchedulePage();

  }

  else if (
    currentPage ===
    "patients"
  ) {

    renderPatientsPage();

  }

}


// ======================================================
// DOCUMENTS PAGE
// ======================================================

function renderDocumentsPage() {

  const content =
    document.getElementById(
      "pageContent"
    );

  if (!content) {
    return;
  }


  content.innerHTML = `

    <div class="page-heading">

      <h1>
        Dokumentet
      </h1>

      <p>
        Zona e dokumenteve mjekësore
      </p>

    </div>


    <div class="info-box">

      <strong>
        Dokumentet mjekësore
      </strong>

      <br><br>

      Kjo pjesë është përgatitur për hapin tjetër
      të sistemit ku mund të shtojmë kartelat,
      rezonancat, grafitë, analizat dhe dokumentet
      PDF të pacientëve.

      <br><br>

      Aktualisht nuk ndryshon asnjë nga të dhënat
      ekzistuese të pacientëve.

    </div>

  `;

}


// ======================================================
// REALTIME
// ======================================================

function startRealtime() {

  if (realtimeChannel) {

    supabaseClient
      .removeChannel(
        realtimeChannel
      );

  }


  realtimeChannel =
    supabaseClient
      .channel(
        "appointments-realtime"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments"
        },
        payload => {

          console.log(
            "Realtime update:",
            payload
          );


          if (
            currentPage ===
            "dashboard"
          ) {

            renderDashboard();

          }

          else if (
            currentPage ===
            "appointments"
          ) {

            renderAppointmentsPage();

          }

          else if (
            currentPage ===
            "patients"
          ) {

            renderPatientsPage();

          }

          else if (
            currentPage ===
            "schedule"
          ) {

            renderSchedulePage();

          }

        }
      )
      .subscribe(
        status => {

          console.log(
            "Realtime status:",
            status
          );

        }
      );

}


// ======================================================
// AUTH EVENTS
// ======================================================

supabaseClient
  .auth
  .onAuthStateChange(
    (
      event,
      session
    ) => {

      console.log(
        "Auth event:",
        event
      );


      console.log(
        "Session:",
        session
      );


      if (
        event ===
        "SIGNED_OUT"
      ) {

        showLogin();

      }

    }
  );


// ======================================================
// START
// ======================================================

window.addEventListener(
  "load",
  () => {

    console.log(
      "================================="
    );

    console.log(
      "AMBULATORI GVM"
    );

    console.log(
      "Sistemi po inicializohet..."
    );

    console.log(
      "================================="
    );


    checkSession();

  }
);
