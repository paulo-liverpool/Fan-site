/* ============================================================
   BARÇA REAL — COMUNIDADE
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
        conversations: [],
        messages: [],
        profiles: new Map()
    };


    /* ========================================================
       HELPERS
       ======================================================== */

    const $ = (selector) =>
        document.querySelector(selector);


    function getSupabase() {

        return (
            window.supabaseClient ||
            window.supabase ||
            window.supabaseClient
        );

    }


    function escapeHTML(value) {

        if (value === null || value === undefined) {
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
            .map(part => part.charAt(0))
            .join("")
            .toUpperCase();

    }


    function avatarHTML(profile, className) {

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
                ${escapeHTML(initials(profile))}
            </div>
        `;

    }


    function relativeTime(dateValue) {

        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);
        const now = new Date();

        const seconds =
            Math.floor((now - date) / 1000);

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
            return `Há ${days} ${days === 1 ? "dia" : "dias"}`;
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


    function setHTML(selector, html) {

        const element = $(selector);

        if (element) {
            element.innerHTML = html;
        }

    }


    /* ========================================================
       PROFILE CACHE
       ======================================================== */

    async function loadProfiles(ids) {

        const supabase = getSupabase();

        const uniqueIds = [
            ...new Set(
                ids.filter(Boolean)
            )
        ];

        const missingIds = uniqueIds.filter(
            id => !state.profiles.has(id)
        );

        if (!missingIds.length) {
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                avatar_url,
                bio
            `)
            .in("id", missingIds);

        if (error) {
            console.error(
                "BR Comunidade: erro ao carregar perfis.",
                error
            );
            return;
        }

        (data || []).forEach(profile => {

            state.profiles.set(
                profile.id,
                profile
            );

        });

    }


    function getProfile(id) {

        return state.profiles.get(id) || {
            id,
            display_name: "Utilizador",
            username: "",
            avatar_url: null
        };

    }


    /* ========================================================
       AUTH
       ======================================================== */

    async function loadCurrentUser() {

        const supabase = getSupabase();

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
        } = await supabase.auth.getUser();

        if (error || !user) {

            window.location.href = "login.html";

            return false;
        }

        state.user = user;

        const {
            data: profile
        } = await supabase
            .from("profiles")
            .select(`
                id,
                username,
                display_name,
                avatar_url,
                bio,
                supported_team_id
            `)
            .eq("id", user.id)
            .maybeSingle();

        state.profile = profile || {
            id: user.id,
            display_name:
                user.email?.split("@")[0] ||
                "Utilizador"
        };

        return true;

    }


    /* ========================================================
       FAN NOTIFICATIONS
       ======================================================== */

    async function loadFanNotifications() {

        const supabase = getSupabase();

        const {
            data,
            error
        } = await supabase
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
            .eq("recipient_id", state.user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(50);

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

        const supabase = getSupabase();

        const {
            data,
            error
        } = await supabase
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
            .eq("user_id", state.user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(50);

        if (error) {

            console.error(
                "BR Comunidade: notifications.",
                error
            );

            return [];

        }

        return data || [];

    }


    function fanNotificationText(notification) {

        const actor =
            getProfile(notification.actor_id);

        const name =
            actor.display_name ||
            actor.username ||
            "Alguém";


        switch (notification.type) {

            case "comment_reply":
            case "reply":

                return {
                    title:
                        `${name} respondeu ao teu comentário`,
                    message:
                        "Toca para entrar na conversa."
                };


            case "comment_like":
            case "like":

                return {
                    title:
                        `${name} gostou do teu comentário`,
                    message:
                        "Toca para ver a conversa."
                };


            case "comment_dislike":
            case "dislike":

                return {
                    title:
                        `${name} não gostou do teu comentário`,
                    message:
                        "Toca para ver a conversa."
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
                notification => notification.actor_id
            )
        );


        const fanItems =
            fanNotifications.map(notification => {

                const text =
                    fanNotificationText(
                        notification
                    );

                return {
                    source: "fan",
                    id: notification.id,
                    type: notification.type,
                    actor_id: notification.actor_id,
                    article_key: notification.article_key,
                    comment_id: notification.comment_id,
                    created_at: notification.created_at,
                    read: Boolean(notification.read_at),
                    title: text.title,
                    message: text.message
                };

            });


        const generalItems =
            generalNotifications.map(notification => {

                return {
                    source: "general",
                    id: notification.id,
                    type: notification.type,
                    related_id: notification.related_id,
                    created_at: notification.created_at,
                    read: notification.read,
                    title:
                        notification.title ||
                        "Nova atividade",
                    message:
                        notification.message ||
                        ""
                };

            });


        state.notifications = [
            ...fanItems,
            ...generalItems
        ]
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )
            .slice(0, 50);


        renderNotifications();

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
                        Não tens notificações novas.
                    </div>
                </div>
            `;

            updateUnreadCount();

            return;

        }


        const html =
            state.notifications
                .map(notification => {

                    const actor =
                        notification.actor_id
                            ? getProfile(
                                notification.actor_id
                            )
                            : state.profile;


                    return `
                        <div
                            class="
                                community-card
                                community-notification
                                ${notification.read
                                    ? ""
                                    : "unread"}
                            "
                            data-notification-source="${escapeHTML(notification.source)}"
                            data-notification-id="${escapeHTML(notification.id)}"
                            data-article-key="${escapeHTML(notification.article_key || "")}"
                            data-comment-id="${notification.comment_id || ""}"
                        >

                            ${avatarHTML(
                                actor,
                                "community-notification-avatar"
                            )}

                            <div class="community-notification-body">

                                <div class="community-notification-title">
                                    ${escapeHTML(notification.title)}
                                </div>

                                <div class="community-notification-message">
                                    ${escapeHTML(notification.message)}
                                </div>

                                <div class="community-notification-time">
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
                                    : `<span class="community-unread-dot"></span>`
                            }

                        </div>
                    `;

                })
                .join("");


        container.innerHTML = html;

        updateUnreadCount();

    }


    function updateUnreadCount() {

        const count =
            state.notifications.filter(
                notification => !notification.read
            ).length;


        const topCount =
            $("#community-unread-count");

        const badge =
            $("#fan-notification-badge");


        if (topCount) {

            topCount.textContent = count;

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

    }


    /* ========================================================
       MARK NOTIFICATION READ
       ======================================================== */

    async function markNotificationRead(notification) {

        if (notification.read) {
            return;
        }

        const supabase = getSupabase();


        if (notification.source === "fan") {

            const {
                error
            } = await supabase
                .from("fan_notifications")
                .update({
                    read_at: new Date().toISOString()
                })
                .eq("id", notification.id)
                .eq("recipient_id", state.user.id);


            if (error) {
                console.error(error);
                return;
            }

        } else {

            const {
                error
            } = await supabase
                .from("notifications")
                .update({
                    read: true
                })
                .eq("id", notification.id)
                .eq("user_id", state.user.id);


            if (error) {
                console.error(error);
                return;
            }

        }


        notification.read = true;

        renderNotifications();

    }


    async function markAllNotificationsRead() {

        const supabase = getSupabase();

        const now =
            new Date().toISOString();


        await Promise.all([

            supabase
                .from("fan_notifications")
                .update({
                    read_at: now
                })
                .eq("recipient_id", state.user.id)
                .is("read_at", null),

            supabase
                .from("notifications")
                .update({
                    read: true
                })
                .eq("user_id", state.user.id)
                .eq("read", false)

        ]);


        state.notifications.forEach(
            notification => {
                notification.read = true;
            }
        );


        renderNotifications();

    }


    /* ========================================================
       FAVOURITE PEOPLE
       ======================================================== */

    async function loadFavorites() {

        const supabase = getSupabase();

        const {
            data,
            error
        } = await supabase
            .from("favorite_people")
            .select(`
                follower_id,
                followed_id,
                created_at
            `)
            .eq("follower_id", state.user.id)
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "BR Comunidade: favorite_people.",
                error
            );

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
                .map(favorite => {

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

                            <div class="favorite-person-info">

                                <div class="favorite-person-name">
                                    ${escapeHTML(
                                        profile.display_name ||
                                        profile.username ||
                                        "Utilizador"
                                    )}
                                </div>

                                ${
                                    profile.username
                                        ? `
                                            <div class="favorite-person-username">
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

                })
                .join("");

    }


    async function unfollowPerson(userId) {

        const supabase = getSupabase();

        const {
            error
        } = await supabase
            .from("favorite_people")
            .delete()
            .eq("follower_id", state.user.id)
            .eq("followed_id", userId);


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
                    favorite.followed_id !== userId
            );


        renderFavorites();

    }


    /* ========================================================
       RECENT CONVERSATIONS
       ======================================================== */

    async function loadConversations() {

        const supabase = getSupabase();


        const {
            data,
            error
        } = await supabase
            .from("fan_comments")
            .select(`
                article_key,
                created_at
            `)
            .order("created_at", {
                ascending: false
            })
            .limit(100);


        if (error) {

            console.error(
                "BR Comunidade: conversas.",
                error
            );

            return;

        }


        const groups =
            new Map();


        (data || []).forEach(comment => {

            if (!groups.has(comment.article_key)) {

                groups.set(
                    comment.article_key,
                    {
                        article_key:
                            comment.article_key,
                        latest:
                            comment.created_at,
                        count: 0
                    }
                );

            }

            groups.get(
                comment.article_key
            ).count++;

        });


        state.conversations =
            [...groups.values()]
                .slice(0, 10);


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
                        .map(conversation => {

                            return `
                                <div
                                    class="community-conversation"
                                    data-conversation-key="${escapeHTML(
                                        conversation.article_key
                                    )}"
                                >

                                    <div class="community-conversation-info">

                                        <div class="community-conversation-title">
                                            Conversa sobre esta publicação
                                        </div>

                                        <div class="community-conversation-meta">
                                            ${conversation.count}
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

                                    <div class="community-conversation-arrow">
                                        →
                                    </div>

                                </div>
                            `;

                        })
                        .join("")
                }

            </div>
        `;

    }


    /* ========================================================
       PRIVATE MESSAGES
       ======================================================== */

    async function loadMessages() {

        const supabase = getSupabase();


        const {
            data,
            error
        } = await supabase
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
            .eq("recipient_id", state.user.id)
            .order("sent_at", {
                ascending: false
            })
            .limit(10);


        if (error) {

            console.error(
                "BR Comunidade: mensagens.",
                error
            );

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
                        .map(message => {

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

                                    <div class="community-message-info">

                                        <div class="community-message-name">
                                            ${escapeHTML(
                                                sender.display_name ||
                                                sender.username ||
                                                "Utilizador"
                                            )}
                                        </div>

                                        <div class="community-message-subject">
                                            ${escapeHTML(
                                                message.subject
                                            )}
                                        </div>

                                        <div class="community-message-time">
                                            ${escapeHTML(
                                                relativeTime(
                                                    message.sent_at
                                                )
                                            )}
                                        </div>

                                    </div>

                                </div>
                            `;

                        })
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


        /*
         * Phase 4 will consume these values and open
         * the exact article/comment.
         */

        localStorage.setItem(
            "br_pending_article_key",
            articleKey
        );


        if (commentId) {

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
       FIND PEOPLE
       ======================================================== */

    function openPeopleSearch() {

        /*
         * Public profile/search screen belongs to the
         * profile/community expansion.
         *
         * For now, navigate to profile.
         */

        window.location.href =
            "perfil.html";

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
                () => {
                    window.location.href =
                        "home.html";
                }
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


        const matches =
            $("#matches-nav");

        if (matches) {

            matches.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "home.html";
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
                        "perfil.html";
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

                const notification =
                    event.target.closest(
                        "[data-notification-id]"
                    );


                if (notification) {

                    const id =
                        notification.dataset
                            .notificationId;

                    const source =
                        notification.dataset
                            .notificationSource;


                    const item =
                        state.notifications.find(
                            notificationItem =>
                                notificationItem.id === id &&
                                notificationItem.source === source
                        );


                    if (!item) {
                        return;
                    }


                    await markNotificationRead(
                        item
                    );


                    if (item.article_key) {

                        openConversation(
                            item.article_key,
                            item.comment_id
                        );

                    }

                    return;

                }


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


                const conversation =
                    event.target.closest(
                        "[data-conversation-key]"
                    );


                if (conversation) {

                    openConversation(
                        conversation.dataset
                            .conversationKey
                    );

                }

            }
        );

    }


    /* ========================================================
       INITIAL LOAD
       ======================================================== */

    async function init() {

        try {

            const authenticated =
                await loadCurrentUser();


            if (!authenticated) {
                return;
            }


            bindEvents();


            await Promise.all([
                loadNotifications(),
                loadFavorites(),
                loadConversations(),
                loadMessages()
            ]);


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
        reload: init
    };


})();
