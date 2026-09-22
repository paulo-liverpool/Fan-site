// ============================================================
// BARÇA REAL
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
        document.getElementById(
            "featured-track"
        );

    if (!track) {
        return;
    }


    const dots =
        document.getElementById(
            "featured-dots"
        );


    // --------------------------------------------------------
    // LOAD PUBLISHED FEATURED CONTENT
    // --------------------------------------------------------

    const {
        data,
        error
    } = await supabaseClient
        .from("content")
        .select("*")
        .eq(
            "area",
            "featured"
        )
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
            "Erro ao carregar destaques:",
            error
        );

        renderEmptyFeatured();

        return;
    }


    // --------------------------------------------------------
    // FILTER ACTIVE DATES
    // --------------------------------------------------------

    const activeItems =
        filterActiveContent(
            data || []
        );


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    if (!activeItems.length) {

        renderEmptyFeatured();

        return;
    }


    renderFeaturedSlides(
        activeItems
    );

}


// ============================================================
// RENDER FEATURED SLIDES
// ============================================================

function renderFeaturedSlides(items) {

    const track =
        document.getElementById(
            "featured-track"
        );

    const dots =
        document.getElementById(
            "featured-dots"
        );


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
                document.createElement(
                    "article"
                );


            slide.className =
                "featured-slide";


            slide.dataset.index =
                index;


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
                                        item.title ||
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
                                    DESTAQUE
                                </div>
                            `
                    }

                </div>

                <div class="featured-slide-overlay"></div>

                <div class="featured-content">

                    <div class="featured-tag">
                        ${getFeaturedLabel(item)}
                    </div>

                    <h2>
                        ${escapeHTML(
                            item.title ||
                            "Sem título"
                        )}
                    </h2>

                    ${
                        item.description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        item.description
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


            // ------------------------------------------------
            // OPEN FEATURED CONTENT
            // ------------------------------------------------

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


                    openContent(
                        item
                    );

                }
            );


            // ------------------------------------------------
            // AUDIO
            // ------------------------------------------------

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


            // ------------------------------------------------
            // DOT
            // ------------------------------------------------

            if (dots) {

                const dot =
                    document.createElement(
                        "button"
                    );


                dot.type =
                    "button";


                dot.className =
                    "featured-dot";


                if (index === 0) {

                    dot.classList.add(
                        "active"
                    );

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
        document.getElementById(
            "featured-track"
        );

    const dots =
        document.getElementById(
            "featured-dots"
        );


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
        document.getElementById(
            "featured-track"
        );


    const dots =
        document.getElementById(
            "featured-dots"
        );


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


    // --------------------------------------------------------
    // UPDATE DOTS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // GO TO SLIDE
    // --------------------------------------------------------

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

            index =
                slides.length - 1;

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


    // --------------------------------------------------------
    // DETECT CURRENT SLIDE FROM SCROLL
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // AUTOPLAY
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DOT CLICKS
    // --------------------------------------------------------

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


                        goToSlide(
                            index
                        );


                        startAutoPlay();

                    }
                );

            }
        );


    // --------------------------------------------------------
    // SCROLL
    // --------------------------------------------------------

    track.addEventListener(
        "scroll",
        () => {

            detectCurrentSlide();

        },
        {
            passive: true
        }
    );


    // --------------------------------------------------------
    // MOUSE DRAG
    // --------------------------------------------------------

    track.addEventListener(
        "mousedown",
        event => {

            isDragging = true;

            moved = false;

            startX =
                event.pageX;

            startScrollLeft =
                track.scrollLeft;

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


    // --------------------------------------------------------
    // TOUCH / MOBILE SWIPE
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // PAUSE WHEN MOUSE IS OVER CAROUSEL
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // INITIAL POSITION
    // --------------------------------------------------------

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
            "news-grid"
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
        .in(
            "area",
            [
                "news",
                "both"
            ]
        )
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
            "Erro ao carregar notícias:",
            error
        );

        container.innerHTML = `
            <div class="br-empty">
                Não foi possível carregar as notícias.
            </div>
        `;

        return;
    }


    const valid =
        filterActiveContent(
            data || []
        );


    newsItems =
        valid.slice(
            0,
            7
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
        newsItems
    );

}


// ============================================================
// RENDER NEWS
// ============================================================

function renderNews(items) {

    const container =
        document.getElementById(
            "news-grid"
        );


    container.innerHTML = "";


    const main =
        items[0];


    const mainStory =
        document.createElement(
            "article"
        );


    mainStory.className =
        "br-main-story";


    mainStory.innerHTML = `

        <div class="br-main-story-image">

            ${imageHTML(
                main.image_url,
                "Notícia"
            )}

        </div>

        <div class="br-main-story-body">

            <div class="br-story-meta">
                ${getContentLabel(main)}
            </div>

            <h3 class="br-main-story-title">
                ${escapeHTML(
                    main.title ||
                    "Sem título"
                )}
            </h3>

            <p class="br-main-story-description">
                ${escapeHTML(
                    main.description ||
                    ""
                )}
            </p>

        </div>
    `;


    mainStory.addEventListener(
        "click",
        () => openContent(
            main
        )
    );


    container.appendChild(
        mainStory
    );


    const smallWrapper =
        document.createElement(
            "div"
        );


    smallWrapper.className =
        "br-small-news";


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "br-small-story";


                card.innerHTML = `

                    <div class="br-small-story-image">

                        ${imageHTML(
                            item.image_url,
                            "Notícia"
                        )}

                    </div>

                    <div>

                        <div class="br-story-meta">
                            ${getContentLabel(item)}
                        </div>

                        <h3 class="br-small-story-title">
                            ${escapeHTML(
                                item.title ||
                                "Sem título"
                            )}
                        </h3>

                        <p class="br-small-story-description">
                            ${escapeHTML(
                                item.description ||
                                ""
                            )}
                        </p>

                    </div>
                `;


                card.addEventListener(
                    "click",
                    () => openContent(
                        item
                    )
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
// OPINION
// ============================================================

async function loadOpinion(teamId) {

    const container =
        document.getElementById(
            "opinion-grid"
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
            7
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
        opinionItems
    );

}


// ============================================================
// RENDER OPINION
// ============================================================

function renderOpinion(items) {

    const container =
        document.getElementById(
            "opinion-grid"
        );


    container.innerHTML = "";


    const main =
        items[0];


    const feature =
        document.createElement(
            "article"
        );


    feature.className =
        "br-opinion-card";


    feature.innerHTML = `

        <div class="br-opinion-feature-image">

            ${imageHTML(
                main.image_url,
                "Opinião"
            )}

        </div>

        <div class="br-opinion-feature-body">

            <div class="br-opinion-author">
                ${getAuthor(main)}
            </div>

            <h3 class="br-main-story-title">
                ${escapeHTML(
                    main.title ||
                    "Sem título"
                )}
            </h3>

            <p class="br-main-story-description">
                ${escapeHTML(
                    main.description ||
                    ""
                )}
            </p>

        </div>
    `;


    feature.addEventListener(
        "click",
        () => openContent(
            main
        )
    );


    container.appendChild(
        feature
    );


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "br-opinion-list";


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "br-opinion-small";


                card.innerHTML = `

                    <div class="br-opinion-small-image">

                        ${imageHTML(
                            item.image_url,
                            "Opinião"
                        )}

                    </div>

                    <div>

                        <div class="br-opinion-author">
                            ${getAuthor(item)}
                        </div>

                        <h3 class="br-small-story-title">
                            ${escapeHTML(
                                item.title ||
                                "Sem título"
                            )}
                        </h3>

                        <p class="br-small-story-description">
                            ${escapeHTML(
                                item.description ||
                                ""
                            )}
                        </p>

                    </div>
                `;


                card.addEventListener(
                    "click",
                    () => openContent(
                        item
                    )
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
                document.createElement(
                    "div"
                );


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
            ".br-tab"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        document
                            .querySelectorAll(
                                ".br-tab"
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
        document.getElementById(
            "league-table-container"
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
                document.createElement(
                    "tr"
                );


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
                document.createElement(
                    "div"
                );


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
            "videos-container"
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
            "videos-container"
        );


    const main =
        items[0];


    container.innerHTML = `

        <article
            class="br-video-feature"
            id="main-video"
        >

            <div class="br-video-image">

                ${imageHTML(
                    main.image_url,
                    "Vídeo"
                )}

                <button
                    type="button"
                    class="br-play-button"
                    aria-label="Reproduzir vídeo"
                >
                    ▶
                </button>

            </div>

            <div class="br-video-title">
                ${escapeHTML(
                    main.title ||
                    "Vídeo"
                )}
            </div>

        </article>

        <div
            class="br-video-list"
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
            () => openContent(
                main
            )
        );

    }


    const list =
        document.getElementById(
            "video-list"
        );


    items
        .slice(
            1,
            7
        )
        .forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "br-video-small";


                card.innerHTML = `

                    <div class="br-video-small-image">

                        ${imageHTML(
                            item.image_url,
                            "Vídeo"
                        )}

                    </div>

                    <div class="br-video-small-title">
                        ${escapeHTML(
                            item.title ||
                            "Vídeo"
                        )}
                    </div>

                `;


                card.addEventListener(
                    "click",
                    () => openContent(
                        item
                    )
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

}


// ============================================================
// OPEN ARTICLE
// ============================================================

function openContent(item) {

    const view =
        document.getElementById(
            "content-view"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


    if (!view || !body) {
        return;
    }


    hideHomepage();


    body.innerHTML = `

        <div class="br-view-type">
            ${getContentLabel(item)}
        </div>

        <h1 class="br-view-title">
            ${escapeHTML(
                item.title ||
                "Sem título"
            )}
        </h1>

        <div class="br-view-meta">

            ${escapeHTML(
                getAuthor(item)
            )}

            ${
                item.created_at
                    ? " • " +
                      formatDate(
                          item.created_at
                      )
                    : ""
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
                        alt=""
                    >
                `
                : ""
        }

        ${
            item.description
                ? `
                    <div class="br-view-description">
                        ${escapeHTML(
                            item.description
                        )}
                    </div>
                `
                : ""
        }

        <div class="br-view-body">
            ${escapeHTML(
                getArticleBody(item)
            )}
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
// OPEN LIST VIEW
// ============================================================

function openListView(
    title,
    items,
    type
) {

    hideHomepage();


    const view =
        document.getElementById(
            "content-view"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


    if (!view || !body) {
        return;
    }


    body.innerHTML = `

        <div class="br-view-type">

            ${escapeHTML(
                type === "news"
                    ? "NOTÍCIAS"
                    : "OPINIÃO & ANÁLISE"
            )}

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

            const card =
                document.createElement(
                    "article"
                );


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
                            >
                        `
                        : `
                            <div class="br-list-view-image"></div>
                        `
                }

                <div>

                    <div class="br-story-meta">
                        ${getContentLabel(item)}
                    </div>

                    <div class="br-list-view-title">
                        ${escapeHTML(
                            item.title ||
                            ""
                        )}
                    </div>

                    <div class="br-list-view-description">
                        ${escapeHTML(
                            item.description ||
                            ""
                        )}
                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => openContent(
                    item
                )
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
// OPEN PREDICTION
// ============================================================

function openPrediction(
    fixture
) {

    hideHomepage();


    const view =
        document.getElementById(
            "content-view"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


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
        document.getElementById(
            "content-view"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


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
        document.getElementById(
            "content-view"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


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
            "homepage-content"
        );


    const header =
        document.querySelector(
            ".team-header"
        );


    const view =
        document.getElementById(
            "content-view"
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

}


// ============================================================
// CLOSE FOCUSED VIEW
// ============================================================

function closeFocusedView() {

    const view =
        document.getElementById(
            "content-view"
        );


    const homepage =
        document.getElementById(
            "homepage-content"
        );


    const header =
        document.querySelector(
            ".team-header"
        );


    const body =
        document.getElementById(
            "content-view-body"
        );


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
        "Barça Real"
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
