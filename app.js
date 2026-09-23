// ======================================================
// AMBULATORI GVM
// SISTEMI I MENAXHIMIT TE VIZITAVE
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
    document.getElementById(
      "app"
    );


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
          Sistemi i menaxhimit të vizitave
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
          Hyr në sistem
        </button>


        <div id="loginMessage"></div>

      </div>

    </div>

  `;


  document
    .getElementById(
      "loginButton"
    )
    .addEventListener(
      "click",
      login
    );


  document
    .getElementById(
      "loginPassword"
    )
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
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

  const email =
    document
      .getElementById(
        "loginEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "loginPassword"
      )
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
// MAIN APPLICATION
// ======================================================

function showApp() {

  const app =
    document.getElementById(
      "app"
    );


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


      <!-- MAIN -->

      <div class="main-grid">


        <!-- =========================================
             ADD APPOINTMENT
        ========================================== -->

        <div class="card">

          <div class="card-header">

            <h3>
              Shto vizitë
            </h3>

            <p>
              Regjistro një termin të ri për pacientin
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
                placeholder="Opsionale"
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
              id="addAppointment"
              class="add-btn"
            >
              + Shto vizitën
            </button>


            <div id="message"></div>

          </div>

        </div>


        <!-- =========================================
             DAILY SCHEDULE
        ========================================== -->

        <div class="card schedule-card">

          <div class="schedule-header">

            <div class="schedule-header-left">

              <div class="schedule-header-icon">
                🏥
              </div>

              <div>

                <h3>
                  Orari ditor
                </h3>

                <span>
                  Menaxhimi i vizitave
                </span>

              </div>

            </div>


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

    </main>

  `;


  // ====================================================
  // BUTTONS
  // ====================================================

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


  const prevDay =
    document.getElementById(
      "prevDay"
    );


  if (prevDay) {

    prevDay.addEventListener(
      "click",
      () => {

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        updateDateTitle();

        loadAppointments();

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
      () => {

        selectedDate.setDate(
          selectedDate.getDate() + 1
        );

        updateDateTitle();

        loadAppointments();

      }
    );

  }


  const todayBtn =
    document.getElementById(
      "todayBtn"
    );


  if (todayBtn) {

    todayBtn.addEventListener(
      "click",
      () => {

        selectedDate =
          new Date();

        updateDateTitle();

        loadAppointments();

      }
    );

  }


  updateDateTitle();

  loadAppointments();

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
        "Realtime remove error:",
        error
      );

    }


    realtimeChannel =
      null;
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
    displayDate(
      selectedDate
    );
}


// ======================================================
// TIME SLOTS
// 08:00 - 18:00
// EVERY 15 MINUTES
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

  const container =
    document.getElementById(
      "appointments"
    );


  if (!container) {

    return;
  }


  const date =
    formatDate(
      selectedDate
    );


  console.log(
    "Duke ngarkuar vizitat për:",
    date
  );


  container.innerHTML = `

    <div class="loading">
      Po ngarkohet orari...
    </div>

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


    container.innerHTML = `

      <div class="error-box">

        Gabim gjatë ngarkimit të vizitave.

        <br><br>

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


  populateTimeSlots(
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
          bookedTimes.has(
            time
          )
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

    return;
  }


  const byTime =
    new Map();


  appointments.forEach(
    appointment => {

      const time =
        String(
          appointment.appointment_time
        ).substring(0, 5);


      byTime.set(
        time,
        appointment
      );

    }
  );


  const slots =
    getTimeSlots();


  container.innerHTML =
    slots.map(
      time => {

        const appointment =
          byTime.get(
            time
          );


        // =========================================
        // EMPTY SLOT
        // =========================================

        if (!appointment) {

          return `

            <div
              class="time-slot empty-slot"
              onclick="selectTimeSlot('${time}')"
              title="Kliko për të zgjedhur orën ${time}"
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


        // =========================================
        // STATUS
        // =========================================

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


        // =========================================
        // PATIENT
        // =========================================

        const fullName =
          `${appointment.first_name || ""} ${appointment.last_name || ""}`
            .trim();


        const cardNumber =
          appointment.card_number
            ? escapeHtml(
                appointment.card_number
              )
            : "Pa numër kartelë";


        // =========================================
        // ACTIONS
        // =========================================

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


        // =========================================
        // APPOINTMENT ROW
        // =========================================

        return `

          <div class="time-slot">

            <div class="slot-time">
              ${time}
            </div>


            <div class="slot-content">

              <div class="patient-info">

                <span class="patient-name">

                  ${escapeHtml(
                    fullName
                  )}

                </span>


                <span class="patient-card">

                  Kartela:
                  ${cardNumber}

                </span>

              </div>


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
    )
    .join("");
}


// ======================================================
// SELECT TIME SLOT
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
}


// ======================================================
// ADD APPOINTMENT
// ======================================================

async function addAppointment() {

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


  // ====================================================
  // CHECK EXISTING SLOT
  // ====================================================

  const {
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("appointments")
      .select(
        "id, status, appointment_date, appointment_time"
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
      "Slot check error:",
      checkError
    );


    message.textContent =
      "Gabim gjatë kontrollit të orarit.";

    message.style.color =
      "#bd4b4b";


    alert(

      "NUK MUND TË KONTROLLOHET ORARI\n\n" +

      "CODE: " +
      (
        checkError.code ||
        "N/A"
      ) +

      "\n\nMESSAGE: " +
      (
        checkError.message ||
        "N/A"
      )

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

      "Ora " +
      appointmentTime +
      " është tashmë e rezervuar.\n\n" +

      "Zgjidh një orar tjetër."

    );


    return;
  }


  // ====================================================
  // REUSE CANCELLED APPOINTMENT
  // ====================================================

  const cancelledAppointment =
    rows.find(
      appointment =>
        appointment.status ===
        "cancelled"
    );


  if (cancelledAppointment) {

    message.textContent =
      "Po ripërdorim orarin...";


    const {
      error: updateError
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


    if (updateError) {

      console.error(
        "Update error:",
        updateError
      );


      message.textContent =
        "Vizita nuk u ruajt.";

      message.style.color =
        "#bd4b4b";


      alert(

        "VIZITA NUK U RUAJT\n\n" +

        "CODE: " +
        (
          updateError.code ||
          "N/A"
        ) +

        "\n\nMESSAGE: " +
        (
          updateError.message ||
          "N/A"
        )

      );


      return;
    }


    clearForm();


    message.textContent =
      "Vizita u shtua me sukses.";

    message.style.color =
      "#2e8b57";


    await loadAppointments();


    return;
  }


  // ====================================================
  // NEW APPOINTMENT
  // ====================================================

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


  console.log(
    "PO SHTOJME VIZITEN:",
    appointmentData
  );


  message.textContent =
    "Duke ruajtur vizitën...";

  message.style.color =
    "#526674";


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
      "SUPABASE INSERT ERROR:",
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

        "KJO ORË ËSHTË E ZËNË\n\n" +

        "Zgjidh një orar tjetër."

      );


      await loadAppointments();

      return;
    }


    message.textContent =
      "Vizita nuk u shtua.";

    message.style.color =
      "#bd4b4b";


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


  console.log(
    "VIZITA U SHTUA ME SUKSES!"
  );


  clearForm();


  message.textContent =
    "Vizita u shtua me sukses.";

  message.style.color =
    "#2e8b57";


  await loadAppointments();
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

    firstName.value =
      "";

  }


  if (lastName) {

    lastName.value =
      "";

  }


  if (cardNumber) {

    cardNumber.value =
      "";

  }


  if (appointmentTime) {

    appointmentTime.value =
      "";

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
      "Status error:",
      error
    );


    alert(

      "Statusi nuk u ndryshua.\n\n" +

      error.message

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

      error.message

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


  console.log(
    "Duke aktivizuar realtime..."
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
// START APPLICATION
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
      "App po inicializohet..."
    );

    console.log(
      "================================="
    );


    checkSession();

  }
);
