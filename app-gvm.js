const APP_VERSION = "GVM-20260924-18";

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
let patientSearchTerm = "";
let editingPatientId = null;
let editingAppointmentId = null;

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    console.log("=================================");
    console.log("AMBULATORI GVM");
    console.log("VERSION:", APP_VERSION);
    console.log("=================================");

    startAmbulatoriGVM();
});


async function startAmbulatoriGVM() {
    try {
        if (!window.supabase) {
            showFatalError(
                "Supabase nuk u ngarkua. Kontrollo index.html dhe CDN."
            );
            return;
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log("Supabase initialized.");

        await checkSession();

    } catch (error) {
        console.error("START ERROR:", error);

        showFatalError(
            error && error.message
                ? error.message
                : "Gabim gjatë nisjes së sistemit."
        );
    }
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


function displayDate(date) {
    return date.toLocaleDateString("sq-AL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


function normalizeDate(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}


function showMessage(message, type) {
    const element = document.getElementById("appMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = "app-message " + (type || "success");

    element.style.display = "block";

    setTimeout(function () {
        if (element) {
            element.style.display = "none";
        }
    }, 4000);
}


function getStatusLabel(status) {
    if (status === "completed") {
        return "Përfunduar";
    }

    if (status === "cancelled") {
        return "Anuluar";
    }

    if (status === "waiting") {
        return "Në pritje";
    }

    return "Planifikuar";
}


function getStatusClass(status) {
    if (status === "completed") {
        return "status-completed";
    }

    if (status === "cancelled") {
        return "status-cancelled";
    }

    if (status === "waiting") {
        return "status-waiting";
    }

    return "status-planned";
}


/* =========================================================
   FATAL ERROR
========================================================= */

function showFatalError(message) {
    let app = document.getElementById("app");

    if (!app) {
        app = document.createElement("div");
        app.id = "app";
        document.body.appendChild(app);
    }

    app.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:25px;
            box-sizing:border-box;
            background:#f4f8fa;
            font-family:Arial,sans-serif;
        ">
            <div style="
                max-width:650px;
                width:100%;
                background:#fff;
                border-radius:18px;
                padding:35px;
                box-shadow:0 15px 45px rgba(0,0,0,.10);
                border:1px solid #e0eaed;
                text-align:center;
            ">
                <div style="
                    font-size:55px;
                    margin-bottom:15px;
                ">🏥</div>

                <h2 style="
                    margin:0 0 15px;
                    color:#263c43;
                ">
                    AMBULATORI GVM
                </h2>

                <p style="
                    color:#b42318;
                    font-weight:700;
                    line-height:1.6;
                ">
                    ${escapeHtml(message)}
                </p>

                <p style="
                    color:#718188;
                    font-size:13px;
                ">
                    Hap F12 → Console për të parë gabimin teknik.
                </p>

                <button
                    type="button"
                    onclick="location.reload()"
                    style="
                        margin-top:10px;
                        border:0;
                        background:#0f766e;
                        color:white;
                        padding:12px 20px;
                        border-radius:9px;
                        cursor:pointer;
                        font-weight:800;
                    "
                >
                    Rifresko faqen
                </button>
            </div>
        </div>
    `;
}


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {
    try {
        console.log("Checking session...");

        const result =
            await supabaseClient.auth.getSession();

        if (result.error) {
            console.error(
                "GET SESSION ERROR:",
                result.error
            );

            showLogin();
            return;
        }

        currentUser =
            result.data &&
            result.data.session
                ? result.data.session.user
                : null;

        if (currentUser) {
            console.log(
                "Existing session:",
                currentUser.email
            );

            await showApp();
        } else {
            console.log("No active session.");
            showLogin();
        }

        supabaseClient.auth.onAuthStateChange(
            async function (event, session) {
                console.log("Auth event:", event);

                currentUser =
                    session
                        ? session.user
                        : null;

                if (currentUser) {
                    console.log(
                        "Authenticated:",
                        currentUser.email
                    );

                    await showApp();
                } else {
                    cleanupRealtime();
                    showLogin();
                }
            }
        );

    } catch (error) {
        console.error(
            "CHECK SESSION ERROR:",
            error
        );

        showLogin();
    }
}


/* =========================================================
   LOGIN
========================================================= */

function showLogin() {
    cleanupRealtime();

    const app =
        document.getElementById("app");

    if (!app) {
        showFatalError(
            "Elementi #app mungon në index.html."
        );
        return;
    }

    app.innerHTML = `
        <div class="gvm-login-page">

            <div class="gvm-login-box">

                <div class="gvm-login-logo">
                    GVM
                </div>

                <div class="gvm-login-icon">
                    🏥
                </div>

                <h1>
                    AMBULATORI GVM
                </h1>

                <p class="gvm-login-subtitle">
                    Sistemi i menaxhimit të pacientëve dhe vizitave
                </p>

                <form id="loginForm">

                    <label>
                        Email
                    </label>

                    <input
                        id="loginEmail"
                        type="email"
                        autocomplete="username"
                        placeholder="Shkruaj email"
                        required
                    >

                    <label>
                        Fjalëkalimi
                    </label>

                    <input
                        id="loginPassword"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Shkruaj fjalëkalimin"
                        required
                    >

                    <button
                        type="submit"
                        class="gvm-login-button"
                    >
                        Hyr në sistem
                    </button>

                    <div
                        id="loginError"
                        class="gvm-login-error"
                    ></div>

                </form>

            </div>

        </div>
    `;

    injectStyles();

    const form =
        document.getElementById("loginForm");

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


async function login() {
    const emailElement =
        document.getElementById("loginEmail");

    const passwordElement =
        document.getElementById("loginPassword");

    const errorElement =
        document.getElementById("loginError");

    if (!emailElement || !passwordElement) {
        return;
    }

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    if (!email || !password) {
        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.textContent =
                "Plotëso email dhe fjalëkalimin.";
        }

        return;
    }

    try {
        if (errorElement) {
            errorElement.style.display = "none";
            errorElement.textContent = "";
        }

        const result =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (result.error) {
            console.error(
                "LOGIN ERROR:",
                result.error
            );

            if (errorElement) {
                errorElement.style.display = "block";
                errorElement.textContent =
                    result.error.message ||
                    "Email ose fjalëkalim i gabuar.";
            }

            return;
        }

        currentUser =
            result.data.user || null;

        if (currentUser) {
            await showApp();
        }

    } catch (error) {
        console.error(
            "LOGIN EXCEPTION:",
            error
        );

        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.textContent =
                "Ndodhi një gabim gjatë hyrjes.";
        }
    }
}


async function logout() {
    try {
        cleanupRealtime();

        await supabaseClient.auth.signOut();

        currentUser = null;

        showLogin();

    } catch (error) {
        console.error(
            "LOGOUT ERROR:",
            error
        );
    }
}


/* =========================================================
   REALTIME CLEANUP
========================================================= */

function cleanupRealtime() {
    if (realtimeChannel && supabaseClient) {
        try {
            supabaseClient.removeChannel(
                realtimeChannel
            );
        } catch (error) {
            console.error(
                "REMOVE APPOINTMENT CHANNEL ERROR:",
                error
            );
        }

        realtimeChannel = null;
    }

    if (
        patientsRealtimeChannel &&
        supabaseClient
    ) {
        try {
            supabaseClient.removeChannel(
                patientsRealtimeChannel
            );
        } catch (error) {
            console.error(
                "REMOVE PATIENT CHANNEL ERROR:",
                error
            );
        }

        patientsRealtimeChannel = null;
    }
}


/* =========================================================
   MAIN APP
========================================================= */

async function showApp() {
    const app =
        document.getElementById("app");

    if (!app) {
        showFatalError(
            "Elementi #app mungon nga index.html."
        );
        return;
    }

    injectStyles();

    app.innerHTML = `
        <header class="gvm-header">

            <div class="gvm-header-inner">

                <div class="gvm-brand">

                    <div class="gvm-brand-icon">
                        GVM
                    </div>

                    <div>
                        <h1>
                            AMBULATORI GVM
                        </h1>

                        <small>
                            Menaxhimi i pacientëve dhe vizitave
                        </small>
                    </div>

                </div>

                <div class="gvm-header-actions">

                    <div class="gvm-online">
                        <span></span>
                        Online
                    </div>

                    <span
                        id="userEmail"
                        class="gvm-user-email"
                    ></span>

                    <button
                        id="logoutButton"
                        class="gvm-logout"
                        type="button"
                    >
                        Dil
                    </button>

                </div>

            </div>

        </header>


        <main class="gvm-main">

            <div
                id="appMessage"
                class="app-message"
            ></div>


            <nav class="gvm-navigation">

                <button
                    id="navAppointments"
                    class="gvm-nav-button active"
                    type="button"
                >
                    📅 Vizitat
                </button>

                <button
                    id="navPatients"
                    class="gvm-nav-button"
                    type="button"
                >
                    👤 Pacientët
                </button>

            </nav>


            <section id="appointmentsView">

                <div class="gvm-page-heading">

                    <div>
                        <div class="gvm-kicker">
                            PANELI I AMBULATORIT
                        </div>

                        <h2>
                            Orari i vizitave
                        </h2>
                    </div>

                    <div class="gvm-date-controls">

                        <button
                            id="previousDay"
                            class="gvm-date-button"
                            type="button"
                        >
                            ←
                        </button>

                        <div
                            id="currentDateLabel"
                            class="gvm-current-date"
                        ></div>

                        <button
                            id="nextDay"
                            class="gvm-date-button"
                            type="button"
                        >
                            →
                        </button>

                        <button
                            id="todayButton"
                            class="gvm-today-button"
                            type="button"
                        >
                            Sot
                        </button>

                    </div>

                </div>


                <div class="gvm-dashboard">

                    <div class="gvm-card">
                        <span>Vizita totale</span>
                        <strong id="totalAppointments">0</strong>
                    </div>

                    <div class="gvm-card">
                        <span>Në pritje</span>
                        <strong id="waitingAppointments">0</strong>
                    </div>

                    <div class="gvm-card">
                        <span>Përfunduar</span>
                        <strong id="completedAppointments">0</strong>
                    </div>

                    <div class="gvm-card">
                        <span>Anuluar</span>
                        <strong id="cancelledAppointments">0</strong>
                    </div>

                </div>


                <div class="gvm-grid">

                    <div class="gvm-panel">

                        <div class="gvm-panel-header">
                            <div>
                                <h3>
                                    Shto vizitë
                                </h3>

                                <p>
                                    Regjistro një vizitë të re
                                </p>
                            </div>
                        </div>

                        <form id="appointmentForm">

                            <input
                                type="hidden"
                                id="appointmentId"
                            >

                            <div class="gvm-form-group">

                                <label>
                                    Emri i pacientit
                                </label>

                                <input
                                    id="appointmentPatient"
                                    type="text"
                                    placeholder="Emri dhe mbiemri"
                                    required
                                >

                            </div>


                            <div class="gvm-form-group">

                                <label>
                                    Telefoni
                                </label>

                                <input
                                    id="appointmentPhone"
                                    type="text"
                                    placeholder="Numri i telefonit"
                                >

                            </div>


                            <div class="gvm-form-row">

                                <div class="gvm-form-group">

                                    <label>
                                        Ora
                                    </label>

                                    <input
                                        id="appointmentTime"
                                        type="time"
                                        required
                                    >

                                </div>

                                <div class="gvm-form-group">

                                    <label>
                                        Statusi
                                    </label>

                                    <select id="appointmentStatus">
                                        <option value="planned">
                                            Planifikuar
                                        </option>

                                        <option value="waiting">
                                            Në pritje
                                        </option>

                                        <option value="completed">
                                            Përfunduar
                                        </option>

                                        <option value="cancelled">
                                            Anuluar
                                        </option>
                                    </select>

                                </div>

                            </div>


                            <div class="gvm-form-group">

                                <label>
                                    Shënim
                                </label>

                                <textarea
                                    id="appointmentNote"
                                    rows="4"
                                    placeholder="Shënim për vizitën..."
                                ></textarea>

                            </div>


                            <div class="gvm-form-actions">

                                <button
                                    type="submit"
                                    class="gvm-primary-button"
                                    id="saveAppointmentButton"
                                >
                                    ➕ Shto vizitën
                                </button>

                                <button
                                    type="button"
                                    class="gvm-secondary-button"
                                    id="cancelAppointmentEdit"
                                    style="display:none;"
                                >
                                    Anulo ndryshimin
                                </button>

                            </div>

                        </form>

                    </div>


                    <div class="gvm-panel">

                        <div class="gvm-panel-header">

                            <div>
                                <h3>
                                    Orari i ditës
                                </h3>

                                <p id="scheduleSubtitle">
                                    Vizitat e planifikuara
                                </p>
                            </div>

                        </div>

                        <div
                            id="scheduleContainer"
                            class="gvm-schedule"
                        ></div>

                    </div>

                </div>

            </section>


            <section
                id="patientsView"
                style="display:none;"
            >

                <div class="gvm-page-heading">

                    <div>
                        <div class="gvm-kicker">
                            REGJISTRI MJEKËSOR
                        </div>

                        <h2>
                            Pacientët
                        </h2>
                    </div>

                    <button
                        id="addPatientButton"
                        class="gvm-primary-button"
                        type="button"
                    >
                        ➕ Pacient i ri
                    </button>

                </div>


                <div class="gvm-patient-toolbar">

                    <input
                        id="patientSearch"
                        type="search"
                        placeholder="🔎 Kërko pacient..."
                    >

                    <div
                        id="patientCount"
                        class="gvm-patient-count"
                    >
                        0 pacientë
                    </div>

                </div>


                <div
                    id="patientsContainer"
                    class="gvm-patients-container"
                ></div>

            </section>

        </main>


        <div
            id="patientModal"
            class="gvm-modal"
            style="display:none;"
        >

            <div class="gvm-modal-box">

                <div class="gvm-modal-header">

                    <div>
                        <h3 id="patientModalTitle">
                            Pacient i ri
                        </h3>

                        <p>
                            Të dhënat e pacientit
                        </p>
                    </div>

                    <button
                        id="closePatientModal"
                        class="gvm-close-button"
                        type="button"
                    >
                        ×
                    </button>

                </div>


                <form id="patientForm">

                    <input
                        type="hidden"
                        id="patientId"
                    >

                    <div class="gvm-form-group">
                        <label>Emri dhe mbiemri *</label>

                        <input
                            id="patientFullName"
                            type="text"
                            required
                        >
                    </div>


                    <div class="gvm-form-row">

                        <div class="gvm-form-group">
                            <label>Telefoni</label>

                            <input
                                id="patientPhone"
                                type="text"
                            >
                        </div>

                        <div class="gvm-form-group">
                            <label>Datëlindja</label>

                            <input
                                id="patientBirthDate"
                                type="date"
                            >
                        </div>

                    </div>


                    <div class="gvm-form-group">
                        <label>Nr. personal</label>

                        <input
                            id="patientPersonalId"
                            type="text"
                        >
                    </div>


                    <div class="gvm-form-group">
                        <label>Adresa</label>

                        <input
                            id="patientAddress"
                            type="text"
                        >
                    </div>


                    <div class="gvm-form-group">
                        <label>Shënime</label>

                        <textarea
                            id="patientNotes"
                            rows="5"
                        ></textarea>
                    </div>


                    <div class="gvm-form-actions">

                        <button
                            type="submit"
                            class="gvm-primary-button"
                        >
                            Ruaj pacientin
                        </button>

                        <button
                            type="button"
                            id="cancelPatientButton"
                            class="gvm-secondary-button"
                        >
                            Anulo
                        </button>

                    </div>

                </form>

            </div>

        </div>


        <div
            id="patientViewModal"
            class="gvm-modal"
            style="display:none;"
        >

            <div class="gvm-modal-box gvm-patient-view-box">

                <div class="gvm-modal-header">

                    <div>
                        <h3 id="patientViewName">
                            Pacienti
                        </h3>

                        <p>
                            Kartela e pacientit
                        </p>
                    </div>

                    <button
                        id="closePatientViewModal"
                        class="gvm-close-button"
                        type="button"
                    >
                        ×
                    </button>

                </div>

                <div
                    id="patientDetails"
                    class="gvm-patient-details"
                ></div>

                <div class="gvm-history-title">
                    Historiku i vizitave
                </div>

                <div
                    id="patientHistory"
                    class="gvm-patient-history"
                ></div>

            </div>

        </div>
    `;

    const userEmail =
        document.getElementById("userEmail");

    if (userEmail && currentUser) {
        userEmail.textContent =
            currentUser.email || "";
    }

    bindAppEvents();

    await loadAllData();

    setupRealtime();

    switchView(currentView);
}


/* =========================================================
   EVENTS
========================================================= */

function bindAppEvents() {
    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    const navAppointments =
        document.getElementById("navAppointments");

    if (navAppointments) {
        navAppointments.addEventListener(
            "click",
            function () {
                switchView("appointments");
            }
        );
    }


    const navPatients =
        document.getElementById("navPatients");

    if (navPatients) {
        navPatients.addEventListener(
            "click",
            function () {
                switchView("patients");
            }
        );
    }


    const previousDay =
        document.getElementById("previousDay");

    if (previousDay) {
        previousDay.addEventListener(
            "click",
            function () {
                currentDate.setDate(
                    currentDate.getDate() - 1
                );

                renderAppointments();
            }
        );
    }


    const nextDay =
        document.getElementById("nextDay");

    if (nextDay) {
        nextDay.addEventListener(
            "click",
            function () {
                currentDate.setDate(
                    currentDate.getDate() + 1
                );

                renderAppointments();
            }
        );
    }


    const todayButton =
        document.getElementById("todayButton");

    if (todayButton) {
        todayButton.addEventListener(
            "click",
            function () {
                currentDate = new Date();
                renderAppointments();
            }
        );
    }


    const appointmentForm =
        document.getElementById("appointmentForm");

    if (appointmentForm) {
        appointmentForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();
                await saveAppointment();
            }
        );
    }


    const cancelAppointmentEdit =
        document.getElementById(
            "cancelAppointmentEdit"
        );

    if (cancelAppointmentEdit) {
        cancelAppointmentEdit.addEventListener(
            "click",
            resetAppointmentForm
        );
    }


    const addPatientButton =
        document.getElementById(
            "addPatientButton"
        );

    if (addPatientButton) {
        addPatientButton.addEventListener(
            "click",
            function () {
                openPatientModal();
            }
        );
    }


    const patientForm =
        document.getElementById("patientForm");

    if (patientForm) {
        patientForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();
                await savePatient();
            }
        );
    }


    const closePatientModal =
        document.getElementById(
            "closePatientModal"
        );

    if (closePatientModal) {
        closePatientModal.addEventListener(
            "click",
            closePatientEditor
        );
    }


    const cancelPatientButton =
        document.getElementById(
            "cancelPatientButton"
        );

    if (cancelPatientButton) {
        cancelPatientButton.addEventListener(
            "click",
            closePatientEditor
        );
    }


    const closePatientViewModal =
        document.getElementById(
            "closePatientViewModal"
        );

    if (closePatientViewModal) {
        closePatientViewModal.addEventListener(
            "click",
            closePatientView
        );
    }


    const patientSearch =
        document.getElementById("patientSearch");

    if (patientSearch) {
        patientSearch.addEventListener(
            "input",
            function () {
                patientSearchTerm =
                    patientSearch.value
                        .trim()
                        .toLowerCase();

                renderPatients();
            }
        );
    }


    const patientModal =
        document.getElementById("patientModal");

    if (patientModal) {
        patientModal.addEventListener(
            "click",
            function (event) {
                if (event.target === patientModal) {
                    closePatientEditor();
                }
            }
        );
    }


    const patientViewModal =
        document.getElementById(
            "patientViewModal"
        );

    if (patientViewModal) {
        patientViewModal.addEventListener(
            "click",
            function (event) {
                if (
                    event.target ===
                    patientViewModal
                ) {
                    closePatientView();
                }
            }
        );
    }
}


/* =========================================================
   VIEW
========================================================= */

function switchView(view) {
    currentView = view;

    const appointmentsView =
        document.getElementById(
            "appointmentsView"
        );

    const patientsView =
        document.getElementById(
            "patientsView"
        );

    const navAppointments =
        document.getElementById(
            "navAppointments"
        );

    const navPatients =
        document.getElementById(
            "navPatients"
        );

    if (view === "patients") {
        if (appointmentsView) {
            appointmentsView.style.display =
                "none";
        }

        if (patientsView) {
            patientsView.style.display =
                "block";
        }

        if (navAppointments) {
            navAppointments.classList.remove(
                "active"
            );
        }

        if (navPatients) {
            navPatients.classList.add(
                "active"
            );
        }

        renderPatients();

    } else {
        if (appointmentsView) {
            appointmentsView.style.display =
                "block";
        }

        if (patientsView) {
            patientsView.style.display =
                "none";
        }

        if (navAppointments) {
            navAppointments.classList.add(
                "active"
            );
        }

        if (navPatients) {
            navPatients.classList.remove(
                "active"
            );
        }

        renderAppointments();
    }
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadAllData() {
    await Promise.all([
        loadAppointments(),
        loadPatients()
    ]);

    renderAppointments();
    renderPatients();
}


async function loadAppointments() {
    try {
        const result =
            await supabaseClient
                .from("appointments")
                .select("*")
                .order(
                    "appointment_date",
                    { ascending: true }
                )
                .order(
                    "appointment_time",
                    { ascending: true }
                );

        if (result.error) {
            console.error(
                "LOAD APPOINTMENTS ERROR:",
                result.error
            );

            showMessage(
                "Nuk u ngarkuan vizitat: " +
                result.error.message,
                "error"
            );

            appointments = [];
            return;
        }

        appointments =
            result.data || [];

        console.log(
            "Appointments loaded:",
            appointments.length
        );

    } catch (error) {
        console.error(
            "LOAD APPOINTMENTS EXCEPTION:",
            error
        );

        appointments = [];
    }
}


async function loadPatients() {
    try {
        const result =
            await supabaseClient
                .from("patients")
                .select("*")
                .order(
                    "full_name",
                    { ascending: true }
                );

        if (result.error) {
            console.error(
                "LOAD PATIENTS ERROR:",
                result.error
            );

            showMessage(
                "Nuk u ngarkuan pacientët: " +
                result.error.message,
                "error"
            );

            patients = [];
            return;
        }

        patients =
            result.data || [];

        console.log(
            "Patients loaded:",
            patients.length
        );

    } catch (error) {
        console.error(
            "LOAD PATIENTS EXCEPTION:",
            error
        );

        patients = [];
    }
}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {
    cleanupRealtime();

    if (!supabaseClient) {
        return;
    }

    realtimeChannel =
        supabaseClient
            .channel(
                "gvm-appointments-" +
                Date.now()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "appointments"
                },
                async function () {
                    console.log(
                        "Realtime appointment update"
                    );

                    await loadAppointments();
                    renderAppointments();
                    renderPatients();
                }
            )
            .subscribe(
                function (status) {
                    console.log(
                        "Appointments realtime:",
                        status
                    );
                }
            );


    patientsRealtimeChannel =
        supabaseClient
            .channel(
                "gvm-patients-" +
                Date.now()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "patients"
                },
                async function () {
                    console.log(
                        "Realtime patient update"
                    );

                    await loadPatients();
                    renderPatients();
                }
            )
            .subscribe(
                function (status) {
                    console.log(
                        "Patients realtime:",
                        status
                    );
                }
            );
}


/* =========================================================
   APPOINTMENTS RENDER
========================================================= */

function renderAppointments() {
    const dateString =
        formatDate(currentDate);

    const dateLabel =
        document.getElementById(
            "currentDateLabel"
        );

    if (dateLabel) {
        dateLabel.textContent =
            displayDate(currentDate);
    }


    const subtitle =
        document.getElementById(
            "scheduleSubtitle"
        );

    if (subtitle) {
        subtitle.textContent =
            displayDate(currentDate);
    }


    const dayAppointments =
        appointments
            .filter(function (item) {
                return (
                    String(
                        item.appointment_date || ""
                    ).substring(0, 10) ===
                    dateString
                );
            })
            .sort(function (a, b) {
                const timeA =
                    String(
                        a.appointment_time || ""
                    );

                const timeB =
                    String(
                        b.appointment_time || ""
                    );

                return timeA.localeCompare(
                    timeB
                );
            });


    const total =
        document.getElementById(
            "totalAppointments"
        );

    const waiting =
        document.getElementById(
            "waitingAppointments"
        );

    const completed =
        document.getElementById(
            "completedAppointments"
        );

    const cancelled =
        document.getElementById(
            "cancelledAppointments"
        );


    if (total) {
        total.textContent =
            dayAppointments.length;
    }

    if (waiting) {
        waiting.textContent =
            dayAppointments.filter(
                function (item) {
                    return item.status === "waiting";
                }
            ).length;
    }

    if (completed) {
        completed.textContent =
            dayAppointments.filter(
                function (item) {
                    return item.status === "completed";
                }
            ).length;
    }

    if (cancelled) {
        cancelled.textContent =
            dayAppointments.filter(
                function (item) {
                    return item.status === "cancelled";
                }
            ).length;
    }


    renderSchedule(dayAppointments);
}


function renderSchedule(dayAppointments) {
    const container =
        document.getElementById(
            "scheduleContainer"
        );

    if (!container) {
        return;
    }


    if (!dayAppointments.length) {
        container.innerHTML = `
            <div class="gvm-empty">
                <div class="gvm-empty-icon">📅</div>
                <strong>Nuk ka vizita për këtë ditë.</strong>
                <span>Shto një vizitë nga formulari.</span>
            </div>
        `;

        return;
    }


    let html = "";

    dayAppointments.forEach(
        function (appointment) {

            html += `
                <div class="gvm-appointment-row">

                    <div class="gvm-appointment-time">
                        ${escapeHtml(
                            formatTime(
                                appointment.appointment_time
                            )
                        )}
                    </div>

                    <div class="gvm-appointment-main">

                        <strong>
                            ${escapeHtml(
                                appointment.patient_name
                            )}
                        </strong>

                        <div class="gvm-appointment-meta">

                            ${
                                appointment.patient_phone
                                    ? "📞 " +
                                      escapeHtml(
                                          appointment.patient_phone
                                      )
                                    : ""
                            }

                            ${
                                appointment.note
                                    ? " · " +
                                      escapeHtml(
                                          appointment.note
                                      )
                                    : ""
                            }

                        </div>

                    </div>

                    <div>
                        <span class="
                            gvm-status
                            ${getStatusClass(
                                appointment.status
                            )}
                        ">
                            ${getStatusLabel(
                                appointment.status
                            )}
                        </span>
                    </div>

                    <div class="gvm-appointment-actions">

                        <button
                            type="button"
                            class="gvm-small-button"
                            onclick="editAppointment('${escapeJsAttribute(
                                appointment.id
                            )}')"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="gvm-small-button"
                            onclick="completeAppointment('${escapeJsAttribute(
                                appointment.id
                            )}')"
                        >
                            ✓
                        </button>

                        <button
                            type="button"
                            class="gvm-small-button danger"
                            onclick="deleteAppointment('${escapeJsAttribute(
                                appointment.id
                            )}')"
                        >
                            🗑️
                        </button>

                    </div>

                </div>
            `;
        }
    );


    container.innerHTML = html;
}


function formatTime(value) {
    if (!value) {
        return "";
    }

    return String(value).substring(0, 5);
}


function escapeJsAttribute(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


/* =========================================================
   SAVE APPOINTMENT
========================================================= */

async function saveAppointment() {
    const patientName =
        document.getElementById(
            "appointmentPatient"
        );

    const patientPhone =
        document.getElementById(
            "appointmentPhone"
        );

    const appointmentTime =
        document.getElementById(
            "appointmentTime"
        );

    const appointmentStatus =
        document.getElementById(
            "appointmentStatus"
        );

    const appointmentNote =
        document.getElementById(
            "appointmentNote"
        );

    if (!patientName || !appointmentTime) {
        return;
    }


    const name =
        patientName.value.trim();

    const phone =
        patientPhone
            ? patientPhone.value.trim()
            : "";

    const time =
        appointmentTime.value;

    const status =
        appointmentStatus
            ? appointmentStatus.value
            : "planned";

    const note =
        appointmentNote
            ? appointmentNote.value.trim()
            : "";


    if (!name || !time) {
        showMessage(
            "Plotëso emrin e pacientit dhe orën.",
            "error"
        );

        return;
    }


    const payload = {
        patient_name: name,
        patient_phone: phone,
        appointment_date: formatDate(
            currentDate
        ),
        appointment_time: time,
        note: note,
        status: status
    };


    try {
        let result;

        if (editingAppointmentId) {
            result =
                await supabaseClient
                    .from("appointments")
                    .update(payload)
                    .eq(
                        "id",
                        editingAppointmentId
                    );
        } else {
            result =
                await supabaseClient
                    .from("appointments")
                    .insert([payload]);
        }


        if (result.error) {
            console.error(
                "SAVE APPOINTMENT ERROR:",
                result.error
            );

            showMessage(
                "Gabim: " +
                result.error.message,
                "error"
            );

            return;
        }


        showMessage(
            editingAppointmentId
                ? "Vizita u ndryshua me sukses."
                : "Vizita u shtua me sukses.",
            "success"
        );


        resetAppointmentForm();

        await loadAppointments();

        renderAppointments();

    } catch (error) {
        console.error(
            "SAVE APPOINTMENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë ruajtjes së vizitës.",
            "error"
        );
    }
}


/* =========================================================
   EDIT APPOINTMENT
========================================================= */

function editAppointment(id) {
    const appointment =
        appointments.find(
            function (item) {
                return String(item.id) === String(id);
            }
        );

    if (!appointment) {
        return;
    }


    editingAppointmentId =
        appointment.id;


    const patient =
        document.getElementById(
            "appointmentPatient"
        );

    const phone =
        document.getElementById(
            "appointmentPhone"
        );

    const time =
        document.getElementById(
            "appointmentTime"
        );

    const status =
        document.getElementById(
            "appointmentStatus"
        );

    const note =
        document.getElementById(
            "appointmentNote"
        );

    if (patient) {
        patient.value =
            appointment.patient_name || "";
    }

    if (phone) {
        phone.value =
            appointment.patient_phone || "";
    }

    if (time) {
        time.value =
            formatTime(
                appointment.appointment_time
            );
    }

    if (status) {
        status.value =
            appointment.status || "planned";
    }

    if (note) {
        note.value =
            appointment.note || "";
    }


    const button =
        document.getElementById(
            "saveAppointmentButton"
        );

    if (button) {
        button.textContent =
            "💾 Ruaj ndryshimet";
    }


    const cancel =
        document.getElementById(
            "cancelAppointmentEdit"
        );

    if (cancel) {
        cancel.style.display =
            "inline-flex";
    }


    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function resetAppointmentForm() {
    editingAppointmentId = null;

    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (form) {
        form.reset();
    }


    const status =
        document.getElementById(
            "appointmentStatus"
        );

    if (status) {
        status.value = "planned";
    }


    const button =
        document.getElementById(
            "saveAppointmentButton"
        );

    if (button) {
        button.textContent =
            "➕ Shto vizitën";
    }


    const cancel =
        document.getElementById(
            "cancelAppointmentEdit"
        );

    if (cancel) {
        cancel.style.display =
            "none";
    }
}


/* =========================================================
   COMPLETE APPOINTMENT
========================================================= */

async function completeAppointment(id) {
    try {
        const result =
            await supabaseClient
                .from("appointments")
                .update({
                    status: "completed"
                })
                .eq("id", id);

        if (result.error) {
            showMessage(
                "Gabim: " +
                result.error.message,
                "error"
            );

            return;
        }

        await loadAppointments();

        renderAppointments();

        showMessage(
            "Vizita u shënua si e përfunduar.",
            "success"
        );

    } catch (error) {
        console.error(
            "COMPLETE APPOINTMENT ERROR:",
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

async function deleteAppointment(id) {
    const confirmed =
        window.confirm(
            "A dëshiron ta fshish këtë vizitë?"
        );

    if (!confirmed) {
        return;
    }


    try {
        const result =
            await supabaseClient
                .from("appointments")
                .delete()
                .eq("id", id);

        if (result.error) {
            console.error(
                "DELETE APPOINTMENT ERROR:",
                result.error
            );

            showMessage(
                "Gabim: " +
                result.error.message,
                "error"
            );

            return;
        }


        await loadAppointments();

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
   PATIENTS
========================================================= */

function renderPatients() {
    const container =
        document.getElementById(
            "patientsContainer"
        );

    if (!container) {
        return;
    }


    const search =
        patientSearchTerm;


    const filtered =
        patients.filter(
            function (patient) {

                if (!search) {
                    return true;
                }

                const text =
                    (
                        String(
                            patient.full_name || ""
                        ) +
                        " " +
                        String(
                            patient.phone || ""
                        ) +
                        " " +
                        String(
                            patient.personal_id || ""
                        )
                    ).toLowerCase();

                return text.includes(search);
            }
        );


    const count =
        document.getElementById(
            "patientCount"
        );

    if (count) {
        count.textContent =
            filtered.length +
            (
                filtered.length === 1
                    ? " pacient"
                    : " pacientë"
            );
    }


    if (!filtered.length) {
        container.innerHTML = `
            <div class="gvm-empty">
                <div class="gvm-empty-icon">👤</div>
                <strong>
                    ${
                        search
                            ? "Nuk u gjet asnjë pacient."
                            : "Nuk ka ende pacientë."
                    }
                </strong>
                <span>
                    Shto pacientin e parë.
                </span>
            </div>
        `;

        return;
    }


    let html = "";

    filtered.forEach(
        function (patient) {

            html += `
                <div class="gvm-patient-card">

                    <div class="gvm-patient-avatar">
                        ${getInitials(
                            patient.full_name
                        )}
                    </div>

                    <div class="gvm-patient-info">

                        <strong>
                            ${escapeHtml(
                                patient.full_name
                            )}
                        </strong>

                        <span>
                            ${
                                patient.phone
                                    ? "📞 " +
                                      escapeHtml(
                                          patient.phone
                                      )
                                    : "Pa telefon"
                            }
                        </span>

                        <span>
                            ${
                                patient.birth_date
                                    ? "🎂 " +
                                      escapeHtml(
                                          patient.birth_date
                                      )
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="gvm-patient-actions">

                        <button
                            type="button"
                            class="gvm-small-button"
                            onclick="viewPatient('${escapeJsAttribute(
                                patient.id
                            )}')"
                        >
                            👁️
                        </button>

                        <button
                            type="button"
                            class="gvm-small-button"
                            onclick="editPatient('${escapeJsAttribute(
                                patient.id
                            )}')"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="gvm-small-button danger"
                            onclick="deletePatient('${escapeJsAttribute(
                                patient.id
                            )}')"
                        >
                            🗑️
                        </button>

                    </div>

                </div>
            `;
        }
    );


    container.innerHTML = html;
}


function getInitials(name) {
    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "P";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   PATIENT MODAL
========================================================= */

function openPatientModal(patient) {
    editingPatientId =
        patient && patient.id
            ? patient.id
            : null;


    const modal =
        document.getElementById(
            "patientModal"
        );

    if (!modal) {
        return;
    }


    const title =
        document.getElementById(
            "patientModalTitle"
        );

    if (title) {
        title.textContent =
            editingPatientId
                ? "Ndrysho pacientin"
                : "Pacient i ri";
    }


    const id =
        document.getElementById("patientId");

    const name =
        document.getElementById(
            "patientFullName"
        );

    const phone =
        document.getElementById(
            "patientPhone"
        );

    const birthDate =
        document.getElementById(
            "patientBirthDate"
        );

    const personalId =
        document.getElementById(
            "patientPersonalId"
        );

    const address =
        document.getElementById(
            "patientAddress"
        );

    const notes =
        document.getElementById(
            "patientNotes"
        );


    if (id) {
        id.value =
            patient && patient.id
                ? patient.id
                : "";
    }

    if (name) {
        name.value =
            patient && patient.full_name
                ? patient.full_name
                : "";
    }

    if (phone) {
        phone.value =
            patient && patient.phone
                ? patient.phone
                : "";
    }

    if (birthDate) {
        birthDate.value =
            patient && patient.birth_date
                ? String(
                    patient.birth_date
                ).substring(0, 10)
                : "";
    }

    if (personalId) {
        personalId.value =
            patient && patient.personal_id
                ? patient.personal_id
                : "";
    }

    if (address) {
        address.value =
            patient && patient.address
                ? patient.address
                : "";
    }

    if (notes) {
        notes.value =
            patient && patient.notes
                ? patient.notes
                : "";
    }


    modal.style.display = "flex";
}


function closePatientEditor() {
    const modal =
        document.getElementById(
            "patientModal"
        );

    if (modal) {
        modal.style.display = "none";
    }

    editingPatientId = null;

    const form =
        document.getElementById(
            "patientForm"
        );

    if (form) {
        form.reset();
    }
}


/* =========================================================
   SAVE PATIENT
========================================================= */

async function savePatient() {
    const name =
        document.getElementById(
            "patientFullName"
        );

    const phone =
        document.getElementById(
            "patientPhone"
        );

    const birthDate =
        document.getElementById(
            "patientBirthDate"
        );

    const personalId =
        document.getElementById(
            "patientPersonalId"
        );

    const address =
        document.getElementById(
            "patientAddress"
        );

    const notes =
        document.getElementById(
            "patientNotes"
        );


    if (!name) {
        return;
    }


    const fullName =
        name.value.trim();


    if (!fullName) {
        showMessage(
            "Emri i pacientit është i detyrueshëm.",
            "error"
        );

        return;
    }


    const payload = {
        full_name: fullName,
        phone:
            phone
                ? phone.value.trim()
                : "",
        birth_date:
            birthDate &&
            birthDate.value
                ? birthDate.value
                : null,
        personal_id:
            personalId
                ? personalId.value.trim()
                : "",
        address:
            address
                ? address.value.trim()
                : "",
        notes:
            notes
                ? notes.value.trim()
                : ""
    };


    try {
        let result;

        if (editingPatientId) {

            payload.updated_at =
                new Date().toISOString();

            result =
                await supabaseClient
                    .from("patients")
                    .update(payload)
                    .eq(
                        "id",
                        editingPatientId
                    );

        } else {

            result =
                await supabaseClient
                    .from("patients")
                    .insert([payload]);
        }


        if (result.error) {
            console.error(
                "SAVE PATIENT ERROR:",
                result.error
            );

            showMessage(
                "Gabim: " +
                result.error.message,
                "error"
            );

            return;
        }


        closePatientEditor();

        await loadPatients();

        renderPatients();

        showMessage(
            editingPatientId
                ? "Pacienti u ndryshua me sukses."
                : "Pacienti u shtua me sukses.",
            "success"
        );

        editingPatientId = null;

    } catch (error) {
        console.error(
            "SAVE PATIENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë ruajtjes së pacientit.",
            "error"
        );
    }
}


/* =========================================================
   EDIT PATIENT
========================================================= */

function editPatient(id) {
    const patient =
        patients.find(
            function (item) {
                return String(item.id) === String(id);
            }
        );

    if (!patient) {
        return;
    }

    openPatientModal(patient);
}


/* =========================================================
   DELETE PATIENT
========================================================= */

async function deletePatient(id) {
    const patient =
        patients.find(
            function (item) {
                return String(item.id) === String(id);
            }
        );


    const name =
        patient
            ? patient.full_name
            : "këtë pacient";


    const confirmed =
        window.confirm(
            "A dëshiron ta fshish pacientin " +
            name +
            "?"
        );


    if (!confirmed) {
        return;
    }


    try {
        const result =
            await supabaseClient
                .from("patients")
                .delete()
                .eq("id", id);


        if (result.error) {
            console.error(
                "DELETE PATIENT ERROR:",
                result.error
            );

            showMessage(
                "Gabim: " +
                result.error.message,
                "error"
            );

            return;
        }


        await loadPatients();

        renderPatients();

        showMessage(
            "Pacienti u fshi.",
            "success"
        );

    } catch (error) {
        console.error(
            "DELETE PATIENT EXCEPTION:",
            error
        );

        showMessage(
            "Gabim gjatë fshirjes së pacientit.",
            "error"
        );
    }
}


/* =========================================================
   VIEW PATIENT
========================================================= */

async function viewPatient(id) {
    const patient =
        patients.find(
            function (item) {
                return String(item.id) === String(id);
            }
        );


    if (!patient) {
        return;
    }


    const modal =
        document.getElementById(
            "patientViewModal"
        );

    const name =
        document.getElementById(
            "patientViewName"
        );

    const details =
        document.getElementById(
            "patientDetails"
        );

    const history =
        document.getElementById(
            "patientHistory"
        );


    if (!modal) {
        return;
    }


    if (name) {
        name.textContent =
            patient.full_name || "Pacienti";
    }


    if (details) {
        details.innerHTML = `
            <div class="gvm-detail-grid">

                <div>
                    <span>Telefon</span>
                    <strong>
                        ${
                            escapeHtml(
                                patient.phone || "—"
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>Datëlindja</span>
                    <strong>
                        ${
                            escapeHtml(
                                patient.birth_date || "—"
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>Nr. personal</span>
                    <strong>
                        ${
                            escapeHtml(
                                patient.personal_id || "—"
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>Adresa</span>
                    <strong>
                        ${
                            escapeHtml(
                                patient.address || "—"
                            )
                        }
                    </strong>
                </div>

            </div>

            ${
                patient.notes
                    ? `
                        <div class="gvm-notes-box">
                            <strong>Shënime</strong>
                            <p>
                                ${escapeHtml(
                                    patient.notes
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }
        `;
    }


    if (history) {
        history.innerHTML = `
            <div class="gvm-loading-small">
                Po ngarkohet historiku...
            </div>
        `;
    }


    modal.style.display = "flex";


    try {
        const result =
            await supabaseClient
                .from("appointments")
                .select("*")
                .eq(
                    "patient_name",
                    patient.full_name
                )
                .order(
                    "appointment_date",
                    { ascending: false }
                )
                .order(
                    "appointment_time",
                    { ascending: false }
                );


        if (result.error) {
            console.error(
                "PATIENT HISTORY ERROR:",
                result.error
            );

            if (history) {
                history.innerHTML = `
                    <div class="gvm-empty">
                        Nuk u ngarkua historiku.
                    </div>
                `;
            }

            return;
        }


        const records =
            result.data || [];


        if (!records.length) {
            if (history) {
                history.innerHTML = `
                    <div class="gvm-empty">
                        <div class="gvm-empty-icon">📋</div>
                        <strong>
                            Nuk ka ende vizita.
                        </strong>
                    </div>
                `;
            }

            return;
        }


        let html = "";

        records.forEach(
            function (record) {
                html += `
                    <div class="gvm-history-item">

                        <div>
                            <strong>
                                ${escapeHtml(
                                    record.appointment_date || ""
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    formatTime(
                                        record.appointment_time
                                    )
                                )}
                            </span>
                        </div>

                        <span class="
                            gvm-status
                            ${getStatusClass(
                                record.status
                            )}
                        ">
                            ${getStatusLabel(
                                record.status
                            )}
                        </span>

                        ${
                            record.note
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            record.note
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>
                `;
            }
        );


        if (history) {
            history.innerHTML = html;
        }

    } catch (error) {
        console.error(
            "PATIENT HISTORY EXCEPTION:",
            error
        );

        if (history) {
            history.innerHTML = `
                <div class="gvm-empty">
                    Gabim gjatë ngarkimit të historikut.
                </div>
            `;
        }
    }
}


function closePatientView() {
    const modal =
        document.getElementById(
            "patientViewModal"
        );

    if (modal) {
        modal.style.display = "none";
    }
}


/* =========================================================
   CSS
========================================================= */

function injectStyles() {
    if (document.getElementById("gvmDynamicStyles")) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "gvmDynamicStyles";

    style.textContent = `

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            background: #f4f8fa;
            color: #263c43;
        }

        button,
        input,
        select,
        textarea {
            font: inherit;
        }

        button {
            cursor: pointer;
        }


        /* LOGIN */

        .gvm-login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 25px;
            background:
                linear-gradient(
                    135deg,
                    #e9f7f5,
                    #f5f8fa
                );
        }

        .gvm-login-box {
            width: 100%;
            max-width: 430px;
            background: #fff;
            padding: 38px;
            border-radius: 22px;
            box-shadow:
                0 20px 60px
                rgba(23, 55, 63, .12);
            border: 1px solid #dce8eb;
            text-align: center;
        }

        .gvm-login-logo {
            width: 72px;
            height: 72px;
            margin: 0 auto 15px;
            border-radius: 20px;
            background: #0f766e;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 22px;
            box-shadow:
                0 10px 25px
                rgba(15, 118, 110, .25);
        }

        .gvm-login-icon {
            font-size: 42px;
            margin-bottom: 10px;
        }

        .gvm-login-box h1 {
            margin: 0;
            font-size: 25px;
        }

        .gvm-login-subtitle {
            color: #718188;
            margin: 8px 0 28px;
        }

        .gvm-login-box label {
            display: block;
            text-align: left;
            margin: 14px 0 7px;
            font-size: 14px;
            font-weight: 700;
        }

        .gvm-login-box input {
            width: 100%;
            padding: 13px 14px;
            border: 1px solid #ccdadd;
            border-radius: 10px;
            outline: none;
        }

        .gvm-login-box input:focus {
            border-color: #0f766e;
            box-shadow:
                0 0 0 3px
                rgba(15, 118, 110, .1);
        }

        .gvm-login-button {
            width: 100%;
            margin-top: 22px;
            padding: 14px;
            border: 0;
            border-radius: 10px;
            background: #0f766e;
            color: white;
            font-weight: 800;
        }

        .gvm-login-button:hover {
            background: #0b5f59;
        }

        .gvm-login-error {
            display: none;
            margin-top: 15px;
            color: #b42318;
            background: #fff0ef;
            border-radius: 8px;
            padding: 10px;
            font-size: 13px;
        }


        /* HEADER */

        .gvm-header {
            background: #fff;
            border-bottom: 1px solid #dce8eb;
            position: sticky;
            top: 0;
            z-index: 20;
        }

        .gvm-header-inner {
            max-width: 1400px;
            margin: auto;
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }

        .gvm-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .gvm-brand-icon {
            width: 48px;
            height: 48px;
            border-radius: 13px;
            background: #0f766e;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
        }

        .gvm-brand h1 {
            margin: 0;
            font-size: 19px;
        }

        .gvm-brand small {
            color: #718188;
        }

        .gvm-header-actions {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .gvm-online {
            color: #16734f;
            font-weight: 700;
            font-size: 13px;
        }

        .gvm-online span {
            width: 8px;
            height: 8px;
            background: #16a34a;
            display: inline-block;
            border-radius: 50%;
            margin-right: 5px;
        }

        .gvm-user-email {
            color: #596d73;
            font-size: 13px;
        }

        .gvm-logout {
            border: 1px solid #d6e1e4;
            background: #fff;
            color: #263c43;
            padding: 9px 15px;
            border-radius: 9px;
            font-weight: 700;
        }


        /* MAIN */

        .gvm-main {
            max-width: 1400px;
            margin: auto;
            padding: 25px;
        }

        .gvm-navigation {
            display: flex;
            gap: 8px;
            margin-bottom: 25px;
        }

        .gvm-nav-button {
            border: 1px solid #d8e4e7;
            background: #fff;
            padding: 11px 18px;
            border-radius: 10px;
            font-weight: 800;
            color: #53676d;
        }

        .gvm-nav-button.active {
            background: #0f766e;
            color: white;
            border-color: #0f766e;
        }

        .gvm-page-heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 22px;
        }

        .gvm-kicker {
            color: #0f766e;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .gvm-page-heading h2 {
            margin: 0;
            font-size: 29px;
        }

        .gvm-date-controls {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .gvm-date-button,
        .gvm-today-button {
            border: 1px solid #d5e1e4;
            background: white;
            border-radius: 9px;
            padding: 10px 13px;
            font-weight: 800;
        }

        .gvm-current-date {
            min-width: 220px;
            text-align: center;
            font-weight: 800;
            color: #40565d;
        }

        .gvm-today-button {
            background: #e8f5f3;
            color: #0f766e;
        }


        /* DASHBOARD */

        .gvm-dashboard {
            display: grid;
            grid-template-columns:
                repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .gvm-card {
            background: #fff;
            border: 1px solid #dce8eb;
            border-radius: 14px;
            padding: 18px;
        }

        .gvm-card span {
            display: block;
            color: #718188;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .gvm-card strong {
            font-size: 27px;
        }


        /* GRID */

        .gvm-grid {
            display: grid;
            grid-template-columns:
                minmax(320px, .8fr)
                minmax(500px, 1.6fr);
            gap: 20px;
        }

        .gvm-panel {
            background: #fff;
            border: 1px solid #dce8eb;
            border-radius: 16px;
            padding: 20px;
            min-width: 0;
        }

        .gvm-panel-header {
            margin-bottom: 18px;
        }

        .gvm-panel-header h3 {
            margin: 0 0 5px;
        }

        .gvm-panel-header p {
            margin: 0;
            color: #718188;
            font-size: 13px;
        }


        /* FORMS */

        .gvm-form-group {
            margin-bottom: 15px;
        }

        .gvm-form-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 800;
            color: #40565d;
        }

        .gvm-form-group input,
        .gvm-form-group select,
        .gvm-form-group textarea {
            width: 100%;
            border: 1px solid #ccdadd;
            border-radius: 9px;
            padding: 11px 12px;
            outline: none;
            background: white;
        }

        .gvm-form-group textarea {
            resize: vertical;
        }

        .gvm-form-group input:focus,
        .gvm-form-group select:focus,
        .gvm-form-group textarea:focus {
            border-color: #0f766e;
            box-shadow:
                0 0 0 3px
                rgba(15,118,110,.08);
        }

        .gvm-form-row {
            display: grid;
            grid-template-columns:
                1fr 1fr;
            gap: 12px;
        }

        .gvm-form-actions {
            display: flex;
            gap: 9px;
            flex-wrap: wrap;
        }

        .gvm-primary-button {
            border: 0;
            background: #0f766e;
            color: white;
            padding: 11px 16px;
            border-radius: 9px;
            font-weight: 800;
        }

        .gvm-primary-button:hover {
            background: #0b5f59;
        }

        .gvm-secondary-button {
            border: 1px solid #d3dfe2;
            background: white;
            color: #435960;
            padding: 11px 16px;
            border-radius: 9px;
            font-weight: 800;
        }


        /* SCHEDULE */

        .gvm-schedule {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .gvm-appointment-row {
            display: grid;
            grid-template-columns:
                70px
                minmax(180px, 1fr)
                120px
                auto;
            align-items: center;
            gap: 12px;
            padding: 13px;
            border: 1px solid #e0e9eb;
            border-radius: 11px;
            background: #fbfdfd;
        }

        .gvm-appointment-time {
            font-weight: 900;
            font-size: 16px;
            color: #0f766e;
        }

        .gvm-appointment-main strong {
            display: block;
        }

        .gvm-appointment-meta {
            color: #718188;
            font-size: 12px;
            margin-top: 5px;
            line-height: 1.5;
        }

        .gvm-status {
            display: inline-block;
            padding: 5px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
        }

        .status-planned {
            background: #e8f1ff;
            color: #2457a6;
        }

        .status-waiting {
            background: #fff5d8;
            color: #936600;
        }

        .status-completed {
            background: #e4f7ed;
            color: #16734f;
        }

        .status-cancelled {
            background: #ffe9e7;
            color: #b42318;
        }

        .gvm-appointment-actions,
        .gvm-patient-actions {
            display: flex;
            gap: 5px;
        }

        .gvm-small-button {
            border: 1px solid #d7e2e5;
            background: white;
            border-radius: 7px;
            min-width: 31px;
            height: 31px;
            padding: 4px 7px;
        }

        .gvm-small-button.danger {
            color: #b42318;
        }


        /* EMPTY */

        .gvm-empty {
            min-height: 180px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #718188;
            text-align: center;
        }

        .gvm-empty strong {
            color: #40565d;
        }

        .gvm-empty-icon {
            font-size: 35px;
        }

        .gvm-loading-small {
            padding: 25px;
            text-align: center;
            color: #718188;
        }


        /* PATIENTS */

        .gvm-patient-toolbar {
            background: white;
            border: 1px solid #dce8eb;
            border-radius: 13px;
            padding: 13px;
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .gvm-patient-toolbar input {
            flex: 1;
            border: 1px solid #ccdadd;
            border-radius: 9px;
            padding: 11px 13px;
            outline: none;
        }

        .gvm-patient-count {
            color: #718188;
            font-size: 13px;
            font-weight: 700;
        }

        .gvm-patients-container {
            display: grid;
            grid-template-columns:
                repeat(2, 1fr);
            gap: 12px;
        }

        .gvm-patient-card {
            background: white;
            border: 1px solid #dce8eb;
            border-radius: 14px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .gvm-patient-avatar {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            border-radius: 50%;
            background: #e5f4f2;
            color: #0f766e;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
        }

        .gvm-patient-info {
            min-width: 0;
            flex: 1;
        }

        .gvm-patient-info strong {
            display: block;
            margin-bottom: 5px;
        }

        .gvm-patient-info span {
            display: block;
            color: #718188;
            font-size: 12px;
            margin-top: 2px;
        }


        /* MODAL */

        .gvm-modal {
            position: fixed;
            inset: 0;
            background:
                rgba(24, 43, 48, .55);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 100;
            overflow-y: auto;
        }

        .gvm-modal-box {
            width: 100%;
            max-width: 650px;
            background: white;
            border-radius: 17px;
            padding: 22px;
            box-shadow:
                0 25px 80px
                rgba(0,0,0,.22);
            max-height: 90vh;
            overflow-y: auto;
        }

        .gvm-patient-view-box {
            max-width: 800px;
        }

        .gvm-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 20px;
        }

        .gvm-modal-header h3 {
            margin: 0 0 5px;
        }

        .gvm-modal-header p {
            margin: 0;
            color: #718188;
            font-size: 13px;
        }

        .gvm-close-button {
            width: 35px;
            height: 35px;
            border: 0;
            background: #f0f4f5;
            border-radius: 9px;
            font-size: 25px;
            line-height: 1;
            color: #52666c;
        }

        .gvm-detail-grid {
            display: grid;
            grid-template-columns:
                1fr 1fr;
            gap: 10px;
        }

        .gvm-detail-grid > div {
            padding: 13px;
            background: #f7fafb;
            border-radius: 9px;
        }

        .gvm-detail-grid span {
            display: block;
            color: #718188;
            font-size: 11px;
            margin-bottom: 4px;
        }

        .gvm-detail-grid strong {
            word-break: break-word;
        }

        .gvm-notes-box {
            margin-top: 12px;
            padding: 14px;
            background: #f7fafb;
            border-radius: 10px;
        }

        .gvm-notes-box p {
            white-space: pre-wrap;
            margin-bottom: 0;
        }

        .gvm-history-title {
            margin-top: 25px;
            margin-bottom: 12px;
            font-weight: 900;
            font-size: 17px;
        }

        .gvm-history-item {
            border: 1px solid #dce8eb;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 8px;
        }

        .gvm-history-item > div {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .gvm-history-item > div span {
            color: #0f766e;
            font-weight: 800;
        }

        .gvm-history-item p {
            margin: 8px 0 0;
            color: #596d73;
            white-space: pre-wrap;
        }


        /* MESSAGE */

        .app-message {
            display: none;
            padding: 11px 14px;
            border-radius: 9px;
            margin-bottom: 15px;
            font-weight: 700;
            font-size: 13px;
        }

        .app-message.success {
            background: #e6f6ee;
            color: #16734f;
        }

        .app-message.error {
            background: #fff0ef;
            color: #b42318;
        }


        /* MOBILE */

        @media (max-width: 900px) {

            .gvm-grid {
                grid-template-columns: 1fr;
            }

            .gvm-dashboard {
                grid-template-columns:
                    repeat(2, 1fr);
            }

            .gvm-patients-container {
                grid-template-columns: 1fr;
            }
        }


        @media (max-width: 650px) {

            .gvm-header-inner {
                padding: 12px 15px;
            }

            .gvm-brand small {
                display: none;
            }

            .gvm-brand h1 {
                font-size: 15px;
            }

            .gvm-header-actions {
                gap: 7px;
            }

            .gvm-user-email {
                display: none;
            }

            .gvm-online {
                display: none;
            }

            .gvm-main {
                padding: 15px;
            }

            .gvm-page-heading {
                align-items: flex-start;
                flex-direction: column;
            }

            .gvm-date-controls {
                width: 100%;
                justify-content: center;
                flex-wrap: wrap;
            }

            .gvm-current-date {
                min-width: 0;
                flex: 1;
            }

            .gvm-dashboard {
                grid-template-columns:
                    repeat(2, 1fr);
            }

            .gvm-form-row {
                grid-template-columns: 1fr;
            }

            .gvm-appointment-row {
                grid-template-columns:
                    55px
                    1fr;
            }

            .gvm-appointment-row > div:nth-child(3) {
                grid-column: 2;
            }

            .gvm-appointment-actions {
                grid-column: 2;
            }

            .gvm-patient-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .gvm-patient-card {
                align-items: flex-start;
                flex-wrap: wrap;
            }

            .gvm-patient-actions {
                width: 100%;
                justify-content: flex-end;
            }

            .gvm-detail-grid {
                grid-template-columns: 1fr;
            }

            .gvm-login-box {
                padding: 25px 20px;
            }
        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
   GLOBAL FUNCTIONS
   Needed by inline action buttons.
========================================================= */

window.editAppointment =
    editAppointment;

window.completeAppointment =
    completeAppointment;

window.deleteAppointment =
    deleteAppointment;

window.viewPatient =
    viewPatient;

window.editPatient =
    editPatient;

window.deletePatient =
    deletePatient;

window.openPatientModal =
    openPatientModal;

window.closePatientEditor =
    closePatientEditor;

window.closePatientView =
    closePatientView;

window.logout =
    logout;

console.log(
    "AMBULATORI GVM JavaScript loaded successfully.",
    APP_VERSION
);
