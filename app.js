"use strict";

/*
==========================================================
 AMBULATORI GVM
 Version: GVM-20260923-03
==========================================================
*/

const APP_VERSION = "GVM-20260923-03";

console.log("==========================================");
console.log("AMBULATORI GVM");
console.log("APP VERSION:", APP_VERSION);
console.log("APP.JS U NGARKUA");
console.log("==========================================");

/* ======================================================
   SUPABASE
====================================================== */

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient;

try {
    if (!window.supabase) {
        throw new Error("Biblioteka e Supabase nuk u ngarkua.");
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("SUPABASE U KRIJUA");
} catch (error) {
    console.error("SUPABASE INIT ERROR:", error);
}

/* ======================================================
   STATE
====================================================== */

let selectedDate = new Date();

let realtimeChannel = null;

let applicationStarted = false;
let applicationStarting = false;

let loginInProgress = false;

let currentAppointments = [];

/* ======================================================
   HELPERS
====================================================== */

function pad(number) {
    return String(number).padStart(2, "0");
}

function dateToString(date) {
    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );
}

function formatDateAlbanian(date) {
    const days = [
        "E diel",
        "E hënë",
        "E martë",
        "E mërkurë",
        "E enjte",
        "E premte",
        "E shtunë"
    ];

    const months = [
        "janar",
        "shkurt",
        "mars",
        "prill",
        "maj",
        "qershor",
        "korrik",
        "gusht",
        "shtator",
        "tetor",
        "nëntor",
        "dhjetor"
    ];

    return (
        days[date.getDay()] +
        ", " +
        date.getDate() +
        " " +
        months[date.getMonth()] +
        " " +
        date.getFullYear()
    );
}

function normalizeTime(time) {
    if (!time) {
        return "";
    }

    return String(time).substring(0, 5);
}

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

function getStatusText(status) {
    switch (status) {
        case "planned":
            return "Planifikuar";

        case "arrived":
            return "Erdhi";

        case "finished":
            return "Përfundoi";

        case "cancelled":
            return "Anuluar";

        default:
            return status || "Planifikuar";
    }
}

function getStatusClass(status) {
    switch (status) {
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

/* ======================================================
   LOGIN PAGE
====================================================== */

function showLogin(errorMessage = "") {
    stopRealtime();

    applicationStarted = false;
    applicationStarting = false;

    const app = document.getElementById("app");

    if (!app) {
        return;
    }

    app.innerHTML = `
        <div class="login-page">

            <div class="login-box">

                <div class="login-logo">
                    +
                </div>

                <h1 class="login-title">
                    AMBULATORI GVM
                </h1>

                <p class="login-subtitle">
                    Sistemi i recepsionit dhe menaxhimit të vizitave
                </p>

                <form id="loginForm">

                    <div class="form-row">
                        <label class="input-label">
                            Email
                        </label>

                        <input
                            id="loginEmail"
                            class="input"
                            type="email"
                            placeholder="Shkruani email-in"
                            autocomplete="username"
                            required
                        >
                    </div>

                    <div class="form-row">
                        <label class="input-label">
                            Fjalëkalimi
                        </label>

                        <input
                            id="loginPassword"
                            class="input"
                            type="password"
                            placeholder="Shkruani fjalëkalimin"
                            autocomplete="current-password"
                            required
                        >
                    </div>

                    <button
                        id="loginButton"
                        class="login-button"
                        type="submit"
                    >
                        Hyr në sistem
                    </button>

                    ${
                        errorMessage
                            ? `
                                <div class="login-error">
                                    ${escapeHtml(errorMessage)}
                                </div>
                              `
                            : ""
                    }

                </form>

            </div>

        </div>
    `;

    const form = document.getElementById("loginForm");

    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            await login();
        });
    }
}

/* ======================================================
   LOGIN
====================================================== */

async function login() {
    if (loginInProgress) {
        return;
    }

    loginInProgress = true;

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginButton = document.getElementById("loginButton");

    const email = emailInput
        ? emailInput.value.trim()
        : "";

    const password = passwordInput
        ? passwordInput.value
        : "";

    if (!email || !password) {
        loginInProgress = false;
        showLogin("Ju lutem plotësoni email-in dhe fjalëkalimin.");
        return;
    }

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Po kontrollohet...";
    }

    console.log("Po bëhet login për:", email);

    try {
        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("LOGIN ERROR:", error);

            showLogin(
                "Login dështoi: " + error.message
            );

            return;
        }

        console.log("LOGIN SUKSES");
        console.log("USER:", data?.user);

        await startApplication();

    } catch (error) {
        console.error("LOGIN EXCEPTION:", error);

        showLogin(
            "Ndodhi një gabim gjatë hyrjes."
        );

    } finally {
        loginInProgress = false;
    }
}

/* ======================================================
   SESSION
====================================================== */

async function checkSession() {
    console.log("Po kontrollohet sesioni...");

    try {
        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("CHECK SESSION ERROR:", error);

            showLogin(
                "Nuk u kontrollua dot sesioni: " +
                error.message
            );

            return;
        }

        console.log("Session:", data);

        if (data && data.session) {
            await startApplication();
        } else {
            showLogin();
        }

    } catch (error) {
        console.error("SESSION EXCEPTION:", error);

        showLogin(
            "Nuk u lidh dot me sistemin."
        );
    }
}

/* ======================================================
   START APPLICATION
====================================================== */

async function startApplication() {
    if (applicationStarting) {
        console.log("Aplikacioni po hapet tashmë.");
        return;
    }

    if (applicationStarted) {
        console.log("Aplikacioni është tashmë i hapur.");
        return;
    }

    applicationStarting = true;

    console.log("Po hapet aplikacioni...");

    try {
        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session) {
            console.log("Nuk ka session aktiv.");
            showLogin();
            return;
        }

        await showApp();

        applicationStarted = true;

        console.log("APLIKACIONI U HAP");

    } catch (error) {
        console.error(
            "START APPLICATION ERROR:",
            error
        );

        showLogin(
            "Nuk u hap aplikacioni: " +
            (error.message || "gabim i panjohur")
        );

    } finally {
        applicationStarting = false;
    }
}

/* ======================================================
   MAIN APP
====================================================== */

async function showApp() {
    const app = document.getElementById("app");

    if (!app) {
        throw new Error(
            "Elementi #app nuk ekziston në index.html."
        );
    }

    let userEmail = "";

    try {
        const {
            data
        } = await supabaseClient.auth.getUser();

        userEmail =
            data?.user?.email || "";
    } catch (error) {
        console.warn(
            "Nuk u mor email-i i përdoruesit:",
            error
        );
    }

    app.innerHTML = `
        <div class="app-page">

            <header class="topbar">

                <div class="topbar-inner">

                    <div class="brand">

                        <div class="brand-icon">
                            +
                        </div>

                        <div>
                            <div class="brand-title">
                                AMBULATORI GVM
                            </div>

                            <div class="brand-subtitle">
                                Recepsioni • Menaxhimi i vizitave
                            </div>
                        </div>

                    </div>

                    <div class="topbar-right">

                        <div class="user-badge">
                            ${escapeHtml(userEmail)}
                        </div>

                        <button
                            class="logout-button"
                            id="logoutButton"
                        >
                            Dil
                        </button>

                    </div>

                </div>

            </header>

            <main class="page">

                <!-- DATE -->

                <section class="date-panel">

                    <button
                        class="date-button"
                        id="previousDayButton"
                    >
                        ← Dita e mëparshme
                    </button>

                    <div class="date-info">

                        <div class="date-label">
                            Data e zgjedhur
                        </div>

                        <div
                            class="date-value"
                            id="selectedDateLabel"
                        >
                            ${formatDateAlbanian(selectedDate)}
                        </div>

                    </div>

                    <button
                        class="date-button today-button"
                        id="todayButton"
                    >
                        Sot
                    </button>

                    <button
                        class="date-button"
                        id="nextDayButton"
                    >
                        Dita tjetër →
                    </button>

                </section>

                <!-- MAIN GRID -->

                <div class="main-grid">

                    <!-- ADD APPOINTMENT -->

                    <section class="card">

                        <div class="card-header">

                            <h2 class="card-title">
                                Shto vizitë
                            </h2>

                            <p class="card-description">
                                Regjistro një pacient të ri në orar.
                            </p>

                        </div>

                        <div class="card-body">

                            <div id="formMessage"></div>

                            <form id="appointmentForm">

                                <div class="form-group">

                                    <label for="firstName">
                                        Emri
                                    </label>

                                    <input
                                        id="firstName"
                                        class="form-control"
                                        type="text"
                                        placeholder="Emri"
                                        required
                                    >

                                </div>

                                <div class="form-group">

                                    <label for="lastName">
                                        Mbiemri
                                    </label>

                                    <input
                                        id="lastName"
                                        class="form-control"
                                        type="text"
                                        placeholder="Mbiemri"
                                        required
                                    >

                                </div>

                                <div class="form-group">

                                    <label for="cardNumber">
                                        Nr. i kartelës
                                    </label>

                                    <input
                                        id="cardNumber"
                                        class="form-control"
                                        type="text"
                                        placeholder="Nr. kartelës"
                                    >

                                </div>

                                <div class="form-group">

                                    <label for="appointmentTime">
                                        Ora
                                    </label>

                                    <select
                                        id="appointmentTime"
                                        class="form-control"
                                        required
                                    >
                                        <option value="">
                                            Zgjidhni orën
                                        </option>
                                    </select>

                                </div>

                                <button
                                    class="submit-button"
                                    type="submit"
                                    id="addAppointmentButton"
                                >
                                    + Shto vizitën
                                </button>

                            </form>

                        </div>

                    </section>

                    <!-- SCHEDULE -->

                    <section class="card schedule-card">

                        <div class="schedule-header">

                            <div>

                                <h2 class="schedule-title">
                                    Orari ditor
                                </h2>

                                <div
                                    class="card-description"
                                    style="margin-top:4px;"
                                >
                                    08:00 — 18:00 • çdo 15 minuta
                                </div>

                            </div>

                            <div
                                class="appointment-count"
                                id="appointmentCount"
                            >
                                0 vizita
                            </div>

                        </div>

                        <div id="appointments">

                            <div class="loading-schedule">
                                Po ngarkohet orari...
                            </div>

                        </div>

                    </section>

                </div>

            </main>

        </div>
    `;

    setupAppEvents();

    populateTimeSelect();

    updateDateLabel();

    await loadAppointments();

    startRealtime();
}

/* ======================================================
   EVENTS
====================================================== */

function setupAppEvents() {

    const previousButton =
        document.getElementById(
            "previousDayButton"
        );

    const todayButton =
        document.getElementById(
            "todayButton"
        );

    const nextButton =
        document.getElementById(
            "nextDayButton"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const appointmentForm =
        document.getElementById(
            "appointmentForm"
        );

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            previousDay
        );
    }

    if (todayButton) {
        todayButton.addEventListener(
            "click",
            goToday
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            nextDay
        );
    }

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }

    if (appointmentForm) {
        appointmentForm.addEventListener(
            "submit",
            async function(event) {
                event.preventDefault();
                await addAppointment();
            }
        );
    }
}

/* ======================================================
   DATE NAVIGATION
====================================================== */

function updateDateLabel() {
    const label =
        document.getElementById(
            "selectedDateLabel"
        );

    if (label) {
        label.textContent =
            formatDateAlbanian(selectedDate);
    }
}

async function previousDay() {
    selectedDate.setDate(
        selectedDate.getDate() - 1
    );

    updateDateLabel();

    await loadAppointments();
}

async function nextDay() {
    selectedDate.setDate(
        selectedDate.getDate() + 1
    );

    updateDateLabel();

    await loadAppointments();
}

async function goToday() {
    selectedDate = new Date();

    updateDateLabel();

    await loadAppointments();
}

/* ======================================================
   TIME SELECT
====================================================== */

function populateTimeSelect() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Zgjidhni orën
        </option>
    `;

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
                pad(hour) +
                ":" +
                pad(minute);

            const option =
                document.createElement("option");

            option.value = time;
            option.textContent = time;

            select.appendChild(option);
        }
    }
}

/* ======================================================
   SELECT TIME FROM EMPTY SLOT
====================================================== */

function selectTime(time) {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {
        return;
    }

    select.value = time;

    select.focus();

    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/* ======================================================
   LOAD APPOINTMENTS
====================================================== */

async function loadAppointments() {

    const date =
        dateToString(selectedDate);

    console.log(
        "Po ngarkohen vizitat për:",
        date
    );

    const container =
        document.getElementById(
            "appointments"
        );

    if (container) {
        container.innerHTML = `
            <div class="loading-schedule">
                Po ngarkohet orari...
            </div>
        `;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .select("*")
            .eq("appointment_date", date)
            .order("appointment_time", {
                ascending: true
            });

        if (error) {
            console.error(
                "LOAD APPOINTMENTS ERROR:",
                error
            );

            if (container) {
                container.innerHTML = `
                    <div class="error-box">
                        <strong>Gabim gjatë ngarkimit.</strong>
                        <br><br>
                        ${escapeHtml(error.message)}
                    </div>
                `;
            }

            return;
        }

        currentAppointments =
            Array.isArray(data)
                ? data
                : [];

        console.log(
            "Vizitat e gjetura:",
            currentAppointments
        );

        console.log(
            "Numri i vizitave:",
            currentAppointments.length
        );

        renderAppointments();

    } catch (error) {

        console.error(
            "LOAD APPOINTMENTS EXCEPTION:",
            error
        );

        if (container) {
            container.innerHTML = `
                <div class="error-box">
                    <strong>Gabim.</strong>
                    <br><br>
                    ${escapeHtml(
                        error.message ||
                        "Gabim i panjohur"
                    )}
                </div>
            `;
        }
    }
}

/* ======================================================
   RENDER APPOINTMENTS
====================================================== */

function renderAppointments() {

    const container =
        document.getElementById(
            "appointments"
        );

    const count =
        document.getElementById(
            "appointmentCount"
        );

    if (!container) {
        console.error(
            "Nuk u gjet #appointments."
        );
        return;
    }

    if (count) {
        count.textContent =
            currentAppointments.length +
            (
                currentAppointments.length === 1
                    ? " vizitë"
                    : " vizita"
            );
    }

    const appointmentsByTime = {};

    currentAppointments.forEach(
        function(appointment) {

            const time =
                normalizeTime(
                    appointment.appointment_time
                );

            appointmentsByTime[time] =
                appointment;
        }
    );

    let html = "";

    let renderedRows = 0;

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
                pad(hour) +
                ":" +
                pad(minute);

            const appointment =
                appointmentsByTime[time];

            html += `
                <div class="time-slot">

                    <div class="slot-time">
                        ${time}
                    </div>

                    <div class="slot-content">
            `;

            if (appointment) {

                html += renderAppointment(
                    appointment
                );

            } else {

                html += `
                    <div
                        class="empty-slot"
                        onclick="selectTime('${time}')"
                        title="Kliko për të zgjedhur këtë orë"
                    >
                        Orari i lirë — kliko për të shtuar pacient
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;

            renderedRows++;
        }
    }

    container.innerHTML = html;

    console.log(
        "Rreshtat e krijuar në ekran:",
        renderedRows
    );
}

/* ======================================================
   RENDER ONE APPOINTMENT
====================================================== */

function renderAppointment(appointment) {

    const status =
        appointment.status || "planned";

    const firstName =
        appointment.first_name || "";

    const lastName =
        appointment.last_name || "";

    const cardNumber =
        appointment.card_number || "";

    let actions = "";

    if (status !== "arrived" &&
        status !== "finished" &&
        status !== "cancelled") {

        actions += `
            <button
                class="action-button action-arrived"
                onclick="changeStatus('${appointment.id}', 'arrived')"
            >
                Erdhi
            </button>
        `;
    }

    if (status === "arrived") {

        actions += `
            <button
                class="action-button action-finished"
                onclick="changeStatus('${appointment.id}', 'finished')"
            >
                Përfundoi
            </button>
        `;
    }

    if (status !== "finished" &&
        status !== "cancelled") {

        actions += `
            <button
                class="action-button action-cancel"
                onclick="changeStatus('${appointment.id}', 'cancelled')"
            >
                Anulo
            </button>
        `;
    }

    actions += `
        <button
            class="action-button action-delete"
            onclick="deleteAppointment('${appointment.id}')"
        >
            Fshi
        </button>
    `;

    return `
        <div class="patient-card ${escapeHtml(status)}">

            <div class="patient-info">

                <div class="patient-name">
                    ${escapeHtml(firstName)}
                    ${escapeHtml(lastName)}
                </div>

                <div class="patient-details">
                    ${
                        cardNumber
                            ? "Kartela: " +
                              escapeHtml(cardNumber)
                            : "Pa numër kartele"
                    }
                </div>

                <span
                    class="status ${getStatusClass(status)}"
                >
                    ${getStatusText(status)}
                </span>

            </div>

            <div class="appointment-actions">
                ${actions}
            </div>

        </div>
    `;
}

/* ======================================================
   ADD APPOINTMENT
====================================================== */

async function addAppointment() {

    const firstNameInput =
        document.getElementById(
            "firstName"
        );

    const lastNameInput =
        document.getElementById(
            "lastName"
        );

    const cardNumberInput =
        document.getElementById(
            "cardNumber"
        );

    const timeInput =
        document.getElementById(
            "appointmentTime"
        );

    const firstName =
        firstNameInput
            ? firstNameInput.value.trim()
            : "";

    const lastName =
        lastNameInput
            ? lastNameInput.value.trim()
            : "";

    const cardNumber =
        cardNumberInput
            ? cardNumberInput.value.trim()
            : "";

    const appointmentTime =
        timeInput
            ? timeInput.value
            : "";

    const message =
        document.getElementById(
            "formMessage"
        );

    const button =
        document.getElementById(
            "addAppointmentButton"
        );

    if (!firstName || !lastName) {

        showFormMessage(
            "Ju lutem plotësoni emrin dhe mbiemrin.",
            "error"
        );

        return;
    }

    if (!appointmentTime) {

        showFormMessage(
            "Ju lutem zgjidhni orën.",
            "error"
        );

        return;
    }

    const date =
        dateToString(selectedDate);

    console.log(
        "Po shtohet vizita:",
        {
            firstName,
            lastName,
            cardNumber,
            date,
            appointmentTime
        }
    );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Po ruhet...";
    }

    try {

        /*
        Kontrollojmë fillimisht nëse
        kjo orë është e zënë.
        */

        const {
            data: existing,
            error: existingError
        } = await supabaseClient
            .from("appointments")
            .select("id")
            .eq("appointment_date", date)
            .eq("appointment_time", appointmentTime)
            .limit(1);

        if (existingError) {
            console.error(
                "CHECK EXISTING ERROR:",
                existingError
            );

            throw existingError;
        }

        if (
            existing &&
            existing.length > 0
        ) {

            showFormMessage(
                "Kjo orë është tashmë e zënë.",
                "error"
            );

            return;
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .insert([
                {
                    first_name: firstName,
                    last_name: lastName,
                    card_number: cardNumber,
                    appointment_date: date,
                    appointment_time: appointmentTime,
                    status: "planned"
                }
            ])
            .select();

        if (error) {

            console.error(
                "INSERT ERROR:",
                error
            );

            showFormMessage(
                "Vizita nuk u shtua: " +
                error.message,
                "error"
            );

            return;
        }

        console.log(
            "VIZITA U SHTUA:",
            data
        );

        showFormMessage(
            "Vizita u shtua me sukses.",
            "success"
        );

        if (firstNameInput) {
            firstNameInput.value = "";
        }

        if (lastNameInput) {
            lastNameInput.value = "";
        }

        if (cardNumberInput) {
            cardNumberInput.value = "";
        }

        if (timeInput) {
            timeInput.value = "";
        }

        await loadAppointments();

    } catch (error) {

        console.error(
            "ADD APPOINTMENT EXCEPTION:",
            error
        );

        showFormMessage(
            "Gabim: " +
            (error.message || "gabim i panjohur"),
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "+ Shto vizitën";
        }
    }
}

/* ======================================================
   FORM MESSAGE
====================================================== */

function showFormMessage(
    text,
    type
) {

    const element =
        document.getElementById(
            "formMessage"
        );

    if (!element) {
        return;
    }

    element.innerHTML = `
        <div class="message ${type}">
            ${escapeHtml(text)}
        </div>
    `;

    setTimeout(
        function() {

            if (element) {
                element.innerHTML = "";
            }

        },
        4000
    );
}

/* ======================================================
   CHANGE STATUS
====================================================== */

async function changeStatus(
    id,
    newStatus
) {

    if (!id) {
        return;
    }

    console.log(
        "Ndryshimi i statusit:",
        id,
        newStatus
    );

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("appointments")
            .update({
                status: newStatus
            })
            .eq("id", id)
            .select();

        if (error) {

            console.error(
                "UPDATE STATUS ERROR:",
                error
            );

            alert(
                "Statusi nuk u ndryshua:\n" +
                error.message
            );

            return;
        }

        console.log(
            "STATUSI U NDRYSHUA:",
            data
        );

        await loadAppointments();

    } catch (error) {

        console.error(
            "CHANGE STATUS EXCEPTION:",
            error
        );

        alert(
            "Gabim:\n" +
            (error.message || "gabim i panjohur")
        );
    }
}

/* ======================================================
   DELETE
====================================================== */

async function deleteAppointment(id) {

    if (!id) {
        return;
    }

    const confirmed =
        window.confirm(
            "A jeni i sigurt që dëshironi ta fshini këtë vizitë?"
        );

    if (!confirmed) {
        return;
    }

    console.log(
        "Po fshihet vizita:",
        id
    );

    try {

        const {
            error
        } = await supabaseClient
            .from("appointments")
            .delete()
            .eq("id", id);

        if (error) {

            console.error(
                "DELETE ERROR:",
                error
            );

            alert(
                "Vizita nuk u fshi:\n" +
                error.message
            );

            return;
        }

        console.log(
            "VIZITA U FSHI"
        );

        await loadAppointments();

    } catch (error) {

        console.error(
            "DELETE EXCEPTION:",
            error
        );

        alert(
            "Gabim:\n" +
            (error.message || "gabim i panjohur")
        );
    }
}

/* ======================================================
   REALTIME
====================================================== */

function startRealtime() {

    if (realtimeChannel) {

        console.log(
            "Realtime është tashmë aktiv."
        );

        return;
    }

    console.log(
        "Po aktivizohet realtime..."
    );

    try {

        const channel =
            supabaseClient.channel(
                "appointments-realtime"
            );

        realtimeChannel = channel;

        channel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "appointments"
            },
            function(payload) {

                console.log(
                    "REALTIME NDRYSHIM:",
                    payload
                );

                /*
                Pas çdo ndryshimi nga një kompjuter,
                rifreskojmë orarin në kompjuterët e tjerë.
                */

                loadAppointments();
            }
        );

        channel.subscribe(
            function(status) {

                console.log(
                    "REALTIME STATUS:",
                    status
                );

                if (
                    status === "CHANNEL_ERROR"
                ) {

                    console.error(
                        "Realtime CHANNEL_ERROR"
                    );
                }

                if (
                    status === "TIMED_OUT"
                ) {

                    console.error(
                        "Realtime TIMED_OUT"
                    );
                }
            }
        );

    } catch (error) {

        console.error(
            "REALTIME ERROR:",
            error
        );

        realtimeChannel = null;
    }
}

/* ======================================================
   STOP REALTIME
====================================================== */

function stopRealtime() {

    if (!realtimeChannel) {
        return;
    }

    console.log(
        "Po mbyllet realtime..."
    );

    try {

        supabaseClient.removeChannel(
            realtimeChannel
        );

    } catch (error) {

        console.warn(
            "STOP REALTIME ERROR:",
            error
        );
    }

    realtimeChannel = null;
}

/* ======================================================
   LOGOUT
====================================================== */

async function logout() {

    const confirmed =
        window.confirm(
            "A dëshironi të dilni nga sistemi?"
        );

    if (!confirmed) {
        return;
    }

    try {

        stopRealtime();

        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {
            console.error(
                "LOGOUT ERROR:",
                error
            );

            alert(
                "Nuk u bë logout:\n" +
                error.message
            );

            return;
        }

        applicationStarted = false;
        applicationStarting = false;

        showLogin();

    } catch (error) {

        console.error(
            "LOGOUT EXCEPTION:",
            error
        );

        showLogin(
            "Ndodhi një gabim gjatë daljes."
        );
    }
}

/* ======================================================
   AUTH LISTENER
====================================================== */

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        async function(event, session) {

            console.log(
                "Auth event:",
                event
            );

            if (event === "INITIAL_SESSION") {
                return;
            }

            if (event === "SIGNED_IN") {

                console.log(
                    "SIGNED_IN - session aktive."
                );

                /*
                Mos e hapim aplikacionin përsëri këtu
                nëse startApplication() është duke punuar.
                */

                if (
                    !applicationStarted &&
                    !applicationStarting
                ) {

                    await startApplication();
                }

                return;
            }

            if (event === "SIGNED_OUT") {

                console.log(
                    "SIGNED_OUT"
                );

                stopRealtime();

                applicationStarted = false;
                applicationStarting = false;

                showLogin();

                return;
            }
        }
    );
}

/* ======================================================
   WINDOW LOAD
====================================================== */

window.addEventListener(
    "load",
    async function() {

        console.log(
            "WINDOW LOADED"
        );

        console.log(
            "APP VERSION:",
            APP_VERSION
        );

        if (!supabaseClient) {

            showLogin(
                "Supabase nuk u inicializua. Kontrolloni internetin."
            );

            return;
        }

        await checkSession();
    }
);

/* ======================================================
   GLOBAL FUNCTIONS
====================================================== */

window.selectTime =
    selectTime;

window.changeStatus =
    changeStatus;

window.deleteAppointment =
    deleteAppointment;

/* ======================================================
   END
====================================================== */

console.log(
    "APP.JS GATI - VERSION:",
    APP_VERSION
);
