// ============================================================
// BR
// HOME PAGE
// ============================================================

// ============================================================
// GLOBAL STATE
// ============================================================

let currentTeam = null;
let currentUser = null;

let newsItems = [];
let opinionItems = [];

let currentTableType = "league";


// ============================================================
// START HOME
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadHome();
    setupHomepageInteractions();

});


// ============================================================
// LOAD USER + TEAM
// ============================================================

async function loadHome() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;


    // ========================================================
    // PROFILE
    // ========================================================

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            supported_team_id
        `)
        .eq("id", user.id)
        .single();

    if (
        profileError ||
        !profile ||
        !profile.supported_team_id
    ) {

        window.location.href = "choose-team.html";
        return;

    }


    // ========================================================
    // TEAM
    // ========================================================

    const {
        data: team,
        error: teamError
    } = await supabaseClient
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
            profile.supported_team_id
        )
        .single();

    if (teamError || !team) {

        window.location.href = "choose-team.html";
        return;

    }

    currentTeam = team;


    // ========================================================
    // TEAM COLORS
    // ========================================================

    document.documentElement.style.setProperty(
        "--team-primary",
        team.primary_color || "#a50044"
    );

    document.documentElement.style.setProperty(
        "--team-secondary",
        team.secondary_color || "#004d98"
    );

    if (team.slug === "barcelona") {

        document.documentElement.style.setProperty(
            "--team-glow",
            "rgba(165, 0, 68, 0.18)"
        );

    } else {

        document.documentElement.style.setProperty(
            "--team-glow",
            "rgba(255, 190, 0, 0.18)"
        );

    }


    // ========================================================
    // HEADER
    // ========================================================

    const teamTitle =
        document.getElementById("team-title");

    const teamSubtitle =
        document.getElementById("team-subtitle");

    if (teamTitle) {

        teamTitle.textContent =
            team.slug === "barcelona"
                ? "VISCA BARÇA"
                : "HALA MADRID";

    }

    if (teamSubtitle) {

        teamSubtitle.textContent =
            "Bem-vindo à tua experiência de futebol personalizada.";

    }


    // ========================================================
    // LOAD EVERYTHING
    // ========================================================

    await Promise.all([

        loadFeaturedContent(team.id),

        loadNews(team.id),

        loadOpinion(team.id),

        loadFixtures(team),

        loadLeagueTable(team),

        loadPlayerRatings(team),

        loadVideos(team)

    ]);


    // ========================================================
    // START FEATURED CAROUSEL
    // ========================================================

    setupFeaturedCarousel();

}


// ============================================================
// FEATURED / DESTAQUES
// ============================================================

async function loadFeaturedContent(teamId) {

    const track =
        document.getElementById("featured-track");

    if (!track) {
        return;
    }


    // --------------------------------------------------------
    // MANUALLY CREATED DESTAQUES
    // --------------------------------------------------------

    const {
        data: contentData,
        error: contentError
    } = await supabaseClient
        .from("content")
        .select("*")
        .eq("area", "featured")
        .eq("status", "published")
        .or(
            `team_id.eq.${teamId},team_id.is.null`
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (contentError) {

        console.error(
            "Erro ao carregar destaques:",
            contentError
        );

    }


    const manualFeatured =
        filterActiveContent(
            contentData || []
        );


    // --------------------------------------------------------
    // LATEST 3 NEWS
    // --------------------------------------------------------

    const {
        data: latestNews,
        error: newsError
    } = await supabaseClient
        .from("news")
        .select(`
            id,
            team_id,
            title,
            translated_title,
            description,
            translated_description,
            image_url,
            article_url,
            author,
            published_at,
            imported_at,
            category,
            status,
            created_at
        `)
        .eq(
            "status",
            "published"
        )
        .or(
            `team_id.eq.${teamId},team_id.is.null`
        )
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(3);


    if (newsError) {

        console.error(
            "Erro ao carregar notícias para destaques:",
            newsError
        );

    }


    const featuredNews =
        (latestNews || [])
            .filter(
                item =>
                    item.article_url
            )
            .map(
                item => ({
                    ...item,
                    __source: "news"
                })
            );


    // --------------------------------------------------------
    // NEWS FIRST + MANUAL DESTAQUES
    // --------------------------------------------------------

    const combined = [
        ...featuredNews,
        ...manualFeatured
    ];


    if (!combined.length) {

        renderEmptyFeatured();
        return;

    }


    renderFeaturedSlides(
        combined
    );

}


// ============================================================
// RENDER FEATURED SLIDES
// ============================================================

function renderFeaturedSlides(items) {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (!track) {
        return;
    }

    track.innerHTML = "";

    if (dots) {
        dots.innerHTML = "";
    }


    items.forEach(
        (item, index) => {

            const slide =
                document.createElement("article");

            slide.className =
                "featured-slide";

            slide.dataset.index =
                index;


            const isNews =
                item.__source === "news";


            const title =
                isNews
                    ? (
                        item.translated_title ||
                        item.title
                    )
                    : item.title;


            // ------------------------------------------------
            // IMPORTANT:
            // News Destaques DO NOT show description.
            // ------------------------------------------------

            const description =
                isNews
                    ? ""
                    : item.description;


            slide.innerHTML = `

                <div class="featured-slide-image">

                    ${
                        item.image_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        item.image_url
                                    )}"
                                    alt="${escapeAttribute(
                                        title ||
                                        "Destaque"
                                    )}"
                                    loading="${
                                        index === 0
                                            ? "eager"
                                            : "lazy"
                                    }"
                                >
                            `
                            : `
                                <div class="featured-placeholder">
                                    ${isNews ? "NOTÍCIA" : "DESTAQUE"}
                                </div>
                            `
                    }

                </div>

                <div class="featured-slide-overlay"></div>

                <div class="featured-content">

                    <div class="featured-tag">

                        ${
                            isNews
                                ? getNewsCategory(item)
                                : getFeaturedLabel(item)
                        }

                    </div>

                    <h2>
                        ${escapeHTML(
                            title ||
                            "Sem título"
                        )}
                    </h2>

                    ${
                        description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        stripHTML(
                                            description
                                        )
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

                ${
                    item.audio_url
                        ? `
                            <button
                                type="button"
                                class="featured-audio-button"
                                aria-label="Ouvir destaque"
                            >
                                🔊
                            </button>
                        `
                        : ""
                }

            `;


            let slideMoved = false;


            slide.addEventListener(
                "mousedown",
                () => {

                    slideMoved = false;

                }
            );


            slide.addEventListener(
                "mousemove",
                () => {

                    slideMoved = true;

                }
            );


            slide.addEventListener(
                "click",
                event => {

                    if (slideMoved) {

                        slideMoved = false;
                        return;

                    }


                    if (
                        event.target.closest(
                            ".featured-audio-button"
                        )
                    ) {

                        return;

                    }


                    if (isNews) {

                        openNewsArticle(item);

                    } else {

                        openContent(item);

                    }

                }
            );


            const audioButton =
                slide.querySelector(
                    ".featured-audio-button"
                );


            if (audioButton) {

                audioButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        playFeaturedAudio(
                            item.audio_url,
                            audioButton
                        );

                    }
                );

            }


            track.appendChild(
                slide
            );


            if (dots) {

                const dot =
                    document.createElement("button");

                dot.type =
                    "button";

                dot.className =
                    "featured-dot";

                if (index === 0) {

                    dot.classList.add("active");

                }

                dot.dataset.index =
                    index;

                dot.setAttribute(
                    "aria-label",
                    `Destaque ${index + 1}`
                );

                dots.appendChild(
                    dot
                );

            }

        }
    );

}


// ============================================================
// FEATURED LABEL
// ============================================================

function getFeaturedLabel(item) {

    if (
        item.content_type ===
        "community"
    ) {

        return "COMUNIDADE";

    }

    if (
        item.content_type ===
        "story"
    ) {

        return "HISTÓRIA";

    }

    if (
        item.area ===
        "opinion"
    ) {

        return "OPINIÃO";

    }

    if (
        item.area ===
        "analysis"
    ) {

        return "ANÁLISE";

    }

    return "DESTAQUE";

}


// ============================================================
// EMPTY FEATURED
// ============================================================

function renderEmptyFeatured() {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (track) {

        track.innerHTML = `

            <article class="featured-slide">

                <div class="featured-slide-image">

                    <div class="featured-placeholder">
                        DESTAQUES
                    </div>

                </div>

                <div class="featured-content">

                    <div class="featured-tag">
                        DESTAQUES
                    </div>

                    <h2>
                        Ainda não existem destaques publicados.
                    </h2>

                </div>

            </article>

        `;

    }

    if (dots) {

        dots.innerHTML = "";

    }

}


// ============================================================
// FEATURED AUDIO
// ============================================================

let featuredAudio = null;


function playFeaturedAudio(
    url,
    button
) {

    if (!url) {
        return;
    }


    if (
        featuredAudio &&
        !featuredAudio.paused
    ) {

        featuredAudio.pause();

        if (
            featuredAudio.currentSrc ===
            url
        ) {

            featuredAudio = null;

            if (button) {
                button.textContent = "🔊";
            }

            return;

        }

    }


    featuredAudio =
        new Audio(url);


    featuredAudio.play()
        .then(
            () => {

                if (button) {
                    button.textContent = "⏸";
                }

            }
        )
        .catch(
            error => {

                console.error(
                    "Erro ao reproduzir áudio:",
                    error
                );

            }
        );


    featuredAudio.addEventListener(
        "ended",
        () => {

            if (button) {
                button.textContent = "🔊";
            }

            featuredAudio = null;

        }
    );

}


// ============================================================
// FEATURED CAROUSEL
// ============================================================

function setupFeaturedCarousel() {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (!track) {
        return;
    }


    const getSlides =
        () =>
            track.querySelectorAll(
                ".featured-slide"
            );


    const getDots =
        () =>
            dots
                ? dots.querySelectorAll(
                    ".featured-dot"
                )
                : [];


    let currentIndex = 0;
    let autoPlay = null;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;


    function updateDots(index) {

        getDots()
            .forEach(
                (dot, dotIndex) => {

                    dot.classList.toggle(
                        "active",
                        dotIndex === index
                    );

                }
            );

    }


    function goToSlide(
        index,
        smooth = true
    ) {

        const slides =
            getSlides();

        if (!slides.length) {
            return;
        }

        if (index < 0) {
            index = slides.length - 1;
        }

        if (
            index >=
            slides.length
        ) {

            index = 0;

        }

        currentIndex =
            index;

        const slide =
            slides[index];

        track.scrollTo({
            left: slide.offsetLeft,
            behavior:
                smooth
                    ? "smooth"
                    : "auto"
        });

        updateDots(
            currentIndex
        );

    }


    function detectCurrentSlide() {

        const slides =
            getSlides();

        if (!slides.length) {
            return;
        }

        const scrollPosition =
            track.scrollLeft;

        let closestIndex = 0;

        let closestDistance =
            Infinity;


        slides.forEach(
            (slide, index) => {

                const distance =
                    Math.abs(
                        slide.offsetLeft -
                        scrollPosition
                    );

                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closestIndex =
                        index;

                }

            }
        );


        currentIndex =
            closestIndex;

        updateDots(
            currentIndex
        );

    }


    function stopAutoPlay() {

        if (autoPlay) {

            clearInterval(
                autoPlay
            );

            autoPlay = null;

        }

    }


    function startAutoPlay() {

        stopAutoPlay();

        if (
            getSlides().length <=
            1
        ) {

            return;

        }

        autoPlay =
            setInterval(
                () => {

                    goToSlide(
                        currentIndex + 1
                    );

                },
                5000
            );

    }


    getDots()
        .forEach(
            dot => {

                dot.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const index =
                            Number(
                                dot.dataset.index
                            );

                        if (
                            Number.isNaN(
                                index
                            )
                        ) {

                            return;

                        }

                        goToSlide(index);

                        startAutoPlay();

                    }
                );

            }
        );


    track.addEventListener(
        "scroll",
        () => {

            detectCurrentSlide();

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "mousedown",
        event => {

            isDragging = true;
            moved = false;
            startX = event.pageX;
            startScrollLeft = track.scrollLeft;

            stopAutoPlay();

            track.classList.add(
                "dragging"
            );

        }
    );


    track.addEventListener(
        "mousemove",
        event => {

            if (!isDragging) {
                return;
            }

            const distance =
                event.pageX -
                startX;

            if (
                Math.abs(distance) >
                5
            ) {

                moved = true;

            }

            track.scrollLeft =
                startScrollLeft -
                distance;

        }
    );


    function stopDragging() {

        if (!isDragging) {
            return;
        }

        isDragging = false;

        track.classList.remove(
            "dragging"
        );

        if (moved) {
            detectCurrentSlide();
        }

        startAutoPlay();

    }


    track.addEventListener(
        "mouseup",
        stopDragging
    );

    track.addEventListener(
        "mouseleave",
        stopDragging
    );


    track.addEventListener(
        "touchstart",
        event => {

            if (
                !event.touches ||
                !event.touches.length
            ) {

                return;

            }

            startX =
                event.touches[0].pageX;

            startScrollLeft =
                track.scrollLeft;

            stopAutoPlay();

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "touchend",
        event => {

            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {

                startAutoPlay();
                return;

            }

            const endX =
                event.changedTouches[0].pageX;

            const distance =
                endX -
                startX;

            if (
                Math.abs(distance) >
                50
            ) {

                if (distance < 0) {

                    goToSlide(
                        currentIndex + 1
                    );

                } else {

                    goToSlide(
                        currentIndex - 1
                    );

                }

            } else {

                detectCurrentSlide();

            }

            startAutoPlay();

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "mouseenter",
        () => {

            stopAutoPlay();

        }
    );


    track.addEventListener(
        "mouseleave",
        () => {

            if (!isDragging) {
                startAutoPlay();
            }

        }
    );


    goToSlide(
        0,
        false
    );

    startAutoPlay();

}


// ============================================================
// NEWS
// ============================================================

async function loadNews(teamId) {

    const container =
        document.getElementById(
            "news-home-grid"
        );

    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
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
        .eq(
            "status",
            "published"
        )
        .or(
            `team_id.eq.${teamId},team_id.is.null`
        )
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(30);


    if (error) {

        console.error(
            "Erro ao carregar notícias:",
            error
        );

        newsItems = [];

        container.innerHTML = `

            <div class="br-empty">
                Não foi possível carregar as notícias.
            </div>

        `;

        return;
    }


    newsItems =
        (data || [])
            .filter(
                item =>
                    item.article_url
            )
            .map(
                item => ({
                    ...item,
                    __source: "news"
                })
            );


    if (!newsItems.length) {

        container.innerHTML = `

            <div class="br-empty">
                Ainda não existem notícias publicadas.
            </div>

        `;

        return;
    }


    renderNews(
        newsItems.slice(
            0,
            7
        )
    );

}


// ============================================================
// RENDER NEWS
// ============================================================

function renderNews(items) {

    const container =
        document.getElementById(
            "news-home-grid"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!items.length) {
        return;
    }


    // --------------------------------------------------------
    // MAIN NEWS
    // --------------------------------------------------------

    const main =
        items[0];


    const mainTitle =
        main.translated_title ||
        main.title ||
        "Sem título";


    const mainDescription =
        main.translated_description ||
        main.description ||
        "";


    const mainStory =
        document.createElement("article");


    mainStory.className =
        "news-main-card";


    // IMPORTANT:
    // The image is DIRECTLY inside .news-main-card.
    // This matches the responsive CSS sizing rules.

    mainStory.innerHTML = `

        ${
            main.image_url
                ? `
                    <img
                        src="${escapeAttribute(
                            main.image_url
                        )}"
                        alt="${escapeAttribute(
                            mainTitle
                        )}"
                        loading="eager"
                        class="news-main-image"
                        onerror="this.style.display='none';"
                    >
                `
                : `
                    <div class="news-main-placeholder">
                        NOTÍCIA
                    </div>
                `
        }

        <div class="news-main-body">

            <div class="news-main-meta">

                ${getNewsCategory(main)}

                ${getNewsDate(main)}

            </div>

            <h3>
                ${escapeHTML(
                    mainTitle
                )}
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

    `;


    mainStory.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "a, button"
                )
            ) {
                return;
            }

            openNewsArticle(main);

        }
    );


    container.appendChild(
        mainStory
    );


    // --------------------------------------------------------
    // SMALL NEWS LIST
    // --------------------------------------------------------

    const smallWrapper =
        document.createElement("div");


    smallWrapper.className =
        "news-small-list";


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const title =
                    item.translated_title ||
                    item.title ||
                    "Sem título";


                const description =
                    item.translated_description ||
                    item.description ||
                    "";


                const card =
                    document.createElement("article");


                card.className =
                    "news-small-card";


                card.innerHTML = `

                    <div class="news-small-image">

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            item.image_url
                                        )}"
                                        alt="${escapeAttribute(
                                            title
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="news-small-placeholder">
                                        NOTÍCIA
                                    </div>
                                `
                        }

                    </div>

                    <div class="news-small-body">

                        <div class="news-small-meta">

                            ${getNewsCategory(item)}

                            ${getNewsDate(item)}

                        </div>

                        <h3>
                            ${escapeHTML(
                                title
                            )}
                        </h3>

                        ${
                            description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            stripHTML(
                                                description
                                            )
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                `;


                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                "a, button"
                            )
                        ) {
                            return;
                        }

                        openNewsArticle(item);

                    }
                );


                smallWrapper.appendChild(
                    card
                );

            }
        );


    container.appendChild(
        smallWrapper
    );

}


// ============================================================
// OPEN NEWS ARTICLE
// ============================================================

function openNewsArticle(item) {

    if (!item) {
        return;
    }


    const newsItem = {
        ...item,
        __source: "news"
    };


    // Completely switch away from the homepage.
    // The article remains inside the same HTML page.

    hideHomepage();


    openContent(
        newsItem
    );

}


// ============================================================
// NEWS SOURCE
// ============================================================

function getNewsSource(item) {

    return "";

}


// ============================================================
// NEWS CATEGORY
// ============================================================

function getNewsCategory(item) {

    const labels = {

        news: "NOTÍCIAS",

        transfer: "TRANSFERÊNCIAS",

        team_news: "EQUIPA"

    };


    const category =
        labels[item?.category] ||
        "NOTÍCIAS";


    return `

        <span class="news-category">
            ${escapeHTML(category)}
        </span>

    `;

}


// ============================================================
// NEWS DATE
// ============================================================

function getNewsDate(item) {

    const date =
        item?.published_at ||
        item?.imported_at ||
        item?.created_at;


    if (!date) {
        return "";
    }


    return `

        <span class="news-date">
            ${escapeHTML(
                formatRelativeDate(date)
            )}
        </span>

    `;

}


// ============================================================
// RELATIVE NEWS DATE
// ============================================================

function formatRelativeDate(date) {

    try {

        const published =
            new Date(date);

        const now =
            new Date();

        const diff =
            now.getTime() -
            published.getTime();


        const minutes =
            Math.floor(
                diff / 60000
            );


        if (
            minutes >= 0 &&
            minutes < 60
        ) {

            return minutes <= 1
                ? "AGORA"
                : `HÁ ${minutes} MIN`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (
            hours >= 1 &&
            hours < 24
        ) {

            return hours === 1
                ? "HÁ 1 H"
                : `HÁ ${hours} H`;

        }


        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "short"
            }
        )
            .format(published)
            .toUpperCase();

    } catch {

        return "";

    }

}


// ============================================================
// OPINION
// ============================================================

async function loadOpinion(teamId) {

    const container =
        document.getElementById(
            "opinion-home-grid"
        );

    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("content")
        .select("*")
        .eq(
            "status",
            "published"
        )
        .or(
            `team_id.eq.${teamId},team_id.is.null`
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Erro ao carregar opinião:",
            error
        );

        container.innerHTML = `

            <div class="br-empty">
                Não foi possível carregar a opinião.
            </div>

        `;

        return;
    }


    const valid =
        filterActiveContent(
            data || []
        )
        .filter(
            item =>
                item.area === "opinion" ||
                item.area === "analysis" ||
                item.content_type === "community"
        );


    opinionItems =
        valid.slice(
            0,
            30
        );


    if (!opinionItems.length) {

        container.innerHTML = `

            <div class="br-empty">
                Ainda não existem artigos de opinião publicados.
            </div>

        `;

        return;
    }


    renderOpinion(
        opinionItems.slice(
            0,
            7
        )
    );

}


// ============================================================
// RENDER OPINION
// ============================================================

function renderOpinion(items) {

    const container =
        document.getElementById(
            "opinion-home-grid"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!items.length) {
        return;
    }


    const main =
        items[0];


    const feature =
        document.createElement("article");


    feature.className =
        "opinion-main-card";


    feature.innerHTML = `

        <div class="opinion-main-image">

            ${
                main.image_url
                    ? `
                        <img
                            src="${escapeAttribute(
                                main.image_url
                            )}"
                            alt="${escapeAttribute(
                                main.title ||
                                "Opinião"
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="opinion-main-placeholder">
                            OPINIÃO
                        </div>
                    `
            }

        </div>

        <div class="opinion-main-body">

            <div class="opinion-author">
                ${escapeHTML(
                    getAuthor(main)
                )}
            </div>

            <h3>
                ${escapeHTML(
                    main.title ||
                    "Sem título"
                )}
            </h3>

            ${
                main.description
                    ? `
                        <p>
                            ${escapeHTML(
                                stripHTML(
                                    main.description
                                )
                            )}
                        </p>
                    `
                    : ""
            }

        </div>

    `;


    feature.addEventListener(
        "click",
        () => openContent(main)
    );


    container.appendChild(
        feature
    );


    const list =
        document.createElement("div");


    list.className =
        "opinion-small-list";


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const card =
                    document.createElement("article");


                card.className =
                    "opinion-small-card";


                card.innerHTML = `

                    <div class="opinion-small-image">

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            item.image_url
                                        )}"
                                        alt="${escapeAttribute(
                                            item.title ||
                                            "Opinião"
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="opinion-small-placeholder">
                                        OPINIÃO
                                    </div>
                                `
                        }

                    </div>

                    <div class="opinion-small-body">

                        <div class="opinion-small-meta">

                            ${escapeHTML(
                                getAuthor(item)
                            )}

                        </div>

                        <h3>
                            ${escapeHTML(
                                item.title ||
                                "Sem título"
                            )}
                        </h3>

                        ${
                            item.description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            stripHTML(
                                                item.description
                                            )
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                `;


                card.addEventListener(
                    "click",
                    () => openContent(item)
                );


                list.appendChild(
                    card
                );

            }
        );


    container.appendChild(
        list
    );

}


// ============================================================
// FIXTURES
// ============================================================

async function loadFixtures(team) {

    const container =
        document.getElementById(
            "fixtures-container"
        );

    if (!container) {
        return;
    }


    const fixtures =
        await getExternalFixtures(
            team
        );


    if (!fixtures.length) {

        container.innerHTML = `

            <div class="br-empty">

                Os próximos jogos serão carregados
                automaticamente quando a fonte de jogos
                estiver ligada.

            </div>

        `;

        return;
    }


    renderFixtures(
        fixtures
    );

}


// ============================================================
// EXTERNAL FIXTURE ADAPTER
// ============================================================

async function getExternalFixtures(team) {

    if (
        Array.isArray(
            window.BARCA_REAL_FIXTURES
        )
    ) {

        return window.BARCA_REAL_FIXTURES;

    }


    return [];

}


// ============================================================
// RENDER FIXTURES
// ============================================================

function renderFixtures(fixtures) {

    const container =
        document.getElementById(
            "fixtures-container"
        );


    const next =
        fixtures[0];


    const upcoming =
        fixtures.slice(
            1,
            3
        );


    container.innerHTML = `

        <div class="br-next-match">

            <div class="br-competition">
                ${escapeHTML(
                    next.competition ||
                    ""
                )}
            </div>

            <div class="br-match-date">
                ${formatMatchDate(
                    next.date
                )}
            </div>

            <div class="br-match-teams">

                ${teamHTML(
                    next.home
                )}

                <div class="br-vs">
                    VS
                </div>

                ${teamHTML(
                    next.away
                )}

            </div>

            <div class="br-prediction">

                <button
                    type="button"
                    class="br-action-button"
                    id="prediction-button"
                >
                    SUBMIT PREDICTION
                </button>

            </div>

        </div>

        <div
            class="br-upcoming-fixtures"
            id="upcoming-fixtures"
        ></div>

    `;


    const predictionButton =
        document.getElementById(
            "prediction-button"
        );


    if (predictionButton) {

        predictionButton.addEventListener(
            "click",
            () => {

                openPrediction(
                    next
                );

            }
        );

    }


    const upcomingContainer =
        document.getElementById(
            "upcoming-fixtures"
        );


    upcoming.forEach(
        fixture => {

            const card =
                document.createElement("div");


            card.className =
                "br-upcoming-card";


            card.innerHTML = `

                <div class="br-competition">
                    ${escapeHTML(
                        fixture.competition ||
                        ""
                    )}
                </div>

                <div class="br-match-date">
                    ${formatMatchDate(
                        fixture.date
                    )}
                </div>

                <div class="br-match-teams">

                    ${teamHTML(
                        fixture.home
                    )}

                    <div class="br-vs">
                        VS
                    </div>

                    ${teamHTML(
                        fixture.away
                    )}

                </div>

            `;


            card.addEventListener(
                "click",
                () => openFixture(
                    fixture
                )
            );


            upcomingContainer.appendChild(
                card
            );

        }
    );

}


// ============================================================
// LEAGUE TABLE
// ============================================================

async function loadLeagueTable(team) {

    setupTableTabs();

    await renderLeagueTable(
        team,
        "league"
    );

}


// ============================================================
// TABLE TABS
// ============================================================

function setupTableTabs() {

    document
        .querySelectorAll(
            ".table-tab"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        document
                            .querySelectorAll(
                                ".table-tab"
                            )
                            .forEach(
                                tab =>
                                    tab.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        currentTableType =
                            button.dataset.table;


                        await renderLeagueTable(
                            currentTeam,
                            currentTableType
                        );

                    }
                );

            }
        );

}


// ============================================================
// RENDER TABLE
// ============================================================

async function renderLeagueTable(
    team,
    type
) {

    const container =
        document.querySelector(
            ".league-table-wrapper"
        );


    if (!container) {
        return;
    }


    const table =
        await getExternalLeagueTable(
            team,
            type
        );


    if (!table.length) {

        container.innerHTML = `

            <div class="br-empty">

                A classificação será carregada
                automaticamente a partir da fonte
                oficial de dados.

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <table class="br-league-table">

            <thead>

                <tr>
                    <th>#</th>
                    <th>Equipa</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>PTS</th>
                </tr>

            </thead>

            <tbody id="league-table-body"></tbody>

        </table>

    `;


    const body =
        document.getElementById(
            "league-table-body"
        );


    table.forEach(
        (row, index) => {

            const tr =
                document.createElement("tr");


            if (
                currentTeam &&
                (
                    row.team_id ===
                    currentTeam.id ||
                    normalize(
                        row.name
                    ) ===
                    normalize(
                        currentTeam.name
                    )
                )
            ) {

                tr.classList.add(
                    "br-highlight"
                );

            }


            tr.innerHTML = `

                <td>
                    ${row.position || index + 1}
                </td>

                <td>

                    <div class="br-team-cell">

                        ${
                            row.logo
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            row.logo
                                        )}"
                                        class="br-mini-logo"
                                        alt=""
                                    >
                                `
                                : ""
                        }

                        <span>
                            ${escapeHTML(
                                row.name ||
                                ""
                            )}
                        </span>

                    </div>

                </td>

                <td>
                    ${row.played ?? "-"}
                </td>

                <td>
                    ${row.won ?? "-"}
                </td>

                <td>
                    ${row.drawn ?? "-"}
                </td>

                <td>
                    ${row.lost ?? "-"}
                </td>

                <td>
                    ${row.points ?? "-"}
                </td>

            `;


            body.appendChild(
                tr
            );

        }
    );

}


// ============================================================
// EXTERNAL TABLE ADAPTER
// ============================================================

async function getExternalLeagueTable(
    team,
    type
) {

    if (
        typeof window.BARCA_REAL_TABLE ===
        "function"
    ) {

        try {

            const result =
                await window.BARCA_REAL_TABLE(
                    team,
                    type
                );


            return Array.isArray(result)
                ? result
                : [];

        } catch (error) {

            console.error(
                "Erro na fonte da classificação:",
                error
            );

            return [];

        }

    }


    return [];

}


// ============================================================
// PLAYER RATINGS
// ============================================================

async function loadPlayerRatings(team) {

    const container =
        document.getElementById(
            "ratings-list"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("player_ratings")
        .select("*")
        .eq(
            "team_id",
            team.id
        )
        .order(
            "rating",
            {
                ascending: false
            }
        )
        .limit(8);


    if (
        error ||
        !data ||
        !data.length
    ) {

        container.innerHTML = `

            <div class="br-empty">

                As avaliações dos adeptos aparecerão aqui
                depois dos jogos.

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    data.forEach(
        (player, index) => {

            const row =
                document.createElement("div");


            row.className =
                "br-rating-row";


            row.innerHTML = `

                <div class="br-rating-rank">
                    ${index + 1}
                </div>

                ${
                    player.image_url
                        ? `
                            <img
                                class="br-player-image"
                                src="${escapeAttribute(
                                    player.image_url
                                )}"
                                alt=""
                            >
                        `
                        : `
                            <div class="br-player-image"></div>
                        `
                }

                <div>

                    <div class="br-player-name">
                        ${escapeHTML(
                            player.player_name ||
                            player.name ||
                            "Jogador"
                        )}
                    </div>

                    <span class="br-player-votes">
                        ${
                            player.votes ||
                            0
                        } avaliações
                    </span>

                </div>

                <div class="br-rating-score">
                    ${Number(
                        player.rating || 0
                    ).toFixed(2)}
                </div>

            `;


            container.appendChild(
                row
            );

        }
    );

}


// ============================================================
// VIDEOS
// ============================================================

async function loadVideos(team) {

    const container =
        document.getElementById(
            "videos-home-grid"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("content")
        .select("*")
        .eq(
            "content_type",
            "video"
        )
        .eq(
            "status",
            "published"
        )
        .or(
            `team_id.eq.${team.id},team_id.is.null`
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(7);


    if (
        error ||
        !data ||
        !data.length
    ) {

        container.innerHTML = `

            <div class="br-empty">
                Ainda não existem vídeos publicados.
            </div>

        `;

        return;
    }


    renderVideos(
        data
    );

}


// ============================================================
// RENDER VIDEOS
// ============================================================

function renderVideos(items) {

    const container =
        document.getElementById(
            "videos-home-grid"
        );


    if (!container) {
        return;
    }


    const main =
        items[0];


    container.innerHTML = `

        <article
            class="video-card video-feature"
            id="main-video"
        >

            <div class="video-image">

                ${imageHTML(
                    main.image_url,
                    "Vídeo"
                )}

                <button
                    type="button"
                    class="video-play"
                    aria-label="Reproduzir vídeo"
                >
                    ▶
                </button>

            </div>

            <div class="video-body">

                <div class="video-title">
                    ${escapeHTML(
                        main.title ||
                        "Vídeo"
                    )}
                </div>

            </div>

        </article>

        <div
            class="video-list"
            id="video-list"
        ></div>

    `;


    const mainVideo =
        document.getElementById(
            "main-video"
        );


    if (mainVideo) {

        mainVideo.addEventListener(
            "click",
            () => openContent(main)
        );

    }


    const list =
        document.getElementById(
            "video-list"
        );


    if (!list) {
        return;
    }


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const card =
                    document.createElement("article");


                card.className =
                    "video-card";


                card.innerHTML = `

                    <div class="video-image">

                        ${imageHTML(
                            item.image_url,
                            "Vídeo"
                        )}

                        <div class="video-play">
                            ▶
                        </div>

                    </div>

                    <div class="video-body">

                        <div class="video-title">
                            ${escapeHTML(
                                item.title ||
                                "Vídeo"
                            )}
                        </div>

                    </div>

                `;


                card.addEventListener(
                    "click",
                    () => openContent(item)
                );


                list.appendChild(
                    card
                );

            }
        );

}


// ============================================================
// HOMEPAGE INTERACTIONS
// ============================================================

function setupHomepageInteractions() {

    const moreNewsButton =
        document.getElementById(
            "more-news-button"
        );


    if (moreNewsButton) {

        moreNewsButton.addEventListener(
            "click",
            () => {

                openListView(
                    "Últimas Notícias",
                    newsItems,
                    "news"
                );

            }
        );

    }


    const moreOpinionButton =
        document.getElementById(
            "more-opinion-button"
        );


    if (moreOpinionButton) {

        moreOpinionButton.addEventListener(
            "click",
            () => {

                openListView(
                    "Opinião & Análise",
                    opinionItems,
                    "opinion"
                );

            }
        );

    }


    const ratingsButton =
        document.getElementById(
            "submit-ratings-button"
        );


    if (ratingsButton) {

        ratingsButton.addEventListener(
            "click",
            openRatingsView
        );

    }


    const backButton =
        document.getElementById(
            "content-back-button"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            closeFocusedView
        );

    }


    const libraryBackButton =
        document.getElementById(
            "library-back-button"
        );


    if (libraryBackButton) {

        libraryBackButton.addEventListener(
            "click",
            closeLibraryView
        );

    }

}


// ============================================================
// OPEN CONTENT / ARTICLE VIEW
// ============================================================

function openContent(item) {

    const view =
        getContentView();


    const body =
        getContentViewBody();


    if (!view || !body) {

        console.error(
            "BR: focused content view não encontrado."
        );

        return;

    }


    hideHomepage();


    const isNews =
        item?.__source === "news";


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


    const publicationDate =
        isNews
            ? (
                item.published_at ||
                item.imported_at ||
                item.created_at
            )
            : item.created_at;


    // --------------------------------------------------------
    // NEWS BODY
    // --------------------------------------------------------

    const bodyText =
        isNews
            ? (
                item.article_body ||
                ""
            )
            : getArticleBody(item);


    // --------------------------------------------------------
    // If there is no article_body yet, use the description
    // as the BR article content rather than leaving it blank.
    // --------------------------------------------------------

    const displayBody =
        bodyText ||
        description ||
        "Esta notícia ainda não possui conteúdo adicional.";


    // --------------------------------------------------------
    // BUILD ARTICLE VIEW
    // --------------------------------------------------------

    body.innerHTML = `

        <div class="br-view-type">

            ${
                isNews
                    ? getNewsCategory(item)
                    : escapeHTML(
                        getContentLabel(item)
                    )
            }

        </div>


        <h1 class="br-view-title">

            ${escapeHTML(
                title
            )}

        </h1>


        <div class="br-view-meta">

            ${
                isNews
                    ? (
                        publicationDate
                            ? escapeHTML(
                                formatDateTime(
                                    publicationDate
                                )
                            )
                            : ""
                    )
                    : `
                        ${escapeHTML(
                            getAuthor(item)
                        )}

                        ${
                            publicationDate
                                ? " • " +
                                  escapeHTML(
                                      formatDate(
                                          publicationDate
                                      )
                                  )
                                : ""
                        }
                    `
            }

        </div>


        ${
            item.image_url
                ? `
                    <img
                        class="br-view-image"
                        src="${escapeAttribute(
                            item.image_url
                        )}"
                        alt="${escapeAttribute(
                            title
                        )}"
                    >
                `
                : ""
        }


        ${
            description &&
            stripHTML(
                description
            ) !==
            stripHTML(
                displayBody
            )
                ? `
                    <div class="br-view-description">

                        ${escapeHTML(
                            stripHTML(
                                description
                            )
                        )}

                    </div>
                `
                : ""
        }


        <div class="br-view-body">

            ${
                isNews
                    ? renderArticleText(
                        displayBody
                    )
                    : escapeHTML(
                        displayBody
                    )
            }

        </div>


        ${
            isNews
                ? `

                    <div class="br-news-source-section">

                        <div class="br-news-source-label">
                            FONTE ORIGINAL
                        </div>

                        <p>
                            Consulta a publicação original
                            para ver a notícia completa na
                            fonte que a publicou.
                        </p>

                        ${
                            item.article_url
                                ? `
                                    <a
                                        class="br-action-button"
                                        href="${escapeAttribute(
                                            item.article_url
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        LER ARTIGO ORIGINAL
                                    </a>
                                `
                                : ""
                        }

                    </div>


                    <div class="br-fan-interaction">

                        <div class="br-view-type">
                            COMUNIDADE BR
                        </div>

                        <h2>
                            CONVERSA DOS ADEPTOS
                        </h2>

                        <p>
                            Em breve poderás comentar esta notícia,
                            trocar opiniões com outros adeptos e
                            acompanhar os comentários de membros
                            importantes da nossa comunidade.
                        </p>

                    </div>

                `
                : ""
        }

    `;


    // --------------------------------------------------------
    // MAKE ARTICLE VIEW THE ONLY ACTIVE VIEW
    // --------------------------------------------------------

    const library =
        document.getElementById(
            "library-view"
        );


    if (library) {

        library.classList.remove(
            "active"
        );

    }


    view.classList.add(
        "active"
    );


    // --------------------------------------------------------
    // SCROLL TO TOP
    // --------------------------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// RENDER ARTICLE TEXT
// ============================================================

function renderArticleText(
    text
) {

    if (!text) {
        return "";
    }


    const clean =
        stripHTML(text)
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            );


    const paragraphs =
        clean
            .split(
                /\n\s*\n/
            )
            .map(
                paragraph =>
                    paragraph.trim()
            )
            .filter(Boolean);


    if (!paragraphs.length) {

        return `

            <p>
                ${escapeHTML(clean)}
            </p>

        `;

    }


    return paragraphs
        .map(
            paragraph => `

                <p>
                    ${escapeHTML(
                        paragraph
                    )}
                </p>

            `
        )
        .join("");

}


// ============================================================
// CONTENT VIEW ELEMENTS
// ============================================================

function getContentView() {

    return (
        document.getElementById(
            "focused-content-view"
        ) ||
        document.getElementById(
            "content-view"
        )
    );

}


function getContentViewBody() {

    return (
        document.getElementById(
            "focused-content"
        ) ||
        document.getElementById(
            "content-view-body"
        )
    );

}


// ============================================================
// OPEN LIST VIEW
// ============================================================

function openListView(
    title,
    items,
    type
) {

    const view =
        getContentView();


    const body =
        getContentViewBody();


    if (!view || !body) {

        openLibraryView(
            title,
            items,
            type
        );

        return;
    }


    hideHomepage();


    body.innerHTML = `

        <div class="br-view-type">

            ${
                type === "news"
                    ? "NOTÍCIAS"
                    : "OPINIÃO & ANÁLISE"
            }

        </div>

        <h1 class="br-view-title">
            ${escapeHTML(title)}
        </h1>

        <div class="br-list-view"></div>

    `;


    const list =
        body.querySelector(
            ".br-list-view"
        );


    items.forEach(
        item => {

            const isNews =
                type === "news";


            const itemTitle =
                isNews
                    ? (
                        item.translated_title ||
                        item.title ||
                        ""
                    )
                    : (
                        item.title ||
                        ""
                    );


            const itemDescription =
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


            const card =
                document.createElement("article");


            card.className =
                "br-list-view-card";


            card.innerHTML = `

                ${
                    item.image_url
                        ? `
                            <img
                                class="br-list-view-image"
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                alt=""
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="br-list-view-image"></div>
                        `
                }

                <div>

                    <div class="br-story-meta">

                        ${
                            isNews
                                ? `
                                    ${getNewsCategory(item)}

                                    ${getNewsDate(item)}
                                `
                                : escapeHTML(
                                    getAuthor(item)
                                )
                        }

                    </div>

                    <div class="br-list-view-title">

                        ${escapeHTML(
                            itemTitle
                        )}

                    </div>

                    <div class="br-list-view-description">

                        ${escapeHTML(
                            stripHTML(
                                itemDescription
                            )
                        )}

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    if (isNews) {

                        openNewsArticle(item);

                    } else {

                        openContent(item);

                    }

                }
            );


            list.appendChild(
                card
            );

        }
    );


    view.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// LIBRARY VIEW
// ============================================================

function openLibraryView(
    title,
    items,
    type
) {

    const library =
        document.getElementById(
            "library-view"
        );


    const grid =
        document.getElementById(
            "library-grid"
        );


    const libraryTitle =
        document.getElementById(
            "library-title"
        );


    const libraryLabel =
        document.getElementById(
            "library-label"
        );


    if (
        !library ||
        !grid
    ) {

        return;

    }


    hideHomepage();


    if (libraryTitle) {

        libraryTitle.textContent =
            title;

    }


    if (libraryLabel) {

        libraryLabel.textContent =
            type === "news"
                ? "NOTÍCIAS"
                : "OPINIÃO & ANÁLISE";

    }


    grid.innerHTML = "";


    items.forEach(
        item => {

            const isNews =
                type === "news";


            const itemTitle =
                isNews
                    ? (
                        item.translated_title ||
                        item.title ||
                        ""
                    )
                    : (
                        item.title ||
                        ""
                    );


            const itemDescription =
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


            const card =
                document.createElement("article");


            card.className =
                "br-list-view-card";


            card.innerHTML = `

                ${
                    item.image_url
                        ? `
                            <img
                                class="br-list-view-image"
                                src="${escapeAttribute(
                                    item.image_url
                                )}"
                                alt=""
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="br-list-view-image"></div>
                        `
                }

                <div>

                    <div class="br-story-meta">

                        ${
                            isNews
                                ? `
                                    ${getNewsCategory(item)}

                                    ${getNewsDate(item)}
                                `
                                : escapeHTML(
                                    getAuthor(item)
                                )
                        }

                    </div>

                    <div class="br-list-view-title">

                        ${escapeHTML(
                            itemTitle
                        )}

                    </div>

                    <div class="br-list-view-description">

                        ${escapeHTML(
                            stripHTML(
                                itemDescription
                            )
                        )}

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    if (isNews) {

                        openNewsArticle(item);

                    } else {

                        openContent(item);

                    }

                }
            );


            grid.appendChild(
                card
            );

        }
    );


    library.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// CLOSE LIBRARY
// ============================================================

function closeLibraryView() {

    const library =
        document.getElementById(
            "library-view"
        );


    if (library) {

        library.classList.remove(
            "active"
        );

    }


    const homepage =
        document.getElementById(
            "home-content"
        );


    const header =
        document.querySelector(
            ".team-header"
        );


    if (homepage) {

        homepage.classList.remove(
            "hidden-home"
        );

    }


    if (header) {

        header.style.display =
            "";

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// OPEN PREDICTION
// ============================================================

function openPrediction(
    fixture
) {

    hideHomepage();


    const view =
        getContentView();


    const body =
        getContentViewBody();


    if (!view || !body) {
        return;
    }


    body.innerHTML = `

        <div class="br-view-type">
            PREDIÇÃO
        </div>

        <h1 class="br-view-title">
            Quem vai vencer?
        </h1>

        <div class="br-view-meta">
            ${formatMatchDate(
                fixture.date
            )}
        </div>

        <div class="br-fixtures">

            <div class="br-next-match">

                <div class="br-match-teams">

                    ${teamHTML(
                        fixture.home
                    )}

                    <div class="br-vs">
                        VS
                    </div>

                    ${teamHTML(
                        fixture.away
                    )}

                </div>

                <div
                    style="
                        margin-top:25px;
                        display:flex;
                        gap:10px;
                        justify-content:center;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        class="br-action-button"
                        type="button"
                    >
                        ${escapeHTML(
                            fixture.home.name
                        )}
                    </button>

                    <button
                        class="br-action-button"
                        type="button"
                    >
                        EMPATE
                    </button>

                    <button
                        class="br-action-button"
                        type="button"
                    >
                        ${escapeHTML(
                            fixture.away.name
                        )}
                    </button>

                </div>

            </div>

        </div>

    `;


    view.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// OPEN FIXTURE
// ============================================================

function openFixture(
    fixture
) {

    hideHomepage();


    const view =
        getContentView();


    const body =
        getContentViewBody();


    if (!view || !body) {
        return;
    }


    body.innerHTML = `

        <div class="br-view-type">

            ${escapeHTML(
                fixture.competition ||
                "JOGO"
            )}

        </div>

        <h1 class="br-view-title">

            ${escapeHTML(
                fixture.home.name
            )}

            vs

            ${escapeHTML(
                fixture.away.name
            )}

        </h1>

        <div class="br-view-meta">

            ${formatMatchDate(
                fixture.date
            )}

        </div>

        <div class="br-fixtures">

            <div class="br-next-match">

                <div class="br-match-teams">

                    ${teamHTML(
                        fixture.home
                    )}

                    <div class="br-vs">
                        VS
                    </div>

                    ${teamHTML(
                        fixture.away
                    )}

                </div>

            </div>

        </div>

    `;


    view.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// PLAYER RATINGS VIEW
// ============================================================

function openRatingsView() {

    hideHomepage();


    const view =
        getContentView();


    const body =
        getContentViewBody();


    if (!view || !body) {
        return;
    }


    body.innerHTML = `

        <div class="br-view-type">
            FAN PLAYER RATINGS
        </div>

        <h1 class="br-view-title">
            Avalia os jogadores
        </h1>

        <div class="br-view-description">

            Depois de cada jogo poderás dar a tua nota
            aos jogadores do teu clube.

        </div>

        <div class="br-empty">

            O sistema completo de avaliação será aberto
            quando houver um jogo disponível para avaliação.

        </div>

    `;


    view.classList.add(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// HIDE HOMEPAGE
// ============================================================

function hideHomepage() {

    const homepage =
        document.getElementById(
            "home-content"
        );


    const header =
        document.querySelector(
            ".team-header"
        );


    const view =
        getContentView();


    const library =
        document.getElementById(
            "library-view"
        );


    if (homepage) {

        homepage.classList.add(
            "hidden-home"
        );

    }


    if (header) {

        header.style.display =
            "none";

    }


    if (view) {

        view.classList.add(
            "active"
        );

    }


    if (library) {

        library.classList.remove(
            "active"
        );

    }

}


// ============================================================
// CLOSE FOCUSED VIEW
// ============================================================

function closeFocusedView() {

    const view =
        getContentView();


    const homepage =
        document.getElementById(
            "home-content"
        );


    const header =
        document.querySelector(
            ".team-header"
        );


    const body =
        getContentViewBody();


    if (view) {

        view.classList.remove(
            "active"
        );

    }


    if (homepage) {

        homepage.classList.remove(
            "hidden-home"
        );

    }


    if (header) {

        header.style.display =
            "";

    }


    if (body) {

        body.innerHTML =
            "";

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// FILTER ACTIVE CONTENT
// ============================================================

function filterActiveContent(
    items
) {

    const now =
        new Date();


    return items.filter(
        item => {

            if (
                item.start_date &&
                new Date(
                    item.start_date
                ) > now
            ) {

                return false;

            }


            if (
                item.end_date &&
                new Date(
                    item.end_date
                ) < now
            ) {

                return false;

            }


            return true;

        }
    );

}


// ============================================================
// IMAGE HTML
// ============================================================

function imageHTML(
    url,
    label
) {

    if (!url) {

        return `

            <div class="br-story-placeholder">
                ${escapeHTML(label)}
            </div>

        `;

    }


    return `

        <img
            src="${escapeAttribute(url)}"
            alt="${escapeAttribute(label)}"
            loading="lazy"
        >

    `;

}


// ============================================================
// TEAM HTML
// ============================================================

function teamHTML(
    team
) {

    if (!team) {
        return "";
    }


    return `

        <div class="br-match-team">

            ${
                team.logo
                    ? `
                        <img
                            class="br-team-logo"
                            src="${escapeAttribute(
                                team.logo
                            )}"
                            alt=""
                        >
                    `
                    : `
                        <div
                            class="br-team-logo"
                            style="
                                background:#eee;
                                border-radius:50%;
                            "
                        ></div>
                    `
            }

            <div class="br-team-name">

                ${escapeHTML(
                    team.name ||
                    ""
                )}

            </div>

        </div>

    `;

}


// ============================================================
// CONTENT LABEL
// ============================================================

function getContentLabel(
    item
) {

    if (
        item.content_type ===
        "community"
    ) {

        return "COMUNIDADE";

    }


    if (
        item.content_type ===
        "story"
    ) {

        return "HISTÓRIA";

    }


    if (
        item.area ===
        "opinion"
    ) {

        return "OPINIÃO";

    }


    if (
        item.area ===
        "analysis"
    ) {

        return "ANÁLISE";

    }


    return "NOTÍCIAS";

}


// ============================================================
// AUTHOR
// ============================================================

function getAuthor(
    item
) {

    return (
        item.author_name ||
        item.writer_name ||
        item.author ||
        "BR"
    );

}


// ============================================================
// ARTICLE BODY
// ============================================================

function getArticleBody(
    item
) {

    return (
        item.article_body ||
        item.body ||
        item.content_body ||
        item.article_text ||
        item.text ||
        item.description ||
        ""
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    date
) {

    if (!date) {
        return "";
    }


    try {

        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        ).format(
            new Date(date)
        );

    } catch {

        return "";

    }

}


// ============================================================
// FORMAT DATE + TIME
// ============================================================

function formatDateTime(
    date
) {

    if (!date) {
        return "";
    }


    try {

        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(
            new Date(date)
        );

    } catch {

        return "";

    }

}


// ============================================================
// FORMAT MATCH DATE
// ============================================================

function formatMatchDate(
    date
) {

    if (!date) {
        return "";
    }


    try {

        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(
            new Date(date)
        );

    } catch {

        return "";

    }

}


// ============================================================
// STRIP HTML
// ============================================================

function stripHTML(
    value
) {

    if (!value) {
        return "";
    }


    const temp =
        document.createElement(
            "div"
        );


    temp.innerHTML =
        String(value);


    return (
        temp.textContent ||
        temp.innerText ||
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ============================================================
// NORMALIZE
// ============================================================

function normalize(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value || ""
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


// ============================================================
// ESCAPE ATTRIBUTE
// ============================================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}
