/* ============================================================
   BARÇA REAL
   COMMUNITY
   ============================================================ */

"use strict";


/* ============================================================
   STATE
   ============================================================ */

let communityUser = null;
let communityProfile = null;
let communityTeam = null;

let communityPosts = [];

let activeCommunityCategory = null;


/* ============================================================
   DOM HELPERS
   ============================================================ */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}


/* ============================================================
   SUPABASE
   ============================================================ */

function getSupabase() {

    if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient
    ) {
        return supabaseClient;
    }

    if (
        window.supabaseClient
    ) {
        return window.supabaseClient;
    }

    if (
        window.supabase
    ) {
        return window.supabase;
    }

    return null;
}


/* ============================================================
   INIT
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupCommunityInteractions();

        await loadCommunity();

    }
);


/* ============================================================
   LOAD COMMUNITY
   ============================================================ */

async function loadCommunity() {

    const client = getSupabase();

    if (!client) {
        console.error(
            "BR: Supabase não disponível."
        );
        return;
    }


    try {

        const {
            data: {
                user
            },
            error: userError
        } = await client.auth.getUser();


        if (
            userError ||
            !user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        communityUser = user;


        /* ====================================================
           PROFILE
           ==================================================== */

        const {
            data: profile,
            error: profileError
        } = await client
            .from("profiles")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (profileError) {

            console.warn(
                "BR: perfil da comunidade não carregado:",
                profileError
            );

        }


        communityProfile =
            profile || null;


        /* ====================================================
           TEAM
           ==================================================== */

        if (
            communityProfile &&
            communityProfile.supported_team_id
        ) {

            const {
                data: team
            } = await client
                .from("teams")
                .select(
                    "id,name,slug,short_name,primary_color,secondary_color,loading_player"
                )
                .eq(
                    "id",
                    communityProfile.supported_team_id
                )
                .maybeSingle();


            communityTeam =
                team || null;

        }


        if (communityTeam) {

            applyCommunityTeamTheme(
                communityTeam
            );

            await updateCommunityBrand(
                communityTeam
            );

        }


        updateCommunityProfileButton();

        renderCommunityUser();

        await loadCommunityFeed();

        await loadCommunityNotificationCount();

    } catch (error) {

        console.error(
            "BR: erro ao carregar comunidade:",
            error
        );

    }

}


/* ============================================================
   TEAM THEME
   ============================================================ */

function applyCommunityTeamTheme(team) {

    const root =
        document.documentElement;

    root.style.setProperty(
        "--team-primary",
        team.primary_color ||
        "#a50044"
    );

    root.style.setProperty(
        "--team-secondary",
        team.secondary_color ||
        "#004d98"
    );

    root.style.setProperty(
        "--team-glow",
        hexToRGBA(
            team.primary_color ||
            "#a50044",
            0.18
        )
    );

}


/* ============================================================
   TEAM BRAND
   ============================================================ */

async function updateCommunityBrand(team) {

    const logo =
        $("#team-brand-logo");

    if (!logo) return;


    const slug =
        normalize(
            team.slug ||
            team.name ||
            ""
        );


    let providerTeamId =
        null;


    if (
        slug.includes("barcelona") ||
        slug.includes("barca")
    ) {

        providerTeamId = 81;

    } else if (
        slug.includes("real madrid")
    ) {

        providerTeamId = 86;

    }


    if (!providerTeamId) {
        return;
    }


    const client =
        getSupabase();

    if (!client) return;


    try {

        const {
            data
        } = await client
            .from("football_matches")
            .select(
                "home_team_logo,away_team_logo,home_provider_team_id,away_provider_team_id,match_date"
            )
            .or(
                `home_provider_team_id.eq.${providerTeamId},away_provider_team_id.eq.${providerTeamId}`
            )
            .order(
                "match_date",
                {
                    ascending: false
                }
            )
            .limit(20);


        const match =
            (data || []).find(
                item =>
                    Number(
                        item.home_provider_team_id
                    ) === providerTeamId ||
                    Number(
                        item.away_provider_team_id
                    ) === providerTeamId
            );


        if (!match) return;


        const logoURL =
            Number(
                match.home_provider_team_id
            ) === providerTeamId
                ? match.home_team_logo
                : match.away_team_logo;


        if (logoURL) {

            logo.src =
                logoURL;

            logo.alt =
                team.name ||
                team.short_name ||
                "Equipa";

        }

    } catch (error) {

        console.warn(
            "BR: erro ao carregar emblema:",
            error
        );

    }

}


/* ============================================================
   PROFILE BUTTON
   ============================================================ */

function updateCommunityProfileButton() {

    const button =
        $("#profile-button");

    if (!button) return;


    const email =
        communityUser?.email ||
        "";


    const name =
        getProfileName();


    const value =
        name ||
        email;


    button.textContent =
        value
            ? value.charAt(0).toUpperCase()
            : "•";

}


/* ============================================================
   USER DISPLAY
   ============================================================ */

function renderCommunityUser() {

    const name =
        getProfileName();


    const email =
        communityUser?.email ||
        "";


    const displayName =
        name ||
        email.split("@")[0] ||
        "Adepto";


    const avatar =
        $("#community-user-avatar");


    const nameElement =
        $("#community-user-name");


    if (avatar) {

        avatar.textContent =
            displayName
                .charAt(0)
                .toUpperCase();

    }


    if (nameElement) {

        nameElement.textContent =
            displayName;

    }

}


function getProfileName() {

    if (!communityProfile) {
        return "";
    }


    return (
        communityProfile.display_name ||
        communityProfile.full_name ||
        communityProfile.name ||
        communityProfile.username ||
        ""
    );

}


/* ============================================================
   FEED
   ============================================================ */

async function loadCommunityFeed(
    category = null
) {

    const client =
        getSupabase();

    const feed =
        $("#community-feed-list");

    if (!client || !feed) {
        return;
    }


    feed.innerHTML = `
        <div class="community-loading">
            A carregar...
        </div>
    `;


    try {

        let query =
            client
                .from("community_posts")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(30);


        if (category) {

            query =
                query.eq(
                    "category",
                    category
                );

        }


        const {
            data,
            error
        } = await query;


        if (error) {

            console.warn(
                "BR: community_posts não disponível:",
                error
            );


            feed.innerHTML = `
                <div class="community-empty">
                    Ainda não existem publicações na comunidade.
                </div>
            `;


            return;

        }


        communityPosts =
            data || [];


        renderCommunityPosts(
            communityPosts,
            feed
        );


    } catch (error) {

        console.warn(
            "BR: erro ao carregar comunidade:",
            error
        );


        feed.innerHTML = `
            <div class="community-empty">
                Não foi possível carregar a comunidade.
            </div>
        `;

    }

}


/* ============================================================
   POSTS
   ============================================================ */

function renderCommunityPosts(
    posts,
    container
) {

    if (!container) return;


    if (!posts.length) {

        container.innerHTML = `
            <div class="community-empty">
                Ainda não existem publicações aqui.
            </div>
        `;

        return;

    }


    container.innerHTML =
        posts
            .map(
                post =>
                    renderCommunityPost(
                        post
                    )
            )
            .join("");


    setupPostActions();

}


function renderCommunityPost(post) {

    const author =
        post.author_name ||
        post.display_name ||
        post.username ||
        "Adepto";


    const category =
        getCommunityCategoryLabel(
            post.category
        );


    const body =
        post.body ||
        post.content ||
        post.message ||
        "";


    const likes =
        Number(
            post.likes_count ||
            post.like_count ||
            0
        );


    const replies =
        Number(
            post.replies_count ||
            post.reply_count ||
            0
        );


    const isLiked =
        Boolean(
            post.viewer_liked
        );


    const time =
        formatRelativeTime(
            post.created_at
        );


    return `
        <article
            class="community-post"
            data-post-id="${escapeAttribute(post.id)}"
        >

            <div class="community-post-header">

                <span class="community-avatar">
                    ${escapeHTML(
                        author
                            .charAt(0)
                            .toUpperCase()
                    )}
                </span>

                <div class="community-post-user">

                    <strong>
                        ${escapeHTML(author)}
                    </strong>

                    <span>
                        ${escapeHTML(time)}
                    </span>

                </div>

                <span class="community-post-category">
                    ${escapeHTML(category)}
                </span>

            </div>


            <div class="community-post-body">
                ${escapeHTML(body)}
            </div>


            <div class="community-post-footer">

                <button
                    type="button"
                    class="community-post-action post-like-button ${isLiked ? "active" : ""}"
                    data-action="like"
                    data-post-id="${escapeAttribute(post.id)}"
                >
                    ♥ ${likes}
                </button>

                <button
                    type="button"
                    class="community-post-action"
                    data-action="reply"
                    data-post-id="${escapeAttribute(post.id)}"
                >
                    💬 ${replies}
                </button>

            </div>

        </article>
    `;

}


/* ============================================================
   POST ACTIONS
   ============================================================ */

function setupPostActions() {

    $$(".community-post-action")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.action;

                    const postId =
                        button.dataset.postId;


                    if (
                        action === "like"
                    ) {

                        await togglePostLike(
                            postId,
                            button
                        );

                    }

                }
            );

        });

}


/* ============================================================
   LIKE
   ============================================================ */

async function togglePostLike(
    postId,
    button
) {

    const client =
        getSupabase();

    if (
        !client ||
        !communityUser ||
        !postId
    ) {
        return;
    }


    try {

        const {
            data: existing
        } = await client
            .from("community_post_reactions")
            .select("id")
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                communityUser.id
            )
            .maybeSingle();


        if (existing) {

            const {
                error
            } = await client
                .from(
                    "community_post_reactions"
                )
                .delete()
                .eq(
                    "id",
                    existing.id
                );


            if (error) {
                throw error;
            }


            button.classList.remove(
                "active"
            );


            updateLikeButtonCount(
                button,
                -1
            );


        } else {

            const {
                error
            } = await client
                .from(
                    "community_post_reactions"
                )
                .insert({
                    post_id: postId,
                    user_id: communityUser.id,
                    reaction: "like"
                });


            if (error) {
                throw error;
            }


            button.classList.add(
                "active"
            );


            updateLikeButtonCount(
                button,
                1
            );

        }

    } catch (error) {

        console.warn(
            "BR: erro reação:",
            error
        );

    }

}


function updateLikeButtonCount(
    button,
    difference
) {

    if (!button) return;


    const match =
        button.textContent.match(
            /(\d+)$/
        );


    const current =
        match
            ? Number(match[1])
            : 0;


    const next =
        Math.max(
            0,
            current + difference
        );


    button.textContent =
        `♥ ${next}`;

}


/* ============================================================
   CREATE POST
   ============================================================ */

async function submitCommunityPost() {

    const client =
        getSupabase();

    const input =
        $("#community-post-input");

    const message =
        $("#community-post-message");

    if (
        !client ||
        !communityUser ||
        !input
    ) {
        return;
    }


    const body =
        input.value.trim();


    if (!body) {

        if (message) {
            message.textContent =
                "Escreve alguma coisa antes de publicar.";
        }

        return;

    }


    if (!activeCommunityCategory) {

        if (message) {
            message.textContent =
                "Escolhe primeiro um espaço da comunidade.";
        }

        return;

    }


    const submit =
        $("#community-post-submit");


    if (submit) {
        submit.disabled = true;
    }


    try {

        const payload = {

            user_id:
                communityUser.id,

            category:
                activeCommunityCategory,

            body:
                body

        };


        if (
            communityTeam &&
            communityTeam.id
        ) {

            payload.team_id =
                communityTeam.id;

        }


        const {
            data,
            error
        } = await client
            .from("community_posts")
            .insert(payload)
            .select("*")
            .single();


        if (error) {
            throw error;
        }


        input.value =
            "";


        updateCharacterCount();


        if (message) {

            message.textContent =
                "Publicação criada.";

        }


        if (data) {

            communityPosts.unshift(
                data
            );

        }


        await loadCommunityFeed(
            activeCommunityCategory
        );


    } catch (error) {

        console.error(
            "BR: erro ao publicar:",
            error
        );


        if (message) {

            message.textContent =
                "Não foi possível publicar.";

        }

    } finally {

        if (submit) {
            submit.disabled = false;
        }

    }

}


/* ============================================================
   ROOM NAVIGATION
   ============================================================ */

function openCommunityRoom(
    category
) {

    activeCommunityCategory =
        category;


    const room =
        getCommunityRoom(category);


    if (!room) return;


    const feed =
        $("#community-feed");

    const roomView =
        $("#community-room-view");


    if (feed) {
        feed.hidden = true;
    }


    if (roomView) {
        roomView.hidden = false;
    }


    setText(
        "#community-room-label",
        room.label
    );


    setText(
        "#community-room-title",
        room.title
    );


    const input =
        $("#community-post-input");


    if (input) {

        input.placeholder =
            getRoomPlaceholder(
                category
            );

    }


    const message =
        $("#community-post-message");


    if (message) {
        message.textContent =
            "";
    }


    loadCommunityFeed(
        category
    );


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


function closeCommunityRoom() {

    activeCommunityCategory =
        null;


    const feed =
        $("#community-feed");

    const roomView =
        $("#community-room-view");


    if (roomView) {
        roomView.hidden = true;
    }


    if (feed) {
        feed.hidden = false;
    }


    loadCommunityFeed();


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


function getCommunityRoom(
    category
) {

    const rooms = {

        general: {
            label: "FUTEBOL GERAL",
            title: "Futebol Geral"
        },

        debate: {
            label: "DEBATE DA SEMANA",
            title: "Debate da Semana"
        },

        fan_talk: {
            label: "FAN TALK",
            title: "Fan Talk"
        },

        match: {
            label: "DISCUSSÕES DOS JOGOS",
            title: "Discussões dos Jogos"
        },

        el_clasico: {
            label: "EL CLÁSICO",
            title: "El Clásico"
        }

    };


    return rooms[category] ||
        null;

}


function getRoomPlaceholder(
    category
) {

    switch (category) {

        case "general":
            return "Fala de futebol com a comunidade...";

        case "debate":
            return "Partilha a tua opinião sobre o debate...";

        case "fan_talk":
            return "O que estás a pensar?";

        case "match":
            return "Comenta o jogo...";

        case "el_clasico":
            return "Fala sobre Barça x Real...";

        default:
            return "O que estás a pensar?";

    }

}


/* ============================================================
   INTERACTIONS
   ============================================================ */

function setupCommunityInteractions() {

    $$(".community-room")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openCommunityRoom(
                        button.dataset.category
                    );

                }
            );

        });


    const back =
        $("#community-room-back");


    if (back) {

        back.addEventListener(
            "click",
            closeCommunityRoom
        );

    }


    const submit =
        $("#community-post-submit");


    if (submit) {

        submit.addEventListener(
            "click",
            submitCommunityPost
        );

    }


    const input =
        $("#community-post-input");


    if (input) {

        input.addEventListener(
            "input",
            updateCharacterCount
        );

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    (event.ctrlKey ||
                     event.metaKey)
                ) {

                    event.preventDefault();

                    submitCommunityPost();

                }

            }
        );

    }


    const communityNav =
        $("#community-nav");


    if (communityNav) {

        communityNav.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }

}


/* ============================================================
   CHARACTER COUNT
   ============================================================ */

function updateCharacterCount() {

    const input =
        $("#community-post-input");

    const count =
        $("#community-character-count");


    if (
        !input ||
        !count
    ) {
        return;
    }


    count.textContent =
        `${input.value.length}/1000`;

}


/* ============================================================
   NOTIFICATIONS
   ============================================================ */

async function loadCommunityNotificationCount() {

    const client =
        getSupabase();

    const badge =
        $("#fan-notification-badge");


    if (
        !client ||
        !communityUser ||
        !badge
    ) {
        return;
    }


    try {

        const {
            count,
            error
        } = await client
            .from("notifications")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "user_id",
                communityUser.id
            )
            .eq(
                "read",
                false
            );


        if (error) {

            badge.hidden =
                true;

            return;

        }


        const total =
            Number(count || 0);


        if (total > 0) {

            badge.textContent =
                total > 99
                    ? "99+"
                    : String(total);

            badge.hidden =
                false;

        } else {

            badge.hidden =
                true;

        }

    } catch (error) {

        badge.hidden =
            true;

    }

}


/* ============================================================
   CATEGORY LABEL
   ============================================================ */

function getCommunityCategoryLabel(
    category
) {

    const labels = {

        general:
            "FUTEBOL GERAL",

        debate:
            "DEBATE",

        fan_talk:
            "FAN TALK",

        match:
            "JOGOS",

        el_clasico:
            "EL CLÁSICO"

    };


    return labels[category] ||
        "COMUNIDADE";

}


/* ============================================================
   RELATIVE TIME
   ============================================================ */

function formatRelativeTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


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


    if (seconds < 60) {
        return "agora";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return minutes === 1
            ? "há 1 minuto"
            : `há ${minutes} minutos`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return hours === 1
            ? "há 1 hora"
            : `há ${hours} horas`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return days === 1
            ? "ontem"
            : `há ${days} dias`;

    }


    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "short"
        }
    ).format(date);

}


/* ============================================================
   UTILITIES
   ============================================================ */

function hexToRGBA(
    hex,
    alpha
) {

    let value =
        String(hex || "")
            .replace(
                "#",
                ""
            );


    if (value.length === 3) {

        value =
            value
                .split("")
                .map(
                    char =>
                        char + char
                )
                .join("");

    }


    const number =
        parseInt(
            value,
            16
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return `rgba(165,0,68,${alpha})`;

    }


    const r =
        (number >> 16) & 255;

    const g =
        (number >> 8) & 255;

    const b =
        number & 255;


    return `rgba(${r},${g},${b},${alpha})`;

}


function normalize(value) {

    return String(
        value || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


function escapeHTML(value) {

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


function escapeAttribute(value) {

    return escapeHTML(value)
        .replace(
            /`/g,
            "&#096;"
        );

}


function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (element) {

        element.textContent =
            value ?? "";

    }

}
