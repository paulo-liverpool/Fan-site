// ============================================================
// BARÇA REAL
// PROFILE PAGE
// ============================================================

let profileUser = null;
let profileData = null;
let profilePreferences = null;
let profileTeam = null;
let profileSubscription = null;
let platformSettings = null;


// ============================================================
// HELPERS
// ============================================================

function $(selector) {
    return document.querySelector(selector);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    try {

        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(
            new Date(value)
        );

    } catch {

        return "—";
    }
}


function formatMoney(
    amount,
    currency = "AOA"
) {

    const value =
        Number(amount || 0);

    return new Intl.NumberFormat(
        "pt-PT",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(value)
        + " "
        + currency;
}


function getInitials(name) {

    const value =
        String(name || "U")
            .trim();

    if (!value) {
        return "U";
    }

    const parts =
        value.split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .charAt(0)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}


function showToast(message) {

    const toast =
        $("#profile-toast");

    if (!toast) return;

    toast.textContent =
        message;

    toast.hidden = false;

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {

            toast.hidden = true;

        }, 3000);
}


function getClient() {

    if (
        typeof getSupabase ===
        "function"
    ) {
        return getSupabase();
    }

    if (
        typeof supabaseClient !==
        "undefined"
    ) {
        return supabaseClient;
    }

    return null;
}


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupProfileInteractions();

        await loadProfilePage();

    }
);


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfilePage() {

    const client =
        getClient();

    if (!client) {

        showToast(
            "Supabase não está disponível."
        );

        return;
    }


    try {

        const {
            data: {
                user
            },
            error: authError
        } =
            await client.auth.getUser();


        if (authError) {
            throw authError;
        }


        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        profileUser =
            user;


        await loadProfileData(
            client
        );


        await loadPreferences(
            client
        );


        await loadTeam(
            client
        );


        await loadSubscription(
            client
        );


        await loadPlatformSettings(
            client
        );


        await loadUnreadMessages(
            client
        );


        renderProfile();

    } catch (error) {

        console.error(
            "BR PROFILE: erro ao carregar:",
            error
        );

        showToast(
            "Não foi possível carregar o perfil."
        );
    }
}


// ============================================================
// PROFILE DATA
// ============================================================

async function loadProfileData(
    client
) {

    const {
        data,
        error
    } =
        await client
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                supported_team_id,
                role_id,
                avatar_url,
                bio,
                is_active,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                profileUser.id
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    profileData =
        data || {

            id:
                profileUser.id,

            username:
                null,

            display_name:
                profileUser.email
                    ?.split("@")[0] ||
                "Utilizador",

            avatar_url:
                null,

            bio:
                null

        };
}


// ============================================================
// PREFERENCES
// ============================================================

async function loadPreferences(
    client
) {

    const {
        data,
        error
    } =
        await client
            .from("user_preferences")
            .select(`
                user_id,
                language,
                notify_replies,
                notify_reactions,
                notify_mentions,
                email_notifications,
                profile_visibility,
                activity_visibility
            `)
            .eq(
                "user_id",
                profileUser.id
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (data) {

        profilePreferences =
            data;

        return;
    }


    const defaults = {

        user_id:
            profileUser.id,

        language:
            "pt",

        notify_replies:
            true,

        notify_reactions:
            true,

        notify_mentions:
            true,

        email_notifications:
            true,

        profile_visibility:
            "public",

        activity_visibility:
            "public"

    };


    const {
        data: inserted,
        error: insertError
    } =
        await client
            .from("user_preferences")
            .insert(
                defaults
            )
            .select()
            .single();


    if (insertError) {
        throw insertError;
    }


    profilePreferences =
        inserted;
}


// ============================================================
// TEAM
// ============================================================

async function loadTeam(
    client
) {

    if (
        !profileData ||
        !profileData.supported_team_id
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await client
            .from("teams")
            .select(`
                id,
                name,
                slug,
                short_name,
                primary_color,
                secondary_color,
                loading_player
            `)
            .eq(
                "id",
                profileData.supported_team_id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "BR PROFILE: erro equipa:",
            error
        );

        return;
    }


    profileTeam =
        data;
}


// ============================================================
// SUBSCRIPTION
// ============================================================

async function loadSubscription(
    client
) {

    const {
        data,
        error
    } =
        await client
            .from("subscriptions")
            .select(`
                id,
                user_id,
                status,
                monthly_price,
                currency,
                current_period_start,
                current_period_end,
                next_payment_due_at,
                grace_until,
                auto_renew,
                admin_note
            `)
            .eq(
                "user_id",
                profileUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "BR PROFILE: erro subscrição:",
            error
        );

        return;
    }


    profileSubscription =
        data;
}


// ============================================================
// PLATFORM SETTINGS
// ============================================================

async function loadPlatformSettings(
    client
) {

    const {
        data,
        error
    } =
        await client
            .from("platform_settings")
            .select(`
                id,
                payments_active,
                enforce_payment,
                monthly_price,
                currency,
                grace_period_days
            `)
            .eq(
                "id",
                "global"
            )
            .maybeSingle();


    if (error) {

        console.error(
            "BR PROFILE: erro settings:",
            error
        );

        return;
    }


    platformSettings =
        data;
}


// ============================================================
// UNREAD MESSAGES
// ============================================================

async function loadUnreadMessages(
    client
) {

    const {
        data,
        error
    } =
        await client
            .from("private_messages")
            .select("id")
            .eq(
                "recipient_id",
                profileUser.id
            )
            .is(
                "read_at",
                null
            );


    if (error) {

        console.error(
            "BR PROFILE: erro mensagens:",
            error
        );

        return;
    }


    const badge =
        $("#message-count");

    if (!badge) return;


    const count =
        data?.length || 0;


    if (count > 0) {

        badge.textContent =
            count > 99
                ? "99+"
                : String(count);

        badge.hidden = false;

    } else {

        badge.hidden = true;
    }
}


// ============================================================
// RENDER
// ============================================================

function renderProfile() {

    if (!profileData) {
        return;
    }


    const displayName =
        profileData.display_name ||
        profileData.username ||
        profileUser.email
            ?.split("@")[0] ||
        "Utilizador";


    const username =
        profileData.username;


    $("#profile-display-name")
        .textContent =
        displayName;


    $("#profile-username")
        .textContent =
        username
            ? "@" + username
            : "Username não definido";


    $("#preview-name")
        .textContent =
        displayName;


    renderAvatar(
        profileData.avatar_url,
        displayName
    );


    renderTeam();


    renderSubscription();
}


// ============================================================
// AVATAR
// ============================================================

function renderAvatar(
    url,
    name
) {

    const image =
        $("#profile-avatar-image");

    const letter =
        $("#profile-avatar-letter");

    const preview =
        $("#preview-avatar");


    if (url) {

        image.src =
            url;

        image.hidden =
            false;

        letter.hidden =
            true;


        preview.innerHTML = `
            <img
                src="${escapeHTML(url)}"
                alt=""
            >
        `;

    } else {

        image.hidden =
            true;

        image.removeAttribute(
            "src"
        );

        letter.hidden =
            false;

        letter.textContent =
            getInitials(name);


        preview.textContent =
            getInitials(name);
    }
}


// ============================================================
// TEAM RENDER
// ============================================================

function renderTeam() {

    if (!profileTeam) {

        $("#profile-team")
            .textContent =
            "Equipa não definida";

        return;
    }


    const teamName =
        profileTeam.short_name ||
        profileTeam.name ||
        "Equipa";


    $("#profile-team")
        .textContent =
        teamName;


    $("#locked-team-name")
        .textContent =
        profileTeam.name ||
        teamName;


    const logo =
        $("#locked-team-logo");


    const slug =
        String(
            profileTeam.slug ||
            ""
        ).toLowerCase();


    if (
        slug.includes("barca") ||
        slug.includes("barcelona")
    ) {

        logo.textContent =
            "BARÇA";

    } else if (
        slug.includes("real") ||
        slug.includes("madrid")
    ) {

        logo.textContent =
            "RM";

    } else {

        logo.textContent =
            "BR";
    }
}


// ============================================================
// SUBSCRIPTION RENDER
// ============================================================

function renderSubscription() {

    const status =
        profileSubscription?.status ||
        "free";


    const price =
        profileSubscription?.monthly_price ??
        platformSettings?.monthly_price ??
        0;


    const currency =
        profileSubscription?.currency ||
        platformSettings?.currency ||
        "AOA";


    const statusLabel =
        getSubscriptionLabel(
            status
        );


    $("#subscription-status")
        .textContent =
        statusLabel;


    $("#subscription-price")
        .textContent =
        formatMoney(
            price,
            currency
        );


    const description =
        $("#subscription-description");


    if (
        !platformSettings?.payments_active
    ) {

        description.textContent =
            "O sistema de pagamentos está preparado, mas as subscrições pagas ainda não estão activas.";

    } else if (
        !platformSettings.enforce_payment
    ) {

        description.textContent =
            "Os pagamentos estão activos, mas o acesso não é bloqueado automaticamente por atraso.";

    } else {

        description.textContent =
            "A tua subscrição e os respectivos pagamentos são geridos pelo Barça Real.";
    }


    const details =
        $("#subscription-details");


    if (!details) {
        return;
    }


    let html = "";


    if (
        profileSubscription?.next_payment_due_at
    ) {

        html += `
            <div class="activity-item">
                <strong>
                    Próximo pagamento
                </strong>

                <small>
                    ${escapeHTML(
                        formatDate(
                            profileSubscription.next_payment_due_at
                        )
                    )}
                </small>
            </div>
        `;
    }


    if (
        profileSubscription?.grace_until
    ) {

        html += `
            <div class="activity-item">
                <strong>
                    Período de tolerância
                </strong>

                <small>
                    Até ${escapeHTML(
                        formatDate(
                            profileSubscription.grace_until
                        )
                    )}
                </small>
            </div>
        `;
    }


    if (
        profileSubscription?.admin_note
    ) {

        html += `
            <div class="activity-item">
                <strong>
                    Nota da administração
                </strong>

                <small>
                    ${escapeHTML(
                        profileSubscription.admin_note
                    )}
                </small>
            </div>
        `;
    }


    details.innerHTML =
        html;
}


function getSubscriptionLabel(
    status
) {

    const labels = {

        free:
            "Gratuito",

        active:
            "Activo",

        pending:
            "Pendente",

        overdue:
            "Pagamento em atraso",

        suspended:
            "Suspenso",

        cancelled:
            "Cancelado"

    };


    return (
        labels[status] ||
        status ||
        "Gratuito"
    );
}


// ============================================================
// INTERACTIONS
// ============================================================

function setupProfileInteractions() {

    document
        .querySelectorAll(
            "[data-panel]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openProfilePanel(
                        button.dataset.panel
                    );

                }
            );

        });


    $("#profile-edit-button")
        ?.addEventListener(
            "click",
            () => {

                openProfilePanel(
                    "profile"
                );

            }
        );


    $("#avatar-edit-button")
        ?.addEventListener(
            "click",
            () => {

                $("#avatar-file")
                    ?.click();

            }
        );


    $("#avatar-file")
        ?.addEventListener(
            "change",
            handleAvatarUpload
        );


    $("#modal-close")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("#modal-backdrop")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("#signout-other-button")
        ?.addEventListener(
            "click",
            signOutOtherSessions
        );


    $("#delete-account-button")
        ?.addEventListener(
            "click",
            openDeleteAccount
        );
}


// ============================================================
// MODAL
// ============================================================

function openModal(
    html
) {

    const modal =
        $("#profile-modal");

    const content =
        $("#modal-content");


    if (!modal || !content) {
        return;
    }


    content.innerHTML =
        html;


    modal.hidden =
        false;
}


function closeModal() {

    const modal =
        $("#profile-modal");

    if (!modal) return;

    modal.hidden =
        true;
}


// ============================================================
// PROFILE EDITOR
// ============================================================

function openProfilePanel(
    panel
) {

    switch (panel) {

        case "profile":
            openProfileEditor();
            break;

        case "security":
            openSecurityPanel();
            break;

        case "privacy":
            openPrivacyPanel();
            break;

        case "notifications":
            openNotificationPanel();
            break;

        case "activity":
            openActivityPanel();
            break;

        case "messages":
            openMessagesPanel();
            break;

        case "payments":
            openPaymentsPanel();
            break;

        default:
            break;
    }
}


// ============================================================
// PROFILE EDITOR
// ============================================================

function openProfileEditor() {

    const name =
        profileData?.display_name || "";

    const username =
        profileData?.username || "";

    const bio =
        profileData?.bio || "";


    openModal(`

        <h2>
            Editar perfil
        </h2>

        <form id="profile-edit-form">

            <div class="form-group">

                <label>
                    Nome apresentado
                </label>

                <input
                    type="text"
                    id="edit-display-name"
                    value="${escapeHTML(name)}"
                    maxlength="80"
                    required
                >

                <div class="form-help">
                    Este é o nome que outros adeptos verão nos comentários.
                </div>

            </div>


            <div class="form-group">

                <label>
                    Username
                </label>

                <input
                    type="text"
                    id="edit-username"
                    value="${escapeHTML(username)}"
                    maxlength="30"
                    placeholder="ex.: paulosousa"
                >

                <div class="form-help">
                    Deve ser único. Usa apenas letras, números e underscore.
                </div>

            </div>


            <div class="form-group">

                <label>
                    Bio
                </label>

                <textarea
                    id="edit-bio"
                    maxlength="300"
                    placeholder="Fala um pouco sobre ti..."
                >${escapeHTML(bio)}</textarea>

            </div>


            <div class="form-group">

                <label>
                    Idioma
                </label>

                <select id="edit-language">

                    <option
                        value="pt"
                        ${profilePreferences?.language === "pt" ? "selected" : ""}
                    >
                        Português
                    </option>

                    <option
                        value="en"
                        ${profilePreferences?.language === "en" ? "selected" : ""}
                    >
                        English
                    </option>

                    <option
                        value="fr"
                        ${profilePreferences?.language === "fr" ? "selected" : ""}
                    >
                        Français
                    </option>

                </select>

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="modal-button secondary"
                    id="cancel-profile-edit"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="modal-button primary"
                >
                    Guardar
                </button>

            </div>

        </form>

    `);


    $("#cancel-profile-edit")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("#profile-edit-form")
        ?.addEventListener(
            "submit",
            saveProfile
        );
}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile(
    event
) {

    event.preventDefault();


    const client =
        getClient();


    if (!client) return;


    const displayName =
        $("#edit-display-name")
            ?.value
            .trim();


    const username =
        $("#edit-username")
            ?.value
            .trim()
            .toLowerCase();


    const bio =
        $("#edit-bio")
            ?.value
            .trim();


    const language =
        $("#edit-language")
            ?.value ||
        "pt";


    if (!displayName) {

        showToast(
            "O nome apresentado é obrigatório."
        );

        return;
    }


    if (
        username &&
        !/^[a-z0-9_]+$/.test(
            username
        )
    ) {

        showToast(
            "O username só pode conter letras, números e underscore."
        );

        return;
    }


    try {

        const {
            error
        } =
            await client
                .from("profiles")
                .update({

                    display_name:
                        displayName,

                    username:
                        username || null,

                    bio:
                        bio || null

                })
                .eq(
                    "id",
                    profileUser.id
                );


        if (error) {

            if (
                error.code === "23505"
            ) {

                throw new Error(
                    "Esse username já está a ser utilizado."
                );
            }

            throw error;
        }


        const {
            error:
                preferenceError
        } =
            await client
                .from("user_preferences")
                .upsert({

                    user_id:
                        profileUser.id,

                    language

                });


        if (preferenceError) {
            throw preferenceError;
        }


        profileData.display_name =
            displayName;

        profileData.username =
            username || null;

        profileData.bio =
            bio || null;


        profilePreferences.language =
            language;


        renderProfile();

        closeModal();

        showToast(
            "Perfil actualizado."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: erro ao guardar:",
            error
        );

        showToast(
            error.message ||
            "Não foi possível guardar as alterações."
        );
    }
}


// ============================================================
// AVATAR UPLOAD
// ============================================================

async function handleAvatarUpload(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    const client =
        getClient();


    if (!client) {
        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showToast(
            "A imagem deve ter no máximo 5 MB."
        );

        event.target.value =
            "";

        return;
    }


    const allowed =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


    if (
        !allowed.includes(
            file.type
        )
    ) {

        showToast(
            "Formato de imagem não suportado."
        );

        event.target.value =
            "";

        return;
    }


    try {

        showToast(
            "A carregar fotografia..."
        );


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const path =
            profileUser.id +
            "/avatar-" +
            Date.now() +
            "." +
            extension;


        const {
            error:
                uploadError
        } =
            await client.storage
                .from("profile-media")
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data
        } =
            client.storage
                .from("profile-media")
                .getPublicUrl(
                    path
                );


        const avatarUrl =
            data?.publicUrl;


        if (!avatarUrl) {

            throw new Error(
                "Não foi possível obter o endereço da fotografia."
            );
        }


        const {
            error:
                updateError
        } =
            await client
                .from("profiles")
                .update({

                    avatar_url:
                        avatarUrl

                })
                .eq(
                    "id",
                    profileUser.id
                );


        if (updateError) {
            throw updateError;
        }


        profileData.avatar_url =
            avatarUrl;


        renderProfile();


        showToast(
            "Fotografia actualizada."
        );


    } catch (error) {

        console.error(
            "BR PROFILE: erro avatar:",
            error
        );

        showToast(
            "Não foi possível actualizar a fotografia."
        );

    } finally {

        event.target.value =
            "";
    }
}


// ============================================================
// SECURITY
// ============================================================

function openSecurityPanel() {

    openModal(`

        <h2>
            Segurança
        </h2>


        <div class="form-group">

            <label>
                Email actual
            </label>

            <input
                type="email"
                value="${escapeHTML(
                    profileUser.email || ""
                )}"
                disabled
            >

        </div>


        <h3>
            Alterar email
        </h3>

        <form id="email-form">

            <div class="form-group">

                <label>
                    Novo email
                </label>

                <input
                    type="email"
                    id="new-email"
                    required
                >

            </div>

            <button
                class="modal-button primary"
                type="submit"
            >
                Alterar email
            </button>

        </form>


        <h3>
            Alterar palavra-passe
        </h3>

        <form id="password-form">

            <div class="form-group">

                <label>
                    Nova palavra-passe
                </label>

                <input
                    type="password"
                    id="new-password"
                    minlength="8"
                    required
                >

            </div>

            <div class="form-group">

                <label>
                    Confirmar palavra-passe
                </label>

                <input
                    type="password"
                    id="confirm-password"
                    minlength="8"
                    required
                >

            </div>

            <button
                class="modal-button primary"
                type="submit"
            >
                Alterar palavra-passe
            </button>

        </form>

        <h3>
            Sessões
        </h3>

        <button
            type="button"
            class="modal-button danger"
            id="modal-signout-other"
        >
            Terminar outras sessões
        </button>

    `);


    $("#email-form")
        ?.addEventListener(
            "submit",
            changeEmail
        );


    $("#password-form")
        ?.addEventListener(
            "submit",
            changePassword
        );


    $("#modal-signout-other")
        ?.addEventListener(
            "click",
            signOutOtherSessions
        );
}


async function changeEmail(
    event
) {

    event.preventDefault();


    const email =
        $("#new-email")
            ?.value
            .trim();


    if (!email) {
        return;
    }


    const client =
        getClient();


    try {

        const {
            error
        } =
            await client.auth
                .updateUser({

                    email

                });


        if (error) {
            throw error;
        }


        showToast(
            "Confirma o novo email através da mensagem enviada."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: email:",
            error
        );

        showToast(
            error.message ||
            "Não foi possível alterar o email."
        );
    }
}


async function changePassword(
    event
) {

    event.preventDefault();


    const password =
        $("#new-password")
            ?.value;


    const confirmation =
        $("#confirm-password")
            ?.value;


    if (
        password !==
        confirmation
    ) {

        showToast(
            "As palavras-passe não coincidem."
        );

        return;
    }


    const client =
        getClient();


    try {

        const {
            error
        } =
            await client.auth
                .updateUser({

                    password

                });


        if (error) {
            throw error;
        }


        $("#password-form")
            ?.reset();


        showToast(
            "Palavra-passe alterada."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: password:",
            error
        );

        showToast(
            error.message ||
            "Não foi possível alterar a palavra-passe."
        );
    }
}


async function signOutOtherSessions() {

    const confirmed =
        window.confirm(
            "Queres terminar a sessão do Barça Real em todos os outros dispositivos?"
        );


    if (!confirmed) {
        return;
    }


    const client =
        getClient();


    try {

        const {
            error
        } =
            await client.auth.signOut({
                scope: "others"
            });


        if (error) {
            throw error;
        }


        closeModal();

        showToast(
            "As outras sessões foram terminadas."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: sessões:",
            error
        );

        showToast(
            "Não foi possível terminar as outras sessões."
        );
    }
}


// ============================================================
// PRIVACY
// ============================================================

function openPrivacyPanel() {

    openModal(`

        <h2>
            Privacidade
        </h2>

        <form id="privacy-form">

            <div class="form-group">

                <label>
                    Visibilidade do perfil
                </label>

                <select id="profile-visibility">

                    <option
                        value="public"
                        ${profilePreferences.profile_visibility === "public" ? "selected" : ""}
                    >
                        Público
                    </option>

                    <option
                        value="private"
                        ${profilePreferences.profile_visibility === "private" ? "selected" : ""}
                    >
                        Privado
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Visibilidade da actividade
                </label>

                <select id="activity-visibility">

                    <option
                        value="public"
                        ${profilePreferences.activity_visibility === "public" ? "selected" : ""}
                    >
                        Público
                    </option>

                    <option
                        value="private"
                        ${profilePreferences.activity_visibility === "private" ? "selected" : ""}
                    >
                        Privado
                    </option>

                </select>

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="modal-button secondary"
                    onclick="closeModal()"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="modal-button primary"
                >
                    Guardar
                </button>

            </div>

        </form>

    `);


    $("#privacy-form")
        ?.addEventListener(
            "submit",
            savePrivacy
        );
}


async function savePrivacy(
    event
) {

    event.preventDefault();


    const client =
        getClient();


    const profileVisibility =
        $("#profile-visibility")
            ?.value;


    const activityVisibility =
        $("#activity-visibility")
            ?.value;


    try {

        const {
            error
        } =
            await client
                .from("user_preferences")
                .update({

                    profile_visibility:
                        profileVisibility,

                    activity_visibility:
                        activityVisibility

                })
                .eq(
                    "user_id",
                    profileUser.id
                );


        if (error) {
            throw error;
        }


        profilePreferences.profile_visibility =
            profileVisibility;

        profilePreferences.activity_visibility =
            activityVisibility;


        closeModal();

        showToast(
            "Definições de privacidade actualizadas."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: privacy:",
            error
        );

        showToast(
            "Não foi possível guardar as definições."
        );
    }
}


// ============================================================
// NOTIFICATIONS
// ============================================================

function openNotificationPanel() {

    openModal(`

        <h2>
            Notificações
        </h2>

        <form id="notification-form">

            ${preferenceCheckbox(
                "notify_replies",
                "Respostas",
                "Quando alguém responder aos teus comentários.",
                profilePreferences.notify_replies
            )}

            ${preferenceCheckbox(
                "notify_reactions",
                "Reacções",
                "Quando alguém reagir aos teus comentários.",
                profilePreferences.notify_reactions
            )}

            ${preferenceCheckbox(
                "notify_mentions",
                "Menções",
                "Quando fores mencionado na comunidade.",
                profilePreferences.notify_mentions
            )}

            ${preferenceCheckbox(
                "email_notifications",
                "Notificações por email",
                "Receber notificações relevantes por email.",
                profilePreferences.email_notifications
            )}

            <div class="modal-actions">

                <button
                    type="submit"
                    class="modal-button primary"
                >
                    Guardar
                </button>

            </div>

        </form>

    `);


    $("#notification-form")
        ?.addEventListener(
            "submit",
            saveNotifications
        );
}


function preferenceCheckbox(
    id,
    title,
    description,
    checked
) {

    return `

        <label class="preference-row">

            <span class="preference-copy">

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <small>
                    ${escapeHTML(description)}
                </small>

            </span>

            <input
                type="checkbox"
                id="${escapeHTML(id)}"
                ${checked ? "checked" : ""}
            >

        </label>

    `;
}


async function saveNotifications(
    event
) {

    event.preventDefault();


    const client =
        getClient();


    const values = {

        notify_replies:
            $("#notify_replies")
                ?.checked,

        notify_reactions:
            $("#notify_reactions")
                ?.checked,

        notify_mentions:
            $("#notify_mentions")
                ?.checked,

        email_notifications:
            $("#email_notifications")
                ?.checked

    };


    try {

        const {
            error
        } =
            await client
                .from("user_preferences")
                .update(values)
                .eq(
                    "user_id",
                    profileUser.id
                );


        if (error) {
            throw error;
        }


        Object.assign(
            profilePreferences,
            values
        );


        closeModal();

        showToast(
            "Preferências de notificações actualizadas."
        );

    } catch (error) {

        console.error(
            "BR PROFILE: notifications:",
            error
        );

        showToast(
            "Não foi possível guardar as preferências."
        );
    }
}


// ============================================================
// ACTIVITY
// ============================================================

async function openActivityPanel() {

    const client =
        getClient();


    openModal(`

        <h2>
            A minha actividade
        </h2>

        <div id="activity-list">

            <div class="empty-state">
                A carregar...
            </div>

        </div>

    `);


    try {

        const {
            data,
            error
        } =
            await client
                .from("fan_comments")
                .select(`
                    id,
                    article_key,
                    body,
                    created_at,
                    parent_id
                `)
                .eq(
                    "user_id",
                    profileUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(50);


        if (error) {
            throw error;
        }


        const container =
            $("#activity-list");


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    Ainda não publicaste comentários.
                </div>
            `;

            return;
        }


        container.innerHTML =
            data.map(
                item => `

                    <div class="activity-item">

                        <strong>
                            ${escapeHTML(
                                item.body
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.article_key
                            )}
                            ·
                            ${escapeHTML(
                                formatDate(
                                    item.created_at
                                )
                            )}
                        </small>

                    </div>

                `
            ).join("");

    } catch (error) {

        console.error(
            "BR PROFILE: activity:",
            error
        );

        $("#activity-list")
            .innerHTML = `
                <div class="empty-state">
                    Não foi possível carregar a actividade.
                </div>
            `;
    }
}


// ============================================================
// PRIVATE MESSAGES
// ============================================================

async function openMessagesPanel() {

    const client =
        getClient();


    openModal(`

        <h2>
            Mensagens
        </h2>

        <div id="messages-list">

            <div class="empty-state">
                A carregar...
            </div>

        </div>

    `);


    try {

        const {
            data,
            error
        } =
            await client
                .from("private_messages")
                .select(`
                    id,
                    sender_id,
                    subject,
                    body,
                    message_type,
                    sent_at,
                    read_at
                `)
                .eq(
                    "recipient_id",
                    profileUser.id
                )
                .order(
                    "sent_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const container =
            $("#messages-list");


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    Não tens mensagens privadas.
                </div>
            `;

            return;
        }


        container.innerHTML =
            data.map(
                message => `

                    <div
                        class="message-item"
                        data-message-id="${escapeHTML(
                            message.id
                        )}"
                    >

                        <strong>
                            ${escapeHTML(
                                message.subject
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                getMessageTypeLabel(
                                    message.message_type
                                )
                            )}
                            ·
                            ${escapeHTML(
                                formatDate(
                                    message.sent_at
                                )
                            )}
                        </small>

                        <div
                            style="
                                margin-top:8px;
                                color:rgba(255,255,255,.72);
                                font-size:12px;
                                line-height:1.55;
                            "
                        >
                            ${escapeHTML(
                                message.body
                            )}
                        </div>

                    </div>

                `
            ).join("");


        await markMessagesRead(
            client,
            data
        );


    } catch (error) {

        console.error(
            "BR PROFILE: messages:",
            error
        );

        $("#messages-list")
            .innerHTML = `
                <div class="empty-state">
                    Não foi possível carregar as mensagens.
                </div>
            `;
    }
}


function getMessageTypeLabel(
    type
) {

    const labels = {

        general:
            "Geral",

        payment:
            "Pagamento",

        warning:
            "Aviso",

        account:
            "Conta",

        community:
            "Comunidade",

        moderation:
            "Moderação",

        important:
            "Importante"

    };


    return (
        labels[type] ||
        "Mensagem"
    );
}


async function markMessagesRead(
    client,
    messages
) {

    const unread =
        messages.filter(
            message =>
                !message.read_at
        );


    if (!unread.length) {
        return;
    }


    const ids =
        unread.map(
            message =>
                message.id
        );


    const {
        error
    } =
        await client
            .from("private_messages")
            .update({

                read_at:
                    new Date()
                        .toISOString()

            })
            .in(
                "id",
                ids
            );


    if (error) {

        console.error(
            "BR PROFILE: erro marcar mensagens:",
            error
        );

        return;
    }


    $("#message-count")
        .hidden = true;
}


// ============================================================
// PAYMENTS
// ============================================================

async function openPaymentsPanel() {

    const client =
        getClient();


    openModal(`

        <h2>
            Histórico de pagamentos
        </h2>

        <div id="payments-list">

            <div class="empty-state">
                A carregar...
            </div>

        </div>

    `);


    try {

        const {
            data,
            error
        } =
            await client
                .from("subscription_payments")
                .select(`
                    id,
                    amount,
                    currency,
                    status,
                    payment_method,
                    provider,
                    transaction_reference,
                    due_at,
                    paid_at,
                    created_at
                `)
                .eq(
                    "user_id",
                    profileUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const container =
            $("#payments-list");


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    Ainda não existem pagamentos registados.
                </div>
            `;

            return;
        }


        container.innerHTML =
            data.map(
                payment => `

                    <div class="payment-item">

                        <strong>
                            ${escapeHTML(
                                formatMoney(
                                    payment.amount,
                                    payment.currency
                                )
                            )}
                        </strong>

                        <small>
                            Estado:
                            ${escapeHTML(
                                payment.status
                            )}

                            ·

                            Criado:
                            ${escapeHTML(
                                formatDate(
                                    payment.created_at
                                )
                            )}

                            ${
                                payment.paid_at
                                    ? `
                                        · Pago:
                                        ${escapeHTML(
                                            formatDate(
                                                payment.paid_at
                                            )
                                        )}
                                    `
                                    : ""
                            }

                        </small>

                        ${
                            payment.transaction_reference
                                ? `
                                    <small>
                                        Referência:
                                        ${escapeHTML(
                                            payment.transaction_reference
                                        )}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                `
            ).join("");

    } catch (error) {

        console.error(
            "BR PROFILE: payments:",
            error
        );

        $("#payments-list")
            .innerHTML = `
                <div class="empty-state">
                    Não foi possível carregar o histórico.
                </div>
            `;
    }
}


// ============================================================
// DELETE ACCOUNT
// ============================================================

function openDeleteAccount() {

    openModal(`

        <h2>
            Eliminar conta
        </h2>

        <p
            style="
                color:rgba(255,255,255,.68);
                font-size:13px;
                line-height:1.6;
            "
        >
            A eliminação da conta é uma operação permanente.
            Os dados associados à conta poderão ser removidos
            e esta acção não pode ser desfeita.
        </p>

        <div class="form-group">

            <label>
                Escreve ELIMINAR para continuar
            </label>

            <input
                type="text"
                id="delete-confirmation"
                autocomplete="off"
            >

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="modal-button secondary"
                onclick="closeModal()"
            >
                Cancelar
            </button>

            <button
                type="button"
                class="modal-button danger"
                id="confirm-delete-button"
            >
                Eliminar conta
            </button>

        </div>

        <div
            class="form-help"
            style="margin-top:12px;"
        >
            Por segurança, a eliminação definitiva deverá ser
            executada por uma operação segura no servidor.
        </div>

    `);


    $("#confirm-delete-button")
        ?.addEventListener(
            "click",
            requestAccountDeletion
        );
}


async function requestAccountDeletion() {

    const confirmation =
        $("#delete-confirmation")
            ?.value
            .trim();


    if (
        confirmation !==
        "ELIMINAR"
    ) {

        showToast(
            "Escreve ELIMINAR para confirmar."
        );

        return;
    }


    showToast(
        "A eliminação definitiva da conta ainda precisa de ser ligada ao processo seguro do servidor."
    );
}
