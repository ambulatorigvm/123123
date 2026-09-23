// ======================================================
// AMBULATORI GVM
// app.js
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
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


// ======================================================
// HTML SECURITY
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
    await supabaseClient.auth.getSession();


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

    console.error(
      "Elementi #app nuk ekziston."
    );

    return;
  }


  app.innerHTML = `

    <div style="
      max-width:420px;
      margin:80px auto;
      background:white;
      padding:30px;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,0.1);
    ">

      <h2 style="
        text-align:center;
        color:#17324d;
      ">
        AMBULATORI GVM
      </h2>

      <p style="
        text-align:center;
        color:#71808d;
      ">
        Hyrje në sistem
      </p>

      <input
        id="loginEmail"
        type="email"
        placeholder="Email"
        style="
          width:100%;
          box-sizing:border-box;
          margin:8px 0;
          padding:12px;
        "
      >

      <input
        id="loginPassword"
        type="password"
        placeholder="Password"
        style="
          width:100%;
          box-sizing:border-box;
          margin:8px 0;
          padding:12px;
        "
      >

      <button
        id="loginButton"
        style="
          width:100%;
          margin-top:10px;
          padding:12px;
          background:#0b7fab;
          color:white;
          border:0;
          border-radius:8px;
          cursor:pointer;
        "
      >
        Hyr
      </button>

      <p id="loginMessage"></p>

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


  if (!email || !password) {

    message.textContent =
      "Plotëso email-in dhe password-in.";

    return;
  }


  message.textContent =
    "Duke u kyçur...";


  const {
    error
  } =
    await supabaseClient.auth.signInWithPassword(
      {
        email,
        password
      }
    );


  if (error) {

    console.error(
      "Login error:",
      error
    );

    message.textContent =
      error.message;

    return;
  }


  message.textContent =
    "U kyçët me sukses.";

  showApp();
}


// ======================================================
// MAIN APP
// ======================================================

function showApp() {

  const app =
    document.getElementById("app");

  if (!app) {

    console.error(
      "Elementi #app nuk ekziston."
    );

    return;
  }


  app.innerHTML = `

    <div class="topbar">

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
          style="
            margin-left:15px;
            border:1px solid #d5dfe6;
            background:white;
            color:#526674;
            padding:7px 11px;
            border-radius:7px;
            cursor:pointer;
          "
        >
          Dil
        </button>

      </div>

    </div>


    <main class="page">


      <div class="page-title">

        <h2>
          Orari i vizitave
        </h2>

        <p>
          Menaxhimi i termineve dhe pacientëve
        </p>

      </div>


      <div class="date-panel">

        <div class="date-left">

          <div class="date-icon">
            📅
          </div>

          <div class="date-info">

            <span class="date-label">
              Data e punës
            </span>

            <span id="currentDate">
              Po ngarkohet...
            </span>

          </div>

        </div>


        <div class="date-buttons">

          <button
            id="prevDay"
          >
            ← Dita e kaluar
          </button>

          <button
            id="todayBtn"
            class="today-btn"
          >
            Sot
          </button>

          <button
            id="nextDay"
          >
            Dita tjetër →
          </button>

        </div>

      </div>


      <div class="main-grid">


        <div class="card form-card">

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

              <label for="firstName">
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

              <label for="lastName">
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

              <label for="cardNumber">
                Numri i kartelës
              </label>

              <input
                id="cardNumber"
                type="text"
                placeholder="Opsionale"
                autocomplete="off"
              >

            </div>


            <div class="form-group">

              <label for="appointmentTime">
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

            <div class="empty-slot">
              Po ngarkohet orari...
            </div>

          </div>

        </div>


      </div>

    </main>
  `;


  document
    .getElementById("logoutButton")
    .addEventListener(
      "click",
      logout
    );


  document
    .getElementById("addAppointment")
    .addEventListener(
      "click",
      addAppointment
    );


  document
    .getElementById("prevDay")
    .addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        updateDateTitle();

        loadAppointments();
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

        updateDateTitle();

        loadAppointments();
      }
    );


  document
    .getElementById("todayBtn")
    .addEventListener(
      "click",
      () => {

        selectedDate =
          new Date();

        updateDateTitle();

        loadAppointments();
      }
    );


  updateDateTitle();

  loadAppointments();

  startRealtime();
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  await supabaseClient.auth.signOut();


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
// DATE TITLE
// ======================================================

function updateDateTitle() {

  const element =
    document.getElementById(
      "currentDate"
    );

  if (!element) {
    return;
  }


  element.textContent =
    displayDate(selectedDate);
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


      const time =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;


      slots.push(time);
    }
  }


  return slots;
}


// ======================================================
// LOAD APPOINTMENTS
// ======================================================

async function loadAppointments() {

  const date =
    formatDate(selectedDate);


  console.log(
    "Duke ngarkuar vizitat për:",
    date
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
      "Load appointments error:",
      error
    );


    const container =
      document.getElementById(
        "appointments"
      );


    if (container) {

      container.innerHTML = `

        <div class="error-box">

          Gabim gjatë leximit të vizitave.

          <br><br>

          ${escapeHtml(
            error.message
          )}

        </div>

      `;
    }


    return;
  }


  console.log(
    "Vizitat e gjetura:",
    data
  );


  populateTimeSlots(
    data || []
  );


  renderAppointments(
    data || []
  );
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
            ).substring(0, 5)
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

    console.error(
      "Elementi #appointments nuk u gjet."
    );

    return;
  }


  const appointmentsByTime =
    new Map();


  appointments.forEach(
    appointment => {

      const time =
        String(
          appointment.appointment_time
        ).substring(0, 5);


      appointmentsByTime.set(
        time,
        appointment
      );

    }
  );


  const slots =
    getTimeSlots();


  container.innerHTML = "";


  slots.forEach(
    time => {

      const appointment =
        appointmentsByTime.get(
          time
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "appointment-row";


      const timeElement =
        document.createElement(
          "div"
        );


      timeElement.className =
        "appointment-time";


      timeElement.textContent =
        time;


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "appointment-content";


      if (!appointment) {

        content.innerHTML = `

          <div class="empty-slot">
            E lirë
          </div>

        `;

      } else {

        const name =
          `${appointment.first_name || ""} ${appointment.last_name || ""}`
            .trim();


        const status =
          appointment.status ||
          "planned";


        content.innerHTML = `

          <div class="patient-name">
            ${escapeHtml(name)}
          </div>


          <div class="appointment-status">
            ${escapeHtml(
              getStatusText(status)
            )}
          </div>


          <div class="appointment-actions">

            <button
              class="status-btn"
              onclick="changeStatus(
                '${appointment.id}'
              )"
            >
              Ndrysho statusin
            </button>


            <button
              class="delete-btn"
              onclick="deleteAppointment(
                '${appointment.id}'
              )"
            >
              Fshi
            </button>

          </div>

        `;
      }


      row.appendChild(
        timeElement
      );

      row.appendChild(
        content
      );

      container.appendChild(
        row
      );

    }
  );
}


// ======================================================
// STATUS TEXT
// ======================================================

function getStatusText(
  status
) {

  switch (status) {

    case "planned":
      return "Planifikuar";

    case "arrived":
      return "Ka ardhur";

    case "in_progress":
      return "Në kontroll";

    case "finished":
      return "Përfunduar";

    case "completed":
      return "Përfunduar";

    case "cancelled":
      return "Anuluar";

    default:
      return status || "Planifikuar";
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


  // ----------------------------------------
  // VALIDATION
  // ----------------------------------------

  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    return;
  }


  const appointmentData = {

    first_name:
      firstName,

    last_name:
      lastName,

    card_number:
      cardNumber || null,

    appointment_date:
      formatDate(selectedDate),

    appointment_time:
      appointmentTime,

    status:
      "planned"

  };


  console.log(
    "================================"
  );

  console.log(
    "PO PROVOJME TE SHTOJME VIZITEN"
  );

  console.log(
    appointmentData
  );

  console.log(
    "================================"
  );


  message.textContent =
    "Duke ruajtur vizitën...";


  // ----------------------------------------
  // INSERT
  // ----------------------------------------

  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .insert(
        appointmentData
      );


  // ----------------------------------------
  // ERROR
  // ----------------------------------------

  if (error) {

    console.error(
      "========== SUPABASE INSERT ERROR =========="
    );

    console.error(
      "CODE:",
      error.code
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error(
      "DETAILS:",
      error.details
    );

    console.error(
      "HINT:",
      error.hint
    );

    console.error(
      "FULL ERROR:",
      error
    );


    message.textContent =
      "Vizita nuk u shtua.";


    alert(

      "VIZITA NUK U SHTUA\n\n" +

      "CODE:\n" +
      (
        error.code ||
        "N/A"
      ) +

      "\n\nMESSAGE:\n" +
      (
        error.message ||
        "N/A"
      ) +

      "\n\nDETAILS:\n" +
      (
        error.details ||
        "N/A"
      ) +

      "\n\nHINT:\n" +
      (
        error.hint ||
        "N/A"
      )

    );


    return;
  }


  // ----------------------------------------
  // SUCCESS
  // ----------------------------------------

  console.log(
    "VIZITA U SHTUA ME SUKSES!"
  );


  document
    .getElementById(
      "firstName"
    )
    .value = "";


  document
    .getElementById(
      "lastName"
    )
    .value = "";


  document
    .getElementById(
      "cardNumber"
    )
    .value = "";


  document
    .getElementById(
      "appointmentTime"
    )
    .value = "";


  message.textContent =
    "Vizita u shtua me sukses.";


  await loadAppointments();
}


// ======================================================
// CHANGE STATUS
// ======================================================

async function changeStatus(
  id
) {

  const options = [

    {
      value: "planned",
      text: "Planifikuar"
    },

    {
      value: "arrived",
      text: "Ka ardhur"
    },

    {
      value: "in_progress",
      text: "Në kontroll"
    },

    {
      value: "finished",
      text: "Përfunduar"
    },

    {
      value: "cancelled",
      text: "Anuluar"
    }

  ];


  const answer =
    prompt(

      "Zgjidh statusin:\n\n" +

      "1. Planifikuar\n" +

      "2. Ka ardhur\n" +

      "3. Në kontroll\n" +

      "4. Përfunduar\n" +

      "5. Anuluar"

    );


  if (
    answer === null
  ) {
    return;
  }


  const number =
    parseInt(
      answer,
      10
    );


  if (
    number < 1 ||
    number > 5
  ) {

    alert(
      "Zgjedhje e pavlefshme."
    );

    return;
  }


  const newStatus =
    options[number - 1]
      .value;


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .update({
        status:
          newStatus
      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Status update error:",
      error
    );


    alert(

      "Statusi nuk u ndryshua.\n\n" +

      "CODE: " +
      (
        error.code ||
        "N/A"
      ) +

      "\n\n" +

      (
        error.message ||
        ""
      )

    );


    return;
  }


  await loadAppointments();
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
      "Delete error:",
      error
    );


    alert(

      "Vizita nuk u fshi.\n\n" +

      "CODE: " +
      (
        error.code ||
        "N/A"
      ) +

      "\n\n" +

      (
        error.message ||
        ""
      )

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

          loadAppointments();
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
// AUTH STATE
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

    }
  );


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    checkSession();

  }
);
