const SUPABASE_URL =
"https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
"VENDOS_PUBLISHABLE_KEY_TENDE";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentDate = new Date();

function dateKey(date){

    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");

    return `${y}-${m}-${d}`;
}

function updateDate(){

    document.getElementById("currentDate")
    .textContent =
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

    select.innerHTML = "";

    for(
        let m = 480;
        m <= 1080;
        m += 15
    ){

        const h =
        String(Math.floor(m/60))
        .padStart(2,"0");

        const min =
        String(m%60)
        .padStart(2,"0");

        const time =
        `${h}:${min}`;

        const option =
        document.createElement(
            "option"
        );

        option.value = time;
        option.textContent = time;

        select.appendChild(option);
    }
}

async function loadAppointments(){

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
        { ascending:true }
    );

    if(result.error){

        console.error(
            result.error
        );

        return;
    }

    const box =
    document.getElementById(
        "appointments"
    );

    box.innerHTML = "";

    if(
        !result.data ||
        result.data.length === 0
    ){

        box.innerHTML =
        "<p>Nuk ka vizita.</p>";

        return;
    }

    result.data.forEach(item => {

        const div =
        document.createElement(
            "div"
        );

        div.className =
        `appointment ${
            item.status || "planned"
        }`;

        div.innerHTML = `
            <strong>
                ${item.patient_name || ""}
            </strong>
            <br>
            Ora:
            ${String(
                item.appointment_time
            ).substring(0,5)}
            <br>
            Kartela:
            ${item.card_number || "-"}
        `;

        box.appendChild(div);
    });
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
            "patientPhone"
        ).value.trim();

        const appointmentTime =
        document.getElementById(
            "appointmentTime"
        ).value;

        const result =
        await supabaseClient
        .from("appointments")
        .insert([
            {
                patient_name:
                patientName,

                card_number:
                cardNumber || null,

                appointment_time:
                appointmentTime,

                appointment_date:
                dateKey(currentDate),

                status:
                "planned",

                is_paid:
                false
            }
        ]);

        if(result.error){

            alert(
                result.error.message
            );

            return;
        }

        document.getElementById(
            "appointmentForm"
        ).reset();

        loadAppointments();
    }
);

document
.getElementById("prevDay")
.onclick = () => {

    currentDate.setDate(
        currentDate.getDate()-1
    );

    updateDate();
    loadAppointments();
};

document
.getElementById("nextDay")
.onclick = () => {

    currentDate.setDate(
        currentDate.getDate()+1
    );

    updateDate();
    loadAppointments();
};

document
.getElementById("todayBtn")
.onclick = () => {

    currentDate =
    new Date();

    updateDate();
    loadAppointments();
};

updateDate();
generateTimes();
loadAppointments();
