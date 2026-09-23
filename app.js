const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
  "VENDOS_KETU_PUBLISHABLE_KEY_TEND";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ================================
// CONFIG
// ================================

const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_MINUTES = 15;

let selectedDate = new Date();
let currentUser = null;

window.currentAppointments = [];

// ================================
// TIME SLOTS
// ================================

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
      if (hour === END_HOUR && minute > 0) {
        continue;
      }

      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");

      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}

// ================================
// DATE
// ================================

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
  return date.toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// ================================
// INIT
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  await checkUser();
});

// ================================
// AUTH
// ================================

async function checkUser() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    currentUser = session.user;
    showApp();
  } else {
    showLogin();
  }
}

// ================================
// LOGIN
// ================================

function showLogin() {
  document.body.innerHTML = `
    <div class="login-page">
      <div class="login-card">

        <div class="login-logo">
          GVM
        </div>

        <h1>AMBULATORI GVM</h1>

        <p class="login-subtitle">
          Sistemi i menaxhimit të vizitave
        </p>

        <form id="loginForm">

          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              id="loginEmail"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label>Fjalëkalimi</label>
            <input
              type="password"
              id="loginPassword"
              required
              autocomplete="current-password"
            >
          </div>

          <button
            type="submit"
            class="primary-button login-button"
          >
            Hyr
          </button>

          <div id="loginMessage"></div>

        </form>

      </div>
    </div>
  `;

  document
    .getElementById("loginForm")
    .addEventListener("submit", login);
}

async function login(event) {
  event.preventDefault();

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const message =
    document.getElementById("loginMessage");

  message.innerHTML = "";

  const { error } =
    await supabaseClient.auth.signInWithPassword({
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

  currentUser = (
    await supabaseClient.auth.getUser()
  ).data.user;

  showApp();
}

// ================================
// APP
// ================================

function showApp() {
  document.body.innerHTML = `

    <div class="app-container">

      <header class="app-header">

        <div>
          <div class="app-title">
            AMBULATORI GVM
          </div>

          <div class="app-subtitle">
            Menaxhimi i vizitave
          </div>
        </div>

        <button
          class="logout-button"
          onclick="logout()"
        >
          Dil
        </button>

      </header>

      <main class="main-content">

        <section class="schedule-header">

          <button
            class="date-nav-button"
            onclick="changeDate(-1)"
          >
            ‹
          </button>

          <div class="date-display">
            <div id="currentDate"></div>
          </div>

          <button
            class="date-nav-button"
            onclick="changeDate(1)"
          >
            ›
          </button>

        </section>

        <section class="appointment-form-card">

          <h2>
            Regjistro vizitë
          </h2>

          <form id="appointmentForm">

            <div class="form-grid">

              <div class="form-group">
                <label>Emri</label>

                <input
                  type="text"
                  id="firstName"
                  required
                >
              </div>

              <div class="form-group">
                <label>Mbiemri</label>

                <input
                  type="text"
                  id="lastName"
                  required
                >
              </div>

              <div class="form-group">
                <label>Nr. kartelës</label>

                <input
                  type="text"
                  id="cardNumber"
                  required
                >
              </div>

              <div class="form-group">
                <label>Ora</label>

                <select
                  id="appointmentTime"
                  required
                ></select>
              </div>

            </div>

            <button
              type="submit"
              class="primary-button"
            >
              + Shto vizitën
            </button>

            <div id="appointmentMessage"></div>

          </form>

        </section>

        <section class="schedule-card">

          <div class="schedule-card-header">

            <div>
              <h2>Orari i vizitave</h2>

              <p>
                08:00 – 18:00
              </p>
            </div>

            <button
              class="today-button"
              onclick="goToday()"
            >
              Sot
            </button>

          </div>

          <div id="appointmentsContainer"></div>

        </section>

      </main>

    </div>

    <!-- ========================= -->
    <!-- EDIT MODAL -->
    <!-- ========================= -->

    <div
      id="editModal"
      class="edit-modal"
    >

      <div
        class="edit-modal-overlay"
        onclick="closeEditModal()"
      ></div>

      <div class="edit-modal-card">

        <div class="edit-modal-header">

          <div>
            <h2>Ndrysho vizitën</h2>

            <p>
              Modifiko të dhënat e vizitës
            </p>
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

          <div class="form-group">
            <label>Emri</label>

            <input
              type="text"
              id="editFirstName"
            >
          </div>

          <div class="form-group">
            <label>Mbiemri</label>

            <input
              type="text"
              id="editLastName"
            >
          </div>

          <div class="form-group">
            <label>Ora</label>

            <select
              id="editTime"
            ></select>
          </div>

          <div class="form-group">
            <label>Statusi</label>

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

          <div id="editMessage"></div>

        </div>

        <div class="edit-modal-footer">

          <button
            class="secondary-button"
            onclick="closeEditModal()"
          >
            Mbyll
          </button>

          <button
            class="primary-button"
            onclick="saveEditedAppointment()"
          >
            Ruaj ndryshimet
          </button>

        </div>

      </div>

    </div>
  `;

  document
    .getElementById("appointmentForm")
    .addEventListener(
      "submit",
      addAppointment
    );

  renderDate();

  populateTimeSelect();

  loadAppointments();

  startRealtime();
}

// ================================
// LOGOUT
// ================================

async function logout() {
  await supabaseClient.auth.signOut();

  currentUser = null;

  showLogin();
}

// ================================
// DATE NAVIGATION
// ================================

function changeDate(days) {
  selectedDate.setDate(
    selectedDate.getDate() + days
  );

  renderDate();

  loadAppointments();
}

function goToday() {
  selectedDate = new Date();

  renderDate();

  loadAppointments();
}

function renderDate() {
  const element =
    document.getElementById("currentDate");

  if (!element) {
    return;
  }

  element.textContent =
    formatDateDisplay(selectedDate);
}

// ================================
// TIME SELECT
// ================================

function populateTimeSelect() {
  const select =
    document.getElementById(
      "appointmentTime"
    );

  if (!select) {
    return;
  }

  select.innerHTML = "";

  getTimeSlots().forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;
    option.textContent = time;

    select.appendChild(option);

  });
}

// ================================
// LOAD APPOINTMENTS
// ================================

async function loadAppointments() {

  const date =
    formatDate(selectedDate);

  const {
    data,
    error
  } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("appointment_date", date)
    .order("appointment_time", {
      ascending: true
    });

  if (error) {

    console.error(error);

    const container =
      document.getElementById(
        "appointmentsContainer"
      );

    if (container) {
      container.innerHTML = `
        <div class="error-message">
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

// ================================
// UPDATE AVAILABLE TIMES
// ================================

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
      .filter(a =>
        a.status !== "cancelled"
      )
      .map(a =>
        a.appointment_time?.slice(0, 5)
      );

  Array.from(select.options).forEach(
    option => {

      option.disabled =
        occupied.includes(
          option.value
        );

    }
  );
}

// ================================
// RENDER APPOINTMENTS
// ================================

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

  const slots =
    getTimeSlots();

  container.innerHTML = "";

  slots.forEach(time => {

    const appointment =
      appointments.find(a => {

        const appointmentTime =
          a.appointment_time
            ?.slice(0, 5);

        return (
          appointmentTime === time
        );
      });

    const row =
      document.createElement("div");

    row.className =
      "schedule-row";

    if (!appointment) {

      row.innerHTML = `

        <div class="schedule-time">
          ${time}
        </div>

        <div class="schedule-empty">
          <span>Orar i lirë</span>
        </div>

      `;

    } else {

      const status =
        appointment.status ||
        "planned";

      const statusText =
        getStatusText(status);

      const statusClass =
        getStatusClass(status);

      row.innerHTML = `

        <div class="schedule-time">
          ${time}
        </div>

        <div class="schedule-patient">

          <div class="patient-name">
            ${escapeHtml(
              appointment.first_name || ""
            )}
            ${escapeHtml(
              appointment.last_name || ""
            )}
          </div>

          <div class="
            patient-status
            ${statusClass}
          ">
            ${statusText}
          </div>

        </div>

        <div class="schedule-actions">

          <button
            class="schedule-edit-button"
            onclick="openEditModal('${appointment.id}')"
          >
            ✏️ Ndrysho
          </button>

          <button
            class="status-button arrived"
            onclick="
              changeStatus(
                '${appointment.id}',
                'arrived'
              )
            "
          >
            Erdhi
          </button>

          <button
            class="status-button finished"
            onclick="
              changeStatus(
                '${appointment.id}',
                'finished'
              )
            "
          >
            Përfundoi
          </button>

          <button
            class="status-button cancelled"
            onclick="
              changeStatus(
                '${appointment.id}',
                'cancelled'
              )
            "
          >
            Anullo
          </button>

          <button
            class="schedule-delete-button"
            onclick="
              deleteAppointment(
                '${appointment.id}'
              )
            "
          >
            🗑️ Fshi
          </button>

        </div>

      `;
    }

    container.appendChild(row);

  });
}

// ================================
// STATUS
// ================================

function getStatusText(status) {

  const statuses = {

    planned: "Në pritje",

    arrived: "Erdhi",

    finished: "Përfundoi",

    cancelled: "Anulluar"

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

// ================================
// CHANGE STATUS
// ================================

async function changeStatus(
  id,
  status
) {

  const { error } =
    await supabaseClient
      .from("appointments")
      .update({
        status: status
      })
      .eq("id", id);

  if (error) {

    console.error(error);

    alert(
      "Gabim gjatë ndryshimit të statusit."
    );

    return;
  }

  await loadAppointments();
}

// ================================
// ADD APPOINTMENT
// ================================

async function addAppointment(
  event
) {

  event.preventDefault();

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
      .getElementById(
        "appointmentTime"
      )
      .value;

  const message =
    document.getElementById(
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
    formatDate(selectedDate);

  const {
    data: existing,
    error: checkError
  } = await supabaseClient
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

    console.error(checkError);

    message.innerHTML = `
      <div class="error-message">
        Nuk u kontrollua orari.
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

  const { error } =
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
        Gabim gjatë regjistrimit.
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
      Vizita u regjistrua me sukses.
    </div>
  `;

  await loadAppointments();
}

// ================================
// OPEN EDIT MODAL
// ================================

function openEditModal(id) {

  const appointment =
    window.currentAppointments.find(
      a => String(a.id) === String(id)
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
    .value = appointment.id;

  document
    .getElementById(
      "editFirstName"
    )
    .value =
      appointment.first_name || "";

  document
    .getElementById(
      "editLastName"
    )
    .value =
      appointment.last_name || "";

  document
    .getElementById(
      "editStatus"
    )
    .value =
      appointment.status || "planned";

  const currentTime =
    appointment.appointment_time
      ?.slice(0, 5);

  const timeSelect =
    document.getElementById(
      "editTime"
    );

  timeSelect.innerHTML = "";

  const occupied =
    window.currentAppointments
      .filter(a =>
        String(a.id) !== String(id) &&
        a.status !== "cancelled"
      )
      .map(a =>
        a.appointment_time
          ?.slice(0, 5)
      );

  getTimeSlots().forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;
    option.textContent = time;

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

    timeSelect.appendChild(option);

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

// ================================
// CLOSE EDIT MODAL
// ================================

function closeEditModal() {

  const modal =
    document.getElementById(
      "editModal"
    );

  if (modal) {
    modal.classList.remove("open");
  }

  document.body.classList.remove(
    "modal-open"
  );
}

// ================================
// SAVE EDITED APPOINTMENT
// ================================

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
    document.getElementById(
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
    formatDate(selectedDate);

  const {
    data: conflicts,
    error: checkError
  } = await supabaseClient
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

    console.error(checkError);

    message.innerHTML = `
      <div class="error-message">
        Nuk u kontrollua orari.
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

  const { error } =
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
      .eq("id", id);

  if (error) {

    console.error(error);

    message.innerHTML = `
      <div class="error-message">
        Gabim gjatë ruajtjes.
      </div>
    `;

    return;
  }

  closeEditModal();

  await loadAppointments();
}

// ================================
// DELETE APPOINTMENT
// ================================

async function deleteAppointment(id) {

  const appointment =
    window.currentAppointments.find(
      a => String(a.id) === String(id)
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

  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(error);

    alert(
      "Gabim gjatë fshirjes së vizitës."
    );

    return;
  }

  await loadAppointments();
}

// ================================
// REALTIME
// ================================

let realtimeChannel = null;

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

// ================================
// ESCAPE HTML
// ================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================================
// ESC CLOSE MODAL
// ================================

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
