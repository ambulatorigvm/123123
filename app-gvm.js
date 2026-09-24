const APP_VERSION = "GVM-20260924-16";

const SUPABASE_URL = "https://ubpteaqdkxcriqyaxrux.supabase.co";
const SUPABASE_KEY = "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient = null;
let currentUser = null;
let currentDate = new Date();
let appointments = [];
let patients = [];
let realtimeChannel = null;
let patientsRealtimeChannel = null;
let currentView = "appointments";
let patientSearchTerm = "";

(function startAmbulatoriGVM() {
    console.log("AMBULATORI GVM", APP_VERSION);

    if (!window.supabase) {
        showFatalError("Supabase nuk u ngarkua. Kontrollo lidhjen me internetin.");
        return;
    }

    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (error) {
        console.error("SUPABASE INIT ERROR:", error);
        showFatalError("Gabim gjatë lidhjes me Supabase.");
        return;
    }

    checkSession();
})();

function showFatalError(message) {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
        <div class="fatal-error">
            <div class="fatal-box">
                <div style="font-size:48px;margin-bottom:15px;">🏥</div>
                <h2>Gabim në sistem</h2>
                <p>${escapeHtml(message)}</p>
                <p>Kontrollo Console me F12 nëse problemi vazhdon.</p>
            </div>
        </div>
    `;
}

async function checkSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("GET SESSION ERROR:", error);
            showLogin();
            return;
        }

        currentUser = data.session ? data.session.user : null;

        if (currentUser) {
            showApp();
        } else {
            showLogin();
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);
            currentUser = session ? session.user : null;

            if (currentUser) {
                showApp();
            } else {
                cleanupRealtime();
                showLogin();
            }
        });
    } catch (error) {
        console.error("SESSION ERROR:", error);
        showLogin();
    }
}

function showLogin() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="login-page">
            <div class="login-box">
                <div class="login-logo"><span>GVM</span></div>
                <div style="font-size:42px;margin-bottom:10px;">🏥</div>
                <h1 class="login-title">AMBULATORI GVM</h1>
                <div class="login-subtitle">Sistemi i menaxhimit të vizitave</div>

                <form id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input id="loginEmail" type="email" autocomplete="username" placeholder="Email" required>
                    </div>

                    <div class="form-group">
                        <label for="loginPassword">Fjalëkalimi</label>
                        <input id="loginPassword" type="password" autocomplete="current-password" placeholder="Fjalëkalimi" required>
                    </div>

                    <button type="submit" class="login-button">Hyr në sistem</button>
                    <div id="loginError" class="error-message"></div>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await login();
        });
    }
}

async function login() {
    const emailElement = document.getElementById("loginEmail");
    const passwordElement = document.getElementById("loginPassword");
    const errorElement = document.getElementById("loginError");

    if (!emailElement || !passwordElement) return;

    const email = emailElement.value.trim();
    const password = passwordElement.value;

    if (!email || !password) {
        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.textContent = "Plotëso email dhe fjalëkalimin.";
        }
        return;
    }

    try {
        if (errorElement) errorElement.style.display = "none";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("LOGIN ERROR:", error);
            if (errorElement) {
                errorElement.style.display = "block";
                errorElement.textContent = error.message || "Email ose fjalëkalim i gabuar.";
            }
            return;
        }

        currentUser = data.user || null;
        if (currentUser) showApp();
    } catch (error) {
        console.error("LOGIN EXCEPTION:", error);
        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.textContent = "Ndodhi një gabim gjatë hyrjes.";
        }
    }
}

async function logout() {
    try {
        cleanupRealtime();
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
    }
}

function cleanupRealtime() {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    if (patientsRealtimeChannel) {
        supabaseClient.removeChannel(patientsRealtimeChannel);
        patientsRealtimeChannel = null;
    }
}

function showApp() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <header class="app-header">
            <div class="header-inner">
                <div class="brand">
                    <div class="brand-icon">GVM</div>
                    <div>
                        <h1>AMBULATORI GVM</h1>
                        <small>Menaxhimi i pacientëve dhe vizitave</small>
                    </div>
                </div>

                <div class="header-actions">
                    <div class="online-indicator"><span></span>Online</div>
                    <span id="userEmail" class="user-email"></span>
                    <button id="logoutButton" class="logout-button" type="button">Dil</button>
                </div>
            </div>
        </header>

        <main class="main-container">
            <div id="appMessage" class="app-message"></div>

            <nav class="main-navigation">
                <button id="navAppointments" class="nav-button active" type="button">📅 Vizitat</button>
                <button id="navPatients" class="nav-button" type="button">👤 Pacientët</button>
            </nav>

            <section id="appointmentsView">
                <div class="page-title">
                    <div>
                        <div class="section-kicker">PANELI I AMBULATORIT</div>
                        <h2>Orari i vizitave</h2>
                    </div>

                    <div class="date-controls">
                        <button id="previousDay" class="date-button" type="button">←</button>
                        <div id="currentDate" class="current-date"></div>
                        <button id="nextDay" class="date-button" type="button">→</button>
                        <button id="todayButton" class="date-button today-button" type="button">Sot</button>
                    </div>
                </div>

                <section class="dashboard-summary">
                    <div class="summary-card"><div class="summary-icon">📋</div><div><span>Vizita gjithsej</span><strong id="totalAppointments">0</strong></div></div>
                    <div class="summary-card"><div class="summary-icon">🕐</div><div><span>Të planifikuara</span><strong id="plannedAppointments">0</strong></div></div>
                    <div class="summary-card"><div class="summary-icon">✓</div><div><span>Përfunduar</span><strong id="finishedAppointments">0</strong></div></div>
                    <div class="summary-card"><div class="summary-icon">⏱</div><div><span>Mbërritur</span><strong id="arrivedAppointments">0</strong></div></div>
                </section>

                <section class="appointment-card">
                    <div class="card-heading">
                        <div><span class="card-kicker">REGJISTRIM I RI</span><h3>Shto vizitë të re</h3></div>
                        <div class="medical-cross">+</div>
                    </div>

                    <form id="appointmentForm" class="appointment-form">
                        <div class="form-group">
                            <label for="patientName">Emri dhe mbiemri</label>
                            <input id="patientName" type="text" placeholder="Emri i pacientit" required>
                        </div>
                        <div class="form-group">
                            <label for="patientPhone">Telefoni</label>
                            <input id="patientPhone" type="text" placeholder="Numri i telefonit">
                        </div>
                        <div class="form-group">
                            <label for="appointmentTime">Ora</label>
                            <select id="appointmentTime" required></select>
                        </div>
                        <div class="form-group">
                            <label for="appointmentNote">Shënim</label>
                            <input id="appointmentNote" type="text" placeholder="Shënim për vizitën">
                        </div>
                        <button class="add-button" type="submit"><span>+</span>Shto vizitë</button>
                    </form>
                </section>

                <section class="schedule-card">
                    <div class="schedule-header">
                        <div><span class="card-kicker">PROGRAMI DITOR</span><h3>Orari ditor</h3></div>
                        <div class="schedule-header-right">
                            <div class="working-hours">🕐 08:00 — 18:00</div>
                            <div id="scheduleInfo" class="schedule-info">0 vizita</div>
                        </div>
                    </div>

                    <div class="schedule-table-wrapper">
                        <table class="schedule-table">
                            <thead>
                                <tr>
                                    <th>Ora</th><th>Pacienti</th><th>Telefoni</th><th>Shënimi</th><th>Statusi</th><th>Veprime</th>
                                </tr>
                            </thead>
                            <tbody id="scheduleBody">
                                <tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Po ngarkohet orari...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>

            <section id="patientsView" class="patients-view" style="display:none;">
                <div class="page-title">
                    <div><div class="section-kicker">REGJISTRI MJEKËSOR</div><h2>Pacientët</h2></div>
                    <button id="newPatientButton" class="add-button patient-top-button" type="button"><span>+</span>Shto pacient</button>
                </div>

                <section class="patients-toolbar">
                    <div class="patient-search-wrap">
                        <span class="patient-search-icon">🔎</span>
                        <input id="patientSearch" class="patient-search" type="search" placeholder="Kërko me nr. kartelë, emër ose telefon..." autocomplete="off">
                    </div>
                    <div id="patientsCount" class="patients-count">0 pacientë</div>
                </section>

                <section class="schedule-card patients-card">
                    <div class="schedule-table-wrapper">
                        <table class="schedule-table patients-table">
                            <thead>
                                <tr>
                                    <th>Pacienti</th><th>Telefoni</th><th>Datëlindja</th><th>Kodi i kartelës</th><th>Shënime</th><th>Veprime</th>
                                </tr>
                            </thead>
                            <tbody id="patientsBody">
                                <tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Po ngarkohen pacientët...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>
        </main>

        <div id="patientModal" class="patient-modal" aria-hidden="true">
            <div class="patient-modal-backdrop" data-close-patient-modal></div>
            <div class="patient-modal-box" role="dialog" aria-modal="true">
                <div class="patient-modal-header">
                    <div><span class="card-kicker">KARTELA E PACIENTIT</span><h3 id="patientModalTitle">Shto pacient</h3></div>
                    <button id="closePatientModal" class="modal-close" type="button" aria-label="Mbyll">×</button>
                </div>
                <form id="patientForm" class="patient-form">
                    <input id="patientId" type="hidden">
                    <div class="form-group"><label for="patientFullName">Emri dhe mbiemri *</label><input id="patientFullName" type="text" required></div>
                    <div class="form-group"><label for="patientRecordPhone">Telefoni</label><input id="patientRecordPhone" type="text"></div>
                    <div class="form-group"><label for="patientBirthDate">Datëlindja</label><input id="patientBirthDate" type="date"></div>
                    <div class="form-group"><label for="patientPersonalId">Nr. personal / ID</label><input id="patientPersonalId" type="text"></div>
                    <div class="form-group patient-full-width"><label for="patientAddress">Adresa</label><input id="patientAddress" type="text"></div>
                    <div class="form-group patient-full-width"><label for="patientNotes">Shënime</label><textarea id="patientNotes" rows="4"></textarea></div>
                    <div class="patient-form-actions">
                        <button id="cancelPatientButton" class="modal-secondary-button" type="button">Anulo</button>
                        <button class="add-button" type="submit">Ruaj pacientin</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    injectPatientStyles();

    const userEmail = document.getElementById("userEmail");
    if (userEmail) userEmail.textContent = currentUser?.email || "";

    document.getElementById("logoutButton")?.addEventListener("click", logout);
    document.getElementById("navAppointments")?.addEventListener("click", showAppointmentsView);
    document.getElementById("navPatients")?.addEventListener("click", showPatientsView);

    document.getElementById("previousDay")?.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadAppointments();
    });

    document.getElementById("nextDay")?.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadAppointments();
    });

    document.getElementById("todayButton")?.addEventListener("click", () => {
        currentDate = new Date();
        updateDateDisplay();
        loadAppointments();
    });

    document.getElementById("appointmentForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        await addAppointment();
    });

    document.getElementById("newPatientButton")?.addEventListener("click", () => openPatientModal());
    document.getElementById("closePatientModal")?.addEventListener("click", closePatientModalWindow);
    document.getElementById("cancelPatientButton")?.addEventListener("click", closePatientModalWindow);

    document.querySelectorAll("[data-close-patient-modal]").forEach(el => {
        el.addEventListener("click", closePatientModalWindow);
    });

    document.getElementById("patientForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        await savePatient();
    });

    document.getElementById("patientSearch")?.addEventListener("input", (event) => {
        patientSearchTerm = event.target.value || "";
        renderPatients();
    });

    populateTimeSelect();
    updateDateDisplay();
    setupRealtime();
    setupPatientsRealtime();
    loadAppointments();
}

function showAppointmentsView() {
    currentView = "appointments";
    document.getElementById("appointmentsView").style.display = "";
    document.getElementById("patientsView").style.display = "none";
    document.getElementById("navAppointments").classList.add("active");
    document.getElementById("navPatients").classList.remove("active");
    updateDateDisplay();
    loadAppointments();
}

function showPatientsView() {
    currentView = "patients";
    document.getElementById("appointmentsView").style.display = "none";
    document.getElementById("patientsView").style.display = "";
    document.getElementById("navAppointments").classList.remove("active");
    document.getElementById("navPatients").classList.add("active");
    loadPatients();
}

function updateDateDisplay() {
    const element = document.getElementById("currentDate");
    if (!element) return;

    element.textContent = currentDate.toLocaleDateString("sq-AL", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function populateTimeSelect() {
    const select = document.getElementById("appointmentTime");
    if (!select) return;

    select.innerHTML = `<option value="">Zgjidh orën</option>`;

    for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === 18 && minute > 0) continue;
            const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            const option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            select.appendChild(option);
        }
    }
}

function generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === 18 && minute > 0) continue;
            slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
        }
    }
    return slots;
}

async function loadAppointments() {
    const body = document.getElementById("scheduleBody");
    if (!body) return;

    body.innerHTML = `<tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Po ngarkohet orari...</td></tr>`;

    const dateString = formatDateForDatabase(currentDate);

    try {
        const { data, error } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("appointment_date", dateString)
            .order("appointment_time", { ascending: true });

        if (error) {
            console.error("LOAD APPOINTMENTS ERROR:", error);
            body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Nuk u ngarkuan vizitat: ${escapeHtml(error.message)}</td></tr>`;
            return;
        }

        appointments = data || [];
        renderAppointments();
    } catch (error) {
        console.error("LOAD APPOINTMENTS EXCEPTION:", error);
        body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Gabim gjatë ngarkimit të orarit.</td></tr>`;
    }
}

function renderAppointments() {
    const body = document.getElementById("scheduleBody");
    const info = document.getElementById("scheduleInfo");
    if (!body) return;

    const appointmentMap = {};
    appointments.forEach(appointment => {
        appointmentMap[normalizeTime(appointment.appointment_time)] = appointment;
    });

    body.innerHTML = "";
    let occupiedCount = 0;

    generateTimeSlots().forEach(time => {
        const appointment = appointmentMap[time];
        if (appointment) occupiedCount++;

        const tr = document.createElement("tr");
        tr.className = appointment ? "appointment-row occupied" : "appointment-row";

        if (!appointment) {
            tr.innerHTML = `
                <td class="time-cell"><strong>${time}</strong></td>
                <td><span class="empty-slot">E lirë</span></td>
                <td><span class="muted-text">—</span></td>
                <td><span class="muted-text">—</span></td>
                <td><span class="muted-text">—</span></td>
                <td>
                    <button type="button" class="action-button quick-add-button">+ Shto</button>
                </td>
            `;
            tr.querySelector(".quick-add-button")?.addEventListener("click", () => {
                const timeSelect = document.getElementById("appointmentTime");
                const patientInput = document.getElementById("patientName");
                if (timeSelect) timeSelect.value = time;
                patientInput?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        } else {
            const name = appointment.patient_name || "Pa emër";
            const phone = appointment.patient_phone || "—";
            const note = appointment.note || "—";
            const status = appointment.status || "planned";

            tr.innerHTML = `
                <td class="time-cell"><strong>${escapeHtml(time)}</strong></td>
                <td>
                    <div class="schedule-patient">
                        <div class="mini-avatar">${escapeHtml(getInitials(name))}</div>
                        <div><strong>${escapeHtml(name)}</strong></div>
                    </div>
                </td>
                <td>${escapeHtml(phone)}</td>
                <td><span class="note-text">${escapeHtml(note)}</span></td>
                <td>
                    <span class="status ${statusClass(status)}">
                        <span class="status-dot"></span>
                        ${escapeHtml(statusText(status))}
                    </span>
                </td>
                <td>
                    <div class="appointment-actions">
                        <button type="button" class="action-button status-action">${escapeHtml(nextStatusButtonText(status))}</button>
                        ${status !== "cancelled" ? `<button type="button" class="action-button action-cancel">× Anulo</button>` : ""}
                        <button type="button" class="action-button action-delete">🗑 Fshi</button>
                    </div>
                </td>
            `;

            tr.querySelector(".status-action")?.addEventListener("click", () => changeAppointmentStatus(appointment));
            tr.querySelector(".action-cancel")?.addEventListener("click", () => updateAppointmentStatus(appointment.id, "cancelled"));
            tr.querySelector(".action-delete")?.addEventListener("click", () => deleteAppointment(appointment.id));
        }

        body.appendChild(tr);
    });

    if (info) {
        info.textContent = `${occupiedCount} ${occupiedCount === 1 ? "vizitë" : "vizita"}`;
    }

    updateDashboardCounters();
}

async function addAppointment() {
    const nameElement = document.getElementById("patientName");
    const phoneElement = document.getElementById("patientPhone");
    const timeElement = document.getElementById("appointmentTime");
    const noteElement = document.getElementById("appointmentNote");

    if (!nameElement || !timeElement) return;

    const patientName = nameElement.value.trim();
    const patientPhone = phoneElement?.value.trim() || "";
    const appointmentTime = timeElement.value;
    const note = noteElement?.value.trim() || "";

    if (!patientName) {
        showMessage("Vendos emrin e pacientit.", "error");
        return;
    }

    if (!appointmentTime) {
        showMessage("Zgjidh orën e vizitës.", "error");
        return;
    }

    if (appointments.some(a => normalizeTime(a.appointment_time) === normalizeTime(appointmentTime))) {
        showMessage(`Ora ${appointmentTime} është tashmë e zënë.`, "error");
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("appointments")
            .insert([{
                patient_name: patientName,
                patient_phone: patientPhone,
                appointment_date: formatDateForDatabase(currentDate),
                appointment_time: appointmentTime,
                note,
                status: "planned"
            }])
            .select()
            .single();

        if (error) {
            console.error("ADD APPOINTMENT ERROR:", error);
            showMessage("Vizita nuk u shtua: " + error.message, "error");
            return;
        }

        appointments.push(data);
        appointments.sort((a, b) => normalizeTime(a.appointment_time).localeCompare(normalizeTime(b.appointment_time)));

        nameElement.value = "";
        if (phoneElement) phoneElement.value = "";
        if (noteElement) noteElement.value = "";
        timeElement.value = "";

        renderAppointments();
        showMessage("Vizita u shtua me sukses.", "success");
    } catch (error) {
        console.error("ADD APPOINTMENT EXCEPTION:", error);
        showMessage("Gabim gjatë shtimit të vizitës.", "error");
    }
}

async function changeAppointmentStatus(appointment) {
    const nextStatus = getNextStatus(appointment.status || "planned");
    await updateAppointmentStatus(appointment.id, nextStatus);
}

async function updateAppointmentStatus(id, status) {
    try {
        const { data, error } = await supabaseClient
            .from("appointments")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("UPDATE STATUS ERROR:", error);
            showMessage("Statusi nuk u përditësua: " + error.message, "error");
            return;
        }

        appointments = appointments.map(item => item.id === data.id ? data : item);
        renderAppointments();
        showMessage("Statusi u përditësua me sukses.", "success");
    } catch (error) {
        console.error("UPDATE STATUS EXCEPTION:", error);
        showMessage("Gabim gjatë përditësimit të statusit.", "error");
    }
}

async function deleteAppointment(id) {
    const appointment = appointments.find(item => item.id === id);
    if (!appointment) return;

    const confirmed = window.confirm(
        `A je i sigurt që dëshiron të fshish vizitën e "${appointment.patient_name || "pacientit"}" në orën ${normalizeTime(appointment.appointment_time)}?`
    );

    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("appointments")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("DELETE APPOINTMENT ERROR:", error);
            showMessage("Vizita nuk u fshi: " + error.message, "error");
            return;
        }

        appointments = appointments.filter(item => item.id !== id);
        renderAppointments();
        showMessage("Vizita u fshi.", "success");
    } catch (error) {
        console.error("DELETE APPOINTMENT EXCEPTION:", error);
        showMessage("Gabim gjatë fshirjes së vizitës.", "error");
    }
}

function updateDashboardCounters() {
    const total = appointments.length;
    const planned = appointments.filter(a => a.status === "planned").length;
    const finished = appointments.filter(a => a.status === "finished").length;
    const arrived = appointments.filter(a => a.status === "arrived").length;

    const totalElement = document.getElementById("totalAppointments");
    const plannedElement = document.getElementById("plannedAppointments");
    const finishedElement = document.getElementById("finishedAppointments");
    const arrivedElement = document.getElementById("arrivedAppointments");

    if (totalElement) totalElement.textContent = total;
    if (plannedElement) plannedElement.textContent = planned;
    if (finishedElement) finishedElement.textContent = finished;
    if (arrivedElement) arrivedElement.textContent = arrived;
}

function statusText(status) {
    switch (status) {
        case "arrived": return "Mbërritur";
        case "finished": return "Përfunduar";
        case "cancelled": return "Anuluar";
        default: return "Planifikuar";
    }
}

function statusClass(status) {
    switch (status) {
        case "arrived": return "status-arrived";
        case "finished": return "status-finished";
        case "cancelled": return "status-cancelled";
        default: return "status-planned";
    }
}

function getNextStatus(status) {
    switch (status) {
        case "planned": return "arrived";
        case "arrived": return "finished";
        case "finished": return "planned";
        case "cancelled": return "planned";
        default: return "planned";
    }
}

function nextStatusButtonText(status) {
    switch (status) {
        case "planned": return "✓ Mbërriti";
        case "arrived": return "✓ Përfundoi";
        case "finished": return "↻ Planifiko";
        case "cancelled": return "↻ Aktivizo";
        default: return "✓ Mbërriti";
    }
}

async function loadPatients() {
    const body = document.getElementById("patientsBody");
    if (!body) return;

    body.innerHTML = `<tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Po ngarkohen pacientët...</td></tr>`;

    try {
        const { data, error } = await supabaseClient
            .from("patients")
            .select("*")
            .order("full_name", { ascending: true });

        if (error) {
            console.error("LOAD PATIENTS ERROR:", error);
            body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Nuk u ngarkuan pacientët: ${escapeHtml(error.message)}</td></tr>`;
            return;
        }

        patients = data || [];
        renderPatients();
    } catch (error) {
        console.error("LOAD PATIENTS EXCEPTION:", error);
        body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Gabim gjatë ngarkimit të pacientëve.</td></tr>`;
    }
}

function renderPatients() {
    const body = document.getElementById("patientsBody");
    const countElement = document.getElementById("patientsCount");
    if (!body) return;

    const search = patientSearchTerm.trim().toLowerCase();

    const filtered = patients.filter(patient => {
        if (!search) return true;

        return [
            patient.full_name,
            patient.phone,
            patient.personal_id,
            patient.address,
            patient.notes
        ].filter(value => value !== null && value !== undefined)
         .some(value => String(value).toLowerCase().includes(search));
    });

    if (countElement) {
        countElement.textContent = `${filtered.length} ${filtered.length === 1 ? "pacient" : "pacientë"}`;
    }

    body.innerHTML = "";

    if (!filtered.length) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-day-cell">
                    <div class="empty-day">
                        <div class="empty-day-icon">👤</div>
                        <h4>${search ? "Nuk u gjet asnjë pacient" : "Nuk ka ende pacientë"}</h4>
                        <p>${search ? "Provo numrin e kartelës, emrin ose telefonin." : "Kliko “Shto pacient” për të regjistruar pacientin e parë."}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(patient => body.appendChild(renderPatientRow(patient)));
}

function renderPatientRow(patient) {
    const tr = document.createElement("tr");
    const name = patient.full_name || "Pa emër";
    const phone = patient.phone || "—";
    const birthDate = patient.birth_date ? formatPatientBirthDate(patient.birth_date) : "—";
    const personalId = patient.personal_id || "—";
    const notes = patient.notes || "—";

    tr.className = "appointment-row";
    tr.innerHTML = `
        <td class="patient-cell">
            <div class="patient-main">
                <div class="patient-avatar">${escapeHtml(getInitials(name))}</div>
                <div class="patient-details">
                    <strong>${escapeHtml(name)}</strong>
                    <span>Emri i pacientit</span>
                </div>
            </div>
        </td>
        <td class="phone-cell">
            ${phone !== "—"
                ? `<a href="tel:${escapeHtml(phone)}" class="phone-link"><span>☎</span>${escapeHtml(phone)}</a>`
                : `<span class="muted-text">—</span>`}
        </td>
        <td>${escapeHtml(birthDate)}</td>
        <td><span class="patient-id-badge">${escapeHtml(personalId)}</span></td>
        <td><span class="note-text" title="${escapeHtml(notes)}">${escapeHtml(notes)}</span></td>
        <td>
            <div class="appointment-actions">
                <button type="button" class="action-button patient-view-button">👁 Hap</button>
                <button type="button" class="action-button patient-edit-button">✏ Ndrysho</button>
                <button type="button" class="action-button action-delete">🗑 Fshi</button>
            </div>
        </td>
    `;

    tr.querySelector(".patient-view-button")?.addEventListener("click", () => viewPatient(patient.id));
    tr.querySelector(".patient-edit-button")?.addEventListener("click", () => openPatientModal(patient));
    tr.querySelector(".action-delete")?.addEventListener("click", () => deletePatient(patient.id));

    return tr;
}

function openPatientModal(patient = null) {
    const modal = document.getElementById("patientModal");
    const title = document.getElementById("patientModalTitle");
    const id = document.getElementById("patientId");
    const name = document.getElementById("patientFullName");
    const phone = document.getElementById("patientRecordPhone");
    const birth = document.getElementById("patientBirthDate");
    const personal = document.getElementById("patientPersonalId");
    const address = document.getElementById("patientAddress");
    const notes = document.getElementById("patientNotes");

    if (!modal) return;

    if (patient) {
        if (title) title.textContent = "Ndrysho pacientin";
        if (id) id.value = patient.id || "";
        if (name) name.value = patient.full_name || "";
        if (phone) phone.value = patient.phone || "";
        if (birth) birth.value = patient.birth_date || "";
        if (personal) personal.value = patient.personal_id || "";
        if (address) address.value = patient.address || "";
        if (notes) notes.value = patient.notes || "";
    } else {
        if (title) title.textContent = "Shto pacient";
        if (id) id.value = "";
        if (name) name.value = "";
        if (phone) phone.value = "";
        if (birth) birth.value = "";
        if (personal) personal.value = "";
        if (address) address.value = "";
        if (notes) notes.value = "";
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => name?.focus(), 50);
}

function closePatientModalWindow() {
    const modal = document.getElementById("patientModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

async function savePatient() {
    const id = document.getElementById("patientId")?.value.trim() || "";
    const fullName = document.getElementById("patientFullName")?.value.trim() || "";
    const phone = document.getElementById("patientRecordPhone")?.value.trim() || "";
    const birthDate = document.getElementById("patientBirthDate")?.value || null;
    const personalId = document.getElementById("patientPersonalId")?.value.trim() || "";
    const address = document.getElementById("patientAddress")?.value.trim() || "";
    const notes = document.getElementById("patientNotes")?.value.trim() || "";

    if (!fullName) {
        showMessage("Vendos emrin e pacientit.", "error");
        return;
    }

    const payload = {
        full_name: fullName,
        phone,
        birth_date: birthDate,
        personal_id: personalId,
        address,
        notes,
        updated_at: new Date().toISOString()
    };

    try {
        let result;

        if (id) {
            result = await supabaseClient
                .from("patients")
                .update(payload)
                .eq("id", id)
                .select()
                .single();
        } else {
            result = await supabaseClient
                .from("patients")
                .insert([payload])
                .select()
                .single();
        }

        if (result.error) {
            console.error("SAVE PATIENT ERROR:", result.error);
            showMessage("Pacienti nuk u ruajt: " + result.error.message, "error");
            return;
        }

        const saved = result.data;

        if (id) {
            patients = patients.map(patient => patient.id === saved.id ? saved : patient);
        } else {
            patients.push(saved);
        }

        patients.sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || ""), "sq"));
        renderPatients();
        closePatientModalWindow();

        showMessage(id ? "Pacienti u përditësua." : "Pacienti u shtua me sukses.", "success");
    } catch (error) {
        console.error("SAVE PATIENT EXCEPTION:", error);
        showMessage("Gabim gjatë ruajtjes së pacientit.", "error");
    }
}

async function deletePatient(id) {
    const patient = patients.find(item => item.id === id);
    if (!patient) return;

    const confirmed = window.confirm(`A je i sigurt që dëshiron të fshish pacientin "${patient.full_name}"?`);
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("patients")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("DELETE PATIENT ERROR:", error);
            showMessage("Pacienti nuk u fshi: " + error.message, "error");
            return;
        }

        patients = patients.filter(item => item.id !== id);
        renderPatients();
        showMessage("Pacienti u fshi.", "success");
    } catch (error) {
        console.error("DELETE PATIENT EXCEPTION:", error);
        showMessage("Gabim gjatë fshirjes së pacientit.", "error");
    }
}

async function viewPatient(id) {
    const patient = patients.find(item => item.id === id);
    if (!patient) return;

    let history = [];
    let historyError = null;

    try {
        const result = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("patient_name", patient.full_name)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false });

        history = result.data || [];
        historyError = result.error;
    } catch (error) {
        historyError = error;
    }

    const modal = document.getElementById("patientModal");
    const title = document.getElementById("patientModalTitle");
    const form = document.getElementById("patientForm");

    if (!modal || !form) return;

    title.textContent = "Kartela e pacientit";

    const historyHtml = historyError
        ? `<div class="patient-history-empty">Historiku nuk u lexua: ${escapeHtml(historyError.message || "Gabim")}</div>`
        : history.length
            ? history.map(item => `
                <div class="patient-history-item">
                    <div>
                        <strong>${escapeHtml(formatDateDisplay(item.appointment_date))} — ${escapeHtml(normalizeTime(item.appointment_time))}</strong>
                        <span>${escapeHtml(statusText(item.status || "planned"))}</span>
                    </div>
                    <div><strong>${escapeHtml(item.patient_phone || "—")}</strong></div>
                    <div class="patient-history-note">${escapeHtml(item.note || "Pa shënim")}</div>
                </div>
            `).join("")
            : `<div class="patient-history-empty">Nuk ka vizita të regjistruara për këtë pacient.</div>`;

    form.innerHTML = `
        <div class="patient-profile">
            <div class="patient-profile-avatar">${escapeHtml(getInitials(patient.full_name))}</div>
            <div>
                <h4>${escapeHtml(patient.full_name || "Pa emër")}</h4>
                <p>Kodi i kartelës: <strong>${escapeHtml(patient.personal_id || "—")}</strong></p>
            </div>
        </div>

        <div class="patient-detail-grid">
            <div><span>Telefon</span><strong>${escapeHtml(patient.phone || "—")}</strong></div>
            <div><span>Datëlindja</span><strong>${escapeHtml(patient.birth_date ? formatPatientBirthDate(patient.birth_date) : "—")}</strong></div>
            <div><span>Nr. personal / ID</span><strong>${escapeHtml(patient.personal_id || "—")}</strong></div>
            <div><span>Adresa</span><strong>${escapeHtml(patient.address || "—")}</strong></div>
            <div><span>Shënime</span><strong>${escapeHtml(patient.notes || "—")}</strong></div>
        </div>

        <div class="patient-history">
            <div class="patient-history-title">
                <span class="card-kicker">HISTORIKU</span>
                <h4>Vizitat e pacientit</h4>
            </div>
            <div class="patient-history-list">${historyHtml}</div>
        </div>

        <div class="patient-form-actions">
            <button id="viewPatientEditButton" class="modal-secondary-button" type="button">✏ Ndrysho</button>
            <button id="viewPatientCloseButton" class="add-button" type="button">Mbyll</button>
        </div>
    `;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.getElementById("viewPatientCloseButton")?.addEventListener("click", closePatientModalWindow);
    document.getElementById("viewPatientEditButton")?.addEventListener("click", () => {
        closePatientModalWindow();
        openPatientModal(patient);
    });
}

function setupRealtime() {
    if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);

    realtimeChannel = supabaseClient
        .channel("appointments-realtime")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "appointments"
        }, () => {
            loadAppointments();
        })
        .subscribe(status => {
            console.log("Realtime status:", status);
        });
}

function setupPatientsRealtime() {
    if (patientsRealtimeChannel) supabaseClient.removeChannel(patientsRealtimeChannel);

    patientsRealtimeChannel = supabaseClient
        .channel("patients-realtime")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "patients"
        }, () => {
            if (currentView === "patients") loadPatients();
        })
        .subscribe(status => {
            console.log("Patients realtime status:", status);
        });
}

function formatDateForDatabase(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(value) {
    if (!value) return "—";
    try {
        return new Date(`${value}T00:00:00`).toLocaleDateString("sq-AL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    } catch {
        return value;
    }
}

function formatPatientBirthDate(value) {
    return formatDateDisplay(value);
}

function normalizeTime(value) {
    if (!value) return "";
    return String(value).substring(0, 5);
}

function getInitials(name) {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(message, type = "success") {
    const element = document.getElementById("appMessage");
    if (!element) return;

    element.textContent = message;
    element.className = `app-message show ${type}`;

    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
        element.className = "app-message";
        element.textContent = "";
    }, 3500);
}

function injectPatientStyles() {
    if (document.getElementById("gvmPatientStyles")) return;

    const style = document.createElement("style");
    style.id = "gvmPatientStyles";

    style.textContent = `
        .main-navigation {
            display:flex;
            gap:8px;
            margin:0 0 22px;
        }

        .nav-button {
            border:1px solid #d8e3e6;
            background:#fff;
            color:#53666d;
            border-radius:10px;
            padding:11px 18px;
            font-weight:800;
            cursor:pointer;
        }

        .nav-button.active {
            background:#0f766e;
            color:#fff;
            border-color:#0f766e;
        }

        .patients-toolbar {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            margin-bottom:14px;
        }

        .patient-search-wrap {
            position:relative;
            width:100%;
            max-width:560px;
        }

        .patient-search-icon {
            position:absolute;
            left:14px;
            top:50%;
            transform:translateY(-50%);
        }

        .patient-search {
            width:100%;
            min-height:44px;
            padding:0 14px 0 42px;
            border:1px solid #d6e0e3;
            border-radius:10px;
            outline:none;
            box-sizing:border-box;
        }

        .patient-search:focus {
            border-color:#0f766e;
            box-shadow:0 0 0 3px rgba(15,118,110,.10);
        }

        .patients-count {
            color:#718188;
            font-size:13px;
            font-weight:800;
            white-space:nowrap;
        }

        .patient-id-badge {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:54px;
            padding:5px 9px;
            border-radius:8px;
            background:#edf7f6;
            color:#0f766e;
            font-size:12px;
            font-weight:900;
        }

        .patient-modal {
            position:fixed;
            inset:0;
            z-index:1000;
            display:none;
            align-items:center;
            justify-content:center;
            padding:20px;
        }

        .patient-modal.open {
            display:flex;
        }

        .patient-modal-backdrop {
            position:absolute;
            inset:0;
            background:rgba(15,23,42,.48);
        }

        .patient-modal-box {
            position:relative;
            z-index:1;
            width:min(760px,100%);
            max-height:90vh;
            overflow:auto;
            background:#fff;
            border-radius:16px;
            box-shadow:0 25px 70px rgba(15,23,42,.25);
        }

        .patient-modal-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:20px 24px;
            border-bottom:1px solid #e7edef;
        }

        .patient-modal-header h3 {
            margin:4px 0 0;
            color:#263c43;
        }

        .modal-close {
            width:38px;
            height:38px;
            border:0;
            border-radius:9px;
            background:#f3f6f7;
            color:#52656d;
            font-size:25px;
            cursor:pointer;
        }

        .modal-close:hover {
            background:#e8eef0;
        }

        .patient-form {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:16px;
            padding:24px;
        }

        .patient-full-width,
        .patient-form-actions {
            grid-column:1 / -1;
        }

        .patient-form textarea {
            width:100%;
            resize:vertical;
            min-height:100px;
            box-sizing:border-box;
        }

        .patient-form-actions {
            display:flex;
            justify-content:flex-end;
            gap:10px;
            margin-top:8px;
        }

        .modal-secondary-button {
            min-height:42px;
            padding:0 18px;
            border:1px solid #d5dfe3;
            border-radius:9px;
            background:#fff;
            color:#52656d;
            font-weight:800;
            cursor:pointer;
        }

        .modal-secondary-button:hover {
            background:#f5f8f9;
        }

        .patient-profile {
            display:flex;
            align-items:center;
            gap:15px;
            grid-column:1 / -1;
            padding:18px;
            border-radius:12px;
            background:#f5f9fa;
        }

        .patient-profile-avatar {
            display:flex;
            align-items:center;
            justify-content:center;
            width:58px;
            height:58px;
            flex:0 0 58px;
            border-radius:50%;
            background:#d9eeeb;
            color:#0f766e;
            font-size:18px;
            font-weight:900;
        }

        .patient-profile h4 {
            margin:0 0 4px;
            color:#23383f;
            font-size:18px;
        }

        .patient-profile p {
            margin:0;
            color:#718188;
            font-size:13px;
        }

        .patient-detail-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:12px;
            grid-column:1 / -1;
        }

        .patient-detail-grid > div {
            padding:14px;
            border:1px solid #e4ebed;
            border-radius:10px;
            background:#fff;
        }

        .patient-detail-grid span {
            display:block;
            margin-bottom:5px;
            color:#7a898f;
            font-size:11px;
            font-weight:800;
            text-transform:uppercase;
        }

        .patient-detail-grid strong {
            display:block;
            color:#2d4249;
            font-size:13px;
            word-break:break-word;
        }

        .patient-history {
            grid-column:1 / -1;
            margin-top:5px;
        }

        .patient-history-title {
            margin-bottom:10px;
        }

        .patient-history-title h4 {
            margin:4px 0 0;
            color:#263c43;
            font-size:16px;
        }

        .patient-history-list {
            display:flex;
            flex-direction:column;
            gap:8px;
            max-height:300px;
            overflow-y:auto;
        }

        .patient-history-item {
            display:grid;
            grid-template-columns:1.2fr .8fr 1.5fr;
            align-items:center;
            gap:12px;
            padding:12px;
            border:1px solid #e5ebed;
            border-radius:10px;
            background:#fafcfc;
        }

        .patient-history-item strong,
        .patient-history-item span {
            display:block;
        }

        .patient-history-item strong {
            color:#2c4148;
            font-size:12px;
        }

        .patient-history-item > div:first-child span {
            margin-top:3px;
            color:#78888e;
            font-size:11px;
        }

        .patient-history-note {
            color:#66777e;
            font-size:11px;
            word-break:break-word;
        }

        .patient-history-empty {
            padding:20px;
            border-radius:10px;
            background:#f7f9fa;
            color:#78888e;
            font-size:12px;
            text-align:center;
        }

        .patient-cell {
            min-width:230px;
        }

        .patient-main {
            display:flex;
            align-items:center;
            gap:10px;
        }

        .patient-avatar {
            display:flex;
            align-items:center;
            justify-content:center;
            width:36px;
            height:36px;
            flex:0 0 36px;
            border-radius:50%;
            background:#e3f2f0;
            color:#0f766e;
            font-size:11px;
            font-weight:900;
        }

        .patient-details strong {
            display:block;
            color:#2b4047;
            font-size:12px;
        }

        .patient-details span {
            display:block;
            margin-top:3px;
            color:#94a0a5;
            font-size:10px;
        }

        .phone-link {
            color:#42616a;
            text-decoration:none;
            font-size:12px;
        }

        .phone-link span {
            margin-right:5px;
        }

        .phone-link:hover {
            color:#0f766e;
        }

        .muted-text {
            color:#a0aaae;
        }

        .note-text {
            display:block;
            max-width:180px;
            overflow:hidden;
            color:#68787e;
            font-size:11px;
            text-overflow:ellipsis;
            white-space:nowrap;
        }

        .app-message {
            position:fixed;
            top:20px;
            right:20px;
            z-index:1200;
            display:none;
            max-width:420px;
            padding:13px 17px;
            border-radius:10px;
            box-shadow:0 12px 35px rgba(15,23,42,.14);
            font-size:13px;
            font-weight:700;
        }

        .app-message.show {
            display:block;
        }

        .app-message.success {
            background:#ecfdf5;
            border:1px solid #b7ead3;
            color:#087443;
        }

        .app-message.error {
            background:#fff1f2;
            border:1px solid #fecdd3;
            color:#be123c;
        }

        @media (max-width:900px) {
            .patients-toolbar {
                flex-direction:column;
                align-items:stretch;
            }

            .patient-search-wrap {
                max-width:none;
            }

            .patient-history-item {
                grid-template-columns:1fr;
            }
        }

        @media (max-width:700px) {
            .main-navigation {
                width:100%;
            }

            .nav-button {
                flex:1;
            }

            .patient-form,
            .patient-detail-grid {
                grid-template-columns:1fr;
            }

            .patient-full-width,
            .patient-form-actions {
                grid-column:auto;
            }

            .patient-modal {
                padding:10px;
            }

            .patient-modal-box {
                max-height:95vh;
                border-radius:14px;
            }

            .patient-modal-header,
            .patient-form {
                padding:17px;
            }

            .patients-table {
                min-width:850px;
            }
        }
    `;

    document.head.appendChild(style);
}
