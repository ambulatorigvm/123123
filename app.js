// ======================================================
// AMBULATORI GVM - APP.JS
// ======================================================

const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

console.log("APP.JS U NGARKUA");

let supabaseClient;

try {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("SUPABASE U KRIJUA");
} catch (error) {
  console.error("GABIM SUPABASE:", error);

  document.getElementById("app").innerHTML = `
    <div style="
      max-width:700px;
      margin:80px auto;
      background:white;
      padding:30px;
      border-radius:20px;
      font-family:Arial;
      box-shadow:0 10px 40px rgba(0,0,0,.15);
    ">
      <h2 style="color:#c62828;">Gabim në lidhjen me sistemin</h2>
      <p>Supabase nuk u inicializua.</p>
      <pre style="
        background:#f5f5f5;
        padding:15px;
        border-radius:10px;
        white-space:pre-wrap;
      ">${escapeHtml(String(error))}</pre>
    </div>
  `;

  throw error;
}

let selectedDate = new Date();

const START_HOUR = 8;
const END_HOUR = 18;


// ======================================================
// HELPERS
// ======================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function displayDate(date) {
  return date.toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}


// ======================================================
// SESSION
// ======================================================

async function checkSession() {
  console.log("Po kontrollohet sesioni...");

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("SESSION ERROR:", error);
      showLogin();
      return;
    }

    console.log("Session:", data);

    if (data.session) {
      await showApp();
    } else {
      showLogin();
    }

  } catch (error) {
    console.error("CHECK SESSION ERROR:", error);
    showLogin();
  }
}


// ======================================================
// LOGIN
// ======================================================

function showLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login-page">

      <div class="login-overlay"></div>

      <div class="login-card">

        <div class="login-icon">
          🏥
        </div>

        <h1>AMBULATORI GVM</h1>

        <p class="login-subtitle">
          Sistemi i administrimit të vizitave
        </p>

        <div class="form-group">
          <label>Email</label>

          <input
            type="email"
            id="loginEmail"
            placeholder="Email"
            autocomplete="username"
          >
        </div>

        <div class="form-group">
          <label>Fjalëkalimi</label>

          <input
            type="password"
            id="loginPassword"
            placeholder="Fjalëkalimi"
            autocomplete="current-password"
          >
        </div>

        <button
          class="login-btn"
          id="loginButton"
          onclick="login()"
        >
          Hyr në sistem
        </button>

        <div id="loginMessage"></div>

      </div>

    </div>
  `;
}


async function login() {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const message = document.getElementById("loginMessage");
  const button = document.getElementById("loginButton");

  if (!email || !password) {

    message.innerHTML = `
      <div class="error-message">
        Plotëso emailin dhe fjalëkalimin.
      </div>
    `;

    return;
  }

  button.disabled = true;
  button.textContent = "Po kontrollohet...";

  message.innerHTML = "";

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("LOGIN ERROR:", error);

      message.innerHTML = `
        <div class="error-message">
          ${escapeHtml(error.message)}
        </div>
      `;

      button.disabled = false;
      button.textContent = "Hyr në sistem";

      return;
    }

    console.log("LOGIN OK:", data);

    await showApp();

  } catch (error) {

    console.error("LOGIN EXCEPTION:", error);

    message.innerHTML = `
      <div class="error-message">
        Gabim gjatë hyrjes në sistem.
      </div>
    `;

    button.disabled = false;
    button.textContent = "Hyr në sistem";
  }
}


// ======================================================
// MAIN APP
// ======================================================

async function showApp() {

  console.log("Po hapet aplikacioni...");

  document.getElementById("app").innerHTML = `

    <div class="app-shell">

      <header class="topbar">

        <div class="brand">

          <div class="brand-icon">
            ✚
          </div>

          <div>
            <div class="brand-title">
              AMBULATORI GVM
            </div>

            <div class="brand-subtitle">
              Menaxhimi i vizitave
            </div>
          </div>

        </div>

        <button
          class="logout-btn"
          onclick="logout()"
        >
          Dil
        </button>

      </header>


      <main class="page">

        <div class="page-heading">

          <div>
            <h1>Orari i vizitave</h1>

            <p>
              Menaxho takimet dhe pacientët e ditës
            </p>
          </div>

          <div class="status-online">
            <span></span>
            Sistemi aktiv
          </div>

        </div>


        <div class="date-panel">

          <button
            class="date-nav"
            onclick="previousDay()"
          >
            ‹
          </button>

          <div class="date-center">

            <div class="date-label">
              Data e zgjedhur
            </div>

            <div
              class="date-title"
              id="dateTitle"
            >
              ${displayDate(selectedDate)}
            </div>

          </div>

          <button
            class="today-btn"
            onclick="goToday()"
          >
            Sot
          </button>

          <button
            class="date-nav"
            onclick="nextDay()"
          >
            ›
          </button>

        </div>


        <div class="main-grid">


          <!-- =========================================
               ADD APPOINTMENT
          ========================================== -->

          <section class="card form-card">

            <div class="card-header">

              <div class="card-icon">
                ＋
              </div>

              <div>
                <h2>Shto vizitë</h2>
                <p>Regjistro një pacient të ri</p>
              </div>

            </div>


            <div class="form-group">

              <label>Emri</label>

              <input
                type="text"
                id="firstName"
                placeholder="Emri i pacientit"
              >

            </div>


            <div class="form-group">

              <label>Mbiemri</label>

              <input
                type="text"
                id="lastName"
                placeholder="Mbiemri i pacientit"
              >

            </div>


            <div class="form-group">

              <label>Nr. i kartelës</label>

              <input
                type="text"
                id="cardNumber"
                placeholder="Numri i kartelës"
              >

            </div>


            <div class="form-group">

              <label>Ora e vizitës</label>

              <select id="appointmentTime">
                <option value="">
                  Zgjidh orën
                </option>
              </select>

            </div>


            <button
              class="add-btn"
              id="addAppointment"
              onclick="addAppointment()"
            >
              <span>＋</span>
              Shto vizitën
            </button>


            <div id="message"></div>

          </section>



          <!-- =========================================
               DAILY SCHEDULE
          ========================================== -->

          <section class="card schedule-card">

            <div class="schedule-header">

              <div>

                <div class="schedule-title-row">

                  <div class="hospital-symbol">
                    🏥
                  </div>

                  <div>

                    <h2>Orari ditor</h2>

                    <p>
                      08:00 — 18:00 · çdo 15 minuta
                    </p>

                  </div>

                </div>

              </div>

              <div class="appointment-count">
                <span id="appointmentCount">0</span>
                vizita
              </div>

            </div>


            <div
              id="appointments"
              class="appointments"
            >

              <div class="loading">
                Po ngarkohet orari...
              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  `;

  updateDateTitle();

  populateTimeSlots();

  await loadAppointments();

  startRealtime();

  console.log("APLIKACIONI U HAP");
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  try {

    await supabaseClient.auth.signOut();

    showLogin();

  } catch (error) {

    console.error("LOGOUT ERROR:", error);

  }
}


// ======================================================
// DATE NAVIGATION
// ======================================================

function updateDateTitle() {

  const element = document.getElementById("dateTitle");

  if (element) {
    element.textContent = displayDate(selectedDate);
  }
}


function previousDay() {

  selectedDate.setDate(
    selectedDate.getDate() - 1
  );

  updateDateTitle();
  loadAppointments();
}


function nextDay() {

  selectedDate.setDate(
    selectedDate.getDate() + 1
  );

  updateDateTitle();
  loadAppointments();
}


function goToday() {

  selectedDate = new Date();

  updateDateTitle();
  loadAppointments();
}


// ======================================================
// TIME SLOTS
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

      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");

      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}


// ======================================================
// LOAD APPOINTMENTS
// ======================================================

async function loadAppointments() {

  const container =
    document.getElementById("appointments");

  if (!container) return;

  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Po ngarkohet orari...
    </div>
  `;

  const date = formatDate(selectedDate);

  console.log("Po ngarkohen vizitat për:", date);

  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("appointment_date", date)
        .order("appointment_time", {
          ascending: true
        });

    if (error) {

      console.error(
        "APPOINTMENTS ERROR:",
        error
      );

      container.innerHTML = `
        <div class="error-box">
          <strong>Nuk u ngarkuan vizitat.</strong>
          <br><br>
          ${escapeHtml(error.message)}
        </div>
      `;

      return;
    }

    console.log(
      "Vizitat e gjetura:",
      data
    );

    renderAppointments(data || []);

  } catch (error) {

    console.error(
      "LOAD APPOINTMENTS EXCEPTION:",
      error
    );

    container.innerHTML = `
      <div class="error-box">
        Gabim gjatë ngarkimit të orarit.
      </div>
    `;
  }
}


// ======================================================
// TIME SELECT
// ======================================================

function populateTimeSlots() {

  const select =
    document.getElementById("appointmentTime");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Zgjidh orën
    </option>
  `;

  getTimeSlots().forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;
    option.textContent = time;

    select.appendChild(option);
  });
}


// ======================================================
// RENDER
// ======================================================

function renderAppointments(appointments) {

  const container =
    document.getElementById("appointments");

  if (!container) return;

  const countElement =
    document.getElementById("appointmentCount");

  const activeAppointments =
    appointments.filter(
      a => a.status !== "cancelled"
    );

  if (countElement) {
    countElement.textContent =
      activeAppointments.length;
  }

  const appointmentMap =
    new Map();

  appointments.forEach(appointment => {

    appointmentMap.set(
      appointment.appointment_time,
      appointment
    );

  });


  let html = "";

  getTimeSlots().forEach(time => {

    const appointment =
      appointmentMap.get(time);

    if (!appointment) {

      html += `
        <div
          class="time-slot empty-slot"
          onclick="selectTimeSlot('${time}')"
        >

          <div class="slot-time">
            ${time}
          </div>

          <div class="slot-content">

            <div class="empty-title">
              Orar i lirë
            </div>

            <div class="empty-subtitle">
              Kliko për ta zgjedhur
            </div>

          </div>

          <div class="empty-plus">
            ＋
          </div>

        </div>
      `;

      return;
    }


    let statusText =
      "Planifikuar";

    let statusClass =
      "status-planned";


    if (appointment.status === "arrived") {

      statusText =
        "Ka ardhur";

      statusClass =
        "status-arrived";

    }

    if (appointment.status === "finished") {

      statusText =
        "Përfunduar";

      statusClass =
        "status-finished";

    }

    if (appointment.status === "cancelled") {

      statusText =
        "Anuluar";

      statusClass =
        "status-cancelled";

    }


    let actions = "";


    if (
      appointment.status ===
      "planned"
    ) {

      actions = `

        <button
          class="action-btn arrived"
          onclick="changeStatus('${appointment.id}', 'arrived')"
        >
          ✓ Erdhi
        </button>

        <button
          class="action-btn cancel"
          onclick="changeStatus('${appointment.id}', 'cancelled')"
        >
          Anulo
        </button>

        <button
          class="action-btn delete"
          onclick="deleteAppointment('${appointment.id}')"
        >
          Fshi
        </button>

      `;

    } else if (
      appointment.status ===
      "arrived"
    ) {

      actions = `

        <button
          class="action-btn finished"
          onclick="changeStatus('${appointment.id}', 'finished')"
        >
          ✓ Përfundoi
        </button>

        <button
          class="action-btn cancel"
          onclick="changeStatus('${appointment.id}', 'cancelled')"
        >
          Anulo
        </button>

        <button
          class="action-btn delete"
          onclick="deleteAppointment('${appointment.id}')"
        >
          Fshi
        </button>

      `;

    } else {

      actions = `

        <button
          class="action-btn delete"
          onclick="deleteAppointment('${appointment.id}')"
        >
          Fshi
        </button>

      `;
    }


    html += `

      <div class="time-slot appointment-slot">

        <div class="slot-time">
          ${time}
        </div>

        <div class="slot-content">

          <div class="patient-name">
            ${escapeHtml(
              appointment.first_name
            )}
            ${escapeHtml(
              appointment.last_name
            )}
          </div>

          <div class="patient-meta">

            <span>
              Kartela:
              ${escapeHtml(
                appointment.card_number || "-"
              )}
            </span>

          </div>

        </div>

        <div class="slot-status">

          <span class="status ${statusClass}">
            ${statusText}
          </span>

        </div>

        <div class="appointment-actions">
          ${actions}
        </div>

      </div>

    `;
  });


  container.innerHTML = html;
}


// ======================================================
// SELECT TIME
// ======================================================

function selectTimeSlot(time) {

  const select =
    document.getElementById("appointmentTime");

  if (!select) return;

  select.value = time;

  const firstName =
    document.getElementById("firstName");

  if (firstName) {
    firstName.focus();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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
    document.getElementById("message");

  const button =
    document.getElementById("addAppointment");


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.innerHTML = `
      <div class="error-message">
        Plotëso emrin, mbiemrin dhe orën.
      </div>
    `;

    return;
  }


  button.disabled = true;
  button.textContent = "Po ruhet...";

  message.innerHTML = "";


  const date =
    formatDate(selectedDate);


  try {

    console.log(
      "Po kontrollohet ora:",
      date,
      appointmentTime
    );


    const { data: existing, error: checkError } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("appointment_date", date)
        .eq("appointment_time", appointmentTime);


    if (checkError) {

      console.error(
        "CHECK ERROR:",
        checkError
      );

      throw checkError;
    }


    const active =
      (existing || []).find(
        item =>
          item.status !==
          "cancelled"
      );


    if (active) {

      message.innerHTML = `
        <div class="error-message">
          Ora ${appointmentTime} është e zënë.
        </div>
      `;

      button.disabled = false;
      button.innerHTML =
        "<span>＋</span> Shto vizitën";

      return;
    }


    const cancelled =
      (existing || []).find(
        item =>
          item.status ===
          "cancelled"
      );


    if (cancelled) {

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
              cardNumber,

            status:
              "planned"
          })
          .eq("id", cancelled.id);


      if (error) {
        throw error;
      }

    } else {

      const {
        error
      } =
        await supabaseClient
          .from("appointments")
          .insert([{

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

          }]);


      if (error) {

        console.error(
          "INSERT ERROR:",
          error
        );

        if (
          error.code ===
          "23505"
        ) {

          message.innerHTML = `
            <div class="error-message">
              Kjo orë është tashmë e zënë.
            </div>
          `;

          button.disabled = false;
          button.innerHTML =
            "<span>＋</span> Shto vizitën";

          return;
        }

        throw error;
      }
    }


    clearForm();

    message.innerHTML = `
      <div class="success-message">
        ✓ Vizita u shtua me sukses.
      </div>
    `;

    await loadAppointments();

  } catch (error) {

    console.error(
      "ADD APPOINTMENT ERROR:",
      error
    );

    message.innerHTML = `
      <div class="error-message">
        ${escapeHtml(
          error.message ||
          "Gabim gjatë ruajtjes."
        )}
      </div>
    `;

  } finally {

    button.disabled = false;

    button.innerHTML =
      "<span>＋</span> Shto vizitën";
  }
}


// ======================================================
// CLEAR FORM
// ======================================================

function clearForm() {

  document.getElementById(
    "firstName"
  ).value = "";

  document.getElementById(
    "lastName"
  ).value = "";

  document.getElementById(
    "cardNumber"
  ).value = "";

  document.getElementById(
    "appointmentTime"
  ).value = "";
}


// ======================================================
// CHANGE STATUS
// ======================================================

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
          status
        })
        .eq("id", id);

    if (error) {
      throw error;
    }

    await loadAppointments();

  } catch (error) {

    console.error(
      "STATUS ERROR:",
      error
    );

    alert(
      "Gabim: " +
      error.message
    );
  }
}


// ======================================================
// DELETE
// ======================================================

async function deleteAppointment(id) {

  const confirmed =
    confirm(
      "A dëshiron ta fshish këtë vizitë?"
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
        .eq("id", id);

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
      "Gabim gjatë fshirjes: " +
      error.message
    );
  }
}


// ======================================================
// REALTIME
// ======================================================

function startRealtime() {

  console.log(
    "Po aktivizohet realtime..."
  );

  supabaseClient
    .channel("appointments-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments"
      },
      payload => {

        console.log(
          "REALTIME:",
          payload
        );

        loadAppointments();
      }
    )
    .subscribe(status => {

      console.log(
        "REALTIME STATUS:",
        status
      );

    });
}


// ======================================================
// AUTH EVENTS
// ======================================================

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    if (
      event ===
      "SIGNED_IN"
    ) {

      await showApp();

    }

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
      "WINDOW LOADED"
    );

    checkSession();

  }
);
