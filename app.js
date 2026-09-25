console.log("APP JS LOADED");

const SUPABASE_URL =
"https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
"sb_publishable_dirq3uo9Qy1ez37JkEnciA_sSmYleDZ";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase OK");

let currentDate = new Date();


// ======================================
// DATA
// ======================================

function dateKey(date){

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


// ======================================
// DATE DISPLAY
// ======================================

function updateDate(){

    const el =
        document.getElementById(
            "currentDate"
        );

    if(!el) return;

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


// ======================================
// TIME OPTIONS
// 12:00 - 17:00
// EVERY 15 MINUTES
// ======================================

function generateTimes(){

    const select =
        document.getElementById(
            "appointmentTime"
        );

    if(!select) return;

    select.innerHTML = "";

    const first =
        document.createElement(
            "option"
        );

    first.value = "";

    first.textContent =
        "Zgjidh orën";

    first.disabled = false;

    first.selected = true;

    select.appendChild(first);


    // 12:00 = 720 minutes
    // 17:00 = 1020 minutes

    for(
        let minutes = 720;
        minutes <= 1020;
        minutes += 15
    ){

        const hours =
            Math.floor(
                minutes / 60
            );

        const mins =
            minutes % 60;

        const time =
            String(hours).padStart(2, "0")
            + ":" +
            String(mins).padStart(2, "0");


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
}


// ======================================
// LOAD APPOINTMENTS
// ======================================

async function loadAppointments(){

    const box =
        document.getElementById(
            "appointments"
        );

    if(!box) return;

    box.innerHTML =
        "<p>Po ngarkohet...</p>";


    console.log(
        "Duke ngarkuar vizitat për:",
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


    if(result.error){

        console.error(
            "Gabim në ngarkimin e vizitave:",
            result.error
        );

        box.innerHTML =
            `<p>Gabim: ${result.error.message}</p>`;

        return;
    }


    if(
        !result.data ||
        result.data.length === 0
    ){

        box.innerHTML =
            "<p>Nuk ka vizita për këtë datë.</p>";

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


            const time =
                appointment.appointment_time
                    ? String(
                        appointment.appointment_time
                    ).substring(0, 5)
                    : "";


            div.innerHTML = `

                <strong>
                    ${appointment.patient_name || ""}
                </strong>

                <br>

                <span>
                    Ora:
                    ${time}
                </span>

                <br>

                <span>
                    Kartela:
                    ${appointment.card_number || "-"}
                </span>

                <br>

                <span>
                    Status:
                    ${appointment.status || "planned"}
                </span>

            `;


            box.appendChild(
                div
            );
        }
    );
}


// ======================================
// ADD APPOINTMENT
// ======================================

const appointmentForm =
    document.getElementById(
        "appointmentForm"
    );


if(appointmentForm){

    appointmentForm.addEventListener(
        "submit",
        async function(e){

            e.preventDefault();


            const patientName =
                document.getElementById(
                    "patientName"
                ).value.trim();


            const cardNumber =
                document.getElementById(
                    "cardNumber"
                ).value.trim();


            const appointmentTime =
                document.getElementById(
                    "appointmentTime"
                ).value;


            if(
                !patientName ||
                !appointmentTime
            ){

                alert(
                    "Plotëso emrin dhe zgjidh orën."
                );

                return;
            }


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

                        // REQUIRED DATABASE FIELD
                        visit_type:
                            "Ambulator",

                        status:
                            "planned"
                    }
                ]);


            if(result.error){

                console.error(
                    "Gabim gjatë ruajtjes:",
                    result.error
                );

                alert(
                    result.error.message
                );

                return;
            }


            alert(
                "Vizita u ruajt me sukses."
            );


            document.getElementById(
                "patientName"
            ).value = "";


            document.getElementById(
                "cardNumber"
            ).value = "";


            document.getElementById(
                "appointmentTime"
            ).value = "";


            await loadAppointments();

        }
    );

}


// ======================================
// PREVIOUS DAY
// ======================================

const prevDay =
    document.getElementById(
        "prevDay"
    );


if(prevDay){

    prevDay.addEventListener(
        "click",
        function(){

            currentDate.setDate(
                currentDate.getDate() - 1
            );

            updateDate();

            loadAppointments();

        }
    );

}


// ======================================
// NEXT DAY
// ======================================

const nextDay =
    document.getElementById(
        "nextDay"
    );


if(nextDay){

    nextDay.addEventListener(
        "click",
        function(){

            currentDate.setDate(
                currentDate.getDate() + 1
            );

            updateDate();

            loadAppointments();

        }
    );

}


// ======================================
// TODAY
// ======================================

const todayBtn =
    document.getElementById(
        "todayBtn"
    );


if(todayBtn){

    todayBtn.addEventListener(
        "click",
        function(){

            currentDate =
                new Date();

            updateDate();

            loadAppointments();

        }
    );

}


// ======================================
// START APPLICATION
// ======================================

updateDate();

generateTimes();

loadAppointments();
