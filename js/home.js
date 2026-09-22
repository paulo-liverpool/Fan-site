/* ============================================================
   BARÇA REAL
   HOME PAGE JAVASCRIPT
   ============================================================ */

let currentTeam = null;
let currentUser = null;

let newsItems = [];
let opinionItems = [];
let featuredItems = [];

let currentTableType = "league";
let currentFixture = null;


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
    setupHomepageInteractions();
    await loadHome();
});


/* ============================================================
   SUPABASE HELPERS
   ============================================================ */

function getSupabase() {
    if (typeof supabaseClient !== "undefined") {
        return supabaseClient;
    }

    if (typeof window.supabaseClient !== "undefined") {
        return window.supabaseClient;
    }

    if (typeof supabase !== "undefined" && supabase.auth) {
        return supabase;
    }

    console.error("BR: Supabase client não encontrado.");
    return null;
}


function $(selector) {
    return document.querySelector(selector);
}


function $$(selector) {
    return [...document.querySelectorAll(selector)];
}


/* ============================================================
   HOME LOADING
   ============================================================ */

async function loadHome() {
    const client = getSupabase();

    if (!client) return;

    try {
        const {
            data: {
                user
            },
            error: authError
        } = await client.auth.getUser();

        if (authError) {
            console.error("BR: erro de autenticação:", authError);
            return;
        }

        currentUser = user;

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const {
            data: profile,
            error: profileError
        } = await client
            .from("profiles")
            .select("supported_team_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            console.error("BR: erro ao carregar perfil:", profileError);
            return;
        }

        if (!profile || !profile.supported_team_id) {
            window.location.href = "choose-team.html";
            return;
        }

        const {
            data: team,
            error: teamError
        } = await client
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
            .eq("id", profile.supported_team_id)
            .maybeSingle();

        if (teamError) {
            console.error("BR: erro ao carregar equipa:", teamError);
            return;
        }

        currentTeam = team;

        applyTeamTheme(team);
        updateTeamHeader(team);
        updateProfileButton(user);

        await Promise.all([
            loadFeaturedContent(team.id),
            loadNews(team.id),
            loadOpinion(team.id),
            loadFixtures(team.id),
            loadLeagueTable(team.id),
            loadPlayerRatings(team.id),
            loadVideos(team.id)
        ]);

        setupFeaturedCarousel();

    } catch (error) {
        console.error("BR: erro geral no carregamento:", error);
    }
}


/* ============================================================
   TEAM
   ============================================================ */

function applyTeamTheme(team) {
    const root = document.documentElement;

    root.style.setProperty(
        "--team-primary",
        team.primary_color || "#a50044"
    );

    root.style.setProperty(
        "--team-secondary",
        team.secondary_color || "#004d98"
    );

    const primary = team.primary_color || "#a50044";

    root.style.setProperty(
        "--team-glow",
        hexToRGBA(primary, 0.18)
    );
}


function updateTeamHeader(team) {
    const title = $("#team-title");
    const subtitle = $("#team-subtitle");

    const slug = normalize(team.slug || team.name);

    const isBarcelona =
        slug.includes("barca") ||
        slug.includes("barcelona");

    if (title) {
        title.textContent = isBarcelona
            ? "VISCA BARÇA"
            : "HALA MADRID";
    }

    if (subtitle) {
        subtitle.textContent = isBarcelona
            ? "Tudo sobre o teu Barça."
            : "Tudo sobre o teu Real Madrid.";
    }
}


function updateProfileButton(user) {
    const button = $("#profile-button");

    if (!button || !user) return;

    const email = user.email || "";
    const firstLetter = email.trim().charAt(0).toUpperCase();

    button.textContent = firstLetter || "U";
}


function hexToRGBA(hex, alpha) {
    if (!hex) return `rgba(165,0,68,${alpha})`;

    let value = hex.replace("#", "").trim();

    if (value.length === 3) {
        value = value
            .split("")
            .map(x => x + x)
            .join("");
    }

    const number = parseInt(value, 16);

    if (Number.isNaN(number)) {
        return `rgba(165,0,68,${alpha})`;
    }

    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;

    return `rgba(${r},${g},${b},${alpha})`;
}


/* ============================================================
   DESTAQUE
   ============================================================ */

async function loadFeaturedContent(teamId) {
    const client = getSupabase();

    if (!client) return;

    try {
        const [
            contentResult,
            newsResult
        ] = await Promise.all([

            client
                .from("content")
                .select("*")
                .eq("status", "published")
                .eq("area", "featured")
                .or(`team_id.eq.${teamId},team_id.is.null`)
                .order("sort_order", {
                    ascending: true
                })
                .limit(10),

            client
                .from("news")
                .select(`
                    id,
                    team_id,
                    title,
                    translated_title,
                    description,
                    translated_description,
                    article_body,
                    image_url,
                    article_url,
                    source_name,
                    source_url,
                    author,
                    published_at,
                    imported_at,
                    category,
                    status,
                    is_featured,
                    sort_order,
                    created_at
                `)
                .eq("status", "published")
                .or(`team_id.eq.${teamId},team_id.is.null`)
                .order("published_at", {
                    ascending: false,
                    nullsFirst: false
                })
                .order("created_at", {
                    ascending: false
                })
                .limit(3)
        ]);

        if (contentResult.error) {
            console.error(
                "BR: erro nos destaques:",
                contentResult.error
            );
        }

        if (newsResult.error) {
            console.error(
                "BR: erro nas notícias de destaque:",
                newsResult.error
            );
        }

        const manualContent =
            contentResult.data || [];

        const latestNews =
            (newsResult.data || [])
                .filter(item => item && item.id)
                .map(item => ({
                    ...item,
                    __source: "news"
                }));

        featuredItems = [
            ...latestNews,
            ...manualContent
        ];

        renderFeaturedSlides(
            featuredItems.slice(0, 8)
        );

    } catch (error) {
        console.error(
            "BR: erro ao carregar destaques:",
            error
        );
    }
}


function renderFeaturedSlides(items) {
    const track = $("#featured-track");
    const dots = $("#featured-dots");

    if (!track) return;

    if (!items.length) {
        track.innerHTML = `
            <article class="featured-slide">
                <div class="featured-slide-placeholder">
                    BR
                </div>

                <div class="featured-slide-overlay"></div>

                <div class="featured-content">
                    <span class="featured-tag">
                        BARÇA REAL
                    </span>

                    <h2>
                        Sem destaques disponíveis
                    </h2>

                    <p>
                        Os próximos destaques aparecerão aqui.
                    </p>
                </div>
            </article>
        `;

        if (dots) dots.innerHTML = "";

        return;
    }

    track.innerHTML = items.map((item, index) => {
        const isNews =
            item.__source === "news";

        const title =
            isNews
                ? (
                    item.translated_title ||
                    item.title ||
                    "Sem título"
                )
                : (
                    item.title ||
                    "Sem título"
                );

        const description =
            isNews
                ? (
                    item.translated_description ||
                    item.description ||
                    ""
                )
                : (
                    item.description ||
                    ""
                );

        const imageUrl =
            item.image_url ||
            "";

        const category =
            isNews
                ? (
                    item.category ||
                    "NOTÍCIA"
                )
                : (
                    getContentLabel(item)
                );

        return `
            <article
                class="featured-slide"
                data-featured-index="${index}"
                tabindex="0"
            >

                ${
                    imageUrl
                        ? `
                            <div class="featured-slide-image">
                                <img
                                    src="${escapeAttribute(imageUrl)}"
                                    alt="${escapeAttribute(title)}"
                                    loading="${index === 0 ? "eager" : "lazy"}"
                                    onerror="this.parentElement.innerHTML='<div class=&quot;featured-slide-placeholder&quot;>BR</div>';"
                                >
                            </div>
                        `
                        : `
                            <div class="featured-slide-placeholder">
                                BR
                            </div>
                        `
                }

                <div class="featured-slide-overlay"></div>

                <div class="featured-content">

                    <span class="featured-tag">
                        ${escapeHTML(category)}
                    </span>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    ${
                        description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        stripHTML(description)
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            </article>
        `;
    }).join("");

    if (dots) {
        dots.innerHTML = items
            .map((_, index) => `
                <button
                    class="featured-dot ${index === 0 ? "active" : ""}"
                    type="button"
                    data-dot-index="${index}"
                    aria-label="Destaque ${index + 1}"
                ></button>
            `)
            .join("");
    }

    $$("#featured-track .featured-slide")
        .forEach(slide => {

            slide.addEventListener("click", event => {
                if (
                    event.target.closest(
                        ".featured-audio-button"
                    )
                ) {
                    return;
                }

                const index =
                    Number(slide.dataset.featuredIndex);

                const item = items[index];

                if (!item) return;

                if (item.__source === "news") {
                    openNewsArticle(item);
                } else {
                    openContent(item);
                }
            });

            slide.addEventListener("keydown", event => {
                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }

                event.preventDefault();
                slide.click();
            });
        });
}


/* ============================================================
   FEATURED CAROUSEL
   ============================================================ */

function setupFeaturedCarousel() {
    const track = $("#featured-track");

    if (!track) return;

    const dots = $$(".featured-dot");

    let autoplayTimer = null;

    function updateDots() {
        const width =
            track.clientWidth || 1;

        const index =
            Math.round(
                track.scrollLeft / width
            );

        dots.forEach((dot, i) => {
            dot.classList.toggle(
                "active",
                i === index
            );
        });
    }

    track.addEventListener(
        "scroll",
        debounce(updateDots, 80)
    );

    dots.forEach(dot => {
        dot.addEventListener("click", event => {

            event.stopPropagation();

            const index =
                Number(dot.dataset.dotIndex);

            track.scrollTo({
                left:
                    index *
                    track.clientWidth,
                behavior: "smooth"
            });
        });
    });

    function startAutoplay() {
        stopAutoplay();

        if (dots.length < 2) return;

        autoplayTimer = setInterval(() => {

            if (
                document.hidden ||
                isAnyFocusedViewOpen()
            ) {
                return;
            }

            const width =
                track.clientWidth || 1;

            const current =
                Math.round(
                    track.scrollLeft / width
                );

            const next =
                current + 1 >= dots.length
                    ? 0
                    : current + 1;

            track.scrollTo({
                left:
                    next * width,
                behavior: "smooth"
            });

        }, 6000);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    track.addEventListener(
        "mouseenter",
        stopAutoplay
    );

    track.addEventListener(
        "mouseleave",
        startAutoplay
    );

    track.addEventListener(
        "touchstart",
        stopAutoplay,
        {
            passive: true
        }
    );

    track.addEventListener(
        "touchend",
        startAutoplay,
        {
            passive: true
        }
    );

    startAutoplay();
}


/* ============================================================
   NEWS
   ============================================================ */

async function loadNews(teamId) {
    const client = getSupabase();

    if (!client) return;

    const grid = $("#news-home-grid");

    try {

        const {
            data,
            error
        } = await client
            .from("news")
            .select(`
                id,
                team_id,
                title,
                translated_title,
                description,
                translated_description,
                article_body,
                image_url,
                article_url,
                source_name,
                source_url,
                author,
                published_at,
                imported_at,
                category,
                status,
                is_featured,
                sort_order,
                created_at
            `)
            .eq("status", "published")
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .order("published_at", {
                ascending: false,
                nullsFirst: false
            })
            .order("created_at", {
                ascending: false
            })
            .limit(30);

        if (error) {
            console.error(
                "BR: erro ao carregar notícias:",
                error
            );

            if (grid) {
                grid.innerHTML = `
                    <div class="homepage-empty">
                        Não foi possível carregar as notícias.
                    </div>
                `;
            }

            return;
        }

        newsItems = (data || [])
            .filter(item => item && item.id);

        renderNews(
            newsItems.slice(0, 7)
        );

    } catch (error) {
        console.error(
            "BR: erro nas notícias:",
            error
        );
    }
}


function renderNews(items) {
    const grid = $("#news-home-grid");

    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem notícias publicadas.
            </div>
        `;

        return;
    }

    const main =
        items[0];

    const small =
        items.slice(1, 7);

    const mainTitle =
        main.translated_title ||
        main.title ||
        "Sem título";

    const mainDescription =
        main.translated_description ||
        main.description ||
        "";

    const mainImage =
        main.image_url ||
        "";

    const mainImageHTML =
        mainImage
            ? `
                <img
                    class="news-main-image"
                    src="${escapeAttribute(mainImage)}"
                    alt="${escapeAttribute(mainTitle)}"
                    loading="eager"
                    onerror="this.outerHTML='<div class=&quot;news-main-placeholder&quot;>BR</div>';"
                >
            `
            : `
                <div class="news-main-placeholder">
                    BR
                </div>
            `;

    const mainDate =
        formatShortDate(
            main.published_at ||
            main.imported_at ||
            main.created_at
        );

    const smallHTML =
        small.map((item, index) => {

            const title =
                item.translated_title ||
                item.title ||
                "Sem título";

            const description =
                item.translated_description ||
                item.description ||
                "";

            const image =
                item.image_url ||
                "";

            const category =
                item.category ||
                "NOTÍCIA";

            const imageHTML =
                image
                    ? `
                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(title)}"
                            loading="lazy"
                            onerror="this.outerHTML='<div class=&quot;news-small-placeholder&quot;>BR</div>';"
                        >
                    `
                    : `
                        <div class="news-small-placeholder">
                            BR
                        </div>
                    `;

            return `
                <article
                    class="news-small-card"
                    data-news-index="${index + 1}"
                    tabindex="0"
                >

                    ${imageHTML}

                    <div class="news-small-body">

                        <div class="news-small-meta">
                            ${escapeHTML(category)}
                        </div>

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        ${
                            description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            truncateText(
                                                stripHTML(description),
                                                105
                                            )
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                </article>
            `;
        }).join("");

    grid.innerHTML = `
        <article
            class="news-main-card"
            id="main-news-card"
            tabindex="0"
        >

            ${mainImageHTML}

            <div class="news-main-body">

                <div class="news-main-meta">
                    ${escapeHTML(
                        main.category ||
                        "NOTÍCIA"
                    )}
                    ${
                        mainDate
                            ? ` · ${escapeHTML(mainDate)}`
                            : ""
                    }
                </div>

                <h3>
                    ${escapeHTML(mainTitle)}
                </h3>

                ${
                    mainDescription
                        ? `
                            <p>
                                ${escapeHTML(
                                    stripHTML(
                                        mainDescription
                                    )
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

        </article>

        <div class="news-small-list">
            ${smallHTML}
        </div>
    `;

    const mainCard =
        $("#main-news-card");

    if (mainCard) {

        mainCard.addEventListener(
            "click",
            () => openNewsArticle(main)
        );

        mainCard.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openNewsArticle(main);
                }

            }
        );
    }

    $$(".news-small-card")
        .forEach(card => {

            const index =
                Number(card.dataset.newsIndex);

            const item =
                items[index];

            if (!item) return;

            card.addEventListener(
                "click",
                () => openNewsArticle(item)
            );

            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        openNewsArticle(item);
                    }

                }
            );
        });
}


/* ============================================================
   OPEN NEWS ARTICLE
   ============================================================ */

function openNewsArticle(item) {
    if (!item) return;

    const focused =
        $("#focused-content-view");

    const article =
        $("#focused-content");

    if (!focused || !article) {
        console.error(
            "BR: focused article view não encontrado."
        );
        return;
    }

    const title =
        item.translated_title ||
        item.title ||
        "Sem título";

    const description =
        item.translated_description ||
        item.description ||
        "";

    const imageUrl =
        item.image_url ||
        "";

    const category =
        item.category ||
        "NOTÍCIA";

    const sourceName =
        item.source_name ||
        "Fonte original";

    const date =
        item.published_at ||
        item.imported_at ||
        item.created_at;

    const body =
        item.article_body ||
        "";

    const imageHTML =
        imageUrl
            ? `
                <div class="focused-content-image">
                    <img
                        src="${escapeAttribute(imageUrl)}"
                        alt="${escapeAttribute(title)}"
                        loading="eager"
                        onerror="this.outerHTML='<div class=&quot;focused-image-placeholder&quot;>BR</div>';"
                    >
                </div>
            `
            : `
                <div class="focused-content-image">
                    <div class="focused-image-placeholder">
                        BR
                    </div>
                </div>
            `;

    const bodyHTML =
        body
            ? `
                <div class="focused-article-body">
                    ${formatArticleBody(body)}
                </div>
            `
            : "";

    const sourceHTML =
        item.article_url
            ? `
                <div class="focused-source">

                    <div class="focused-source-label">
                        ARTIGO ORIGINAL
                    </div>

                    <div class="focused-source-name">
                        ${escapeHTML(sourceName)}
                    </div>

                    <a
                        class="focused-source-button"
                        href="${escapeAttribute(item.article_url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Ler artigo original
                    </a>

                </div>
            `
            : "";

    article.innerHTML = `
        ${imageHTML}

        <div class="focused-content-meta">
            ${escapeHTML(category)}
        </div>

        <h1>
            ${escapeHTML(title)}
        </h1>

        ${
            date
                ? `
                    <div class="focused-content-date">
                        ${escapeHTML(
                            formatArticleDate(date)
                        )}
                    </div>
                `
                : ""
        }

        ${
            item.author
                ? `
                    <div class="focused-content-author">
                        Por ${escapeHTML(item.author)}
                    </div>
                `
                : ""
        }

        ${
            description
                ? `
                    <p id="focused-content-description">
                        ${escapeHTML(
                            stripHTML(description)
                        )}
                    </p>
                `
                : ""
        }

        ${bodyHTML}

        ${sourceHTML}

        <div class="focused-community">
            A discussão da comunidade Barça Real será disponibilizada aqui.
        </div>
    `;

    showFocusedView();
}


/* ============================================================
   GENERIC CONTENT
   ============================================================ */

function openContent(item) {
    if (!item) return;

    if (item.__source === "news") {
        openNewsArticle(item);
        return;
    }

    const focused =
        $("#focused-content-view");

    const article =
        $("#focused-content");

    if (!focused || !article) return;

    const title =
        item.title ||
        "Sem título";

    const description =
        item.description ||
        "";

    const imageUrl =
        item.image_url ||
        "";

    const category =
        getContentLabel(item);

    const body =
        getArticleBody(item);

    const imageHTML =
        imageUrl
            ? `
                <div class="focused-content-image">
                    <img
                        src="${escapeAttribute(imageUrl)}"
                        alt="${escapeAttribute(title)}"
                        loading="eager"
                    >
                </div>
            `
            : `
                <div class="focused-content-image">
                    <div class="focused-image-placeholder">
                        BR
                    </div>
                </div>
            `;

    article.innerHTML = `
        ${imageHTML}

        <div class="focused-content-meta">
            ${escapeHTML(category)}
        </div>

        <h1>
            ${escapeHTML(title)}
        </h1>

        ${
            item.author
                ? `
                    <div class="focused-content-author">
                        Por ${escapeHTML(item.author)}
                    </div>
                `
                : ""
        }

        ${
            description
                ? `
                    <p id="focused-content-description">
                        ${escapeHTML(
                            stripHTML(description)
                        )}
                    </p>
                `
                : ""
        }

        ${
            body
                ? `
                    <div class="focused-article-body">
                        ${formatArticleBody(body)}
                    </div>
                `
                : ""
        }

        ${
            item.audio_url
                ? `
                    <div class="focused-content-media">
                        <audio
                            controls
                            src="${escapeAttribute(item.audio_url)}"
                        ></audio>
                    </div>
                `
                : ""
        }

        ${
            item.video_url
                ? `
                    <div class="focused-content-media">
                        <video
                            controls
                            src="${escapeAttribute(item.video_url)}"
                        ></video>
                    </div>
                `
                : ""
        }
    `;

    showFocusedView();
}


/* ============================================================
   VIEW STATE
   IMPORTANT:
   focused/library/prediction are INSIDE #home-content.
   Therefore we hide homepage children individually rather
   than hiding #home-content itself.
   ============================================================ */

function showFocusedView() {
    hideOtherViews();

    const homeContent =
        $("#home-content");

    const focused =
        $("#focused-content-view");

    const header =
        document.querySelector(".team-header");

    const footer =
        document.querySelector(".site-footer");

    const nav =
        document.querySelector(".bottom-nav");

    if (homeContent) {
        [...homeContent.children]
            .forEach(child => {

                if (
                    child.id !==
                        "focused-content-view" &&
                    child.id !==
                        "library-view" &&
                    child.id !==
                        "prediction-view"
                ) {
                    child.hidden = true;
                }

            });
    }

    if (header) {
        header.hidden = true;
    }

    if (footer) {
        footer.hidden = true;
    }

    if (focused) {
        focused.hidden = false;
        focused.classList.add("active");
    }

    if (nav) {
        nav.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


function hideOtherViews() {
    const focused =
        $("#focused-content-view");

    const library =
        $("#library-view");

    const prediction =
        $("#prediction-view");

    if (focused) {
        focused.classList.remove("active");

        if (
            focused.id !==
            "focused-content-view"
        ) {
            focused.hidden = true;
        }
    }

    if (library) {
        library.classList.remove("active");
        library.hidden = true;
    }

    if (prediction) {
        prediction.classList.remove("active");
        prediction.hidden = true;
    }
}


function closeFocusedView() {
    const homeContent =
        $("#home-content");

    const focused =
        $("#focused-content-view");

    const header =
        document.querySelector(".team-header");

    const footer =
        document.querySelector(".site-footer");

    const nav =
        document.querySelector(".bottom-nav");

    if (focused) {
        focused.hidden = true;
        focused.classList.remove("active");
    }

    if (homeContent) {
        [...homeContent.children]
            .forEach(child => {
                child.hidden = false;
            });
    }

    if (header) {
        header.hidden = false;
    }

    if (footer) {
        footer.hidden = false;
    }

    if (nav) {
        nav.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function isAnyFocusedViewOpen() {
    const focused =
        $("#focused-content-view");

    const library =
        $("#library-view");

    const prediction =
        $("#prediction-view");

    return (
        (focused && !focused.hidden) ||
        (library && !library.hidden) ||
        (prediction && !prediction.hidden)
    );
}


/* ============================================================
   LIBRARY / MORE
   ============================================================ */

function openListView(items, title, label) {
    const library =
        $("#library-view");

    const grid =
        $("#library-grid");

    const titleElement =
        $("#library-title");

    const labelElement =
        $("#library-label");

    if (!library || !grid) return;

    hideOtherViews();

    const homeContent =
        $("#home-content");

    const header =
        document.querySelector(".team-header");

    const footer =
        document.querySelector(".site-footer");

    if (homeContent) {
        [...homeContent.children]
            .forEach(child => {

                if (
                    child.id !==
                        "focused-content-view" &&
                    child.id !==
                        "library-view" &&
                    child.id !==
                        "prediction-view"
                ) {
                    child.hidden = true;
                }

            });
    }

    if (header) header.hidden = true;
    if (footer) footer.hidden = true;

    if (titleElement) {
        titleElement.textContent =
            title || "Biblioteca";
    }

    if (labelElement) {
        labelElement.textContent =
            label || "BARÇA REAL";
    }

    renderLibrary(items || []);

    library.hidden = false;
    library.classList.add("active");

    const nav =
        document.querySelector(".bottom-nav");

    if (nav) nav.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


function openLibraryView() {
    openListView(
        newsItems,
        "Todas as notícias",
        "NOTÍCIAS"
    );
}


function renderLibrary(items) {
    const grid =
        $("#library-grid");

    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `
            <div class="homepage-empty">
                Não existem conteúdos disponíveis.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        items.map((item, index) => {

            const isNews =
                item.__source === "news";

            const title =
                isNews
                    ? (
                        item.translated_title ||
                        item.title ||
                        "Sem título"
                    )
                    : (
                        item.title ||
                        "Sem título"
                    );

            const image =
                item.image_url ||
                "";

            const imageHTML =
                image
                    ? `
                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(title)}"
                            loading="lazy"
                            onerror="this.outerHTML='<div class=&quot;library-placeholder&quot;>BR</div>';"
                        >
                    `
                    : `
                        <div class="library-placeholder">
                            BR
                        </div>
                    `;

            return `
                <article
                    class="library-card"
                    data-library-index="${index}"
                >

                    ${imageHTML}

                    <div class="library-card-body">

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                    </div>

                </article>
            `;

        }).join("");

    $$(".library-card")
        .forEach(card => {

            const index =
                Number(
                    card.dataset.libraryIndex
                );

            const item =
                items[index];

            if (!item) return;

            card.addEventListener(
                "click",
                () => {

                    if (
                        item.__source ===
                        "news"
                    ) {
                        openNewsArticle(item);
                    } else {
                        openContent(item);
                    }

                }
            );
        });
}


function closeLibraryView() {
    closeFocusedView();
}


/* ============================================================
   OPINION & ANALYSIS
   ============================================================ */

async function loadOpinion(teamId) {
    const client = getSupabase();

    if (!client) return;

    const grid =
        $("#opinion-home-grid");

    try {

        const {
            data,
            error
        } = await client
            .from("content")
            .select("*")
            .eq("status", "published")
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .in(
                "area",
                [
                    "opinion",
                    "analysis",
                    "opinion_analysis"
                ]
            )
            .order("sort_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            })
            .limit(20);

        if (error) {
            console.error(
                "BR: erro nas opiniões:",
                error
            );

            if (grid) {
                grid.innerHTML = `
                    <div class="homepage-empty">
                        Não foi possível carregar as opiniões.
                    </div>
                `;
            }

            return;
        }

        opinionItems =
            data || [];

        renderOpinion(
            opinionItems.slice(0, 7)
        );

    } catch (error) {
        console.error(
            "BR: erro ao carregar opinião:",
            error
        );
    }
}


function renderOpinion(items) {
    const grid =
        $("#opinion-home-grid");

    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem opiniões publicadas.
            </div>
        `;

        return;
    }

    const main =
        items[0];

    const small =
        items.slice(1, 7);

    const mainTitle =
        main.title ||
        "Sem título";

    const mainDescription =
        main.description ||
        "";

    const mainImage =
        main.image_url ||
        "";

    const mainImageHTML =
        mainImage
            ? `
                <img
                    src="${escapeAttribute(mainImage)}"
                    alt="${escapeAttribute(mainTitle)}"
                    loading="lazy"
                >
            `
            : `
                <div class="opinion-main-placeholder">
                    BR
                </div>
            `;

    const smallHTML =
        small.map((item, index) => {

            const title =
                item.title ||
                "Sem título";

            const image =
                item.image_url ||
                "";

            const imageHTML =
                image
                    ? `
                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(title)}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="opinion-small-placeholder">
                            BR
                        </div>
                    `;

            return `
                <article
                    class="opinion-small-card"
                    data-opinion-index="${index + 1}"
                >

                    ${imageHTML}

                    <div class="opinion-small-body">

                        <div class="opinion-small-meta">
                            ${escapeHTML(
                                getContentLabel(item)
                            )}
                        </div>

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                    </div>

                </article>
            `;
        }).join("");

    grid.innerHTML = `
        <article
            class="opinion-main-card"
            id="main-opinion-card"
        >

            ${mainImageHTML}

            <div class="opinion-main-body">

                <h3>
                    ${escapeHTML(mainTitle)}
                </h3>

                ${
                    mainDescription
                        ? `
                            <p>
                                ${escapeHTML(
                                    stripHTML(
                                        mainDescription
                                    )
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    main.author
                        ? `
                            <div class="opinion-author">
                                ${escapeHTML(
                                    main.author
                                )}
                            </div>
                        `
                        : ""
                }

            </div>

        </article>

        <div class="opinion-small-list">
            ${smallHTML}
        </div>
    `;

    const mainCard =
        $("#main-opinion-card");

    if (mainCard) {
        mainCard.addEventListener(
            "click",
            () => openContent(main)
        );
    }

    $$(".opinion-small-card")
        .forEach(card => {

            const index =
                Number(
                    card.dataset.opinionIndex
                );

            const item =
                items[index];

            if (!item) return;

            card.addEventListener(
                "click",
                () => openContent(item)
            );
        });
}

   /* ============================================================
   FIXTURES
   SOURCE: football_matches
   ============================================================ */

async function loadFixtures(teamId) {
    const client = getSupabase();

    if (!client) return;

    try {
        /*
         * API-Football stores Barcelona and Real Madrid
         * fixtures together in football_matches.
         *
         * We identify the user's team using the local
         * home_team_id / away_team_id where available,
         * while also supporting provider IDs 529 / 541.
         */

        const { data, error } = await client
            .from("football_matches")
            .select("*")
            .or(
                `home_team_id.eq.${teamId},away_team_id.eq.${teamId},home_provider_team_id.eq.529,away_provider_team_id.eq.529,home_provider_team_id.eq.541,away_provider_team_id.eq.541`
            )
            .order("match_date", {
                ascending: true
            })
            .limit(20);

        if (error) {
            console.warn(
                "BR: football_matches não carregadas:",
                error
            );
            return;
        }

        const now = Date.now();

        /*
         * Keep upcoming matches and currently live matches.
         * Finished matches in the past are not used for
         * the homepage "Próximo Jogo" area.
         */
        const upcoming = (data || [])
            .filter(match => {
                if (!match.match_date) return false;

                const status = String(
                    match.status_short || ""
                ).toUpperCase();

                const liveStatuses = [
                    "1H",
                    "HT",
                    "2H",
                    "ET",
                    "BT",
                    "P",
                    "LIVE"
                ];

                if (
                    match.is_live ||
                    liveStatuses.includes(status)
                ) {
                    return true;
                }

                return (
                    new Date(match.match_date).getTime() >=
                    now
                );
            })
            .sort((a, b) => {
                return (
                    new Date(a.match_date).getTime() -
                    new Date(b.match_date).getTime()
                );
            })
            .slice(0, 10);

        renderFixtures(upcoming);

    } catch (error) {
        console.warn(
            "BR: erro fixtures:",
            error
        );
    }
}


function renderFixtures(fixtures) {
    const mainCompetition =
        $("#main-fixture-competition");

    const mainDate =
        $("#main-fixture-date");

    const mainHomeName =
        $("#main-home-name");

    const mainAwayName =
        $("#main-away-name");

    const mainHomeBadge =
        $("#main-home-badge");

    const mainAwayBadge =
        $("#main-away-badge");

    const nextContainer =
        $("#next-fixtures");

    /*
     * No upcoming match.
     */
    if (!fixtures.length) {

        currentFixture = null;

        setText(
            "#main-fixture-competition",
            "Sem próximo jogo"
        );

        setText(
            "#main-fixture-date",
            "Ainda não disponível"
        );

        setText(
            "#main-home-name",
            "—"
        );

        setText(
            "#main-away-name",
            "—"
        );

        if (mainHomeBadge) {
            mainHomeBadge.innerHTML = "—";
        }

        if (mainAwayBadge) {
            mainAwayBadge.innerHTML = "—";
        }

        if (nextContainer) {
            nextContainer.innerHTML = `
                <div class="fixture-small-card">
                    <div class="fixture-small-date">
                        Não há outros jogos disponíveis.
                    </div>
                </div>
            `;
        }

        return;
    }

    /*
     * First match = large "PRÓXIMO JOGO".
     */
    currentFixture = fixtures[0];

    const fixture =
        currentFixture;

    const competition =
        fixture.competition_name ||
        "Jogo";

    const date =
        fixture.match_date;

    const homeName =
        fixture.home_team_name ||
        "Casa";

    const awayName =
        fixture.away_team_name ||
        "Fora";

    const homeLogo =
        fixture.home_team_logo ||
        "";

    const awayLogo =
        fixture.away_team_logo ||
        "";

    const status =
        String(
            fixture.status_short || ""
        ).toUpperCase();

    const isLive =
        Boolean(fixture.is_live) ||
        [
            "1H",
            "HT",
            "2H",
            "ET",
            "BT",
            "P",
            "LIVE"
        ].includes(status);

    /*
     * Competition.
     */
    setText(
        "#main-fixture-competition",
        competition
    );

    /*
     * Date / live status.
     */
    setText(
        "#main-fixture-date",
        isLive
            ? "AO VIVO"
            : date
                ? formatArticleDate(date)
                : "Data por confirmar"
    );

    /*
     * Teams.
     */
    setText(
        "#main-home-name",
        homeName
    );

    setText(
        "#main-away-name",
        awayName
    );

    /*
     * Team logos.
     */
    if (mainHomeBadge) {
        mainHomeBadge.innerHTML =
            homeLogo
                ? `
                    <img
                        src="${escapeAttribute(homeLogo)}"
                        alt="${escapeAttribute(homeName)}"
                        loading="eager"
                    >
                `
                : "—";
    }

    if (mainAwayBadge) {
        mainAwayBadge.innerHTML =
            awayLogo
                ? `
                    <img
                        src="${escapeAttribute(awayLogo)}"
                        alt="${escapeAttribute(awayName)}"
                        loading="eager"
                    >
                `
                : "—";
    }

    /*
     * Next two matches.
     */
    const next =
        fixtures.slice(1, 3);

    if (!nextContainer) return;

    nextContainer.innerHTML =
        next.length
            ? next.map(item => {

                const itemDate =
                    item.match_date;

                const itemStatus =
                    String(
                        item.status_short || ""
                    ).toUpperCase();

                const itemIsLive =
                    Boolean(item.is_live) ||
                    [
                        "1H",
                        "HT",
                        "2H",
                        "ET",
                        "BT",
                        "P",
                        "LIVE"
                    ].includes(itemStatus);

                const itemHome =
                    item.home_team_name ||
                    "—";

                const itemAway =
                    item.away_team_name ||
                    "—";

                const itemCompetition =
                    item.competition_name ||
                    "—";

                return `
                    <div class="fixture-small-card">

                        <div class="fixture-small-date">
                            ${
                                itemIsLive
                                    ? "AO VIVO"
                                    : itemDate
                                        ? escapeHTML(
                                            formatShortDate(
                                                itemDate
                                            )
                                        )
                                        : "—"
                            }
                        </div>

                        <div class="fixture-small-teams">

                            <strong>
                                ${escapeHTML(itemHome)}
                            </strong>

                            <span>
                                vs
                            </span>

                            <strong>
                                ${escapeHTML(itemAway)}
                            </strong>

                        </div>

                        <div class="fixture-small-competition">
                            ${escapeHTML(itemCompetition)}
                        </div>

                    </div>
                `;

            }).join("")
            : `
                <div class="fixture-small-card">
                    <div class="fixture-small-date">
                        Não há outros jogos.
                    </div>
                </div>
            `;
}

/* ============================================================
   LEAGUE TABLE
   SOURCE: football_standings
   ============================================================ */

async function loadLeagueTable(teamId) {
    const client = getSupabase();

    if (!client) return;

    try {

        /*
         * HTML tabs:
         *
         * league    = La Liga
         * champions = Champions League
         */

        const leagueId =
            currentTableType === "champions"
                ? 2
                : 140;

        const competitionName =
            currentTableType === "champions"
                ? "Champions League"
                : "La Liga";

        const { data, error } = await client
            .from("football_standings")
            .select("*")
            .eq(
                "provider_league_id",
                leagueId
            )
            .eq(
                "competition_name",
                competitionName
            )
            .order("position", {
                ascending: true
            })
            .limit(40);

        if (error) {
            console.warn(
                "BR: football_standings não carregada:",
                error
            );
            return;
        }

        renderLeagueTable(
            data || []
        );

    } catch (error) {
        console.warn(
            "BR: erro tabela:",
            error
        );
    }
}


function renderLeagueTable(rows) {
    const body =
        $("#league-table-body");

    if (!body) return;

    if (!rows.length) {

        body.innerHTML = `
            <div class="table-empty">
                Classificação ainda não disponível.
            </div>
        `;

        return;
    }

    body.innerHTML =
        rows
            .sort(
                (a, b) =>
                    Number(a.position || 999) -
                    Number(b.position || 999)
            )
            .map((row, index) => {

                const position =
                    row.position ||
                    index + 1;

                const name =
                    row.team_name ||
                    "Equipa";

                const logo =
                    row.team_logo ||
                    "";

                const played =
                    row.played ??
                    0;

                const goalDifference =
                    row.goal_difference ??
                    0;

                const points =
                    row.points ??
                    0;

                return `
                    <div class="league-table-row">

                        <span>
                            ${escapeHTML(
                                String(position)
                            )}
                        </span>

                        <span class="table-team">

                            ${
                                logo
                                    ? `
                                        <img
                                            src="${escapeAttribute(logo)}"
                                            alt="${escapeAttribute(name)}"
                                            loading="lazy"
                                        >
                                    `
                                    : ""
                            }

                            ${escapeHTML(name)}

                        </span>

                        <span>
                            ${escapeHTML(
                                String(played)
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                String(goalDifference)
                            )}
                        </span>

                        <strong>
                            ${escapeHTML(
                                String(points)
                            )}
                        </strong>

                    </div>
                `;

            })
            .join("");
}
/* ============================================================
   PLAYER RATINGS
   ============================================================ */

async function loadPlayerRatings(teamId) {
    const client = getSupabase();

    if (!client) return;

    try {

        const {
            data,
            error
        } = await client
            .from("player_ratings")
            .select("*")
            .eq("team_id", teamId)
            .order("rating", {
                ascending: false
            })
            .limit(10);

        if (error) {
            console.warn(
                "BR: ratings não carregadas:",
                error
            );
            return;
        }

        renderPlayerRatings(
            data || []
        );

    } catch (error) {
        console.warn(
            "BR: erro ratings:",
            error
        );
    }
}


function renderPlayerRatings(rows) {
    const list =
        $("#ratings-list");

    if (!list) return;

    if (!rows.length) {
        list.innerHTML = `
            <div class="table-empty">
                As avaliações aparecerão aqui depois dos jogos.
            </div>
        `;

        setText(
            "#ratings-average",
            "—"
        );

        return;
    }

    const values =
        rows
            .map(row =>
                Number(
                    row.rating ??
                    row.score
                )
            )
            .filter(value =>
                Number.isFinite(value)
            );

    const average =
        values.length
            ? (
                values.reduce(
                    (sum, value) =>
                        sum + value,
                    0
                ) / values.length
            ).toFixed(1)
            : "—";

    setText(
        "#ratings-average",
        average
    );

    list.innerHTML =
        rows.map(row => {

            const player =
                row.player_name ||
                row.name ||
                "Jogador";

            const rating =
                row.rating ??
                row.score ??
                "—";

            return `
                <div class="rating-row">

                    <span class="rating-player">
                        ${escapeHTML(player)}
                    </span>

                    <span class="rating-value">
                        ${escapeHTML(
                            String(rating)
                        )}
                    </span>

                </div>
            `;

        }).join("");
}


/* ============================================================
   VIDEOS
   ============================================================ */

async function loadVideos(teamId) {
    const client = getSupabase();

    if (!client) return;

    const grid =
        $("#videos-home-grid");

    try {

        const {
            data,
            error
        } = await client
            .from("content")
            .select("*")
            .eq("status", "published")
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .in(
                "area",
                [
                    "video",
                    "videos",
                    "tv"
                ]
            )
            .order("created_at", {
                ascending: false
            })
            .limit(10);

        if (error) {
            console.warn(
                "BR: vídeos não carregados:",
                error
            );

            if (grid) {
                grid.innerHTML = `
                    <div class="homepage-empty">
                        Não foi possível carregar os vídeos.
                    </div>
                `;
            }

            return;
        }

        renderVideos(
            data || []
        );

    } catch (error) {
        console.warn(
            "BR: erro vídeos:",
            error
        );
    }
}


function renderVideos(items) {
    const grid =
        $("#videos-home-grid");

    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem vídeos publicados.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        items.slice(0, 4)
            .map((item, index) => {

                const title =
                    item.title ||
                    "Vídeo Barça Real";

                const image =
                    item.image_url ||
                    "";

                return `
                    <article
                        class="video-card"
                        data-video-index="${index}"
                    >

                        <div class="video-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeAttribute(image)}"
                                            alt="${escapeAttribute(title)}"
                                            loading="lazy"
                                        >
                                    `
                                    : ""
                            }

                            <div class="video-play">
                                ▶
                            </div>

                        </div>

                        <div class="video-body">
                            <h3>
                                ${escapeHTML(title)}
                            </h3>
                        </div>

                    </article>
                `;

            }).join("");

    $$(".video-card")
        .forEach(card => {

            const index =
                Number(
                    card.dataset.videoIndex
                );

            const item =
                items[index];

            if (!item) return;

            card.addEventListener(
                "click",
                () => openContent(item)
            );
        });
}


/* ============================================================
   PREDICTION
   ============================================================ */

function openPrediction() {
    if (!currentFixture) {
        return;
    }

    const view =
        $("#prediction-view");

    if (!view) return;

    const homeName =
        currentFixture.home_team_name ||
        currentFixture.home_name ||
        "Casa";

    const awayName =
        currentFixture.away_team_name ||
        currentFixture.away_name ||
        "Fora";

    setText(
        "#prediction-match-title",
        `${homeName} vs ${awayName}`
    );

    setText(
        "#prediction-home-name",
        homeName
    );

    setText(
        "#prediction-away-name",
        awayName
    );

    const homeInput =
        $("#prediction-home-score");

    const awayInput =
        $("#prediction-away-score");

    const message =
        $("#prediction-message");

    if (homeInput) homeInput.value = "";
    if (awayInput) awayInput.value = "";
    if (message) message.textContent = "";

    hideOtherViews();

    const homeContent =
        $("#home-content");

    if (homeContent) {
        [...homeContent.children]
            .forEach(child => {

                if (
                    child.id !==
                        "focused-content-view" &&
                    child.id !==
                        "library-view" &&
                    child.id !==
                        "prediction-view"
                ) {
                    child.hidden = true;
                }

            });
    }

    const header =
        document.querySelector(".team-header");

    const footer =
        document.querySelector(".site-footer");

    if (header) header.hidden = true;
    if (footer) footer.hidden = true;

    view.hidden = false;
    view.classList.add("active");

    const nav =
        document.querySelector(".bottom-nav");

    if (nav) nav.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


async function submitPrediction() {
    if (!currentFixture || !currentUser) {
        return;
    }

    const homeInput =
        $("#prediction-home-score");

    const awayInput =
        $("#prediction-away-score");

    const message =
        $("#prediction-message");

    const homeScore =
        Number(homeInput?.value);

    const awayScore =
        Number(awayInput?.value);

    if (
        !Number.isInteger(homeScore) ||
        !Number.isInteger(awayScore) ||
        homeScore < 0 ||
        awayScore < 0
    ) {
        if (message) {
            message.textContent =
                "Introduz um resultado válido.";
        }

        return;
    }

    const client =
        getSupabase();

    if (!client) return;

    try {

        const {
            error
        } = await client
            .from("predictions")
            .insert({
                user_id: currentUser.id,
                fixture_id: currentFixture.id,
                home_score: homeScore,
                away_score: awayScore
            });

        if (error) {
            console.error(
                "BR: erro previsão:",
                error
            );

            if (message) {
                message.textContent =
                    "Não foi possível guardar a previsão.";
            }

            return;
        }

        if (message) {
            message.textContent =
                "Previsão registada.";
        }

    } catch (error) {
        console.error(
            "BR: erro previsão:",
            error
        );

        if (message) {
            message.textContent =
                "Ocorreu um erro.";
        }
    }
}


/* ============================================================
   NAVIGATION / INTERACTIONS
   ============================================================ */

function setupHomepageInteractions() {

    const backButton =
        $("#focused-back-button");

    if (backButton) {
        backButton.addEventListener(
            "click",
            closeFocusedView
        );
    }

    const libraryBack =
        $("#library-back-button");

    if (libraryBack) {
        libraryBack.addEventListener(
            "click",
            closeLibraryView
        );
    }

    const predictionBack =
        $("#prediction-back-button");

    if (predictionBack) {
        predictionBack.addEventListener(
            "click",
            closeFocusedView
        );
    }

    const moreNews =
        $("#more-news-button");

    if (moreNews) {
        moreNews.addEventListener(
            "click",
            () => openListView(
                newsItems,
                "Todas as notícias",
                "NOTÍCIAS"
            )
        );
    }

    const moreOpinion =
        $("#more-opinion-button");

    if (moreOpinion) {
        moreOpinion.addEventListener(
            "click",
            () => openListView(
                opinionItems,
                "Opinião & Análise",
                "VOZES"
            )
        );
    }

    const moreVideos =
        $("#more-videos-button");

    if (moreVideos) {
        moreVideos.addEventListener(
            "click",
            () => {

                const client =
                    getSupabase();

                if (!client || !currentTeam) {
                    return;
                }

                openListView(
                    [],
                    "Vídeos",
                    "BARÇA REAL TV"
                );
            }
        );
    }

    const predictionButton =
        $("#prediction-button");

    if (predictionButton) {
        predictionButton.addEventListener(
            "click",
            openPrediction
        );
    }

    const predictionSubmit =
        $("#prediction-submit");

    if (predictionSubmit) {
        predictionSubmit.addEventListener(
            "click",
            submitPrediction
        );
    }

    setupTableTabs();

    setupBottomNavigation();
}


/* ============================================================
   TABLE TABS
   FIX: HTML uses data-competition
   ============================================================ */

function setupTableTabs() {

    $$(".table-tab")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    $$(".table-tab")
                        .forEach(tab =>
                            tab.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    currentTableType =
                        button.dataset.competition ||
                        "league";

                    if (currentTeam) {
                        await loadLeagueTable(
                            currentTeam.id
                        );
                    }

                }
            );

        });
}


/* ============================================================
   BOTTOM NAVIGATION
   ============================================================ */

function setupBottomNavigation() {

    const community =
        $("#community-nav");

    const games =
        $("#games-nav");

    if (community) {
        community.addEventListener(
            "click",
            () => {
                window.location.href =
                    "community.html";
            }
        );
    }

    if (games) {
        games.addEventListener(
            "click",
            () => {

                const fixtures =
                    $("#fixtures-section");

                if (
                    fixtures &&
                    !isAnyFocusedViewOpen()
                ) {
                    fixtures.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                } else {
                    closeFocusedView();

                    setTimeout(() => {

                        const section =
                            $("#fixtures-section");

                        if (section) {
                            section.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                        }

                    }, 100);

                }

            }
        );
    }

    const nav =
        document.querySelector(".bottom-nav");

    if (nav) {
        nav.hidden = false;
    }
}


/* ============================================================
   CONTENT HELPERS
   ============================================================ */

function getContentLabel(item) {
    if (!item) return "BARÇA REAL";

    return (
        item.category ||
        item.area ||
        item.content_type ||
        "BARÇA REAL"
    )
        .replace(/_/g, " ")
        .toUpperCase();
}


function getArticleBody(item) {
    if (!item) return "";

    return (
        item.article_body ||
        item.body ||
        item.content_body ||
        item.text ||
        ""
    );
}


function getAuthor(item) {
    if (!item) return "";

    return (
        item.author ||
        item.author_name ||
        item.created_by_name ||
        ""
    );
}


/* ============================================================
   DATE / TEXT
   ============================================================ */

function formatArticleDate(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


function formatShortDate(value) {
    if (!value) return "";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


function formatArticleBody(text) {
    if (!text) return "";

    const clean =
        String(text).trim();

    if (!clean) return "";

    if (
        /<[a-z][\s\S]*>/i.test(clean)
    ) {
        return clean;
    }

    return clean
        .split(/\n\s*\n/)
        .map(paragraph => {

            const p =
                paragraph.trim();

            if (!p) return "";

            return `
                <p>
                    ${escapeHTML(p)
                        .replace(
                            /\n/g,
                            "<br>"
                        )}
                </p>
            `;

        })
        .join("");
}


function stripHTML(value) {
    if (!value) return "";

    const element =
        document.createElement("div");

    element.innerHTML =
        String(value);

    return (
        element.textContent ||
        element.innerText ||
        ""
    ).trim();
}


function truncateText(text, length) {
    if (!text) return "";

    const value =
        String(text);

    if (value.length <= length) {
        return value;
    }

    return (
        value
            .slice(0, length)
            .trimEnd() +
        "…"
    );
}


function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


/* ============================================================
   SECURITY
   ============================================================ */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHTML(value)
        .replace(/`/g, "&#096;");
}


/* ============================================================
   UTILITY
   ============================================================ */

function setText(selector, value) {
    const element =
        $(selector);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


function debounce(fn, delay) {
    let timer = null;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(
            () => fn(...args),
            delay
        );
    };
}
