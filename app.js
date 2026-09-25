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

function dateKey(date){

    const y = date.getFullYear();

    const m = String(
        date.getMonth() + 1
    ).padStart(2,"0");

    const d = String(
        date.getDate()
    ).padStart(2,"0");

    return `${y}-${m}-${d}`;
}

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
            weekday:"long",
            day:"2-digit",
            month:"long",
            year:"numeric"
        }
    );
}

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

    select.appendChild(first);

    for(
        let minutes = 480;
        minutes <= 1080;
        minutes += 15
    ){

        const h =
        String(
            Math.floor(
                minutes / 60
            )
        ).padStart(2,"0");

        const m =
        String(
            minutes % 60
        ).padStart(2,"0");

        const time =
        `${h}:${m}`;

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

async function loadAppointments(){

    const box =
    document.getElementById(
        "appointments"
    );

    if(!box) return;

    box.innerHTML =
    "Po ngarkohet...";

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
            ascending:true
        }
    );

    if(result.error){

        console.error(
            result.error
        );

        box.innerHTML =
        result.error.message;

        return;
    }

    if(
        !result.data ||
        result.data.length === 0
    ){

        box.innerHTML =
        "<p>Nuk ka vizita.</p>";

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

            div.innerHTML = `
                <strong>
                    ${appointment.patient_name || ""}
                </strong>

                <br>

                Ora:
                ${String(
                    appointment.appointment_time
                ).substring(0,5)}

                <br>

                Kartela:
                ${appointment.card_number || "-"}

                <br>

                Status:
                ${appointment.status || "planned"}
            `;

            box.appendChild(
                div
            );
        }
    );
}

document
.getElementById(
    "appointmentForm"
)
.addEventListener(
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
                "Plotëso të gjitha fushat."
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

                status:
                "planned"
            }
        ]);

        if(result.error){

            console.error(
                result.error
            );

            alert(
                result.error.message
            );

            return;
        }

        document.getElementById(
            "patientName"
        ).value = "";

        document.getElementById(
            "cardNumber"
        ).value = "";

        document.getElementById(
            "appointmentTime"
        ).value = "";

        loadAppointments();
    }
);

document
.getElementById(
    "prevDay"
)
.addEventListener(
    "click",
    function(){

        currentDate.setDate(
            currentDate.getDate() - 1
        );

        updateDate();

        loadAppointments();
    }
);

document
.getElementById(
    "nextDay"
)
.addEventListener(
    "click",
    function(){

        currentDate.setDate(
            currentDate.getDate() + 1
        );

        updateDate();

       async function loadAppointments(){

    const box =
    document.getElementById("appointments");

    if(!box) return;

    box.innerHTML = "Po ngarkohet...";

    console.log("=== LOAD APPOINTMENTS ===");
    console.log("Date:", dateKey(currentDate));

    const {
        data,
        error,
        status,
        statusText
    } = await supabaseClient
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

    console.log("HTTP status:", status);
    console.log("HTTP status text:", statusText);
    console.log("DATA:", data);
    console.log("ERROR:", error);

    if(error){

        box.innerHTML =
            "Gabim: " +
            error.message;

        return;
    }

    if(!data || data.length === 0){

        box.innerHTML =
            "<p>Nuk ka vizita.</p>";

        return;
    }

    box.innerHTML = "";

    data.forEach(
        appointment => {

            const div =
            document.createElement("div");

            div.className =
            `appointment ${
                appointment.status || "planned"
            }`;

            div.innerHTML = `
                <strong>
                    ${appointment.patient_name || ""}
                </strong>
                <br>
                Ora:
                ${String(
                    appointment.appointment_time
                ).substring(0,5)}
                <br>
                Kartela:
                ${appointment.card_number || "-"}
                <br>
                Status:
                ${appointment.status || "planned"}
            `;

            box.appendChild(div);
        }
    );
}
        updateDate();

        loadAppointments();
    }
);

updateDate();
generateTimes();
loadAppointments();
