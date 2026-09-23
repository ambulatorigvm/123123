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


/* =========================
   DATE
========================= */

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

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


/* =========================
   SECURITY
========================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   SESSION
========================= */

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


/* =========================
   LOGIN
========================= */

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


/* =========================
   MAIN APP
========================= */

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

        <h3>Shto vizitë</h3>


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


/* =========================
   LOGOUT
========================= */

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


/* =========================
   DATE TITLE
========================= */

function updateDateTitle() {

  document
    .getElementById("currentDate")
    .textContent =
      displayDate(selectedDate);
}


/* =========================
   TIME SLOTS
========================= */

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


/* =========================
   AVAILABLE TIMES
========================= */

function populateTimeSlots(appointments) {

  const select =
    document.getElementById("appointmentTime");


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
            appointment.status !== "cancelled"
        )

        .map(
          appointment =>
            appointment.appointment_time.substring(0, 5)
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


/* =========================
   SELECT TIME SLOT
========================= */

function selectTimeSlot(time) {

  const select =
    document.getElementById("appointmentTime");


  if (!select) {

    return;
  }


  select.value = time;


  const form =
    document.querySelector(".appointment-form");


  if (form) {

    form.scrollIntoView({

      behavior: "smooth",

      block: "center"

    });

  }


  const firstName =
    document.getElementById("firstName");


  if (firstName) {

    firstName.focus();

  }
}


/* =========================
   LOAD APPOINTMENTS
========================= */

async function loadAppointments() {

  const date =
    formatDate(selectedDate);


  const { data, error } =
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
      "LOAD APPOINTMENTS ERROR:",
      error
    );


    const container =
      document.getElementById(
        "appointments"
      );


    if (container) {

      container.innerHTML = `

        <div class="empty">

          Gabim gjatë ngarkimit të vizitave.

          <br><br>

          <strong>
            ${escapeHtml(error.message || "")}
          </strong>

        </div>

      `;

    }


    return;
  }


  renderAppointments(data);

  populateTimeSlots(data);
}


/* =========================
   RENDER APPOINTMENTS
========================= */

function renderAppointments(appointments) {

  const container =
    document.getElementById(
      "appointments"
    );


  const appointmentsByTime =
    new Map();


  appointments.forEach(
    appointment => {

      appointmentsByTime.set(

        appointment
          .appointment_time
          .substring(0, 5),

        appointment

      );

    }
  );


  const slots =
    getTimeSlots();


  container.innerHTML =
    slots.map(time => {


      const appointment =
        appointmentsByTime.get(time);


      if (!appointment) {

        return `

          <div

            class="time-slot empty-slot"

            onclick="
              selectTimeSlot('${time}')
            "

            title="Kliko për të zgjedhur këtë orar"

            style="cursor:pointer;"

          >

            <div class="slot-time">

              ${time}

            </div>


            <div class="slot-content">

              <span>

                Orar i lirë —
                kliko për ta zgjedhur

              </span>

            </div>

          </div>

        `;
      }


      let statusText =
        "Planifikuar";


      if (
        appointment.status ===
        "arrived"
      ) {

        statusText =
          "Erdhi";

      }


      if (
        appointment.status ===
        "finished"
      ) {

        statusText =
          "Përfundoi";

      }


      if (
        appointment.status ===
        "cancelled"
      ) {

        statusText =
          "Anulluar";

      }


      return `

        <div class="
          time-slot
          ${escapeHtml(appointment.status)}
        ">


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

                    Anullo

                  </button>

                `

                : ""
            }


          </div>


        </div>

      `;

    }).join("");
}


/* =========================
   CHANGE STATUS
========================= */

async function changeStatus(
  id,
  status
) {

  const { error } =
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

    console.error(
      "STATUS ERROR:",
      error
    );


    alert(

      "Gabim gjatë ndryshimit të statusit:\n\n" +

      "Code: " +
      (error.code || "") +

      "\nMessage: " +
      (error.message || "") +

      "\nDetails: " +
      (error.details || "") +

      "\nHint: " +
      (error.hint || "")

    );


    return;
  }


  loadAppointments();
}


/* =========================
   ADD APPOINTMENT
========================= */

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


  /* =========================
     VALIDATION
  ========================= */

  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    return;
  }


  /* =========================
     INSERT
  ========================= */

  const { data, error } =
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
          formatDate(
            selectedDate
          ),

        appointment_time:
          appointmentTime,

        status:
          "planned"

      })

      .select();


  /* =========================
     ERROR
  ========================= */

  if (error) {

    console.error(
      "SUPABASE INSERT ERROR:",
      error
    );


    message.textContent =
      "Gabim gjatë ruajtjes së vizitës.";


    alert(

      "NUK U SHTUA VIZITA\n\n" +

      "Code: " +
      (error.code || "N/A") +

      "\n\nMessage:\n" +
      (error.message || "N/A") +

      "\n\nDetails:\n" +
      (error.details || "N/A") +

      "\n\nHint:\n" +
      (error.hint || "N/A")

    );


    return;
  }


  /* =========================
     SUCCESS
  ========================= */

  console.log(
    "APPOINTMENT CREATED:",
    data
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


  loadAppointments();
}


/* =========================
   REALTIME
========================= */

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


/* =========================
   AUTH STATE
========================= */

supabaseClient.auth.onAuthStateChange(

  (event, session) => {

    if (

      event ===
        "SIGNED_OUT" ||

      !session

    ) {

      showLogin();

    }

  }

);


/* =========================
   START
========================= */

window.addEventListener(
  "load",
  () => {

    checkSession();

  }
);
