/* ============================================================
   BARÇA REAL
   PAYMENT / SUBSCRIPTION PAGE
   ============================================================ */

(function () {

    "use strict";


    const state = {

        user: null,

        settings: null,

        access: null,

        subscription: null,

        waiver: null,

        payments: [],

        submitting: false

    };


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

        subscriptionStatus:
            document.getElementById(
                "payment-subscription-status"
            ),

        form:
            document.getElementById(
                "payment-form"
            ),

        method:
            document.getElementById(
                "payment-method"
            ),

        reference:
            document.getElementById(
                "payment-reference"
            ),

        note:
            document.getElementById(
                "payment-note"
            ),

        button:
            document.getElementById(
                "payment-button"
            ),

        pending:
            document.getElementById(
                "payment-pending"
            ),

        pendingReference:
            document.getElementById(
                "pending-reference"
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

        history:
            document.getElementById(
                "payment-history-list"
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

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
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


    function formatMoney(
        amount,
        currency
    ) {

        try {

            return new Intl.NumberFormat(
                "pt-AO",
                {
                    style: "currency",
                    currency:
                        currency || "AOA",
                    maximumFractionDigits: 0
                }
            ).format(
                Number(amount || 0)
            );

        } catch (error) {

            return `${Number(
                amount || 0
            ).toLocaleString(
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


    function formatDateTime(
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

        return date.toLocaleString(
            "pt-AO",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatPaymentMethod(
        method
    ) {

        const labels = {

            transferencia_bancaria:
                "Transferência bancária",

            multicaixa_express:
                "Multicaixa Express",

            deposito:
                "Depósito bancário",

            outro:
                "Outro"

        };

        return (
            labels[method] ||
            method ||
            "—"
        );

    }


    function formatPaymentStatus(
        status
    ) {

        const labels = {

            pending:
                "Pendente",

            paid:
                "Pago",

            failed:
                "Falhado",

            cancelled:
                "Cancelado"

        };

        return (
            labels[status] ||
            status ||
            "—"
        );

    }


    function getStatusClass(
        status
    ) {

        return `payment-status-${String(
            status || ""
        ).toLowerCase()}`;

    }


    /* ========================================================
       AUTH
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
                "Erro ao carregar utilizador:",
                error
            );

            return null;

        }

        return data?.user || null;

    }


    /* ========================================================
       SETTINGS
       ======================================================== */

    async function loadSettings() {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "platform_settings"
                )
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
       ACCESS
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
       SUBSCRIPTION
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
                .from(
                    "subscriptions"
                )
                .select(
                    `
                    id,
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
       WAIVER
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
                .from(
                    "subscription_waivers"
                )
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
       PAYMENT HISTORY
       ======================================================== */

    async function loadPayments() {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_user_payment_history"
            );

        if (error) {

            console.error(
                "Erro ao carregar histórico:",
                error
            );

            return [];

        }

        if (
            !data ||
            data.success !== true
        ) {

            return [];

        }

        return data.payments || [];

    }


    /* ========================================================
       RENDER HISTORY
       ======================================================== */

    function renderPaymentHistory() {

        if (!state.payments.length) {

            elements.history.innerHTML = `
                <div class="payment-history-item">
                    <div class="payment-history-meta">
                        Ainda não existem pagamentos registados.
                    </div>
                </div>
            `;

            return;

        }


        elements.history.innerHTML =
            state.payments
                .map(
                    payment => {

                        const status =
                            String(
                                payment.status ||
                                ""
                            ).toLowerCase();

                        return `
                            <div class="payment-history-item">

                                <div class="payment-history-top">

                                    <span class="payment-history-amount">
                                        ${escapeHTML(
                                            formatMoney(
                                                payment.amount,
                                                payment.currency
                                            )
                                        )}
                                    </span>

                                    <span
                                        class="payment-history-status ${escapeHTML(
                                            getStatusClass(
                                                status
                                            )
                                        )}"
                                    >
                                        ${escapeHTML(
                                            formatPaymentStatus(
                                                status
                                            )
                                        )}
                                    </span>

                                </div>

                                <div class="payment-history-meta">

                                    <span>
                                        ${escapeHTML(
                                            formatPaymentMethod(
                                                payment.payment_method
                                            )
                                        )}
                                    </span>

                                    <span>
                                        ${escapeHTML(
                                            formatDateTime(
                                                payment.created_at
                                            )
                                        )}
                                    </span>

                                </div>

                                <div class="payment-history-reference">

                                    Referência:
                                    ${escapeHTML(
                                        payment.transaction_reference ||
                                        "—"
                                    )}

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    /* ========================================================
       RENDER
       ======================================================== */

    function render() {

        const settings =
            state.settings || {};

        const subscription =
            state.subscription;

        const currency =
            settings.currency ||
            subscription?.currency ||
            "AOA";

        const price =
            settings.monthly_price ??
            subscription?.monthly_price ??
            0;


        elements.price.textContent =
            formatMoney(
                price,
                currency
            );


        elements.subscriptionStatus.textContent =
            subscription?.status
                ? formatSubscriptionStatus(
                    subscription.status
                )
                : "Sem subscrição";


        /* ====================================================
           GRACE
           ==================================================== */

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


        /* ====================================================
           WAIVER
           ==================================================== */

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


        /* ====================================================
           ACTIVE ACCESS
           ==================================================== */

        if (
            state.access?.allowed === true
        ) {

            elements.form.classList.add(
                "hidden"
            );

            elements.pending.classList.add(
                "hidden"
            );

            elements.status.textContent =
                "O teu acesso está disponível.";

            elements.message.textContent =
                "A tua subscrição está ativa.";

            elements.instructions.textContent =
                "O teu acesso está disponível. Podes continuar para a plataforma.";

            elements.button.textContent =
                "Continuar";

            elements.button.disabled =
                false;

            elements.button.onclick =
                function () {

                    window.location.href =
                        "index.html";

                };

            return;

        }


        /* ====================================================
           PENDING PAYMENT
           ==================================================== */

        const pendingPayment =
            state.payments.find(
                payment =>
                    payment.status ===
                    "pending"
            );


        if (pendingPayment) {

            elements.form.classList.add(
                "hidden"
            );

            elements.pending.classList.remove(
                "hidden"
            );

            elements.pendingReference.textContent =
                `Referência: ${
                    pendingPayment.transaction_reference ||
                    "—"
                }`;

            elements.status.textContent =
                "Pagamento pendente de confirmação.";

            elements.message.textContent =
                "Recebemos o teu registo de pagamento.";

            elements.instructions.textContent =
                "A administração irá confirmar o pagamento. Depois da confirmação, o teu acesso será ativado.";

            return;

        }


        /* ====================================================
           SUSPENDED
           ==================================================== */

        if (
            state.access?.reason ===
            "suspended"
        ) {

            elements.form.classList.add(
                "hidden"
            );

            elements.pending.classList.add(
                "hidden"
            );

            elements.status.textContent =
                "Conta suspensa.";

            elements.message.textContent =
                "A tua conta está suspensa.";

            elements.instructions.textContent =
                "Contacta a administração para resolver a situação.";

            return;

        }


        /* ====================================================
           PAYMENT REQUIRED
           ==================================================== */

        elements.form.classList.remove(
            "hidden"
        );

        elements.pending.classList.add(
            "hidden"
        );

        elements.status.textContent =
            "Pagamento necessário.";

        elements.message.textContent =
            "A tua subscrição precisa de ser regularizada.";

        elements.button.textContent =
            "Enviar pagamento para confirmação";

        elements.button.disabled =
            false;

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
       SUBMIT PAYMENT
       ======================================================== */

    async function submitPayment() {

        if (state.submitting) {
            return;
        }


        const method =
            elements.method.value.trim();

        const reference =
            elements.reference.value.trim();

        const note =
            elements.note.value.trim();


        if (!method) {

            alert(
                "Seleciona o método de pagamento."
            );

            elements.method.focus();

            return;

        }


        if (!reference) {

            alert(
                "Introduz a referência da transação."
            );

            elements.reference.focus();

            return;

        }


        state.submitting =
            true;

        elements.button.disabled =
            true;

        elements.button.textContent =
            "A enviar...";


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "submit_user_payment",
                {
                    payment_method_value:
                        method,

                    payment_reference_value:
                        reference,

                    payment_note_value:
                        note || null
                }
            );


        state.submitting =
            false;


        if (error) {

            console.error(
                "Erro ao enviar pagamento:",
                error
            );

            elements.button.disabled =
                false;

            elements.button.textContent =
                "Enviar pagamento para confirmação";

            alert(
                "Não foi possível registar o pagamento. Tenta novamente."
            );

            return;

        }


        if (
            !data ||
            data.success !== true
        ) {

            elements.button.disabled =
                false;

            elements.button.textContent =
                "Enviar pagamento para confirmação";

            const messages = {

                payment_method_required:
                    "Seleciona o método de pagamento.",

                payment_reference_required:
                    "Introduz a referência da transação.",

                payments_inactive:
                    "Os pagamentos estão temporariamente desativados.",

                price_not_configured:
                    "O preço da subscrição ainda não foi configurado.",

                settings_not_found:
                    "As definições de pagamento não estão disponíveis."

            };

            alert(
                messages[data?.reason] ||
                "Não foi possível registar o pagamento."
            );

            return;

        }


        elements.reference.value =
            "";

        elements.note.value =
            "";

        await refreshPageData();

        alert(
            data.existing
                ? "Já existe um pagamento pendente para a tua conta."
                : "Pagamento enviado para confirmação."
        );

    }


    /* ========================================================
       REFRESH
       ======================================================== */

    async function refreshPageData() {

        const results =
            await Promise.all([
                loadAccess(),
                loadSubscription(),
                loadWaiver(),
                loadPayments()
            ]);

        state.access =
            results[0];

        state.subscription =
            results[1];

        state.waiver =
            results[2];

        state.payments =
            results[3];

        render();

        renderPaymentHistory();

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
                loadWaiver(),
                loadPayments()
            ]);


        state.settings =
            results[0];

        state.access =
            results[1];

        state.subscription =
            results[2];

        state.waiver =
            results[3];

        state.payments =
            results[4];


        render();

        renderPaymentHistory();

    }


    /* ========================================================
       EVENTS
       ======================================================== */

    elements.button.addEventListener(
        "click",
        submitPayment
    );


    elements.logout.addEventListener(
        "click",
        logout
    );


    initialize();

})();
