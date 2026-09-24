const APP_VERSION = "GVM-20260924-17";

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

/* =========================================================
START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

```
console.log("=================================");
console.log("AMBULATORI GVM");
console.log("VERSION:", APP_VERSION);
console.log("=================================");

startAmbulatoriGVM();
```

});

async function startAmbulatoriGVM() {

```
try {

    if (!window.supabase) {

        showFatalError(
            "Supabase nuk u ngarkua. Kontrollo që Supabase CDN është para app.js."
        );

        return;
    }

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    console.log("Supabase initialized.");

    await checkSession();

} catch (error) {

    console.error(
        "START ERROR:",
        error
    );

    showFatalError(
        error.message ||
        "Gabim gjatë nisjes së sistemit."
    );
}
```

}

/* =========================================================
FATAL ERROR
========================================================= */

function showFatalError(message) {

```
let app =
    document.getElementById("app");

if (!app) {

    app =
        document.createElement("div");

    app.id = "app";

    document.body.appendChild(app);
}

app.innerHTML = `
    <div class="fatal-error"
         style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:25px;
            box-sizing:border-box;
            background:#f4f8fa;
            font-family:Arial,sans-serif;
         ">

        <div class="fatal-box"
             style="
                max-width:600px;
                width:100%;
                background:#fff;
                border-radius:18px;
                padding:35px;
                box-shadow:0 15px 45px rgba(0,0,0,.10);
                border:1px solid #e0eaed;
                text-align:center;
             ">

            <div style="font-size:55px;margin-bottom:15px;">
                🏥
            </div>

            <h2 style="
                margin:0 0 15px;
                color:#263c43;
            ">
                AMBULATORI GVM
            </h2>

            <p style="
                color:#b42318;
                font-weight:700;
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
```

}

/* =========================================================
SESSION
========================================================= */

async function checkSession() {

```
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

        showApp();

    } else {

        console.log("No active session.");

        showLogin();
    }


    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );

            currentUser =
                session
                    ? session.user
                    : null;

            if (currentUser) {

                console.log(
                    "Authenticated:",
                    currentUser.email
                );

                showApp();

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
```

}

/* =========================================================
LOGIN
========================================================= */

function showLogin() {

```
cleanupRealtime();

const app =
    document.getElementById("app");

if (!app) {

    showFatalError(
        "Elementi #app nuk ekziston në index.html."
    );

    return;
}

app.innerHTML = `
    <div class="login-page">

        <div class="login-box">

            <div class="login-logo">
                <span>GVM</span>
            </div>

            <div style="
                font-size:44px;
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
```

}

/* =========================================================
LOGIN ACTION
========================================================= */

async function login() {

```
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


if (!emailElement || !passwordElement) {

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

        errorElement.textContent =
            "";
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

            errorElement.style.display =
                "block";

            errorElement.textContent =
                result.error.message ||
                "Email ose fjalëkalim i gabuar.";
        }

        return;
    }


    currentUser =
        result.data.user ||
        null;


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
```

}

/* =========================================================
LOGOUT
========================================================= */

async function logout() {

```
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
```

}

/* =========================================================
CLEAN REALTIME
========================================================= */

function cleanupRealtime() {

```
if (
    realtimeChannel &&
    supabaseClient
) {

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
```

}

/* =========================================================
MAIN APP
========================================================= */

function showApp() {

```
const app =
    document.getElementById("app");

if (!app) {

    showFatalError(
        "Elementi #app mungon nga index.html."
    );

    return;
}


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
                        Menaxhimi i pacientëve dhe vizitave
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


        <nav class="main-navigation">

            <button
                id="navAppointments"
                class="nav-button active"
                type="button"
            >
                📅 Vizitat
            </button>

            <button
                id="navPatients"
                class="nav-button"
                type="button"
            >
                👤 Pacientët
            </button>

        </nav>


        <!-- =================================================
             APPOINTMENTS
        ================================================== -->

        <section id="appointmentsView">

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
```
