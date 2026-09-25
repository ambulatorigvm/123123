const APP_VERSION = "GVM-20260925-03";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient = null;
let currentUser = null;
let currentDate = new Date();
let appointments = [];
let patients = [];
let realtimeChannel = null;
let patientsRealtimeChannel = null;
let currentView = "appointments";


/* =========================================================
   START
========================================================= */

(function startAmbulatoriGVM() {

    console.log("AMBULATORI GVM", APP_VERSION);

    if (!window.supabase) {
        showFatalError(
            "Supabase nuk u ngarkua. Kontrollo lidhjen me internetin."
        );
        return;
    }

    try {

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    } catch (error) {

        console.error("SUPABASE INIT ERROR:", error);

        showFatalError(
            "Gabim gjatë lidhjes me Supabase."
        );

        return;
    }

    checkSession();

})();


/* =========================================================
   FATAL ERROR
========================================================= */

function showFatalError(message) {

    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="fatal-error">
            <div class="fatal-box">

                <div style="
                    font-size:48px;
                    margin-bottom:15px;
                ">🏥</div>

                <h2>Gabim në sistem</h2>

                <p>${escapeHtml(message)}</p>

                <p>
                    Kontrollo Console me F12 nëse problemi vazhdon.
                </p>

            </div>
        </div>
    `;
}


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "GET SESSION ERROR:",
                error
            );

            showLogin();

            return;
        }

        currentUser =
            data.session
                ? data.session.user
                : null;

        if (currentUser) {

            showApp();

        } else {

            showLogin();

        }

        supabaseClient.auth.onAuthStateChange(
            async (event, session) => {

                console.log(
                    "Auth event:",
                    event
                );

                currentUser =
                    session
                        ? session.user
                        : null;

                if (currentUser) {

                    showApp();

                } else {

                    showLogin();

                }

            }
        );

    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );

        showLogin();

    }
}


/* =========================================================
   LOGIN
========================================================= */

function showLogin() {

    const app =
        document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="login-page">

            <div class="login-box">

                <div class="login-logo">
                    <span>GVM</span>
                </div>

                <div style="
                    font-size:42px;
                    margin-bottom:10px;
                ">
                    🏥
                </div>

                <h1 class="login-title">
                    AMBULATORI GVM
                </h1>

                <div class="login-subtitle">
                    Sistemi i menaxhimit të vizitave
                </div>

                <form id="loginForm">

                    <div class="form-group">

                        <label for="loginEmail">
                            Email
                        </label>

                        <input
                            id="loginEmail"
                            type="email"
                            autocomplete="username"
                            placeholder="Email"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label for="loginPassword">
                            Fjalëkalimi
                        </label>

                        <input
                            id="loginPassword"
                            type="password"
                            autocomplete="current-password"
                            placeholder="Fjalëkalimi"
                            required
                        >

                    </div>

                    <button
                        type="submit"
                        class="login-button"
                    >
                        Hyr në sistem
                    </button>

                    <div
                        id="loginError"
                        class="error-message"
                    ></div>

                </form>

            </div>

        </div>
    `;

    const form =
        document.getElementById(
            "loginForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await login();

            }
        );

    }
}


/* =========================================================
   LOGIN ACTION
========================================================= */

async function login() {

    const emailElement =
        document.getElementById(
            "loginEmail"
        );

    const passwordElement =
        document.getElementById(
            "loginPassword"
        );

    const errorElement =
        document.getElementById(
            "loginError"
        );

    if (
        !emailElement ||
        !passwordElement
    ) {
        return;
    }

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    if (!email || !password) {

        if (errorElement) {

            errorElement.style.display =
                "block";

            errorElement.textContent =
                "Plotëso email dhe fjalëkalimin.";

        }

        return;
    }

    try {

        if (errorElement) {

            errorElement.style.display =
                "none";

        }

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email,
            password

        });

        if (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            if (errorElement) {

                errorElement.style.display =
                    "block";

                errorElement.textContent =
                    error.message ||
                    "Email ose fjalëkalim i gabuar.";

            }

            return;
        }

        currentUser =
            data.user || null;

        if (currentUser) {

            showApp();

        }

    } catch (error) {

        console.error(
            "LOGIN EXCEPTION:",
            error
        );

        if (errorElement) {

            errorElement.style.display =
                "block";

            errorElement.textContent =
                "Ndodhi një gabim gjatë hyrjes.";

        }

    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (realtimeChannel) {

            await supabaseClient
                .removeChannel(
                    realtimeChannel
                );

            realtimeChannel = null;

        }

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }
}


/* =========================================================
   MAIN APP
========================================================= */

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
                    <div class="online-indicator">
                        <span></span>
                        Online
                    </div>

                    <span id="userEmail" class="user-email"></span>

                    <button id="logoutButton" class="logout-button" type="button">
                        Dil
                    </button>
                </div>
            </div>
        </header>

        <main class="main-container">
            <div id="appMessage" class="app-message"></div>

            <nav class="main-navigation">
                <button id="navAppointments" class="nav-button active" type="button">
                    📅 Vizitat
                </button>
                <button id="navPatients" class="nav-button" type="button">
                    👤 Pacientët
                </button>
            </nav>

            <section id="appointmentsView">
                <div class="page-title">
                    <div>
                        <div class="section-kicker">PANELI I AMBULATORIT</div>
                        <h2>Orari i vizitave</h2>
                    </div>

                    <div class="date-controls">
                        <button id="previousDay" class="date-button" type="button" title="Dita e mëparshme">←</button>
                        <div id="currentDate" class="current-date"></div>
                        <button id="nextDay" class="date-button" type="button" title="Dita tjetër">→</button>
                        <button id="todayButton" class="date-button today-button" type="button">Sot</button>
                    </div>
                </div>

                <section class="dashboard-summary">
                    <div class="summary-card">
                        <div class="summary-icon">📋</div>
                        <div>
                            <span>Vizita gjithsej</span>
                            <strong id="totalAppointments">0</strong>
                        </div>
                    </div>

                    <div class="summary-card">
                        <div class="summary-icon">🕐</div>
                        <div>
                            <span>Të planifikuara</span>
                            <strong id="plannedAppointments">0</strong>
                        </div>
                    </div>

                    <div class="summary-card">
                        <div class="summary-icon">✓</div>
                        <div>
                            <span>Përfunduar</span>
                            <strong id="finishedAppointments">0</strong>
                        </div>
                    </div>

                    <div class="summary-card">
                        <div class="summary-icon">⏱</div>
                        <div>
                            <span>Mbërritur</span>
                            <strong id="arrivedAppointments">0</strong>
                        </div>
                    </div>
                </section>

                <section class="appointment-card">
                    <div class="card-heading">
                        <div>
                            <span class="card-kicker">REGJISTRIM I RI</span>
                            <h3>Shto vizitë të re</h3>
                        </div>
                        <div class="medical-cross">+</div>
                    </div>

                    <form id="appointmentForm" class="appointment-form">
                        <div class="form-group">
                            <label for="patientName">Emri dhe mbiemri</label>
                            <input id="patientName" type="text" list="patientNameList" placeholder="Shkruaj ose zgjidh pacientin" autocomplete="off" required>
                            <datalist id="patientNameList"></datalist>
                        </div>

                        <div class="form-group">
                            <label for="appointmentTime">Ora</label>
                            <select id="appointmentTime" required></select>
                        </div>

                        <div class="form-group">
                            <label for="appointmentType">Lloji i vizitës</label>
                            <select id="appointmentType" required>
                                <option value="">Zgjidh llojin</option>
                                <option value="visit">Vizitë</option>
                                <option value="recheck">Rikontroll</option>
                            </select>
                        </div>

                        <div id="recheckOptions" class="form-group" style="display:none;">
                            <label>Rikontrolli</label>
                            <div style="display:flex;gap:18px;align-items:center;min-height:44px;">
                                <label style="display:flex;align-items:center;gap:7px;font-weight:600;cursor:pointer;">
                                    <input id="paymentPaid" type="checkbox">
                                    Me pagesë
                                </label>
                                <label style="display:flex;align-items:center;gap:7px;font-weight:600;cursor:pointer;">
                                    <input id="paymentFree" type="checkbox">
                                    Pa pagesë
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="appointmentCardNumber">Nr. i kartelës <span style="font-weight:400;color:#8a979d;">(opsionale)</span></label>
                            <input id="appointmentCardNumber" type="text" inputmode="numeric" placeholder="Nr. i kartelës">
                        </div>

                        <button class="add-button" type="submit">
                            <span>+</span>
                            Shto vizitë
                        </button>
                    </form>
                </section>

                <section class="schedule-card">
                    <div class="schedule-header">
                        <div>
                            <span class="card-kicker">PROGRAMI DITOR</span>
                            <h3>Orari ditor</h3>
                        </div>

                        <div class="schedule-header-right">
                            <div class="working-hours">🕐 12:00 — 17:00</div>
                            <div id="scheduleInfo" class="schedule-info">0 vizita</div>
                        </div>
                    </div>

                    <div class="schedule-table-wrapper">
                        <table class="schedule-table">
                            <thead>
                                <tr>
                                    <th>Ora</th>
                                    <th>Pacienti</th>
                                    <th>Lloji</th>
                                    <th>Pagesa / Kartela</th>
                                    <th>Statusi</th>
                                    <th>Veprime</th>
                                </tr>
                            </thead>

                            <tbody id="scheduleBody">
                                <tr>
                                    <td colspan="6" class="loading-cell">
                                        <div class="loading-spinner"></div>
                                        Po ngarkohet orari...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>

            <section id="patientsView" class="patients-view" style="display:none;">
                <div class="page-title">
                    <div>
                        <div class="section-kicker">REGJISTRI MJEKËSOR</div>
                        <h2>Pacientët</h2>
                    </div>

                    <button id="newPatientButton" class="add-button patient-top-button" type="button">
                        <span>+</span>
                        Shto pacient
                    </button>
                </div>

                <section class="patients-toolbar">
                    <div class="patient-search-wrap">
                        <span class="patient-search-icon">🔎</span>
                        <input
                            id="patientSearch"
                            class="patient-search"
                            type="search"
                            placeholder="Kërko me nr. kartelë, emër ose telefon..."
                            autocomplete="off"
                        >
                    </div>

                    <div id="patientsCount" class="patients-count">0 pacientë</div>
                </section>

                <section class="schedule-card patients-card">
                    <div class="schedule-table-wrapper">
                        <table class="schedule-table patients-table">
                            <thead>
                                <tr>
                                    <th>Pacienti</th>
                                    <th>Telefoni</th>
                                    <th>Datëlindja</th>
                                    <th>Kodi i kartelës</th>
                                    <th>Shënime</th>
                                    <th>Veprime</th>
                                </tr>
                            </thead>

                            <tbody id="patientsBody">
                                <tr>
                                    <td colspan="6" class="loading-cell">
                                        <div class="loading-spinner"></div>
                                        Po ngarkohen pacientët...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="patientPagination" class="patient-pagination"></div>
                </section>
            </section>
        </main>

        <div id="patientModal" class="patient-modal" aria-hidden="true">
            <div class="patient-modal-backdrop" data-close-patient-modal></div>

            <div class="patient-modal-box" role="dialog" aria-modal="true">
                <div class="patient-modal-header">
                    <div>
                        <span class="card-kicker">KARTELA E PACIENTIT</span>
                        <h3 id="patientModalTitle">Shto pacient</h3>
                    </div>

                    <button id="closePatientModal" class="modal-close" type="button" aria-label="Mbyll">
                        ×
                    </button>
                </div>

                <form id="patientForm" class="patient-form">
                    <input id="patientId" type="hidden">

                    <div class="form-group">
                        <label for="patientpatient.emer">Emri dhe mbiemri *</label>
                        <input id="patientpatient.emer" type="text" required placeholder="Emri dhe mbiemri">
                    </div>

                    <div class="form-group">
                        <label for="patientRecordPhone">Telefoni</label>
                        <input id="patientRecordPhone" type="text" placeholder="Numri i telefonit">
                    </div>

                    <div class="form-group">
                        <label for="patientBirthDate">Datëlindja</label>
                        <input id="patientBirthDate" type="date">
                    </div>

                    <div class="form-group">
                        <label for="patientPersonalId">Nr. personal / ID</label>
                        <input id="patientPersonalId" type="text" placeholder="Numri personal">
                    </div>

                    <div class="form-group patient-full-width">
                        <label for="patientAddress">Adresa</label>
                        <input id="patientAddress" type="text" placeholder="Adresa">
                    </div>

                    <div class="form-group patient-full-width">
                        <label for="patientNotes">Shënime</label>
                        <textarea id="patientNotes" rows="4" placeholder="Shënime për pacientin"></textarea>
                    </div>

                    <div class="patient-form-actions">
                        <button id="cancelPatientButton" class="modal-secondary-button" type="button">
                            Anulo
                        </button>

                        <button class="add-button" type="submit">
                            Ruaj pacientin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    injectPatientStyles();

    const userEmail = document.getElementById("userEmail");
    if (userEmail && currentUser) userEmail.textContent = currentUser.email || "";

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) logoutButton.addEventListener("click", logout);

    const navAppointments = document.getElementById("navAppointments");
    const navPatients = document.getElementById("navPatients");

    if (navAppointments) {
        navAppointments.addEventListener("click", showAppointmentsView);
    }

    if (navPatients) {
        navPatients.addEventListener("click", showPatientsView);
    }

    const previousDay = document.getElementById("previousDay");
    if (previousDay) {
        previousDay.addEventListener("click", function () {
            currentDate.setDate(currentDate.getDate() - 1);
            updateDateDisplay();
            loadAppointments();
        });
    }

    const nextDay = document.getElementById("nextDay");
    if (nextDay) {
        nextDay.addEventListener("click", function () {
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay();
            loadAppointments();
        });
    }

    const todayButton = document.getElementById("todayButton");
    if (todayButton) {
        todayButton.addEventListener("click", function () {
            currentDate = new Date();
            updateDateDisplay();
            loadAppointments();
        });
    }

    const appointmentForm = document.getElementById("appointmentForm");
    if (appointmentForm) {
        appointmentForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            await addAppointment();
        });
    }

    const appointmentType = document.getElementById("appointmentType");
    const paymentPaid = document.getElementById("paymentPaid");
    const paymentFree = document.getElementById("paymentFree");
    const patientName = document.getElementById("patientName");

    if (patientName) {
        patientName.addEventListener("input", function () {
            fillAppointmentCardFromPatient();
        });
        patientName.addEventListener("change", function () {
            fillAppointmentCardFromPatient();
        });
    }

    if (appointmentType) {
        appointmentType.addEventListener("change", updateRecheckOptions);
    }

    if (paymentPaid) {
        paymentPaid.addEventListener("change", function () {
            if (paymentPaid.checked && paymentFree) paymentFree.checked = false;
        });
    }

    if (paymentFree) {
        paymentFree.addEventListener("change", function () {
            if (paymentFree.checked && paymentPaid) paymentPaid.checked = false;
        });
    }

    const newPatientButton = document.getElementById("newPatientButton");
    if (newPatientButton) {
        newPatientButton.addEventListener("click", function () {
            openPatientModal();
        });
    }

    const closePatientModal = document.getElementById("closePatientModal");
    if (closePatientModal) {
        closePatientModal.addEventListener("click", closePatientModalWindow);
    }

    const cancelPatientButton = document.getElementById("cancelPatientButton");
    if (cancelPatientButton) {
        cancelPatientButton.addEventListener("click", closePatientModalWindow);
    }

    document.querySelectorAll("[data-close-patient-modal]").forEach(function (element) {
        element.addEventListener("click", closePatientModalWindow);
    });

    const patientForm = document.getElementById("patientForm");
    if (patientForm) {
        patientForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            await savePatient();
        });
    }

    const patientSearch = document.getElementById("patientSearch");
    if (patientSearch) {
        patientSearch.addEventListener("input", renderPatients);
    }

    updateDateDisplay();
    populateTimeSelect();
    updateRecheckOptions();
    loadAppointments();
    setupRealtime();
    setupPatientsRealtime();
}

function showAppointmentsView() {
    currentView = "appointments";

    const appointmentsView = document.getElementById("appointmentsView");
    const patientsView = document.getElementById("patientsView");
    const navAppointments = document.getElementById("navAppointments");
    const navPatients = document.getElementById("navPatients");

    if (appointmentsView) appointmentsView.style.display = "";
    if (patientsView) patientsView.style.display = "none";

    if (navAppointments) navAppointments.classList.add("active");
    if (navPatients) navPatients.classList.remove("active");
}

async function showPatientsView() {
    currentView = "patients";

    const appointmentsView = document.getElementById("appointmentsView");
    const patientsView = document.getElementById("patientsView");
    const navAppointments = document.getElementById("navAppointments");
    const navPatients = document.getElementById("navPatients");

    if (appointmentsView) appointmentsView.style.display = "none";
    if (patientsView) patientsView.style.display = "";

    if (navAppointments) navAppointments.classList.remove("active");
    if (navPatients) navPatients.classList.add("active");

    await loadPatients();
}


/* =========================================================
   PATIENTS
========================================================= */

let patientPage = 1;
const PATIENTS_PER_PAGE = 100;
let lastPatientSearch = "";

async function loadPatients() {
    const body = document.getElementById("patientsBody");
    const countElement = document.getElementById("patientsCount");
    if (!body) return;
    body.innerHTML = `<tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div>Po ngarkohen pacientët... 0</td></tr>`;
    try {
        const allPatients = [];
        const batchSize = 500;
        let lastCardNumber = 0;
        while (true) {
            const { data, error } = await supabaseClient.from("patients").select("*").gt("card_number", lastCardNumber).order("card_number", { ascending: true }).limit(batchSize);
            if (error) {
                console.error("LOAD PATIENTS ERROR:", error);
                body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Nuk u ngarkuan pacientët: ${escapeHtml(error.message)}</td></tr>`;
                return;
            }
            const rows = data || [];
            if (!rows.length) break;
            allPatients.push.apply(allPatients, rows);
            lastCardNumber = Number(rows[rows.length - 1].card_number);
            if (countElement) countElement.textContent = allPatients.length + " pacientë — duke ngarkuar...";
            if (rows.length < batchSize) break;
        }
        patients = allPatients;
        patientPage = 1;
        lastPatientSearch = "";
        console.log("TOTAL PATIENTS LOADED:", patients.length);
        populatePatientNameList();
        renderPatients();
    } catch (error) {
        console.error("LOAD PATIENTS EXCEPTION:", error);
        body.innerHTML = `<tr><td colspan="6" class="empty-day-cell">Gabim gjatë ngarkimit të pacientëve: ${escapeHtml(error.message || String(error))}</td></tr>`;
    }
}

function populatePatientNameList() {
    const list = document.getElementById("patientNameList");
    if (!list) return;

    list.innerHTML = "";

    patients.forEach(function (patient) {
        if (!patient || !patient.full_name) return;

        const option = document.createElement("option");
        option.value = patient.full_name;

        if (patient.card_number !== null && patient.card_number !== undefined && patient.card_number !== "") {
            option.label = "Kartela: " + formatCardNumber(patient.card_number);
        }

        list.appendChild(option);
    });
}

function fillAppointmentCardFromPatient() {
    const nameElement = document.getElementById("patientName");
    const cardElement = document.getElementById("appointmentCardNumber");

    if (!nameElement || !cardElement) return;

    const typedName = nameElement.value.trim().toLowerCase();

    if (!typedName) {
        cardElement.value = "";
        return;
    }

    const patient = patients.find(function (item) {
        return String(item.full_name || "").trim().toLowerCase() === typedName;
    });

    if (patient && patient.card_number !== null && patient.card_number !== undefined && patient.card_number !== "") {
        cardElement.value = formatCardNumber(patient.card_number);
    } else if (patient) {
        cardElement.value = "";
    }
}


function formatCardNumber(cardNumber) {
    if (cardNumber === null || cardNumber === undefined || cardNumber === "") {
        return "GVM-000000";
    }

    return "GVM-" + String(cardNumber);
}


function renderPatients() {
    const body = document.getElementById("patientsBody");
    const countElement = document.getElementById("patientsCount");
    const searchElement = document.getElementById("patientSearch");
    if (!body) return;
    const search = searchElement ? searchElement.value.trim().toLowerCase() : "";
    if (search !== lastPatientSearch) { patientPage = 1; lastPatientSearch = search; }
    const filtered = patients.filter(function (patient) {
        if (!search) return true;
        return [patient.card_number, patient.full_name, patient.phone, patient.personal_id, patient.address].filter(Boolean).some(function (value) {
            return String(value).toLowerCase().includes(search);
        });
    });
    if (countElement) countElement.textContent = `${filtered.length} ${filtered.length === 1 ? "pacient" : "pacientë"}`;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PATIENTS_PER_PAGE));
    if (patientPage > totalPages) patientPage = totalPages;
    const start = (patientPage - 1) * PATIENTS_PER_PAGE;
    const pagePatients = filtered.slice(start, start + PATIENTS_PER_PAGE);
    body.innerHTML = "";
    if (filtered.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="empty-day-cell"><div class="empty-day"><div class="empty-day-icon">👤</div><h4>${search ? "Nuk u gjet asnjë pacient" : "Nuk ka ende pacientë"}</h4><p>${search ? "Provo numrin e kartelës, emrin ose telefonin." : "Kliko “Shto pacient” për të regjistruar pacientin e parë."}</p></div></td></tr>`;
    } else {
        pagePatients.forEach(function (patient) { body.appendChild(renderPatientRow(patient)); });
    }
    renderPatientPagination(filtered.length, totalPages);
}

function renderPatientPagination(total, totalPages) {
    const container = document.getElementById("patientPagination");
    if (!container) return;
    if (total <= PATIENTS_PER_PAGE) { container.innerHTML = ""; return; }
    const from = (patientPage - 1) * PATIENTS_PER_PAGE + 1;
    const to = Math.min(patientPage * PATIENTS_PER_PAGE, total);
    container.innerHTML = `<div class="patient-page-info">Duke shfaqur ${from}–${to} nga ${total} pacientë</div><div class="patient-page-buttons"><button type="button" class="date-button" id="patientPrevPage" ${patientPage === 1 ? "disabled" : ""}>← Më parë</button><span class="patient-page-number">Faqja ${patientPage} / ${totalPages}</span><button type="button" class="date-button" id="patientNextPage" ${patientPage === totalPages ? "disabled" : ""}>Më pas →</button></div>`;
    const prev = document.getElementById("patientPrevPage");
    const next = document.getElementById("patientNextPage");
    if (prev) prev.addEventListener("click", function () { if (patientPage > 1) { patientPage--; renderPatients(); } });
    if (next) next.addEventListener("click", function () { if (patientPage < totalPages) { patientPage++; renderPatients(); } });
}


function renderPatientRow(patient) {
    const tr = document.createElement("tr");
    tr.className = "appointment-row";

    const name = patient.full_name || "Pa emër";
    const phone = patient.phone || "—";
    const birthDate = patient.birth_date
        ? formatPatientBirthDate(patient.birth_date)
        : "—";
    const personalId = patient.personal_id || "—";
    const notes = patient.notes || "—";
    const initials = getInitials(name);

    tr.innerHTML = `
        <td class="patient-cell">
            <div class="patient-main">
                <div class="patient-avatar">${escapeHtml(initials)}</div>
                <div class="patient-details">
                    <strong>${escapeHtml(name)}</strong>
                    <span>Kërko sipas emrit ose kodit të kartelës</span>
                </div>
            </div>
        </td>

        <td class="phone-cell">
            ${
                phone !== "—"
                    ? `<a href="tel:${escapeHtml(phone)}" class="phone-link">
                        <span>☎</span>${escapeHtml(phone)}
                       </a>`
                    : `<span class="muted-text">—</span>`
            }
        </td>

        <td>${escapeHtml(birthDate)}</td>

        <td>
            <span class="patient-id-badge">
                ${escapeHtml(formatCardNumber(patient.card_number))}
            </span>
        </td>

        <td>
            <span class="note-text" title="${escapeHtml(notes)}">
                ${escapeHtml(notes)}
            </span>
        </td>

        <td>
            <div class="appointment-actions">
                <button
                    type="button"
                    class="action-button patient-view-button"
                    data-patient-action="view"
                >
                    👁 Hap
                </button>

                <button
                    type="button"
                    class="action-button patient-edit-button"
                    data-patient-action="edit"
                >
                    ✏ Ndrysho
                </button>

                <button
                    type="button"
                    class="action-button action-delete"
                    data-patient-action="delete"
                >
                    🗑 Fshi
                </button>
            </div>
        </td>
    `;

    tr.querySelectorAll("[data-patient-action]").forEach(function (button) {
        button.addEventListener("click", async function () {
            const action = button.dataset.patientAction;

            if (action === "view") {
                await viewPatient(patient.id);
            } else if (action === "edit") {
                openPatientModal(patient);
            } else if (action === "delete") {
                await deletePatient(patient.id);
            }
        });
    });

    return tr;
}

function formatPatientBirthDate(value) {
    try {
        const date = new Date(`${value}T00:00:00`);

        return date.toLocaleDateString("sq-AL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    } catch (error) {
        return value;
    }
}

function openPatientModal(patient = null) {
    const modal = document.getElementById("patientModal");
    const title = document.getElementById("patientModalTitle");
    const id = document.getElementById("patientId");
    const name = document.getElementById("patientpatient.emer");
    const phone = document.getElementById("patientRecordPhone");
    const birthDate = document.getElementById("patientBirthDate");
    const personalId = document.getElementById("patientPersonalId");
    const address = document.getElementById("patientAddress");
    const notes = document.getElementById("patientNotes");

    if (!modal || !title || !id || !name) return;

    if (patient) {
        title.textContent = "Ndrysho pacientin";
        id.value = patient.id || "";
        name.value = patient.full_name || "";
        phone.value = patient.phone || "";
        birthDate.value = patient.birth_date || "";
        personalId.value = patient.personal_id || "";
        address.value = patient.address || "";
        notes.value = patient.notes || "";
    } else {
        title.textContent = "Shto pacient";
        id.value = "";
        name.value = "";
        phone.value = "";
        birthDate.value = "";
        personalId.value = "";
        address.value = "";
        notes.value = "";
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(function () {
        name.focus();
    }, 50);
}

function closePatientModalWindow() {
    const modal = document.getElementById("patientModal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

async function savePatient() {
    const id = document.getElementById("patientId");
    const name = document.getElementById("patientpatient.emer");
    const phone = document.getElementById("patientRecordPhone");
    const birthDate = document.getElementById("patientBirthDate");
    const personalId = document.getElementById("patientPersonalId");
    const address = document.getElementById("patientAddress");
    const notes = document.getElementById("patientNotes");

    if (!name) return;

    const patient.emer = name.value.trim();

    if (!patient.emer) {
        showMessage("Vendos emrin dhe mbiemrin e pacientit.", "error");
        return;
    }

    const payload = {
        full_name: patient.emer,
        phone: phone ? phone.value.trim() : "",
        birth_date: birthDate && birthDate.value ? birthDate.value : null,
        personal_id: personalId ? personalId.value.trim() : "",
        address: address ? address.value.trim() : "",
        notes: notes ? notes.value.trim() : "",
        updated_at: new Date().toISOString()
    };

    try {
        let result;

        if (id && id.value) {
            result = await supabaseClient
                .from("patients")
                .update(payload)
                .eq("id", id.value)
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
            showMessage(
                "Pacienti nuk u ruajt: " + result.error.message,
                "error"
            );
            return;
        }

        const savedPatient = result.data;

        if (id && id.value) {
            patients = patients.map(function (patient) {
                return patient.id === savedPatient.id
                    ? savedPatient
                    : patient;
            });
        } else {
            patients.push(savedPatient);
        }

        patients.sort(function (a, b) {
            return String(a.full_name || "")
                .localeCompare(
                    String(b.full_name || ""),
                    "sq"
                );
        });

        closePatientModalWindow();
        renderPatients();

        showMessage(
            id && id.value
                ? "Të dhënat e pacientit u përditësuan."
                : "Pacienti u regjistrua me sukses.",
            "success"
        );
    } catch (error) {
        console.error("SAVE PATIENT EXCEPTION:", error);
        showMessage("Gabim gjatë ruajtjes së pacientit.", "error");
    }
}

async function deletePatient(id) {
    const patient = patients.find(function (item) {
        return item.id === id;
    });

    const patientName = patient
        ? patient.full_name
        : "këtë pacient";

    const confirmed = window.confirm(
        `A je i sigurt që dëshiron të fshish pacientin "${patientName}"?`
    );

    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("patients")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("DELETE PATIENT ERROR:", error);
            showMessage(
                "Pacienti nuk u fshi: " + error.message,
                "error"
            );
            return;
        }

        patients = patients.filter(function (item) {
            return item.id !== id;
        });

        renderPatients();
        showMessage("Pacienti u fshi.", "success");
    } catch (error) {
        console.error("DELETE PATIENT EXCEPTION:", error);
        showMessage("Gabim gjatë fshirjes së pacientit.", "error");
    }
}

async function viewPatient(id) {
    const patient = patients.find(function (item) {
        return item.id === id;
    });

    if (!patient) return;

    let history = [];

    try {
        const { data, error } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("patient_name", patient.full_name)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false })
            .limit(30);

        if (!error) {
            history = data || [];
        }
    } catch (error) {
        console.error("PATIENT HISTORY ERROR:", error);
    }

    const historyHtml = history.length
        ? history.map(function (appointment) {
            return `
                <div class="patient-history-item">
                    <div>
                        <strong>
                            ${escapeHtml(formatHistoryDate(appointment.appointment_date))}
                        </strong>
                        <span>${escapeHtml(normalizeTime(appointment.appointment_time))}</span>
                    </div>
                    <div>
                        <span class="status ${statusClass(appointment.status || "planned")}">
                            <span class="status-dot"></span>
                            ${escapeHtml(statusText(appointment.status || "planned"))}
                        </span>
                    </div>
                    <div class="patient-history-note">
                        ${escapeHtml(appointment.note || "Pa shënim")}
                    </div>
                </div>
            `;
        }).join("")
        : `
            <div class="patient-history-empty">
                Nuk ka vizita të lidhura me këtë pacient.
            </div>
        `;

    const modal = document.getElementById("patientModal");
    const title = document.getElementById("patientModalTitle");
    const form = document.getElementById("patientForm");

    if (!modal || !title || !form) return;

    title.textContent = "Kartela e pacientit";

    form.innerHTML = `
        <div class="patient-profile">
            <div class="patient-profile-avatar">
                ${escapeHtml(getInitials(patient.full_name))}
            </div>

            <div>
                <h4>${escapeHtml(patient.full_name || "Pa emër")}</h4>
                <p>${escapeHtml(patient.phone || "Pa telefon")}</p>
            </div>
        </div>

        <div class="patient-detail-grid">
            <div>
                <span>Datëlindja</span>
                <strong>${escapeHtml(
                    patient.birth_date
                        ? formatPatientBirthDate(patient.birth_date)
                        : "—"
                )}</strong>
            </div>

            <div>
                <span>Kodi i kartelës</span>
                <strong>${escapeHtml(formatCardNumber(patient.card_number))}</strong>
            </div>

            <div>
                <span>Adresa</span>
                <strong>${escapeHtml(patient.address || "—")}</strong>
            </div>

            <div>
                <span>Shënime</span>
                <strong>${escapeHtml(patient.notes || "—")}</strong>
            </div>
        </div>

        <div class="patient-history">
            <div class="patient-history-title">
                <span class="card-kicker">HISTORIA</span>
                <h4>Vizitat e pacientit</h4>
            </div>

            <div class="patient-history-list">
                ${historyHtml}
            </div>
        </div>

        <div class="patient-form-actions">
            <button
                id="viewPatientEditButton"
                class="modal-secondary-button"
                type="button"
            >
                ✏ Ndrysho të dhënat
            </button>

            <button
                id="viewPatientCloseButton"
                class="add-button"
                type="button"
            >
                Mbyll
            </button>
        </div>
    `;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    const editButton = document.getElementById("viewPatientEditButton");
    if (editButton) {
        editButton.addEventListener("click", function () {
            openPatientModal(patient);
        });
    }

    const closeButton = document.getElementById("viewPatientCloseButton");
    if (closeButton) {
        closeButton.addEventListener("click", closePatientModalWindow);
    }
}

function formatHistoryDate(value) {
    if (!value) return "Pa datë";

    try {
        const date = new Date(`${value}T00:00:00`);

        return date.toLocaleDateString("sq-AL", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    } catch (error) {
        return value;
    }
}

function setupPatientsRealtime() {
    try {
        if (patientsRealtimeChannel) {
            supabaseClient.removeChannel(patientsRealtimeChannel);
        }

        patientsRealtimeChannel = supabaseClient
            .channel("patients-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "patients"
                },
                function (payload) {
                    console.log("Patients realtime update:", payload);

                    if (currentView === "patients") {
                        loadPatients();
                    }
                }
            )
            .subscribe(function (status) {
                console.log("Patients realtime status:", status);
            });
    } catch (error) {
        console.error("PATIENTS REALTIME ERROR:", error);
    }
}

function injectPatientStyles() {
    if (document.getElementById("gvmPatientStyles")) return;

    const style = document.createElement("style");
    style.id = "gvmPatientStyles";

    style.textContent = `
        .main-navigation {
            display: flex;
            gap: 8px;
            margin-bottom: 25px;
            padding: 5px;
            width: fit-content;
            background: #edf3f4;
            border-radius: 12px;
        }

        .nav-button {
            border: 0;
            border-radius: 9px;
            padding: 10px 18px;
            background: transparent;
            color: #61737b;
            font-size: 13px;
            font-weight: 800;
        }

        .nav-button:hover {
            color: #0f766e;
        }

        .nav-button.active {
            background: #fff;
            color: #0f766e;
            box-shadow: 0 2px 8px rgba(15,23,42,.06);
        }

        .patient-top-button {
            width: auto;
        }

        .patients-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 16px;
            padding: 16px;
            background: #fff;
            border: 1px solid #e1e8ec;
            border-radius: 14px;
        }

        .patient-search-wrap {
            position: relative;
            flex: 1;
            max-width: 600px;
        }

        .patient-search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #87959b;
        }

        .patient-search {
            width: 100%;
            height: 44px;
            border: 1px solid #d8e1e5;
            border-radius: 10px;
            padding: 0 14px 0 40px;
            outline: none;
            color: #23383f;
        }

        .patient-search:focus {
            border-color: #0f766e;
            box-shadow: 0 0 0 3px rgba(15,118,110,.09);
        }

        .patients-count {
            color: #66777e;
            font-size: 12px;
            font-weight: 800;
        }

        .patient-id-badge {
            display: inline-block;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 5px 8px;
            border-radius: 7px;
            background: #f2f5f6;
            color: #64747b;
            font-size: 11px;
        }

        .patient-view-button {
            color: #0f766e;
            border-color: #bde3df;
            background: #f5fcfb;
        }

        .patient-edit-button {
            color: #475569;
        }

        .patient-modal {
            position: fixed;
            inset: 0;
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .patient-modal.open {
            display: flex;
        }

        .patient-modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15,23,42,.45);
            backdrop-filter: blur(3px);
        }

        .patient-modal-box {
            position: relative;
            z-index: 1;
            width: min(720px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 30px 80px rgba(15,23,42,.22);
        }

        .patient-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 22px 24px;
            border-bottom: 1px solid #e9eef0;
        }

        .patient-modal-header h3 {
            margin: 5px 0 0;
            color: #23383f;
            font-size: 19px;
        }

        .modal-close {
            width: 38px;
            height: 38px;
            border: 0;
            border-radius: 9px;
            background: #f3f6f7;
            color: #63747b;
            font-size: 24px;
        }

        .modal-close:hover {
            background: #e9eef0;
        }

        .patient-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 24px;
        }

        .patient-full-width {
            grid-column: 1 / -1;
        }

        .patient-form textarea {
            width: 100%;
            resize: vertical;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #d8e1e5;
            border-radius: 10px;
            outline: none;
            color: #1d2933;
        }

        .patient-form textarea:focus {
            border-color: #0f766e;
            box-shadow: 0 0 0 3px rgba(15,118,110,.10);
        }

        .patient-form-actions {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 8px;
            border-top: 1px solid #edf1f3;
        }

        .modal-secondary-button {
            height: 44px;
            padding: 0 16px;
            border: 1px solid #d7e0e4;
            border-radius: 10px;
            background: #fff;
            color: #53656d;
            font-weight: 800;
        }

        .modal-secondary-button:hover {
            background: #f7f9fa;
        }

        .patient-profile {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            border-radius: 13px;
            background: #f3f9f8;
        }

        .patient-profile-avatar {
            width: 54px;
            height: 54px;
            flex: 0 0 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #dcefed;
            color: #0f766e;
            font-weight: 900;
        }

        .patient-profile h4 {
            margin: 0;
            color: #294047;
            font-size: 17px;
        }

        .patient-profile p {
            margin: 4px 0 0;
            color: #7a898f;
            font-size: 12px;
        }

        .patient-detail-grid {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .patient-detail-grid > div {
            padding: 13px;
            border: 1px solid #e5ebed;
            border-radius: 10px;
        }

        .patient-detail-grid span {
            display: block;
            margin-bottom: 4px;
            color: #8a979c;
            font-size: 10px;
            font-weight: 750;
            text-transform: uppercase;
        }

        .patient-detail-grid strong {
            display: block;
            color: #344950;
            font-size: 12px;
            font-weight: 700;
            word-break: break-word;
        }

        .patient-history {
            grid-column: 1 / -1;
            margin-top: 4px;
        }

        .patient-history-title h4 {
            margin: 5px 0 12px;
            color: #344950;
            font-size: 16px;
        }

        .patient-history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .patient-history-item {
            display: grid;
            grid-template-columns: 1.2fr .8fr 1.4fr;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e7ecee;
            border-radius: 10px;
        }

        .patient-history-item strong,
        .patient-history-item span {
            display: block;
        }

        .patient-history-item strong {
            color: #40545b;
            font-size: 12px;
        }

        .patient-history-item > div:first-child span {
            margin-top: 3px;
            color: #89969c;
            font-size: 11px;
        }

        .patient-history-note {
            color: #718087;
            font-size: 11px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .patient-history-empty {
            padding: 20px;
            border-radius: 10px;
            background: #f7f9fa;
            color: #87949a;
            text-align: center;
            font-size: 12px;
        }

        @media (max-width: 700px) {
            .patients-toolbar {
                align-items: stretch;
                flex-direction: column;
            }

            .patient-search-wrap {
                max-width: none;
            }

            .patient-form {
                grid-template-columns: 1fr;
            }

            .patient-full-width,
            .patient-form-actions,
            .patient-profile,
            .patient-detail-grid,
            .patient-history {
                grid-column: auto;
            }

            .patient-detail-grid {
                grid-template-columns: 1fr;
            }

            .patient-history-item {
                grid-template-columns: 1fr;
            }

            .patient-form-actions {
                flex-direction: column-reverse;
            }

            .patient-form-actions button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}


/* =========================================================
   DATE KEY
========================================================= */

function dateKey(date) {

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


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {

    return date.toLocaleDateString(
        "sq-AL",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   UPDATE DATE
========================================================= */

function updateDateDisplay() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) return;

    element.textContent =
        formatDate(currentDate);

}


/* =========================================================
   GENERATE TIMES
========================================================= */

function generateTimes() {

    const times = [];

    const startMinutes =
        12 * 60;

    const endMinutes =
        17 * 60;

    for (
        let minutes = startMinutes;
        minutes <= endMinutes;
        minutes += 15
    ) {

        const hour =
            Math.floor(
                minutes / 60
            );

        const minute =
            minutes % 60;

        const h =
            String(hour)
                .padStart(2, "0");

        const m =
            String(minute)
                .padStart(2, "0");

        times.push(
            `${h}:${m}`
        );

    }

    return times;
}


/* =========================================================
   POPULATE TIME
========================================================= */

function populateTimeSelect() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) return;

    select.innerHTML = "";

    const placeholder =
        document.createElement(
            "option"
        );

    placeholder.value = "";

    placeholder.textContent =
        "Zgjidh orën";

    placeholder.disabled = true;

    placeholder.selected = true;

    select.appendChild(
        placeholder
    );

    const times =
        generateTimes();

    times.forEach(
        function (time) {

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


/* =========================================================
   LOAD APPOINTMENTS
========================================================= */

async function loadAppointments() {

    const body =
        document.getElementById(
            "scheduleBody"
        );

    if (!body) return;

    body.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="loading-cell"
            >
                <div class="loading-spinner"></div>
                Po ngarkohet orari...
            </td>
        </tr>
    `;

    const selectedDate =
        dateKey(currentDate);

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq(
                "appointment_date",
                selectedDate
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

            showMessage(
                "Gabim gjatë ngarkimit të vizitave: " +
                error.message,
                "error"
            );

            appointments = [];

            renderAppointments();

            return;
        }

        appointments =
            data || [];

        renderAppointments();

    } catch (error) {

        console.error(
            "LOAD APPOINTMENTS EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë ngarkimit të orarit.",
            "error"
        );

        appointments = [];

        renderAppointments();

    }

}


/* =========================================================
   RENDER APPOINTMENTS - TABLE
========================================================= */

function renderAppointments() {

    const body =
        document.getElementById(
            "scheduleBody"
        );

    if (!body) return;

    body.innerHTML = "";

    updateDashboardCounters();

    const scheduleInfo =
        document.getElementById(
            "scheduleInfo"
        );

    if (scheduleInfo) {

        scheduleInfo.textContent =
            `${appointments.length} ${
                appointments.length === 1
                    ? "vizitë"
                    : "vizita"
            }`;

    }

    const times =
        generateTimes();

    let hasAppointments =
        false;

    times.forEach(
        function (time) {

            const matchingAppointments =
                appointments.filter(
                    function (appointment) {

                        return normalizeTime(
                            appointment.appointment_time
                        ) === time;

                    }
                );

            if (
                matchingAppointments.length === 0
            ) {

                const tr =
                    document.createElement(
                        "tr"
                    );

                tr.className =
                    "empty-time-row";

                tr.innerHTML = `

                    <td class="time-cell">

                        <div class="time-label">
                            ${escapeHtml(time)}
                        </div>

                    </td>

                    <td colspan="5">

                        <div class="free-slot">

                            <span class="free-dot"></span>

                            Orar i lirë

                        </div>

                    </td>

                `;

                body.appendChild(tr);

                return;
            }

            hasAppointments = true;

            matchingAppointments.forEach(
                function (appointment, index) {

                    body.appendChild(
                        renderAppointmentRow(
                            appointment,
                            time,
                            index
                        )
                    );

                }
            );

        }
    );

    if (!hasAppointments) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-day-cell"
                >

                    <div class="empty-day">

                        <div class="empty-day-icon">
                            📅
                        </div>

                        <h4>
                            Nuk ka vizita të planifikuara
                        </h4>

                        <p>
                            Orari i kësaj dite është i lirë.
                            Mund të shtosh një vizitë të re nga formulari më sipër.
                        </p>

                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   RENDER ONE TABLE ROW
========================================================= */

function renderAppointmentRow(
    appointment,
    time,
    index
) {

    const tr = document.createElement("tr");
    tr.className = "appointment-row";

    const name = appointment.patient_name || "Pa emër";
    const status = appointment.status || "planned";
    const details = parseAppointmentDetails(appointment.note);
    const initials = getInitials(name);

    const typeText = details.type === "recheck" ? "Rikontroll" : "Vizitë";
    const paymentText = details.type === "recheck"
        ? (details.payment === "paid" ? "Me pagesë" : details.payment === "free" ? "Pa pagesë" : "—")
        : "—";
    const cardText = details.card || "—";

    tr.innerHTML = `
        <td class="time-cell">
            <div class="time-badge">
                <span class="time-icon">◷</span>
                <strong>${escapeHtml(time)}</strong>
            </div>
        </td>

        <td class="patient-cell">
            <div class="patient-main">
                <div class="patient-avatar">${escapeHtml(initials)}</div>
                <div class="patient-details">
                    <strong>${escapeHtml(name)}</strong>
                    <span>Pacient</span>
                </div>
            </div>
        </td>

        <td class="note-cell">
            <strong>${escapeHtml(typeText)}</strong>
        </td>

        <td class="note-cell">
            <div><strong>${escapeHtml(paymentText)}</strong></div>
            <div class="muted-text" style="margin-top:4px;">Kartelë: ${escapeHtml(cardText)}</div>
        </td>

        <td class="status-cell">
            <span class="status ${statusClass(status)}">
                <span class="status-dot"></span>
                ${escapeHtml(statusText(status))}
            </span>
        </td>

        <td class="actions-cell">
            <div class="appointment-actions">
                ${status !== "arrived" ? `
                    <button type="button" class="action-button action-arrived" data-action="arrived" title="Shëno si të mbërritur">✓ Mbërriti</button>
                ` : ""}
                ${status !== "finished" ? `
                    <button type="button" class="action-button action-finished" data-action="finished" title="Përfundo vizitën">✓ Përfundoi</button>
                ` : ""}
                ${status !== "cancelled" ? `
                    <button type="button" class="action-button action-cancel" data-action="cancelled" title="Anulo vizitën">× Anulo</button>
                ` : ""}
                <button type="button" class="action-button action-delete" data-action="delete" title="Fshi vizitën">🗑 Fshi</button>
            </div>
        </td>
    `;

    tr.querySelectorAll("[data-action]").forEach(function (button) {
        button.addEventListener("click", async function () {
            const action = button.dataset.action;
            if (action === "delete") {
                await deleteAppointment(appointment.id);
                return;
            }
            await changeStatus(appointment.id, action);
        });
    });

    return tr;
}

function encodeAppointmentDetails(type, payment, cardNumber) {
    return "GVM_APPOINTMENT_DETAILS:" + JSON.stringify({
        type: type || "visit",
        payment: payment || "",
        card: cardNumber || ""
    });
}

function parseAppointmentDetails(note) {
    if (!note) return { type: "visit", payment: "", card: "" };

    const prefix = "GVM_APPOINTMENT_DETAILS:";
    if (String(note).startsWith(prefix)) {
        try {
            const data = JSON.parse(String(note).slice(prefix.length));
            return {
                type: data.type || "visit",
                payment: data.payment || "",
                card: data.card || ""
            };
        } catch (error) {
            console.warn("APPOINTMENT DETAILS PARSE ERROR:", error);
        }
    }

    return { type: "visit", payment: "", card: "" };
}


/* =========================================================
   DASHBOARD COUNTERS
========================================================= */

function updateDashboardCounters() {

    const total =
        document.getElementById(
            "totalAppointments"
        );

    const planned =
        document.getElementById(
            "plannedAppointments"
        );

    const finished =
        document.getElementById(
            "finishedAppointments"
        );

    const arrived =
        document.getElementById(
            "arrivedAppointments"
        );

    const totalCount =
        appointments.length;

    const plannedCount =
        appointments.filter(
            function (appointment) {

                return (
                    appointment.status ===
                    "planned"
                );

            }
        ).length;

    const finishedCount =
        appointments.filter(
            function (appointment) {

                return (
                    appointment.status ===
                    "finished"
                );

            }
        ).length;

    const arrivedCount =
        appointments.filter(
            function (appointment) {

                return (
                    appointment.status ===
                    "arrived"
                );

            }
        ).length;

    if (total) {
        total.textContent =
            totalCount;
    }

    if (planned) {
        planned.textContent =
            plannedCount;
    }

    if (finished) {
        finished.textContent =
            finishedCount;
    }

    if (arrived) {
        arrived.textContent =
            arrivedCount;
    }

}


/* =========================================================
   STATUS TEXT
========================================================= */

function statusText(status) {

    switch (status) {

        case "arrived":
            return "Mbërriti";

        case "finished":
            return "Përfundoi";

        case "cancelled":
            return "Anuluar";

        case "planned":
        default:
            return "Planifikuar";

    }

}


/* =========================================================
   STATUS CLASS
========================================================= */

function statusClass(status) {

    switch (status) {

        case "arrived":
            return "status-arrived";

        case "finished":
            return "status-finished";

        case "cancelled":
            return "status-cancelled";

        case "planned":
        default:
            return "status-planned";

    }

}


/* =========================================================
   ADD APPOINTMENT
========================================================= */

async function addAppointment() {

    const nameElement = document.getElementById("patientName");
    const timeElement = document.getElementById("appointmentTime");
    const typeElement = document.getElementById("appointmentType");
    const paidElement = document.getElementById("paymentPaid");
    const freeElement = document.getElementById("paymentFree");
    const cardElement = document.getElementById("appointmentCardNumber");

    if (!nameElement || !timeElement || !typeElement) {
        showMessage("Formulari i vizitës nuk u gjet.", "error");
        return;
    }

    const patientName = nameElement.value.trim();
    const appointmentTime = timeElement.value;
    const appointmentType = typeElement.value;
    const cardNumber = cardElement ? cardElement.value.trim() : "";

    if (!patientName) {
        showMessage("Vendos emrin dhe mbiemrin e pacientit.", "error");
        return;
    }

    if (!appointmentTime) {
        showMessage("Zgjidh orën.", "error");
        return;
    }

    if (!appointmentType) {
        showMessage("Zgjidh Vizitë ose Rikontroll.", "error");
        return;
    }

    let payment = "";

    if (appointmentType === "recheck") {
        if (paidElement && paidElement.checked) payment = "paid";
        if (freeElement && freeElement.checked) payment = "free";

        if (!payment) {
            showMessage("Për rikontrollin zgjidh Me pagesë ose Pa pagesë.", "error");
            return;
        }
    }

    const selectedDate = dateKey(currentDate);

    const occupied = appointments.some(function (appointment) {
        return normalizeTime(appointment.appointment_time) === normalizeTime(appointmentTime)
            && appointment.status !== "cancelled";
    });

    if (occupied) {
        showMessage("Kjo orë është tashmë e zënë.", "error");
        return;
    }

    const appointmentData = {
        patient_name: patientName,
        patient_phone: null,
        appointment_date: selectedDate,
        appointment_time: appointmentTime,
        note: encodeAppointmentDetails(appointmentType, payment, cardNumber),
        status: "planned"
    };

    console.log("ADDING APPOINTMENT:", appointmentData);

    try {
        const result = await supabaseClient
            .from("appointments")
            .insert([appointmentData]);

        console.log("FULL INSERT RESULT:", result);

        if (result.error) {
            console.error("ADD APPOINTMENT ERROR:", result.error);
            showMessage(
                "Vizita nuk u shtua: " +
                result.error.message +
                (result.error.details ? " | " + result.error.details : ""),
                "error"
            );
            return;
        }

        nameElement.value = "";
        timeElement.selectedIndex = 0;
        typeElement.selectedIndex = 0;
        if (paidElement) paidElement.checked = false;
        if (freeElement) freeElement.checked = false;
        if (cardElement) cardElement.value = "";

        updateRecheckOptions();
        await loadAppointments();
        showMessage("Vizita u shtua me sukses.", "success");

    } catch (error) {
        console.error("ADD APPOINTMENT EXCEPTION:", error);
        showMessage("Gabim gjatë shtimit: " + (error.message || error), "error");
    }
}

function updateRecheckOptions() {
    const typeElement = document.getElementById("appointmentType");
    const options = document.getElementById("recheckOptions");
    const paidElement = document.getElementById("paymentPaid");
    const freeElement = document.getElementById("paymentFree");

    if (!typeElement || !options) return;

    const isRecheck = typeElement.value === "recheck";
    options.style.display = isRecheck ? "" : "none";

    if (!isRecheck) {
        if (paidElement) paidElement.checked = false;
        if (freeElement) freeElement.checked = false;
    }
}

function setupRealtime() {

    try {

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
                    function (payload) {

                        console.log(
                            "Realtime update:",
                            payload
                        );

                        loadAppointments();

                    }
                )
                .subscribe(
                    function (status) {

                        console.log(
                            "Realtime status:",
                            status
                        );

                    }
                );

    } catch (error) {

        console.error(
            "REALTIME ERROR:",
            error
        );

    }

}


/* =========================================================
   NORMALIZE TIME
========================================================= */

function normalizeTime(value) {

    if (!value) return "";

    const stringValue =
        String(value);

    return stringValue.substring(
        0,
        5
    );

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {

    if (!name) return "";

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ESCAPE JS
========================================================= */

function escapeJs(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "appMessage"
        );

    if (!element) return;

    element.className =
        "app-message " +
        (
            type ||
            "success"
        );

    element.textContent =
        message;

    setTimeout(
        function () {

            if (
                element.textContent ===
                message
            ) {

                element.className =
                    "app-message";

                element.textContent =
                    "";

            }

        },
        4000
    );

}
