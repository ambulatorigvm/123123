"use strict";

const APP_VERSION = "GVM-20260923-04";

console.log("=================================");
console.log("AMBULATORI GVM");
console.log("APP VERSION:", APP_VERSION);
console.log("APP.JS U NGARKUA");
console.log("=================================");

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient = null;

let selectedDate = new Date();
let currentAppointments = [];
let realtimeChannel = null;
let applicationStarted = false;
let applicationStarting = false;


/* =====================================================
   SUPABASE
===================================================== */

try {

    if (!window.supabase) {
        throw new Error("Supabase library nuk u ngarkua.");
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("SUPABASE U KRIJUA");

} catch (error) {

    console.error("SUPABASE ERROR:", error);

}


/* =====================================================
   HELPERS
===================================================== */

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


function formatDate(date) {

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


function statusText(status) {

    if (status === "planned") {
        return "Planifikuar";
    }

    if (status === "arrived") {
        return "Erdhi";
    }

    if (status === "finished") {
        return "Përfundoi";
    }

    if (status === "cancelled") {
        return "Anuluar";
    }

    return "Planifikuar";

}


function statusClass(status) {

    if (status === "arrived") {
        return "status-arrived";
    }

    if (status === "finished") {
        return "status-finished";
    }

    if (status === "cancelled") {
        return "status-cancelled";
    }

    return "status-planned";

}


/* =====================================================
   LOGIN
===================================================== */

function showLogin(message) {

    stopRealtime();

    applicationStarted = false;
    applicationStarting = false;

    const app = document.getElementById("app");

    if (!app) {
        return;
    }

    let errorHtml = "";

    if (message) {

        errorHtml =
            '<div class="login-error">' +
            escapeHtml(message) +
            "</div>";

    }

    app.innerHTML =
        '<div class="login-page">' +

            '<div class="login-box">' +

                '<div class="login-logo">+</div>' +

                '<h1 class="login-title">' +
                    'AMBULATORI GVM' +
                '</h1>' +

                '<p class="login-subtitle">' +
                    'Sistemi i recepsionit dhe menaxhimit të vizitave' +
                '</p>' +

                '<form id="loginForm">' +

                    '<div class="form-row">' +

                        '<label class="input-label">' +
                            'Email' +
                        '</label>' +

                        '<input ' +
                            'id="loginEmail" ' +
                            'class="input" ' +
                            'type="email" ' +
                            'placeholder="Shkruani email-in" ' +
                            'required' +
                        '>' +

                    '</div>' +

                    '<div class="form-row">' +

                        '<label class="input-label">' +
                            'Fjalëkalimi' +
                        '</label>' +

                        '<input ' +
                            'id="loginPassword" ' +
                            'class="input" ' +
                            'type="password" ' +
                            'placeholder="Shkruani fjalëkalimin" ' +
                            'required' +
                        '>' +

                    '</div>' +

                    '<button ' +
                        'id="loginButton" ' +
                        'class="login-button" ' +
                        'type="submit">' +

                        'Hyr në sistem' +

                    '</button>' +

                    errorHtml +

                '</form>' +

            '</div>' +

        '</div>';

    const form = document.getElementById("loginForm");

    if (form) {

        form.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                await login();

            }
        );

    }

}


/* =====================================================
   LOGIN FUNCTION
===================================================== */

async function login() {

    const emailElement =
        document.getElementById("loginEmail");

    const passwordElement =
        document.getElementById("loginPassword");

    const button =
        document.getElementById("loginButton");

    const email =
        emailElement
            ? emailElement.value.trim()
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    if (!email || !password) {

        showLogin(
            "Ju lutem plotësoni email-in dhe fjalëkalimin."
        );

        return;

    }

    if (button) {

        button.disabled = true;
        button.textContent = "Po kontrollohet...";

    }

    console.log("Po bëhet login:", email);

    try {

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

            showLogin(
                "Login dështoi: " +
                result.error.message
            );

            return;

        }

        console.log("LOGIN SUKSES");

        await startApplication();

    } catch (error) {

        console.error(
            "LOGIN EXCEPTION:",
            error
        );

        showLogin(
            "Gabim gjatë hyrjes."
        );

    }

}


/* =====================================================
   CHECK SESSION
===================================================== */

async function checkSession() {

    console.log("Po kontrollohet sesioni...");

    try {

        const result =
            await supabaseClient.auth.getSession();

        if (result.error) {

            console.error(
                "SESSION ERROR:",
                result.error
            );

            showLogin(
                result.error.message
            );

            return;

        }

        console.log(
            "Session:",
            result.data
        );

        if (
            result.data &&
            result.data.session
        ) {

            await startApplication();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error(
            "CHECK SESSION EXCEPTION:",
            error
        );

        showLogin(
            "Nuk u kontrollua dot sesioni."
        );

    }

}


/* =====================================================
   START APPLICATION
===================================================== */

async function startApplication() {

    if (applicationStarting) {
        return;
    }

    if (applicationStarted) {
        return;
    }

    applicationStarting = true;

    console.log("Po hapet aplikacioni...");

    try {

        const result =
            await supabaseClient.auth.getSession();

        if (
            !result.data ||
            !result.data.session
        ) {

            showLogin();

            return;

        }

        await showApp();

        applicationStarted = true;

        console.log("APLIKACIONI U HAP");

    } catch (error) {

        console.error(
            "START APP ERROR:",
            error
        );

        showLogin(
            "Aplikacioni nuk u hap: " +
            error.message
        );

    } finally {

        applicationStarting = false;

    }

}


/* =====================================================
   MAIN APP
===================================================== */

async function showApp() {

    const app =
        document.getElementById("app");

    if (!app) {

        throw new Error(
            "Elementi app nuk ekziston."
        );

    }

    let userEmail = "";

    try {

        const result =
            await supabaseClient.auth.getUser();

        if (
            result.data &&
            result.data.user
        ) {

            userEmail =
                result.data.user.email || "";

        }

    } catch (error) {

        console.warn(
            "User error:",
            error
        );

    }

    app.innerHTML =

        '<div class="app-page">' +

            '<header class="topbar">' +

                '<div class="topbar-inner">' +

                    '<div class="brand">' +

                        '<div class="brand-icon">' +
                            '+' +
                        '</div>' +

                        '<div>' +

                            '<div class="brand-title">' +
                                'AMBULATORI GVM' +
                            '</div>' +

                            '<div class="brand-subtitle">' +
                                'Recepsioni • Menaxhimi i vizitave' +
                            '</div>' +

                        '</div>' +

                    '</div>' +

                    '<div class="topbar-right">' +

                        '<div class="user-badge">' +
                            escapeHtml(userEmail) +
                        '</div>' +

                        '<button ' +
                            'class="logout-button" ' +
                            'id="logoutButton">' +

                            'Dil' +

                        '</button>' +

                    '</div>' +

                '</div>' +

            '</header>' +

            '<main class="page">' +

                '<section class="date-panel">' +

                    '<button ' +
                        'class="date-button" ' +
                        'id="previousDayButton">' +

                        '← Dita e mëparshme' +

                    '</button>' +

                    '<div class="date-info">' +

                        '<div class="date-label">' +
                            'Data e zgjedhur' +
                        '</div>' +

                        '<div ' +
                            'class="date-value" ' +
                            'id="selectedDateLabel">' +
                        '</div>' +

                    '</div>' +

                    '<button ' +
                        'class="date-button today-button" ' +
                        'id="todayButton">' +

                        'Sot' +

                    '</button>' +

                    '<button ' +
                        'class="date-button" ' +
                        'id="nextDayButton">' +

                        'Dita tjetër →' +

                    '</button>' +

                '</section>' +

                '<div class="main-grid">' +

                    '<section class="card">' +

                        '<div class="card-header">' +

                            '<h2 class="card-title">' +
                                'Shto vizitë' +
                            '</h2>' +

                            '<p class="card-description">' +
                                'Regjistro një pacient të ri.' +
                            '</p>' +

                        '</div>' +

                        '<div class="card-body">' +

                            '<div id="formMessage"></div>' +

                            '<form id="appointmentForm">' +

                                '<div class="form-group">' +

                                    '<label>' +
                                        'Emri' +
                                    '</label>' +

                                    '<input ' +
                                        'id="firstName" ' +
                                        'class="form-control" ' +
                                        'type="text" ' +
                                        'required' +
                                    '>' +

                                '</div>' +

                                '<div class="form-group">' +

                                    '<label>' +
                                        'Mbiemri' +
                                    '</label>' +

                                    '<input ' +
                                        'id="lastName" ' +
                                        'class="form-control" ' +
                                        'type="text" ' +
                                        'required' +
                                    '>' +

                                '</div>' +

                                '<div class="form-group">' +

                                    '<label>' +
                                        'Nr. i kartelës' +
                                    '</label>' +

                                    '<input ' +
                                        'id="cardNumber" ' +
                                        'class="form-control" ' +
                                        'type="text"' +
                                    '>' +

                                '</div>' +

                                '<div class="form-group">' +

                                    '<label>' +
                                        'Ora' +
                                    '</label>' +

                                    '<select ' +
                                        'id="appointmentTime" ' +
                                        'class="form-control" ' +
                                        'required>' +

                                        '<option value="">' +
                                            'Zgjidhni orën' +
                                        '</option>' +

                                    '</select>' +

                                '</div>' +

                                '<button ' +
                                    'class="submit-button" ' +
                                    'id="addAppointmentButton" ' +
                                    'type="submit">' +

                                    '+ Shto vizitën' +

                                '</button>' +

                            '</form>' +

                        '</div>' +

                    '</section>' +

                    '<section class="card schedule-card">' +

                        '<div class="schedule-header">' +

                            '<div>' +

                                '<h2 class="schedule-title">' +
                                    'Orari ditor' +
                                '</h2>' +

                                '<div class="card-description">' +
                                    '08:00 — 18:00 • çdo 15 minuta' +
                                '</div>' +

                            '</div>' +

                            '<div ' +
                                'class="appointment-count" ' +
                                'id="appointmentCount">' +

                                '0 vizita' +

                            '</div>' +

                        '</div>' +

                        '<div id="appointments">' +

                            '<div class="loading-schedule">' +
                                'Po ngarkohet orari...' +
                            '</div>' +

                        '</div>' +

                    '</section>' +

                '</div>' +

            '</main>' +

        '</div>';

    setupEvents();

    populateTimes();

    updateDateLabel();

    await loadAppointments();

    startRealtime();

}


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

    const previous =
        document.getElementById(
            "previousDayButton"
        );

    const today =
        document.getElementById(
            "todayButton"
        );

    const next =
        document.getElementById(
            "nextDayButton"
        );

    const logout =
        document.getElementById(
            "logoutButton"
        );

    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (previous) {

        previous.addEventListener(
            "click",
            async function() {

                selectedDate.setDate(
                    selectedDate.getDate() - 1
                );

                updateDateLabel();

                await loadAppointments();

            }
        );

    }

    if (today) {

        today.addEventListener(
            "click",
            async function() {

                selectedDate = new Date();

                updateDateLabel();

                await loadAppointments();

            }
        );

    }

    if (next) {

        next.addEventListener(
            "click",
            async function() {

                selectedDate.setDate(
                    selectedDate.getDate() + 1
                );

                updateDateLabel();

                await loadAppointments();

            }
        );

    }

    if (logout) {

        logout.addEventListener(
            "click",
            logoutUser
        );

    }

    if (form) {

        form.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                await addAppointment();

            }
        );

    }

}


/* =====================================================
   DATE
===================================================== */

function updateDateLabel() {

    const element =
        document.getElementById(
            "selectedDateLabel"
        );

    if (element) {

        element.textContent =
            formatDate(selectedDate);

    }

}


/* =====================================================
   TIMES
===================================================== */

function populateTimes() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {
        return;
    }

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


/* =====================================================
   LOAD APPOINTMENTS
===================================================== */

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

        container.innerHTML =
            '<div class="loading-schedule">' +
                'Po ngarkohet orari...' +
            '</div>';

    }

    try {

        const result =
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

        if (result.error) {

            console.error(
                "LOAD ERROR:",
                result.error
            );

            if (container) {

                container.innerHTML =
                    '<div class="error-box">' +
                        '<strong>Gabim gjatë ngarkimit.</strong><br><br>' +
                        escapeHtml(
                            result.error.message
                        ) +
                    '</div>';

            }

            return;

        }

        currentAppointments =
            result.data || [];

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
            "LOAD EXCEPTION:",
            error
        );

        if (container) {

            container.innerHTML =
                '<div class="error-box">' +
                    '<strong>Gabim.</strong><br><br>' +
                    escapeHtml(
                        error.message
                    ) +
                '</div>';

        }

    }

}


/* =====================================================
   RENDER
===================================================== */

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

    const byTime = {};

    currentAppointments.forEach(
        function(appointment) {

            const time =
                normalizeTime(
                    appointment.appointment_time
                );

            byTime[time] =
                appointment;

        }
    );

    let html = "";

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

            html +=
                '<div class="time-slot">' +

                    '<div class="slot-time">' +
                        time +
                    '</div>' +

                    '<div class="slot-content">';

            if (byTime[time]) {

                html +=
                    renderPatient(
                        byTime[time]
                    );

            } else {

                html +=
                    '<div ' +
                        'class="empty-slot" ' +
                        'onclick="selectTime(\'' +
                        time +
                        '\')">' +

                        'Orari i lirë — kliko për të shtuar pacient' +

                    '</div>';

            }

            html +=
                    '</div>' +
                '</div>';

        }

    }

    container.innerHTML = html;

    console.log(
        "Rreshtat e krijuar në ekran:",
        currentAppointments.length
    );

}


/* =====================================================
   PATIENT
===================================================== */

function renderPatient(appointment) {

    const status =
        appointment.status || "planned";

    let actions = "";

    if (
        status === "planned"
    ) {

        actions +=
            '<button ' +
                'class="action-button action-arrived" ' +
                'onclick="changeStatus(\'' +
                appointment.id +
                '\',\'arrived\')">' +

                'Erdhi' +

            '</button>';

    }

    if (
        status === "arrived"
    ) {

        actions +=
            '<button ' +
                'class="action-button action-finished" ' +
                'onclick="changeStatus(\'' +
                appointment.id +
                '\',\'finished\')">' +

                'Përfundoi' +

            '</button>';

    }

    if (
        status !== "finished" &&
        status !== "cancelled"
    ) {

        actions +=
            '<button ' +
                'class="action-button action-cancel" ' +
                'onclick="changeStatus(\'' +
                appointment.id +
                '\',\'cancelled\')">' +

                'Anulo' +

            '</button>';

    }

    actions +=
        '<button ' +
            'class="action-button action-delete" ' +
            'onclick="deleteAppointment(\'' +
            appointment.id +
            '\')">' +

            'Fshi' +

        '</button>';

    return (

        '<div class="patient-card">' +

            '<div class="patient-info">' +

                '<div class="patient-name">' +
                    escapeHtml(
                        appointment.first_name
                    ) +
                    " " +
                    escapeHtml(
                        appointment.last_name
                    ) +
                '</div>' +

                '<div class="patient-details">' +
                    (
                        appointment.card_number
                            ? "Kartela: " +
                              escapeHtml(
                                  appointment.card_number
                              )
                            : "Pa numër kartele"
                    ) +
                '</div>' +

                '<span class="status ' +
                    statusClass(status) +
                '">' +

                    statusText(status) +

                '</span>' +

            '</div>' +

            '<div class="appointment-actions">' +
                actions +
            '</div>' +

        '</div>'

    );

}


/* =====================================================
   SELECT TIME
===================================================== */

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

}


/* =====================================================
   ADD APPOINTMENT
===================================================== */

async function addAppointment() {

    const first =
        document.getElementById(
            "firstName"
        );

    const last =
        document.getElementById(
            "lastName"
        );

    const card =
        document.getElementById(
            "cardNumber"
        );

    const time =
        document.getElementById(
            "appointmentTime"
        );

    const button =
        document.getElementById(
            "addAppointmentButton"
        );

    const message =
        document.getElementById(
            "formMessage"
        );

    const firstName =
        first
            ? first.value.trim()
            : "";

    const lastName =
        last
            ? last.value.trim()
            : "";

    const cardNumber =
        card
            ? card.value.trim()
            : "";

    const appointmentTime =
        time
            ? time.value
            : "";

    if (!firstName || !lastName) {

        showFormMessage(
            "Plotësoni emrin dhe mbiemrin.",
            "error"
        );

        return;

    }

    if (!appointmentTime) {

        showFormMessage(
            "Zgjidhni orën.",
            "error"
        );

        return;

    }

    const date =
        dateToString(selectedDate);

    if (button) {

        button.disabled = true;
        button.textContent = "Po ruhet...";

    }

    try {

        const existing =
            await supabaseClient
                .from("appointments")
                .select("id")
                .eq(
                    "appointment_date",
                    date
                )
                .eq(
                    "appointment_time",
                    appointmentTime
                )
                .limit(1);

        if (existing.error) {

            throw existing.error;

        }

        if (
            existing.data &&
            existing.data.length > 0
        ) {

            showFormMessage(
                "Kjo orë është tashmë e zënë.",
                "error"
            );

            return;

        }

        const result =
            await supabaseClient
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
                ]);

        if (result.error) {

            throw result.error;

        }

        showFormMessage(
            "Vizita u shtua me sukses.",
            "success"
        );

        if (first) {
            first.value = "";
        }

        if (last) {
            last.value = "";
        }

        if (card) {
            card.value = "";
        }

        if (time) {
            time.value = "";
        }

        await loadAppointments();

    } catch (error) {

        console.error(
            "ADD ERROR:",
            error
        );

        showFormMessage(
            "Vizita nuk u shtua: " +
            error.message,
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


/* =====================================================
   MESSAGE
===================================================== */

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

    element.innerHTML =
        '<div class="message ' +
        type +
        '">' +
        escapeHtml(text) +
        '</div>';

}


/* =====================================================
   CHANGE STATUS
===================================================== */

async function changeStatus(
    id,
    status
) {

    if (!id) {
        return;
    }

    try {

        const result =
            await supabaseClient
                .from("appointments")
                .update({
                    status: status
                })
                .eq(
                    "id",
                    id
                );

        if (result.error) {

            console.error(
                "STATUS ERROR:",
                result.error
            );

            alert(
                "Gabim: " +
                result.error.message
            );

            return;

        }

        await loadAppointments();

    } catch (error) {

        console.error(
            "STATUS EXCEPTION:",
            error
        );

        alert(
            "Gabim: " +
            error.message
        );

    }

}


/* =====================================================
   DELETE
===================================================== */

async function deleteAppointment(id) {

    if (!id) {
        return;
    }

    if (
        !window.confirm(
            "A jeni i sigurt që dëshironi ta fshini këtë vizitë?"
        )
    ) {

        return;

    }

    try {

        const result =
            await supabaseClient
                .from("appointments")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (result.error) {

            console.error(
                "DELETE ERROR:",
                result.error
            );

            alert(
                "Vizita nuk u fshi: " +
                result.error.message
            );

            return;

        }

        await loadAppointments();

    } catch (error) {

        console.error(
            "DELETE EXCEPTION:",
            error
        );

        alert(
            "Gabim: " +
            error.message
        );

    }

}


/* =====================================================
   REALTIME
===================================================== */

function startRealtime() {

    if (realtimeChannel) {

        console.log(
            "Realtime tashmë është aktiv."
        );

        return;

    }

    console.log(
        "Po aktivizohet realtime..."
    );

    try {

        realtimeChannel =
            supabaseClient.channel(
                "appointments-realtime"
            );

        realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "appointments"
            },
            function(payload) {

                console.log(
                    "REALTIME:",
                    payload
                );

                loadAppointments();

            }
        );

        realtimeChannel.subscribe(
            function(status) {

                console.log(
                    "REALTIME STATUS:",
                    status
                );

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


/* =====================================================
   STOP REALTIME
===================================================== */

function stopRealtime() {

    if (!realtimeChannel) {
        return;
    }

    try {

        supabaseClient.removeChannel(
            realtimeChannel
        );

    } catch (error) {

        console.warn(
            "STOP REALTIME:",
            error
        );

    }

    realtimeChannel = null;

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

    if (
        !window.confirm(
            "A dëshironi të dilni nga sistemi?"
        )
    ) {

        return;

    }

    try {

        stopRealtime();

        const result =
            await supabaseClient.auth.signOut();

        if (result.error) {

            alert(
                result.error.message
            );

            return;

        }

        applicationStarted = false;
        applicationStarting = false;

        showLogin();

    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }

}


/* =====================================================
   AUTH EVENTS
===================================================== */

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        function(event) {

            console.log(
                "Auth event:",
                event
            );

            if (
                event === "SIGNED_OUT"
            ) {

                stopRealtime();

                applicationStarted = false;
                applicationStarting = false;

                showLogin();

            }

        }
    );

}


/* =====================================================
   WINDOW LOAD
===================================================== */

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
                "Supabase nuk u inicializua."
            );

            return;

        }

        await checkSession();

    }
);


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.selectTime =
    selectTime;

window.changeStatus =
    changeStatus;

window.deleteAppointment =
    deleteAppointment;


console.log(
    "APP.JS GATI:",
    APP_VERSION
);
