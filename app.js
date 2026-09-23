const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let selectedDate = new Date();

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function displayDate(date) {
  return date.toLocaleDateString("sq-AL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

document.getElementById("app").innerHTML = `
  <div class="calendar">

    <h1>AMBULATORI GVM</h1>

    <div class="date-navigation">
      <button id="prevDay">← Dita para</button>

      <div>
        <h2 id="currentDate"></h2>
      </div>

      <button id="nextDay">Dita tjetër →</button>
    </div>

    <button id="todayBtn">Sot</button>

    <div class="appointment-form">

      <h3>Shto vizitë</h3>

      <input id="firstName" type="text" placeholder="Emri">

      <input id="lastName" type="text" placeholder="Mbiemri">

      <input id="cardNumber" type="text" placeholder="Nr. kartelës (opsionale)">

      <select id="appointmentTime">
        <option value="">Zgjidh orën</option>
      </select>

      <button id="addAppointment">Shto vizitën</button>

      <p id="message"></p>

    </div>

    <div id="appointments"></div>

  </div>
`;

const timeSelect = document.getElementById("appointmentTime");

function populateTimeSlots(appointments) {

  timeSelect.innerHTML = `
    <option value="">Zgjidh orën</option>
  `;

  const bookedTimes = new Set(
    appointments.map(appointment =>
      appointment.appointment_time.substring(0, 5)
    )
  );

  for (let hour = 8; hour <= 18; hour++) {

    for (let minute = 0; minute < 60; minute += 15) {

      if (hour === 18 && minute > 0) continue;

      const time =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      if (bookedTimes.has(time)) continue;

      const option = document.createElement("option");

      option.value = time;
      option.textContent = time;

      timeSelect.appendChild(option);
    }
  }


function updateDateTitle() {
  document.getElementById("currentDate").textContent =
    displayDate(selectedDate);
}

async function loadAppointments() {

  const date = formatDate(selectedDate);

  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*")
    .eq("appointment_date", date)
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error(error);
    document.getElementById("appointments").innerHTML =
      "<p>Gabim gjatë ngarkimit të vizitave.</p>";
    return;
  }

  renderAppointments(data);
populateTimeSlots(data);
}

function renderAppointments(appointments) {

  const container = document.getElementById("appointments");

  if (!appointments.length) {
    container.innerHTML = `
      <div class="empty">
        Nuk ka vizita për këtë ditë.
      </div>
    `;
    return;
  }

  container.innerHTML = appointments.map(appointment => {

    let statusText = "Planifikuar";

    if (appointment.status === "arrived") {
      statusText = "Erdhi";
    }

    if (appointment.status === "finished") {
      statusText = "Përfundoi";
    }

    if (appointment.status === "cancelled") {
      statusText = "Anulluar";
    }

    return `
      <div class="appointment ${appointment.status}">

        <div class="appointment-time">
          ${appointment.appointment_time.substring(0, 5)}
        </div>

        <div class="appointment-info">
          <strong>
            ${escapeHtml(appointment.first_name)}
            ${escapeHtml(appointment.last_name)}
          </strong>

          ${
            appointment.card_number
              ? `<small>Kartela: ${escapeHtml(appointment.card_number)}</small>`
              : ""
          }

          <span class="status">
            ${statusText}
          </span>
        </div>

        <div class="appointment-actions">

          ${
            appointment.status === "planned"
              ? `<button onclick="changeStatus('${appointment.id}', 'arrived')">
                   Erdhi
                 </button>`
              : ""
          }

          ${
            appointment.status === "arrived"
              ? `<button onclick="changeStatus('${appointment.id}', 'finished')">
                   Përfundoi
                 </button>`
              : ""
          }

          ${
            appointment.status !== "cancelled" &&
            appointment.status !== "finished"
              ? `<button onclick="changeStatus('${appointment.id}', 'cancelled')">
                   Anullo
                 </button>`
              : ""
          }

        </div>

      </div>
    `;

  }).join("");
}

async function changeStatus(id, status) {

  const { error } = await supabaseClient
    .from("appointments")
    .update({ status: status })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Nuk u ndryshua statusi.");
    return;
  }

  loadAppointments();
}

async function addAppointment() {

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const cardNumber = document.getElementById("cardNumber").value.trim();
  const appointmentTime = document.getElementById("appointmentTime").value;

  const message = document.getElementById("message");

  if (!firstName || !lastName || !appointmentTime) {
    message.textContent =
      "Plotëso emrin, mbiemrin dhe orën.";
    return;
  }

  const { error } = await supabaseClient
    .from("appointments")
    .insert({
      first_name: firstName,
      last_name: lastName,
      card_number: cardNumber || null,
      appointment_date: formatDate(selectedDate),
      appointment_time: appointmentTime,
      status: "planned"
    });

  if (error) {
    console.error(error);
    message.textContent =
      "Gabim gjatë ruajtjes së vizitës.";
    return;
  }

  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("cardNumber").value = "";
  document.getElementById("appointmentTime").value = "";

  message.textContent = "Vizita u shtua me sukses.";

  loadAppointments();
}

document.getElementById("addAppointment")
  .addEventListener("click", addAppointment);

document.getElementById("prevDay")
  .addEventListener("click", () => {

    selectedDate.setDate(selectedDate.getDate() - 1);

    updateDateTitle();
    loadAppointments();
  });

document.getElementById("nextDay")
  .addEventListener("click", () => {

    selectedDate.setDate(selectedDate.getDate() + 1);

    updateDateTitle();
    loadAppointments();
  });

document.getElementById("todayBtn")
  .addEventListener("click", () => {

    selectedDate = new Date();

    updateDateTitle();
    loadAppointments();
  });

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

updateDateTitle();
loadAppointments();

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