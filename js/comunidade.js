```javascript
/* ============================================================
   BARÇA REAL — COMUNIDADE
   Central activity / notifications hub
   Quick comment interactions included
   ============================================================ */

(function () {

    "use strict";


    /* ========================================================
       STATE
       ======================================================== */

    const state = {

        user: null,

        profile: null,

        notifications: [],

        favorites: [],

        comments: [],

        conversations: [],

        messages: [],

        profiles: new Map(),

        reactions: new Map(),

        replyOpen: null

    };


    /* ========================================================
       HELPERS
       ======================================================== */

    const $ = selector =>
        document.querySelector(selector);


    function getSupabase() {

        return (
            window.supabaseClient ||
            window.supabase ||
            null
        );

    }


    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function initials(profile) {

        const name =
            profile?.display_name ||
            profile?.username ||
            "A";

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part =>
                part.charAt(0)
            )
            .join("")
            .toUpperCase();

    }


    function avatarHTML(
        profile,
        className
    ) {

        if (profile?.avatar_url) {

            return `
                <img
                    class="${className}"
                    src="${escapeHTML(profile.avatar_url)}"
                    alt=""
                >
            `;

        }

        return `
            <div class="${className}">
                ${escapeHTML(
                    initials(profile)
                )}
            </div>
        `;

    }


    function relativeTime(dateValue) {

        if (!dateValue) {
            return "";
        }

        const date =
            new Date(dateValue);

        const now =
            new Date();

        const seconds =
            Math.floor(
                (now - date) / 1000
            );


        if (seconds < 60) {
            return "Agora mesmo";
        }


        const minutes =
            Math.floor(seconds / 60);


        if (minutes < 60) {
            return `Há ${minutes} min`;
        }


        const hours =
            Math.floor(minutes / 60);


        if (hours < 24) {
            return `Há ${hours} h`;
        }


        const days =
            Math.floor(hours / 24);


        if (days < 7) {

            return `Há ${days} ${
                days === 1
                    ? "dia"
                    : "dias"
            }`;

        }


        return date.toLocaleDateString(
            "pt-PT",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    function setHTML(
        selector,
        html
    ) {

        const element =
            $(selector);

        if (element) {
            element.innerHTML = html;
        }

    }


    /* ========================================================
       QUICK INTERACTION STYLES
       ======================================================== */

    function injectQuickInteractionStyles() {

        if (
            document.getElementById(
                "br-community-quick-styles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "br-community-quick-styles";


        style.textContent = `

            .community-comment-actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
            }

            .community-comment-action {
                border: 0;
                border-radius: 999px;
                padding: 7px 11px;
                background: rgba(255,255,255,.06);
                color: inherit;
                font: inherit;
                font-size: 12px;
                cursor: pointer;
                transition:
                    background .2s ease,
                    transform .15s ease;
            }

            .community-comment-action:hover {
                background: rgba(255,255,255,.11);
            }

            .community-comment-action:active {
                transform: scale(.97);
            }

            .community-comment-action.active {
                background:
                    var(--team-primary, #a50044);
                color: #fff;
            }

            .community-comment-action.danger.active {
                background: #8f3030;
                color: #fff;
            }

            .community-comment-reply {
                display: none;
                margin-top: 10px;
            }

            .community-comment-reply.open {
                display: block;
            }

            .community-comment-reply textarea {
                width: 100%;
                min-height: 78px;
                resize: vertical;
                box-sizing: border-box;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 12px;
                padding: 10px 12px;
                background: rgba(255,255,255,.04);
                color: inherit;
                font: inherit;
                outline: none;
            }

            .community-comment-reply textarea:focus {
                border-color:
                    var(--team-primary, #a50044);
            }

            .community-comment-reply-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-top: 8px;
            }

            .community-comment-reply-button {
                border: 0;
                border-radius: 999px;
                padding: 8px 14px;
                background:
                    var(--team-primary, #a50044);
                color: #fff;
                font: inherit;
                font-size: 12px;
                cursor: pointer;
            }

            .community-comment-cancel-button {
                border: 0;
                border-radius: 999px;
                padding: 8px 14px;
                background: rgba(255,255,255,.06);
                color: inherit;
                font: inherit;
                font-size: 12px;
                cursor: pointer;
            }

            .community-comment-status {
                margin-top: 8px;
                font-size: 12px;
                opacity: .75;
            }

            .community-comment-preview {
                margin-top: 6px;
                line-height: 1.45;
            }

            .community-comment-author {
                font-weight: 600;
            }

            .community-conversation-comment {
                padding: 14px 0;
                border-bottom:
                    1px solid rgba(255,255,255,.06);
            }

            .community-conversation-comment:last-child {
                border-bottom: 0;
            }

            .community-conversation-comment-head {
                display: flex;
                align-items: center;
                gap: 9px;
            }

            .community-conversation-comment-avatar {
                width: 34px;
                height: 34px;
                border-radius: 50%;
                object-fit: cover;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,.08);
                font-size: 11px;
                font-weight: 700;
                flex-shrink: 0;
            }

            .community-conversation-comment-info {
                min-width: 0;
            }

            .community-conversation-comment-name {
                font-size: 13px;
                font-weight: 600;
            }

            .community-conversation-comment-time {
                margin-top: 2px;
                font-size: 11px;
                opacity: .55;
            }

        `;


        document.head.appendChild(style);

    }


    /* ========================================================
       PROFILE CACHE
       ======================================================== */

    async function loadProfiles(ids) {

        const supabase =
            getSupabase();

        const uniqueIds = [
            ...new Set(
                (ids || []).filter(Boolean)
            )
        ];

        const missingIds =
            uniqueIds.filter(
                id =>
                    !state.profiles.has(id)
            );

        if (!missingIds.length) {
            return;
        }

        const {
            data,
            error
        } = await supabase.rpc(
            "get_public_profiles",
            {
                user_ids: missingIds
            }
        );

        if (error) {

            console.error(
                "BR Comunidade: erro ao carregar perfis públicos.",
                error
            );

            return;
        }

        (data || []).forEach(
            profile => {

                state.profiles.set(
                    profile.id,
                    profile
                );

            }
        );

    }


    function getProfile(id) {

        return (
            state.profiles.get(id) ||
            {
                id,
                display_name: "Utilizador",
                username: "",
                avatar_url: null
            }
        );

    }


    /* ========================================================
       AUTH
       ======================================================== */

    async function loadCurrentUser() {

        const supabase =
            getSupabase();


        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const {
            data: {
                user
            },
            error
        } =
            await supabase.auth.getUser();


        if (
            error ||
            !user
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        state.user =
            user;


        const {
            data: profile
        } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url,
                    bio,
                    supported_team_id
                `)
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        state.profile =
            profile ||
            {
                id: user.id,
                display_name:
                    user.email?.split("@")[0] ||
                    "Utilizador"
            };


        state.profiles.set(
            state.user.id,
            state.profile
        );


        return true;

    }


    /* ========================================================
       COMMENT REACTIONS
       ======================================================== */

    async function loadReactions(
        commentIds
    ) {

        const supabase =
            getSupabase();


        const ids = [
            ...new Set(
                (commentIds || [])
                    .filter(Boolean)
            )
        ];


        state.reactions.clear();


        if (!ids.length) {
            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("fan_comment_reactions")
                .select(`
                    comment_id,
                    user_id,
                    reaction
                `)
                .in(
                    "comment_id",
                    ids
                );


        if (error) {

            console.error(
                "BR Comunidade: erro ao carregar reações.",
                error
            );

            return;

        }


        (data || []).forEach(
            reaction => {

                if (
                    !state.reactions.has(
                        reaction.comment_id
                    )
                ) {

                    state.reactions.set(
                        reaction.comment_id,
                        []
                    );

                }


                state.reactions
                    .get(reaction.comment_id)
                    .push(reaction);

            }
        );

    }


    function getReactionData(
        commentId
    ) {

        const reactions =
            state.reactions.get(
                commentId
            ) || [];


        let likes = 0;
        let dislikes = 0;
        let mine = null;


        reactions.forEach(
            reaction => {

                if (
                    reaction.reaction ===
                    "like"
                ) {
                    likes++;
                }

                if (
                    reaction.reaction ===
                    "dislike"
                ) {
                    dislikes++;
                }

                if (
                    reaction.user_id ===
                    state.user?.id
                ) {
                    mine =
                        reaction.reaction;
                }

            }
        );


        return {
            likes,
            dislikes,
            mine
        };

    }


    async function toggleReaction(
        commentId,
        reactionType
    ) {

        const supabase =
            getSupabase();


        if (!state.user) {
            return;
        }


        const current =
            getReactionData(
                commentId
            );


        if (
            current.mine ===
            reactionType
        ) {

            const {
                error
            } =
                await supabase
                    .from(
                        "fan_comment_reactions"
                    )
                    .delete()
                    .eq(
                        "comment_id",
                        commentId
                    )
                    .eq(
                        "user_id",
                        state.user.id
                    );


            if (error) {

                console.error(
                    "BR Comunidade: erro ao remover reação.",
                    error
                );

                return;

            }

        } else {

            const {
                error
            } =
                await supabase
                    .from(
                        "fan_comment_reactions"
                    )
                    .upsert(
                        {
                            comment_id:
                                commentId,

                            user_id:
                                state.user.id,

                            reaction:
                                reactionType

                        },
                        {
                            onConflict:
                                "comment_id,user_id"
                        }
                    );


            if (error) {

                console.error(
                    "BR Comunidade: erro ao guardar reação.",
                    error
                );

                return;

            }

        }


        await refreshCommentReaction(
            commentId
        );


        renderInteractiveAreas();

    }


    async function refreshCommentReaction(
        commentId
    ) {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "fan_comment_reactions"
                )
                .select(`
                    comment_id,
                    user_id,
                    reaction
                `)
                .eq(
                    "comment_id",
                    commentId
                );


        if (error) {

            console.error(
                "BR Comunidade: erro ao atualizar reação.",
                error
            );

            return;

        }


        state.reactions.set(
            commentId,
            data || []
        );

    }


    /* ========================================================
       COMMENT REPLY
       ======================================================== */

    function toggleReplyBox(
        commentId
    ) {

        state.replyOpen =
            state.replyOpen ===
            commentId
                ? null
                : commentId;


        renderInteractiveAreas();


        if (
            state.replyOpen !==
            commentId
        ) {
            return;
        }


        requestAnimationFrame(
            () => {

                const textarea =
                    document.querySelector(
                        `[data-reply-textarea="${commentId}"]`
                    );


                if (textarea) {
                    textarea.focus();
                }

            }
        );

    }


    async function submitReply(
        commentId
    ) {

        const textarea =
            document.querySelector(
                `[data-reply-textarea="${commentId}"]`
            );


        if (!textarea) {
            return;
        }


        const body =
            textarea.value.trim();


        if (!body) {
            textarea.focus();
            return;
        }


        if (body.length > 5000) {

            alert(
                "A resposta não pode ultrapassar 5000 caracteres."
            );

            return;

        }


        const button =
            document.querySelector(
                `[data-submit-reply="${commentId}"]`
            );


        if (button) {
            button.disabled = true;
            button.textContent = "A publicar...";
        }


        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("fan_comments")
                .insert({
                    article_key:
                        getCommentArticleKey(
                            commentId
                        ),

                    user_id:
                        state.user.id,

                    parent_id:
                        commentId,

                    body
                })
                .select(`
                    id,
                    article_key,
                    user_id,
                    parent_id,
                    body,
                    created_at
                `)
                .single();


        if (error) {

            console.error(
                "BR Comunidade: erro ao publicar resposta.",
                error
            );


            if (button) {
                button.disabled = false;
                button.textContent = "Responder";
            }


            return;

        }


        state.comments.push(data);


        state.replyOpen =
            null;


        /*
         * Refresh the affected conversation so the new
         * reply is immediately visible.
         */
        await loadConversations();


        await loadMyComments();


        /*
         * The database trigger will create the
         * comment_reply notification automatically.
         */

    }


    function getCommentArticleKey(
        commentId
    ) {

        const comment =
            findComment(
                commentId
            );


        return comment?.article_key || "";

    }


    function findComment(
        commentId
    ) {

        const numericId =
            Number(commentId);


        const fromComments =
            state.comments.find(
                comment =>
                    Number(comment.id) ===
                    numericId
            );


        if (fromComments) {
            return fromComments;
        }


        for (
            const conversation
            of state.conversations
        ) {

            const comment =
                conversation.comments?.find(
                    item =>
                        Number(item.id) ===
                        numericId
                );


            if (comment) {
                return comment;
            }

        }


        return null;

    }


    /* ========================================================
       COMMENT ACTION HTML
       ======================================================== */

    function commentActionsHTML(
        comment
    ) {

        const reaction =
            getReactionData(
                comment.id
            );


        const isLike =
            reaction.mine === "like";


        const isDislike =
            reaction.mine === "dislike";


        return `

            <div
                class="community-comment-actions"
                data-comment-actions="${comment.id}"
            >

                <button
                    type="button"
                    class="
                        community-comment-action
                        ${isLike ? "active" : ""}
                    "
                    data-community-like="${comment.id}"
                >
                    👍 ${reaction.likes}
                </button>


                <button
                    type="button"
                    class="
                        community-comment-action
                        danger
                        ${isDislike ? "active" : ""}
                    "
                    data-community-dislike="${comment.id}"
                >
                    👎 ${reaction.dislikes}
                </button>


                <button
                    type="button"
                    class="community-comment-action"
                    data-community-reply="${comment.id}"
                >
                    💬 Responder
                </button>


                <button
                    type="button"
                    class="community-comment-action"
                    data-community-open="${comment.id}"
                    data-article-key="${escapeHTML(
                        comment.article_key
                    )}"
                >
                    ↗ Abrir conversa
                </button>

            </div>


            <div
                class="
                    community-comment-reply
                    ${
                        state.replyOpen === comment.id
                            ? "open"
                            : ""
                    }
                "
                data-reply-box="${comment.id}"
            >

                <textarea
                    data-reply-textarea="${comment.id}"
                    maxlength="5000"
                    placeholder="Escreve a tua resposta..."
                ></textarea>


                <div
                    class="community-comment-reply-footer"
                >

                    <button
                        type="button"
                        class="community-comment-cancel-button"
                        data-cancel-reply="${comment.id}"
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        class="community-comment-reply-button"
                        data-submit-reply="${comment.id}"
                    >
                        Responder
                    </button>

                </div>

            </div>

        `;

    }


    /* ========================================================
       FAN NOTIFICATIONS
       ======================================================== */

    async function loadFanNotifications() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("fan_notifications")
                .select(`
                    id,
                    recipient_id,
                    actor_id,
                    type,
                    article_key,
                    comment_id,
                    created_at,
                    read_at
                `)
                .eq(
                    "recipient_id",
                    state.user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(100);


        if (error) {

            console.error(
                "BR Comunidade: fan_notifications.",
                error
            );

            return [];

        }


        return data || [];

    }


    /* ========================================================
       GENERAL NOTIFICATIONS
       ======================================================== */

    async function loadGeneralNotifications() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("notifications")
                .select(`
                    id,
                    user_id,
                    type,
                    title,
                    message,
                    related_id,
                    read,
                    created_at
                `)
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
                .limit(100);


        if (error) {

            console.error(
                "BR Comunidade: notifications.",
                error
            );

            return [];

        }


        return data || [];

    }


    function fanNotificationText(
        notification
    ) {

        const actor =
            getProfile(
                notification.actor_id
            );


        const name =
            actor.display_name ||
            actor.username ||
            "Alguém";


        switch (
            notification.type
        ) {

            case "comment_reply":
            case "reply":

                return {
                    title:
                        `${name} respondeu ao teu comentário`,
                    message:
                        "Podes responder diretamente aqui ou abrir a conversa."
                };


            case "comment_like":
            case "like":

                return {
                    title:
                        `${name} gostou do teu comentário`,
                    message:
                        "Podes abrir a conversa para continuar."
                };


            case "comment_dislike":
            case "dislike":

                return {
                    title:
                        `${name} não gostou do teu comentário`,
                    message:
                        "Podes abrir a conversa para continuar."
                };


            case "favorite_activity":

                return {
                    title:
                        `${name} publicou um novo comentário`,
                    message:
                        "Uma pessoa que segues esteve ativa."
                };


            default:

                return {
                    title:
                        `${name} interagiu contigo`,
                    message:
                        "Toca para ver a atividade."
                };

        }

    }


    async function loadNotifications() {

        const [
            fanNotifications,
            generalNotifications
        ] = await Promise.all([

            loadFanNotifications(),

            loadGeneralNotifications()

        ]);


        await loadProfiles(
            fanNotifications.map(
                item =>
                    item.actor_id
            )
        );


        /*
         * Load the referenced comments so notifications
         * can expose quick actions.
         */
        const commentIds =
            fanNotifications
                .map(
                    item =>
                        item.comment_id
                )
                .filter(Boolean);


        if (commentIds.length) {

            const supabase =
                getSupabase();


            const {
                data
            } =
                await supabase
                    .from("fan_comments")
                    .select(`
                        id,
                        article_key,
                        user_id,
                        parent_id,
                        body,
                        created_at
                    `)
                    .in(
                        "id",
                        commentIds
                    );


            (data || []).forEach(
                comment => {

                    const exists =
                        state.comments.some(
                            item =>
                                Number(item.id) ===
                                Number(comment.id)
                        );


                    if (!exists) {
                        state.comments.push(
                            comment
                        );
                    }

                }
            );


            await loadProfiles(
                (data || []).map(
                    comment =>
                        comment.user_id
                )
            );


            await loadReactions(
                commentIds
            );

        }


        const fanItems =
            fanNotifications.map(
                notification => {

                    const text =
                        fanNotificationText(
                            notification
                        );


                    return {

                        source: "fan",

                        id:
                            notification.id,

                        type:
                            notification.type,

                        actor_id:
                            notification.actor_id,

                        article_key:
                            notification.article_key,

                        comment_id:
                            notification.comment_id,

                        created_at:
                            notification.created_at,

                        read:
                            Boolean(
                                notification.read_at
                            ),

                        title:
                            text.title,

                        message:
                            text.message

                    };

                }
            );


        const generalItems =
            generalNotifications.map(
                notification => {

                    return {

                        source: "general",

                        id:
                            notification.id,

                        type:
                            notification.type,

                        related_id:
                            notification.related_id,

                        created_at:
                            notification.created_at,

                        read:
                            Boolean(
                                notification.read
                            ),

                        title:
                            notification.title ||
                            "Nova atividade",

                        message:
                            notification.message ||
                            ""

                    };

                }
            );


        state.notifications =
            [
                ...fanItems,
                ...generalItems
            ]
                .sort(
                    (a, b) =>
                        new Date(
                            b.created_at
                        ) -
                        new Date(
                            a.created_at
                        )
                )
                .slice(0, 100);


        renderNotifications();

    }


    /* ========================================================
       NOTIFICATION COUNT
       ======================================================== */

    function getUnreadCount() {

        return state.notifications
            .filter(
                notification =>
                    !notification.read
            )
            .length;

    }


    function updateUnreadCount() {

        const count =
            getUnreadCount();


        const topCount =
            $("#community-unread-count");


        const badge =
            $("#fan-notification-badge");


        if (topCount) {

            topCount.textContent =
                count > 99
                    ? "99+"
                    : count;

            topCount.hidden =
                count === 0;

        }


        if (badge) {

            badge.textContent =
                count > 99
                    ? "99+"
                    : count;

            badge.hidden =
                count === 0;

        }


        window.dispatchEvent(
            new CustomEvent(
                "barcaRealUnreadChanged",
                {
                    detail: {
                        count
                    }
                }
            )
        );

    }


    /* ========================================================
       RENDER NOTIFICATIONS
       ======================================================== */

    function renderNotifications() {

        const container =
            $("#community-notifications");


        if (!container) {
            return;
        }


        if (!state.notifications.length) {

            container.innerHTML = `
                <div class="community-card">
                    <div class="community-empty">
                        Ainda não tens notificações.
                    </div>
                </div>
            `;

            updateUnreadCount();

            return;

        }


        container.innerHTML =
            state.notifications
                .map(
                    notification => {

                        const actor =
                            notification.actor_id
                                ? getProfile(
                                    notification.actor_id
                                )
                                : state.profile;


                        const comment =
                            notification.comment_id
                                ? findComment(
                                    notification.comment_id
                                )
                                : null;


                        return `
                            <div
                                class="
                                    community-card
                                    community-notification
                                    ${
                                        notification.read
                                            ? ""
                                            : "unread"
                                    }
                                "
                                data-notification-source="${escapeHTML(
                                    notification.source
                                )}"
                                data-notification-id="${escapeHTML(
                                    notification.id
                                )}"
                                data-article-key="${escapeHTML(
                                    notification.article_key || ""
                                )}"
                                data-comment-id="${
                                    notification.comment_id || ""
                                }"
                            >

                                ${avatarHTML(
                                    actor,
                                    "community-notification-avatar"
                                )}

                                <div
                                    class="
                                        community-notification-body
                                    "
                                >

                                    <div
                                        class="
                                            community-notification-title
                                        "
                                    >
                                        ${escapeHTML(
                                            notification.title
                                        )}
                                    </div>


                                    <div
                                        class="
                                            community-notification-message
                                        "
                                    >
                                        ${escapeHTML(
                                            notification.message
                                        )}
                                    </div>


                                    ${
                                        comment
                                            ? `
                                                <div
                                                    class="
                                                        community-comment-preview
                                                    "
                                                >
                                                    <span
                                                        class="
                                                            community-comment-author
                                                        "
                                                    >
                                                        ${escapeHTML(
                                                            getProfile(
                                                                comment.user_id
                                                            ).display_name ||
                                                            "Utilizador"
                                                        )}
                                                    </span>

                                                    ·

                                                    ${escapeHTML(
                                                        comment.body
                                                    )}
                                                </div>

                                                ${commentActionsHTML(
                                                    comment
                                                )}
                                            `
                                            : ""
                                    }


                                    <div
                                        class="
                                            community-notification-time
                                        "
                                    >
                                        ${escapeHTML(
                                            relativeTime(
                                                notification.created_at
                                            )
                                        )}
                                    </div>

                                </div>


                                ${
                                    notification.read
                                        ? ""
                                        :
                                        `
                                            <span
                                                class="
                                                    community-unread-dot
                                                "
                                            ></span>
                                        `
                                }

                            </div>
                        `;

                    }
                )
                .join("");


        updateUnreadCount();

    }


    /* ========================================================
       MARK READ
       ======================================================== */

    async function markNotificationRead(
        notification
    ) {

        if (
            !notification ||
            notification.read
        ) {
            return;
        }


        const supabase =
            getSupabase();


        if (
            notification.source ===
            "fan"
        ) {

            const {
                error
            } =
                await supabase
                    .from("fan_notifications")
                    .update({
                        read_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        "id",
                        notification.id
                    )
                    .eq(
                        "recipient_id",
                        state.user.id
                    );


            if (error) {

                console.error(
                    "BR Comunidade: erro ao marcar notificação.",
                    error
                );

                return;

            }

        } else {

            const {
                error
            } =
                await supabase
                    .from("notifications")
                    .update({
                        read: true
                    })
                    .eq(
                        "id",
                        notification.id
                    )
                    .eq(
                        "user_id",
                        state.user.id
                    );


            if (error) {

                console.error(
                    "BR Comunidade: erro ao marcar notificação.",
                    error
                );

                return;

            }

        }


        notification.read =
            true;


        updateUnreadCount();

        renderNotifications();

    }


    async function markAllNotificationsRead() {

        const supabase =
            getSupabase();


        const now =
            new Date().toISOString();


        const [
            fanResult,
            generalResult
        ] = await Promise.all([

            supabase
                .from("fan_notifications")
                .update({
                    read_at: now
                })
                .eq(
                    "recipient_id",
                    state.user.id
                )
                .is(
                    "read_at",
                    null
                ),

            supabase
                .from("notifications")
                .update({
                    read: true
                })
                .eq(
                    "user_id",
                    state.user.id
                )
                .eq(
                    "read",
                    false
                )

        ]);


        if (fanResult.error) {

            console.error(
                "BR Comunidade: erro ao marcar fan notifications.",
                fanResult.error
            );

        }


        if (generalResult.error) {

            console.error(
                "BR Comunidade: erro ao marcar notifications.",
                generalResult.error
            );

        }


        state.notifications.forEach(
            notification => {

                notification.read =
                    true;

            }
        );


        renderNotifications();

    }


    /* ========================================================
       MY COMMENTS
       ======================================================== */

    async function loadMyComments() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("fan_comments")
                .select(`
                    id,
                    article_key,
                    user_id,
                    parent_id,
                    body,
                    created_at
                `)
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
                .limit(200);


        if (error) {

            console.error(
                "BR Comunidade: meus comentários.",
                error
            );

            state.comments = [];

            renderMyComments();

            return;

        }


        /*
         * Preserve comments already loaded from notifications.
         */
        const merged =
            new Map();


        state.comments.forEach(
            comment => {

                merged.set(
                    Number(comment.id),
                    comment
                );

            }
        );


        (data || []).forEach(
            comment => {

                merged.set(
                    Number(comment.id),
                    comment
                );

            }
        );


        state.comments =
            [...merged.values()];


        await loadReactions(
            state.comments.map(
                comment =>
                    comment.id
            )
        );


        renderMyComments();

    }


    function commentArticleLabel(
        articleKey
    ) {

        if (!articleKey) {
            return "Publicação";
        }


        if (
            articleKey.startsWith(
                "news:"
            )
        ) {
            return "Notícia";
        }


        if (
            articleKey.startsWith(
                "content:"
            )
        ) {
            return "Conteúdo";
        }


        if (
            articleKey.startsWith(
                "standings:"
            )
        ) {
            return "Classificação";
        }


        return "Publicação";

    }


    function renderMyComments() {

        const container =
            $("#community-my-comments");


        const count =
            $("#my-comments-count");


        if (count) {

            const myComments =
                state.comments.filter(
                    comment =>
                        comment.user_id ===
                        state.user.id
                );


            count.textContent =
                myComments.length;

        }


        if (!container) {
            return;
        }


        const myComments =
            state.comments
                .filter(
                    comment =>
                        comment.user_id ===
                        state.user.id
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.created_at
                        ) -
                        new Date(
                            a.created_at
                        )
                );


        if (!myComments.length) {

            container.innerHTML = `
                <div class="community-card">
                    <div class="community-empty">
                        Ainda não fizeste nenhum comentário.
                    </div>
                </div>
            `;

            return;

        }


        container.innerHTML = `

            <div class="community-card">

                ${
                    myComments
                        .map(
                            comment => {

                                return `
                                    <div
                                        class="
                                            community-my-comment
                                            community-conversation-comment
                                        "
                                        data-my-comment-key="${escapeHTML(
                                            comment.article_key
                                        )}"
                                        data-my-comment-id="${
                                            comment.id
                                        }"
                                    >

                                        ${avatarHTML(
                                            state.profile,
                                            "community-my-comment-avatar"
                                        )}


                                        <div
                                            class="
                                                community-my-comment-body
                                            "
                                        >

                                            <div
                                                class="
                                                    community-my-comment-article
                                                "
                                            >
                                                ${escapeHTML(
                                                    commentArticleLabel(
                                                        comment.article_key
                                                    )
                                                )}
                                            </div>


                                            <div
                                                class="
                                                    community-my-comment-text
                                                "
                                            >
                                                ${escapeHTML(
                                                    comment.body
                                                )}
                                            </div>


                                            <div
                                                class="
                                                    community-my-comment-meta
                                                "
                                            >

                                                <span>
                                                    ${escapeHTML(
                                                        relativeTime(
                                                            comment.created_at
                                                        )
                                                    )}
                                                </span>


                                                ${
                                                    comment.parent_id
                                                        ? `
                                                            <span>
                                                                · Resposta
                                                            </span>
                                                        `
                                                        : ""
                                                }

                                            </div>


                                            ${commentActionsHTML(
                                                comment
                                            )}

                                        </div>

                                    </div>
                                `;

                            }
                        )
                        .join("")
                }

            </div>

        `;

    }


    /* ========================================================
       FAVORITE PEOPLE
       ======================================================== */

    async function loadFavorites() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("favorite_people")
                .select(`
                    follower_id,
                    followed_id,
                    created_at
                `)
                .eq(
                    "follower_id",
                    state.user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "BR Comunidade: favorite_people.",
                error
            );

            state.favorites = [];

            renderFavorites();

            return;

        }


        state.favorites =
            data || [];


        await loadProfiles(
            state.favorites.map(
                favorite =>
                    favorite.followed_id
            )
        );


        renderFavorites();

    }


    function renderFavorites() {

        const container =
            $("#favorite-people");


        if (!container) {
            return;
        }


        if (!state.favorites.length) {

            container.innerHTML = `
                <div class="community-card">
                    <div class="community-empty">
                        Ainda não tens pessoas favoritas.
                    </div>
                </div>
            `;

            return;

        }


        container.innerHTML =
            state.favorites
                .map(
                    favorite => {

                        const profile =
                            getProfile(
                                favorite.followed_id
                            );


                        return `
                            <div class="favorite-person">

                                ${avatarHTML(
                                    profile,
                                    "favorite-avatar"
                                )}


                                <div
                                    class="
                                        favorite-person-info
                                    "
                                >

                                    <div
                                        class="
                                            favorite-person-name
                                        "
                                    >
                                        ${escapeHTML(
                                            profile.display_name ||
                                            profile.username ||
                                            "Utilizador"
                                        )}
                                    </div>


                                    ${
                                        profile.username
                                            ? `
                                                <div
                                                    class="
                                                        favorite-person-username
                                                    "
                                                >
                                                    @${escapeHTML(
                                                        profile.username
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>


                                <button
                                    class="favorite-remove"
                                    type="button"
                                    data-remove-favorite="${escapeHTML(
                                        favorite.followed_id
                                    )}"
                                >
                                    Seguindo
                                </button>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    async function unfollowPerson(
        userId
    ) {

        const supabase =
            getSupabase();


        const {
            error
        } =
            await supabase
                .from("favorite_people")
                .delete()
                .eq(
                    "follower_id",
                    state.user.id
                )
                .eq(
                    "followed_id",
                    userId
                );


        if (error) {

            console.error(
                "BR Comunidade: erro ao deixar de seguir.",
                error
            );

            return;

        }


        state.favorites =
            state.favorites.filter(
                favorite =>
                    favorite.followed_id !==
                    userId
            );


        renderFavorites();

    }


    /* ========================================================
       CONVERSATIONS
       ======================================================== */

    async function loadConversations() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("fan_comments")
                .select(`
                    id,
                    article_key,
                    user_id,
                    parent_id,
                    body,
                    created_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(200);


        if (error) {

            console.error(
                "BR Comunidade: conversas.",
                error
            );

            state.conversations = [];

            renderConversations();

            return;

        }


        await loadProfiles(
            (data || []).map(
                comment =>
                    comment.user_id
            )
        );


        const commentIds =
            (data || []).map(
                comment =>
                    comment.id
            );


        await loadReactions(
            commentIds
        );


        const groups =
            new Map();


        (data || []).forEach(
            comment => {

                if (
                    !groups.has(
                        comment.article_key
                    )
                ) {

                    groups.set(
                        comment.article_key,
                        {
                            article_key:
                                comment.article_key,

                            latest:
                                comment.created_at,

                            count: 0,

                            comments: []
                        }
                    );

                }


                const group =
                    groups.get(
                        comment.article_key
                    );


                group.count++;


                if (
                    group.comments.length <
                    3
                ) {

                    group.comments.push(
                        comment
                    );

                }

            }
        );


        state.conversations =
            [...groups.values()]
                .sort(
                    (a, b) =>
                        new Date(
                            b.latest
                        ) -
                        new Date(
                            a.latest
                        )
                )
                .slice(
                    0,
                    10
                );


        renderConversations();

    }


    function renderConversations() {

        const container =
            $("#community-conversations");


        if (!container) {
            return;
        }


        if (!state.conversations.length) {

            container.innerHTML = `
                <div class="community-card">
                    <div class="community-empty">
                        Ainda não existem conversas.
                    </div>
                </div>
            `;

            return;

        }


        container.innerHTML = `

            <div class="community-card">

                ${
                    state.conversations
                        .map(
                            conversation => {

                                return `
                                    <div
                                        class="
                                            community-conversation
                                        "
                                        data-conversation-key="${escapeHTML(
                                            conversation.article_key
                                        )}"
                                    >

                                        <div
                                            class="
                                                community-conversation-info
                                            "
                                        >

                                            <div
                                                class="
                                                    community-conversation-title
                                                "
                                            >
                                                Conversa sobre esta publicação
                                            </div>


                                            <div
                                                class="
                                                    community-conversation-meta
                                                "
                                            >
                                                ${
                                                    conversation.count
                                                }
                                                ${
                                                    conversation.count === 1
                                                        ? "comentário"
                                                        : "comentários"
                                                }

                                                ·

                                                ${escapeHTML(
                                                    relativeTime(
                                                        conversation.latest
                                                    )
                                                )}
                                            </div>

                                        </div>


                                        ${
                                            (conversation.comments || [])
                                                .map(
                                                    comment => {

                                                        const profile =
                                                            getProfile(
                                                                comment.user_id
                                                            );


                                                        return `
                                                            <div
                                                                class="
                                                                    community-conversation-comment
                                                                "
                                                                data-conversation-comment-id="${
                                                                    comment.id
                                                                }"
                                                            >

                                                                <div
                                                                    class="
                                                                        community-conversation-comment-head
                                                                    "
                                                                >

                                                                    ${avatarHTML(
                                                                        profile,
                                                                        "community-conversation-comment-avatar"
                                                                    )}


                                                                    <div
                                                                        class="
                                                                            community-conversation-comment-info
                                                                        "
                                                                    >

                                                                        <div
                                                                            class="
                                                                                community-conversation-comment-name
                                                                            "
                                                                        >
                                                                            ${escapeHTML(
                                                                                profile.display_name ||
                                                                                profile.username ||
                                                                                "Utilizador"
                                                                            )}
                                                                        </div>


                                                                        <div
                                                                            class="
                                                                                community-conversation-comment-time
                                                                            "
                                                                        >
                                                                            ${escapeHTML(
                                                                                relativeTime(
                                                                                    comment.created_at
                                                                                )
                                                                            )}
                                                                        </div>

                                                                    </div>

                                                                </div>


                                                                <div
                                                                    class="
                                                                        community-comment-preview
                                                                    "
                                                                >
                                                                    ${escapeHTML(
                                                                        comment.body
                                                                    )}
                                                                </div>


                                                                ${commentActionsHTML(
                                                                    comment
                                                                )}

                                                            </div>
                                                        `;

                                                    }
                                                )
                                                .join("")
                                        }


                                        <div
                                            class="
                                                community-conversation-arrow
                                            "
                                            data-conversation-open="${escapeHTML(
                                                conversation.article_key
                                            )}"
                                        >
                                            ↗ Abrir conversa completa
                                        </div>

                                    </div>
                                `;

                            }
                        )
                        .join("")
                }

            </div>

        `;

    }


    /* ========================================================
       PRIVATE MESSAGES
       ======================================================== */

    async function loadMessages() {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("private_messages")
                .select(`
                    id,
                    sender_id,
                    recipient_id,
                    subject,
                    body,
                    message_type,
                    sent_at,
                    read_at,
                    created_at
                `)
                .eq(
                    "recipient_id",
                    state.user.id
                )
                .order(
                    "sent_at",
                    {
                        ascending: false
                    }
                )
                .limit(20);


        if (error) {

            console.error(
                "BR Comunidade: mensagens.",
                error
            );

            state.messages = [];

            renderMessages();

            return;

        }


        state.messages =
            data || [];


        await loadProfiles(
            state.messages.map(
                message =>
                    message.sender_id
            )
        );


        renderMessages();

    }


    function renderMessages() {

        const container =
            $("#community-messages");


        if (!container) {
            return;
        }


        if (!state.messages.length) {

            container.innerHTML = `
                <div class="community-card">
                    <div class="community-empty">
                        Não tens mensagens privadas.
                    </div>
                </div>
            `;

            return;

        }


        container.innerHTML = `

            <div class="community-card">

                ${
                    state.messages
                        .map(
                            message => {

                                const sender =
                                    getProfile(
                                        message.sender_id
                                    );


                                return `
                                    <div
                                        class="
                                            community-message
                                            ${
                                                message.read_at
                                                    ? ""
                                                    : "unread"
                                            }
                                        "
                                        data-message-id="${escapeHTML(
                                            message.id
                                        )}"
                                    >

                                        ${avatarHTML(
                                            sender,
                                            "message-avatar"
                                        )}


                                        <div
                                            class="
                                                community-message-info
                                            "
                                        >

                                            <div
                                                class="
                                                    community-message-name
                                                "
                                            >
                                                ${escapeHTML(
                                                    sender.display_name ||
                                                    sender.username ||
                                                    "Utilizador"
                                                )}
                                            </div>


                                            <div
                                                class="
                                                    community-message-subject
                                                "
                                            >
                                                ${escapeHTML(
                                                    message.subject
                                                )}
                                            </div>


                                            <div
                                                class="
                                                    community-message-time
                                                "
                                            >
                                                ${escapeHTML(
                                                    relativeTime(
                                                        message.sent_at
                                                    )
                                                )}
                                            </div>

                                        </div>

                                    </div>
                                `;

                            }
                        )
                        .join("")
                }

            </div>

        `;

    }


    /* ========================================================
       OPEN ARTICLE / COMMENT
       ======================================================== */

    function openConversation(
        articleKey,
        commentId
    ) {

        if (!articleKey) {
            return;
        }


        localStorage.setItem(
            "br_pending_article_key",
            articleKey
        );


        if (
            commentId !== null &&
            commentId !== undefined &&
            commentId !== ""
        ) {

            localStorage.setItem(
                "br_pending_comment_id",
                String(commentId)
            );

        } else {

            localStorage.removeItem(
                "br_pending_comment_id"
            );

        }


        window.location.href =
            "home.html";

    }


    /* ========================================================
       RENDER REFRESH
       ======================================================== */

    function renderInteractiveAreas() {

        renderNotifications();

        renderMyComments();

        renderConversations();

    }


    /* ========================================================
       BACK NAVIGATION
       ======================================================== */

    function goBack() {

        const referrer =
            document.referrer || "";


        if (
            referrer &&
            referrer.includes(
                window.location.origin
            ) &&
            !referrer.includes(
                "comunidade.html"
            )
        ) {

            window.history.back();

            return;

        }


        window.location.href =
            "home.html";

    }


    /* ========================================================
       FIND PEOPLE
       ======================================================== */

    function openPeopleSearch() {

        window.location.href =
            "profile.html";

    }


    /* ========================================================
       EVENT HANDLERS
       ======================================================== */

    function bindEvents() {

        const back =
            $("#community-back");


        if (back) {

            back.addEventListener(
                "click",
                goBack
            );

        }


        const home =
            $("#home-nav");


        if (home) {

            home.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "home.html";

                }
            );

        }


        const community =
            $("#community-nav");


        if (community) {

            community.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.reload();

                }
            );

        }


        const matches =
            $("#matches-nav");


        if (matches) {

            matches.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "home.html#fixtures-section";

                }
            );

        }


        const profile =
            $("#profile-nav");


        if (profile) {

            profile.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "profile.html";

                }
            );

        }


        const markRead =
            $("#community-mark-read");


        if (markRead) {

            markRead.addEventListener(
                "click",
                markAllNotificationsRead
            );

        }


        const findPeople =
            $("#find-people-button");


        if (findPeople) {

            findPeople.addEventListener(
                "click",
                openPeopleSearch
            );

        }


        document.addEventListener(
            "click",
            async event => {

                /* ============================================
                   LIKE
                   ============================================ */

                const likeButton =
                    event.target.closest(
                        "[data-community-like]"
                    );


                if (likeButton) {

                    event.preventDefault();
                    event.stopPropagation();


                    await toggleReaction(
                        Number(
                            likeButton.dataset
                                .communityLike
                        ),
                        "like"
                    );


                    return;

                }


                /* ============================================
                   DISLIKE
                   ============================================ */

                const dislikeButton =
                    event.target.closest(
                        "[data-community-dislike]"
                    );


                if (dislikeButton) {

                    event.preventDefault();
                    event.stopPropagation();


                    await toggleReaction(
                        Number(
                            dislikeButton.dataset
                                .communityDislike
                        ),
                        "dislike"
                    );


                    return;

                }


                /* ============================================
                   REPLY
                   ============================================ */

                const replyButton =
                    event.target.closest(
                        "[data-community-reply]"
                    );


                if (replyButton) {

                    event.preventDefault();
                    event.stopPropagation();


                    toggleReplyBox(
                        Number(
                            replyButton.dataset
                                .communityReply
                        )
                    );


                    return;

                }


                /* ============================================
                   CANCEL REPLY
                   ============================================ */

                const cancelReply =
                    event.target.closest(
                        "[data-cancel-reply]"
                    );


                if (cancelReply) {

                    event.preventDefault();
                    event.stopPropagation();


                    state.replyOpen =
                        null;


                    renderInteractiveAreas();


                    return;

                }


                /* ============================================
                   SUBMIT REPLY
                   ============================================ */

                const submitReplyButton =
                    event.target.closest(
                        "[data-submit-reply]"
                    );


                if (submitReplyButton) {

                    event.preventDefault();
                    event.stopPropagation();


                    await submitReply(
                        Number(
                            submitReplyButton.dataset
                                .submitReply
                        )
                    );


                    return;

                }


                /* ============================================
                   OPEN CONVERSATION FROM COMMENT
                   ============================================ */

                const openComment =
                    event.target.closest(
                        "[data-community-open]"
                    );


                if (openComment) {

                    event.preventDefault();
                    event.stopPropagation();


                    const commentId =
                        Number(
                            openComment.dataset
                                .communityOpen
                        );


                    const articleKey =
                        openComment.dataset
                            .articleKey;


                    openConversation(
                        articleKey,
                        commentId
                    );


                    return;

                }


                /* ============================================
                   OPEN FULL CONVERSATION
                   ============================================ */

                const openFullConversation =
                    event.target.closest(
                        "[data-conversation-open]"
                    );


                if (openFullConversation) {

                    event.preventDefault();
                    event.stopPropagation();


                    openConversation(
                        openFullConversation.dataset
                            .conversationOpen
                    );


                    return;

                }


                /* ============================================
                   NOTIFICATION
                   ============================================ */

                const notificationElement =
                    event.target.closest(
                        "[data-notification-id]"
                    );


                if (
                    notificationElement &&
                    !event.target.closest(
                        ".community-comment-actions"
                    ) &&
                    !event.target.closest(
                        ".community-comment-reply"
                    )
                ) {

                    const id =
                        notificationElement
                            .dataset
                            .notificationId;


                    const source =
                        notificationElement
                            .dataset
                            .notificationSource;


                    const item =
                        state.notifications.find(
                            notification =>
                                notification.id === id &&
                                notification.source === source
                        );


                    if (!item) {
                        return;
                    }


                    await markNotificationRead(
                        item
                    );


                    if (
                        item.article_key
                    ) {

                        openConversation(
                            item.article_key,
                            item.comment_id
                        );

                    }


                    return;

                }


                /* ============================================
                   MY COMMENT
                   ============================================ */

                const myComment =
                    event.target.closest(
                        "[data-my-comment-id]"
                    );


                if (
                    myComment &&
                    !event.target.closest(
                        ".community-comment-actions"
                    ) &&
                    !event.target.closest(
                        ".community-comment-reply"
                    )
                ) {

                    openConversation(
                        myComment.dataset
                            .myCommentKey,

                        myComment.dataset
                            .myCommentId
                    );

                    return;

                }


                /* ============================================
                   FAVORITE
                   ============================================ */

                const favoriteButton =
                    event.target.closest(
                        "[data-remove-favorite]"
                    );


                if (favoriteButton) {

                    event.stopPropagation();


                    await unfollowPerson(
                        favoriteButton.dataset
                            .removeFavorite
                    );


                    return;

                }


                /* ============================================
                   CONVERSATION
                   ============================================ */

                const conversation =
                    event.target.closest(
                        "[data-conversation-key]"
                    );


                if (
                    conversation &&
                    !event.target.closest(
                        ".community-comment-actions"
                    ) &&
                    !event.target.closest(
                        ".community-comment-reply"
                    ) &&
                    !event.target.closest(
                        "[data-conversation-open]"
                    )
                ) {

                    openConversation(
                        conversation.dataset
                            .conversationKey
                    );


                    return;

                }

            }
        );

    }


    /* ========================================================
       INITIAL LOAD
       ======================================================== */

    async function init() {

        try {

            injectQuickInteractionStyles();


            const authenticated =
                await loadCurrentUser();


            if (!authenticated) {
                return;
            }


            bindEvents();


            await Promise.all([

                loadNotifications(),

                loadMyComments(),

                loadFavorites(),

                loadConversations(),

                loadMessages()

            ]);


            /*
             * loadMyComments and loadConversations can
             * refresh the reaction cache, so render once
             * more after all data is available.
             */
            renderInteractiveAreas();


            updateUnreadCount();


        } catch (error) {

            console.error(
                "BR Comunidade: erro de inicialização.",
                error
            );


            setHTML(
                "#community-notifications",
                `
                    <div class="community-card">
                        <div class="community-empty">
                            Não foi possível carregar a comunidade.
                        </div>
                    </div>
                `
            );

        }

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.BarcaRealCommunity = {

        reload: init,

        getUnreadCount

    };


})();
```
