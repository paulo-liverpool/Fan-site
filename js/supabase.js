/* ============================================================
   BARÇA REAL
   SUPABASE CLIENT + ACCESS CONTROL
   ============================================================ */


/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL =
    "https://eanimmfehvqzubgychik.supabase.co/";

const SUPABASE_ANON_KEY =
    "sb_publishable_Iley6SypihdYU6w2wBVEcA_kz9Ug3DE";


/* ============================================================
   SUPABASE CLIENT
   ============================================================ */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* ============================================================
   GLOBAL CLIENT
   ============================================================ */

window.supabaseClient =
    supabaseClient;


/*
 * Some existing Barça Real admin/application files
 * use `supabase` directly.
 *
 * Keep that global reference available.
 */

window.supabase =
    supabaseClient;


/* ============================================================
   ACCESS CONTROL STATE
   ============================================================ */

window.barcaRealAccess = {

    checked: false,

    allowed: null,

    reason: null,

    data: null

};


/* ============================================================
   PAGES THAT MUST REMAIN ACCESSIBLE
   WITHOUT PLATFORM PAYMENT
   ============================================================ */

function isPublicAccessPage() {

    const path =
        window.location.pathname
            .toLowerCase();


    const filename =
        path.split("/").pop();


    const publicPages = [

        "",

        "login.html",

        "choose-team.html",

        "loading.html",

        "register.html",

        "signup.html",

        "forgot-password.html",

        "reset-password.html"

    ];


    return publicPages.includes(
        filename
    );

}


/* ============================================================
   ADMIN PAGE
   ============================================================ */

function isAdminPage() {

    const path =
        window.location.pathname
            .toLowerCase();


    return path.endsWith(
        "admin.html"
    );

}


/* ============================================================
   PAYMENT PAGE
   ============================================================ */

function isPaymentPage() {

    const path =
        window.location.pathname
            .toLowerCase();


    const filename =
        path.split("/").pop();


    return (

        filename ===
            "payment.html"

        ||

        filename ===
            "payments.html"

    );

}


/* ============================================================
   ACCESS MESSAGE
   ============================================================ */

function getAccessMessage(
    reason
) {

    const messages = {

        suspended:
            "A tua conta está suspensa.",

        subscription_required:
            "É necessária uma subscrição para continuar.",

        payment_required:
            "O teu pagamento está em falta.",

        not_authenticated:
            "É necessário iniciar sessão."

    };


    return (
        messages[reason] ||
        "O acesso à plataforma não está disponível."
    );

}


/* ============================================================
   REDIRECT TO ACCESS PAGE
   ============================================================ */

function redirectForAccess(
    result
) {

    const reason =
        result?.reason ||
        "payment_required";


    /*
     * Do not redirect administrators
     * through the payment flow.
     */

    if (isAdminPage()) {

        return;

    }


    /*
     * If the project already has a
     * dedicated payment page, use it.
     */

    if (isPaymentPage()) {

        return;

    }


    const message =
        encodeURIComponent(
            getAccessMessage(
                reason
            )
        );


    window.location.href =
        `login.html?access=${message}`;

}


/* ============================================================
   CHECK PLATFORM ACCESS
   ============================================================ */

async function checkBarcaRealAccess(
    options = {}
) {

    const {

        redirect = true,

        skipPublicPageCheck = false

    } = options;


    if (
        !skipPublicPageCheck &&
        isPublicAccessPage()
    ) {

        return {

            authenticated: false,

            allowed: true,

            reason: "public_page"

        };

    }


    /*
     * Never interfere with the admin page's
     * existing administrator verification.
     */

    if (isAdminPage()) {

        return {

            authenticated: true,

            allowed: true,

            reason: "admin_page"

        };

    }


    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth
            .getSession();


    if (sessionError) {

        console.error(
            "Erro ao verificar sessão:",
            sessionError
        );

        return {

            authenticated: false,

            allowed: false,

            reason: "session_error"

        };

    }


    const session =
        sessionData?.session;


    if (!session) {

        const result = {

            authenticated: false,

            allowed: false,

            reason: "not_authenticated"

        };


        window.barcaRealAccess = {

            checked: true,

            allowed: false,

            reason:
                result.reason,

            data:
                result

        };


        if (redirect) {

            redirectForAccess(
                result
            );

        }


        return result;

    }


    /* --------------------------------------------------------
       CALL SECURE DATABASE ACCESS CHECK
       -------------------------------------------------------- */

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "check_user_platform_access"
        );


    if (error) {

        console.error(
            "Erro ao verificar acesso:",
            error
        );


        /*
         * Do not lock existing users out
         * because of a temporary RPC/network
         * failure.
         */

        const result = {

            authenticated: true,

            allowed: true,

            reason: "access_check_error",

            error: error.message

        };


        window.barcaRealAccess = {

            checked: true,

            allowed: true,

            reason:
                result.reason,

            data:
                result

        };


        return result;

    }


    const result =
        data || {

            authenticated: true,

            allowed: true,

            reason: "unknown"

        };


    window.barcaRealAccess = {

        checked: true,

        allowed:
            result.allowed,

        reason:
            result.reason,

        data:
            result

    };


    if (
        result.allowed !== true &&
        redirect
    ) {

        redirectForAccess(
            result
        );

    }


    return result;

}


/* ============================================================
   EXPOSE ACCESS CHECK
   ============================================================ */

window.checkBarcaRealAccess =
    checkBarcaRealAccess;


/* ============================================================
   AUTOMATIC ACCESS GUARD
   ============================================================ */

async function initializeBarcaRealAccessGuard() {

    /*
     * Public pages must remain accessible.
     */

    if (isPublicAccessPage()) {

        return;

    }


    /*
     * Admin has its own administrator
     * authorization flow.
     */

    if (isAdminPage()) {

        return;

    }


    /*
     * Run the central access check.
     */

    await checkBarcaRealAccess({

        redirect: true

    });

}


/* ============================================================
   START ACCESS GUARD
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeBarcaRealAccessGuard
    );

} else {

    initializeBarcaRealAccessGuard();

}
