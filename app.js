```javascript
console.log("APP JS LOADED - AMBULATORI GVM");

const APP_VERSION = "GVM-20260925-02";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";


/* ================================
   SUPABASE
================================ */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("Supabase OK");
console.log("APP VERSION:", APP_VERSION);


/* ================================
   DATA AKTUALE
================================ */

let currentDate = new Date();


/* ================================
   DATA -> YYYY-MM-DD
================================ */

function dateKey(date) {

    const y =
        date.getFullYear();

    const m =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


/* ================================
   SHFAQ DATËN
================================ */

function updateDate() {

    const el =
        document.getElementById(
            "currentDate"
        );

    if (!el) {
        return;
    }

    el.textContent =
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


/* ================================
   ORARET
   12:00 - 17:00
   çdo 15 minuta
================================ */

function generateTimes() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {

        console.error(
            "Nuk u gjet appointmentTime"
        );

        return;
    }

    select.innerHTML = "";

    const first =
        document.createElement(
            "option"
        );

    first.value = "";
    first.textContent =
        "Zgjidh orën";

    select.appendChild(first);


    for (
        let minutes = 720;
        minutes <= 1020;
        minutes += 15
    ) {

        const hours =
            String(
                Math.floor(
                    minutes / 60
                )
            ).padStart(2, "0");

        const mins =
            String(
                minutes % 60
            ).padStart(2, "0");

        const time =
            `${hours}:${mins}`;

        const option =
            document.createElement(
                "option"
            );

        option.value = time;
        option.textContent = time;

        select.appendChild(option);
    }

    console.log(
        "Oraret u krijuan: 12:00 - 17:00"
    );
}


/* ================================
   LLOJI I VIZITËS
================================ */

function setupVisitType() {

    const visitTypeRadios =
        document.querySelectorAll(
            'input[name="visitType"]'
        );

    const paymentOptions =
        document.getElementById(
            "paymentOptions"
        );

    const paidCheck =
        document.getElementById(
            "paidCheck"
        );

    const unpaidCheck =
        document.getElementById(
            "unpaidCheck"
        );


    if (
        !visitTypeRadios.length ||
        !paymentOptions
    ) {

        console.error(
            "Nuk u gjetën elementet e llojit të vizitës."
        );

        return;
    }


    function updatePaymentVisibility() {

        const selected =
            document.querySelector(
                'input[name="visitType"]:checked'
            );


        if (
            selected &&
            selected.value === "Rikontroll"
        ) {

            paymentOptions.style.display =
                "block";

            console.log(
                "Rikontroll u zgjodh - shfaqen opsionet e pagesës."
            );

        } else {

            paymentOptions.style.display =
                "none";


            if (paidCheck) {
                paidCheck.checked = false;
            }

            if (unpaidCheck) {
                unpaidCheck.checked = false;
            }

            console.log(
                "Vizitë u zgjodh - opsionet e pagesës u fshehën."
            );
        }
    }


    visitTypeRadios.forEach(
        radio => {

            radio.addEventListener(
                "change",
                updatePaymentVisibility
            );
        }
    );


    /* ================================
       MOS LEJO DY ZGJEDHJE PAGESASH
    ================================= */

    if (paidCheck && unpaidCheck) {

        paidCheck.addEventListener(
            "change",
            function() {

                if (paidCheck.checked) {
                    unpaidCheck.checked = false;
                }
            }
        );


        unpaidCheck.addEventListener(
            "change",
            function() {

                if (unpaidCheck.checked) {
                    paidCheck.checked = false;
                }
            }
        );
    }


    /* Gjendja fillestare */

    updatePaymentVisibility();
}


/* ================================
   MERR TË DHËNAT E PAGESËS
================================ */

function getPaymentStatus() {

    const selectedVisit =
        document.querySelector(
            'input[name="visitType"]:checked'
        );

    const paidCheck =
        document.getElementById(
            "paidCheck"
        );

    const unpaidCheck =
        document.getElementById(
            "unpaidCheck"
        );


    if (
        !selectedVisit ||
        selectedVisit.value !== "Rikontroll"
    ) {

        return null;
    }


    if (
        paidCheck &&
        paidCheck.checked
    ) {

        return "Me pagesë";
    }


    if (
        unpaidCheck &&
        unpaidCheck.checked
    ) {

        return "Pa pagesë";
    }


    return null;
}


/* ================================
   NGARKO VIZITAT
================================ */

async function loadAppointments() {

    const box =
        document.getElementById(
            "appointments"
        );

    if (!box) {

        console.error(
            "Nuk u gjet elementi appointments"
        );

        return;
    }


    box.innerHTML =
        "<p>Po ngarkohet...</p>";


    console.log(
        "Po ngarkohen vizitat për:",
        dateKey(currentDate)
    );


    const result =
        await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
            "appointment_date",
            dateKey(currentDate)
        )
        .order(
            "appointment_time",
            {
                ascending: true
            }
        );


    if (result.error) {

        console.error(
            "Gabim në ngarkimin e vizitave:",
            result.error
        );

        box.innerHTML =
            `<p>Gabim: ${result.error.message}</p>`;

        return;
    }


    if (
        !result.data ||
        result.data.length === 0
    ) {

        box.innerHTML =
            "<p>Nuk ka vizita për këtë ditë.</p>";

        return;
    }


    box.innerHTML = "";


    result.data.forEach(
        appointment => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                `appointment ${
                    appointment.status ||
                    "planned"
                }`;


            const patientName =
                appointment.patient_name ||
                "";


            const cardNumber =
                appointment.card_number ||
                "-";


            const time =
                appointment.appointment_time
                    ? String(
                        appointment.appointment_time
                    ).substring(0, 5)
                    : "-";


            const status =
                appointment.status ||
                "planned";


            const visitType =
                appointment.visit_type ||
                "Vizitë";


            const paymentStatus =
                appointment.payment_status ||
                "";


            let paymentHTML = "";


            if (
                visitType === "Rikontroll"
            ) {

                paymentHTML = `
                    <br>
                    Pagesa:
                    ${paymentStatus || "-"}
                `;
            }


            div.innerHTML = `
                <strong>
                    ${patientName}
                </strong>

                <br>

                Ora:
                ${time}

                <br>

                Kartela:
                ${cardNumber}

                <br>

                Lloji:
                ${visitType}

                ${paymentHTML}

                <br>

                Status:
                ${status}
            `;


            box.appendChild(div);
        }
    );
}


/* ================================
   FORMULARI
================================ */

const appointmentForm =
    document.getElementById(
        "appointmentForm"
    );


if (appointmentForm) {

    appointmentForm.addEventListener(
        "submit",
        async function(e) {

            e.preventDefault();


            const patientNameElement =
                document.getElementById(
                    "patientName"
                );


            const cardNumberElement =
                document.getElementById(
                    "cardNumber"
                );


            const appointmentTimeElement =
                document.getElementById(
                    "appointmentTime"
                );


            const patientName =
                patientNameElement
                    ? patientNameElement.value.trim()
                    : "";


            const cardNumber =
                cardNumberElement
                    ? cardNumberElement.value.trim()
                    : "";


            const appointmentTime =
                appointmentTimeElement
                    ? appointmentTimeElement.value
                    : "";


            const selectedVisit =
                document.querySelector(
                    'input[name="visitType"]:checked'
                );


            const visitType =
                selectedVisit
                    ? selectedVisit.value
                    : "Vizitë";


            const paymentStatus =
                getPaymentStatus();


            /* ================================
               VALIDIMI
            ================================= */

            if (
                !patientName ||
                !appointmentTime
            ) {

                alert(
                    "Plotëso emrin dhe orën."
                );

                return;
            }


            /* Rikontroll duhet të ketë
               zgjedhje pagese */

            if (
                visitType === "Rikontroll" &&
                !paymentStatus
            ) {

                alert(
                    "Për rikontrollin zgjidh:\n\n" +
                    "Me pagesë ose Pa pagesë."
                );

                return;
            }


            console.log(
                "Po ruhet vizita:",
                {
                    patient_name:
                        patientName,

                    card_number:
                        cardNumber,

                    appointment_date:
                        dateKey(
                            currentDate
                        ),

                    appointment_time:
                        appointmentTime,

                    visit_type:
                        visitType,

                    payment_status:
                        paymentStatus,

                    status:
                        "planned"
                }
            );


            /* ================================
               RUAJ NË SUPABASE
            ================================= */

            const result =
                await supabaseClient
                .from("appointments")
                .insert([
                    {
                        patient_name:
                            patientName,

                        card_number:
                            cardNumber || null,

                        appointment_date:
                            dateKey(
                                currentDate
                            ),

                        appointment_time:
                            appointmentTime,

                        visit_type:
                            visitType,

                        payment_status:
                            paymentStatus,

                        status:
                            "planned"
                    }
                ]);


            if (result.error) {

                console.error(
                    "Gabim gjatë ruajtjes:",
                    result.error
                );


                alert(
                    "Gabim gjatë ruajtjes së vizitës:\n\n" +
                    result.error.message
                );

                return;
            }


            console.log(
                "Vizita u ruajt me sukses."
            );


            /* ================================
               PASTRO FORMULARIN
            ================================= */

            if (patientNameElement) {
                patientNameElement.value = "";
            }


            if (cardNumberElement) {
                cardNumberElement.value = "";
            }


            if (appointmentTimeElement) {
                appointmentTimeElement.value = "";
            }


            const paidCheck =
                document.getElementById(
                    "paidCheck"
                );


            const unpaidCheck =
                document.getElementById(
                    "unpaidCheck"
                );


            if (paidCheck) {
                paidCheck.checked = false;
            }


            if (unpaidCheck) {
                unpaidCheck.checked = false;
            }


            /* Ktheje përsëri në Vizitë */

            const visitRadio =
                document.querySelector(
                    'input[name="visitType"][value="Vizitë"]'
                );


            if (visitRadio) {

                visitRadio.checked =
                    true;
            }


            const paymentOptions =
                document.getElementById(
                    "paymentOptions"
                );


            if (paymentOptions) {

                paymentOptions.style.display =
                    "none";
            }


            await loadAppointments();
        }
    );

} else {

    console.error(
        "Nuk u gjet appointmentForm"
    );
}


/* ================================
   DITA PARA
================================ */

const prevDay =
    document.getElementById(
        "prevDay"
    );


if (prevDay) {

    prevDay.addEventListener(
        "click",
        function() {

            currentDate.setDate(
                currentDate.getDate() - 1
            );

            updateDate();

            loadAppointments();
        }
    );
}


/* ================================
   DITA PAS
================================ */

const nextDay =
    document.getElementById(
        "nextDay"
    );


if (nextDay) {

    nextDay.addEventListener(
        "click",
        function() {

            currentDate.setDate(
                currentDate.getDate() + 1
            );

            updateDate();

            loadAppointments();
        }
    );
}


/* ================================
   SOT
================================ */

const todayBtn =
    document.getElementById(
        "todayBtn"
    );


if (todayBtn) {

    todayBtn.addEventListener(
        "click",
        function() {

            currentDate =
                new Date();

            updateDate();

            loadAppointments();
        }
    );
}


/* ================================
   NISJA
================================ */

updateDate();

generateTimes();

setupVisitType();

loadAppointments();


console.log(
    "AMBULATORI GVM u inicializua."
);
```
