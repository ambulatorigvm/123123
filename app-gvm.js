const APP_VERSION = "GVM-20260924-15";

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
                            <div class="working-hours">🕐 08:00 — 18:00</div>
                            <div id="scheduleInfo" class="schedule-info">0 vizita</div>
                        </div>
                    </div>

                    <div class="schedule-table-wrapper">
                        <table class="schedule-table">
                            <thead>
                                <tr>
                                    <th>Ora</th>
                                    <th>Pacienti</th>
                                    <th>Telefoni</th>
                                    <th>Shënimi</th>
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
                        <label for="patientFullName">Emri dhe mbiemri *</label>
                        <input id="patientFullName" type="text" required placeholder="Emri dhe mbiemri">
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
            .modal-close:hover {
            background: #e8eef0;
        }

        .patient-form {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            padding: 24px;
        }

        .patient-full-width {
            grid-column: 1 / -1;
        }

        .patient-form textarea {
            width: 100%;
            resize: vertical;
            min-height: 100px;
        }

        .patient-form-actions {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 8px;
        }

        .modal-secondary-button {
            min-height: 42px;
            padding: 0 18px;
            border: 1px solid #d5dfe3;
            border-radius: 9px;
            background: #fff;
            color: #52656d;
            font-weight: 800;
            cursor: pointer;
        }

        .modal-secondary-button:hover {
            background: #f5f8f9;
        }

        .patient-profile {
            display: flex;
            align-items: center;
            gap: 15px;
            grid-column: 1 / -1;
            padding: 18px;
            border-radius: 12px;
            background: #f5f9fa;
        }

        .patient-profile-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 58px;
            height: 58px;
            flex: 0 0 58px;
            border-radius: 50%;
            background: #d9eeeb;
            color: #0f766e;
            font-size: 18px;
            font-weight: 900;
        }

        .patient-profile h4 {
            margin: 0 0 4px;
            color: #23383f;
            font-size: 18px;
        }

        .patient-profile p {
            margin: 0;
            color: #718188;
            font-size: 13px;
        }

        .patient-detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            grid-column: 1 / -1;
        }

        .patient-detail-grid > div {
            padding: 14px;
            border: 1px solid #e4ebed;
            border-radius: 10px;
            background: #fff;
        }

        .patient-detail-grid span {
            display: block;
            margin-bottom: 5px;
            color: #7a898f;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .patient-detail-grid strong {
            display: block;
            color: #2d4249;
            font-size: 13px;
            word-break: break-word;
        }

        .patient-history {
            grid-column: 1 / -1;
            margin-top: 5px;
        }

        .patient-history-title {
            margin-bottom: 10px;
        }

        .patient-history-title h4 {
            margin: 4px 0 0;
            color: #263c43;
            font-size: 16px;
        }

        .patient-history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            overflow-y: auto;
        }

        .patient-history-item {
            display: grid;
            grid-template-columns: 1.2fr .8fr 1.5fr;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e5ebed;
            border-radius: 10px;
            background: #fafcfc;
        }

        .patient-history-item strong,
        .patient-history-item span {
            display: block;
        }

        .patient-history-item strong {
            color: #2c4148;
            font-size: 12px;
        }

        .patient-history-item > div:first-child span {
            margin-top: 3px;
            color: #78888e;
            font-size: 11px;
        }

        .patient-history-note {
            color: #66777e;
            font-size: 11px;
            word-break: break-word;
        }

        .patient-history-empty {
            padding: 20px;
            border-radius: 10px;
            background: #f7f9fa;
            color: #78888e;
            font-size: 12px;
            text-align: center;
        }

        .patient-cell {
            min-width: 230px;
        }

        .patient-main {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .patient-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            flex: 0 0 36px;
            border-radius: 50%;
            background: #e3f2f0;
            color: #0f766e;
            font-size: 11px;
            font-weight: 900;
        }

        .patient-details strong {
            display: block;
            color: #2b4047;
            font-size: 12px;
        }

        .patient-details span {
            display: block;
            margin-top: 3px;
            color: #94a0a5;
            font-size: 10px;
        }

        .phone-link {
            color: #42616a;
            text-decoration: none;
            font-size: 12px;
        }

        .phone-link span {
            margin-right: 5px;
        }

        .phone-link:hover {
            color: #0f766e;
        }

        .muted-text {
            color: #a0aaae;
        }

        .note-text {
            display: block;
            max-width: 180px;
            overflow: hidden;
            color: #68787e;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .app-message {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 500;
            display: none;
            max-width: 420px;
            padding: 13px 17px;
            border-radius: 10px;
            box-shadow: 0 12px 35px rgba(15,23,42,.14);
            font-size: 13px;
            font-weight: 700;
        }

        .app-message.show {
            display: block;
        }

        .app-message.success {
            background: #ecfdf5;
            border: 1px solid #b7ead3;
            color: #087443;
        }

        .app-message.error {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            color: #be123c;
        }

        @media (max-width: 900px) {

            .patients-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .patient-search-wrap {
                max-width: none;
            }

            .patient-history-item {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 700px) {

            .main-navigation {
                width: 100%;
            }

            .nav-button {
                flex: 1;
            }

            .patient-form,
            .patient-detail-grid {
                grid-template-columns: 1fr;
            }

            .patient-full-width,
            .patient-form-actions {
                grid-column: auto;
            }

            .patient-modal {
                padding: 10px;
            }

            .patient-modal-box {
                max-height: 95vh;
                border-radius: 14px;
            }

            .patient-modal-header {
                padding: 17px;
            }

            .patient-form {
                padding: 17px;
            }

            .patients-table {
                min-width: 850px;
            }
        }
    `;

    document.head.appendChild(style);
}


/* =========================================================
   DATE
========================================================= */

function updateDateDisplay() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) return;

    element.textContent =
        currentDate.toLocaleDateString(
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
   TIME SELECT
========================================================= */

function populateTimeSelect() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) return;

    select.innerHTML = "";

    for (
        let hour = 8;
        hour <= 18;
        hour++
    ) {

        for (
            let minute = 0;
            minute < 60;
            minute += 15
        ) {

            if (
                hour === 18 &&
                minute > 0
            ) {
                continue;
            }

            const time =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

            const option =
                document.createElement("option");

            option.value = time;
            option.textContent = time;

            select.appendChild(option);
        }
    }
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
            <td colspan="6" class="loading-cell">
                <div class="loading-spinner"></div>
                Po ngarkohet orari...
            </td>
        </tr>
    `;

    const dateString =
        formatDateForDatabase(
            currentDate
        );

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq(
                "appointment_date",
                dateString
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

            body.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-day-cell">
                        Nuk u ngarkuan vizitat:
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;

            return;
        }

        appointments =
            data || [];

        renderSchedule();
        updateDashboard();

    } catch (error) {

        console.error(
            "LOAD APPOINTMENTS EXCEPTION:",
            error
        );

        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-day-cell">
                    Gabim gjatë ngarkimit të orarit.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   RENDER SCHEDULE
========================================================= */

function renderSchedule() {

    const body =
        document.getElementById(
            "scheduleBody"
        );

    const info =
        document.getElementById(
            "scheduleInfo"
        );

    if (!body) return;

    body.innerHTML = "";

    const appointmentMap =
        {};

    appointments.forEach(
        function (appointment) {

            const key =
                normalizeTime(
                    appointment.appointment_time
                );

            appointmentMap[key] =
                appointment;

        }
    );

    const slots =
        generateTimeSlots();

    let occupiedCount = 0;

    slots.forEach(
        function (time) {

            const appointment =
                appointmentMap[time];

            if (appointment) {
                occupiedCount++;
            }

            const tr =
                document.createElement("tr");

            tr.className =
                appointment
                    ? "appointment-row occupied"
                    : "appointment-row";

            const patientName =
                appointment
                    ? appointment.patient_name || "Pa emër"
                    : "";

            const phone =
                appointment
                    ? appointment.patient_phone || "—"
                    : "";

            const note =
                appointment
                    ? appointment.note || "—"
                    : "";

            const status =
                appointment
                    ? appointment.status || "planned"
                    : "";

            tr.innerHTML = `
                <td class="time-cell">
                    <strong>${escapeHtml(time)}</strong>
                </td>

                <td class="patient-name-cell">
                    ${
                        appointment
                            ? `
                                <div class="schedule-patient">
                                    <div class="mini-avatar">
                                        ${escapeHtml(getInitials(patientName))}
                                    </div>
                                    <div>
                                        <strong>
                                            ${escapeHtml(patientName)}
                                        </strong>
                                    </div>
                                </div>
                              `
                            : `
                                <span class="empty-slot">
                                    E lirë
                                </span>
                              `
                    }
                </td>

                <td>
                    ${
                        appointment
                            ? escapeHtml(phone)
                            : `<span class="muted-text">—</span>`
                    }
                </td>

                <td>
                    ${
                        appointment
                            ? `<span class="note-text">${escapeHtml(note)}</span>`
                            : `<span class="muted-text">—</span>`
                    }
                </td>

                <td>
                    ${
                        appointment
                            ? `
                                <span class="status ${statusClass(status)}">
                                    <span class="status-dot"></span>
                                    ${escapeHtml(statusText(status))}
                                </span>
                              `
                            : `<span class="muted-text">—</span>`
                    }
                </td>

                <td>
                    ${
                        appointment
                            ? `
                                <div class="appointment-actions">

                                    <button
                                        type="button"
                                        class="action-button"
                                        data-action="status"
                                    >
                                        ${nextStatusButtonText(status)}
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button action-delete"
                                        data-action="delete"
                                    >
                                        🗑 Fshi
                                    </button>

                                </div>
                              `
                            : `
                                <button
                                    type="button"
                                    class="action-button quick-add-button"
                                    data-action="quick-add"
                                >
                                    + Shto
                                </button>
                              `
                    }
                </td>
            `;

            const quickAddButton =
                tr.querySelector(
                    '[data-action="quick-add"]'
                );

            if (quickAddButton) {

                quickAddButton.addEventListener(
                    "click",
                    function () {

                        const timeSelect =
                            document.getElementById(
                                "appointmentTime"
                            );

                        if (timeSelect) {
                            timeSelect.value =
                                time;
                        }

                        const patientInput =
                            document.getElementById(
                                "patientName"
                            );

                        if (patientInput) {
                            patientInput.focus();
                        }

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });

                    }
                );
            }

            const statusButton =
                tr.querySelector(
                    '[data-action="status"]'
                );

            if (statusButton && appointment) {

                statusButton.addEventListener(
                    "click",
                    async function () {

                        await changeAppointmentStatus(
                            appointment
                        );

                    }
                );
            }

            const deleteButton =
                tr.querySelector(
                    '[data-action="delete"]'
                );

            if (deleteButton && appointment) {

                deleteButton.addEventListener(
                    "click",
                    async function () {

                        await deleteAppointment(
                            appointment.id
                        );

                    }
                );
            }

            body.appendChild(tr);

        }
    );

    if (info) {

        info.textContent =
            `${occupiedCount} ${
                occupiedCount === 1
                    ? "vizitë"
                    : "vizita"
            }`;

    }
}


/* =========================================================
   GENERATE TIME SLOTS
========================================================= */

function generateTimeSlots() {

    const slots = [];

    for (
        let hour = 8;
        hour <= 18;
        hour++
    ) {

        for (
            let minute = 0;
            minute < 60;
            minute += 15
        ) {

            if (
                hour === 18 &&
                minute > 0
            ) {
                continue;
            }

            slots.push(
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
            );

        }
    }

    return slots;
}


/* =========================================================
   ADD APPOINTMENT
========================================================= */

async function addAppointment() {

    const nameElement =
        document.getElementById(
            "patientName"
        );

    const phoneElement =
        document.getElementById(
            "patientPhone"
        );

    const timeElement =
        document.getElementById(
            "appointmentTime"
        );

    const noteElement =
        document.getElementById(
            "appointmentNote"
        );

    if (!nameElement || !timeElement) {
        return;
    }

    const patientName =
        nameElement.value.trim();

    const patientPhone =
        phoneElement
            ? phoneElement.value.trim()
            : "";

    const appointmentTime =
        timeElement.value;

    const note =
        noteElement
            ? noteElement.value.trim()
            : "";

    if (!patientName) {

        showMessage(
            "Vendos emrin e pacientit.",
            "error"
        );

        return;
    }

    if (!appointmentTime) {

        showMessage(
            "Zgjidh orën e vizitës.",
            "error"
        );

        return;
    }

    const appointmentDate =
        formatDateForDatabase(
            currentDate
        );

    const duplicate =
        appointments.find(
            function (appointment) {

                return (
                    normalizeTime(
                        appointment.appointment_time
                    ) ===
                    normalizeTime(
                        appointmentTime
                    )
                );

            }
        );

    if (duplicate) {

        showMessage(
            `Ora ${appointmentTime} është tashmë e zënë.`,
            "error"
        );

        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .insert([
                {
                    patient_name:
                        patientName,

                    patient_phone:
                        patientPhone,

                    appointment_date:
                        appointmentDate,

                    appointment_time:
                        appointmentTime,

                    note:
                        note,

                    status:
                        "planned"
                }
            ])
            .select()
            .single();

        if (error) {

            console.error(
                "ADD APPOINTMENT ERROR:",
                error
            );

            showMessage(
                "Vizita nuk u shtua: " +
                error.message,
                "error"
            );

            return;
        }

        appointments.push(
            data
        );

        renderSchedule();
        updateDashboard();

        nameElement.value = "";

        if (phoneElement) {
            phoneElement.value = "";
        }

        if (noteElement) {
            noteElement.value = "";
        }

        showMessage(
            "Vizita u shtua me sukses.",
            "success"
        );

    } catch (error) {

        console.error(
            "ADD APPOINTMENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë shtimit të vizitës.",
            "error"
        );
    }
}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeAppointmentStatus(
    appointment
) {

    const currentStatus =
        appointment.status ||
        "planned";

    const nextStatus =
        getNextStatus(
            currentStatus
        );

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .update({
                status:
                    nextStatus
            })
            .eq(
                "id",
                appointment.id
            )
            .select()
            .single();

        if (error) {

            console.error(
                "CHANGE STATUS ERROR:",
                error
            );

            showMessage(
                "Statusi nuk u ndryshua: " +
                error.message,
                "error"
            );

            return;
        }

        appointments =
            appointments.map(
                function (item) {

                    return item.id === data.id
                        ? data
                        : item;

                }
            );

        renderSchedule();
        updateDashboard();

        showMessage(
            "Statusi u përditësua.",
            "success"
        );

    } catch (error) {

        console.error(
            "CHANGE STATUS EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë ndryshimit të statusit.",
            "error"
        );
    }
}


/* =========================================================
   DELETE APPOINTMENT
========================================================= */

async function deleteAppointment(
    id
) {

    const appointment =
        appointments.find(
            function (item) {
                return item.id === id;
            }
        );

    if (!appointment) return;

    const confirmed =
        window.confirm(
            `A je i sigurt që dëshiron të fshish vizitën e "${appointment.patient_name || "pacientit"}" në orën ${normalizeTime(appointment.appointment_time)}?`
        );

    if (!confirmed) return;

    try {

        const {
            error
        } = await supabaseClient
            .from("appointments")
            .delete()
            .eq(
                "id",
                id
            );

        if (error) {

            console.error(
                "DELETE APPOINTMENT ERROR:",
                error
            );

            showMessage(
                "Vizita nuk u fshi: " +
                error.message,
                "error"
            );

            return;
        }

        appointments =
            appointments.filter(
                function (item) {
                    return item.id !== id;
                }
            );

        renderSchedule();
        updateDashboard();

        showMessage(
            "Vizita u fshi.",
            "success"
        );

    } catch (error) {

        console.error(
            "DELETE APPOINTMENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë fshirjes së vizitës.",
            "error"
        );
    }
}
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="action-button action-delete"
                    data-action="delete"
                >
                    🗑 Fshi
                </button>

            </div>

        </td>

    `;

    const arrivedButton =
        tr.querySelector(
            '[data-action="arrived"]'
        );

    if (arrivedButton) {

        arrivedButton.addEventListener(
            "click",
            async function () {

                await updateAppointmentStatus(
                    appointment.id,
                    "arrived"
                );

            }
        );

    }

    const finishedButton =
        tr.querySelector(
            '[data-action="finished"]'
        );

    if (finishedButton) {

        finishedButton.addEventListener(
            "click",
            async function () {

                await updateAppointmentStatus(
                    appointment.id,
                    "finished"
                );

            }
        );

    }

    const deleteButton =
        tr.querySelector(
            '[data-action="delete"]'
        );

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async function () {

                await deleteAppointment(
                    appointment.id
                );

            }
        );

    }

    return tr;

}


/* =========================================================
   UPDATE APPOINTMENT STATUS
========================================================= */

async function updateAppointmentStatus(
    id,
    status
) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .update({
                status: status
            })
            .eq(
                "id",
                id
            )
            .select()
            .single();

        if (error) {

            console.error(
                "UPDATE STATUS ERROR:",
                error
            );

            showMessage(
                "Statusi nuk u përditësua: " +
                error.message,
                "error"
            );

            return;

        }

        appointments =
            appointments.map(
                function (appointment) {

                    return appointment.id === data.id
                        ? data
                        : appointment;

                }
            );

        renderAppointments();

        showMessage(
            "Statusi u përditësua me sukses.",
            "success"
        );

    } catch (error) {

        console.error(
            "UPDATE STATUS EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë përditësimit të statusit.",
            "error"
        );

    }

}


/* =========================================================
   DELETE APPOINTMENT
========================================================= */

async function deleteAppointment(
    id
) {

    const appointment =
        appointments.find(
            function (item) {
                return item.id === id;
            }
        );

    if (!appointment) return;

    const confirmed =
        window.confirm(
            `A je i sigurt që dëshiron të fshish vizitën e "${appointment.patient_name || "pacientit"}" në orën ${normalizeTime(appointment.appointment_time)}?`
        );

    if (!confirmed) return;

    try {

        const {
            error
        } = await supabaseClient
            .from("appointments")
            .delete()
            .eq(
                "id",
                id
            );

        if (error) {

            console.error(
                "DELETE APPOINTMENT ERROR:",
                error
            );

            showMessage(
                "Vizita nuk u fshi: " +
                error.message,
                "error"
            );

            return;

        }

        appointments =
            appointments.filter(
                function (item) {
                    return item.id !== id;
                }
            );

        renderAppointments();

        showMessage(
            "Vizita u fshi.",
            "success"
        );

    } catch (error) {

        console.error(
            "DELETE APPOINTMENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë fshirjes së vizitës.",
            "error"
        );

    }

}


/* =========================================================
   DASHBOARD COUNTERS
========================================================= */

function updateDashboardCounters() {

    const totalElement =
        document.getElementById(
            "totalAppointments"
        );

    const plannedElement =
        document.getElementById(
            "plannedAppointments"
        );

    const finishedElement =
        document.getElementById(
            "finishedAppointments"
        );

    const arrivedElement =
        document.getElementById(
            "arrivedAppointments"
        );

    const total =
        appointments.length;

    const planned =
        appointments.filter(
            function (appointment) {
                return (
                    appointment.status ===
                    "planned"
                );
            }
        ).length;

    const finished =
        appointments.filter(
            function (appointment) {
                return (
                    appointment.status ===
                    "finished"
                );
            }
        ).length;

    const arrived =
        appointments.filter(
            function (appointment) {
                return (
                    appointment.status ===
                    "arrived"
                );
            }
        ).length;

    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (plannedElement) {
        plannedElement.textContent =
            planned;
    }

    if (finishedElement) {
        finishedElement.textContent =
            finished;
    }

    if (arrivedElement) {
        arrivedElement.textContent =
            arrived;
    }

}


/* =========================================================
   OLD DASHBOARD COMPATIBILITY
========================================================= */

function updateDashboard() {

    updateDashboardCounters();

}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {

    try {

        if (realtimeChannel) {

            supabaseClient.removeChannel(
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
   PATIENT REALTIME
========================================================= */

function setupPatientsRealtime() {

    try {

        if (patientsRealtimeChannel) {

            supabaseClient.removeChannel(
                patientsRealtimeChannel
            );

        }

        patientsRealtimeChannel =
            supabaseClient
                .channel(
                    "patients-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "patients"
                    },
                    function (payload) {

                        console.log(
                            "Patients realtime update:",
                            payload
                        );

                        if (
                            currentView ===
                            "patients"
                        ) {

                            loadPatients();

                        }

                    }
                )
                .subscribe(
                    function (status) {

                        console.log(
                            "Patients realtime status:",
                            status
                        );

                    }
                );

    } catch (error) {

        console.error(
            "PATIENT REALTIME ERROR:",
            error
        );

    }

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function statusText(status) {

    switch (status) {

        case "planned":
            return "Planifikuar";

        case "arrived":
            return "Mbërritur";

        case "finished":
            return "Përfunduar";

        case "cancelled":
            return "Anuluar";

        default:
            return "Planifikuar";

    }

}


function statusClass(status) {

    switch (status) {

        case "planned":
            return "status-planned";

        case "arrived":
            return "status-arrived";

        case "finished":
            return "status-finished";

        case "cancelled":
            return "status-cancelled";

        default:
            return "status-planned";

    }

}


/* =========================================================
   NEXT STATUS
========================================================= */

function getNextStatus(status) {

    switch (status) {

        case "planned":
            return "arrived";

        case "arrived":
            return "finished";

        case "finished":
            return "planned";

        case "cancelled":
            return "planned";

        default:
            return "planned";

    }

}


function nextStatusButtonText(status) {

    switch (status) {

        case "planned":
            return "✓ Mbërriti";

        case "arrived":
            return "✓ Përfundoi";

        case "finished":
            return "↻ Planifiko";

        case "cancelled":
            return "↻ Aktivizo";

        default:
            return "✓ Mbërriti";

    }

}


/* =========================================================
   DATE DATABASE
========================================================= */

function formatDateForDatabase(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


/* =========================================================
   NORMALIZE TIME
========================================================= */

function normalizeTime(
    value
) {

    if (!value) {
        return "";
    }

    const text =
        String(value);

    return text.substring(
        0,
        5
    );

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    if (!name) {
        return "?";
    }

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
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
   SHOW MESSAGE
========================================================= */

function showMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "appMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `app-message show ${type}`;

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(
            function () {

                element.className =
                    "app-message";

            },
            3500
        );

}


/* =========================================================
   PATIENTS LOAD
========================================================= */

async function loadPatients() {

    const body =
        document.getElementById(
            "patientsBody"
        );

    if (!body) return;

    body.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="loading-cell"
            >
                <div class="loading-spinner"></div>
                Po ngarkohen pacientët...
            </td>
        </tr>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("patients")
            .select("*")
            .order(
                "full_name",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "LOAD PATIENTS ERROR:",
                error
            );

            body.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="empty-day-cell"
                    >
                        Nuk u ngarkuan pacientët:
                        ${escapeHtml(
                            error.message
                        )}
                    </td>
                </tr>
            `;

            return;

        }

        patients =
            data || [];

        renderPatients();

    } catch (error) {

        console.error(
            "LOAD PATIENTS EXCEPTION:",
            error
        );

        body.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-day-cell"
                >
                    Gabim gjatë ngarkimit të pacientëve.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   RENDER PATIENTS
========================================================= */

function renderPatients() {

    const body =
        document.getElementById(
            "patientsBody"
        );

    const countElement =
        document.getElementById(
            "patientsCount"
        );

    const searchElement =
        document.getElementById(
            "patientSearch"
        );

    if (!body) return;

    const search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";

    const filtered =
        patients.filter(
            function (patient) {

                if (!search) {
                    return true;
                }

                return [

                    patient.full_name,

                    patient.phone,

                    patient.personal_id,

                    patient.address

                ]
                    .filter(Boolean)
                    .some(
                        function (value) {

                            return String(
                                value
                            )
                                .toLowerCase()
                                .includes(
                                    search
                                );

                        }
                    );

            }
        );

    if (countElement) {

        countElement.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "pacient"
                    : "pacientë"
            }`;

    }

    body.innerHTML = "";

    if (
        filtered.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-day-cell"
                >

                    <div class="empty-day">

                        <div class="empty-day-icon">
                            👤
                        </div>

                        <h4>
                            ${
                                search
                                    ? "Nuk u gjet asnjë pacient"
                                    : "Nuk ka ende pacientë"
                            }
                        </h4>

                        <p>
                            ${
                                search
                                    ? "Provo numrin e kartelës, emrin ose telefonin."
                                    : "Kliko “Shto pacient” për të regjistruar pacientin e parë."
                            }
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;

    }

    filtered.forEach(
        function (patient) {

            body.appendChild(
                renderPatientRow(
                    patient
                )
            );

        }
    );

}


/* =========================================================
   PATIENT ROW
========================================================= */

function renderPatientRow(
    patient
) {

    const tr =
        document.createElement(
            "tr"
        );

    tr.className =
        "appointment-row";

    const name =
        patient.full_name ||
        "Pa emër";

    const phone =
        patient.phone ||
        "—";

    const birthDate =
        patient.birth_date
            ? formatPatientBirthDate(
                patient.birth_date
            )
            : "—";

    const personalId =
        patient.personal_id ||
        "—";

    const notes =
        patient.notes ||
        "—";

    const initials =
        getInitials(name);

    tr.innerHTML = `

        <td class="patient-cell">

            <div class="patient-main">

                <div class="patient-avatar">
                    ${escapeHtml(initials)}
                </div>

                <div class="patient-details">

                    <strong>
                        ${escapeHtml(name)}
                    </strong>

                    <span>
                        Kërko sipas emrit ose kodit të kartelës
                    </span>

                </div>

            </div>

        </td>

        <td class="phone-cell">

            ${
                phone !== "—"
                    ? `
                        <a
                            href="tel:${escapeHtml(phone)}"
                            class="phone-link"
                        >
                            <span>☎</span>
                            ${escapeHtml(phone)}
                        </a>
                    `
                    : `
                        <span class="muted-text">
                            —
                        </span>
                    `
            }

        </td>

        <td>
            ${escapeHtml(birthDate)}
        </td>

        <td>

            <span class="patient-id-badge">
                ${escapeHtml(personalId)}
            </span>

        </td>

        <td>

            <span
                class="note-text"
                title="${escapeHtml(notes)}"
            >
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

    tr.querySelectorAll(
        "[data-patient-action]"
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const action =
                        button.dataset
                            .patientAction;

                    if (
                        action ===
                        "view"
                    ) {

                        await viewPatient(
                            patient.id
                        );

                    } else if (
                        action ===
                        "edit"
                    ) {

                        openPatientModal(
                            patient
                        );

                    } else if (
                        action ===
                        "delete"
                    ) {

                        await deletePatient(
                            patient.id
                        );

                    }

                }
            );

        }
    );

    return tr;

}


/* =========================================================
   PATIENT BIRTH DATE
========================================================= */

function formatPatientBirthDate(
    value
) {

    try {

        const date =
            new Date(
                `${value}T00:00:00`
            );

        return date.toLocaleDateString(
            "sq-AL",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    } catch (error) {

        return value;

    }

}
                            </button>
                        `
                        : ""
                }

                ${
                    status !== "cancelled"
                        ? `
                            <button
                                type="button"
                                class="action-button action-cancel"
                                data-action="cancelled"
                                title="Anulo vizitën"
                            >
                                × Anulo
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="action-button action-delete"
                    data-action="delete"
                    title="Fshi vizitën"
                >
                    🗑 Fshi
                </button>

            </div>

        </td>

    `;

    const buttons =
        tr.querySelectorAll(
            "[data-action]"
        );

    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const action =
                        button.dataset.action;

                    if (
                        action === "delete"
                    ) {

                        await deleteAppointment(
                            appointment.id
                        );

                        return;

                    }

                    await changeStatus(
                        appointment.id,
                        action
                    );

                }
            );

        }
    );

    return tr;
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

    const nameElement =
        document.getElementById(
            "patientName"
        );

    const phoneElement =
        document.getElementById(
            "patientPhone"
        );

    const timeElement =
        document.getElementById(
            "appointmentTime"
        );

    const noteElement =
        document.getElementById(
            "appointmentNote"
        );

    if (
        !nameElement ||
        !timeElement
    ) {
        return;
    }

    const patientName =
        nameElement.value.trim();

    const patientPhone =
        phoneElement
            ? phoneElement.value.trim()
            : "";

    const appointmentTime =
        timeElement.value;

    const note =
        noteElement
            ? noteElement.value.trim()
            : "";

    if (!patientName) {

        showMessage(
            "Vendos emrin e pacientit.",
            "error"
        );

        return;
    }

    if (!appointmentTime) {

        showMessage(
            "Zgjidh orën.",
            "error"
        );

        return;
    }

    const selectedDate =
        dateKey(currentDate);

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .insert([
                {
                    patient_name:
                        patientName,

                    patient_phone:
                        patientPhone,

                    appointment_date:
                        selectedDate,

                    appointment_time:
                        appointmentTime,

                    note:
                        note,

                    status:
                        "planned"
                }
            ])
            .select();

        if (error) {

            console.error(
                "ADD APPOINTMENT ERROR:",
                error
            );

            showMessage(
                "Vizita nuk u shtua: " +
                error.message,
                "error"
            );

            return;
        }

        if (
            data &&
            data.length > 0
        ) {

            appointments.push(
                data[0]
            );

        }

        nameElement.value = "";

        if (phoneElement) {
            phoneElement.value = "";
        }

        if (noteElement) {
            noteElement.value = "";
        }

        timeElement.selectedIndex = 0;

        appointments.sort(
            function (a, b) {

                return normalizeTime(
                    a.appointment_time
                ).localeCompare(
                    normalizeTime(
                        b.appointment_time
                    )
                );

            }
        );

        renderAppointments();

        showMessage(
            "Vizita u shtua me sukses.",
            "success"
        );

    } catch (error) {

        console.error(
            "ADD APPOINTMENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë shtimit të vizitës.",
            "error"
        );

    }

}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(
    id,
    newStatus
) {

    try {

        const {
            error
        } = await supabaseClient
            .from("appointments")
            .update({
                status: newStatus
            })
            .eq(
                "id",
                id
            );

        if (error) {

            console.error(
                "CHANGE STATUS ERROR:",
                error
            );

            showMessage(
                "Statusi nuk u ndryshua: " +
                error.message,
                "error"
            );

            return;
        }

        appointments =
            appointments.map(
                function (appointment) {

                    if (
                        appointment.id === id
                    ) {

                        return {
                            ...appointment,
                            status: newStatus
                        };

                    }

                    return appointment;

                }
            );

        renderAppointments();

        showMessage(
            "Statusi u ndryshua.",
            "success"
        );

    } catch (error) {

        console.error(
            "CHANGE STATUS EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë ndryshimit të statusit.",
            "error"
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteAppointment(id) {

    const confirmed =
        window.confirm(
            "A je i sigurt që dëshiron ta fshish këtë vizitë?"
        );

    if (!confirmed) return;

    try {

        const {
            error
        } = await supabaseClient
            .from("appointments")
            .delete()
            .eq(
                "id",
                id
            );

        if (error) {

            console.error(
                "DELETE APPOINTMENT ERROR:",
                error
            );

            showMessage(
                "Vizita nuk u fshi: " +
                error.message,
                "error"
            );

            return;
        }

        appointments =
            appointments.filter(
                function (appointment) {

                    return (
                        appointment.id !== id
                    );

                }
            );

        renderAppointments();

        showMessage(
            "Vizita u fshi.",
            "success"
        );

    } catch (error) {

        console.error(
            "DELETE EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë fshirjes.",
            "error"
        );

    }

}


/* =========================================================
   REALTIME
========================================================= */

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
