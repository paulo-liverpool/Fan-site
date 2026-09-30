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


    window.adminPrivateMessages = {

        load:
            loadAdminPrivateMessages,

        openNew:
            openNewPrivateMessageModal

    };

})();
