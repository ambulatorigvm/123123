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
   DATA / DATE
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   LOGIN
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


function showLogin() {
  document.getElementById("app").innerHTML = `
    <div style="
      max-width:420px;
      margin:80px auto;
      background:white;
      padding:30px;
      border-radius:16px;
      box-shadow:0 4px 20px rgba(0,0,0,0.10);
    ">

      <h2 style="
        text-align:center;
        color:#0f4c81;
      ">
        AMBULATORI GVM
      </h2>

      <p style="
        text-align:center;
        color:#667085;
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
          border:1px solid #d0d5dd;
          border-radius:8px;
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
          border:1px solid #d0d5dd;
          border-radius:8px;
        "
      >

      <button
        id="loginButton"
        style="
          width:100%;
          margin-top:10px;
          padding:12px;
          border:none;
          border-radius:8px;
          background:#0f6fb5;
          color:white;
          cursor:pointer;
          font-size:15px;
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
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) {
    message.textContent =
      "Plotëso email-in dhe password-in.";
    return;
  }

  message.textContent = "Duke hyrë...";

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

        <button
          id="logoutButton"
          style="
            padding:9px 16px;
            border-radius:8px;
            border:1px solid #d0d5dd;
            background:white;
            cursor:pointer;
          "
        >
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


    <!-- EDIT MODAL -->

    <div
      id="editModal"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(15,23,42,0.45);
        z-index:9999;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
      "
    >

      <div style="
        width:100%;
        max-width:480px;
        background:white;
        border-radius:16px;
        padding:25px;
        box-shadow:0 15px 50px rgba(0,0,0,0.25);
      ">

        <h3 style="
          margin-top:0;
          color:#0f4c81;
        ">
          Ndrysho vizitën
        </h3>


        <input
          id="editFirstName"
          type="text"
          placeholder="Emri"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            margin:7px 0;
            border:1px solid #d0d5dd;
            border-radius:8px;
          "
        >


        <input
          id="editLastName"
          type="text"
          placeholder="Mbiemri"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            margin:7px 0;
            border:1px solid #d0d5dd;
            border-radius:8px;
          "
        >


        <select
          id="editTime"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            margin:7px 0;
            border:1px solid #d0d5dd;
            border-radius:8px;
          "
        ></select>


        <select
          id="editStatus"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            margin:7px 0;
            border:1px solid #d0d5dd;
            border-radius:8px;
          "
        >

          <option value="planned">
            Planifikuar
          </option>

          <option value="arrived">
            Ka ardhur
          </option>

          <option value="finished">
            Vizita përfundoi
          </option>

          <option value="cancelled">
            Anuluar
          </option>

        </select>


        <div style="
          display:flex;
          gap:10px;
          margin-top:18px;
        ">

          <button
            id="saveEditButton"
            style="
              flex:1;
              padding:12px;
              border:none;
              border-radius:8px;
              background:#0f6fb5;
              color:white;
              cursor:pointer;
            "
          >
            Ruaj ndryshimet
          </button>


          <button
            id="cancelEditButton"
            style="
              flex:1;
              padding:12px;
              border:1px solid #d0d5dd;
              border-radius:8px;
              background:white;
              cursor:pointer;
            "
          >
            Anulo
          </button>

        </div>

        <p
          id="editMessage"
          style="
            margin-bottom:0;
          "
        ></p>

      </div>

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


  document
    .getElementById("cancelEditButton")
    .addEventListener("click", closeEditModal);


  document
    .getElementById("saveEditButton")
    .addEventListener("click", saveEditedAppointment);


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
  document.getElementById("currentDate").textContent =
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
   TIME SELECT
========================= */

function populateTimeSlots(appointments) {
  const select =
    document.getElementById("appointmentTime");

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
   SELECT FREE SLOT
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
  const date = formatDate(selectedDate);

  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("appointment_date", date)
      .order("appointment_time", {
        ascending: true
      });


  if (error) {
    console.error(error);

    const container =
      document.getElementById("appointments");

    if (container) {
      container.innerHTML = `
        <div class="empty">
          Gabim gjatë ngarkimit të vizitave.
        </div>
      `;
    }

    return;
  }


  renderAppointments(data);
  populateTimeSlots(data);
}


/* =========================
   RENDER SCHEDULE
========================= */

function renderAppointments(appointments) {
  const container =
    document.getElementById("appointments");

  if (!container) {
    return;
  }


  const appointmentsByTime =
    new Map();


  appointments.forEach(appointment => {

    appointmentsByTime.set(
      appointment.appointment_time.substring(0, 5),
      appointment
    );

  });


  const slots = getTimeSlots();


  container.innerHTML = `

    <div class="schedule-table">

      <div class="schedule-header">

        <div>ORA</div>
        <div>PACIENTI</div>
        <div>STATUSI</div>
        <div>VEPRIME</div>

      </div>


      ${slots.map(time => {

        const appointment =
          appointmentsByTime.get(time);


        /* ORAR I LIRË */

        if (!appointment) {

          return `
            <div
              class="schedule-row schedule-row-free"
              onclick="selectTimeSlot('${time}')"
            >

              <div class="schedule-time">
                ${time}
              </div>

              <div class="schedule-patient">
                <span class="free-dot"></span>
                Orar i lirë
              </div>

              <div class="schedule-status">
                <span class="status-badge status-free">
                  I lirë
                </span>
              </div>

              <div class="schedule-actions">

                <button
                  class="schedule-book-button"
                  onclick="
                    event.stopPropagation();
                    selectTimeSlot('${time}');
                  "
                >
                  Rezervo
                </button>

              </div>

            </div>
          `;
        }


        /* STATUS */

        let statusText = "Planifikuar";
        let statusClass = "status-planned";


        if (appointment.status === "arrived") {
          statusText = "Ka ardhur";
          statusClass = "status-arrived";
        }


        if (appointment.status === "finished") {
          statusText = "Përfundoi";
          statusClass = "status-finished";
        }


        if (appointment.status === "cancelled") {
          statusText = "Anuluar";
          statusClass = "status-cancelled";
        }


        /* PACIENTI */

        const patientName =
          `${escapeHtml(appointment.first_name)}
           ${escapeHtml(appointment.last_name)}`;


        return `
          <div
            class="
              schedule-row
              schedule-row-booked
              ${appointment.status}
            "
          >

            <div class="schedule-time">
              ${time}
            </div>


            <div class="schedule-patient">

              <strong>
                ${patientName}
              </strong>

            </div>


            <div class="schedule-status">

              <span class="
                status-badge
                ${statusClass}
              ">
                ${statusText}
              </span>

            </div>


            <div class="schedule-actions">

              <button
                class="schedule-edit-button"
                onclick="
                  event.stopPropagation();
                  openEditModal('${appointment.id}');
                "
              >
                Ndrysho
              </button>


              ${
                appointment.status === "planned"
                  ? `
                    <button
                      class="schedule-arrived-button"
                      onclick="
                        event.stopPropagation();
                        changeStatus(
                          '${appointment.id}',
                          'arrived'
                        );
                      "
                    >
                      Ka ardhur
                    </button>
                  `
                  : ""
              }


              ${
                appointment.status === "arrived"
                  ? `
                    <button
                      class="schedule-finished-button"
                      onclick="
                        event.stopPropagation();
                        changeStatus(
                          '${appointment.id}',
                          'finished'
                        );
                      "
                    >
                      Përfundo
                    </button>
                  `
                  : ""
              }


              ${
                appointment.status !== "cancelled" &&
                appointment.status !== "finished"
                  ? `
                    <button
                      class="schedule-cancel-button"
                      onclick="
                        event.stopPropagation();
                        changeStatus(
                          '${appointment.id}',
                          'cancelled'
                        );
                      "
                    >
                      Anulo
                    </button>
                  `
                  : ""
              }

            </div>

          </div>
        `;

      }).join("")}

    </div>
  `;
}


/* =========================
   EDIT MODAL
========================= */

async function openEditModal(id) {

  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();


  if (error || !data) {

    console.error(error);

    alert(
      "Nuk u gjet vizita."
    );

    return;
  }


  const modal =
    document.getElementById("editModal");


  document
    .getElementById("editFirstName")
    .value =
      data.first_name || "";


  document
    .getElementById("editLastName")
    .value =
      data.last_name || "";


  document
    .getElementById("editStatus")
    .value =
      data.status || "planned";


  const timeSelect =
    document.getElementById("editTime");


  timeSelect.innerHTML = "";


  const currentTime =
    data.appointment_time.substring(0, 5);


  getTimeSlots().forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;
    option.textContent = time;


    if (time === currentTime) {
      option.selected = true;
    }


    timeSelect.appendChild(option);

  });


  /*
    Mbajmë ID-në e vizitës
    në modal.
  */

  modal.dataset.appointmentId =
    id;


  document
    .getElementById("editMessage")
    .textContent = "";


  modal.style.display = "flex";
}


/* =========================
   CLOSE EDIT
========================= */

function closeEditModal() {

  const modal =
    document.getElementById("editModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================
   SAVE EDIT
========================= */

async function saveEditedAppointment() {

  const modal =
    document.getElementById("editModal");


  const id =
    modal.dataset.appointmentId;


  const firstName =
    document
      .getElementById("editFirstName")
      .value
      .trim();


  const lastName =
    document
      .getElementById("editLastName")
      .value
      .trim();


  const appointmentTime =
    document
      .getElementById("editTime")
      .value;


  const status =
    document
      .getElementById("editStatus")
      .value;


  const message =
    document
      .getElementById("editMessage");


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    return;
  }


  /*
    Kontrollojmë nëse ora e re
    është e zënë nga një vizitë tjetër.
  */

  const { data: existingAppointment, error: checkError } =
    await supabaseClient
      .from("appointments")
      .select("id,status")
      .eq(
        "appointment_date",
        formatDate(selectedDate)
      )
      .eq(
        "appointment_time",
        appointmentTime
      )
      .neq("id", id)
      .neq("status", "cancelled")
      .maybeSingle();


  if (checkError) {

    console.error(checkError);

    message.textContent =
      "Gabim gjatë kontrollit të orarit.";

    return;
  }


  if (existingAppointment) {

    message.textContent =
      "Ky orar është tashmë i zënë.";

    return;
  }


  const { error } =
    await supabaseClient
      .from("appointments")
      .update({
        first_name: firstName,
        last_name: lastName,
        appointment_time: appointmentTime,
        status: status
      })
      .eq("id", id);


  if (error) {

    console.error(error);

    message.textContent =
      "Gabim gjatë ruajtjes së ndryshimeve.";

    return;
  }


  message.textContent =
    "Ndryshimet u ruajtën me sukses.";


  setTimeout(() => {

    closeEditModal();
    loadAppointments();

  }, 500);
}


/* =========================
   CHANGE STATUS
========================= */

async function changeStatus(id, status) {

  const { error } =
    await supabaseClient
      .from("appointments")
      .update({
        status
      })
      .eq("id", id);


  if (error) {

    console.error(error);

    alert(
      "Nuk u ndryshua statusi."
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
    document
      .getElementById("message");


  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";

    return;
  }


  const { error } =
    await supabaseClient
      .from("appointments")
      .insert({
        first_name: firstName,
        last_name: lastName,
        card_number:
          cardNumber || null,
        appointment_date:
          formatDate(selectedDate),
        appointment_time:
          appointmentTime,
        status: "planned"
      });


  if (error) {

    console.error(error);


    if (error.code === "23505") {

      message.textContent =
        "Ky orar është tashmë i zënë.";

    } else {

      message.textContent =
        "Gabim gjatë ruajtjes së vizitës.";

    }


    loadAppointments();

    return;
  }


  document
    .getElementById("firstName")
    .value = "";


  document
    .getElementById("lastName")
    .value = "";


  document
    .getElementById("cardNumber")
    .value = "";


  document
    .getElementById("appointmentTime")
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
      .channel("appointments-realtime")

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
      event === "SIGNED_OUT" ||
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
