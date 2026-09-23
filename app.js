// ======================================================
// AMBULATORI GVM
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

let selectedDate =
  new Date();


let realtimeChannel =
  null;


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

  return String(
    value ?? ""
  )
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
    document.getElementById(
      "app"
    );


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
        >


        <input
          id="loginPassword"
          type="password"
          placeholder="Password"
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
    .getElementById(
      "loginButton"
    )
    .addEventListener(
      "click",
      login
    );
}


// ======================================================
// LOGIN
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

    return;
  }


  message.textContent =
    "Duke u kyçur...";


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

    return;
  }


  showApp();
}


// ======================================================
// MAIN APP
// ======================================================

function showApp() {

  const app =
    document.getElementById(
      "app"
    );


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
                placeholder="Opsionale"
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


        <!-- =====================================
             SCHEDULE
        ====================================== -->

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

            <div
              style="
                padding:25px;
                text-align:center;
                color:#9aa6ad;
              "
            >
              Po ngarkohet orari...
            </div>

          </div>

        </div>


      </div>

    </main>

  `;


  // ==========================================
  // BUTTONS
  // ==========================================

  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      logout
    );


  document
    .getElementById(
      "addAppointment"
    )
    .addEventListener(
      "click",
      addAppointment
    );


  document
    .getElementById(
      "prevDay"
    )
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
    .getElementById(
      "nextDay"
    )
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
    .getElementById(
      "todayBtn"
    )
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

  await supabaseClient
    .auth
    .signOut();


  if (realtimeChannel) {

    await supabaseClient
      .removeChannel(
        realtimeChannel
      );

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
// ÇDO 15 MINUTA
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
    formatDate(
      selectedDate
    );


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
      "Load error:",
      error
    );


    const container =
      document.getElementById(
        "appointments"
      );


    if (container) {

      container.innerHTML = `

        <div class="error-box">

          Gabim gjatë ngarkimit të vizitave.

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
// RENDER
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


        // ==================================
        // EMPTY
        // ==================================

        if (!appointment) {

          return `

            <div
              class="time-slot empty-slot"
              onclick="
                selectTimeSlot('${time}')
              "
            >

              <div class="slot-time">
                ${time}
              </div>


              <div class="slot-content">

                <span>
                  Orar i lirë
                </span>

              </div>

            </div>

          `;
        }


        // ==================================
        // STATUS
        // ==================================

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


        return `

          <div class="time-slot">


            <div class="slot-time">

              ${time}

            </div>


            <div class="slot-content">


              <strong>

                ${escapeHtml(
                  appointment.first_name
                )}

                ${escapeHtml(
                  appointment.last_name
                )}

              </strong>


              ${
                appointment.card_number
                  ? `

                    <small>
                      Kartela:
                      ${escapeHtml(
                        appointment.card_number
                      )}
                    </small>

                  `
                  : ""
              }


              <span class="status">

                ${statusText}

              </span>


            </div>


            <div class="appointment-actions">


              ${
                appointment.status ===
                "planned"

                  ? `

                    <button
                      onclick="
                        changeStatus(
                          '${appointment.id}',
                          'arrived'
                        )
                      "
                    >
                      Erdhi
                    </button>

                  `
                  : ""
              }


              ${
                appointment.status ===
                "arrived"

                  ? `

                    <button
                      onclick="
                        changeStatus(
                          '${appointment.id}',
                          'finished'
                        )
                      "
                    >
                      Përfundoi
                    </button>

                  `
                  : ""
              }


              ${
                appointment.status !==
                  "cancelled" &&
                appointment.status !==
                  "finished"

                  ? `

                    <button
                      onclick="
                        changeStatus(
                          '${appointment.id}',
                          'cancelled'
                        )
                      "
                    >
                      Anulo
                    </button>

                  `
                  : ""
              }


              <button
                onclick="
                  deleteAppointment(
                    '${appointment.id}'
                  )
                "
              >
                Fshi
              </button>


            </div>


          </div>

        `;

      }
    )
    .join("");
}


// ======================================================
// SELECT EMPTY TIME
// ======================================================

function selectTimeSlot(time) {

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


  // ==========================================
  // VALIDATION
  // ==========================================

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


  // ==========================================
  // CHECK EXISTING SLOT
  // ==========================================

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


  // ==========================================
  // ACTIVE APPOINTMENT EXISTS
  // ==========================================

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


  // ==========================================
  // CANCELLED APPOINTMENT EXISTS
  // ==========================================

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


  // ==========================================
  // NEW APPOINTMENT
  // ==========================================

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


  const {
    error
  } =
    await supabaseClient
      .from("appointments")
      .insert(
        appointmentData
      );


  // ==========================================
  // INSERT ERROR
  // ==========================================

  if (error) {

    console.error(
      "SUPABASE INSERT ERROR:",
      error
    );


    // ========================================
    // DUPLICATE SLOT
    // ========================================

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


    // ========================================
    // OTHER ERROR
    // ========================================

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


  // ==========================================
  // SUCCESS
  // ==========================================

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
// AUTH EVENT
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
      "App po inicializohet..."
    );


    console.log(
      "================================="
    );


    checkSession();

  }
);
