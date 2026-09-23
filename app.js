// ======================================================
// AMBULATORI GVM
// app.js
// ======================================================

// ------------------------------------------------------
// SUPABASE
// ------------------------------------------------------

const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ------------------------------------------------------
// VARIABLES
// ------------------------------------------------------

let selectedDate = new Date();

const START_HOUR = 8;
const END_HOUR = 18;


// ------------------------------------------------------
// FORMAT DATE
// ------------------------------------------------------

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ------------------------------------------------------
// FORMAT DATE FOR DISPLAY
// ------------------------------------------------------

function formatDateDisplay(date) {
  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}


// ------------------------------------------------------
// TIME SLOTS
// 08:00 - 18:00 / every 15 minutes
// ------------------------------------------------------

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

      const h = String(hour).padStart(2, "0");

      const m = String(minute).padStart(2, "0");

      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}


// ------------------------------------------------------
// GET ELEMENT
// ------------------------------------------------------

function getElement(id) {
  return document.getElementById(id);
}


// ------------------------------------------------------
// LOAD APPOINTMENTS
// ------------------------------------------------------

async function loadAppointments() {

  const date = formatDate(selectedDate);

  console.log("Duke ngarkuar vizitat për:", date);

  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("appointment_date", date)
      .order("appointment_time", {
        ascending: true
      });

  if (error) {

    console.error(
      "Gabim gjatë leximit të appointments:",
      error
    );

    const container =
      getElement("appointments");

    if (container) {

      container.innerHTML = `
        <div class="error-box">
          Gabim gjatë leximit të vizitave.
          <br><br>
          ${error.message || ""}
        </div>
      `;
    }

    return;
  }

  console.log(
    "Vizitat e gjetura:",
    data
  );

  renderAppointments(data || []);

  populateTimeSlots(data || []);
}


// ------------------------------------------------------
// RENDER APPOINTMENTS
// ------------------------------------------------------

function renderAppointments(appointments) {

  const container =
    getElement("appointments");

  if (!container) {

    console.error(
      "Elementi #appointments nuk u gjet."
    );

    return;
  }

  const slots = getTimeSlots();

  container.innerHTML = "";

  slots.forEach(time => {

    const appointment =
      appointments.find(item => {

        return item.appointment_time === time;

      });

    const row =
      document.createElement("div");

    row.className =
      "appointment-row";


    // -----------------------------------------------
    // TIME
    // -----------------------------------------------

    const timeElement =
      document.createElement("div");

    timeElement.className =
      "appointment-time";

    timeElement.textContent =
      time;


    // -----------------------------------------------
    // CONTENT
    // -----------------------------------------------

    const content =
      document.createElement("div");

    content.className =
      "appointment-content";


    if (appointment) {

      const fullName =
        `${appointment.first_name || ""} ${appointment.last_name || ""}`.trim();

      const status =
        appointment.status || "planned";


      content.innerHTML = `
        <div class="patient-name">
          ${escapeHtml(fullName)}
        </div>

        <div class="appointment-status">
          ${getStatusText(status)}
        </div>

        <div class="appointment-actions">

          <button
            class="status-btn"
            onclick="changeAppointmentStatus('${appointment.id}', '${status}')"
          >
            Ndrysho statusin
          </button>

          <button
            class="delete-btn"
            onclick="deleteAppointment('${appointment.id}')"
          >
            Fshi
          </button>

        </div>
      `;

    } else {

      content.innerHTML = `
        <div class="empty-slot">
          E lirë
        </div>
      `;
    }


    row.appendChild(timeElement);

    row.appendChild(content);

    container.appendChild(row);

  });
}


// ------------------------------------------------------
// ESCAPE HTML
// ------------------------------------------------------

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ------------------------------------------------------
// STATUS TEXT
// ------------------------------------------------------

function getStatusText(status) {

  switch (status) {

    case "planned":
      return "Planifikuar";

    case "arrived":
      return "Ka ardhur";

    case "in_progress":
      return "Në kontroll";

    case "completed":
      return "Përfunduar";

    case "cancelled":
      return "Anuluar";

    default:
      return status || "Planifikuar";
  }
}


// ------------------------------------------------------
// POPULATE TIME SLOTS
// ------------------------------------------------------

function populateTimeSlots(appointments) {

  const select =
    getElement("appointmentTime");

  if (!select) {
    return;
  }

  const currentValue =
    select.value;

  select.innerHTML = `
    <option value="">
      Zgjidh orën
    </option>
  `;

  const bookedTimes =
    appointments
      .filter(item =>
        item.status !== "cancelled"
      )
      .map(item =>
        item.appointment_time
      );


  getTimeSlots().forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;

    option.textContent = time;


    if (bookedTimes.includes(time)) {

      option.disabled = true;

      option.textContent =
        `${time} - E zënë`;
    }

    select.appendChild(option);

  });


  if (
    currentValue &&
    !bookedTimes.includes(currentValue)
  ) {

    select.value =
      currentValue;
  }
}


// ------------------------------------------------------
// ADD APPOINTMENT
// ------------------------------------------------------

async function addAppointment() {

  const firstName =
    getElement("firstName")?.value.trim();

  const lastName =
    getElement("lastName")?.value.trim();

  const cardNumber =
    getElement("cardNumber")?.value.trim();

  const appointmentTime =
    getElement("appointmentTime")?.value;

  const message =
    getElement("message");


  // -----------------------------------------------
  // VALIDATION
  // -----------------------------------------------

  if (
    !firstName ||
    !lastName ||
    !appointmentTime
  ) {

    if (message) {

      message.textContent =
        "Plotëso emrin, mbiemrin dhe orën.";
    }

    return;
  }


  const appointmentData = {

    first_name: firstName,

    last_name: lastName,

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
    "================================="
  );

  console.log(
    "PO PROVOJME TE SHTOJME VIZITEN"
  );

  console.log(
    appointmentData
  );

  console.log(
    "================================="
  );


  // -----------------------------------------------
  // INSERT INTO SUPABASE
  // -----------------------------------------------

  const { error } =
    await supabaseClient
      .from("appointments")
      .insert(appointmentData);


  // -----------------------------------------------
  // ERROR
  // -----------------------------------------------

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


    if (message) {

      message.textContent =
        "Vizita nuk u shtua.";
    }


    alert(

      "VIZITA NUK U SHTUA\n\n" +

      "CODE:\n" +
      (error.code || "N/A") +

      "\n\nMESSAGE:\n" +
      (error.message || "N/A") +

      "\n\nDETAILS:\n" +
      (error.details || "N/A") +

      "\n\nHINT:\n" +
      (error.hint || "N/A")
    );


    return;
  }


  // -----------------------------------------------
  // SUCCESS
  // -----------------------------------------------

  console.log(
    "VIZITA U SHTUA ME SUKSES!"
  );


  // Pastro formularin

  if (getElement("firstName")) {
    getElement("firstName").value = "";
  }

  if (getElement("lastName")) {
    getElement("lastName").value = "";
  }

  if (getElement("cardNumber")) {
    getElement("cardNumber").value = "";
  }

  if (getElement("appointmentTime")) {
    getElement("appointmentTime").value = "";
  }


  if (message) {

    message.textContent =
      "Vizita u shtua me sukses.";
  }


  await loadAppointments();
}


// ------------------------------------------------------
// DELETE APPOINTMENT
// ------------------------------------------------------

async function deleteAppointment(id) {

  if (!id) {
    return;
  }


  const confirmed =
    confirm(
      "A dëshiron ta fshish këtë vizitë?"
    );


  if (!confirmed) {
    return;
  }


  console.log(
    "Duke fshirë vizitën:",
    id
  );


  const { error } =
    await supabaseClient
      .from("appointments")
      .delete()
      .eq("id", id);


  if (error) {

    console.error(
      "Gabim gjatë fshirjes:",
      error
    );


    alert(

      "Vizita nuk u fshi.\n\n" +

      "CODE: " +
      (error.code || "N/A") +

      "\n\n" +

      (error.message || "")
    );

    return;
  }


  await loadAppointments();
}


// ------------------------------------------------------
// CHANGE STATUS
// ------------------------------------------------------

async function changeAppointmentStatus(
  id,
  currentStatus
) {

  const statuses = [

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
      value: "completed",
      text: "Përfunduar"
    },

    {
      value: "cancelled",
      text: "Anuluar"
    }

  ];


  let text =
    "Zgjidh statusin e ri:\n\n";


  statuses.forEach(
    (item, index) => {

      text +=
        `${index + 1}. ${item.text}\n`;
    }
  );


  const answer =
    prompt(text);


  if (answer === null) {
    return;
  }


  const index =
    parseInt(answer, 10) - 1;


  if (
    index < 0 ||
    index >= statuses.length
  ) {

    alert(
      "Zgjedhje e pavlefshme."
    );

    return;
  }


  const newStatus =
    statuses[index].value;


  if (
    newStatus === currentStatus
  ) {

    return;
  }


  const { error } =
    await supabaseClient
      .from("appointments")
      .update({
        status: newStatus
      })
      .eq("id", id);


  if (error) {

    console.error(
      "Gabim gjatë ndryshimit të statusit:",
      error
    );


    alert(

      "Statusi nuk u ndryshua.\n\n" +

      "CODE: " +
      (error.code || "N/A") +

      "\n\n" +

      (error.message || "")
    );

    return;
  }


  await loadAppointments();
}


// ------------------------------------------------------
// CHANGE DATE
// ------------------------------------------------------

function changeDate(days) {

  selectedDate =
    new Date(selectedDate);

  selectedDate.setDate(
    selectedDate.getDate() + days
  );


  updateDateDisplay();

  loadAppointments();
}


// ------------------------------------------------------
// GO TO TODAY
// ------------------------------------------------------

function goToToday() {

  selectedDate =
    new Date();

  updateDateDisplay();

  loadAppointments();
}


// ------------------------------------------------------
// UPDATE DATE DISPLAY
// ------------------------------------------------------

function updateDateDisplay() {

  const dateElement =
    getElement("selectedDate");

  if (dateElement) {

    dateElement.textContent =
      formatDateDisplay(selectedDate);
  }
}


// ------------------------------------------------------
// REALTIME
// ------------------------------------------------------

function setupRealtime() {

  console.log(
    "Duke aktivizuar realtime..."
  );


  supabaseClient
    .channel("appointments-realtime")

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


// ------------------------------------------------------
// LOGIN / SESSION
// ------------------------------------------------------

async function checkSession() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(
      "Gabim gjatë kontrollit të session:",
      error
    );

    return;
  }


  if (
    data &&
    data.session
  ) {

    console.log(
      "User është i kyçur."
    );

    return true;
  }


  console.log(
    "User nuk është i kyçur."
  );

  return false;
}


// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------

async function logout() {

  const { error } =
    await supabaseClient.auth.signOut();


  if (error) {

    console.error(
      "Gabim gjatë logout:",
      error
    );

    return;
  }


  window.location.reload();
}


// ------------------------------------------------------
// INITIALIZE APP
// ------------------------------------------------------

async function initApp() {

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


  updateDateDisplay();


  const loggedIn =
    await checkSession();


  if (!loggedIn) {

    console.log(
      "Nuk ka session aktiv."
    );
  }


  await loadAppointments();


  setupRealtime();
}


// ------------------------------------------------------
// AUTH STATE CHANGE
// ------------------------------------------------------

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

  }
);


// ------------------------------------------------------
// START APP
// ------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initApp();

  }
);
