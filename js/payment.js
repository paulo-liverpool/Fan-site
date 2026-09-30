/* ============================================================
   BARÇA REAL
   PAYMENT PAGE
   ============================================================ */

(function () {

    "use strict";


    const state = {

        user: null,

        settings: null,

        access: null,

        subscription: null,

        waiver: null,

        loading: false

    };


    /* ========================================================
       ELEMENTS
       ======================================================== */

    const elements = {

        message:
            document.getElementById(
                "payment-message"
            ),

        status:
            document.getElementById(
                "payment-status"
            ),

        price:
            document.getElementById(
                "payment-price"
            ),

        currency:
            document.getElementById(
                "payment-currency"
            ),

        subscriptionStatus:
            document.getElementById(
                "payment-subscription-status"
            ),

        graceRow:
            document.getElementById(
                "payment-grace-row"
            ),

        grace:
            document.getElementById(
                "payment-grace"
            ),

        waiverRow:
            document.getElementById(
                "payment-waiver-row"
            ),

        waiver:
            document.getElementById(
                "payment-waiver"
            ),

        button:
            document.getElementById(
                "payment-button"
            ),

        actionArea:
            document.getElementById(
                "payment-action-area"
            ),

        instructions:
            document.getElementById(
                "payment-instructions"
            ),

        logout:
            document.getElementById(
                "logout-button"
            )

    };


    /* ========================================================
       HELPERS
       ======================================================== */

    function formatMoney(
        amount,
        currency
    ) {

        const value =
            Number(amount || 0);

        try {

            return new Intl.NumberFormat(
                "pt-AO",
                {
                    style: "currency",
                    currency:
                        currency || "AOA",
                    maximumFractionDigits: 0
                }
            ).format(value);

        } catch (error) {

            return `${value.toLocaleString(
                "pt-AO"
            )} ${currency || "AOA"}`;

        }

    }


    function formatDate(
        value
    ) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return date.toLocaleDateString(
            "pt-AO",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    function getReasonFromUrl() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("reason") ||
            "payment_required"
        );

    }


    function setMessage(
        reason
    ) {

        const messages = {

            suspended:
                "A tua conta está suspensa. Contacta a administração para obter mais informações.",

            subscription_required:
                "É necessária uma subscrição ativa para continuar a utilizar a plataforma.",

            payment_required:
                "O teu pagamento está em falta. Regulariza a subscrição para recuperar o acesso.",

            payment_waiver:
                "A tua conta tem uma isenção de pagamento ativa.",

            grace_period:
                "Estás dentro do teu período de tolerância.",

            subscription_active:
                "A tua subscrição está ativa."

        };

        elements.message.textContent =
            messages[reason] ||
            messages.payment_required;

    }


    function setStatus(
        text
    ) {

        elements.status.textContent =
            text;

    }


    /* ========================================================
       LOAD USER
       ======================================================== */

    async function loadUser() {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getUser();

        if (error) {

            console.error(
                "Erro ao obter utilizador:",
                error
            );

            return null;

        }

        return data?.user || null;

    }


    /* ========================================================
       LOAD PLATFORM SETTINGS
       ======================================================== */

    async function loadSettings() {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("platform_settings")
                .select(
                    `
                    payments_active,
                    enforce_payment,
                    monthly_price,
                    currency,
                    grace_period_days
                    `
                )
                .eq(
                    "id",
                    "global"
                )
                .maybeSingle();

        if (error) {

            console.error(
                "Erro ao carregar definições:",
                error
            );

            return null;

        }

        return data;

    }


    /* ========================================================
       LOAD ACCESS DATA
       ======================================================== */

    async function loadAccess() {

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

            return null;

        }

        return data;

    }


    /* ========================================================
       LOAD SUBSCRIPTION
       ======================================================== */

    async function loadSubscription() {

        if (!state.user) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .from("subscriptions")
                .select(
                    `
                    status,
                    monthly_price,
                    currency,
                    current_period_start,
                    current_period_end,
                    next_payment_due_at,
                    grace_until,
                    auto_renew,
                    admin_note
                    `
                )
                .eq(
                    "user_id",
                    state.user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();

        if (error) {

            console.error(
                "Erro ao carregar subscrição:",
                error
            );

            return null;

        }

        return data;

    }


    /* ========================================================
       LOAD WAIVER
       ======================================================== */

    async function loadWaiver() {

        if (!state.user) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .from("subscription_waivers")
                .select(
                    `
                    id,
                    reason,
                    starts_at,
                    expires_at,
                    active
                    `
                )
                .eq(
                    "user_id",
                    state.user.id
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();

        if (error) {

            console.error(
                "Erro ao carregar isenção:",
                error
            );

            return null;

        }

        return data;

    }


    /* ========================================================
       RENDER
       ======================================================== */

    function render() {

        const settings =
            state.settings;

        const subscription =
            state.subscription;

        const access =
            state.access;

        elements.price.textContent =
            formatMoney(
                settings?.monthly_price ??
                    subscription?.monthly_price ??
                    0,
                settings?.currency ??
                    subscription?.currency ??
                    "AOA"
            );

        elements.currency.textContent =
            settings?.currency ??
            subscription?.currency ??
            "AOA";

        elements.subscriptionStatus.textContent =
            subscription?.status
                ? formatSubscriptionStatus(
                    subscription.status
                )
                : "Sem subscrição";


        if (
            subscription?.grace_until &&
            new Date(
                subscription.grace_until
            ) > new Date()
        ) {

            elements.graceRow.classList.remove(
                "hidden"
            );

            elements.grace.textContent =
                `Até ${formatDate(
                    subscription.grace_until
                )}`;

        } else {

            elements.graceRow.classList.add(
                "hidden"
            );

        }


        if (state.waiver) {

            elements.waiverRow.classList.remove(
                "hidden"
            );

            elements.waiver.textContent =
                state.waiver.expires_at
                    ? `Até ${formatDate(
                        state.waiver.expires_at
                    )}`
                    : "Sem data de término";

        } else {

            elements.waiverRow.classList.add(
                "hidden"
            );

        }


        const reason =
            access?.reason ||
            getReasonFromUrl();


        if (
            reason === "suspended"
        ) {

            elements.actionArea.classList.add(
                "hidden"
            );

            elements.instructions.textContent =
                "A tua conta está suspensa. Contacta a administração para resolver a situação.";

            setStatus(
                "Conta suspensa"
            );

            return;

        }


        if (
            access?.allowed === true
        ) {

            elements.button.textContent =
                "Continuar";

            elements.instructions.textContent =
                "O teu acesso está disponível.";

            elements.button.disabled =
                false;

            setStatus(
                "Acesso disponível"
            );

            return;

        }


        elements.button.textContent =
            "Efetuar pagamento";

        elements.instructions.textContent =
            "Depois de efetuares o pagamento, a administração irá confirmar a transação e ativar o teu acesso.";

        elements.button.disabled =
            false;

        setStatus(
            "Pagamento necessário"
        );

    }


    function formatSubscriptionStatus(
        status
    ) {

        const labels = {

            active:
                "Ativa",

            pending:
                "Pendente",

            expired:
                "Expirada",

            cancelled:
                "Cancelada",

            free:
                "Gratuita"

        };

        return (
            labels[status] ||
            status
        );

    }


    /* ========================================================
       CONTINUE
       ======================================================== */

    async function handlePaymentButton() {

        /*
         * There is currently no automatic payment
         * provider connected.
         *
         * The button therefore takes the user
         * back to the platform when access is already
         * available, otherwise displays the payment
         * instructions.
         */

        if (
            state.access?.allowed === true
        ) {

            window.location.href =
                "index.html";

            return;

        }

        alert(
            "Para regularizar a tua subscrição, efetua o pagamento através do método definido pela administração. Depois envia o comprovativo para confirmação."
        );

    }


    /* ========================================================
       LOGOUT
       ======================================================== */

    async function logout() {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut();

        if (error) {

            console.error(
                "Erro ao terminar sessão:",
                error
            );

            return;

        }

        window.location.href =
            "login.html";

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    async function initialize() {

        setMessage(
            getReasonFromUrl()
        );

        setStatus(
            "A carregar..."
        );

        state.user =
            await loadUser();

        if (!state.user) {

            window.location.href =
                "login.html";

            return;

        }


        const results =
            await Promise.all([
                loadSettings(),
                loadAccess(),
                loadSubscription(),
                loadWaiver()
            ]);

        state.settings =
            results[0];

        state.access =
            results[1];

        state.subscription =
            results[2];

        state.waiver =
            results[3];


        render();

    }


    /* ========================================================
       EVENTS
       ======================================================== */

    if (elements.button) {

        elements.button.addEventListener(
            "click",
            handlePaymentButton
        );

    }


    if (elements.logout) {

        elements.logout.addEventListener(
            "click",
            logout
        );

    }


    initialize();

})();
