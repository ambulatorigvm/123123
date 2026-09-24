const APP_VERSION = "GVM-20260924-20";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

var supabaseClient = null;
var currentUser = null;
var currentDate = new Date();

var appointments = [];
var patients = [];

var editingAppointmentId = null;
var editingPatientId = null;
var selectedAppointmentPatientId = null;

var appointmentsChannel = null;
var patientsChannel = null;

console.log("AMBULATORI GVM " + APP_VERSION);


/* =========================================================
   SUPABASE
========================================================= */

function initSupabase() {
    if (!window.supabase) {
        console.error("Supabase CDN nuk u ngarkua.");
        showFatalError(
            "Supabase nuk u ngarkua. Kontrollo lidhjen me internetin."
        );
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        return true;
    } catch (error) {
        console.error("Supabase init error:", error);
        showFatalError("Gabim gjatë inicializimit të sistemit.");
        return false;
    }
}


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    injectStyles();

    if (!initSupabase()) {
        return;
    }

    checkSession();
});


async function checkSession() {
    console.log("Checking session...");

    try {
        var result = await supabaseClient.auth.getSession();

        if (result.error) {
            console.error("Session error:", result.error);
            showLogin();
            return;
        }

        var session = result.data.session;

        if (session && session.user) {
            currentUser = session.user;

            console.log(
                "Existing session:",
                currentUser.email
            );

            await startApplication();
        } else {
            showLogin();
        }

        supabaseClient.auth.onAuthStateChange(
            async function (event, sessionData) {
                console.log("Auth event:", event);

                if (
                    event === "SIGNED_IN" &&
                    sessionData &&
                    sessionData.user
                ) {
                    currentUser = sessionData.user;
                    await startApplication();
                }

                if (event === "SIGNED_OUT") {
                    currentUser = null;
                    stopRealtime();
                    showLogin();
                }
            }
        );
    } catch (error) {
        console.error("CHECK SESSION ERROR:", error);
        showLogin();
    }
}


/* =========================================================
   APPLICATION START
========================================================= */

async function startApplication() {
    buildApplication();

    await loadAppointments();
    await loadPatients();

    setupRealtime();

    showAppointments();
}


/* =========================================================
   LOGIN
========================================================= */

function showLogin() {
    var app = document.getElementById("app");

    if (!app) {
        return;
    }

    app.innerHTML =
        '<div class="login-page">' +
            '<div class="login-box">' +
                '<div class="login-logo">GVM</div>' +
                '<h1>AMBULATORI GVM</h1>' +
                '<p class="login-subtitle">Sistemi i menaxhimit të ambulancës</p>' +

                '<form id="loginForm">' +

                    '<label>Email</label>' +
                    '<input id="loginEmail" type="email" autocomplete="username" required placeholder="Email">' +

                    '<label>Fjalëkalimi</label>' +
                    '<input id="loginPassword" type="password" autocomplete="current-password" required placeholder="Fjalëkalimi">' +

                    '<button class="primary-button full-button" type="submit">' +
                        'Hyr në sistem' +
                    '</button>' +

                    '<div id="loginMessage" class="login-message"></div>' +

                '</form>' +
            '</div>' +
        '</div>';

    var form = document.getElementById("loginForm");

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            var email =
                document.getElementById("loginEmail").value.trim();

            var password =
                document.getElementById("loginPassword").value;

            var message =
                document.getElementById("loginMessage");

            message.textContent = "Po kontrollohen të dhënat...";
            message.className = "login-message";

            try {
                var result =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (result.error) {
                    console.error(result.error);

                    message.textContent =
                        "Email ose fjalëkalim i pasaktë.";

                    message.className =
                        "login-message error";

                    return;
                }

                currentUser = result.data.user;

                await startApplication();

            } catch (error) {
                console.error(error);

                message.textContent =
                    "Ndodhi një gabim gjatë hyrjes.";

                message.className =
                    "login-message error";
            }
        });
    }
}


/* =========================================================
   MAIN APPLICATION
========================================================= */

function buildApplication() {
    var app = document.getElementById("app");

    if (!app) {
        return;
    }

    app.innerHTML =
        '<div class="app-shell">' +

            '<header class="top-header">' +

                '<div class="brand-area">' +
                    '<div class="brand-logo">GVM</div>' +
                    '<div>' +
                        '<div class="brand-title">AMBULATORI GVM</div>' +
                        '<div class="brand-version">' +
                            APP_VERSION +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="user-area">' +
                    '<span id="currentUserEmail"></span>' +
                    '<button id="logoutButton" class="logout-button">' +
                        'Dil' +
                    '</button>' +
                '</div>' +

            '</header>' +

            '<nav class="main-nav">' +

                '<button id="navAppointments" class="nav-button active">' +
                    '📅 Vizitat' +
                '</button>' +

                '<button id="navPatients" class="nav-button">' +
                    '👤 Pacientët' +
                '</button>' +

            '</nav>' +

            '<main id="mainContent" class="main-content">' +
                '<div class="loading-box">Po ngarkohet sistemi...</div>' +
            '</main>' +

        '</div>';

    var emailElement =
        document.getElementById("currentUserEmail");

    if (emailElement && currentUser) {
        emailElement.textContent =
            currentUser.email || "";
    }

    var logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutUser
        );
    }

    document
        .getElementById("navAppointments")
        .addEventListener(
            "click",
            function () {
                setActiveNav("appointments");
                showAppointments();
            }
        );

    document
        .getElementById("navPatients")
        .addEventListener(
            "click",
            function () {
                setActiveNav("patients");
                showPatients();
            }
        );
}


function setActiveNav(section) {
    var appointmentsButton =
        document.getElementById("navAppointments");

    var patientsButton =
        document.getElementById("navPatients");

    if (appointmentsButton) {
        appointmentsButton.classList.remove("active");
    }

    if (patientsButton) {
        patientsButton.classList.remove("active");
    }

    if (section === "appointments" && appointmentsButton) {
        appointmentsButton.classList.add("active");
    }

    if (section === "patients" && patientsButton) {
        patientsButton.classList.add("active");
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {
    try {
        stopRealtime();

        await supabaseClient.auth.signOut();

        currentUser = null;

        showLogin();
    } catch (error) {
        console.error("Logout error:", error);
    }
}


/* =========================================================
   APPOINTMENTS LOAD
========================================================= */

async function loadAppointments() {
    try {
        var result = await supabaseClient
            .from("appointments")
            .select("*")
            .order("appointment_date", {
                ascending: true
            })
            .order("appointment_time", {
                ascending: true
            });

        if (result.error) {
            console.error(
                "LOAD APPOINTMENTS ERROR:",
                result.error
            );

            appointments = [];

            return;
        }

        appointments = result.data || [];

        console.log(
            "Appointments loaded:",
            appointments.length
        );

    } catch (error) {
        console.error(
            "LOAD APPOINTMENTS EXCEPTION:",
            error
        );
    }
}


/* =========================================================
   PATIENTS LOAD
========================================================= */

async function loadPatients() {
    try {
        var result = await supabaseClient
            .from("patients")
            .select("*")
            .order("full_name", {
                ascending: true
            });

        if (result.error) {
            console.error(
                "LOAD PATIENTS ERROR:",
                result.error
            );

            patients = [];

            return;
        }

        patients = result.data || [];

        console.log(
            "Patients loaded:",
            patients.length
        );

    } catch (error) {
        console.error(
            "LOAD PATIENTS EXCEPTION:",
            error
        );
    }
}


/* =========================================================
   APPOINTMENTS PAGE
========================================================= */

function showAppointments() {
    setActiveNav("appointments");

    var content =
        document.getElementById("mainContent");

    if (!content) {
        return;
    }

    var dateString =
        getDateString(currentDate);

    var todayAppointments =
        appointments.filter(function (item) {
            return item.appointment_date === dateString;
        });

    var confirmedCount =
        todayAppointments.filter(function (item) {
            return item.status === "confirmed";
        }).length;

    var pendingCount =
        todayAppointments.filter(function (item) {
            return !item.status ||
                item.status === "pending";
        }).length;

    var completedCount =
        todayAppointments.filter(function (item) {
            return item.status === "completed";
        }).length;

    var html = "";

    html += '<section class="page-section">';

    html +=
        '<div class="page-header">' +
            '<div>' +
                '<h1>Vizitat</h1>' +
                '<p>Menaxhimi i vizitave ditore</p>' +
            '</div>' +

            '<button id="newAppointmentButton" class="primary-button">' +
                '+ Vizitë e re' +
            '</button>' +
        '</div>';

    html +=
        '<div class="date-toolbar">' +

            '<button id="previousDayButton" class="date-button">' +
                '‹' +
            '</button>' +

            '<div class="current-date">' +
                formatDateAlbanian(currentDate) +
            '</div>' +

            '<button id="nextDayButton" class="date-button">' +
                '›' +
            '</button>' +

            '<button id="todayButton" class="secondary-button">' +
                'Sot' +
            '</button>' +

        '</div>';

    html +=
        '<div class="stats-grid">' +

            '<div class="stat-card">' +
                '<div class="stat-label">Të gjitha</div>' +
                '<div class="stat-value">' +
                    todayAppointments.length +
                '</div>' +
            '</div>' +

            '<div class="stat-card">' +
                '<div class="stat-label">Në pritje</div>' +
                '<div class="stat-value">' +
                    pendingCount +
                '</div>' +
            '</div>' +

            '<div class="stat-card">' +
                '<div class="stat-label">Konfirmuara</div>' +
                '<div class="stat-value">' +
                    confirmedCount +
                '</div>' +
            '</div>' +

            '<div class="stat-card">' +
                '<div class="stat-label">Përfunduara</div>' +
                '<div class="stat-value">' +
                    completedCount +
                '</div>' +
            '</div>' +

        '</div>';

    html +=
        '<div class="appointments-card">' +
            '<div class="section-title">Orari ditor</div>' +
            '<div id="appointmentsList">' +
                renderAppointmentsList(todayAppointments) +
            '</div>' +
        '</div>';

    html += '</section>';

    content.innerHTML = html;

    document
        .getElementById("newAppointmentButton")
        .addEventListener(
            "click",
            function () {
                openAppointmentForm();
            }
        );

    document
        .getElementById("previousDayButton")
        .addEventListener(
            "click",
            function () {
                currentDate.setDate(
                    currentDate.getDate() - 1
                );

                showAppointments();
            }
        );

    document
        .getElementById("nextDayButton")
        .addEventListener(
            "click",
            function () {
                currentDate.setDate(
                    currentDate.getDate() + 1
                );

                showAppointments();
            }
        );

    document
        .getElementById("todayButton")
        .addEventListener(
            "click",
            function () {
                currentDate = new Date();

                showAppointments();
            }
        );
}


function renderAppointmentsList(list) {
    if (!list || list.length === 0) {
        return (
            '<div class="empty-state">' +
                '<div class="empty-icon">📅</div>' +
                '<h3>Nuk ka vizita për këtë ditë</h3>' +
                '<p>Kliko "Vizitë e re" për të shtuar një vizitë.</p>' +
            '</div>'
        );
    }

    var html = "";

    list.forEach(function (appointment) {
        var patient =
            getPatientById(appointment.patient_id);

        var name =
            patient
                ? patient.full_name
                : (appointment.patient_name || "Pacient pa emër");

        var phone =
            patient
                ? (patient.phone || "")
                : (appointment.patient_phone || "");

        var status =
            appointment.status || "pending";

        html +=
            '<div class="appointment-row">' +

                '<div class="appointment-time">' +
                    escapeHtml(
                        appointment.appointment_time || "--:--"
                    ) +
                '</div>' +

                '<div class="appointment-main">' +

                    '<div class="appointment-name">' +
                        escapeHtml(name) +
                    '</div>' +

                    '<div class="appointment-info">' +
                        (phone
                            ? escapeHtml(phone)
                            : "Pa telefon") +

                        (
                            appointment.note
                                ? " • " +
                                  escapeHtml(
                                      appointment.note
                                  )
                                : ""
                        ) +

                    '</div>' +

                '</div>' +

                '<div class="appointment-status status-' +
                    escapeHtml(status) +
                '">' +
                    getStatusLabel(status) +
                '</div>' +

                '<div class="appointment-actions">' +

                    '<button class="small-button" data-edit-appointment="' +
                        escapeHtml(String(appointment.id)) +
                    '">' +
                        'Ndrysho' +
                    '</button>' +

                    '<button class="small-button danger" data-delete-appointment="' +
                        escapeHtml(String(appointment.id)) +
                    '">' +
                        'Fshi' +
                    '</button>' +

                '</div>' +

            '</div>';
    });

    setTimeout(function () {
        document
            .querySelectorAll("[data-edit-appointment]")
            .forEach(function (button) {
                button.addEventListener(
                    "click",
                    function () {
                        openAppointmentForm(
                            button.getAttribute(
                                "data-edit-appointment"
                            )
                        );
                    }
                );
            });

        document
            .querySelectorAll("[data-delete-appointment]")
            .forEach(function (button) {
                button.addEventListener(
                    "click",
                    function () {
                        deleteAppointment(
                            button.getAttribute(
                                "data-delete-appointment"
                            )
                        );
                    }
                );
            });
    }, 0);

    return html;
}


/* =========================================================
   APPOINTMENT FORM
========================================================= */

function openAppointmentForm(id) {
    editingAppointmentId =
        id ? String(id) : null;

    selectedAppointmentPatientId = null;

    var appointment =
        editingAppointmentId
            ? appointments.find(function (item) {
                return String(item.id) ===
                    editingAppointmentId;
            })
            : null;

    if (appointment && appointment.patient_id) {
        selectedAppointmentPatientId =
            String(appointment.patient_id);
    }

    var modal =
        document.createElement("div");

    modal.id = "appointmentModal";
    modal.className = "modal-overlay";

    var selectedPatient =
        appointment && appointment.patient_id
            ? getPatientById(appointment.patient_id)
            : null;

    var initialName =
        selectedPatient
            ? selectedPatient.full_name
            : (
                appointment
                    ? (appointment.patient_name || "")
                    : ""
            );

    var html = "";

    html += '<div class="modal-box large-modal">';

    html +=
        '<div class="modal-header">' +
            '<div>' +
                '<h2>' +
                    (
                        editingAppointmentId
                            ? "Ndrysho vizitën"
                            : "Vizitë e re"
                    ) +
                '</h2>' +
                '<p>Zgjidh pacientin dhe cakto vizitën.</p>' +
            '</div>' +

            '<button id="closeAppointmentModal" class="close-button">×</button>' +
        '</div>';

    html += '<div class="modal-body">';

    html += '<div class="form-section">';

    html += '<div class="form-section-title">Pacienti</div>';

    html +=
        '<label>Kërko pacientin</label>' +

        '<div class="patient-search-wrapper">' +

            '<input id="appointmentPatientSearch" ' +
                'class="form-input" ' +
                'type="text" ' +
                'autocomplete="off" ' +
                'placeholder="Shkruaj emrin e pacientit..." ' +
                'value="' +
                    escapeAttribute(initialName) +
                '">' +

            '<div id="patientSearchResults" class="patient-search-results"></div>' +

        '</div>';

    html +=
        '<input id="appointmentPatientId" type="hidden" value="' +
            (
                selectedAppointmentPatientId
                    ? escapeAttribute(
                        selectedAppointmentPatientId
                    )
                    : ""
            ) +
        '">';

    html +=
        '<div id="selectedPatientCard">' +
            renderSelectedPatientCard(selectedPatient) +
        '</div>';

    html += '</div>';

    html += '<div class="form-grid">';

    html +=
        '<div>' +
            '<label>Data</label>' +
            '<input id="appointmentDate" class="form-input" type="date" value="' +
                escapeAttribute(
                    appointment
                        ? appointment.appointment_date
                        : getDateString(currentDate)
                ) +
            '">' +
        '</div>';

    html +=
        '<div>' +
            '<label>Ora</label>' +
            '<input id="appointmentTime" class="form-input" type="time" value="' +
                escapeAttribute(
                    appointment
                        ? appointment.appointment_time
                        : "08:00"
                ) +
            '">' +
        '</div>';

    html += '</div>';

    html +=
        '<div>' +
            '<label>Statusi</label>' +
            '<select id="appointmentStatus" class="form-input">' +

                '<option value="pending"' +
                    (
                        !appointment ||
                        appointment.status === "pending"
                            ? " selected"
                            : ""
                    ) +
                '>Në pritje</option>' +

                '<option value="confirmed"' +
                    (
                        appointment &&
                        appointment.status === "confirmed"
                            ? " selected"
                            : ""
                    ) +
                '>Konfirmuar</option>' +

                '<option value="completed"' +
                    (
                        appointment &&
                        appointment.status === "completed"
                            ? " selected"
                            : ""
                    ) +
                '>Përfunduar</option>' +

                '<option value="cancelled"' +
                    (
                        appointment &&
                        appointment.status === "cancelled"
                            ? " selected"
                            : ""
                    ) +
                '>Anuluar</option>' +

            '</select>' +
        '</div>';

    html +=
        '<div>' +
            '<label>Shënim</label>' +
            '<textarea id="appointmentNote" class="form-input textarea" rows="3" placeholder="Shënim për vizitën...">' +
                escapeHtml(
                    appointment
                        ? (appointment.note || "")
                        : ""
                ) +
            '</textarea>' +
        '</div>';

    html += '</div>';

    html +=
        '<div class="modal-footer">' +

            '<button id="cancelAppointmentButton" class="secondary-button">' +
                'Anulo' +
            '</button>' +

            '<button id="saveAppointmentButton" class="primary-button">' +
                (
                    editingAppointmentId
                        ? "Ruaj ndryshimet"
                        : "Ruaj vizitën"
                ) +
            '</button>' +

        '</div>';

    html += '</div>';

    modal.innerHTML = html;

    document.body.appendChild(modal);

    document
        .getElementById("closeAppointmentModal")
        .addEventListener(
            "click",
            closeAppointmentModal
        );

    document
        .getElementById("cancelAppointmentButton")
        .addEventListener(
            "click",
            closeAppointmentModal
        );

    document
        .getElementById("saveAppointmentButton")
        .addEventListener(
            "click",
            saveAppointment
        );

    var searchInput =
        document.getElementById(
            "appointmentPatientSearch"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            function () {
                selectedAppointmentPatientId = null;

                document.getElementById(
                    "appointmentPatientId"
                ).value = "";

                renderPatientSearchResults(
                    searchInput.value
                );
            }
        );

        searchInput.addEventListener(
            "focus",
            function () {
                renderPatientSearchResults(
                    searchInput.value
                );
            }
        );
    }
}


function renderPatientSearchResults(searchText) {
    var results =
        document.getElementById(
            "patientSearchResults"
        );

    if (!results) {
        return;
    }

    var text =
        String(searchText || "")
            .trim()
            .toLowerCase();

    var filtered = patients.filter(
        function (patient) {
            if (!text) {
                return true;
            }

            var name =
                String(
                    patient.full_name || ""
                ).toLowerCase();

            var phone =
                String(
                    patient.phone || ""
                ).toLowerCase();

            var personalId =
                String(
                    patient.personal_id || ""
                ).toLowerCase();

            return (
                name.indexOf(text) !== -1 ||
                phone.indexOf(text) !== -1 ||
                personalId.indexOf(text) !== -1
            );
        }
    ).slice(0, 10);

    if (filtered.length === 0) {
        results.innerHTML =
            '<div class="search-empty">' +
                'Nuk u gjet pacient.' +
            '</div>';

        return;
    }

    var html = "";

    filtered.forEach(function (patient) {
        html +=
            '<button type="button" class="patient-search-item" data-patient-search-id="' +
                escapeAttribute(
                    String(patient.id)
                ) +
            '">' +

                '<div class="search-patient-name">' +
                    escapeHtml(
                        patient.full_name || ""
                    ) +
                '</div>' +

                '<div class="search-patient-info">' +

                    (
                        patient.birth_date
                            ? "Datëlindja: " +
                              escapeHtml(
                                  formatBirthDate(
                                      patient.birth_date
                                  )
                              )
                            : ""
                    ) +

                    (
                        patient.phone
                            ? " • " +
                              escapeHtml(
                                  patient.phone
                              )
                            : ""
                    ) +

                '</div>' +

            '</button>';
    });

    results.innerHTML = html;

    results
        .querySelectorAll(
            "[data-patient-search-id]"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    selectAppointmentPatient(
                        button.getAttribute(
                            "data-patient-search-id"
                        )
                    );
                }
            );
        });
}


function selectAppointmentPatient(id) {
    var patient =
        getPatientById(id);

    if (!patient) {
        return;
    }

    selectedAppointmentPatientId =
        String(patient.id);

    var hidden =
        document.getElementById(
            "appointmentPatientId"
        );

    if (hidden) {
        hidden.value =
            String(patient.id);
    }

    var searchInput =
        document.getElementById(
            "appointmentPatientSearch"
        );

    if (searchInput) {
        searchInput.value =
            patient.full_name || "";
    }

    var results =
        document.getElementById(
            "patientSearchResults"
        );

    if (results) {
        results.innerHTML = "";
    }

    var card =
        document.getElementById(
            "selectedPatientCard"
        );

    if (card) {
        card.innerHTML =
            renderSelectedPatientCard(
                patient
            );
    }
}


function renderSelectedPatientCard(patient) {
    if (!patient) {
        return (
            '<div class="patient-not-selected">' +
                '<div class="patient-not-selected-icon">👤</div>' +
                '<div>' +
                    '<strong>Zgjidh një pacient</strong>' +
                    '<p>Shkruaj emrin më sipër dhe zgjidh pacientin nga lista.</p>' +
                '</div>' +
            '</div>'
        );
    }

    return (
        '<div class="selected-patient-card">' +

            '<div class="selected-patient-avatar">' +
                getInitials(
                    patient.full_name
                ) +
            '</div>' +

            '<div class="selected-patient-details">' +

                '<div class="selected-patient-name">' +
                    escapeHtml(
                        patient.full_name || ""
                    ) +
                '</div>' +

                '<div class="selected-patient-grid">' +

                    '<div>' +
                        '<span>Datëlindja</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.birth_date
                                    ? formatBirthDate(
                                        patient.birth_date
                                    )
                                    : "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                    '<div>' +
                        '<span>Telefon</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.phone || "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                    '<div>' +
                        '<span>ID personale</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.personal_id || "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                    '<div>' +
                        '<span>Gjinia</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.gender || "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                '</div>' +

            '</div>' +

        '</div>'
    );
}


/* =========================================================
   SAVE APPOINTMENT
========================================================= */

async function saveAppointment() {
    var patientId =
        document.getElementById(
            "appointmentPatientId"
        ).value.trim();

    var patientName =
        document.getElementById(
            "appointmentPatientSearch"
        ).value.trim();

    var date =
        document.getElementById(
            "appointmentDate"
        ).value;

    var time =
        document.getElementById(
            "appointmentTime"
        ).value;

    var status =
        document.getElementById(
            "appointmentStatus"
        ).value;

    var note =
        document.getElementById(
            "appointmentNote"
        ).value.trim();

    if (!patientId) {
        alert(
            "Duhet të zgjedhësh një pacient nga lista."
        );
        return;
    }

    if (!patientName) {
        alert(
            "Duhet të zgjedhësh pacientin."
        );
        return;
    }

    if (!date) {
        alert("Zgjidh datën e vizitës.");
        return;
    }

    if (!time) {
        alert("Zgjidh orën e vizitës.");
        return;
    }

    var patient =
        getPatientById(patientId);

    var data = {
        patient_id: patientId,
        patient_name: patient
            ? patient.full_name
            : patientName,
        patient_phone: patient
            ? (patient.phone || "")
            : "",
        appointment_date: date,
        appointment_time: time,
        note: note,
        status: status
    };

    var button =
        document.getElementById(
            "saveAppointmentButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent = "Po ruhet...";
    }

    try {
        var result;

        if (editingAppointmentId) {
            result = await supabaseClient
                .from("appointments")
                .update(data)
                .eq(
                    "id",
                    editingAppointmentId
                );
        } else {
            result = await supabaseClient
                .from("appointments")
                .insert([data]);
        }

        if (result.error) {
            console.error(
                "SAVE APPOINTMENT ERROR:",
                result.error
            );

            alert(
                "Vizita nuk u ruajt.\n\n" +
                result.error.message
            );

            if (button) {
                button.disabled = false;
                button.textContent =
                    editingAppointmentId
                        ? "Ruaj ndryshimet"
                        : "Ruaj vizitën";
            }

            return;
        }

        closeAppointmentModal();

        await loadAppointments();

        currentDate =
            parseDate(date);

        showAppointments();

    } catch (error) {
        console.error(
            "SAVE APPOINTMENT EXCEPTION:",
            error
        );

        alert(
            "Ndodhi një gabim gjatë ruajtjes."
        );

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   DELETE APPOINTMENT
========================================================= */

async function deleteAppointment(id) {
    var appointment =
        appointments.find(function (item) {
            return String(item.id) === String(id);
        });

    if (!appointment) {
        return;
    }

    var patient =
        getPatientById(
            appointment.patient_id
        );

    var name =
        patient
            ? patient.full_name
            : (
                appointment.patient_name ||
                "pacientin"
            );

    var confirmed =
        window.confirm(
            "A dëshiron të fshish vizitën e " +
            name +
            "?"
        );

    if (!confirmed) {
        return;
    }

    try {
        var result =
            await supabaseClient
                .from("appointments")
                .delete()
                .eq("id", id);

        if (result.error) {
            console.error(
                "DELETE APPOINTMENT ERROR:",
                result.error
            );

            alert(
                "Vizita nuk u fshi.\n\n" +
                result.error.message
            );

            return;
        }

        await loadAppointments();

        showAppointments();

    } catch (error) {
        console.error(error);

        alert(
            "Ndodhi një gabim gjatë fshirjes."
        );
    }
}


function closeAppointmentModal() {
    var modal =
        document.getElementById(
            "appointmentModal"
        );

    if (modal) {
        modal.remove();
    }

    editingAppointmentId = null;
    selectedAppointmentPatientId = null;
}


/* =========================================================
   PATIENTS PAGE
========================================================= */

function showPatients() {
    setActiveNav("patients");

    var content =
        document.getElementById(
            "mainContent"
        );

    if (!content) {
        return;
    }

    var html = "";

    html += '<section class="page-section">';

    html +=
        '<div class="page-header">' +

            '<div>' +
                '<h1>Pacientët</h1>' +
                '<p>Kartela dhe të dhënat e pacientëve</p>' +
            '</div>' +

            '<button id="newPatientButton" class="primary-button">' +
                '+ Pacient i ri' +
            '</button>' +

        '</div>';

    html +=
        '<div class="patient-toolbar">' +

            '<input id="patientListSearch" ' +
                'class="form-input" ' +
                'type="text" ' +
                'placeholder="Kërko me emër, telefon ose ID..."' +
            '>' +

        '</div>';

    html +=
        '<div id="patientsList" class="patients-grid">' +
            renderPatientsList(patients) +
        '</div>';

    html += '</section>';

    content.innerHTML = html;

    document
        .getElementById("newPatientButton")
        .addEventListener(
            "click",
            function () {
                openPatientEditor();
            }
        );

    document
        .getElementById("patientListSearch")
        .addEventListener(
            "input",
            function () {
                renderFilteredPatients(
                    this.value
                );
            }
        );
}


function renderFilteredPatients(text) {
    var value =
        String(text || "")
            .trim()
            .toLowerCase();

    var filtered =
        patients.filter(
            function (patient) {

                var name =
                    String(
                        patient.full_name || ""
                    ).toLowerCase();

                var phone =
                    String(
                        patient.phone || ""
                    ).toLowerCase();

                var personalId =
                    String(
                        patient.personal_id || ""
                    ).toLowerCase();

                return (
                    !value ||
                    name.indexOf(value) !== -1 ||
                    phone.indexOf(value) !== -1 ||
                    personalId.indexOf(value) !== -1
                );
            }
        );

    var container =
        document.getElementById(
            "patientsList"
        );

    if (container) {
        container.innerHTML =
            renderPatientsList(filtered);
    }
}


function renderPatientsList(list) {
    if (!list || list.length === 0) {
        return (
            '<div class="empty-state full-width">' +
                '<div class="empty-icon">👤</div>' +
                '<h3>Nuk u gjet asnjë pacient</h3>' +
                '<p>Shto një pacient të ri.</p>' +
            '</div>'
        );
    }

    var html = "";

    list.forEach(function (patient) {

        html +=
            '<div class="patient-card">' +

                '<div class="patient-card-top">' +

                    '<div class="patient-avatar">' +
                        getInitials(
                            patient.full_name
                        ) +
                    '</div>' +

                    '<div class="patient-card-name">' +
                        escapeHtml(
                            patient.full_name || ""
                        ) +
                    '</div>' +

                '</div>' +

                '<div class="patient-card-data">' +

                    '<div>' +
                        '<span>Datëlindja</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.birth_date
                                    ? formatBirthDate(
                                        patient.birth_date
                                    )
                                    : "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                    '<div>' +
                        '<span>Telefon</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.phone || "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                    '<div>' +
                        '<span>ID personale</span>' +
                        '<strong>' +
                            escapeHtml(
                                patient.personal_id || "-"
                            ) +
                        '</strong>' +
                    '</div>' +

                '</div>' +

                '<div class="patient-card-actions">' +

                    '<button class="small-button primary-small" data-view-patient="' +
                        escapeAttribute(
                            String(patient.id)
                        ) +
                    '">' +
                        'Hap kartelën' +
                    '</button>' +

                    '<button class="small-button" data-edit-patient="' +
                        escapeAttribute(
                            String(patient.id)
                        ) +
                    '">' +
                        'Ndrysho' +
                    '</button>' +

                    '<button class="small-button danger" data-delete-patient="' +
                        escapeAttribute(
                            String(patient.id)
                        ) +
                    '">' +
                        'Fshi' +
                    '</button>' +

                '</div>' +

            '</div>';
    });

    setTimeout(function () {

        document
            .querySelectorAll(
                "[data-view-patient]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {
                        viewPatient(
                            button.getAttribute(
                                "data-view-patient"
                            )
                        );
                    }
                );
            });

        document
            .querySelectorAll(
                "[data-edit-patient]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {
                        openPatientEditor(
                            button.getAttribute(
                                "data-edit-patient"
                            )
                        );
                    }
                );
            });

        document
            .querySelectorAll(
                "[data-delete-patient]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {
                        deletePatient(
                            button.getAttribute(
                                "data-delete-patient"
                            )
                        );
                    }
                );
            });

    }, 0);

    return html;
}


/* =========================================================
   PATIENT EDITOR
========================================================= */

function openPatientEditor(id) {
    editingPatientId =
        id ? String(id) : null;

    var patient =
        editingPatientId
            ? getPatientById(editingPatientId)
            : null;

    var modal =
        document.createElement("div");

    modal.id = "patientModal";
    modal.className = "modal-overlay";

    var html = "";

    html += '<div class="modal-box patient-modal">';

    html +=
        '<div class="modal-header">' +

            '<div>' +
                '<h2>' +
                    (
                        patient
                            ? "Ndrysho pacientin"
                            : "Pacient i ri"
                    ) +
                '</h2>' +

                '<p>Plotëso të dhënat e kartelës.</p>' +
            '</div>' +

            '<button id="closePatientModal" class="close-button">×</button>' +

        '</div>';

    html += '<div class="modal-body">';

    html +=
        '<div class="form-grid">' +

            '<div class="form-full">' +
                '<label>Emri dhe mbiemri *</label>' +
                '<input id="patientFullName" class="form-input" type="text" value="' +
                    escapeAttribute(
                        patient
                            ? patient.full_name || ""
                            : ""
                    ) +
                '">' +
            '</div>' +

            '<div>' +
                '<label>Datëlindja</label>' +
                '<input id="patientBirthDate" class="form-input" type="date" value="' +
                    escapeAttribute(
                        patient
                            ? patient.birth_date || ""
                            : ""
                    ) +
                '">' +
            '</div>' +

            '<div>' +
                '<label>Gjinia</label>' +
                '<select id="patientGender" class="form-input">' +

                    '<option value="">Zgjidh</option>' +

                    '<option value="Mashkull"' +
                        (
                            patient &&
                            patient.gender === "Mashkull"
                                ? " selected"
                                : ""
                        ) +
                    '>Mashkull</option>' +

                    '<option value="Femër"' +
                        (
                            patient &&
                            patient.gender === "Femër"
                                ? " selected"
                                : ""
                        ) +
                    '>Femër</option>' +

                '</select>' +
            '</div>' +

            '<div>' +
                '<label>Telefon</label>' +
                '<input id="patientPhone" class="form-input" type="text" value="' +
                    escapeAttribute(
                        patient
                            ? patient.phone || ""
                            : ""
                    ) +
                '">' +
            '</div>' +

            '<div>' +
                '<label>ID personale</label>' +
                '<input id="patientPersonalId" class="form-input" type="text" value="' +
                    escapeAttribute(
                        patient
                            ? patient.personal_id || ""
                            : ""
                    ) +
                '">' +
            '</div>' +

            '<div class="form-full">' +
                '<label>Adresa</label>' +
                '<input id="patientAddress" class="form-input" type="text" value="' +
                    escapeAttribute(
                        patient
                            ? patient.address || ""
                            : ""
                    ) +
                '">' +
            '</div>' +

        '</div>';

    html += '<div class="medical-section">';

    html +=
        '<div class="form-section-title">' +
            'Të dhëna mjekësore' +
        '</div>';

    html +=
        '<div class="form-grid">' +

            '<div class="form-full">' +
                '<label>Alergjitë</label>' +
                '<textarea id="patientAllergies" class="form-input textarea" rows="2">' +
                    escapeHtml(
                        patient
                            ? patient.allergies || ""
                            : ""
                    ) +
                '</textarea>' +
            '</div>' +

            '<div class="form-full">' +
                '<label>Medikamentet</label>' +
                '<textarea id="patientMedications" class="form-input textarea" rows="2">' +
                    escapeHtml(
                        patient
                            ? patient.medications || ""
                            : ""
                    ) +
                '</textarea>' +
            '</div>' +

            '<div class="form-full">' +
                '<label>Diagnozat</label>' +
                '<textarea id="patientDiagnoses" class="form-input textarea" rows="2">' +
                    escapeHtml(
                        patient
                            ? patient.diagnoses || ""
                            : ""
                    ) +
                '</textarea>' +
            '</div>' +

            '<div class="form-full">' +
                '<label>Historiku mjekësor</label>' +
                '<textarea id="patientMedicalHistory" class="form-input textarea" rows="3">' +
                    escapeHtml(
                        patient
                            ? patient.medical_history || ""
                            : ""
                    ) +
                '</textarea>' +
            '</div>' +

            '<div class="form-full">' +
                '<label>Shënime</label>' +
                '<textarea id="patientNotes" class="form-input textarea" rows="3">' +
                    escapeHtml(
                        patient
                            ? patient.notes || ""
                            : ""
                    ) +
                '</textarea>' +
            '</div>' +

        '</div>';

    html += '</div>';

    html += '</div>';

    html +=
        '<div class="modal-footer">' +

            '<button id="cancelPatientButton" class="secondary-button">' +
                'Anulo' +
            '</button>' +

            '<button id="savePatientButton" class="primary-button">' +
                (
                    patient
                        ? "Ruaj ndryshimet"
                        : "Krijo pacientin"
                ) +
            '</button>' +

        '</div>';

    html += '</div>';

    modal.innerHTML = html;

    document.body.appendChild(modal);

    document
        .getElementById("closePatientModal")
        .addEventListener(
            "click",
            closePatientEditor
        );

    document
        .getElementById("cancelPatientButton")
        .addEventListener(
            "click",
            closePatientEditor
        );

    document
        .getElementById("savePatientButton")
        .addEventListener(
            "click",
            savePatient
        );
}


/* =========================================================
   SAVE PATIENT
========================================================= */

async function savePatient() {
    var fullName =
        document.getElementById(
            "patientFullName"
        ).value.trim();

    if (!fullName) {
        alert(
            "Emri dhe mbiemri janë të detyrueshëm."
        );
        return;
    }

    var data = {
        full_name: fullName,

        birth_date:
            document.getElementById(
                "patientBirthDate"
            ).value || null,

        gender:
            document.getElementById(
                "patientGender"
            ).value || null,

        phone:
            document.getElementById(
                "patientPhone"
            ).value.trim(),

        personal_id:
            document.getElementById(
                "patientPersonalId"
            ).value.trim(),

        address:
            document.getElementById(
                "patientAddress"
            ).value.trim(),

        allergies:
            document.getElementById(
                "patientAllergies"
            ).value.trim(),

        medications:
            document.getElementById(
                "patientMedications"
            ).value.trim(),

        diagnoses:
            document.getElementById(
                "patientDiagnoses"
            ).value.trim(),

        medical_history:
            document.getElementById(
                "patientMedicalHistory"
            ).value.trim(),

        notes:
            document.getElementById(
                "patientNotes"
            ).value.trim(),

        updated_at:
            new Date().toISOString()
    };

    var button =
        document.getElementById(
            "savePatientButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent = "Po ruhet...";
    }

    var wasEditing =
        !!editingPatientId;

    try {
        var result;

        if (editingPatientId) {

            result =
                await supabaseClient
                    .from("patients")
                    .update(data)
                    .eq(
                        "id",
                        editingPatientId
                    );

        } else {

            result =
                await supabaseClient
                    .from("patients")
                    .insert([data]);

        }

        if (result.error) {
            console.error(
                "SAVE PATIENT ERROR:",
                result.error
            );

            alert(
                "Pacienti nuk u ruajt.\n\n" +
                result.error.message
            );

            if (button) {
                button.disabled = false;
                button.textContent =
                    wasEditing
                        ? "Ruaj ndryshimet"
                        : "Krijo pacientin";
            }

            return;
        }

        closePatientEditor();

        await loadPatients();

        showPatients();

        alert(
            wasEditing
                ? "Pacienti u përditësua."
                : "Pacienti u krijua me sukses."
        );

    } catch (error) {
        console.error(
            "SAVE PATIENT EXCEPTION:",
            error
        );

        alert(
            "Ndodhi një gabim gjatë ruajtjes."
        );

        if (button) {
            button.disabled = false;
        }
    }
}


function closePatientEditor() {
    var modal =
        document.getElementById(
            "patientModal"
        );

    if (modal) {
        modal.remove();
    }

    editingPatientId = null;
}


/* =========================================================
   VIEW PATIENT
========================================================= */

async function viewPatient(id) {
    var patient =
        getPatientById(id);

    if (!patient) {
        alert(
            "Pacienti nuk u gjet."
        );
        return;
    }

    var modal =
        document.createElement("div");

    modal.id = "patientViewModal";
    modal.className = "modal-overlay";

    modal.innerHTML =
        '<div class="modal-box patient-view-modal">' +

            '<div class="modal-header">' +

                '<div>' +
                    '<h2>Kartela e pacientit</h2>' +
                    '<p>' +
                        escapeHtml(
                            patient.full_name || ""
                        ) +
                    '</p>' +
                '</div>' +

                '<button id="closePatientView" class="close-button">×</button>' +

            '</div>' +

            '<div id="patientViewContent" class="modal-body">' +
                '<div class="loading-box">' +
                    'Po ngarkohet kartela...' +
                '</div>' +
            '</div>' +

        '</div>';

    document.body.appendChild(modal);

    document
        .getElementById("closePatientView")
        .addEventListener(
            "click",
            function () {
                modal.remove();
            }
        );

    try {
        var result =
            await supabaseClient
                .from("appointments")
                .select("*")
                .eq(
                    "patient_id",
                    patient.id
                )
                .order(
                    "appointment_date",
                    {
                        ascending: false
                    }
                )
                .order(
                    "appointment_time",
                    {
                        ascending: false
                    }
                );

        if (result.error) {
            console.error(
                "PATIENT HISTORY ERROR:",
                result.error
            );

            renderPatientView(
                patient,
                []
            );

            return;
        }

        renderPatientView(
            patient,
            result.data || []
        );

    } catch (error) {
        console.error(error);

        renderPatientView(
            patient,
            []
        );
    }
}


function renderPatientView(patient, history) {
    var container =
        document.getElementById(
            "patientViewContent"
        );

    if (!container) {
        return;
    }

    var html = "";

    html +=
        '<div class="patient-profile-header">' +

            '<div class="large-patient-avatar">' +
                getInitials(
                    patient.full_name
                ) +
            '</div>' +

            '<div>' +
                '<h2>' +
                    escapeHtml(
                        patient.full_name || ""
                    ) +
                '</h2>' +

                '<div class="patient-id-display">' +
                    'Patient ID: ' +
                    escapeHtml(
                        String(patient.id)
                    ) +
                '</div>' +

            '</div>' +

        '</div>';

    html += '<div class="profile-section">';

    html +=
        '<div class="profile-section-title">' +
            'Të dhënat personale' +
        '</div>';

    html +=
        '<div class="profile-grid">' +

            profileItem(
                "Datëlindja",
                patient.birth_date
                    ? formatBirthDate(
                        patient.birth_date
                    )
                    : "-"
            ) +

            profileItem(
                "Gjinia",
                patient.gender || "-"
            ) +

            profileItem(
                "Telefon",
                patient.phone || "-"
            ) +

            profileItem(
                "ID personale",
                patient.personal_id || "-"
            ) +

            profileItem(
                "Adresa",
                patient.address || "-"
            ) +

        '</div>';

    html += '</div>';

    html += '<div class="profile-section">';

    html +=
        '<div class="profile-section-title">' +
            'Të dhëna mjekësore' +
        '</div>';

    html +=
        '<div class="medical-profile-grid">' +

            medicalProfileItem(
                "Alergjitë",
                patient.allergies
            ) +

            medicalProfileItem(
                "Medikamentet",
                patient.medications
            ) +

            medicalProfileItem(
                "Diagnozat",
                patient.diagnoses
            ) +

            medicalProfileItem(
                "Historiku mjekësor",
                patient.medical_history
            ) +

            medicalProfileItem(
                "Shënime",
                patient.notes
            ) +

        '</div>';

    html += '</div>';

    html += '<div class="profile-section">';

    html +=
        '<div class="profile-section-title">' +
            'Historiku i vizitave (' +
            history.length +
            ')' +
        '</div>';

    if (!history.length) {

        html +=
            '<div class="history-empty">' +
                'Nuk ka ende vizita të lidhura me këtë pacient.' +
            '</div>';

    } else {

        html += '<div class="history-list">';

        history.forEach(function (item) {

            html +=
                '<div class="history-row">' +

                    '<div class="history-date">' +
                        formatDateAlbanian(
                            parseDate(
                                item.appointment_date
                            )
                        ) +
                    '</div>' +

                    '<div class="history-time">' +
                        escapeHtml(
                            item.appointment_time || ""
                        ) +
                    '</div>' +

                    '<div class="history-status">' +
                        getStatusLabel(
                            item.status
                        ) +
                    '</div>' +

                    '<div class="history-note">' +
                        escapeHtml(
                            item.note || ""
                        ) +
                    '</div>' +

                '</div>';
        });

        html += '</div>';
    }

    html += '</div>';

    html +=
        '<div class="profile-actions">' +

            '<button id="editPatientFromCard" class="primary-button">' +
                'Ndrysho kartelën' +
            '</button>' +

            '<button id="closePatientCardButton" class="secondary-button">' +
                'Mbyll' +
            '</button>' +

        '</div>';

    container.innerHTML = html;

    document
        .getElementById("editPatientFromCard")
        .addEventListener(
            "click",
            function () {

                var modal =
                    document.getElementById(
                        "patientViewModal"
                    );

                if (modal) {
                    modal.remove();
                }

                openPatientEditor(
                    patient.id
                );
            }
        );

    document
        .getElementById("closePatientCardButton")
        .addEventListener(
            "click",
            function () {

                var modal =
                    document.getElementById(
                        "patientViewModal"
                    );

                if (modal) {
                    modal.remove();
                }
            }
        );
}


function profileItem(label, value) {
    return (
        '<div class="profile-item">' +
            '<span>' +
                escapeHtml(label) +
            '</span>' +
            '<strong>' +
                escapeHtml(
                    String(value || "-")
                ) +
            '</strong>' +
        '</div>'
    );
}


function medicalProfileItem(label, value) {
    return (
        '<div class="medical-profile-item">' +
            '<div class="medical-profile-label">' +
                escapeHtml(label) +
            '</div>' +
            '<div class="medical-profile-value">' +
                escapeHtml(
                    value || "-"
                ).replace(/\n/g, "<br>") +
            '</div>' +
        '</div>'
    );
}


/* =========================================================
   DELETE PATIENT
========================================================= */

async function deletePatient(id) {
    var patient =
        getPatientById(id);

    if (!patient) {
        return;
    }

    var linkedAppointments =
        appointments.filter(
            function (appointment) {
                return String(
                    appointment.patient_id
                ) === String(id);
            }
        );

    if (linkedAppointments.length > 0) {
        alert(
            "Ky pacient ka " +
            linkedAppointments.length +
            " vizita të lidhura.\n\n" +
            "Për siguri, pacienti nuk mund të fshihet pa hequr/lidhur më parë vizitat."
        );

        return;
    }

    var confirmed =
        window.confirm(
            "A dëshiron të fshish pacientin " +
            patient.full_name +
            "?"
        );

    if (!confirmed) {
        return;
    }

    try {
        var result =
            await supabaseClient
                .from("patients")
                .delete()
                .eq("id", id);

        if (result.error) {
            console.error(
                "DELETE PATIENT ERROR:",
                result.error
            );

            alert(
                "Pacienti nuk u fshi.\n\n" +
                result.error.message
            );

            return;
        }

        await loadPatients();

        showPatients();

    } catch (error) {
        console.error(error);

        alert(
            "Ndodhi një gabim gjatë fshirjes."
        );
    }
}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {
    stopRealtime();

    try {

        appointmentsChannel =
            supabaseClient
                .channel(
                    "gvm-appointments-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "appointments"
                    },
                    async function (payload) {

                        console.log(
                            "Appointments realtime:",
                            payload.eventType
                        );

                        await loadAppointments();

                        var activeNav =
                            document.querySelector(
                                ".nav-button.active"
                            );

                        if (
                            activeNav &&
                            activeNav.id ===
                            "navAppointments"
                        ) {
                            showAppointments();
                        }
                    }
                )
                .subscribe(function (status) {

                    console.log(
                        "Appointments realtime:",
                        status
                    );
                });


        patientsChannel =
            supabaseClient
                .channel(
                    "gvm-patients-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "patients"
                    },
                    async function (payload) {

                        console.log(
                            "Patients realtime:",
                            payload.eventType
                        );

                        await loadPatients();

                        var activeNav =
                            document.querySelector(
                                ".nav-button.active"
                            );

                        if (
                            activeNav &&
                            activeNav.id ===
                            "navPatients"
                        ) {
                            showPatients();
                        }
                    }
                )
                .subscribe(function (status) {

                    console.log(
                        "Patients realtime:",
                        status
                    );
                });

    } catch (error) {
        console.error(
            "REALTIME ERROR:",
            error
        );
    }
}


function stopRealtime() {
    try {

        if (appointmentsChannel) {
            supabaseClient.removeChannel(
                appointmentsChannel
            );

            appointmentsChannel = null;
        }

        if (patientsChannel) {
            supabaseClient.removeChannel(
                patientsChannel
            );

            patientsChannel = null;
        }

    } catch (error) {
        console.error(
            "STOP REALTIME ERROR:",
            error
        );
    }
}


/* =========================================================
   HELPERS
========================================================= */

function getPatientById(id) {
    if (id === null || id === undefined || id === "") {
        return null;
    }

    return patients.find(
        function (patient) {
            return String(patient.id) === String(id);
        }
    ) || null;
}


function getDateString(date) {
    var year =
        date.getFullYear();

    var month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    var day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function parseDate(dateString) {
    if (!dateString) {
        return new Date();
    }

    var parts =
        String(dateString).split("-");

    if (parts.length !== 3) {
        return new Date(dateString);
    }

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}


function formatDateAlbanian(date) {
    var days = [
        "E diel",
        "E hënë",
        "E martë",
        "E mërkurë",
        "E enjte",
        "E premte",
        "E shtunë"
    ];

    var months = [
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


function formatBirthDate(dateString) {
    if (!dateString) {
        return "";
    }

    var parts =
        String(dateString).split("-");

    if (parts.length !== 3) {
        return String(dateString);
    }

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
}


function getStatusLabel(status) {
    if (status === "confirmed") {
        return "Konfirmuar";
    }

    if (status === "completed") {
        return "Përfunduar";
    }

    if (status === "cancelled") {
        return "Anuluar";
    }

    return "Në pritje";
}


function getInitials(name) {
    var text =
        String(name || "")
            .trim();

    if (!text) {
        return "P";
    }

    var words =
        text.split(/\s+/);

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}


function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}


function showFatalError(message) {
    var app =
        document.getElementById("app");

    if (!app) {
        return;
    }

    app.innerHTML =
        '<div class="fatal-error">' +
            '<h1>AMBULATORI GVM</h1>' +
            '<p>' +
                escapeHtml(message) +
            '</p>' +
        '</div>';
}


/* =========================================================
   CSS
========================================================= */

function injectStyles() {
    if (
        document.getElementById(
            "gvmInjectedStyles"
        )
    ) {
        return;
    }

    var style =
        document.createElement("style");

    style.id =
        "gvmInjectedStyles";

    style.textContent =

        "*{box-sizing:border-box}" +

        "body{" +
            "margin:0;" +
            "font-family:Arial,Helvetica,sans-serif;" +
            "background:#f4f7fb;" +
            "color:#1f2937;" +
        "}" +

        "button,input,select,textarea{" +
            "font:inherit" +
        "}" +

        ".app-shell{min-height:100vh}" +

        ".top-header{" +
            "height:72px;" +
            "background:#ffffff;" +
            "border-bottom:1px solid #e5e7eb;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:space-between;" +
            "padding:0 28px;" +
        "}" +

        ".brand-area{" +
            "display:flex;" +
            "align-items:center;" +
            "gap:12px" +
        "}" +

        ".brand-logo{" +
            "width:44px;" +
            "height:44px;" +
            "border-radius:12px;" +
            "background:#0f766e;" +
            "color:white;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "font-weight:800;" +
            "font-size:15px" +
        "}" +

        ".brand-title{" +
            "font-size:18px;" +
            "font-weight:800;" +
            "color:#111827" +
        "}" +

        ".brand-version{" +
            "font-size:10px;" +
            "color:#9ca3af;" +
            "margin-top:2px" +
        "}" +

        ".user-area{" +
            "display:flex;" +
            "align-items:center;" +
            "gap:14px;" +
            "font-size:13px;" +
            "color:#6b7280" +
        "}" +

        ".logout-button{" +
            "border:1px solid #e5e7eb;" +
            "background:white;" +
            "border-radius:8px;" +
            "padding:8px 14px;" +
            "cursor:pointer" +
        "}" +

        ".main-nav{" +
            "background:white;" +
            "border-bottom:1px solid #e5e7eb;" +
            "padding:0 28px;" +
            "display:flex;" +
            "gap:6px" +
        "}" +

        ".nav-button{" +
            "border:0;" +
            "background:transparent;" +
            "padding:15px 20px;" +
            "cursor:pointer;" +
            "color:#6b7280;" +
            "font-weight:600;" +
            "border-bottom:3px solid transparent" +
        "}" +

        ".nav-button.active{" +
            "color:#0f766e;" +
            "border-bottom-color:#0f766e" +
        "}" +

        ".main-content{" +
            "max-width:1400px;" +
            "margin:0 auto;" +
            "padding:28px" +
        "}" +

        ".page-header{" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:space-between;" +
            "margin-bottom:24px" +
        "}" +

        ".page-header h1{" +
            "margin:0;" +
            "font-size:28px;" +
            "color:#111827" +
        "}" +

        ".page-header p{" +
            "margin:6px 0 0;" +
            "color:#6b7280" +
        "}" +

        ".primary-button{" +
            "border:0;" +
            "background:#0f766e;" +
            "color:white;" +
            "padding:11px 18px;" +
            "border-radius:9px;" +
            "font-weight:700;" +
            "cursor:pointer" +
        "}" +

        ".primary-button:hover{" +
            "background:#0b625b" +
        "}" +

        ".secondary-button{" +
            "border:1px solid #d1d5db;" +
            "background:white;" +
            "color:#374151;" +
            "padding:10px 16px;" +
            "border-radius:9px;" +
            "font-weight:600;" +
            "cursor:pointer" +
        "}" +

        ".date-toolbar{" +
            "display:flex;" +
            "align-items:center;" +
            "gap:8px;" +
            "margin-bottom:20px" +
        "}" +

        ".date-button{" +
            "width:40px;" +
            "height:40px;" +
            "border:1px solid #d1d5db;" +
            "background:white;" +
            "border-radius:8px;" +
            "cursor:pointer;" +
            "font-size:22px" +
        "}" +

        ".current-date{" +
            "min-width:280px;" +
            "text-align:center;" +
            "font-weight:700;" +
            "font-size:17px" +
        "}" +

        ".stats-grid{" +
            "display:grid;" +
            "grid-template-columns:repeat(4,1fr);" +
            "gap:16px;" +
            "margin-bottom:22px" +
        "}" +

        ".stat-card{" +
            "background:white;" +
            "border:1px solid #e5e7eb;" +
            "border-radius:12px;" +
            "padding:20px;" +
            "box-shadow:0 2px 8px rgba(0,0,0,.03)" +
        "}" +

        ".stat-label{" +
            "font-size:13px;" +
            "color:#6b7280" +
        "}" +

        ".stat-value{" +
            "font-size:30px;" +
            "font-weight:800;" +
            "margin-top:6px;" +
            "color:#111827" +
        "}" +

        ".appointments-card{" +
            "background:white;" +
            "border:1px solid #e5e7eb;" +
            "border-radius:12px;" +
            "overflow:hidden" +
        "}" +

        ".section-title{" +
            "font-weight:800;" +
            "font-size:17px;" +
            "padding:18px 20px;" +
            "border-bottom:1px solid #e5e7eb" +
        "}" +

        ".appointment-row{" +
            "display:grid;" +
            "grid-template-columns:80px 1fr auto auto;" +
            "gap:18px;" +
            "align-items:center;" +
            "padding:18px 20px;" +
            "border-bottom:1px solid #f0f2f5" +
        "}" +

        ".appointment-row:last-child{" +
            "border-bottom:0" +
        "}" +

        ".appointment-time{" +
            "font-size:17px;" +
            "font-weight:800;" +
            "color:#0f766e" +
        "}" +

        ".appointment-name{" +
            "font-weight:800;" +
            "font-size:15px" +
        "}" +

        ".appointment-info{" +
            "font-size:12px;" +
            "color:#6b7280;" +
            "margin-top:4px" +
        "}" +

        ".appointment-status{" +
            "padding:6px 10px;" +
            "border-radius:20px;" +
            "font-size:11px;" +
            "font-weight:700;" +
            "white-space:nowrap" +
        "}" +

        ".status-pending{" +
            "background:#fff7ed;" +
            "color:#c2410c" +
        "}" +

        ".status-confirmed{" +
            "background:#ecfdf5;" +
            "color:#047857" +
        "}" +

        ".status-completed{" +
            "background:#eff6ff;" +
            "color:#1d4ed8" +
        "}" +

        ".status-cancelled{" +
            "background:#fef2f2;" +
            "color:#b91c1c" +
        "}" +

        ".appointment-actions{" +
            "display:flex;" +
            "gap:6px" +
        "}" +

        ".small-button{" +
            "border:1px solid #d1d5db;" +
            "background:white;" +
            "padding:7px 10px;" +
            "border-radius:7px;" +
            "font-size:12px;" +
            "cursor:pointer" +
        "}" +

        ".small-button.danger{" +
            "color:#b91c1c;" +
            "border-color:#fecaca" +
        "}" +

        ".primary-small{" +
            "background:#0f766e;" +
            "color:white;" +
            "border-color:#0f766e" +
        "}" +

        ".empty-state{" +
            "text-align:center;" +
            "padding:60px 20px;" +
            "color:#6b7280" +
        "}" +

        ".empty-state.full-width{" +
            "grid-column:1/-1" +
        "}" +

        ".empty-icon{" +
            "font-size:38px;" +
            "margin-bottom:10px" +
        "}" +

        ".empty-state h3{" +
            "color:#374151;" +
            "margin:5px 0" +
        "}" +

        ".modal-overlay{" +
            "position:fixed;" +
            "z-index:1000;" +
            "inset:0;" +
            "background:rgba(15,23,42,.55);" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "padding:20px;" +
            "overflow:auto" +
        "}" +

        ".modal-box{" +
            "background:white;" +
            "width:min(700px,100%);" +
            "max-height:92vh;" +
            "overflow:auto;" +
            "border-radius:14px;" +
            "box-shadow:0 20px 60px rgba(0,0,0,.25)" +
        "}" +

        ".large-modal{" +
            "width:min(760px,100%)" +
        "}" +

        ".patient-modal{" +
            "width:min(850px,100%)" +
        "}" +

        ".patient-view-modal{" +
            "width:min(950px,100%)" +
        "}" +

        ".modal-header{" +
            "display:flex;" +
            "justify-content:space-between;" +
            "align-items:flex-start;" +
            "padding:22px 24px;" +
            "border-bottom:1px solid #e5e7eb" +
        "}" +

        ".modal-header h2{" +
            "margin:0;" +
            "font-size:21px" +
        "}" +

        ".modal-header p{" +
            "margin:5px 0 0;" +
            "color:#6b7280;" +
            "font-size:13px" +
        "}" +

        ".close-button{" +
            "border:0;" +
            "background:#f3f4f6;" +
            "width:34px;" +
            "height:34px;" +
            "border-radius:8px;" +
            "font-size:24px;" +
            "cursor:pointer" +
        "}" +

        ".modal-body{" +
            "padding:24px" +
        "}" +

        ".modal-footer{" +
            "display:flex;" +
            "justify-content:flex-end;" +
            "gap:10px;" +
            "padding:18px 24px;" +
            "border-top:1px solid #e5e7eb" +
        "}" +

        "label{" +
            "display:block;" +
            "font-size:13px;" +
            "font-weight:700;" +
            "margin:0 0 6px;" +
            "color:#374151" +
        "}" +

        ".form-input{" +
            "width:100%;" +
            "border:1px solid #d1d5db;" +
            "border-radius:8px;" +
            "padding:10px 12px;" +
            "background:white;" +
            "outline:none" +
        "}" +

        ".form-input:focus{" +
            "border-color:#0f766e;" +
            "box-shadow:0 0 0 3px rgba(15,118,110,.1)" +
        "}" +

        ".form-grid{" +
            "display:grid;" +
            "grid-template-columns:1fr 1fr;" +
            "gap:16px;" +
            "margin-bottom:18px" +
        "}" +

        ".form-full{" +
            "grid-column:1/-1" +
        "}" +

        ".form-section{" +
            "margin-bottom:20px" +
        "}" +

        ".form-section-title{" +
            "font-size:15px;" +
            "font-weight:800;" +
            "margin-bottom:12px;" +
            "color:#111827" +
        "}" +

        ".medical-section{" +
            "border-top:1px solid #e5e7eb;" +
            "padding-top:20px;" +
            "margin-top:20px" +
        "}" +

        ".textarea{" +
            "resize:vertical;" +
            "line-height:1.5" +
        "}" +

        ".patient-search-wrapper{" +
            "position:relative" +
        "}" +

        ".patient-search-results{" +
            "position:absolute;" +
            "z-index:20;" +
            "left:0;" +
            "right:0;" +
            "top:100%;" +
            "background:white;" +
            "border:1px solid #d1d5db;" +
            "border-top:0;" +
            "border-radius:0 0 8px 8px;" +
            "box-shadow:0 10px 25px rgba(0,0,0,.12);" +
            "max-height:300px;" +
            "overflow:auto" +
        "}" +

        ".patient-search-item{" +
            "width:100%;" +
            "border:0;" +
            "border-bottom:1px solid #f0f2f5;" +
            "background:white;" +
            "padding:12px;" +
            "text-align:left;" +
            "cursor:pointer" +
        "}" +

        ".patient-search-item:hover{" +
            "background:#f0fdfa" +
        "}" +

        ".search-patient-name{" +
            "font-weight:800;" +
            "color:#111827" +
        "}" +

        ".search-patient-info{" +
            "font-size:12px;" +
            "color:#6b7280;" +
            "margin-top:3px" +
        "}" +

        ".search-empty{" +
            "padding:14px;" +
            "font-size:13px;" +
            "color:#6b7280" +
        "}" +

        ".patient-not-selected{" +
            "margin-top:12px;" +
            "border:1px dashed #d1d5db;" +
            "border-radius:10px;" +
            "padding:14px;" +
            "display:flex;" +
            "gap:12px;" +
            "align-items:center;" +
            "color:#6b7280" +
        "}" +

        ".patient-not-selected-icon{" +
            "font-size:25px" +
        "}" +

        ".patient-not-selected p{" +
            "margin:3px 0 0;" +
            "font-size:12px" +
        "}" +

        ".selected-patient-card{" +
            "margin-top:12px;" +
            "border:1px solid #99f6e4;" +
            "background:#f0fdfa;" +
            "border-radius:10px;" +
            "padding:14px;" +
            "display:flex;" +
            "gap:14px" +
        "}" +

        ".selected-patient-avatar,.patient-avatar,.large-patient-avatar{" +
            "flex-shrink:0;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "font-weight:800;" +
            "background:#ccfbf1;" +
            "color:#0f766e;" +
            "border-radius:50%" +
        "}" +

        ".selected-patient-avatar{" +
            "width:48px;" +
            "height:48px" +
        "}" +

        ".selected-patient-details{" +
            "flex:1" +
        "}" +

        ".selected-patient-name{" +
            "font-weight:800;" +
            "font-size:16px" +
        "}" +

        ".selected-patient-grid{" +
            "display:grid;" +
            "grid-template-columns:repeat(4,1fr);" +
            "gap:10px;" +
            "margin-top:10px" +
        "}" +

        ".selected-patient-grid span,.patient-card-data span,.profile-item span{" +
            "display:block;" +
            "font-size:10px;" +
            "color:#6b7280;" +
            "margin-bottom:2px" +
        "}" +

        ".selected-patient-grid strong{" +
            "font-size:12px" +
        "}" +

        ".patient-toolbar{" +
            "margin-bottom:18px;" +
            "max-width:600px" +
        "}" +

        ".patients-grid{" +
            "display:grid;" +
            "grid-template-columns:repeat(3,1fr);" +
            "gap:16px" +
        "}" +

        ".patient-card{" +
            "background:white;" +
            "border:1px solid #e5e7eb;" +
            "border-radius:12px;" +
            "padding:18px;" +
            "box-shadow:0 2px 8px rgba(0,0,0,.03)" +
        "}" +

        ".patient-card-top{" +
            "display:flex;" +
            "align-items:center;" +
            "gap:12px;" +
            "margin-bottom:16px" +
        "}" +

        ".patient-avatar{" +
            "width:44px;" +
            "height:44px" +
        "}" +

        ".patient-card-name{" +
            "font-weight:800;" +
            "font-size:16px" +
        "}" +

        ".patient-card-data{" +
            "display:grid;" +
            "grid-template-columns:1fr;" +
            "gap:9px;" +
            "padding:12px 0;" +
            "border-top:1px solid #f0f2f5;" +
            "border-bottom:1px solid #f0f2f5" +
        "}" +

        ".patient-card-data strong{" +
            "font-size:13px" +
        "}" +

        ".patient-card-actions{" +
            "display:flex;" +
            "gap:6px;" +
            "flex-wrap:wrap;" +
            "margin-top:14px" +
        "}" +

        ".patient-profile-header{" +
            "display:flex;" +
            "align-items:center;" +
            "gap:15px;" +
            "margin-bottom:24px" +
        "}" +

        ".large-patient-avatar{" +
            "width:70px;" +
            "height:70px;" +
            "font-size:20px" +
        "}" +

        ".patient-profile-header h2{" +
            "margin:0;" +
            "font-size:23px" +
        "}" +

        ".patient-id-display{" +
            "font-size:11px;" +
            "color:#9ca3af;" +
            "margin-top:4px;" +
            "word-break:break-all" +
        "}" +

        ".profile-section{" +
            "margin-top:22px;" +
            "border-top:1px solid #e5e7eb;" +
            "padding-top:20px" +
        "}" +

        ".profile-section-title{" +
            "font-size:15px;" +
            "font-weight:800;" +
            "margin-bottom:13px" +
        "}" +

        ".profile-grid{" +
            "display:grid;" +
            "grid-template-columns:repeat(3,1fr);" +
            "gap:12px" +
        "}" +

        ".profile-item{" +
            "border:1px solid #e5e7eb;" +
            "border-radius:9px;" +
            "padding:12px" +
        "}" +

        ".profile-item strong{" +
            "font-size:13px;" +
            "word-break:break-word" +
        "}" +

        ".medical-profile-grid{" +
            "display:grid;" +
            "grid-template-columns:1fr 1fr;" +
            "gap:12px" +
        "}" +

        ".medical-profile-item{" +
            "border:1px solid #e5e7eb;" +
            "border-radius:9px;" +
            "padding:13px" +
        "}" +

        ".medical-profile-label{" +
            "font-weight:800;" +
            "font-size:12px;" +
            "margin-bottom:6px" +
        "}" +

        ".medical-profile-value{" +
            "font-size:13px;" +
            "line-height:1.5;" +
            "color:#4b5563;" +
            "white-space:normal" +
        "}" +

        ".history-list{" +
            "border:1px solid #e5e7eb;" +
            "border-radius:9px;" +
            "overflow:hidden" +
        "}" +

        ".history-row{" +
            "display:grid;" +
            "grid-template-columns:150px 70px 110px 1fr;" +
            "gap:10px;" +
            "padding:12px;" +
            "border-bottom:1px solid #f0f2f5;" +
            "font-size:12px;" +
            "align-items:center" +
        "}" +

        ".history-row:last-child{" +
            "border-bottom:0" +
        "}" +

        ".history-date{" +
            "font-weight:700" +
        "}" +

        ".history-time{" +
            "font-weight:700;" +
            "color:#0f766e" +
        "}" +

        ".history-status{" +
            "font-weight:700" +
            "font-size:11px" +
        "}" +

        ".history-note{" +
            "color:#6b7280" +
        "}" +

        ".history-empty{" +
            "border:1px dashed #d1d5db;" +
            "border-radius:9px;" +
            "padding:18px;" +
            "color:#6b7280;" +
            "font-size:13px" +
        "}" +

        ".profile-actions{" +
            "display:flex;" +
            "justify-content:flex-end;" +
            "gap:10px;" +
            "margin-top:25px" +
        "}" +

        ".login-page{" +
            "min-height:100vh;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "background:#f4f7fb;" +
            "padding:20px" +
        "}" +

        ".login-box{" +
            "width:min(420px,100%);" +
            "background:white;" +
            "border:1px solid #e5e7eb;" +
            "border-radius:16px;" +
            "padding:35px;" +
            "box-shadow:0 15px 45px rgba(0,0,0,.08)" +
        "}" +

        ".login-logo{" +
            "width:60px;" +
            "height:60px;" +
            "border-radius:15px;" +
            "background:#0f766e;" +
            "color:white;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "font-weight:800;" +
            "font-size:20px;" +
            "margin-bottom:16px" +
        "}" +

        ".login-box h1{" +
            "margin:0;" +
            "font-size:24px" +
        "}" +

        ".login-subtitle{" +
            "color:#6b7280;" +
            "font-size:13px;" +
            "margin:6px 0 25px" +
        "}" +

        ".login-box label{" +
            "margin-top:14px" +
        "}" +

        ".login-box input{" +
            "width:100%;" +
            "padding:11px;" +
            "border:1px solid #d1d5db;" +
            "border-radius:8px;" +
            "outline:none" +
        "}" +

        ".full-button{" +
            "width:100%;" +
            "margin-top:22px" +
        "}" +

        ".login-message{" +
            "font-size:13px;" +
            "margin-top:12px;" +
            "color:#6b7280" +
        "}" +

        ".login-message.error{" +
            "color:#b91c1c" +
        "}" +

        ".loading-box{" +
            "padding:50px;" +
            "text-align:center;" +
            "color:#6b7280" +
        "}" +

        ".fatal-error{" +
            "max-width:700px;" +
            "margin:80px auto;" +
            "background:white;" +
            "padding:30px;" +
            "border-radius:12px;" +
            "border:1px solid #fecaca;" +
            "color:#991b1b" +
        "}" +

        "@media(max-width:900px){" +

            ".stats-grid{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

            ".patients-grid{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

            ".selected-patient-grid{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

            ".profile-grid{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

        "}" +

        "@media(max-width:650px){" +

            ".top-header{" +
                "padding:0 14px;" +
                "height:auto;" +
                "min-height:65px" +
            "}" +

            ".user-area span{" +
                "display:none" +
            "}" +

            ".main-nav{" +
                "padding:0 10px" +
            "}" +

            ".main-content{" +
                "padding:16px" +
            "}" +

            ".page-header{" +
                "align-items:flex-start;" +
                "gap:15px;" +
                "flex-direction:column" +
            "}" +

            ".stats-grid{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

            ".appointment-row{" +
                "grid-template-columns:60px 1fr;" +
                "gap:10px" +
            "}" +

            ".appointment-status," +
            ".appointment-actions{" +
                "grid-column:2" +
            "}" +

            ".patients-grid{" +
                "grid-template-columns:1fr" +
            "}" +

            ".form-grid{" +
                "grid-template-columns:1fr" +
            "}" +

            ".form-full{" +
                "grid-column:auto" +
            "}" +

            ".profile-grid," +
            ".medical-profile-grid{" +
                "grid-template-columns:1fr" +
            "}" +

            ".history-row{" +
                "grid-template-columns:1fr 1fr" +
            "}" +

        "}";

    document.head.appendChild(style);
}
