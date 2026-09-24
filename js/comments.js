/* ============================================================
   BARÇA REAL — FAN COMMENTS COMPONENT
   ============================================================ */

(function () {

    "use strict";


    const state = {

        articleKey: null,

        user: null,

        profile: null,

        comments: [],

        reactions: [],

        profiles: new Map(),

        sort: "best",

        replyingTo: null,

        notificationChannel: null

    };


    /* ========================================================
       SUPABASE
       ======================================================== */

    function getSupabase() {

        if (
            typeof supabaseClient !== "undefined"
        ) {
            return supabaseClient;
        }

        if (
            typeof window.supabaseClient !== "undefined"
        ) {
            return window.supabaseClient;
        }

        console.error(
            "BR Comments: Supabase client não encontrado."
        );

        return null;
    }


    /* ========================================================
       HELPERS
       ======================================================== */

    function $(selector, parent = document) {

        return parent.querySelector(selector);

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function escapeAttribute(value) {

        return escapeHTML(value);

    }


    function getInitials(name) {

        const clean =
            String(name || "Adepto")
                .trim()
                .replace(/\s+/g, " ");


        if (!clean) {
            return "A";
        }


        const parts =
            clean.split(" ");


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();

    }


    function relativeTime(dateString) {

        const date =
            new Date(dateString);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        const seconds =
            Math.floor(
                (
                    Date.now() -
                    date.getTime()
                ) / 1000
            );


        if (seconds < 10) {
            return "agora";
        }


        if (seconds < 60) {
            return `há ${seconds} segundos`;
        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        if (minutes === 1) {
            return "há 1 minuto";
        }


        if (minutes < 60) {
            return `há ${minutes} minutos`;
        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours === 1) {
            return "há 1 hora";
        }


        if (hours < 24) {
            return `há ${hours} horas`;
        }


        const days =
            Math.floor(
                hours / 24
            );


        if (days === 1) {
            return "há 1 dia";
        }


        if (days < 30) {
            return `há ${days} dias`;
        }


        const months =
            Math.floor(
                days / 30
            );


        if (months === 1) {
            return "há 1 mês";
        }


        if (months < 12) {
            return `há ${months} meses`;
        }


        const years =
            Math.floor(
                months / 12
            );


        if (years === 1) {
            return "há 1 ano";
        }


        return `há ${years} anos`;

    }


    /* ========================================================
       PROFILE
       ======================================================== */

    function getProfileName(
        profile,
        fallbackUser
    ) {

        if (profile) {

            const names = [

                profile.display_name,

                profile.full_name,

                profile.name,

                profile.username,

                profile.nickname

            ];


            for (const name of names) {

                if (
                    typeof name === "string" &&
                    name.trim()
                ) {

                    return name.trim();

                }

            }

        }


        if (
            fallbackUser &&
            fallbackUser.user_metadata
        ) {

            const metadata =
                fallbackUser.user_metadata;


            const names = [

                metadata.display_name,

                metadata.full_name,

                metadata.name,

                metadata.username,

                metadata.nickname

            ];


            for (const name of names) {

                if (
                    typeof name === "string" &&
                    name.trim()
                ) {

                    return name.trim();

                }

            }

        }


        if (
            fallbackUser &&
            fallbackUser.email
        ) {

            return fallbackUser.email
                .split("@")[0];

        }


        return "Adepto";

    }


    function getProfileAvatar(
        profile,
        fallbackUser
    ) {

        if (profile) {

            const avatars = [

                profile.avatar_url,

                profile.avatar,

                profile.profile_image,

                profile.image_url,

                profile.photo_url

            ];


            for (const avatar of avatars) {

                if (
                    typeof avatar === "string" &&
                    avatar.trim()
                ) {

                    return avatar.trim();

                }

            }

        }


        if (
            fallbackUser &&
            fallbackUser.user_metadata
        ) {

            const metadata =
                fallbackUser.user_metadata;


            const avatars = [

                metadata.avatar_url,

                metadata.avatar,

                metadata.picture,

                metadata.profile_image

            ];


            for (const avatar of avatars) {

                if (
                    typeof avatar === "string" &&
                    avatar.trim()
                ) {

                    return avatar.trim();

                }

            }

        }


        return "";

    }


    async function loadProfile(userId) {

        const client =
            getSupabase();


        if (
            !client ||
            !userId
        ) {
            return null;
        }


        try {

            const {
                data,
                error
            } = await client
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();


            if (error) {

                console.warn(
                    "BR Comments: erro ao carregar perfil.",
                    error
                );

                return null;

            }


            return data || null;

        } catch (error) {

            console.warn(
                "BR Comments: erro ao carregar perfil.",
                error
            );

            return null;

        }

    }


    async function loadProfiles(userIds) {

        const client =
            getSupabase();


        if (
            !client ||
            !userIds.length
        ) {
            return;
        }


        try {

            const {
                data,
                error
            } = await client
                .from("profiles")
                .select("*")
                .in("id", userIds);


            if (error) {

                console.warn(
                    "BR Comments: erro ao carregar autores.",
                    error
                );

                return;

            }


            for (
                const profile of data || []
            ) {

                if (profile.id) {

                    state.profiles.set(
                        profile.id,
                        profile
                    );

                }

            }

        } catch (error) {

            console.warn(
                "BR Comments: erro ao carregar autores.",
                error
            );

        }

    }


    /* ========================================================
       ICONS
       ======================================================== */

    function likeIcon() {

        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z"></path>
                <path d="M7 20h10.2a2 2 0 0 0 1.9-1.4l2-6A2 2 0 0 0 19.2 10H15l.8-4.1A2.4 2.4 0 0 0 13.5 3L7 10v10Z"></path>
            </svg>
        `;

    }


    function dislikeIcon() {

        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 14V4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3Z"></path>
                <path d="M7 4h10.2a2 2 0 0 1 1.9 1.4l2 6A2 2 0 0 1 19.2 14H15l.8 4.1a2.4 2.4 0 0 1-2.3 2.9L7 14V4Z"></path>
            </svg>
        `;

    }


    function replyIcon() {

        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4.2-1L3 20l1.5-4.2A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"></path>
            </svg>
        `;

    }


    /* ========================================================
       SHELL
       ======================================================== */

    function renderShell(host) {

        host.innerHTML = `

            <section class="fan-comments">

                <div class="fan-comments-header">

                    <div>

                        <h2 class="fan-comments-title">
                            Comentários dos Adeptos
                        </h2>

                        <div
                            class="fan-comments-count"
                            id="fan-comments-count"
                        >
                            0 comentários
                        </div>

                    </div>


                    <div
                        class="fan-comments-user"
                        id="fan-comments-user"
                    >
                        Adepto
                    </div>

                </div>


                <div class="fan-comments-composer">

                    <textarea
                        id="fan-comment-input"
                        class="fan-comments-textarea"
                        maxlength="5000"
                        placeholder="Escreve o teu comentário..."
                    ></textarea>


                    <div class="fan-comments-submit-row">

                        <button
                            type="button"
                            class="fan-comments-submit"
                            data-action="submit-comment"
                        >
                            Comentar
                        </button>

                    </div>

                </div>


                <div class="fan-comments-filters">

                    <button
                        type="button"
                        class="fan-comments-filter active"
                        data-action="filter"
                        data-sort="best"
                    >
                        Melhores
                    </button>


                    <button
                        type="button"
                        class="fan-comments-filter"
                        data-action="filter"
                        data-sort="newest"
                    >
                        Mais recentes
                    </button>


                    <button
                        type="button"
                        class="fan-comments-filter"
                        data-action="filter"
                        data-sort="oldest"
                    >
                        Mais antigos
                    </button>

                </div>


                <div
                    class="fan-comments-list"
                    id="fan-comments-list"
                >

                    <div class="fan-comments-status">
                        A carregar comentários...
                    </div>

                </div>

            </section>
        `;

    }


    /* ========================================================
       DATA HELPERS
       ======================================================== */

    function getReaction(commentId) {

        const reaction =
            state.reactions.find(
                item =>
                    Number(item.comment_id) ===
                        Number(commentId) &&
                    item.user_id ===
                        state.user.id
            );


        return reaction
            ? reaction.reaction
            : null;

    }


    function getReactionCounts(commentId) {

        const reactions =
            state.reactions.filter(
                item =>
                    Number(item.comment_id) ===
                    Number(commentId)
            );


        let likes = 0;

        let dislikes = 0;


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

            }
        );


        return {
            likes,
            dislikes
        };

    }


    function getReplies(commentId) {

        return state.comments.filter(
            comment =>
                Number(comment.parent_id) ===
                Number(commentId)
        );

    }


    function getTopLevelComments() {

        return state.comments.filter(
            comment =>
                !comment.parent_id
        );

    }


    function sortComments(comments) {

        const sorted =
            [...comments];


        if (
            state.sort ===
            "newest"
        ) {

            return sorted.sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            );

        }


        if (
            state.sort ===
            "oldest"
        ) {

            return sorted.sort(
                (a, b) =>
                    new Date(a.created_at) -
                    new Date(b.created_at)
            );

        }


        return sorted.sort(
            (a, b) => {

                const aCounts =
                    getReactionCounts(a.id);

                const bCounts =
                    getReactionCounts(b.id);


                const aReplies =
                    getReplies(a.id).length;

                const bReplies =
                    getReplies(b.id).length;


                const aScore =
                    aCounts.likes +
                    aReplies;


                const bScore =
                    bCounts.likes +
                    bReplies;


                if (
                    bScore !== aScore
                ) {

                    return (
                        bScore -
                        aScore
                    );

                }


                return (
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );

            }
        );

    }


    /* ========================================================
       COMMENT HTML
       ======================================================== */

    function renderComment(
        comment,
        isReply = false
    ) {

        const profile =
            state.profiles.get(
                comment.user_id
            );


        const name =
            getProfileName(
                profile,
                null
            );


        const avatar =
            getProfileAvatar(
                profile,
                null
            );


        const counts =
            getReactionCounts(
                comment.id
            );


        const currentReaction =
            getReaction(
                comment.id
            );


        const replies =
            getReplies(
                comment.id
            );


        const body =
            escapeHTML(
                comment.body
            ).replace(
                /\n/g,
                "<br>"
            );


        const avatarHTML =
            avatar

                ? `
                    <div class="fan-comment-avatar">

                        <img
                            src="${escapeAttribute(avatar)}"
                            alt="${escapeAttribute(name)}"
                        >

                    </div>
                `

                : `
                    <div
                        class="fan-comment-avatar"
                        aria-hidden="true"
                    >
                        ${escapeHTML(
                            getInitials(name)
                        )}
                    </div>
                `;


        const replyBox =
            state.replyingTo ===
            comment.id

                ? renderReplyBox(
                    comment.id
                )

                : "";


        let repliesHTML = "";


        if (
            !isReply &&
            replies.length
        ) {

            repliesHTML = `

                <div class="fan-comment-replies">

                    ${replies
                        .sort(
                            (a, b) =>
                                new Date(
                                    a.created_at
                                ) -
                                new Date(
                                    b.created_at
                                )
                        )
                        .map(
                            reply =>
                                renderComment(
                                    reply,
                                    true
                                )
                        )
                        .join("")}

                </div>

            `;

        }


        return `

            <article
                class="fan-comment ${isReply ? "fan-comment-reply" : ""}"
                data-comment-id="${comment.id}"
            >

                <div class="fan-comment-main">

                    <div class="fan-comment-head">

                        ${avatarHTML}

                        <div class="fan-comment-author">

                            <div class="fan-comment-name">
                                ${escapeHTML(name)}
                            </div>

                            <div class="fan-comment-time">
                                ${escapeHTML(
                                    relativeTime(
                                        comment.created_at
                                    )
                                )}
                            </div>

                        </div>

                    </div>


                    <div class="fan-comment-body">
                        ${body}
                    </div>


                    <div class="fan-comment-actions">

                        <button
                            type="button"
                            class="fan-comment-action ${
                                currentReaction === "like"
                                    ? "active"
                                    : ""
                            }"
                            data-action="reaction"
                            data-reaction="like"
                            data-comment-id="${comment.id}"
                        >
                            ${likeIcon()}
                            <span>
                                ${counts.likes}
                            </span>
                        </button>


                        <button
                            type="button"
                            class="fan-comment-action dislike ${
                                currentReaction === "dislike"
                                    ? "active"
                                    : ""
                            }"
                            data-action="reaction"
                            data-reaction="dislike"
                            data-comment-id="${comment.id}"
                        >
                            ${dislikeIcon()}
                            <span>
                                ${counts.dislikes}
                            </span>
                        </button>


                        <button
                            type="button"
                            class="fan-comment-action"
                            data-action="reply-toggle"
                            data-comment-id="${comment.id}"
                        >
                            ${replyIcon()}

                            <span>
                                Responder
                            </span>

                            <span>
                                ${replies.length}
                            </span>

                        </button>

                    </div>


                    ${replyBox}

                </div>


                ${repliesHTML}

            </article>

        `;

    }


    function renderReplyBox(commentId) {

        return `

            <div
                class="fan-comment-reply-box"
                data-reply-box="${commentId}"
            >

                <textarea
                    class="fan-comments-textarea"
                    data-reply-input="${commentId}"
                    maxlength="5000"
                    placeholder="Escreve a tua resposta..."
                ></textarea>


                <div class="fan-comment-reply-actions">

                    <button
                        type="button"
                        class="fan-comments-cancel"
                        data-action="reply-cancel"
                        data-comment-id="${commentId}"
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        class="fan-comments-submit"
                        data-action="submit-reply"
                        data-comment-id="${commentId}"
                    >
                        Comentar
                    </button>

                </div>

            </div>

        `;

    }


    /* ========================================================
       RENDER
       ======================================================== */

    function renderComments(host) {

        const count =
            state.comments.length;


        const countElement =
            $("#fan-comments-count", host);


        const userElement =
            $("#fan-comments-user", host);


        const listElement =
            $("#fan-comments-list", host);


        if (countElement) {

            countElement.textContent =
                count === 1
                    ? "1 comentário"
                    : `${count} comentários`;

        }


        if (userElement) {

            userElement.textContent =
                getProfileName(
                    state.profile,
                    state.user
                );

        }


        const comments =
            sortComments(
                getTopLevelComments()
            );


        if (!comments.length) {

            listElement.innerHTML = `

                <div class="fan-comments-empty">
                    Sê o primeiro a comentar
                </div>

            `;

            return;

        }


        listElement.innerHTML =
            comments
                .map(
                    comment =>
                        renderComment(comment)
                )
                .join("");

    }


    /* ========================================================
       LOAD COMMENTS
       ======================================================== */

    async function loadComments(host) {

        const client =
            getSupabase();


        if (!client) {
            return;
        }


        try {

            const {
                data: comments,
                error: commentsError
            } = await client
                .from("fan_comments")
                .select(
                    "id,article_key,user_id,parent_id,body,created_at"
                )
                .eq(
                    "article_key",
                    state.articleKey
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


            if (commentsError) {
                throw commentsError;
            }


            state.comments =
                comments || [];


            const commentIds =
                state.comments.map(
                    comment =>
                        comment.id
                );


            state.reactions = [];


            if (commentIds.length) {

                const {
                    data: reactions,
                    error: reactionsError
                } = await client
                    .from(
                        "fan_comment_reactions"
                    )
                    .select(
                        "comment_id,user_id,reaction"
                    )
                    .in(
                        "comment_id",
                        commentIds
                    );


                if (reactionsError) {
                    throw reactionsError;
                }


                state.reactions =
                    reactions || [];

            }


            const userIds =
                [
                    ...new Set(
                        state.comments.map(
                            comment =>
                                comment.user_id
                        )
                    )
                ];


            state.profiles.clear();


            await loadProfiles(
                userIds
            );


            renderComments(
                host
            );

        } catch (error) {

            console.error(
                "BR Comments: erro ao carregar comentários.",
                error
            );


            const list =
                $("#fan-comments-list", host);


            if (list) {

                list.innerHTML = `

                    <div class="fan-comments-error">
                        Não foi possível carregar os comentários.
                    </div>

                `;

            }

        }

    }


    /* ========================================================
       CREATE COMMENT
       ======================================================== */

    async function createComment(
        host,
        body,
        parentId = null
    ) {

        const client =
            getSupabase();


        if (
            !client ||
            !state.user ||
            !state.articleKey
        ) {
            return false;
        }


        const cleanBody =
            String(body || "").trim();


        if (!cleanBody) {
            return false;
        }


        try {

            const {
                error
            } = await client
                .from("fan_comments")
                .insert({

                    article_key:
                        state.articleKey,

                    user_id:
                        state.user.id,

                    parent_id:
                        parentId,

                    body:
                        cleanBody

                });


            if (error) {
                throw error;
            }


            state.replyingTo =
                null;


            await loadComments(
                host
            );


            return true;

        } catch (error) {

            console.error(
                "BR Comments: erro ao publicar comentário.",
                error
            );


            alert(
                "Não foi possível publicar o comentário."
            );


            return false;

        }

    }


    /* ========================================================
       REACTIONS
       ======================================================== */

    async function toggleReaction(
        host,
        commentId,
        reactionType
    ) {

        const client =
            getSupabase();


        if (
            !client ||
            !state.user
        ) {
            return;
        }


        try {

            const existing =
                state.reactions.find(
                    item =>
                        Number(
                            item.comment_id
                        ) ===
                        Number(commentId) &&

                        item.user_id ===
                        state.user.id
                );


            if (
                existing &&
                existing.reaction ===
                reactionType
            ) {

                const {
                    error
                } = await client
                    .from(
                        "fan_comment_reactions"
                    )
                    .delete()
                    .eq(
                        "comment_id",
                        Number(commentId)
                    )
                    .eq(
                        "user_id",
                        state.user.id
                    );


                if (error) {
                    throw error;
                }


            } else {

                const {
                    error
                } = await client
                    .from(
                        "fan_comment_reactions"
                    )
                    .upsert(
                        {

                            comment_id:
                                Number(commentId),

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
                    throw error;
                }

            }


            await loadComments(
                host
            );

        } catch (error) {

            console.error(
                "BR Comments: erro ao reagir.",
                error
            );

        }

    }


    /* ========================================================
       EVENTS
       ======================================================== */

    function setupEvents(host) {

        host.addEventListener(
            "click",
            async function (event) {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (
                    !button ||
                    !host.contains(button)
                ) {
                    return;
                }


                const action =
                    button.dataset.action;


                /* --------------------------------------------
                   FILTER
                   -------------------------------------------- */

                if (
                    action === "filter"
                ) {

                    state.sort =
                        button.dataset.sort ||
                        "best";


                    host
                        .querySelectorAll(
                            ".fan-comments-filter"
                        )
                        .forEach(
                            filterButton => {

                                filterButton.classList.toggle(
                                    "active",
                                    filterButton ===
                                    button
                                );

                            }
                        );


                    renderComments(
                        host
                    );


                    return;
                }


                /* --------------------------------------------
                   COMMENT
                   -------------------------------------------- */

                if (
                    action ===
                    "submit-comment"
                ) {

                    const input =
                        $(
                            "#fan-comment-input",
                            host
                        );


                    if (!input) {
                        return;
                    }


                    const value =
                        input.value.trim();


                    if (!value) {

                        input.focus();

                        return;
                    }


                    button.disabled =
                        true;


                    const success =
                        await createComment(
                            host,
                            value
                        );


                    button.disabled =
                        false;


                    if (success) {
                        input.value = "";
                    }


                    return;
                }


                /* --------------------------------------------
                   REPLY TOGGLE
                   -------------------------------------------- */

                if (
                    action ===
                    "reply-toggle"
                ) {

                    const commentId =
                        Number(
                            button.dataset.commentId
                        );


                    if (
                        state.replyingTo ===
                        commentId
                    ) {

                        state.replyingTo =
                            null;

                    } else {

                        state.replyingTo =
                            commentId;

                    }


                    renderComments(
                        host
                    );


                    if (
                        state.replyingTo ===
                        commentId
                    ) {

                        const input =
                            host.querySelector(
                                `[data-reply-input="${commentId}"]`
                            );


                        if (input) {
                            input.focus();
                        }

                    }


                    return;
                }


                /* --------------------------------------------
                   CANCEL REPLY
                   -------------------------------------------- */

                if (
                    action ===
                    "reply-cancel"
                ) {

                    state.replyingTo =
                        null;


                    renderComments(
                        host
                    );


                    return;
                }


                /* --------------------------------------------
                   SUBMIT REPLY
                   -------------------------------------------- */

                if (
                    action ===
                    "submit-reply"
                ) {

                    const commentId =
                        Number(
                            button.dataset.commentId
                        );


                    const input =
                        host.querySelector(
                            `[data-reply-input="${commentId}"]`
                        );


                    if (!input) {
                        return;
                    }


                    const value =
                        input.value.trim();


                    if (!value) {

                        input.focus();

                        return;
                    }


                    button.disabled =
                        true;


                    const success =
                        await createComment(
                            host,
                            value,
                            commentId
                        );


                    button.disabled =
                        false;


                    if (success) {
                        input.value = "";
                    }


                    return;
                }


                /* --------------------------------------------
                   REACTION
                   -------------------------------------------- */

                if (
                    action ===
                    "reaction"
                ) {

                    const commentId =
                        Number(
                            button.dataset.commentId
                        );


                    const reaction =
                        button.dataset.reaction;


                    await toggleReaction(
                        host,
                        commentId,
                        reaction
                    );

                }

            }
        );

    }


    /* ========================================================
       NOTIFICATION BADGE
       ======================================================== */

    async function updateNotificationBadge() {

        const badge =
            document.querySelector(
                "#fan-notification-badge"
            );


        if (!badge) {
            return;
        }


        const client =
            getSupabase();


        if (!client) {
            return;
        }


        try {

            const {
                data: {
                    user
                }
            } = await client.auth.getUser();


            if (!user) {

                badge.hidden =
                    true;

                return;
            }


            const {
                count,
                error
            } = await client
                .from(
                    "fan_notifications"
                )
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "recipient_id",
                    user.id
                )
                .is(
                    "read_at",
                    null
                );


            if (error) {
                throw error;
            }


            const unread =
                Number(count || 0);


            if (unread <= 0) {

                badge.hidden =
                    true;

                return;
            }


            badge.hidden =
                false;


            badge.textContent =
                unread > 99
                    ? "99+"
                    : String(unread);

        } catch (error) {

            console.warn(
                "BR Notifications: erro.",
                error
            );

        }

    }


    async function setupNotificationRealtime() {

        const client =
            getSupabase();


        if (!client) {
            return;
        }


        const {
            data: {
                user
            }
        } = await client.auth.getUser();


        if (!user) {
            return;
        }


        if (
            state.notificationChannel
        ) {

            try {

                await client.removeChannel(
                    state.notificationChannel
                );

            } catch (error) {
                console.warn(error);
            }

        }


        state.notificationChannel =
            client
                .channel(
                    `fan-notifications-${user.id}`
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "fan_notifications",
                        filter:
                            `recipient_id=eq.${user.id}`
                    },
                    function () {

                        updateNotificationBadge();

                    }
                )
                .subscribe();

    }


    async function initialiseNotifications() {

        await updateNotificationBadge();

        await setupNotificationRealtime();

    }


    /* ========================================================
       PUBLIC COMPONENT
       ======================================================== */

    async function init(articleKey) {

        const host =
            document.querySelector(
                "#fan-comments"
            );


        if (!host) {
            return;
        }


        const client =
            getSupabase();


        if (!client) {
            return;
        }


        const {
            data: {
                user
            }
        } = await client.auth.getUser();


        if (!user) {

            host.innerHTML = `

                <div class="fan-comments-status">
                    Inicia sessão para participar na discussão.
                </div>

            `;

            return;
        }


        state.articleKey =
            String(articleKey || "");


        state.user =
            user;


        state.profile =
            await loadProfile(
                user.id
            );


        state.comments = [];

        state.reactions = [];

        state.profiles.clear();

        state.sort = "best";

        state.replyingTo = null;


        renderShell(
            host
        );


        setupEvents(
            host
        );


        await loadComments(
            host
        );

    }


    /* ========================================================
       GLOBAL
       ======================================================== */

    window.FanComments = {
        init,
        updateNotificationBadge
    };


    /* ========================================================
       START NOTIFICATIONS
       ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            initialiseNotifications();

        }
    );

})();
