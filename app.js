```javascript
const APP_VERSION = "GVM-20260925-04";

const SUPABASE_URL =
    "https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

let supabaseClient = null;
let currentUser = null;
let currentDate = new Date();


// =====================================================
// INITIALIZIMI
// =====================================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("P JS LOADED - AMBULATORI GVM");
    console.log("APP VERSION:", APP_VERSION);

    const status = document.getElementById("systemStatus");

    try {

        if (typeof window.supabase === "undefined") {

            console.error("Supabase library nuk u gjet.");

            if (status) {
                status.textContent =
                    "Gabim: Supabase nuk u ngarkua.";
            }

            return;
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log("Supabase OK");

        if (status) {
            status.textContent =
                "Sistemi u ngarkua.";
        }

        await checkAuth();

        updateDate();

        generateTimes();

        setupNavigation();

        setupPaymentOptions();

        setupForm();

        await loadAppointments();

        console.log(
            "AMBULATORI GVM u inicializua."
        );

    } catch (error) {

        console.error(
            "Gabim gjatë inicializimit:",
            error
        );

        if (status) {
            status.textContent =
                "Gabim gjatë ngarkimit të sistemit.";
        }
    }
});


// =====================================================
// AUTH
// =====================================================

async function checkAuth() {

    if (!supabaseClient) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Gabim Auth:",
                error
            );

            return;
        }

        currentUser =
            data?.session?.user || null;

        console.log(
            "User:",
            currentUser
        );

        supabaseClient.auth.onAuthStateChange(
            function (event, session) {

                console.log(
                    "Auth event:",
                    event
                );

                currentUser =
                    session?.user || null;
            }
        );

    } catch (error) {

        console.error(
            "Gabim gjatë kontrollit të Auth:",
            error
        );
    }
}


// =====================================================
// DATA
// =====================================================

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


// =====================================================
// SHFAQ DATA
// =====================================================

function updateDate() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );

    if (!dateElement) {
        return;
    }

    const day =
        String(
            currentDate.getDate()
        ).padStart(2, "0");

    const month =
        String(
            currentDate.getMonth() + 1
        ).padStart(2, "0");

    const year =
        currentDate.getFullYear();

    dateElement.textContent =
        `${day}/${month}/${year}`;
}


// =====================================================
// ORARET
// 12:00 - 17:00 çdo 15 minuta
// =====================================================

function generateTimes() {

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Zgjidh orën</option>';

    const startHour = 12;
    const startMinute = 0;

    const endHour = 17;
    const endMinute = 0;

    for (
        let hour = startHour;
        hour <= endHour;
        hour++
    ) {

        for (
            let minute = 0;
            minute < 60;
            minute += 15
        ) {

            if (
                hour === endHour &&
                minute > endMinute
            ) {
                continue;
            }

            const time =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

            const option =
                document.createElement("option");

            option.value = time;
            option.textContent = time;

            select.appendChild(option);
        }
    }

    console.log(
        "Oraret u krijuan: 12:00 - 17:00"
    );
}


// =====================================================
// NAVIGIMI I DATAVE
// =====================================================

function setupNavigation() {

    const prevButton =
        document.getElementById(
            "prevDay"
        );

    const nextButton =
        document.getElementById(
            "nextDay"
        );

    const todayButton =
        document.getElementById(
            "today"
        );


    if (prevButton) {

        prevButton.addEventListener(
            "click",
            async function () {

                currentDate.setDate(
                    currentDate.getDate() - 1
                );

                updateDate();

                await loadAppointments();
            }
        );
    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            async function () {

                currentDate.setDate(
                    currentDate.getDate() + 1
                );

                updateDate();

                await loadAppointments();
            }
        );
    }


    if (todayButton) {

        todayButton.addEventListener(
            "click",
            async function () {

                currentDate =
                    new Date();

                updateDate();

                await loadAppointments();
            }
        );
    }
}


// =====================================================
// ME PAGESË / PA PAGESË
// =====================================================

function setupPaymentOptions() {

    const paymentOptions =
        document.getElementById(
            "paymentOptions"
        );

    const visitTypeInputs =
        document.querySelectorAll(
            'input[name="visitType"]'
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
        !paymentOptions ||
        !visitTypeInputs.length
    ) {

        console.error(
            "Elementet e pagesës nuk u gjetën."
        );

        return;
    }


    function updatePaymentVisibility() {

        const selected =
            document.querySelector(
                'input[name="visitType"]:checked'
            );

        if (!selected) {
            return;
        }


        if (
            selected.value === "Rikontroll"
        ) {

            paymentOptions.style.display =
                "block";

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


    visitTypeInputs.forEach(
        function (input) {

            input.addEventListener(
                "change",
                updatePaymentVisibility
            );
        }
    );


    // Vetëm njëra mund të jetë e zgjedhur
    if (paidCheck) {

        paidCheck.addEventListener(
            "change",
            function () {

                if (
                    paidCheck.checked &&
                    unpaidCheck
                ) {
                    unpaidCheck.checked =
                        false;
                }
            }
        );
    }


    if (unpaidCheck) {

        unpaidCheck.addEventListener(
            "change",
            function () {

                if (
                    unpaidCheck.checked &&
                    paidCheck
                ) {
                    paidCheck.checked =
                        false;
                }
            }
        );
    }


    updatePaymentVisibility();
}


// =====================================================
// FORMULARI
// =====================================================

function setupForm() {

    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (!form) {
        console.error(
            "appointmentForm nuk u gjet."
        );

        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const patientName =
                document.getElementById(
                    "patientName"
                )?.value.trim();


            const cardNumber =
                document.getElementById(
                    "cardNumber"
                )?.value.trim();


            const appointmentTime =
                document.getElementById(
                    "appointmentTime"
                )?.value;


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


            if (!patientName) {

                alert(
                    "Vendos emër dhe mbiemër."
                );

                return;
            }


            if (!appointmentTime) {

                alert(
                    "Zgjidh orën."
                );

                return;
            }


            const visitType =
                selectedVisit
                    ? selectedVisit.value
                    : "Vizitë";


            let paymentStatus = null;


            if (
                visitType === "Rikontroll"
            ) {

                if (
                    !paidCheck?.checked &&
                    !unpaidCheck?.checked
                ) {

                    alert(
                        "Zgjidh Me pagesë ose Pa pagesë."
                    );

                    return;
                }


                if (
                    paidCheck?.checked
                ) {

                    paymentStatus =
                        "Me pagesë";
                }


                if (
                    unpaidCheck?.checked
                ) {

                    paymentStatus =
                        "Pa pagesë";
                }
            }


            console.log(
                "Po ruhet vizita:",
                {
                    patientName,
                    cardNumber,
                    appointmentDate:
                        dateKey(currentDate),
                    appointmentTime,
                    visitType,
                    paymentStatus
                }
            );


            if (!supabaseClient) {

                alert(
                    "Supabase nuk është inicializuar."
                );

                return;
            }


            try {

                /*
                 * KUJDES:
                 * Nuk po dërgojmë payment_status
                 * në Supabase sepse nuk kemi konfirmuar
                 * që kolona ekziston në tabelën appointments.
                 */

                const {
                    data,
                    error
                } =
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
                        ])
                        .select();


                if (error) {

                    console.error(
                        "Gabim Supabase:",
                        error
                    );

                    alert(
                        "Gabim gjatë ruajtjes:\n" +
                        error.message
                    );

                    return;
                }


                console.log(
                    "Vizita u ruajt:",
                    data
                );


                alert(
                    "Vizita u ruajt me sukses."
                );


                form.reset();


                const defaultVisit =
                    document.querySelector(
                        'input[name="visitType"][value="Vizitë"]'
                    );


                if (defaultVisit) {
                    defaultVisit.checked =
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


                generateTimes();

                await loadAppointments();

            } catch (error) {

                console.error(
                    "Gabim:",
                    error
                );

                alert(
                    "Ndodhi një gabim gjatë ruajtjes."
                );
            }
        }
    );
}


// =====================================================
// NGARKO VIZITAT
// =====================================================

async function loadAppointments() {

    const container =
        document.getElementById(
            "appointments"
        );

    if (!container) {
        return;
    }


    if (!supabaseClient) {

        container.textContent =
            "Supabase nuk është inicializuar.";

        return;
    }


    const selectedDate =
        dateKey(currentDate);


    console.log(
        "Po ngarkohen vizitat për:",
        selectedDate
    );


    container.innerHTML =
        "Po ngarkohen vizitat...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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
                "Gabim gjatë ngarkimit:",
                error
            );

            container.innerHTML =
                `<p>Gabim: ${escapeHtml(error.message)}</p>`;

            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML =
                "<p>Nuk ka vizita për këtë datë.</p>";

            return;
        }


        container.innerHTML = "";


        data.forEach(
            function (appointment) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "appointment-item";


                const name =
                    appointment.patient_name ||
                    "";


                const card =
                    appointment.card_number ||
                    "";


                const time =
                    appointment.appointment_time ||
                    "";


                const visitType =
                    appointment.visit_type ||
                    "";


                item.innerHTML = `
                    <div>
                        <strong>${escapeHtml(time)}</strong>
                    </div>

                    <div>
                        ${escapeHtml(name)}
                    </div>

                    <div>
                        Kartela:
                        ${escapeHtml(card)}
                    </div>

                    <div>
                        ${escapeHtml(visitType)}
                    </div>
                `;


                container.appendChild(
                    item
                );
            }
        );

    } catch (error) {

        console.error(
            "Gabim:",
            error
        );

        container.innerHTML =
            "<p>Gabim gjatë ngarkimit të vizitave.</p>";
    }
}


// =====================================================
// SIGURIA E TEKSTIT HTML
// =====================================================

function escapeHtml(value) {

    return String(value)
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
```
