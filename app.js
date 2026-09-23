const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

// Mos ndrysho rreshtin më sipër.
// Vendos aty publishable key që ke pasur në app.js të vjetër.

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// CONFIG
// ======================================================

const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_MINUTES = 15;

let selectedDate = new Date();
let currentUser = null;
let realtimeChannel = null;

window.currentAppointments = [];


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await checkUser();
  }
);


// ======================================================
// AUTH
// ======================================================

async function checkUser() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();

  if (session) {

    currentUser =
      session.user;

    showApp();

  } else {

    showLogin();

  }
}


// ======================================================
// LOGIN
// ======================================================

function showLogin() {

  document.body.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <div class="login-logo">
          GVM
        </div>

        <h1>
          AMBULATORI GVM
        </h1>

        <p class="login-subtitle">
          Sistemi i menaxhimit të vizitave
        </p>

        <form id="loginForm">

          <div class="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              id="loginEmail"
              autocomplete="email"
              required
            >

          </div>


          <div class="form-group">

            <label>
              Fjalëkalimi
            </label>

            <input
              type="password"
              id="loginPassword"
              autocomplete="current-password"
              required
            >

          </div>


          <button
            type="submit"
            class="primary-button login-button"
          >
            Hyr në sistem
          </button>


          <div
            id="loginMessage"
          ></div>

        </form>

      </div>

    </div>

  `;


  document
    .getElementById("loginForm")
    .addEventListener(
      "submit",
      login
    );
}


// ======================================================
// LOGIN FUNCTION
// ======================================================

async function login(event) {

  event.preventDefault();

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
    document
      .getElementById("loginMessage");

  message.innerHTML = "";


  const {
    error
  } =
    await supabaseClient.auth
      .signInWithPassword({
        email,
        password
      });


  if (error) {

    message.innerHTML = `
      <div class="error-message">
        Email ose fjalëkalim i gabuar.
      </div>
    `;

    return;
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();

  currentUser = user;

  showApp();
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  await supabaseClient.auth.signOut();

  currentUser = null;

  if (realtimeChannel) {

    await supabaseClient
      .removeChannel(
        realtimeChannel
      );

    realtimeChannel = null;
  }

  showLogin();
}


// ======================================================
// MAIN APP
// ======================================================

function showApp() {

  document.body.innerHTML = `

    <div class="app-container">

      <!-- HEADER -->

      <header class="app-header">

        <div class="header-left">

          <div class="brand-icon">
            G
          </div>

          <div>

            <div class="app-title">
              AMBULATORI GVM
            </div>

            <div class="app-subtitle">
              Menaxhimi i vizitave
            </div>

          </div>

        </div>


        <button
          class="logout-button"
          onclick="logout()"
        >
          Dil
        </button>

      </header>


      <!-- MAIN -->

      <main class="main-content">


        <!-- DATE -->

        <section class="date-navigation">

          <button
            class="date-arrow"
            onclick="changeDate(-1)"
          >
            ‹
          </button>


          <div class="date-center">

            <div
              id="currentDate"
              class="current-date"
            ></div>

            <div class="date-label">
              Orari i vizitave
            </div>

          </div>


          <button
            class="date-arrow"
            onclick="changeDate(1)"
          >
            ›
          </button>

        </section>


        <!-- NEW APPOINTMENT -->

        <section
          class="new-appointment-card"
        >

          <div class="section-title">

            <div class="section-icon">
              +
            </div>

            <div>

              <h2>
                Regjistro vizitë
              </h2>

              <p>
                Shto një pacient në orar
              </p>

            </div>

          </div>


          <form
            id="appointmentForm"
            class="appointment-form"
          >

            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                type="text"
                id="firstName"
                placeholder="Emri"
                required
              >

            </div>


            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                type="text"
                id="lastName"
                placeholder="Mbiemri"
                required
              >

            </div>


            <div class="form-group">

              <label>
                Nr. kartelës
              </label>

              <input
                type="text"
                id="cardNumber"
                placeholder="Nr. kartelës"
                required
              >

            </div>


            <div class="form-group">

              <label>
                Ora
              </label>

              <select
                id="appointmentTime"
                required
              ></select>

            </div>


            <div class="form-action">

              <button
                type="submit"
                class="add-button"
              >
                <span>+</span>
                Shto vizitën
              </button>

            </div>

          </form>


          <div
            id="appointmentMessage"
          ></div>

        </section>


        <!-- SCHEDULE -->

        <section
          class="schedule-card"
        >

          <div class="schedule-header">

            <div>

              <h2>
                Orari i vizitave
              </h2>

              <p>
                08:00 – 18:00 · Interval 15 minuta
              </p>

            </div>


            <button
              class="today-button"
              onclick="goToday()"
            >
              Sot
            </button>

          </div>


          <!-- TABLE HEADER -->

          <div class="schedule-table-header">

            <div>
              ORA
            </div>

            <div>
              PACIENTI
            </div>

            <div>
              STATUSI
            </div>

            <div>
              VEPRIME
            </div>

          </div>


          <div
            id="appointmentsContainer"
            class="appointments-container"
          ></div>

        </section>

      </main>

    </div>


    <!-- ==================================================
         EDIT MODAL
         ================================================== -->

    <div
      id="editModal"
      class="edit-modal"
    >

      <div
        class="edit-overlay"
        onclick="closeEditModal()"
      ></div>


      <div class="edit-modal-card">


        <div class="edit-modal-header">

          <div>

            <div class="modal-icon">
              ✎
            </div>

            <div>

              <h2>
                Ndrysho vizitën
              </h2>

              <p>
                Modifiko të dhënat e pacientit
              </p>

            </div>

          </div>


          <button
            class="modal-close"
            onclick="closeEditModal()"
          >
            ×
          </button>

        </div>


        <div class="edit-modal-body">

          <input
            type="hidden"
            id="editAppointmentId"
          >


          <div class="edit-grid">

            <div class="form-group">

              <label>
                Emri
              </label>

              <input
                type="text"
                id="editFirstName"
              >

            </div>


            <div class="form-group">

              <label>
                Mbiemri
              </label>

              <input
                type="text"
                id="editLastName"
              >

            </div>


            <div class="form-group">

              <label>
                Ora
              </label>

              <select
                id="editTime"
              ></select>

            </div>


            <div class="form-group">

              <label>
                Statusi
              </label>

              <select
                id="editStatus"
              >

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


          <div
            id="editMessage"
          ></div>

        </div>


        <div class="edit-modal-footer">

          <button
            class="cancel-modal-button"
            onclick="closeEditModal()"
          >
            Mbyll
          </button>


          <button
            class="save-modal-button"
            onclick="saveEditedAppointment()"
          >
            Ruaj ndryshimet
          </button>

        </div>

      </div>

    </div>

  `;


  document
    .getElementById(
      "appointmentForm"
    )
    .addEventListener(
      "submit",
      addAppointment
    );


  renderDate();

  populateTimeSelect();

  loadAppointments();

  startRealtime();
}


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


function formatDateDisplay(date) {

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


function renderDate() {

  const element =
    document.getElementById(
      "currentDate"
    );

  if (!element) {
    return;
  }

  element.textContent =
    formatDateDisplay(
      selectedDate
    );
}


function changeDate(days) {

  selectedDate.setDate(
    selectedDate.getDate() + days
  );

  renderDate();

  loadAppointments();
}


function goToday() {

  selectedDate =
    new Date();

  renderDate();

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
      minute += SLOT_MINUTES
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
// POPULATE TIME SELECT
// ======================================================

function populateTimeSelect() {

  const select =
    document.getElementById(
      "appointmentTime"
    );

  if (!select) {
    return;
  }

  select.innerHTML = "";

  getTimeSlots()
    .forEach(time => {

      const option =
        document.createElement(
          "option"
        );

      option.value = time;
      option.textContent = time;

      select.appendChild(
        option
      );

    });
}


// ======================================================
// LOAD
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

    console.error(error);

    const container =
      document.getElementById(
        "appointmentsContainer"
      );

    if (container) {

      container.innerHTML = `
        <div class="system-error">
          Nuk u ngarkuan vizitat.
        </div>
      `;

    }

    return;
  }


  window.currentAppointments =
    data || [];


  renderAppointments(
    window.currentAppointments
  );


  updateAvailableTimes(
    window.currentAppointments
  );
}


// ======================================================
// AVAILABLE TIMES
// ======================================================

function updateAvailableTimes(
  appointments
) {

  const select =
    document.getElementById(
      "appointmentTime"
    );

  if (!select) {
    return;
  }


  const occupied =
    appointments
      .filter(
        appointment =>
          appointment.status !==
          "cancelled"
      )
      .map(
        appointment =>
          appointment
            .appointment_time
            ?.slice(0, 5)
      );


  Array.from(
    select.options
  ).forEach(option => {

    option.disabled =
      occupied.includes(
        option.value
      );

  });
}


// ======================================================
// RENDER SCHEDULE
// ======================================================

function renderAppointments(
  appointments
) {

  const container =
    document.getElementById(
      "appointmentsContainer"
    );

  if (!container) {
    return;
  }


  container.innerHTML = "";


  getTimeSlots()
    .forEach(time => {

      const appointment =
        appointments.find(
          item =>
            item
              .appointment_time
              ?.slice(0, 5) ===
            time
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        appointment
          ? "schedule-row occupied"
          : "schedule-row free";


      // ================================================
      // FREE SLOT
      // ================================================

      if (!appointment) {

        row.innerHTML = `

          <div class="time-cell">
            ${time}
          </div>

          <div class="patient-cell empty-cell">
            <span class="empty-dot"></span>
            <span>Orar i lirë</span>
          </div>

          <div class="status-cell">
            <span class="status-badge free">
              E lirë
            </span>
          </div>

          <div class="actions-cell">
            <span class="no-actions">
              —
            </span>
          </div>

        `;

      }


      // ================================================
      // OCCUPIED
      // ================================================

      else {

        const status =
          appointment.status ||
          "planned";


        const statusText =
          getStatusText(
            status
          );


        const statusClass =
          getStatusClass(
            status
          );


        const patientName =
          `${appointment.first_name || ""} ${appointment.last_name || ""}`
            .trim();


        row.innerHTML = `

          <div class="time-cell">
            ${time}
          </div>


          <div class="patient-cell">

            <div class="patient-avatar">
              ${getInitials(
                appointment.first_name,
                appointment.last_name
              )}
            </div>

            <div class="patient-info">

              <div class="patient-name">
                ${escapeHtml(
                  patientName
                )}
              </div>

              <div class="patient-label">
                Pacient
              </div>

            </div>

          </div>


          <div class="status-cell">

            <span
              class="
                status-badge
                ${statusClass}
              "
            >
              ${statusText}
            </span>

          </div>


          <div class="actions-cell">

            <button
              class="action-button edit"
              onclick="openEditModal('${appointment.id}')"
            >
              ✎
              <span>Ndrysho</span>
            </button>


            ${
              status !== "arrived" &&
              status !== "finished" &&
              status !== "cancelled"
                ? `
                  <button
                    class="action-button arrived"
                    onclick="
                      changeStatus(
                        '${appointment.id}',
                        'arrived'
                      )
                    "
                  >
                    ✓
                    <span>Erdhi</span>
                  </button>
                `
                : ""
            }


            ${
              status === "arrived"
                ? `
                  <button
                    class="action-button finished"
                    onclick="
                      changeStatus(
                        '${appointment.id}',
                        'finished'
                      )
                    "
                  >
                    ✓
                    <span>Përfundoi</span>
                  </button>
                `
                : ""
            }


            ${
              status !== "finished" &&
              status !== "cancelled"
                ? `
                  <button
                    class="action-button cancel"
                    onclick="
                      changeStatus(
                        '${appointment.id}',
                        'cancelled'
                      )
                    "
                  >
                    ×
                    <span>Anullo</span>
                  </button>
                `
                : ""
            }


            <button
              class="action-button delete"
              onclick="
                deleteAppointment(
                  '${appointment.id}'
                )
              "
            >
              🗑
              <span>Fshi</span>
            </button>

          </div>

        `;
      }


      container.appendChild(row);

    });
}


// ======================================================
// STATUS
// ======================================================

function getStatusText(status) {

  const statuses = {

    planned:
      "Në pritje",

    arrived:
      "Erdhi",

    finished:
      "Përfundoi",

    cancelled:
      "Anulluar"

  };

  return (
    statuses[status] ||
    "Në pritje"
  );
}


function getStatusClass(status) {

  return (
    "status-" +
    (
      status ||
      "planned"
    )
  );
}


// ======================================================
// INITIALS
// ======================================================

function getInitials(
  firstName,
  lastName
) {

  const first =
    firstName
      ? firstName
          .trim()
          .charAt(0)
          .toUpperCase()
      : "";

  const last =
    lastName
      ? lastName
          .trim()
          .charAt(0)
          .toUpperCase()
      : "";

  return (
    first + last
  ) || "P";
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
        status
      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    alert(
      "Gabim gjatë ndryshimit të statusit."
    );

    return;
  }


  await loadAppointments();
}


// ======================================================
// ADD APPOINTMENT
// ======================================================

async function addAppointment(
  event
) {

  event.preventDefault();


  const firstName =
    document
      .getElementById(
        "firstName"
      )
      .value
      .trim();


  const lastName =
    document
      .getElementById(
        "lastName"
      )
      .value
      .trim();


  const cardNumber =
    document
      .getElementById(
        "cardNumber"
      )
      .value
      .trim();


  const appointmentTime =
    document
      .getElementById(
        "appointmentTime"
      )
      .value;


  const message =
    document
      .getElementById(
        "appointmentMessage"
      );


  message.innerHTML = "";


  if (
    !firstName ||
    !lastName ||
    !cardNumber ||
    !appointmentTime
  ) {

    message.innerHTML = `
      <div class="error-message">
        Plotëso të gjitha fushat.
      </div>
    `;

    return;
  }


  const appointmentDate =
    formatDate(
      selectedDate
    );


  const {
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("appointments")
      .select("id")
      .eq(
        "appointment_date",
        appointmentDate
      )
      .eq(
        "appointment_time",
        appointmentTime
      )
      .neq(
        "status",
        "cancelled"
      )
      .limit(1);


  if (checkError) {

    console.error(
      checkError
    );

    message.innerHTML = `
      <div class="error-message">
        Nuk u kontrollua ora.
      </div>
    `;

    return;
  }


  if (
    existing &&
    existing.length > 0
  ) {

    message.innerHTML = `
      <div class="error-message">
        Kjo orë është e zënë.
      </div>
    `;

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
          cardNumber,

        appointment_date:
          appointmentDate,

        appointment_time:
          appointmentTime,

        status:
          "planned"

      });


  if (error) {

    console.error(error);

    message.innerHTML = `
      <div class="error-message">
        Gabim gjatë regjistrimit të vizitës.
      </div>
    `;

    return;
  }


  document
    .getElementById(
      "appointmentForm"
    )
    .reset();


  message.innerHTML = `
    <div class="success-message">
      ✓ Vizita u regjistrua me sukses.
    </div>
  `;


  await loadAppointments();
}


// ======================================================
// OPEN EDIT
// ======================================================

function openEditModal(id) {

  const appointment =
    window.currentAppointments
      .find(
        item =>
          String(item.id) ===
          String(id)
      );


  if (!appointment) {

    alert(
      "Vizita nuk u gjet."
    );

    return;
  }


  document
    .getElementById(
      "editAppointmentId"
    )
    .value =
      appointment.id;


  document
    .getElementById(
      "editFirstName"
    )
    .value =
      appointment.first_name ||
      "";


  document
    .getElementById(
      "editLastName"
    )
    .value =
      appointment.last_name ||
      "";


  document
    .getElementById(
      "editStatus"
    )
    .value =
      appointment.status ||
      "planned";


  const currentTime =
    appointment
      .appointment_time
      ?.slice(0, 5);


  const timeSelect =
    document.getElementById(
      "editTime"
    );


  timeSelect.innerHTML = "";


  const occupied =
    window.currentAppointments
      .filter(
        item =>
          String(item.id) !==
            String(id) &&
          item.status !==
            "cancelled"
      )
      .map(
        item =>
          item
            .appointment_time
            ?.slice(0, 5)
      );


  getTimeSlots()
    .forEach(time => {

      const option =
        document.createElement(
          "option"
        );


      option.value = time;

      option.textContent =
        time;


      if (
        occupied.includes(time)
      ) {

        option.disabled = true;

      }


      if (
        time === currentTime
      ) {

        option.selected = true;

        option.disabled = false;

      }


      timeSelect.appendChild(
        option
      );

    });


  document
    .getElementById(
      "editMessage"
    )
    .innerHTML = "";


  document
    .getElementById(
      "editModal"
    )
    .classList.add("open");


  document.body.classList.add(
    "modal-open"
  );
}


// ======================================================
// CLOSE EDIT
// ======================================================

function closeEditModal() {

  const modal =
    document.getElementById(
      "editModal"
    );


  if (modal) {

    modal.classList.remove(
      "open"
    );

  }


  document.body.classList.remove(
    "modal-open"
  );
}


// ======================================================
// SAVE EDIT
// ======================================================

async function saveEditedAppointment() {

  const id =
    document
      .getElementById(
        "editAppointmentId"
      )
      .value;


  const firstName =
    document
      .getElementById(
        "editFirstName"
      )
      .value
      .trim();


  const lastName =
    document
      .getElementById(
        "editLastName"
      )
      .value
      .trim();


  const appointmentTime =
    document
      .getElementById(
        "editTime"
      )
      .value;


  const status =
    document
      .getElementById(
        "editStatus"
      )
      .value;


  const message =
    document
      .getElementById(
        "editMessage"
      );


  message.innerHTML = "";


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.innerHTML = `
      <div class="error-message">
        Plotëso të gjitha fushat.
      </div>
    `;

    return;
  }


  const appointmentDate =
    formatDate(
      selectedDate
    );


  const {
    data: conflicts,
    error: checkError
  } =
    await supabaseClient
      .from("appointments")
      .select("id")
      .eq(
        "appointment_date",
        appointmentDate
      )
      .eq(
        "appointment_time",
        appointmentTime
      )
      .neq(
        "id",
        id
      )
      .neq(
        "status",
        "cancelled"
      )
      .limit(1);


  if (checkError) {

    console.error(
      checkError
    );

    message.innerHTML = `
      <div class="error-message">
        Nuk u kontrollua ora.
      </div>
    `;

    return;
  }


  if (
    conflicts &&
    conflicts.length > 0
  ) {

    message.innerHTML = `
      <div class="error-message">
        Ora e zgjedhur është e zënë.
      </div>
    `;

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
          appointmentTime,

        status:
          status

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    message.innerHTML = `
      <div class="error-message">
        Gabim gjatë ruajtjes së ndryshimeve.
      </div>
    `;

    return;
  }


  closeEditModal();

  await loadAppointments();
}


// ======================================================
// DELETE
// ======================================================

async function deleteAppointment(id) {

  const appointment =
    window.currentAppointments
      .find(
        item =>
          String(item.id) ===
          String(id)
      );


  if (!appointment) {
    return;
  }


  const patientName =
    `${appointment.first_name || ""} ${appointment.last_name || ""}`
      .trim();


  const confirmed =
    confirm(
      `A dëshiron ta fshish vizitën e ${patientName}?`
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

    console.error(error);

    alert(
      "Gabim gjatë fshirjes së vizitës."
    );

    return;
  }


  await loadAppointments();
}


// ======================================================
// REALTIME
// ======================================================

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


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

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


// ======================================================
// ESCAPE CLOSE MODAL
// ======================================================

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
