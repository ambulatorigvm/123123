```javascript
console.log("TEST I RI - APP.JS PO NGARKOHET");

const APP_VERSION = "GVM-20260925-03";

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
   RIKONTROLLI
   ME PAGESË / PA PAGESË
================================ */

function setupPaymentOptions() {

    const visitRadios =
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


    if (!paymentOptions) {

        console.error(
            "Nuk u gjet paymentOptions"
        );

        return;
    }


    function updatePaymentOptions() {

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
                "Rikontroll: opsionet e pagesës u shfaqën."
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
        }
    }


    visitRadios.forEach(
        radio => {

            radio.addEventListener(
                "change",
                updatePaymentOptions
            );
        }
    );


    /* ================================
       VETËM NJË NGA DY OPSIONET
    ================================= */

    if (paidCheck) {

        paidCheck.addEventListener(
            "change",
            function() {

                if (paidCheck.checked) {

                    if (unpaidCheck) {
                        unpaidCheck.checked = false;
                    }
                }
            }
        );
    }


    if (unpaidCheck) {

        unpaidCheck.addEventListener(
            "change",
            function() {

                if (unpaidCheck.checked) {

                    if (paidCheck) {
                        paidCheck.checked = false;
                    }
                }
            }
        );
    }


    /* Gjendja fillestare */

    updatePaymentOptions();
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


            const patientName =
                document
                .getElementById(
                    "patientName"
                )
                .value
                .trim();


            const cardNumber =
                document
                .getElementById(
                    "cardNumber"
                )
                .value
                .trim();


            const appointmentTime =
                document
                .getElementById(
                    "appointmentTime"
                )
                .value;


            /* ================================
               LLOJI I VIZITËS
            ================================= */

            const selectedVisit =
                document.querySelector(
                    'input[name="visitType"]:checked'
                );


            const visitType =
                selectedVisit
                    ? selectedVisit.value
                    : "Vizitë";


            /* ================================
               PAGESA
            ================================= */

            const paidCheck =
                document.getElementById(
                    "paidCheck"
                );


            const unpaidCheck =
                document.getElementById(
                    "unpaidCheck"
                );


            let paymentStatus =
                null;


            if (
                visitType === "Rikontroll"
            ) {

                if (
                    paidCheck &&
                    paidCheck.checked
                ) {

                    paymentStatus =
                        "Me pagesë";

                } else if (
                    unpaidCheck &&
                    unpaidCheck.checked
                ) {

                    paymentStatus =
                        "Pa pagesë";
                }


                if (!paymentStatus) {

                    alert(
                        "Për rikontrollin zgjidh Me pagesë ose Pa pagesë."
                    );

                    return;
                }
            }


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
               RUAJ VIZITËN
               
               KUJDES:
               Për momentin ruajmë vetëm
               kolonat që ekzistonin më parë.
               
               Pagesa shfaqet në ekran,
               por nuk dërgohet në Supabase
               derisa të kontrollojmë kolonën.
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

            document
            .getElementById(
                "patientName"
            )
            .value = "";


            document
            .getElementById(
                "cardNumber"
            )
            .value = "";


            document
            .getElementById(
                "appointmentTime"
            )
            .value = "";


            if (paidCheck) {
                paidCheck.checked = false;
            }


            if (unpaidCheck) {
                unpaidCheck.checked = false;
            }


            const visitRadio =
                document.querySelector(
                    'input[name="visitType"][value="Vizitë"]'
                );


            if (visitRadio) {
                visitRadio.checked = true;
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

setupPaymentOptions();

loadAppointments();


console.log(
    "AMBULATORI GVM u inicializua."
);
```
