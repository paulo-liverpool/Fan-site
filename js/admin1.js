/* ============================================================
   BARÇA REAL — ADMIN 1
   PRIVATE MESSAGES
   ============================================================ */

(function () {

    "use strict";


    const state = {

        messages: [],

        filteredMessages: [],

        selectedMessage: null,

        search: "",

        initialized: false

    };


    /* ========================================================
       HELPERS
       ======================================================== */

    function escapeHTMLLocal(value) {

        if (typeof escapeHTML === "function") {
            return escapeHTML(value ?? "");
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttributeLocal(value) {

        if (typeof escapeAttribute === "function") {
            return escapeAttribute(value ?? "");
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }


    function formatDateTime(value) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return "—";
        }


        return date.toLocaleString(
            "pt-PT",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function getPersonName(person) {

        return (
            person?.display_name ||
            person?.username ||
            person?.email ||
            "Utilizador"
        );

    }


    function getInitial(person) {

        return getPersonName(person)
            .charAt(0)
            .toUpperCase();

    }


    /* ========================================================
       LOAD MESSAGES
       ======================================================== */

    async function loadAdminPrivateMessages() {

        const results =
            document.getElementById(
                "admin-private-messages-results"
            );


        if (results) {

            results.innerHTML = `

                <div class="users-loading">
                    A carregar as mensagens...
                </div>

            `;

        }


        try {

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "admin_get_private_messages"
            );


            if (error) {
                throw error;
            }


            state.messages =
                Array.isArray(data)
                    ? data
                    : [];


            state.filteredMessages =
                [...state.messages];


            renderAdminPrivateMessages();


        } catch (error) {

            console.error(
                "Erro ao carregar mensagens privadas:",
                error
            );


            if (results) {

                results.innerHTML = `

                    <div class="users-empty">

                        <strong>
                            Não foi possível carregar as mensagens.
                        </strong>

                        <span>
                            ${escapeHTMLLocal(
                                error.message ||
                                "Ocorreu um erro."
                            )}
                        </span>

                    </div>

                `;

            }

        }

    }


    /* ========================================================
       FILTER
       ======================================================== */

    function filterAdminPrivateMessages() {

        const query =
            state.search
                .trim()
                .toLowerCase();


        if (!query) {

            state.filteredMessages =
                [...state.messages];

            return;
        }


        state.filteredMessages =
            state.messages.filter(
                message => {

                    const sender =
                        message.sender || {};

                    const recipient =
                        message.recipient || {};


                    const searchable = [

                        sender.display_name,

                        sender.username,

                        sender.email,

                        recipient.display_name,

                        recipient.username,

                        recipient.email,

                        message.subject,

                        message.body

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchable.includes(
                        query
                    );

                }
            );

    }


    /* ========================================================
       RENDER
       ======================================================== */

    function renderAdminPrivateMessages() {

        filterAdminPrivateMessages();


        const results =
            document.getElementById(
                "admin-private-messages-results"
            );


        const count =
            document.getElementById(
                "admin-private-messages-count"
            );


        if (count) {

            count.textContent =
                state.filteredMessages.length;

        }


        if (!results) {
            return;
        }


        if (!state.filteredMessages.length) {

            results.innerHTML = `

                <div class="users-empty">

                    <strong>
                        Nenhuma mensagem encontrada.
                    </strong>

                    <span>
                        Não existem mensagens que correspondam à pesquisa.
                    </span>

                </div>

            `;

            return;
        }


        results.innerHTML = `

            <div class="admin-private-message-list">

                ${state.filteredMessages
                    .map(
                        message =>
                            renderPrivateMessageRow(
                                message
                            )
                    )
                    .join("")}

            </div>

        `;


        bindPrivateMessageRows();

    }


    function renderPrivateMessageRow(
        message
    ) {

        const sender =
            message.sender || {};

        const recipient =
            message.recipient || {};


        const senderName =
            getPersonName(sender);


        const recipientName =
            getPersonName(recipient);


        const unread =
            !message.read_at;


        return `

            <button
                type="button"
                class="admin-private-message-row ${
                    unread
                        ? "is-unread"
                        : ""
                }"
                data-private-message-id="${escapeAttributeLocal(
                    message.id
                )}"
            >

                <div class="admin-private-message-avatar">

                    ${escapeHTMLLocal(
                        getInitial(sender)
                    )}

                </div>


                <div class="admin-private-message-main">

                    <div class="admin-private-message-top">

                        <strong>
                            ${escapeHTMLLocal(
                                senderName
                            )}
                        </strong>

                        <span>
                            ${escapeHTMLLocal(
                                formatDateTime(
                                    message.sent_at
                                )
                            )}
                        </span>

                    </div>


                    <div class="admin-private-message-recipient">

                        Para:
                        ${escapeHTMLLocal(
                            recipientName
                        )}

                    </div>


                    <div class="admin-private-message-subject">

                        ${escapeHTMLLocal(
                            message.subject
                        )}

                    </div>


                    <div class="admin-private-message-preview">

                        ${escapeHTMLLocal(
                            message.body
                        )}

                    </div>

                </div>


                ${
                    unread
                        ? `
                            <span class="admin-private-message-unread">
                                Não lida
                            </span>
                        `
                        : ""
                }

            </button>

        `;

    }


    /* ========================================================
       ROW ACTIONS
       ======================================================== */

    function bindPrivateMessageRows() {

        document
            .querySelectorAll(
                "[data-private-message-id]"
            )
            .forEach(row => {

                row.addEventListener(
                    "click",
                    async () => {

                        const id =
                            row.dataset.privateMessageId;


                        await openPrivateMessage(
                            id
                        );

                    }
                );

            });

    }


    /* ========================================================
       OPEN MESSAGE
       ======================================================== */

    async function openPrivateMessage(
        id
    ) {

        const message =
            state.messages.find(
                item =>
                    item.id === id
            );


        if (!message) {
            return;
        }


        state.selectedMessage =
            message;


        await markPrivateMessageRead(
            message
        );


        renderPrivateMessageModal(
            message
        );

    }


    /* ========================================================
       MARK READ
       ======================================================== */

    async function markPrivateMessageRead(
        message
    ) {

        if (message.read_at) {
            return;
        }


        try {

            const {
                error
            } = await supabaseClient.rpc(
                "admin_mark_private_message_read",
                {
                    target_message_id:
                        message.id
                }
            );


            if (error) {
                throw error;
            }


            message.read_at =
                new Date().toISOString();


            renderAdminPrivateMessages();


        } catch (error) {

            console.error(
                "Erro ao marcar mensagem como lida:",
                error
            );

        }

    }


    /* ========================================================
       MESSAGE MODAL
       ======================================================== */

    function renderPrivateMessageModal(
        message
    ) {

        closePrivateMessageModal();


        const sender =
            message.sender || {};

        const recipient =
            message.recipient || {};


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "admin-private-message-modal";


        modal.className =
            "admin-modal-overlay";


        modal.innerHTML = `

            <div class="admin-modal admin-private-message-modal">

                <div class="admin-modal-header">

                    <div>

                        <span class="admin-modal-eyebrow">
                            MENSAGEM PRIVADA
                        </span>

                        <h2>
                            ${escapeHTMLLocal(
                                message.subject
                            )}
                        </h2>

                        <p class="admin-modal-subtitle">
                            ${escapeHTMLLocal(
                                formatDateTime(
                                    message.sent_at
                                )
                            )}
                        </p>

                    </div>


                    <button
                        type="button"
                        class="admin-modal-close"
                        id="close-private-message-modal"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>


                <div class="admin-private-message-details">

                    <div class="admin-private-message-person">

                        <span>
                            De
                        </span>

                        <strong>
                            ${escapeHTMLLocal(
                                getPersonName(sender)
                            )}
                        </strong>

                        <small>
                            ${escapeHTMLLocal(
                                sender.email ||
                                sender.username ||
                                ""
                            )}
                        </small>

                    </div>


                    <div class="admin-private-message-person">

                        <span>
                            Para
                        </span>

                        <strong>
                            ${escapeHTMLLocal(
                                getPersonName(recipient)
                            )}
                        </strong>

                        <small>
                            ${escapeHTMLLocal(
                                recipient.email ||
                                recipient.username ||
                                ""
                            )}
                        </small>

                    </div>

                </div>


                <div class="admin-private-message-body">

                    ${escapeHTMLLocal(
                        message.body
                    )}

                </div>


                <div class="admin-modal-actions">

                    <button
                        type="button"
                        class="admin-button secondary"
                        id="close-private-message-button"
                    >
                        Fechar
                    </button>


                    <button
                        type="button"
                        class="admin-button primary"
                        id="reply-private-message-button"
                    >
                        Responder
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        const close = () => {

            closePrivateMessageModal();

        };


        document
            .getElementById(
                "close-private-message-modal"
            )
            ?.addEventListener(
                "click",
                close
            );


        document
            .getElementById(
                "close-private-message-button"
            )
            ?.addEventListener(
                "click",
                close
            );


        document
            .getElementById(
                "reply-private-message-button"
            )
            ?.addEventListener(
                "click",
                () => {

                    close();

                    openNewPrivateMessageModal(
                        recipient
                    );

                }
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    close();
                }

            }
        );

    }


    function closePrivateMessageModal() {

        const modal =
            document.getElementById(
                "admin-private-message-modal"
            );


        if (modal) {
            modal.remove();
        }

    }


    /* ========================================================
       NEW MESSAGE
       ======================================================== */

    function openNewPrivateMessageModal(
        recipient = null
    ) {

        closePrivateMessageModal();


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "admin-new-private-message-modal";


        modal.className =
            "admin-modal-overlay";


        modal.innerHTML = `

            <div class="admin-modal">

                <div class="admin-modal-header">

                    <div>

                        <span class="admin-modal-eyebrow">
                            MENSAGENS
                        </span>

                        <h2>
                            Nova mensagem
                        </h2>

                        <p class="admin-modal-subtitle">
                            Enviar uma mensagem privada
                        </p>

                    </div>


                    <button
                        type="button"
                        class="admin-modal-close"
                        id="close-new-private-message-modal"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>


                <form id="admin-new-private-message-form">

                    <div class="admin-form-group">

                        <label for="private-message-recipient">
                            Destinatário
                        </label>

                        <input
                            type="text"
                            id="private-message-recipient"
                            value="${escapeAttributeLocal(
                                recipient
                                    ? getPersonName(recipient)
                                    : ""
                            )}"
                            placeholder="Nome, username ou email"
                            ${
                                recipient
                                    ? "disabled"
                                    : ""
                            }
                            autocomplete="off"
                        >

                        <input
                            type="hidden"
                            id="private-message-recipient-id"
                            value="${escapeAttributeLocal(
                                recipient?.id ||
                                ""
                            )}"
                        >

                        ${
                            recipient
                                ? ""
                                : `
                                    <div
                                        id="private-message-recipient-results"
                                        class="admin-private-recipient-results"
                                    ></div>
                                `
                        }

                    </div>


                    <div class="admin-form-group">

                        <label for="private-message-subject">
                            Assunto
                        </label>

                        <input
                            type="text"
                            id="private-message-subject"
                            maxlength="200"
                            placeholder="Assunto da mensagem"
                            required
                        >

                    </div>


                    <div class="admin-form-group">

                        <label for="private-message-body">
                            Mensagem
                        </label>

                        <textarea
                            id="private-message-body"
                            rows="7"
                            maxlength="5000"
                            placeholder="Escreve a mensagem..."
                            required
                        ></textarea>

                    </div>


                    <div
                        id="private-message-form-message"
                        class="admin-form-message"
                    ></div>


                    <div class="admin-modal-actions">

                        <button
                            type="button"
                            class="admin-button secondary"
                            id="cancel-new-private-message"
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            class="admin-button primary"
                            id="send-private-message"
                        >
                            Enviar mensagem
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "close-new-private-message-modal"
            )
            ?.addEventListener(
                "click",
                close
            );


        document
            .getElementById(
                "cancel-new-private-message"
            )
            ?.addEventListener(
                "click",
                close
            );


        document
            .getElementById(
                "admin-new-private-message-form"
            )
            ?.addEventListener(
                "submit",
                sendAdminPrivateMessage
            );


        if (!recipient) {

            setupRecipientSearch();

        }


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    close();
                }

            }
        );


        function close() {

            const current =
                document.getElementById(
                    "admin-new-private-message-modal"
                );


            if (current) {
                current.remove();
            }

        }

    }


    /* ========================================================
       RECIPIENT SEARCH
       ======================================================== */

    let recipientSearchTimer =
        null;


    function setupRecipientSearch() {

        const input =
            document.getElementById(
                "private-message-recipient"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                clearTimeout(
                    recipientSearchTimer
                );


                recipientSearchTimer =
                    setTimeout(
                        () =>
                            searchMessageRecipients(
                                input.value
                            ),
                        250
                    );

            }
        );

    }


    async function searchMessageRecipients(
        query
    ) {

        const results =
            document.getElementById(
                "private-message-recipient-results"
            );


        if (!results) {
            return;
        }


        const value =
            query.trim();


        if (value.length < 2) {

            results.innerHTML = "";

            return;
        }


        try {

            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .select(
                    "id, display_name, username, supported_team_id, is_active"
                )
                .eq(
                    "is_active",
                    true
                )
                .or(
                    `display_name.ilike.%${value}%,username.ilike.%${value}%`
                )
                .limit(10);


            if (error) {
                throw error;
            }


            if (!data?.length) {

                results.innerHTML = `

                    <div class="admin-private-recipient-empty">
                        Nenhum utilizador encontrado.
                    </div>

                `;

                return;
            }


            results.innerHTML =
                data
                    .filter(
                        user =>
                            user.id !==
                            currentAdmin?.user?.id
                    )
                    .map(
                        user => `

                            <button
                                type="button"
                                class="admin-private-recipient"
                                data-recipient-id="${escapeAttributeLocal(
                                    user.id
                                )}"
                                data-recipient-name="${escapeAttributeLocal(
                                    getPersonName(user)
                                )}"
                            >

                                <strong>
                                    ${escapeHTMLLocal(
                                        getPersonName(user)
                                    )}
                                </strong>

                                ${
                                    user.username
                                        ? `
                                            <span>
                                                @${escapeHTMLLocal(
                                                    user.username
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </button>

                        `
                    )
                    .join("");


            results
                .querySelectorAll(
                    "[data-recipient-id]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const id =
                                    button.dataset.recipientId;

                                const name =
                                    button.dataset.recipientName;


                                document.getElementById(
                                    "private-message-recipient-id"
                                ).value = id;


                                const input =
                                    document.getElementById(
                                        "private-message-recipient"
                                    );


                                input.value =
                                    name;


                                results.innerHTML =
                                    "";

                            }
                        );

                    }
                );


        } catch (error) {

            console.error(
                "Erro ao pesquisar destinatários:",
                error
            );


            results.innerHTML = `

                <div class="admin-private-recipient-empty">
                    Não foi possível pesquisar utilizadores.
                </div>

            `;

        }

    }


    /* ========================================================
       SEND MESSAGE
       ======================================================== */

    async function sendAdminPrivateMessage(
        event
    ) {

        event.preventDefault();


        const recipient =
            document.getElementById(
                "private-message-recipient-id"
            )?.value;


        const subject =
            document.getElementById(
                "private-message-subject"
            )?.value
            ?.trim();


        const body =
            document.getElementById(
                "private-message-body"
            )?.value
            ?.trim();


        const message =
            document.getElementById(
                "private-message-form-message"
            );


        const button =
            document.getElementById(
                "send-private-message"
            );


        if (!recipient) {

            if (message) {
                message.textContent =
                    "Selecciona um destinatário.";
            }

            return;
        }


        if (!subject) {

            if (message) {
                message.textContent =
                    "O assunto é obrigatório.";
            }

            return;
        }


        if (!body) {

            if (message) {
                message.textContent =
                    "A mensagem não pode estar vazia.";
            }

            return;
        }


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "A enviar...";

        }


        try {

            const {
                error
            } = await supabaseClient.rpc(
                "admin_send_private_message",
                {
                    target_recipient_id:
                        recipient,

                    message_subject:
                        subject,

                    message_body:
                        body,

                    message_type:
                        "general"
                }
            );


            if (error) {
                throw error;
            }


            if (message) {

                message.textContent =
                    "Mensagem enviada com sucesso.";

            }


            await loadAdminPrivateMessages();


            setTimeout(
                () => {

                    const modal =
                        document.getElementById(
                            "admin-new-private-message-modal"
                        );


                    if (modal) {
                        modal.remove();
                    }

                },
                500
            );


        } catch (error) {

            console.error(
                "Erro ao enviar mensagem privada:",
                error
            );


            if (message) {

                message.textContent =
                    error.message ||
                    "Não foi possível enviar a mensagem.";

            }


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Enviar mensagem";

            }

        }

    }


    /* ========================================================
       SEARCH
       ======================================================== */

    function setupPrivateMessageSearch() {

        const input =
            document.getElementById(
                "admin-private-messages-search"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                state.search =
                    input.value;


                renderAdminPrivateMessages();

            }
        );

    }


    /* ========================================================
       NEW MESSAGE BUTTON
       ======================================================== */

    function setupNewMessageButton() {

        document
            .getElementById(
                "admin-new-private-message-button"
            )
            ?.addEventListener(
                "click",
                () =>
                    openNewPrivateMessageModal()
            );

    }


    /* ========================================================
       INITIALIZATION
       ======================================================== */

    function initAdminPrivateMessages() {

        if (state.initialized) {
            return;
        }


        state.initialized =
            true;


        setupPrivateMessageSearch();

        setupNewMessageButton();

    }


    /* ========================================================
       NAVIGATION HOOK
       ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initAdminPrivateMessages();

        }
    );


      /* ========================================================
       PAYMENT SETTINGS
       ======================================================== */

    const paymentSettingsState = {

        settings: null,

        loading: false,

        saving: false

    };


    /* ========================================================
       PAYMENT SETTINGS — HELPERS
       ======================================================== */

    function getPaymentElement(id) {

        return document.getElementById(id);

    }


    function formatPaymentAmount(
        amount,
        currency
    ) {

        const value =
            Number(amount || 0);


        return new Intl.NumberFormat(
            "pt-AO",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(value) +
        " " +
        (currency || "AOA");

    }


    function formatPaymentDate(value) {

        if (!value) {
            return "Ainda não actualizado";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Ainda não actualizado";

        }


        return date.toLocaleString(
            "pt-AO",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function showPaymentSettingsMessage(
        message,
        type = "success"
    ) {

        if (
            typeof window.showAdminToast ===
            "function"
        ) {

            window.showAdminToast(
                message,
                type
            );

            return;

        }


        alert(message);

    }


    /* ========================================================
       PAYMENT SETTINGS — LOAD
       ======================================================== */

    async function loadPaymentSettings() {

        if (
            paymentSettingsState.loading
        ) {
            return;
        }


        paymentSettingsState.loading =
            true;


        try {

            const {
                data,
                error
            } = await supabaseClient
                .from("platform_settings")
                .select(`
                    id,
                    payments_active,
                    enforce_payment,
                    monthly_price,
                    currency,
                    grace_period_days,
                    updated_by,
                    updated_at
                `)
                .eq(
                    "id",
                    "global"
                )
                .maybeSingle();


            if (error) {
                throw error;
            }


            if (!data) {

                throw new Error(
                    "A configuração global da plataforma não foi encontrada."
                );

            }


            paymentSettingsState.settings =
                data;


            populatePaymentSettings(
                data
            );


        } catch (error) {

            console.error(
                "Erro ao carregar configurações de pagamento:",
                error
            );


            showPaymentSettingsMessage(
                error.message ||
                "Não foi possível carregar as configurações de pagamento.",
                "error"
            );


        } finally {

            paymentSettingsState.loading =
                false;

        }

    }


    /* ========================================================
       PAYMENT SETTINGS — POPULATE
       ======================================================== */

    function populatePaymentSettings(
        settings
    ) {

        const paymentsActive =
            getPaymentElement(
                "payment-setting-payments-active"
            );


        const enforcePayment =
            getPaymentElement(
                "payment-setting-enforce-payment"
            );


        const monthlyPrice =
            getPaymentElement(
                "payment-setting-monthly-price"
            );


        const currency =
            getPaymentElement(
                "payment-setting-currency"
            );


        const gracePeriod =
            getPaymentElement(
                "payment-setting-grace-period"
            );


        if (paymentsActive) {

            paymentsActive.checked =
                Boolean(
                    settings.payments_active
                );

        }


        if (enforcePayment) {

            enforcePayment.checked =
                Boolean(
                    settings.enforce_payment
                );

        }


        if (monthlyPrice) {

            monthlyPrice.value =
                settings.monthly_price ??
                0;

        }


        if (currency) {

            currency.value =
                settings.currency ||
                "AOA";

        }


        if (gracePeriod) {

            gracePeriod.value =
                settings.grace_period_days ??
                7;

        }


        updatePaymentCurrencyLabel();

        updatePaymentSummary();

        updatePaymentLastUpdated(
            settings.updated_at
        );

    }


    /* ========================================================
       PAYMENT SETTINGS — FORM VALUES
       ======================================================== */

    function getPaymentFormValues() {

        return {

            payments_active:
                Boolean(
                    getPaymentElement(
                        "payment-setting-payments-active"
                    )?.checked
                ),

            enforce_payment:
                Boolean(
                    getPaymentElement(
                        "payment-setting-enforce-payment"
                    )?.checked
                ),

            monthly_price:
                Number(
                    getPaymentElement(
                        "payment-setting-monthly-price"
                    )?.value || 0
                ),

            currency:
                getPaymentElement(
                    "payment-setting-currency"
                )?.value ||
                "AOA",

            grace_period_days:
                Number(
                    getPaymentElement(
                        "payment-setting-grace-period"
                    )?.value || 0
                )

        };

    }


    /* ========================================================
       PAYMENT SETTINGS — SUMMARY
       ======================================================== */

    function updatePaymentSummary() {

        const settings =
            getPaymentFormValues();


        const price =
            getPaymentElement(
                "payment-summary-price"
            );


        const status =
            getPaymentElement(
                "payment-summary-status"
            );


        const enforce =
            getPaymentElement(
                "payment-summary-enforce"
            );


        const grace =
            getPaymentElement(
                "payment-summary-grace"
            );


        if (price) {

            price.textContent =
                formatPaymentAmount(
                    settings.monthly_price,
                    settings.currency
                );

        }


        if (status) {

            status.textContent =
                settings.payments_active
                    ? "Activos"
                    : "Inactivos";

        }


        if (enforce) {

            enforce.textContent =
                settings.enforce_payment
                    ? "Sim"
                    : "Não";

        }


        if (grace) {

            grace.textContent =
                `${settings.grace_period_days} dias`;

        }

    }


    function updatePaymentCurrencyLabel() {

        const currency =
            getPaymentElement(
                "payment-setting-currency"
            );


        const label =
            getPaymentElement(
                "payment-setting-currency-label"
            );


        if (
            currency &&
            label
        ) {

            label.textContent =
                currency.value ||
                "AOA";

        }

    }


    function updatePaymentLastUpdated(
        value
    ) {

        const element =
            getPaymentElement(
                "payment-settings-last-updated"
            );


        if (!element) {
            return;
        }


        element.textContent =
            "Última alteração: " +
            formatPaymentDate(value);

    }


    /* ========================================================
       PAYMENT SETTINGS — VALIDATION
       ======================================================== */

    function validatePaymentSettings(
        settings
    ) {

        if (
            !Number.isFinite(
                settings.monthly_price
            ) ||
            settings.monthly_price < 0
        ) {

            return "O preço mensal não pode ser negativo.";

        }


        if (
            !Number.isInteger(
                settings.grace_period_days
            ) ||
            settings.grace_period_days < 0
        ) {

            return "O período de tolerância deve ser um número inteiro igual ou superior a zero.";

        }


        if (
            !settings.currency
        ) {

            return "Seleccione uma moeda.";

        }


        if (
            settings.enforce_payment &&
            !settings.payments_active
        ) {

            return "Não é possível exigir pagamentos enquanto o sistema de pagamentos estiver inactivo.";

        }


        return null;

    }


    /* ========================================================
       PAYMENT SETTINGS — SAVE
       ======================================================== */

    async function savePaymentSettings() {

        if (
            paymentSettingsState.saving
        ) {
            return;
        }


        const settings =
            getPaymentFormValues();


        const validationError =
            validatePaymentSettings(
                settings
            );


        if (validationError) {

            showPaymentSettingsMessage(
                validationError,
                "error"
            );

            return;

        }


        paymentSettingsState.saving =
            true;


        const button =
            getPaymentElement(
                "save-payment-settings-button"
            );


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "A guardar...";

        }


        try {

            const {
                data: {
                    user
                } = {},
                error: userError
            } =
                await supabaseClient
                    .auth
                    .getUser();


            if (userError) {
                throw userError;
            }


            if (!user) {

                throw new Error(
                    "Sessão de administrador não encontrada."
                );

            }


            const {
                data,
                error
            } = await supabaseClient
                .from("platform_settings")
                .update({

                    payments_active:
                        settings.payments_active,

                    enforce_payment:
                        settings.enforce_payment,

                    monthly_price:
                        settings.monthly_price,

                    currency:
                        settings.currency,

                    grace_period_days:
                        settings.grace_period_days,

                    updated_by:
                        user.id,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    "global"
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            paymentSettingsState.settings =
                data;


            populatePaymentSettings(
                data
            );


            showPaymentSettingsMessage(
                "Configurações de pagamento guardadas com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao guardar configurações:",
                error
            );


            showPaymentSettingsMessage(
                error.message ||
                "Não foi possível guardar as configurações.",
                "error"
            );


        } finally {

            paymentSettingsState.saving =
                false;


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Guardar configurações";

            }

        }

    }


    /* ========================================================
       PAYMENT SETTINGS — EVENTS
       ======================================================== */

    function bindPaymentSettingsEvents() {

        const saveButton =
            getPaymentElement(
                "save-payment-settings-button"
            );


        const currency =
            getPaymentElement(
                "payment-setting-currency"
            );


        const monthlyPrice =
            getPaymentElement(
                "payment-setting-monthly-price"
            );


        const gracePeriod =
            getPaymentElement(
                "payment-setting-grace-period"
            );


        const paymentsActive =
            getPaymentElement(
                "payment-setting-payments-active"
            );


        const enforcePayment =
            getPaymentElement(
                "payment-setting-enforce-payment"
            );


        saveButton?.addEventListener(
            "click",
            savePaymentSettings
        );


        currency?.addEventListener(
            "change",
            () => {

                updatePaymentCurrencyLabel();

                updatePaymentSummary();

            }
        );


        monthlyPrice?.addEventListener(
            "input",
            updatePaymentSummary
        );


        gracePeriod?.addEventListener(
            "input",
            updatePaymentSummary
        );


        paymentsActive?.addEventListener(
            "change",
            updatePaymentSummary
        );


        enforcePayment?.addEventListener(
            "change",
            updatePaymentSummary
        );

    }


    /* ========================================================
       INITIALIZATION
       ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initAdminPrivateMessages();

            bindPaymentSettingsEvents();

        }
    );


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.adminPrivateMessages = {

        load:
            loadAdminPrivateMessages,

        openNew:
            openNewPrivateMessageModal

    };


    window.adminPaymentSettings = {

        load:
            loadPaymentSettings

    };


})();
