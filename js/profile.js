/* ============================================================
   BARÇA REAL
   PROFILE PAGE
   ============================================================ */


/* ============================================================
   STATE
   ============================================================ */

let profileUser = null;
let profileData = null;
let profileTeam = null;
let profilePreferences = null;
let profileSubscription = null;


/* ============================================================
   HELPERS
   ============================================================ */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalizeUsername(value) {

    return String(value || "")
        .trim()
        .replace(/^@+/, "")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 30);
}


function showMessage(
    element,
    message,
    type = ""
) {

    if (!element) return;

    element.textContent = message;

    element.classList.remove(
        "success",
        "error"
    );

    if (type) {
        element.classList.add(type);
    }
}


function getInitial(
    displayName,
    username
) {

    const value =
        String(
            displayName ||
            username ||
            "U"
        ).trim();

    return (
        value.charAt(0) ||
        "U"
    ).toUpperCase();
}


/* ============================================================
   TEAM THEME
   ============================================================ */

function applyProfileTeamTheme(team) {

    if (!team) return;

    const root =
        document.documentElement;

    if (team.primary_color) {

        root.style.setProperty(
            "--team-primary",
            team.primary_color
        );
    }

    if (team.secondary_color) {

        root.style.setProperty(
            "--team-secondary",
            team.secondary_color
        );
    }

    if (team.primary_color) {

        root.style.setProperty(
            "--team-glow",
            hexToRGBA(
                team.primary_color,
                0.18
            )
        );
    }
}


function hexToRGBA(
    hex,
    alpha
) {

    if (!hex) {
        return `rgba(255,255,255,${alpha})`;
    }

    let value =
        String(hex)
            .replace("#", "")
            .trim();

    if (value.length === 3) {

        value =
            value
                .split("")
                .map(char => char + char)
                .join("");
    }

    if (value.length !== 6) {

        return `rgba(255,255,255,${alpha})`;
    }

    const r =
        parseInt(
            value.substring(0, 2),
            16
        );

    const g =
        parseInt(
            value.substring(2, 4),
            16
        );

    const b =
        parseInt(
            value.substring(4, 6),
            16
        );

    return `rgba(${r},${g},${b},${alpha})`;
}


/* ============================================================
   LOAD PROFILE
   ============================================================ */

async function loadProfile() {

    const client =
        supabaseClient;

    if (!client) {

        console.error(
            "BR PROFILE: Supabase não encontrado."
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

            console.error(
                "BR PROFILE: erro de autenticação:",
                authError
            );

            window.location.href =
                "login.html";

            return;
        }


        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        profileUser =
            user;


        /* ================================================
           PROFILE
           ================================================ */

        const {
            data: profile,
            error: profileError
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
                    is_active
                `)
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (profileError) {

            throw profileError;
        }


        if (!profile) {

            console.error(
                "BR PROFILE: perfil não encontrado."
            );

            return;
        }


        profileData =
            profile;


        /* ================================================
           TEAM
           ================================================ */

        if (profile.supported_team_id) {

            const {
                data: team,
                error: teamError
            } =
                await client
                    .from("teams")
                    .select(`
                        id,
                        name,
                        slug,
                        short_name,
                        primary_color,
                        secondary_color
                    `)
                    .eq(
                        "id",
                        profile.supported_team_id
                    )
                    .maybeSingle();


            if (teamError) {

                console.error(
                    "BR PROFILE: erro ao carregar equipa:",
                    teamError
                );

            } else {

                profileTeam =
                    team;

                applyProfileTeamTheme(
                    team
                );
            }
        }


        /* ================================================
           PREFERENCES
           ================================================ */

        const {
            data: preferences,
            error: preferencesError
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
                    user.id
                )
                .maybeSingle();


        if (preferencesError) {

            console.error(
                "BR PROFILE: erro ao carregar preferências:",
                preferencesError
            );

        } else {

            profilePreferences =
                preferences;
        }


        /* ================================================
           SUBSCRIPTION
           ================================================ */

        const {
            data: subscription,
            error: subscriptionError
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
                    auto_renew
                `)
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (subscriptionError) {

            console.error(
                "BR PROFILE: erro ao carregar subscrição:",
                subscriptionError
            );

        } else {

            profileSubscription =
                subscription;
        }


        renderProfile();

        await loadPaymentHistory();


        $("profile-loading").hidden =
            true;

        $("profile-app").hidden =
            false;


    } catch (error) {

        console.error(
            "BR PROFILE: erro geral:",
            error
        );

        const loading =
            $("profile-loading");

        if (loading) {

            loading.innerHTML = `
                <p>
                    Não foi possível carregar o perfil.
                </p>

                <small>
                    ${escapeHTML(
                        error.message ||
                        "Erro desconhecido."
                    )}
                </small>
            `;
        }
    }
}


/* ============================================================
   RENDER PROFILE
   ============================================================ */

function renderProfile() {

    if (!profileData) return;


    const displayName =
        profileData.display_name ||
        profileData.username ||
        "Utilizador";


    const username =
        profileData.username ||
        "";


    const initial =
        getInitial(
            displayName,
            username
        );


    /* ================================================
       IDENTITY
       ================================================ */

    $("profile-display-name")
        .textContent =
        displayName;


    $("profile-username")
        .textContent =
        username
            ? `@${username}`
            : "Username ainda não definido";


    $("profile-team")
        .textContent =
        profileTeam
            ? (
                profileTeam.short_name ||
                profileTeam.name
            )
            : "Equipa não definida";


    /* ================================================
       ACCOUNT INPUTS
       ================================================ */

    $("display-name-input")
        .value =
        profileData.display_name ||
        "";


    $("username-input")
        .value =
        profileData.username ||
        "";


    $("profile-email")
        .textContent =
        profileUser?.email ||
        "Email não disponível";


    /* ================================================
       AVATAR
       ================================================ */

    setAvatar(
        profileData.avatar_url,
        initial
    );


    /* ================================================
       TEAM
       ================================================ */

    renderTeam();


    /* ================================================
       PREFERENCES
       ================================================ */

    renderPreferences();


    /* ================================================
       SUBSCRIPTION
       ================================================ */

    renderSubscription();
}


/* ============================================================
   AVATAR
   ============================================================ */

function setAvatar(
    avatarUrl,
    initial
) {

    const avatar =
        $("profile-avatar");

    const placeholder =
        $("profile-avatar-placeholder");

    const preview =
        $("preview-avatar");

    const previewPlaceholder =
        $("preview-avatar-placeholder");


    if (avatarUrl) {

        avatar.src =
            avatarUrl;

        avatar.hidden =
            false;

        placeholder.hidden =
            true;


        preview.src =
            avatarUrl;

        preview.hidden =
            false;

        previewPlaceholder.hidden =
            true;


        return;
    }


    avatar.removeAttribute("src");

    avatar.hidden =
        true;

    placeholder.hidden =
        false;

    placeholder.textContent =
        initial;


    preview.removeAttribute("src");

    preview.hidden =
        true;

    previewPlaceholder.hidden =
        false;

    previewPlaceholder.textContent =
        initial;
}


/* ============================================================
   UPDATE AVATAR PREVIEW
   ============================================================ */

function updateAvatarPreview(
    url
) {

    const displayName =
        $("display-name-input")
            ?.value ||
        profileData?.display_name ||
        profileData?.username ||
        "U";

    const username =
        $("username-input")
            ?.value ||
        profileData?.username ||
        "";

    setAvatar(
        url,
        getInitial(
            displayName,
            username
        )
    );
}


/* ============================================================
   TEAM
   ============================================================ */

function renderTeam() {

    const name =
        profileTeam
            ? (
                profileTeam.name ||
                profileTeam.short_name ||
                "Equipa"
            )
            : "Equipa";


    $("locked-team-name")
        .textContent =
        name;


    const logoContainer =
        $("locked-team-logo");


    if (!logoContainer) return;


    /*
     * The teams table itself doesn't currently
     * contain a logo column in the schema we
     * have established.
     *
     * We therefore use the existing football
     * provider logo data where available.
     */
    loadTeamLogo(
        logoContainer
    );
}


async function loadTeamLogo(
    container
) {

    if (!profileTeam) return;


    const slug =
        String(
            profileTeam.slug ||
            profileTeam.name ||
            ""
        ).toLowerCase();


    const providerTeamId =
        slug.includes("barca") ||
        slug.includes("barcelona")
            ? 81
            : slug.includes("real") ||
              slug.includes("madrid")
                ? 86
                : null;


    if (!providerTeamId) {

        container.textContent =
            profileTeam.short_name ||
            "BR";

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("football_matches")
                .select(`
                    home_provider_team_id,
                    away_provider_team_id,
                    home_team_logo,
                    away_team_logo,
                    match_date
                `)
                .or(
                    `home_provider_team_id.eq.${providerTeamId},away_provider_team_id.eq.${providerTeamId}`
                )
                .not(
                    "match_date",
                    "is",
                    null
                )
                .order(
                    "match_date",
                    {
                        ascending: false
                    }
                )
                .limit(10);


        if (error) {

            throw error;
        }


        let logoUrl =
            null;


        for (
            const match
            of data || []
        ) {

            if (
                match.home_provider_team_id ===
                    providerTeamId &&
                match.home_team_logo
            ) {

                logoUrl =
                    match.home_team_logo;

                break;
            }


            if (
                match.away_provider_team_id ===
                    providerTeamId &&
                match.away_team_logo
            ) {

                logoUrl =
                    match.away_team_logo;

                break;
            }
        }


        if (logoUrl) {

            container.innerHTML = `
                <img
                    src="${escapeHTML(
                        logoUrl
                    )}"
                    alt="${escapeHTML(
                        profileTeam.name ||
                        "Equipa"
                    )}">
            `;

            return;
        }


        container.textContent =
            profileTeam.short_name ||
            "BR";


    } catch (error) {

        console.error(
            "BR PROFILE: erro ao carregar logo:",
            error
        );

        container.textContent =
            profileTeam.short_name ||
            "BR";
    }
}


/* ============================================================
   PREFERENCES
   ============================================================ */

function renderPreferences() {

    const preferences =
        profilePreferences;


    if (!preferences) {

        $("language-select").value =
            "pt";

        $("notify-replies").checked =
            true;

        $("notify-reactions").checked =
            true;

        $("notify-mentions").checked =
            true;

        $("email-notifications").checked =
            true;

        $("profile-visibility").value =
            "public";

        $("activity-visibility").value =
            "public";

        return;
    }


    $("language-select").value =
        preferences.language ||
        "pt";


    $("notify-replies").checked =
        preferences.notify_replies !== false;


    $("notify-reactions").checked =
        preferences.notify_reactions !== false;


    $("notify-mentions").checked =
        preferences.notify_mentions !== false;


    $("email-notifications").checked =
        preferences.email_notifications !== false;


    $("profile-visibility").value =
        preferences.profile_visibility ||
        "public";


    $("activity-visibility").value =
        preferences.activity_visibility ||
        "public";
}


/* ============================================================
   SUBSCRIPTION
   ============================================================ */

function renderSubscription() {

    const subscription =
        profileSubscription;


    if (!subscription) {

        $("subscription-status")
            .textContent =
            "Grátis";

        $("subscription-price")
            .textContent =
            "0 AOA";

        return;
    }


    const status =
        subscription.status ||
        "free";


    const statusLabels = {

        free: "Grátis",

        active: "Ativa",

        pending: "Pendente",

        overdue: "Em atraso",

        grace: "Período de tolerância",

        suspended: "Suspensa",

        cancelled: "Cancelada"

    };


    $("subscription-status")
        .textContent =
        statusLabels[status] ||
        status;


    const price =
        Number(
            subscription.monthly_price ||
            0
        );


    const currency =
        subscription.currency ||
        "AOA";


    $("subscription-price")
        .textContent =
        `${formatMoney(
            price,
            currency
        )}`;


    const description =
        $("subscription-description");


    if (!description) return;


    if (status === "free") {

        description.textContent =
            "Neste momento a plataforma está disponível gratuitamente.";

        return;
    }


    if (
        status === "overdue"
    ) {

        description.textContent =
            "Existe um pagamento pendente. A tua conta não é bloqueada automaticamente.";

        return;
    }


    if (
        status === "grace"
    ) {

        description.textContent =
            "A tua conta encontra-se dentro de um período de tolerância definido pela administração.";

        return;
    }


    if (
        status === "suspended"
    ) {

        description.textContent =
            "O estado da subscrição foi alterado pela administração.";

        return;
    }


    description.textContent =
        "O estado da tua subscrição será atualizado conforme a configuração da plataforma.";
}


function formatMoney(
    amount,
    currency
) {

    return new Intl.NumberFormat(
        "pt-AO",
        {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2
        }
    ).format(amount);
}


/* ============================================================
   PAYMENT HISTORY
   ============================================================ */

async function loadPaymentHistory() {

    if (!profileUser) return;


    const container =
        $("payment-history");


    if (!container) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("subscription_payments")
            .select(`
                id,
                amount,
                currency,
                status,
                payment_method,
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

        console.error(
            "BR PROFILE: erro ao carregar pagamentos:",
            error
        );

        return;
    }


    if (!data || !data.length) {

        return;
    }


    container.innerHTML =
        data
            .map(
                payment => {

                    const statusLabels = {

                        pending: "Pendente",

                        paid: "Pago",

                        failed: "Falhou",

                        cancelled: "Cancelado",

                        refunded: "Reembolsado"

                    };


                    return `
                        <div class="payment-row">

                            <div class="payment-main">

                                <strong>
                                    ${escapeHTML(
                                        statusLabels[
                                            payment.status
                                        ] ||
                                        payment.status
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        formatDate(
                                            payment.paid_at ||
                                            payment.created_at
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="payment-amount">

                                ${escapeHTML(
                                    formatMoney(
                                        Number(
                                            payment.amount ||
                                            0
                                        ),
                                        payment.currency ||
                                        "AOA"
                                    )
                                )}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* ============================================================
   SAVE PROFILE
   ============================================================ */

async function saveProfile() {

    if (!profileUser) return;


    const button =
        $("save-profile-button");


    const message =
        $("profile-save-message");


    const displayName =
        $("display-name-input")
            .value
            .trim();


    const username =
        normalizeUsername(
            $("username-input")
                .value
        );


    if (!displayName) {

        showMessage(
            message,
            "O nome apresentado é obrigatório.",
            "error"
        );

        return;
    }


    if (
        username &&
        (
            username.length < 3 ||
            username.length > 30
        )
    ) {

        showMessage(
            message,
            "O username deve ter entre 3 e 30 caracteres.",
            "error"
        );

        return;
    }


    button.disabled =
        true;


    showMessage(
        message,
        "A guardar..."
    );


    try {

        const {
            data: existing,
            error: usernameError
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq(
                    "username",
                    username
                )
                .neq(
                    "id",
                    profileUser.id
                )
                .maybeSingle();


        if (usernameError) {

            throw usernameError;
        }


        if (existing) {

            showMessage(
                message,
                "Esse username já está a ser utilizado.",
                "error"
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({
                    display_name:
                        displayName,

                    username:
                        username || null
                })
                .eq(
                    "id",
                    profileUser.id
                )
                .select(`
                    id,
                    username,
                    display_name,
                    supported_team_id,
                    role_id,
                    avatar_url,
                    is_active
                `)
                .single();


        if (error) {

            throw error;
        }


        profileData =
            data;


        renderProfile();


        showMessage(
            message,
            "Perfil atualizado com sucesso.",
            "success"
        );


    } catch (error) {

        console.error(
            "BR PROFILE: erro ao guardar perfil:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Não foi possível guardar as alterações.",
            "error"
        );


    } finally {

        button.disabled =
            false;
    }
}


/* ============================================================
   SAVE PREFERENCES
   ============================================================ */

async function savePreferences() {

    if (!profileUser) return;


    const button =
        $("save-preferences-button");


    const message =
        $("preferences-message");


    button.disabled =
        true;


    showMessage(
        message,
        "A guardar..."
    );


    try {

        const preferences = {

            user_id:
                profileUser.id,

            language:
                $("language-select").value,

            notify_replies:
                $("notify-replies").checked,

            notify_reactions:
                $("notify-reactions").checked,

            notify_mentions:
                $("notify-mentions").checked,

            email_notifications:
                $("email-notifications").checked,

            profile_visibility:
                $("profile-visibility").value,

            activity_visibility:
                $("activity-visibility").value
        };


        const {
            data,
            error
        } =
            await supabaseClient
                .from("user_preferences")
                .upsert(
                    preferences,
                    {
                        onConflict:
                            "user_id"
                    }
                )
                .select()
                .single();


        if (error) {

            throw error;
        }


        profilePreferences =
            data;


        showMessage(
            message,
            "Preferências atualizadas.",
            "success"
        );


    } catch (error) {

        console.error(
            "BR PROFILE: erro ao guardar preferências:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Não foi possível guardar as preferências.",
            "error"
        );


    } finally {

        button.disabled =
            false;
    }
}


/* ============================================================
   SAVE PRIVACY
   ============================================================ */

async function savePrivacy() {

    if (!profileUser) return;


    const button =
        $("save-privacy-button");


    const message =
        $("privacy-message");


    button.disabled =
        true;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("user_preferences")
                .update({

                    profile_visibility:
                        $("profile-visibility")
                            .value,

                    activity_visibility:
                        $("activity-visibility")
                            .value

                })
                .eq(
                    "user_id",
                    profileUser.id
                )
                .select()
                .single();


        if (error) {

            throw error;
        }


        profilePreferences =
            data;


        showMessage(
            message,
            "Definições de privacidade atualizadas.",
            "success"
        );


    } catch (error) {

        console.error(
            "BR PROFILE: erro ao guardar privacidade:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Não foi possível guardar a privacidade.",
            "error"
        );


    } finally {

        button.disabled =
            false;
    }
}


/* ============================================================
   AVATAR UPLOAD
   ============================================================ */

async function handleAvatarUpload(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file || !profileUser) {
        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        alert(
            "Escolhe uma imagem JPG, PNG ou WebP."
        );

        event.target.value =
            "";

        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        alert(
            "A imagem deve ter no máximo 5 MB."
        );

        event.target.value =
            "";

        return;
    }


    const button =
        $("avatar-button");


    button.disabled =
        true;


    try {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const path =
            `${profileUser.id}/avatar.${extension}`;


        /*
         * Remove previous known avatar files
         * so each account keeps one current
         * profile image.
         */

        const {
            data: existingFiles,
            error: listError
        } =
            await supabaseClient
                .storage
                .from("profile-media")
                .list(
                    profileUser.id
                );


        if (listError) {

            console.warn(
                "BR PROFILE: não foi possível listar avatar antigo:",
                listError
            );

        } else if (
            existingFiles &&
            existingFiles.length
        ) {

            const filesToRemove =
                existingFiles
                    .filter(
                        item =>
                            item.name
                    )
                    .map(
                        item =>
                            `${profileUser.id}/${item.name}`
                    );


            if (
                filesToRemove.length
            ) {

                await supabaseClient
                    .storage
                    .from("profile-media")
                    .remove(
                        filesToRemove
                    );
            }
        }


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("profile-media")
                .upload(
                    path,
                    file,
                    {
                        upsert: true,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {

            throw uploadError;
        }


        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from("profile-media")
                .getPublicUrl(
                    path
                );


        const avatarUrl =
            publicData?.publicUrl ||
            "";


        if (!avatarUrl) {

            throw new Error(
                "Não foi possível obter o URL da imagem."
            );
        }


        const {
            data: updatedProfile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .update({
                    avatar_url:
                        avatarUrl
                })
                .eq(
                    "id",
                    profileUser.id
                )
                .select(`
                    id,
                    username,
                    display_name,
                    supported_team_id,
                    role_id,
                    avatar_url,
                    is_active
                `)
                .single();


        if (profileError) {

            throw profileError;
        }


        profileData =
            updatedProfile;


        setAvatar(
            avatarUrl,
            getInitial(
                profileData.display_name,
                profileData.username
            )
        );


        /*
         * Cache-busting ensures the browser
         * doesn't continue displaying the old
         * image after replacement.
         */

        const cacheBusted =
            `${avatarUrl}${
                avatarUrl.includes("?")
                    ? "&"
                    : "?"
            }v=${Date.now()}`;


        $("profile-avatar").src =
            cacheBusted;


        $("preview-avatar").src =
            cacheBusted;


    } catch (error) {

        console.error(
            "BR PROFILE: erro ao carregar avatar:",
            error
        );


        alert(
            error.message ||
            "Não foi possível atualizar a fotografia."
        );


    } finally {

        button.disabled =
            false;

        event.target.value =
            "";
    }
}


/* ============================================================
   CHANGE EMAIL
   ============================================================ */

async function changeEmail() {

    if (!profileUser) return;


    const currentEmail =
        profileUser.email ||
        "";


    const newEmail =
        prompt(
            `Email atual:\n${currentEmail}\n\nNovo email:`
        );


    if (
        !newEmail ||
        !newEmail.trim()
    ) {

        return;
    }


    const email =
        newEmail.trim();


    if (
        email ===
        currentEmail
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient.auth.updateUser({
            email
        });


    if (error) {

        alert(
            error.message ||
            "Não foi possível alterar o email."
        );

        return;
    }


    alert(
        "Pedido enviado. Poderá ser necessário confirmar o novo email através da mensagem enviada."
    );
}


/* ============================================================
   CHANGE PASSWORD
   ============================================================ */

async function changePassword() {

    const password =
        prompt(
            "Introduz a nova palavra-passe:"
        );


    if (!password) {
        return;
    }


    if (password.length < 8) {

        alert(
            "A palavra-passe deve ter pelo menos 8 caracteres."
        );

        return;
    }


    const confirmation =
        prompt(
            "Confirma a nova palavra-passe:"
        );


    if (
        confirmation !==
        password
    ) {

        alert(
            "As palavras-passe não coincidem."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient.auth.updateUser({
            password
        });


    if (error) {

        alert(
            error.message ||
            "Não foi possível alterar a palavra-passe."
        );

        return;
    }


    alert(
        "Palavra-passe alterada com sucesso."
    );
}


/* ============================================================
   SIGN OUT
   ============================================================ */

async function signOut() {

    const confirmed =
        confirm(
            "Queres terminar a sessão?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert(
            error.message ||
            "Não foi possível terminar a sessão."
        );

        return;
    }


    window.location.href =
        "login.html";
}


/* ============================================================
   DELETE ACCOUNT
   ============================================================ */

async function deleteAccount() {

    /*
     * IMPORTANT:
     *
     * We intentionally do NOT directly delete
     * auth.users from the browser.
     *
     * The secure account-deletion RPC will be
     * implemented in the account-security phase.
     */

    const first =
        confirm(
            "A eliminação da conta é permanente.\n\nQueres continuar?"
        );


    if (!first) {
        return;
    }


    const confirmation =
        prompt(
            "Escreve ELIMINAR para confirmar:"
        );


    if (
        confirmation !==
        "ELIMINAR"
    ) {

        alert(
            "A conta não foi eliminada."
        );

        return;
    }


    alert(
        "A eliminação segura da conta será disponibilizada através do sistema de segurança da plataforma. Nenhuma conta foi eliminada."
    );
}


/* ============================================================
   DATE
   ============================================================ */

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


    return new Intl.DateTimeFormat(
        "pt-AO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


/* ============================================================
   EVENTS
   ============================================================ */

function setupProfileEvents() {


    /* Avatar */

    $("avatar-button")
        .addEventListener(
            "click",
            () => {

                $("avatar-input")
                    .click();

            }
        );


    $("avatar-input")
        .addEventListener(
            "change",
            handleAvatarUpload
        );


    /* Profile */

    $("save-profile-button")
        .addEventListener(
            "click",
            saveProfile
        );


    /* Preferences */

    $("save-preferences-button")
        .addEventListener(
            "click",
            savePreferences
        );


    /* Privacy */

    $("save-privacy-button")
        .addEventListener(
            "click",
            savePrivacy
        );


    /* Security */

    $("change-email-button")
        .addEventListener(
            "click",
            changeEmail
        );


    $("change-password-button")
        .addEventListener(
            "click",
            changePassword
        );


    $("sign-out-button")
        .addEventListener(
            "click",
            signOut
        );


    /* Delete */

    $("delete-account-button")
        .addEventListener(
            "click",
            deleteAccount
        );


    /* Live preview */

    $("display-name-input")
        .addEventListener(
            "input",
            updateLivePreview
        );


    $("username-input")
        .addEventListener(
            "input",
            updateLivePreview
        );
}


/* ============================================================
   LIVE PROFILE PREVIEW
   ============================================================ */

function updateLivePreview() {

    const displayName =
        $("display-name-input")
            .value
            .trim() ||
        profileData?.display_name ||
        profileData?.username ||
        "Utilizador";


    const username =
        normalizeUsername(
            $("username-input")
                .value
        );


    $("preview-display-name")
        .textContent =
        displayName;


    $("preview-username")
        .textContent =
        username
            ? `@${username}`
            : "@username";


    const currentAvatar =
        profileData?.avatar_url;


    if (!currentAvatar) {

        setAvatar(
            null,
            getInitial(
                displayName,
                username
            )
        );
    }
}


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupProfileEvents();

        await loadProfile();

    }
);
