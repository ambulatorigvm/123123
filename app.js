// ======================================================
// AMBULATORI GVM
// APP.JS - VERSION I KORRIGJUAR
// ======================================================

const SUPABASE_URL =
  "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";


// ======================================================
// SUPABASE
// ======================================================

let supabaseClient = null;

try {

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("APP.JS U NGARKUA");
  console.log("SUPABASE U KRIJUA");

} catch (error) {

  console.error(
    "GABIM GJATË KRIJIMIT TË SUPABASE:",
    error
  );

  const app = document.getElementById("app");

  if (app) {

    app.innerHTML = `
      <div style="
        max-width:700px;
        margin:80px auto;
        background:white;
        padding:30px;
        border-radius:20px;
        font-family:Arial,sans-serif;
        box-shadow:0 10px 40px rgba(0,0,0,.15);
      ">

        <h2 style="color:#c62828;">
          Gabim në lidhjen me sistemin
        </h2>

        <p>
          Supabase nuk u inicializua.
        </p>

        <pre style="
          background:#f5f5f5;
          padding:15px;
          border-radius:10px;
          white-space:pre-wrap;
        ">${escapeHtml(String(error))}</pre>

      </div>
    `;
  }
}


// ======================================================
// VARIABLES
// ======================================================

let selectedDate = new Date();

const START_HOUR = 8;
const END_HOUR = 18;

let realtimeChannel = null;

let applicationStarted = false;

let isLoadingApplication = false;


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function displayDate(date) {

  return date.toLocaleDateString(
    "sq-AL",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

  console.log(
    "Po kontrollohet sesioni..."
  );

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLogin();

      return;
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


// ======================================================
// LOGIN SCREEN
// ======================================================

function showLogin() {

  applicationStarted = false;

  document.getElementById(
    "app"
  ).innerHTML = `

    <div class="login-page">

      <div class="login-overlay"></div>

      <div class="login-card">

        <div class="login-icon">
          🏥
        </div>

        <h1>
          AMBULATORI GVM
        </h1>

        <p class="login-subtitle">
          Sistemi i administrimit të vizitave
        </p>


        <div class="form-group">

          <label>
            Email
          </label>

          <input
            type="email"
            id="loginEmail"
            placeholder="Email"
            autocomplete="username"
          >

        </div>


        <div class="form-group">

          <label>
            Fjalëkalimi
          </label>

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


  // ENTER për login

  const password =
    document.getElementById(
      "loginPassword"
    );

  if (password) {

    password.addEventListener(
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
}


// ======================================================
// LOGIN
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

  const button =
    document.getElementById(
      "loginButton"
    );


  if (
    !emailElement ||
    !passwordElement ||
    !message ||
    !button
  ) {

    return;
  }


  const email =
    emailElement.value.trim();

  const password =
    passwordElement.value;


  if (
    !email ||
    !password
  ) {

    message.innerHTML = `
      <div class="error-message">
        Plotëso emailin dhe fjalëkalimin.
      </div>
    `;

    return;
  }


  button.disabled = true;

  button.textContent =
    "Po kontrollohet...";

  message.innerHTML = "";


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      message.innerHTML = `
        <div class="error-message">
          ${escapeHtml(
            error.message
          )}
        </div>
      `;

      button.disabled = false;

      button.textContent =
        "Hyr në sistem";

      return;
    }


    console.log(
      "LOGIN OK:",
      data
    );


    await startApplication();


  } catch (error) {

    console.error(
      "LOGIN EXCEPTION:",
      error
    );

    message.innerHTML = `
      <div class="error-message">
        Gabim gjatë hyrjes në sistem.
      </div>
    `;

  } finally {

    button.disabled = false;

    button.textContent =
      "Hyr në sistem";
  }
}


// ======================================================
// START APPLICATION
// ======================================================

async function startApplication() {

  // Mos e hap aplikacionin dy herë

  if (applicationStarted) {

    console.log(
      "Aplikacioni është tashmë i hapur."
    );

    return;
  }


  // Mos lejo dy startime njëkohësisht

  if (isLoadingApplication) {

    console.log(
      "Aplikacioni po hapet..."
    );

    return;
  }


  isLoadingApplication = true;


  try {

    console.log(
      "Po hapet aplikacioni..."
    );


    applicationStarted = true;


    await showApp();


  } catch (error) {

    console.error(
      "START APPLICATION ERROR:",
      error
    );

    applicationStarted = false;

  } finally {

    isLoadingApplication = false;

  }
}


// ======================================================
// MAIN APP
// ======================================================

async function showApp() {

  document.getElementById(
    "app"
  ).innerHTML = `

    <div class="app-shell">


      <!-- =========================================
           TOP BAR
      ========================================== -->

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


        <div
          class="topbar-right"
        >

          <div class="topbar-status">

            <span></span>

            Sistemi aktiv

          </div>


          <button
            class="logout-btn"
            onclick="logout()"
          >
            Dil
          </button>

        </div>

      </header>



      <!-- =========================================
           PAGE
      ========================================== -->

      <main class="page">


        <div class="page-heading">

          <div>

            <h1>
              Orari i vizitave
            </h1>

            <p>
              Menaxho takimet dhe pacientët e ditës
            </p>

          </div>


          <div class="status-online">

            <span></span>

            Sistemi aktiv

          </div>

        </div>



        <!-- =======================================
             DATE
        ======================================== -->

        <div class="date-panel">


          <button
            class="date-nav"
            onclick="previousDay()"
            title="Dita e kaluar"
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
              ${displayDate(
                selectedDate
              )}
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
            title="Dita tjetër"
          >
            ›
          </button>


        </div>



        <!-- =======================================
             MAIN GRID
        ======================================== -->

        <div class="main-grid">


          <!-- =====================================
               ADD APPOINTMENT
          ====================================== -->

          <section class="card form-card">


            <div class="card-header">

              <div class="card-icon">
                ＋
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



            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                type="text"
                id="firstName"
                placeholder="Emri i pacientit"
                autocomplete="off"
              >

            </div>



            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                type="text"
                id="lastName"
                placeholder="Mbiemri i pacientit"
                autocomplete="off"
              >

            </div>



            <div class="form-group">

              <label>
                Nr. i kartelës
              </label>

              <input
                type="text"
                id="cardNumber"
                placeholder="Numri i kartelës"
                autocomplete="off"
              >

            </div>



            <div class="form-group">

              <label>
                Ora e vizitës
              </label>

              <select
                id="appointmentTime"
              >

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

              <span>
                ＋
              </span>

              Shto vizitën

            </button>



            <div
              id="message"
            ></div>


          </section>



          <!-- =====================================
               DAILY SCHEDULE
          ====================================== -->

          <section class="card schedule-card">


            <div class="schedule-header">


              <div>

                <div class="schedule-title-row">


                  <div class="hospital-symbol">
                    🏥
                  </div>


                  <div>

                    <h2>
                      Orari ditor
                    </h2>

                    <p>
                      08:00 — 18:00 · çdo 15 minuta
                    </p>

                  </div>


                </div>

              </div>



              <div
                class="appointment-count"
              >

                <span
                  id="appointmentCount"
                >
                  0
                </span>

                vizita

              </div>


            </div>



            <div
              id="appointments"
              class="appointments"
            >

              <div class="loading">

                <div class="spinner"></div>

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


  // Ngarko pacientët

  await loadAppointments();


  // Aktivizo realtime vetëm një herë

  startRealtime();


  console.log(
    "APLIKACIONI U HAP"
  );
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  try {

    // Mbyll realtime

    await stopRealtime();


    applicationStarted = false;


    const {
      error
    } =
      await supabaseClient.auth.signOut();


    if (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      return;
    }


    showLogin();


  } catch (error) {

    console.error(
      "LOGOUT EXCEPTION:",
      error
    );

  }
}


// ======================================================
// STOP REALTIME
// ======================================================

async function stopRealtime() {

  if (!realtimeChannel) {
    return;
  }


  console.log(
    "Po mbyllet realtime..."
  );


  try {

    await supabaseClient.removeChannel(
      realtimeChannel
    );

  } catch (error) {

    console.error(
      "REALTIME REMOVE ERROR:",
      error
    );

  }


  realtimeChannel = null;
}


// ======================================================
// DATE NAVIGATION
// ======================================================

function updateDateTitle() {

  const element =
    document.getElementById(
      "dateTitle"
    );


  if (element) {

    element.textContent =
      displayDate(
        selectedDate
      );

  }
}


async function previousDay() {

  selectedDate.setDate(
    selectedDate.getDate() - 1
  );


  updateDateTitle();

  await loadAppointments();
}


async function nextDay() {

  selectedDate.setDate(
    selectedDate.getDate() + 1
  );


  updateDateTitle();

  await loadAppointments();
}


async function goToday() {

  selectedDate =
    new Date();


  updateDateTitle();

  await loadAppointments();
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


      const h =
        String(hour)
          .padStart(2, "0");


      const m =
        String(minute)
          .padStart(2, "0");


      slots.push(
        `${h}:${m}`
      );
    }
  }


  return slots;
}


// ======================================================
// LOAD APPOINTMENTS
// ======================================================

async function loadAppointments() {

  const container =
    document.getElementById(
      "appointments"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="loading">

      <div class="spinner"></div>

      Po ngarkohet orari...

    </div>
  `;


  const date =
    formatDate(
      selectedDate
    );


  console.log(
    "Po ngarkohen vizitat për:",
    date
  );


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

      console.error(
        "APPOINTMENTS ERROR:",
        error
      );


      container.innerHTML = `

        <div class="error-box">

          <strong>
            Nuk u ngarkuan vizitat.
          </strong>

          <br>
          <br>

          ${escapeHtml(
            error.message
          )}

        </div>

      `;

      return;
    }


    console.log(
      "Vizitat e gjetura:",
      data
    );


    renderAppointments(
      data || []
    );


  } catch (error) {

    console.error(
      "LOAD APPOINTMENTS ERROR:",
      error
    );


    container.innerHTML = `

      <div class="error-box">

        Gabim gjatë ngarkimit të orarit.

        <br>
        <br>

        ${escapeHtml(
          error.message ||
          ""
        )}

      </div>

    `;
  }
}


// ======================================================
// POPULATE TIME SELECT
// ======================================================

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


  getTimeSlots().forEach(
    time => {

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
// RENDER APPOINTMENTS
// ======================================================

function renderAppointments(
  appointments
) {

  const container =
    document.getElementById(
      "appointments"
    );


  if (!container) {
    return;
  }


  const countElement =
    document.getElementById(
      "appointmentCount"
    );


  const activeAppointments =
    appointments.filter(
      appointment =>
        appointment.status !==
        "cancelled"
    );


  if (countElement) {

    countElement.textContent =
      activeAppointments.length;

  }


  const appointmentMap =
    new Map();


  appointments.forEach(
    appointment => {

      appointmentMap.set(
        appointment.appointment_time,
        appointment
      );

    }
  );


  let html = "";


  getTimeSlots().forEach(
    time => {

      const appointment =
        appointmentMap.get(
          time
        );


      // =========================================
      // EMPTY SLOT
      // =========================================

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


      // =========================================
      // STATUS
      // =========================================

      let statusText =
        "Planifikuar";


      let statusClass =
        "status-planned";


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


      // =========================================
      // ACTIONS
      // =========================================

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


      // =========================================
      // APPOINTMENT ROW
      // =========================================

      html += `

        <div class="time-slot appointment-slot">


          <div class="slot-time">
            ${escapeHtml(time)}
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

            <span
              class="status ${statusClass}"
            >
              ${statusText}
            </span>

          </div>


          <div class="appointment-actions">

            ${actions}

          </div>


        </div>

      `;
    }
  );


  container.innerHTML =
    html;
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


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ======================================================
// ADD APPOINTMENT
// ======================================================

async function addAppointment() {

  const firstNameElement =
    document.getElementById(
      "firstName"
    );


  const lastNameElement =
    document.getElementById(
      "lastName"
    );


  const cardNumberElement =
    document.getElementById(
      "cardNumber"
    );


  const appointmentTimeElement =
    document.getElementById(
      "appointmentTime"
    );


  const message =
    document.getElementById(
      "message"
    );


  const button =
    document.getElementById(
      "addAppointment"
    );


  if (
    !firstNameElement ||
    !lastNameElement ||
    !cardNumberElement ||
    !appointmentTimeElement ||
    !message ||
    !button
  ) {

    console.error(
      "Formulari nuk u gjet."
    );

    return;
  }


  const firstName =
    firstNameElement.value.trim();


  const lastName =
    lastNameElement.value.trim();


  const cardNumber =
    cardNumberElement.value.trim();


  const appointmentTime =
    appointmentTimeElement.value;


  // =========================================
  // VALIDATION
  // =========================================

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

  button.innerHTML =
    "Po ruhet...";


  message.innerHTML = "";


  const date =
    formatDate(
      selectedDate
    );


  try {

    console.log(
      "Po kontrollohet ora:",
      date,
      appointmentTime
    );


    // =========================================
    // CHECK EXISTING
    // =========================================

    const {
      data: existing,
      error: checkError
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "appointment_date",
          date
        )
        .eq(
          "appointment_time",
          appointmentTime
        );


    if (checkError) {

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

          Ora
          <strong>
            ${escapeHtml(
              appointmentTime
            )}
          </strong>
          është e zënë.

        </div>

      `;

      return;
    }


    // =========================================
    // REUSE CANCELLED APPOINTMENT
    // =========================================

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
          .eq(
            "id",
            cancelled.id
          );


      if (error) {

        throw error;

      }


    } else {

      // =======================================
      // INSERT NEW APPOINTMENT
      // =======================================

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

          return;
        }


        throw error;
      }
    }


    // =========================================
    // SUCCESS
    // =========================================

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

    button.innerHTML = `
      <span>＋</span>
      Shto vizitën
    `;
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
// DELETE APPOINTMENT
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
      "Gabim gjatë fshirjes: " +
      error.message
    );
  }
}


// ======================================================
// REALTIME
// ======================================================

function startRealtime() {

  // Nëse ekziston tashmë, mos krijo tjetër

  if (realtimeChannel) {

    console.log(
      "Realtime është tashmë aktiv."
    );

    return;
  }


  console.log(
    "Po aktivizohet realtime..."
  );


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
            "REALTIME:",
            payload
          );


          // Nëse ndryshimi është në
          // tabelën appointments,
          // rifresko orarin

          loadAppointments();

        }
      )
      .subscribe(
        status => {

          console.log(
            "REALTIME STATUS:",
            status
          );


          if (
            status ===
            "SUBSCRIBED"
          ) {

            console.log(
              "Realtime u aktivizua me sukses."
            );

          }


          if (
            status ===
            "CHANNEL_ERROR"
          ) {

            console.error(
              "Realtime CHANNEL ERROR"
            );

          }


          if (
            status ===
            "TIMED_OUT"
          ) {

            console.error(
              "Realtime TIMED OUT"
            );

          }
        }
      );
}


// ======================================================
// AUTH STATE CHANGE
// ======================================================

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    console.log(
      "Auth event:",
      event
    );


    // =========================================
    // SIGNED OUT
    // =========================================

    if (
      event ===
      "SIGNED_OUT"
    ) {

      applicationStarted = false;

      await stopRealtime();

      showLogin();

      return;
    }


    // =========================================
    // SIGNED IN
    // =========================================

    if (
      event ===
      "SIGNED_IN"
    ) {

      // Mos e hap përsëri nëse
      // checkSession() e ka hapur

      if (
        !applicationStarted &&
        session
      ) {

        await startApplication();

      }

      return;
    }


    // =========================================
    // INITIAL SESSION
    // =========================================

    if (
      event ===
      "INITIAL_SESSION"
    ) {

      // Nuk bëjmë showApp këtu.
      // checkSession() merret me të.

      return;
    }

  }
);


// ======================================================
// WINDOW LOAD
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
