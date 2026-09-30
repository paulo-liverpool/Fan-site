/* ============================================================
   BARÇA REAL
   SUPABASE CLIENT + ACCESS CONTROL
   ============================================================ */

const SUPABASE_URL =
    "https://eanimmfehvqzubgychik.supabase.co/";

const SUPABASE_ANON_KEY =
    "sb_publishable_Iley6SypihdYU6w2wBVEcA_kz9Ug3DE";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


window.supabaseClient =
    supabaseClient;


/*
 * Existing Barça Real files use `supabase`
 * as the client reference.
 */

window.supabase =
    supabaseClient;


window.barcaRealAccess = {

    checked: false,

    allowed: null,

    reason: null,

    data: null

};


/* ============================================================
   PAGE TYPES
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


function isAdminPage() {

    const path =
        window.location.pathname
            .toLowerCase();

    return path.endsWith(
        "admin.html"
    );

}


function isPaymentPage() {

    const path =
        window.location.pathname
            .toLowerCase();

    const filename =
        path.split("/").pop();


    return filename ===
        "payment.html";

}


/* ============================================================
   ACCESS MESSAGES
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
   ACCESS REDIRECT
   ============================================================ */

function redirectForAccess(
    result
) {

    const reason =
        result?.reason ||
        "payment_required";


    if (isAdminPage()) {
        return;
    }


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
        `payment.html?reason=${encodeURIComponent(
            reason
        )}&message=${message}`;

}


/* ============================================================
   CHECK ACCESS
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
     * Admin access is controlled separately
     * by the existing admin authorization.
     */

    if (isAdminPage()) {

        return {

            authenticated: true,

            allowed: true,

            reason: "admin_page"

        };

    }


    /*
     * Payment page must remain accessible
     * to blocked authenticated users.
     */

    if (isPaymentPage()) {

        const {
            data: sessionData
        } =
            await supabaseClient.auth
                .getSession();


        const session =
            sessionData?.session;


        if (!session) {

            window.location.href =
                "login.html";

            return {

                authenticated: false,

                allowed: false,

                reason:
                    "not_authenticated"

            };

        }


        return {

            authenticated: true,

            allowed: true,

            reason:
                "payment_page"

        };

    }


    /* ========================================================
       SESSION
       ======================================================== */

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

            reason:
                "session_error"

        };

    }


    const session =
        sessionData?.session;


    if (!session) {

        const result = {

            authenticated: false,

            allowed: false,

            reason:
                "not_authenticated"

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


    /* ========================================================
       SERVER-SIDE ACCESS CHECK
       ======================================================== */

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
         * Do not lock users out because
         * of a temporary network/RPC error.
         */

        const result = {

            authenticated: true,

            allowed: true,

            reason:
                "access_check_error",

            error:
                error.message

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

            reason:
                "unknown"

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


window.checkBarcaRealAccess =
    checkBarcaRealAccess;


/* ============================================================
   AUTOMATIC GUARD
   ============================================================ */

async function initializeBarcaRealAccessGuard() {

    if (isPublicAccessPage()) {
        return;
    }


    if (isAdminPage()) {
        return;
    }


    if (isPaymentPage()) {
        return;
    }


    await checkBarcaRealAccess({

        redirect: true

    });

}


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
