const APP_VERSION = "GVM-20260924-13";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient = null;
let currentUser = null;
let currentDate = new Date();
let appointments = [];
let realtimeChannel = null;


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

    const app =
        document.getElementById("app");

    if (!app) return;

    app.innerHTML = `

        <header class="app-header">

            <div class="header-inner">

                <div class="brand">

                    <div class="brand-icon">
                        GVM
                    </div>

                    <div>

                        <h1>
                            AMBULATORI GVM
                        </h1>

                        <small>
                            Menaxhimi i vizitave
                        </small>

                    </div>

                </div>

                <div class="header-actions">

                    <div class="online-indicator">
                        <span></span>
                        Online
                    </div>

                    <span
                        id="userEmail"
                        class="user-email"
                    ></span>

                    <button
                        id="logoutButton"
                        class="logout-button"
                        type="button"
                    >
                        Dil
                    </button>

                </div>

            </div>

        </header>

        <main class="main-container">

            <div
                id="appMessage"
                class="app-message"
            ></div>

            <div class="page-title">

                <div>

                    <div class="section-kicker">
                        PANELI I AMBULATORIT
                    </div>

                    <h2>
                        Orari i vizitave
                    </h2>

                </div>

                <div class="date-controls">

                    <button
                        id="previousDay"
                        class="date-button"
                        type="button"
                        title="Dita e mëparshme"
                    >
                        ←
                    </button>

                    <div
                        id="currentDate"
                        class="current-date"
                    ></div>

                    <button
                        id="nextDay"
                        class="date-button"
                        type="button"
                        title="Dita tjetër"
                    >
                        →
                    </button>

                    <button
                        id="todayButton"
                        class="date-button today-button"
                        type="button"
                    >
                        Sot
                    </button>

                </div>

            </div>

            <section class="dashboard-summary">

                <div class="summary-card">

                    <div class="summary-icon">
                        📋
                    </div>

                    <div>

                        <span>
                            Vizita gjithsej
                        </span>

                        <strong id="totalAppointments">
                            0
                        </strong>

                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-icon">
                        🕐
                    </div>

                    <div>

                        <span>
                            Të planifikuara
                        </span>

                        <strong id="plannedAppointments">
                            0
                        </strong>

                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Përfunduar
                        </span>

                        <strong id="finishedAppointments">
                            0
                        </strong>

                    </div>

                </div>

                <div class="summary-card">

                    <div class="summary-icon">
                        ⏱
                    </div>

                    <div>

                        <span>
                            Mbërritur
                        </span>

                        <strong id="arrivedAppointments">
                            0
                        </strong>

                    </div>

                </div>

            </section>

            <section class="appointment-card">

                <div class="card-heading">

                    <div>

                        <span class="card-kicker">
                            REGJISTRIM I RI
                        </span>

                        <h3>
                            Shto vizitë të re
                        </h3>

                    </div>

                    <div class="medical-cross">
                        +
                    </div>

                </div>

                <form
                    id="appointmentForm"
                    class="appointment-form"
                >

                    <div class="form-group">

                        <label for="patientName">
                            Emri dhe mbiemri
                        </label>

                        <input
                            id="patientName"
                            type="text"
                            placeholder="Emri i pacientit"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label for="patientPhone">
                            Telefoni
                        </label>

                        <input
                            id="patientPhone"
                            type="text"
                            placeholder="Numri i telefonit"
                        >

                    </div>

                    <div class="form-group">

                        <label for="appointmentTime">
                            Ora
                        </label>

                        <select
                            id="appointmentTime"
                            required
                        >
                        </select>

                    </div>

                    <div class="form-group">

                        <label for="appointmentNote">
                            Shënim
                        </label>

                        <input
                            id="appointmentNote"
                            type="text"
                            placeholder="Shënim për vizitën"
                        >

                    </div>

                    <button
                        class="add-button"
                        type="submit"
                    >
                        <span>+</span>
                        Shto vizitë
                    </button>

                </form>

            </section>

            <section class="schedule-card">

                <div class="schedule-header">

                    <div>

                        <span class="card-kicker">
                            PROGRAMI DITOR
                        </span>

                        <h3>
                            Orari ditor
                        </h3>

                    </div>

                    <div class="schedule-header-right">

                        <div class="working-hours">
                            🕐 08:00 — 18:00
                        </div>

                        <div
                            id="scheduleInfo"
                            class="schedule-info"
                        >
                            0 vizita
                        </div>

                    </div>

                </div>

                <div class="schedule-table-wrapper">

                    <table class="schedule-table">

                        <thead>

                            <tr>

                                <th>
                                    Ora
                                </th>

                                <th>
                                    Pacienti
                                </th>

                                <th>
                                    Telefoni
                                </th>

                                <th>
                                    Shënimi
                                </th>

                                <th>
                                    Statusi
                                </th>

                                <th>
                                    Veprime
                                </th>

                            </tr>

                        </thead>

                        <tbody
                            id="scheduleBody"
                        >

                            <tr>

                                <td
                                    colspan="6"
                                    class="loading-cell"
                                >

                                    <div class="loading-spinner"></div>

                                    Po ngarkohet orari...

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </section>

        </main>
    `;

    const userEmail =
        document.getElementById(
            "userEmail"
        );

    if (userEmail && currentUser) {

        userEmail.textContent =
            currentUser.email || "";

    }

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

    const previousDay =
        document.getElementById(
            "previousDay"
        );

    if (previousDay) {

        previousDay.addEventListener(
            "click",
            function () {

                currentDate.setDate(
                    currentDate.getDate() - 1
                );

                updateDateDisplay();
                loadAppointments();

            }
        );

    }

    const nextDay =
        document.getElementById(
            "nextDay"
        );

    if (nextDay) {

        nextDay.addEventListener(
            "click",
            function () {

                currentDate.setDate(
                    currentDate.getDate() + 1
                );

                updateDateDisplay();
                loadAppointments();

            }
        );

    }

    const todayButton =
        document.getElementById(
            "todayButton"
        );

    if (todayButton) {

        todayButton.addEventListener(
            "click",
            function () {

                currentDate =
                    new Date();

                updateDateDisplay();
                loadAppointments();

            }
        );

    }

    const appointmentForm =
        document.getElementById(
            "appointmentForm"
        );

    if (appointmentForm) {

        appointmentForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await addAppointment();

            }
        );

    }

    updateDateDisplay();

    populateTimeSelect();

    loadAppointments();

    setupRealtime();

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
        8 * 60;

    const endMinutes =
        18 * 60;

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

    const tr =
        document.createElement(
            "tr"
        );

    tr.className =
        "appointment-row";

    const name =
        appointment.patient_name ||
        "Pa emër";

    const phone =
        appointment.patient_phone ||
        "—";

    const note =
        appointment.note ||
        "—";

    const status =
        appointment.status ||
        "planned";

    const initials =
        getInitials(name);

    tr.innerHTML = `

        <td class="time-cell">

            <div class="time-badge">

                <span class="time-icon">
                    ◷
                </span>

                <strong>
                    ${escapeHtml(time)}
                </strong>

            </div>

        </td>

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
                        Pacient
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

        <td class="note-cell">

            ${
                note !== "—"
                    ? `
                        <span
                            class="note-text"
                            title="${escapeHtml(note)}"
                        >
                            📝 ${escapeHtml(note)}
                        </span>
                    `
                    : `
                        <span class="muted-text">
                            Pa shënim
                        </span>
                    `
            }

        </td>

        <td class="status-cell">

            <span
                class="status ${statusClass(status)}"
            >

                <span class="status-dot"></span>

                ${escapeHtml(
                    statusText(status)
                )}

            </span>

        </td>

        <td class="actions-cell">

            <div class="appointment-actions">

                ${
                    status !== "arrived"
                        ? `
                            <button
                                type="button"
                                class="action-button action-arrived"
                                data-action="arrived"
                                title="Shëno si të mbërritur"
                            >
                                ✓ Mbërriti
                            </button>
                        `
                        : ""
                }

                ${
                    status !== "finished"
                        ? `
                            <button
                                type="button"
                                class="action-button action-finished"
                                data-action="finished"
                                title="Përfundo vizitën"
                            >
                                ✓ Përfundoi
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
