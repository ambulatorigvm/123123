const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let selectedDate = new Date();
let realtimeChannel = null;

const START_HOUR = 8;
const END_HOUR = 18;


// ======================================================
// DATA
// ======================================================

function formatDate(date) {

  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1).padStart(2, "0");

  const day =
    String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function displayDate(date) {

  return date.toLocaleDateString("sq-AL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
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

  const { data, error } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

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

  document.getElementById("app").innerHTML = `

    <div style="
      max-width:420px;
      margin:80px auto;
      background:white;
      padding:30px;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,0.1);
    ">

      <h2 style="text-align:center;">
        AMBULATORI GVM
      </h2>

      <p style="text-align:center;">
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
        "
      >
        Hyr
      </button>

      <p id="loginMessage"></p>

    </div>
  `;


  document
    .getElementById("loginButton")
    .addEventListener("click", login);
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
    document.getElementById("loginMessage");


  if (!email || !password) {

    message.textContent =
      "Plotëso email-in dhe password-in.";

    return;
  }


  message.textContent =
    "Duke hyrë...";


  const { error } =
    await supabaseClient.auth.signInWithPassword({

      email,

      password

    });


  if (error) {

    console.error(error);

    message.textContent =
      "Email ose password i gabuar.";

    return;
  }


  showApp();
}


// ======================================================
// MAIN APP
// ======================================================

function showApp() {

  document.getElementById("app").innerHTML = `

    <div class="calendar">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      ">

        <div></div>

        <button id="logoutButton">
          Dil
        </button>

      </div>


      <div class="date-navigation">

        <button id="prevDay">
          ← Dita para
        </button>


        <div>

          <h2 id="currentDate"></h2>

        </div>


        <button id="nextDay">
          Dita tjetër →
        </button>

      </div>


      <button id="todayBtn">
        Sot
      </button>


      <div class="appointment-form">

        <h3>
          Shto vizitë
        </h3>


        <input
          id="firstName"
          type="text"
          placeholder="Emri"
        >


        <input
          id="lastName"
          type="text"
          placeholder="Mbiemri"
        >


        <input
          id="cardNumber"
          type="text"
          placeholder="Nr. kartelës (opsionale)"
        >


        <select id="appointmentTime">

          <option value="">
            Zgjidh orën
          </option>

        </select>


        <button id="addAppointment">
          Shto vizitën
        </button>


        <p id="message"></p>

      </div>


      <div id="appointments"></div>

    </div>
  `;


  document
    .getElementById("logoutButton")
    .addEventListener("click", logout);


  document
    .getElementById("addAppointment")
    .addEventListener("click", addAppointment);


  document
    .getElementById("prevDay")
    .addEventListener("click", () => {

      selectedDate.setDate(
        selectedDate.getDate() - 1
      );

      updateDateTitle();

      loadAppointments();

    });


  document
    .getElementById("nextDay")
    .addEventListener("click", () => {

      selectedDate.setDate(
        selectedDate.getDate() + 1
      );

      updateDateTitle();

      loadAppointments();

    });


  document
    .getElementById("todayBtn")
    .addEventListener("click", () => {

      selectedDate = new Date();

      updateDateTitle();

      loadAppointments();

    });


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

    await supabaseClient.removeChannel(
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

  document.getElementById("currentDate").textContent =
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
// POPULATE TIME SLOTS
// ======================================================

function populateTimeSlots(appointments) {

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


  const bookedTimes = new Set(

    appointments

      .filter(
        appointment =>
          appointment.status !== "cancelled"
      )

      .map(
        appointment =>
          String(
            appointment.appointment_time
          ).substring(0, 5)
      )

  );


  getTimeSlots().forEach(time => {

    if (bookedTimes.has(time)) {
      return;
    }


    const option =
      document.createElement("option");


    option.value = time;

    option.textContent = time;


    select.appendChild(option);

  });
}


// ======================================================
// SELECT TIME SLOT
// ======================================================

function selectTimeSlot(time) {

  const select =
    document.getElementById(
      "appointmentTime"
    );


  if (!select) {
    return;
  }


  select.value = time;


  const form =
    document.querySelector(
      ".appointment-form"
    );


  if (form) {

    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

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

    console.error(error);


    const container =
      document.getElementById(
        "appointments"
      );


    if (container) {

      container.innerHTML = `

        <div class="empty">

          Gabim gjatë ngarkimit të vizitave.

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


  container.innerHTML =
    slots.map(
      time => {

        const appointment =
          appointmentsByTime.get(
            time
          );


        // ==========================================
        // ORAR I LIRE
        // ==========================================

        if (!appointment) {

          return `

            <div
              class="time-slot empty-slot"
              onclick="selectTimeSlot('${time}')"
              title="Kliko për të zgjedhur këtë orar"
              style="cursor:pointer;"
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


        // ==========================================
        // STATUS
        // ==========================================

        let statusText =
          "Planifikuar";


        if (
          appointment.status === "arrived"
        ) {

          statusText =
            "Erdhi";

        }


        if (
          appointment.status === "finished"
        ) {

          statusText =
            "Përfundoi";

        }


        if (
          appointment.status === "cancelled"
        ) {

          statusText =
            "Anulluar";

        }


        // ==========================================
        // VIZITA
        // ==========================================

        return `

          <div class="
            time-slot
            ${escapeHtml(
              appointment.status || ""
            )}
          >

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
                appointment.status === "planned"

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
                appointment.status === "arrived"

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
                appointment.status !== "cancelled" &&
                appointment.status !== "finished"

                  ? `

                    <button
                      onclick="
                        changeStatus(
                          '${appointment.id}',
                          'cancelled'
                        )
                      "
                    >

                      Anullo

                    </button>

                  `

                  : ""
              }


            </div>

          </div>

        `;

      }
    ).join("");
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
        status: status
      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Gabim gjatë ndryshimit të statusit:",
      error
    );


    alert(
      "Nuk u ndryshua statusi."
    );


    return;
  }


  await loadAppointments();
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


  // ==========================================
  // KONTROLLI I FORMULARIT
  // ==========================================

  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    return;
  }


  const appointmentDate =
    formatDate(selectedDate);


  console.log(
    "Kontrollojmë slotin:",
    appointmentDate,
    appointmentTime
  );


  message.textContent =
    "Duke kontrolluar orarin...";


  // ==========================================
  // KONTROLLO SLOTIN NË DATABASE
  // ==========================================

  const {
    data: existingAppointments,
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


  // ==========================================
  // GABIM GJATË KONTROLLIT
  // ==========================================

  if (checkError) {

    console.error(
      "Gabim gjatë kontrollit të slotit:",
      checkError
    );


    message.textContent =
      "Nuk mund të kontrollohet orari.";


    alert(

      "NUK MUND TË KONTROLLOHET ORARI\n\n" +

      "CODE:\n" +
      (
        checkError.code ||
        "N/A"
      ) +

      "\n\nMESSAGE:\n" +
      (
        checkError.message ||
        "N/A"
      )

    );


    return;
  }


  const existing =
    existingAppointments || [];


  // ==========================================
  // NËSE ORA EKZISTON
  // ==========================================

  if (existing.length > 0) {


    // ----------------------------------------
    // GJEJ VIZITË AKTIVE
    // ----------------------------------------

    const activeAppointment =
      existing.find(
        appointment =>
          appointment.status !== "cancelled"
      );


    // ----------------------------------------
    // ORA ËSHTË E ZËNË
    // ----------------------------------------

    if (activeAppointment) {

      message.textContent =
        "Ky orar është tashmë i zënë.";


      alert(

        "KJO ORË ËSHTË E ZËNË\n\n" +

        "Ora " +
        appointmentTime +
        " është tashmë e rezervuar.\n\n" +

        "Zgjidh një orar tjetër."

      );


      return;
    }


    // ----------------------------------------
    // KA VIZITË TË ANULUAR
    // ----------------------------------------

    const cancelledAppointment =
      existing.find(
        appointment =>
          appointment.status === "cancelled"
      );


    if (cancelledAppointment) {

      console.log(
        "U gjet vizitë e anuluar."
      );


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
              cardNumber || null,

            status:
              "planned"

          })
          .eq(
            "id",
            cancelledAppointment.id
          );


      if (updateError) {

        console.error(
          "Gabim gjatë ripërdorimit:",
          updateError
        );


        message.textContent =
          "Vizita nuk u ruajt.";


        alert(

          "VIZITA NUK U RUAJT\n\n" +

          "CODE:\n" +
          (
            updateError.code ||
            "N/A"
          ) +

          "\n\nMESSAGE:\n" +
          (
            updateError.message ||
            "N/A"
          ) +

          "\n\nDETAILS:\n" +
          (
            updateError.details ||
            "N/A"
          )

        );


        return;
      }


      // --------------------------------------
      // SUKSES
      // --------------------------------------

      clearAppointmentForm();


      message.textContent =
        "Vizita u shtua me sukses.";


      await loadAppointments();


      return;
    }
  }


  // ==========================================
  // INSERT I RI
  // ==========================================

  const appointmentData = {

    first_name:
      firstName,

    last_name:
      lastName,

    card_number:
      cardNumber || null,

    appointment_date:
      appointmentDate,

    appointment_time:
      appointmentTime,

    status:
      "planned"

  };


  console.log(
    "Po shtojmë vizitën:",
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
  // ERROR
  // ==========================================

  if (error) {

    console.error(
      "SUPABASE INSERT ERROR:",
      error
    );


    // ----------------------------------------
    // DUPLICATE SLOT
    // ----------------------------------------

    if (
      error.code === "23505"
    ) {

      message.textContent =
        "Ky orar është tashmë i zënë.";


      alert(

        "KJO ORË ËSHTË E ZËNË\n\n" +

        "Zgjidh një orar tjetër."

      );


      await loadAppointments();


      return;
    }


    // ----------------------------------------
    // ERROR TJETËR
    // ----------------------------------------

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


  // ==========================================
  // SUKSES
  // ==========================================

  console.log(
    "VIZITA U SHTUA ME SUKSES!"
  );


  clearAppointmentForm();


  message.textContent =
    "Vizita u shtua me sukses.";


  await loadAppointments();
}


// ======================================================
// CLEAR FORM
// ======================================================

function clearAppointmentForm() {

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
// REALTIME
// ======================================================

function startRealtime() {

  if (realtimeChannel) {
    return;
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

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Auth event:",
      event
    );


    console.log(
      "Session:",
      session
    );


    if (
      event === "SIGNED_OUT"
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
