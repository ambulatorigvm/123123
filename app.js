const SUPABASE_URL =
"https://ubpteaqdkxcriqyaxrux.supabase.co";

const SUPABASE_KEY =
"VENDOS_KEY_TENDE";

const supabase =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentDate = new Date();

function dateKey(date){

    const y = date.getFullYear();

    const m = String(
        date.getMonth()+1
    ).padStart(2,"0");

    const d = String(
        date.getDate()
    ).padStart(2,"0");

    return `${y}-${m}-${d}`;
}

function updateDate(){

    document.getElementById(
        "currentDate"
    ).textContent =
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

    select.innerHTML="";

    for(
        let m=480;
        m<=1080;
        m+=15
    ){

        const h =
        String(
            Math.floor(m/60)
        ).padStart(2,"0");

        const min =
        String(
            m%60
        ).padStart(2,"0");

        const t=`${h}:${min}`;

        const option =
        document.createElement(
            "option"
        );

        option.value=t;
        option.textContent=t;

        select.appendChild(option);
    }
}

async function loadAppointments(){

    const result =
    await supabase
    .from("appointments")
    .select("*")
    .eq(
        "appointment_date",
        dateKey(currentDate)
    )
    .order(
        "appointment_time"
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

    box.innerHTML="";

    result.data.forEach(item=>{

        const div =
        document.createElement(
            "div"
        );

        div.className =
        `appointment ${item.status}`;

        div.innerHTML=`
            <strong>
                ${item.patient_name}
            </strong>
            <br>
            ${item.appointment_time}
            <br>
            ${item.patient_phone||""}
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
        ).value;

        const patientPhone =
        document.getElementById(
            "patientPhone"
        ).value;

        const appointmentTime =
        document.getElementById(
            "appointmentTime"
        ).value;

        const result =
        await supabase
        .from("appointments")
        .insert([
            {
                patient_name:
                patientName,

                patient_phone:
                patientPhone,

                appointment_time:
                appointmentTime,

                appointment_date:
                dateKey(
                    currentDate
                ),

                status:
                "planned"
            }
        ]);

        if(result.error){

            alert(
                result.error.message
            );

            return;
        }

        loadAppointments();
    }
);

document
.getElementById("prevDay")
.onclick=()=>{
    currentDate.setDate(
        currentDate.getDate()-1
    );
    updateDate();
    loadAppointments();
};

document
.getElementById("nextDay")
.onclick=()=>{
    currentDate.setDate(
        currentDate.getDate()+1
    );
    updateDate();
    loadAppointments();
};

document
.getElementById("todayBtn")
.onclick=()=>{
    currentDate=new Date();
    updateDate();
    loadAppointments();
};

updateDate();
generateTimes();
loadAppointments();
