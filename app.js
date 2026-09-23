```javascript
"use strict";

/* =========================================================
   AMBULATORI GVM
   VERSION: GVM-20260923-02
   ========================================================= */

const APP_VERSION = "GVM-20260923-02";

console.log("========================================");
console.log("AMBULATORI GVM");
console.log("APP VERSION:", APP_VERSION);
console.log("APP.JS U NGARKUA");
console.log("========================================");


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";


let supabaseClient = null;


try {

  if (
    typeof window.supabase === "undefined"
  ) {

    throw new Error(
      "Supabase library nuk u ngarkua."
    );

  }

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  console.log("SUPABASE U KRIJUA");

} catch (error) {

  console.error(
    "SUPABASE ERROR:",
    error
  );

}


/* =========================================================
   SETTINGS
   ========================================================= */

const START_HOUR = 8;
const END_HOUR = 18;

const SLOT_MINUTES = 15;


/* =========================================================
   STATE
   ========================================================= */

let selectedDate = new Date();

let realtimeChannel = null;

let applicationStarted = false;

let applicationStarting = false;

let loginInProgress = false;

let currentAppointments = [];


/* =========================================================
   HELPERS
   ========================================================= */

function pad(number) {

  return String(number).padStart(2, "0");

}


function formatDate(date) {

  const year =
    date.getFullYear();

  const month =
    pad(date.getMonth() + 1);

  const day =
    pad(date.getDate());

  return `${year}-${month}-${day}`;

}


function normalizeTime(time) {

  if (!time) {
    return "";
  }

  return String(time)
    .trim()
    .substring(0, 5);

}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function formatDateForDisplay(date) {

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

    default:
      return "";

  }

}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function showLogin() {

  const app =
    document.getElementById("app");

  if (!app) {
    return;
  }

  app.innerHTML = `

    <div class="login-page">

      <div class="login-card">

        <div class="login-icon">
          ✚
        </div>

        <h1>
          AMBULATORI GVM
        </h1>

        <div class="login-subtitle">
          Sistemi i recepsionit
        </div>

        <div class="form-group">

          <labe
```
