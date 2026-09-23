// ======================================================
// AMBULATORI GVM - APP.JS
// ======================================================

// ------------------------------------------------------
// SUPABASE
// ------------------------------------------------------

const SUPABASE_URL =
  "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


// ------------------------------------------------------
// KONFIGURIMI
// ------------------------------------------------------

const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_MINUTES = 15;

let selectedDate = getTodayString();
let currentAppointments = [];
let editingAppointmentId = null;
let realtimeChannel = null;


// ------------------------------------------------------
// NISJA
// ------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    showLogin();
  }
);


// ------------------------------------------------------
// DATA
// ------------------------------------------------------

function getTodayString() {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDateAlbanian(dateString) {

  const date =
    new Date(
      dateString + "T00:00:00"
    );

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


function changeDate(days) {

  const date =
    new Date(
      selectedDate + "T00:00:00"
    );

  date.setDate(
    date.getDate() + days
  );

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  selectedDate =
    `${year}-${month}-${day}`;

  updateDateDisplay();

  loadAppointments();
}


function goToday() {

  selectedDate =
    getTodayString();

  updateDateDisplay();

  loadAppointments();
}


function updateDateDisplay() {

  const element =
    document.getElementById(
      "selected-date"
    );

  if (element) {

    element.textContent =
      formatDateAlbanian(
        selectedDate
      );
  }
}


// ------------------------------------------------------
// ORARET
// ------------------------------------------------------

function getTimeSlots() {

  const slots = [];

  for (
    let minutes = START_HOUR * 60;
    minutes <= END_HOUR * 60;
    minutes += SLOT_MINUTES
  ) {

    const hour =
      Math.floor(
        minutes / 60
      );

    const minute =
      minutes % 60;

    const time =
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0");

    slots.push(time);
  }

  return slots;
}


// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------

function showLogin() {

  document.body.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <div class="login-logo">
          <div class="login-logo-icon">
            G
          </div>
        </div>

        <h1>
          AMBULATORI GVM
        </h1>

        <p class="login-subtitle">
          Sistemi i menaxhimit të vizitave
        </p>

        <form id="login-form">

          <div class="form-group">

            <label>
              Përdoruesi
            </label>

            <input
              type="text"
              id="login-email"
              placeholder="Shkruani përdoruesin"
              autocomplete="username"
              required
            />

          </div>


          <div class="form-group">

            <label>
              Fjalëkalimi
            </label>

            <input
              type="password"
              id="login-password"
              placeholder="Shkruani fjalëkalimin"
              autocomplete="current-password"
              required
            />

          </div>


          <button
            type="submit"
            class="login-button"
          >
            Hyr në sistem
          </button>


          <div
            id="login-message"
            class="login-message"
          ></div>

        </form>

      </div>

    </div>
  `;


  document
    .getElementById("login-form")
    .addEventListener(
      "submit",
      handleLogin
    );
}


// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------

async function handleLogin(event) {

  event.preventDefault();


  const email =
    document
      .getElementById(
        "login-email"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "login-password"
      )
      .value;


  const message =
    document.getElementById(
      "login-message"
    );


  message.textContent =
    "Duke u lidhur...";

  message.className =
    "login-message";


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

    console.error(
      "LOGIN ERROR:",
      error
    );

    message.textContent =
      "Përdoruesi ose fjalëkalimi është i gabuar.";

    message.className =
      "login-message error";

    return;
  }


  console.log(
    "Login u krye me sukses:",
    data.user
  );


  showApp();
}


// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------

async function logout() {

  if (realtimeChannel) {

    await supabaseClient
      .removeChannel(
        realtimeChannel
      );

    realtimeChannel = null;
  }


  await supabaseClient.auth
    .signOut();


  showLogin();
}


// ------------------------------------------------------
// APLIKACIONI
// ------------------------------------------------------

function showApp() {

  document.body.innerHTML = `

    <div class="app">

      <!-- HEADER -->

      <header class="top-header">

        <div class="brand">

          <div class="brand-icon">
            G
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


        <div class="header-right">

          <div class="system-status">
            <span class="status-dot"></span>
            Sistemi aktiv
          </div>

          <button
            class="logout-button"
            onclick="logout()"
          >
            Dil
          </button>

        </div>

      </header>


      <!-- MAIN -->

      <main class="main-container">


        <!-- DATA -->

        <section class="date-navigation">

          <button
            class="date-arrow"
            onclick="changeDate(-1)"
            title="Dita e mëparshme"
          >
            ‹
          </button>


          <div class="date-center">

            <div
              id="selected-date"
              class="selected-date"
            >
              ${formatDateAlbanian(
                selectedDate
              )}
            </div>


            <button
              class="today-button"
              onclick="goToday()"
            >
              Sot
            </button>

          </div>


          <button
            class="date-arrow"
            onclick="changeDate(1)"
            title="Dita tjetër"
          >
            ›
          </button>

        </section>


        <!-- REZERVIM I RI -->

        <section class="new-appointment-card">

          <div class="section-heading">

            <div>

              <h2>
                Rezervim i ri
              </h2>

              <p>
                Shto një pacient në orarin e vizitave
              </p>

            </div>

          </div>


          <form
            id="appointment-form"
            class="appointment-form"
          >


            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                id="first-name"
                type="text"
                placeholder="Emri"
                required
              />

            </div>


            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                id="last-name"
                type="text"
                placeholder="Mbiemri"
                required
              />

            </div>


            <div class="form-group">

              <label>
                Nr. i kartelës
              </label>

              <input
                id="card-number"
                type="text"
                placeholder="Nr. kartelës"
              />

            </div>


            <div class="form-group">

              <label>
                Ora
              </label>

              <select
                id="appointment-time"
                required
              >

                <option value="">
                  Zgjidh orën
                </option>

                ${getTimeSlots()
                  .map(
                    time => `
                      <option value="${time}">
                        ${time}
                      </option>
                    `
                  )
                  .join("")}

              </select>

            </div>


            <button
              type="submit"
              class="primary-button"
            >
              + Shto vizitën
            </button>


          </form>


          <div
            id="form-message"
            class="form-message"
          ></div>

        </section>


        <!-- ORARI -->

        <section class="schedule-card">


          <div class="schedule-header">

            <div>

              <h2>
                Orari i vizitave
              </h2>

              <p>
                08:00 – 18:00
              </p>

            </div>


            <div
              id="appointment-count"
              class="appointment-count"
            >
              0 vizita
            </div>

          </div>


          <div class="schedule-table-wrapper">

            <table class="schedule-table">

              <thead>

                <tr>

                  <th class="time-column">
                    ORA
                  </th>

                  <th>
                    PACIENTI
                  </th>

                  <th class="status-column">
                    STATUSI
                  </th>

                  <th class="actions-column">
                    VEPRIME
                  </th>

                </tr>

              </thead>


              <tbody
                id="schedule-body"
              ></tbody>

            </table>

          </div>

        </section>


      </main>


      <!-- MODAL EDIT -->

      <div
        id="edit-modal"
        class="modal-overlay"
      >

        <div class="modal">


          <div class="modal-header">

            <div>

              <h2>
                Ndrysho vizitën
              </h2>

              <p>
                Përditëso të dhënat e rezervimit
              </p>

            </div>


            <button
              class="modal-close"
              onclick="closeEditModal()"
            >
              ×
            </button>

          </div>


          <div class="modal-body">


            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                id="edit-first-name"
                type="text"
              />

            </div>


            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                id="edit-last-name"
                type="text"
              />

            </div>


            <div class="form-group">

              <label>
                Ora
              </label>

              <select
                id="edit-time"
              >

                ${getTimeSlots()
                  .map(
                    time => `
                      <option value="${time}">
                        ${time}
                      </option>
                    `
                  )
                  .join("")}

              </select>

            </div>


            <div class="form-group">

              <label>
                Statusi
              </label>

              <select id="edit-status">

                <option value="planned">
                  Në pritje
                </option>

                <option value="arrived">
                  Erdhi
                </option>

                <option value="finished">
                  Përfundoi
                </option>

                <option value="cancelled">
                  Anulluar
                </option>

              </select>

            </div>


          </div>


          <div class="modal-footer">

            <button
              class="secondary-button"
              onclick="closeEditModal()"
            >
              Anulo
            </button>


            <button
              class="primary-button"
              onclick="saveEditedAppointment()"
            >
              Ruaj ndryshimet
            </button>

          </div>


          <div
            id="edit-message"
            class="form-message"
          ></div>


        </div>

      </div>

    </div>
  `;


  document
    .getElementById(
      "appointment-form"
    )
    .addEventListener(
      "submit",
      addAppointment
    );


  updateDateDisplay();

  loadAppointments();

  startRealtime();
}


// ------------------------------------------------------
// LOAD APPOINTMENTS
// ------------------------------------------------------

async function loadAppointments() {

  const body =
    document.getElementById(
      "schedule-body"
    );


  if (!body) {
    return;
  }


  body.innerHTML = `

    <tr>

      <td
        colspan="4"
        class="loading-cell"
      >
        Duke ngarkuar orarin...
      </td>

    </tr>

  `;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "appointment_date",
        selectedDate
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


    body.innerHTML = `

      <tr>

        <td
          colspan="4"
          class="error-cell"
        >
          Nuk u arrit të ngarkohet orari.
          <br>
          Kontrolloni lidhjen me Supabase.
        </td>

      </tr>

    `;

    return;
  }


  currentAppointments =
    data || [];


  renderAppointments();
}


// ------------------------------------------------------
// RENDER
// ------------------------------------------------------

function renderAppointments() {

  const body =
    document.getElementById(
      "schedule-body"
    );


  if (!body) {
    return;
  }


  body.innerHTML = "";


  const slots =
    getTimeSlots();


  const countElement =
    document.getElementById(
      "appointment-count"
    );


  if (countElement) {

    const total =
      currentAppointments.length;


    countElement.textContent =
      total === 1
        ? "1 vizitë"
        : `${total} vizita`;
  }


  slots.forEach(
    time => {

      const appointment =
        currentAppointments.find(
          item =>
            item.appointment_time ===
              time &&
            item.status !==
              "cancelled"
        );


      const row =
        document.createElement(
          "tr"
        );


      if (appointment) {

        row.className =
          "schedule-row occupied";


        row.innerHTML = `

          <td class="time-cell">

            <span class="time-value">
              ${time}
            </span>

          </td>


          <td class="patient-cell">

            <div class="patient-wrapper">


              <div class="patient-avatar">

                ${getInitials(
                  appointment.first_name,
                  appointment.last_name
                )}

              </div>


              <div class="patient-info">

                <div class="patient-name">

                  ${escapeHtml(
                    appointment.first_name ||
                    ""
                  )}

                  ${escapeHtml(
                    appointment.last_name ||
                    ""
                  )}

                </div>


                <div class="patient-label">
                  Pacient
                </div>

              </div>


            </div>

          </td>


          <td class="status-cell">

            ${getStatusBadge(
              appointment.status
            )}

          </td>


          <td class="actions-cell">

            <div class="action-buttons">


              <button
                class="action-button edit"
                onclick="openEditModal('${appointment.id}')"
              >
                Ndrysho
              </button>


              ${
                appointment.status !==
                "arrived"
                  ? `
                    <button
                      class="action-button arrived"
                      onclick="changeStatus('${appointment.id}', 'arrived')"
                    >
                      Erdhi
                    </button>
                  `
                  : ""
              }


              ${
                appointment.status !==
                "finished"
                  ? `
                    <button
                      class="action-button finished"
                      onclick="changeStatus('${appointment.id}', 'finished')"
                    >
                      Përfundoi
                    </button>
                  `
                  : ""
              }


              ${
                appointment.status !==
                "cancelled"
                  ? `
                    <button
                      class="action-button cancel"
                      onclick="changeStatus('${appointment.id}', 'cancelled')"
                    >
                      Anullo
                    </button>
                  `
                  : ""
              }


              <button
                class="action-button delete"
                onclick="deleteAppointment('${appointment.id}')"
              >
                Fshi
              </button>


            </div>

          </td>

        `;

      } else {

        row.className =
          "schedule-row free";


        row.innerHTML = `

          <td class="time-cell">

            <span class="time-value">
              ${time}
            </span>

          </td>


          <td
            class="patient-cell empty-cell"
          >

            <div class="empty-slot">

              <span
                class="empty-dot"
              ></span>

              <span>
                Orari i lirë
              </span>

            </div>

          </td>


          <td class="status-cell">

            <span
              class="status-badge free"
            >
              E lirë
            </span>

          </td>


          <td class="actions-cell">

            <span class="no-action">
              —
            </span>

          </td>

        `;
      }


      body.appendChild(row);

    }
  );
}


// ------------------------------------------------------
// STATUS BADGE
// ------------------------------------------------------

function getStatusBadge(status) {

  const statuses = {

    planned: {
      label: "Në pritje",
      className: "status-planned"
    },

    arrived: {
      label: "Erdhi",
      className: "status-arrived"
    },

    finished: {
      label: "Përfundoi",
      className: "status-finished"
    },

    cancelled: {
      label: "Anulluar",
      className: "status-cancelled"
    }

  };


  const info =
    statuses[status] ||
    statuses.planned;


  return `

    <span
      class="status-badge ${info.className}"
    >
      ${info.label}
    </span>

  `;
}


// ------------------------------------------------------
// NDRYSHO STATUS
// ------------------------------------------------------

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
        status: status
      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "STATUS ERROR:",
      error
    );


    alert(
      "Ndodhi një gabim gjatë ndryshimit të statusit."
    );

    return;
  }


  await loadAppointments();
}


// ------------------------------------------------------
// SHTO VIZITË
// ------------------------------------------------------

async function addAppointment(
  event
) {

  event.preventDefault();


  const firstName =
    document
      .getElementById(
        "first-name"
      )
      .value
      .trim();


  const lastName =
    document
      .getElementById(
        "last-name"
      )
      .value
      .trim();


  const cardNumber =
    document
      .getElementById(
        "card-number"
      )
      .value
      .trim();


  const appointmentTime =
    document
      .getElementById(
        "appointment-time"
      )
      .value;


  const message =
    document.getElementById(
      "form-message"
    );


  message.textContent = "";

  message.className =
    "form-message";


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotësoni emrin, mbiemrin dhe orën.";

    message.className =
      "form-message error";

    return;
  }


  const occupied =
    currentAppointments.some(
      appointment =>
        appointment.appointment_time ===
          appointmentTime &&
        appointment.status !==
          "cancelled"
    );


  if (occupied) {

    message.textContent =
      "Kjo orë është tashmë e rezervuar.";

    message.className =
      "form-message error";

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .insert({

        first_name:
          firstName,

        last_name:
          lastName,

        card_number:
          cardNumber || null,

        appointment_date:
          selectedDate,

        appointment_time:
          appointmentTime,

        status:
          "planned"

      });


  if (error) {

    console.error(
      "INSERT ERROR:",
      error
    );


    message.textContent =
      "Vizita nuk u shtua. Kontrolloni databazën.";

    message.className =
      "form-message error";

    return;
  }


  document
    .getElementById(
      "appointment-form"
    )
    .reset();


  message.textContent =
    "Vizita u shtua me sukses.";


  message.className =
    "form-message success";


  await loadAppointments();


  setTimeout(
    () => {

      message.textContent = "";

    },
    3000
  );
}


// ------------------------------------------------------
// EDIT
// ------------------------------------------------------

function openEditModal(id) {

  const appointment =
    currentAppointments.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!appointment) {
    return;
  }


  editingAppointmentId =
    appointment.id;


  document.getElementById(
    "edit-first-name"
  ).value =
    appointment.first_name || "";


  document.getElementById(
    "edit-last-name"
  ).value =
    appointment.last_name || "";


  document.getElementById(
    "edit-time"
  ).value =
    appointment.appointment_time;


  document.getElementById(
    "edit-status"
  ).value =
    appointment.status ||
    "planned";


  const message =
    document.getElementById(
      "edit-message"
    );


  message.textContent = "";

  message.className =
    "form-message";


  document
    .getElementById(
      "edit-modal"
    )
    .classList.add(
      "show"
    );
}


// ------------------------------------------------------
// MBYLL MODAL
// ------------------------------------------------------

function closeEditModal() {

  editingAppointmentId =
    null;


  const modal =
    document.getElementById(
      "edit-modal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );
  }
}


// ------------------------------------------------------
// RUAJ EDITIMIN
// ------------------------------------------------------

async function saveEditedAppointment() {

  if (!editingAppointmentId) {
    return;
  }


  const firstName =
    document
      .getElementById(
        "edit-first-name"
      )
      .value
      .trim();


  const lastName =
    document
      .getElementById(
        "edit-last-name"
      )
      .value
      .trim();


  const time =
    document
      .getElementById(
        "edit-time"
      )
      .value;


  const status =
    document
      .getElementById(
        "edit-status"
      )
      .value;


  const message =
    document.getElementById(
      "edit-message"
    );


  message.textContent = "";

  message.className =
    "form-message";


  if (
    !firstName ||
    !lastName
  ) {

    message.textContent =
      "Emri dhe mbiemri janë të detyrueshëm.";

    message.className =
      "form-message error";

    return;
  }


  const conflict =
    currentAppointments.some(
      appointment =>

        String(
          appointment.id
        ) !==
        String(
          editingAppointmentId
        ) &&

        appointment.appointment_time ===
          time &&

        appointment.status !==
          "cancelled"
    );


  if (conflict) {

    message.textContent =
      "Kjo orë është tashmë e rezervuar.";

    message.className =
      "form-message error";

    return;
  }


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

        appointment_time:
          time,

        status:
          status

      })
      .eq(
        "id",
        editingAppointmentId
      );


  if (error) {

    console.error(
      "UPDATE ERROR:",
      error
    );


    message.textContent =
      "Ndryshimet nuk u ruajtën.";

    message.className =
      "form-message error";

    return;
  }


  closeEditModal();


  await loadAppointments();
}


// ------------------------------------------------------
// FSHI
// ------------------------------------------------------

async function deleteAppointment(
  id
) {

  const appointment =
    currentAppointments.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!appointment) {
    return;
  }


  const fullName =
    `${appointment.first_name || ""} ${
      appointment.last_name || ""
    }`.trim();


  const confirmed =
    confirm(
      `A jeni i sigurt që dëshironi të fshini vizitën e ${fullName}?`
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
      "DELETE ERROR:",
      error
    );


    alert(
      "Vizita nuk u fshi."
    );

    return;
  }


  await loadAppointments();
}


// ------------------------------------------------------
// REALTIME
// ------------------------------------------------------

function startRealtime() {

  if (realtimeChannel) {
    return;
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
        () => {

          loadAppointments();

        }
      )
      .subscribe();
}


// ------------------------------------------------------
// INITIALS
// ------------------------------------------------------

function getInitials(
  firstName,
  lastName
) {

  const first =
    (firstName || "")
      .trim()
      .charAt(0)
      .toUpperCase();


  const last =
    (lastName || "")
      .trim()
      .charAt(0)
      .toUpperCase();


  return first + last;
}


// ------------------------------------------------------
// SIGURIA HTML
// ------------------------------------------------------

function escapeHtml(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


// ------------------------------------------------------
// ESCAPE
// ------------------------------------------------------

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeEditModal();

    }

  }
);


// ------------------------------------------------------
// MBYLL MODAL KUR KLIKOJMË JASHTË
// ------------------------------------------------------

document.addEventListener(
  "click",
  event => {

    const modal =
      document.getElementById(
        "edit-modal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeEditModal();

    }

  }
);
