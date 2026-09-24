```javascript
const APP_VERSION = "GVM-20260924-01";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

let currentUser = null;
let currentDate = new Date();
let appointments = [];
let realtimeChannel = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "AMBULATORI GVM:",
            APP_VERSION
        );

        await checkSession();

        supabaseClient.auth.onAuthStateChange(
            async (event, session) => {

                console.log(
                    "Auth event:",
                    event
                );

                console.log(
                    "Session:",
                    session
                );

                if (session) {

                    currentUser =
                        session.user;

                    showApp();

                    await loadAppointments();

                } else {

                    currentUser = null;

                    showLogin();
                }
            }
        );
    }
);


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(error);

            showLogin();

            return;
        }

        if (data.session) {

            currentUser =
                data.session.user;

            showApp();

            await loadAppointments();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "checkSession error:",
            error
        );

        showLogin();
    }
}


/* =========================================================
   LOGIN
========================================================= */

function showLogin() {

    if (realtimeChannel) {

        supabaseClient.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }

    document.body.innerHTML = `
        <div class="login-page">

            <div class="login-card">

                <div class="login-logo">

                    <div class="login-logo-icon">
                        G
                    </div>

                </div>

                <h1 class="login-title">
                    AMBULATORI GVM
                </h1>

                <div class="login-subtitle">
                    Sistemi i menaxhimit të vizitave
                </div>

                <form
                    id="loginForm"
                    class="login-form"
                >

                    <div>

                        <label for="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            autocomplete="email"
                            required
                        >

                    </div>

                    <div>

                        <label for="password">
                            Fjalëkalimi
                        </label>

                        <input
                            id="password"
                            type="password"
                            autocomplete="current-password"
                            required
                        >

                    </div>

                    <div
                        id="loginError"
                        class="login-error"
                        style="display:none;"
                    ></div>

                    <button
                        type="submit"
                        class="login-button"
                    >
                        Hyr
                    </button>

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
            login
        );
    }
}


/* =========================================================
   LOGIN ACTION
========================================================= */

async function login(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("email")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;

    const errorBox =
        document.getElementById(
            "loginError"
        );

    errorBox.style.display =
        "none";

    errorBox.textContent = "";

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });

        if (error) {
            throw error;
        }

        currentUser =
            data.user;

        showApp();

        await loadAppointments();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        errorBox.textContent =
            error.message ||
            "Gabim gjatë hyrjes.";

        errorBox.style.display =
            "block";
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

        await supabaseClient
            .auth
            .signOut();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }
}


/* =========================================================
   APP
========================================================= */

function showApp() {

    document.body.innerHTML = `
        <div class="app">

            <header class="top-header">

                <div class="brand">

                    <div class="brand-icon">
                        G
                    </div>

                    <div>

                        <div class="brand-title">
                            AMBULATORI GVM
                        </div>

                        <div class="brand-subtitle">
                            Menaxhimi i vizitave
                        </div>

                    </div>

                </div>

                <div class="header-right">

                    <div class="system-status">
                        Sistemi aktiv
                    </div>

                    <button
                        id="logoutButton"
                        class="logout-button"
                        type="button"
                    >
                        Dil
                    </button>

                </div>

            </header>


            <main class="main-container">

                <div class="date-navigation">

                    <button
                        id="prevDay"
                        class="date-arrow"
                        type="button"
                    >
                        ‹
                    </button>

                    <div
                        id="selectedDate"
                        class="selected-date"
                    ></div>

                    <button
                        id="nextDay"
                        class="date-arrow"
                        type="button"
                    >
                        ›
                    </button>

                    <button
                        id="todayButton"
                        class="today-button"
                        type="button"
                    >
                        Sot
                    </button>

                </div>


                <section class="new-appointment-card">

                    <h2 class="new-appointment-title">
                        Shto vizitë
                    </h2>

                    <form
                        id="appointmentForm"
                        class="appointment-form"
                    >

                        <div>

                            <label for="appointmentTime">
                                Ora
                            </label>

                            <select
                                id="appointmentTime"
                                required
                            ></select>

                        </div>


                        <div>

                            <label for="patientName">
                                Emri i pacientit
                            </label>

                            <input
                                id="patientName"
                                type="text"
                                placeholder="Emri dhe mbiemri"
                                required
                            >

                        </div>


                        <div>

                            <label for="patientPhone">
                                Telefoni
                            </label>

                            <input
                                id="patientPhone"
                                type="text"
                                placeholder="Numri i telefonit"
                            >

                        </div>


                        <div>

                            <button
                                class="primary-button"
                                type="submit"
                            >
                                Shto vizitë
                            </button>

                        </div>

                    </form>

                </section>


                <section class="schedule-card">

                    <div class="schedule-header">

                        <h2>
                            Orari ditor
                        </h2>

                    </div>

                    <div
                        id="appointments"
                        class="schedule-table-wrapper"
                    >

                        <div class="loading">
                            Po ngarkohet orari...
                        </div>

                    </div>

                </section>

            </main>

        </div>
    `;


    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            logout
        );


    document
        .getElementById(
            "prevDay"
        )
        .addEventListener(
            "click",
            () => {

                currentDate.setDate(
                    currentDate.getDate() - 1
                );

                updateDateDisplay();

                loadAppointments();
            }
        );


    document
        .getElementById(
            "nextDay"
        )
        .addEventListener(
            "click",
            () => {

                currentDate.setDate(
                    currentDate.getDate() + 1
                );

                updateDateDisplay();

                loadAppointments();
            }
        );


    document
        .getElementById(
            "todayButton"
        )
        .addEventListener(
            "click",
            () => {

                currentDate =
                    new Date();

                updateDateDisplay();

                loadAppointments();
            }
        );


    document
        .getElementById(
            "appointmentForm"
        )
        .addEventListener(
            "submit",
            addAppointment
        );


    populateTimeSelect();

    updateDateDisplay();

    setupRealtime();
}


/* =========================================================
   DATE
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


function formatDate(date) {

    return new Intl.DateTimeFormat(
        "sq-AL",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


function updateDateDisplay() {

    const element =
        document.getElementById(
            "selectedDate"
        );

    if (!element) {
        return;
    }

    element.textContent =
        formatDate(
            currentDate
        );
}


/* =========================================================
   TIME
========================================================= */

function generateTimes() {

    const times = [];

    for (
        let hour = 8;
        hour <= 18;
        hour++
    ) {

        times.push(
            String(hour)
                .padStart(2, "0") +
            ":00"
        );
    }

    return times;
}


function populateTimeSelect() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    generateTimes().forEach(
        time => {

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

    const container =
        document.getElementById(
            "appointments"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Po ngarkohet orari...
        </div>
    `;


    try {

        const date =
            dateKey(
                currentDate
            );


        const {
            data,
            error
        } =
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


        if (error) {
            throw error;
        }


        appointments =
            data || [];


        renderAppointments();


    } catch (error) {

        console.error(
            "loadAppointments error:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">

                Nuk u ngarkuan vizitat.

                <br>

                ${escapeHtml(
                    error.message || ""
                )}

            </div>
        `;
    }
}


/* =========================================================
   RENDER APPOINTMENTS
========================================================= */

function renderAppointments() {

    const container =
        document.getElementById(
            "appointments"
        );

    if (!container) {
        return;
    }


    const times =
        generateTimes();


    const byTime = {};


    appointments.forEach(
        appointment => {

            const time =
                normalizeTime(
                    appointment.appointment_time
                );

            byTime[time] =
                appointment;
        }
    );


    let html = `
        <table class="schedule-table">
            <tbody>
    `;


    times.forEach(
        time => {

            const appointment =
                byTime[time];


            if (appointment) {

                html +=
                    renderPatient(
                        appointment,
                        time
                    );

            } else {

                html += `
                    <tr class="schedule-row free">

                        <td class="time-cell">
                            ${time}
                        </td>

                        <td colspan="3">

                            <div
                                class="empty-message"
                                style="
                                    padding:10px;
                                    text-align:left;
                                "
                            >
                                Orari i lirë
                            </div>

                        </td>

                    </tr>
                `;
            }
        }
    );


    html += `
            </tbody>
        </table>
    `;


    container.innerHTML =
        html;
}


/* =========================================================
   PATIENT CARD
========================================================= */

function renderPatient(
    appointment,
    time
) {

    const status =
        appointment.status ||
        "planned";


    const safeName =
        escapeHtml(
            appointment.patient_name ||
            "Pa emër"
        );


    const safePhone =
        escapeHtml(
            appointment.patient_phone ||
            ""
        );


    const initials =
        getInitials(
            appointment.patient_name ||
            "P"
        );


    let actionButtons = "";


    if (status === "planned") {

        actionButtons += `
            <button
                type="button"
                class="action-button arrived"
                onclick="
                    changeStatus(
                        '${appointment.id}',
                        'arrived'
                    )
                "
            >
                Erdhi
            </button>
        `;
    }


    if (status === "arrived") {

        actionButtons += `
            <button
                type="button"
                class="action-button finished"
                onclick="
                    changeStatus(
                        '${appointment.id}',
                        'finished'
                    )
                "
            >
                Përfundoi
            </button>
        `;
    }


    if (
        status !== "finished" &&
        status !== "cancelled"
    ) {

        actionButtons += `
            <button
                type="button"
                class="action-button cancel"
                onclick="
                    changeStatus(
                        '${appointment.id}',
                        'cancelled'
                    )
                "
            >
                Anulo
            </button>
        `;
    }


    actionButtons += `
        <button
            type="button"
            class="action-button delete"
            onclick="
                deleteAppointment(
                    '${appointment.id}'
                )
            "
        >
            Fshi
        </button>
    `;


    /*
       KJO PJESË ËSHTË E RËNDËSISHME.

       Kartës i shtohet statusi:

       patient-card planned
       patient-card arrived
       patient-card finished
       patient-card cancelled

       CSS-ja në index.html
       ngjyros të gjithë kartën.
    */


    return `
        <tr class="schedule-row occupied">

            <td class="time-cell">
                ${time}
            </td>

            <td colspan="3">

                <div
                    class="patient-card ${status}"
                >

                    <div class="patient-wrapper">

                        <div class="patient-avatar">
                            ${initials}
                        </div>

                        <div class="patient-info">

                            <div class="patient-name">
                                ${safeName}
                            </div>

                            ${
                                safePhone
                                    ? `
                                        <div class="patient-label">
                                            ${safePhone}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="status-cell">

                        <span
                            class="
                                status
                                ${statusClass(status)}
                            "
                        >
                            ${statusText(status)}
                        </span>

                    </div>


                    <div class="actions-cell">

                        <div class="action-buttons">
                            ${actionButtons}
                        </div>

                    </div>

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
   STATUS
========================================================= */

function statusText(status) {

    switch (status) {

        case "arrived":
            return "Erdhi";

        case "finished":
            return "Përfundoi";

        case "cancelled":
            return "Anuluar";

        case "planned":
        default:
            return "Planifikuar";
    }
}


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

async function addAppointment(
    event
) {

    event.preventDefault();


    const time =
        document
            .getElementById(
                "appointmentTime"
            )
            .value;


    const patientName =
        document
            .getElementById(
                "patientName"
            )
            .value
            .trim();


    const patientPhone =
        document
            .getElementById(
                "patientPhone"
            )
            .value
            .trim();


    if (!patientName) {
        return;
    }


    try {

        const {
            data: existing,
            error: checkError
        } =
            await supabaseClient
                .from("appointments")
                .select("id")
                .eq(
                    "appointment_date",
                    dateKey(
                        currentDate
                    )
                )
                .eq(
                    "appointment_time",
                    time
                )
                .limit(1);


        if (checkError) {
            throw checkError;
        }


        if (
            existing &&
            existing.length > 0
        ) {

            alert(
                "Ky orar është tashmë i zënë."
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("appointments")
                .insert([
                    {
                        appointment_date:
                            dateKey(
                                currentDate
                            ),

                        appointment_time:
                            time,

                        patient_name:
                            patientName,

                        patient_phone:
                            patientPhone ||
                            null,

                        status:
                            "planned"
                    }
                ]);


        if (error) {
            throw error;
        }


        document
            .getElementById(
                "patientName"
            )
            .value = "";


        document
            .getElementById(
                "patientPhone"
            )
            .value = "";


        await loadAppointments();


    } catch (error) {

        console.error(
            "addAppointment error:",
            error
        );


        alert(
            error.message ||
            "Vizita nuk u shtua."
        );
    }
}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(
    id,
    status
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("appointments")
                .update({
                    status:
                        status
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        await loadAppointments();


    } catch (error) {

        console.error(
            "changeStatus error:",
            error
        );


        alert(
            error.message ||
            "Statusi nuk u ndryshua."
        );
    }
}


/* =========================================================
   DELETE
========================================================= */

async function deleteAppointment(
    id
) {

    const confirmed =
        confirm(
            "A dëshironi ta fshini këtë vizitë?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("appointments")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        await loadAppointments();


    } catch (error) {

        console.error(
            "deleteAppointment error:",
            error
        );


        alert(
            error.message ||
            "Vizita nuk u fshi."
        );
    }
}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {

    if (realtimeChannel) {
        return;
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


/* =========================================================
   HELPERS
========================================================= */

function normalizeTime(
    value
) {

    if (!value) {
        return "";
    }

    return String(value)
        .substring(0, 5);
}


function getInitials(
    name
) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 0) {
        return "P";
    }


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        parts[0].charAt(0) +
        parts[1].charAt(0)
    ).toUpperCase();
}


function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}
```
