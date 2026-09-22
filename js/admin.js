/* ============================================================
   BARÇA REAL
   HOME.JS
   ============================================================ */

let currentUser = null;
let currentTeam = null;
let currentFixtures = [];
let currentLibraryType = null;


/* ============================================================
   INITIAL LOAD
   ============================================================ */

async function loadHome() {

    try {

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

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("supported_team_id")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error(profileError);
        }

        if (!profile || !profile.supported_team_id) {
            window.location.href = "choose-team.html";
            return;
        }

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
            .eq("id", profile.supported_team_id)
            .single();

        if (teamError || !team) {
            console.error(teamError);
            return;
        }

        currentTeam = team;

        applyTeamTheme(team);
        updateTeamHeader(team);
        updateTeamBadge(team);

        await loadFeaturedContent(team.id);
        setupFeaturedCarousel();

        await Promise.all([
            loadNews(team.id),
            loadOpinions(team.id),
            loadFixtures(team),
            loadLeagueTable(team),
            loadPlayerRatings(team),
            loadVideos(team.id)
        ]);

        setupHomepageNavigation();

    } catch (error) {

        console.error("Erro ao carregar homepage:", error);

    }
}


/* ============================================================
   TEAM THEME
   ============================================================ */

function applyTeamTheme(team) {

    document.documentElement.style.setProperty(
        "--team-primary",
        team.primary_color || "#a50044"
    );

    document.documentElement.style.setProperty(
        "--team-secondary",
        team.secondary_color || "#004d98"
    );

    const primary = team.primary_color || "#a50044";

    document.documentElement.style.setProperty(
        "--team-glow",
        hexToRgba(primary, 0.18)
    );
}


function hexToRgba(hex, alpha) {

    if (!hex) {
        return `rgba(165,0,68,${alpha})`;
    }

    const clean = hex.replace("#", "");

    if (clean.length !== 6) {
        return `rgba(165,0,68,${alpha})`;
    }

    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}


/* ============================================================
   TEAM HEADER
   ============================================================ */

function updateTeamHeader(team) {

    const title = document.getElementById("team-title");
    const subtitle = document.getElementById("team-subtitle");

    if (!title) return;

    const slug = String(team.slug || "").toLowerCase();

    if (slug.includes("barca") || slug.includes("barcelona")) {

        title.textContent = "VISCA BARÇA";

    } else if (
        slug.includes("real") ||
        slug.includes("madrid")
    ) {

        title.textContent = "HALA MADRID";

    } else {

        title.textContent =
            team.name ? team.name.toUpperCase() : "BARÇA REAL";
    }

    if (subtitle) {
        subtitle.textContent =
            "Bem-vindo à tua experiência de futebol personalizada.";
    }
}


function updateTeamBadge(team) {

    const name = document.getElementById("selected-team-name");
    const badge = document.getElementById("selected-team-badge");

    if (name) {
        name.textContent =
            team.short_name || team.name || "Equipa";
    }

    if (badge) {
        badge.textContent =
            team.short_name
            ? team.short_name.substring(0, 3).toUpperCase()
            : "?";
    }
}


/* ============================================================
   DESTAQUE — EXISTING SYSTEM
   ============================================================ */

async function loadFeaturedContent(teamId) {

    const track = document.getElementById("featured-track");
    const dots = document.getElementById("featured-dots");

    if (!track) return;

    track.innerHTML = `
        <article class="featured-slide">
            <div class="featured-content">
                <span class="featured-tag">A CARREGAR</span>
                <h2>A carregar conteúdo...</h2>
                <p>Estamos a preparar os destaques para ti.</p>
            </div>
        </article>
    `;

    if (dots) {
        dots.innerHTML = "";
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("content")
            .select("*")
            .eq("area", "featured")
            .eq("status", "published")
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .order("sort_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        const now = new Date();

        const activeItems = (data || []).filter(item => {

            if (!item.image_url) {
                return false;
            }

            if (
                item.start_date &&
                new Date(item.start_date) > now
            ) {
                return false;
            }

            if (
                item.end_date &&
                new Date(item.end_date) < now
            ) {
                return false;
            }

            return true;
        });

        if (!activeItems.length) {

            renderEmptyFeatured(
                "Ainda não existem destaques publicados."
            );

            return;
        }

        renderFeaturedSlides(activeItems);

    } catch (error) {

        console.error(
            "Erro ao carregar destaques:",
            error
        );

        renderEmptyFeatured(
            "Não foi possível carregar os destaques."
        );
    }
}


function renderFeaturedSlides(items) {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (!track) return;

    track.innerHTML = "";

    if (dots) {
        dots.innerHTML = "";
    }

    items.forEach((item, index) => {

        const slide =
            document.createElement("article");

        slide.className =
            "featured-slide";

        slide.dataset.contentId =
            item.id;

        slide.innerHTML = `

            <img
                class="featured-slide-image"
                src="${escapeAttribute(item.image_url)}"
                alt="${escapeAttribute(item.title || "")}"
                loading="${index === 0 ? "eager" : "lazy"}">

            <div class="featured-slide-overlay"></div>

            <div class="featured-content">

                <span class="featured-tag">
                    ${escapeHtml(getFeaturedLabel(item))}
                </span>

                <h2>
                    ${escapeHtml(item.title || "Sem título")}
                </h2>

                ${
                    item.description
                    ? `
                        <p>
                            ${escapeHtml(item.description)}
                        </p>
                    `
                    : ""
                }

                ${
                    item.audio_url
                    ? `
                        <button
                            type="button"
                            class="featured-audio-button"
                            data-audio="${escapeAttribute(item.audio_url)}">
                            ▶ Ouvir
                        </button>
                    `
                    : ""
                }

            </div>
        `;

        slide.addEventListener("click", event => {

            if (
                event.target.closest(
                    ".featured-audio-button"
                )
            ) {
                return;
            }

            openContent(item);

        });

        track.appendChild(slide);


        if (dots) {

            const dot =
                document.createElement("button");

            dot.type = "button";

            dot.className =
                "featured-dot" +
                (index === 0 ? " active" : "");

            dot.addEventListener("click", () => {

                track.scrollTo({
                    left:
                        index * track.clientWidth,
                    behavior: "smooth"
                });

            });

            dots.appendChild(dot);
        }
    });


    track
        .querySelectorAll(".featured-audio-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    playFeaturedAudio(
                        button,
                        button.dataset.audio
                    );
                }
            );

        });
}


function getFeaturedLabel(item) {

    if (item.content_type === "advertisement") {
        return "PUBLICIDADE";
    }

    if (item.content_type === "community") {
        return "COMUNIDADE";
    }

    if (item.content_type === "story") {
        return "HISTÓRIA";
    }

    if (item.team_id) {
        return "DESTAQUE";
    }

    return "BARÇA REAL";
}


function renderEmptyFeatured(message) {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (track) {

        track.innerHTML = `
            <article class="featured-slide">

                <div class="featured-content">

                    <span class="featured-tag">
                        BARÇA REAL
                    </span>

                    <h2>
                        ${escapeHtml(message)}
                    </h2>

                    <p>
                        Os conteúdos publicados aparecerão aqui.
                    </p>

                </div>

            </article>
        `;
    }

    if (dots) {
        dots.innerHTML = "";
    }
}


function playFeaturedAudio(button, audioUrl) {

    if (!audioUrl) return;

    document
        .querySelectorAll(".featured-audio-button")
        .forEach(other => {

            if (other !== button) {
                other.textContent = "▶ Ouvir";
            }

        });

    if (
        button._audio &&
        !button._audio.paused
    ) {

        button._audio.pause();
        button.textContent = "▶ Ouvir";
        return;
    }

    if (button._audio) {
        button._audio.pause();
    }

    const audio =
        new Audio(audioUrl);

    button._audio = audio;

    button.textContent = "❚❚ A ouvir";

    audio.play().catch(error => {
        console.error(error);
        button.textContent = "▶ Ouvir";
    });

    audio.addEventListener(
        "ended",
        () => {
            button.textContent = "▶ Ouvir";
        }
    );
}


function setupFeaturedCarousel() {

    const track =
        document.getElementById("featured-track");

    const dots =
        document.getElementById("featured-dots");

    if (!track) return;

    let currentIndex = 0;
    let autoPlay;

    function updateDots() {

        if (!dots) return;

        const allDots =
            dots.querySelectorAll(".featured-dot");

        allDots.forEach((dot, index) => {

            dot.classList.toggle(
                "active",
                index === currentIndex
            );

        });
    }

    function goTo(index) {

        const slides =
            track.querySelectorAll(".featured-slide");

        if (!slides.length) return;

        currentIndex =
            (index + slides.length) %
            slides.length;

        track.scrollTo({
            left:
                currentIndex * track.clientWidth,
            behavior: "smooth"
        });

        updateDots();
    }

    function startAutoPlay() {

        clearInterval(autoPlay);

        autoPlay =
            setInterval(() => {

                goTo(currentIndex + 1);

            }, 4000);
    }

    track.addEventListener(
        "scroll",
        () => {

            const index =
                Math.round(
                    track.scrollLeft /
                    track.clientWidth
                );

            if (index !== currentIndex) {

                currentIndex = index;
                updateDots();
            }

        }
    );

    let mouseDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener(
        "mousedown",
        event => {

            mouseDown = true;
            startX = event.pageX;
            scrollLeft = track.scrollLeft;

        }
    );

    track.addEventListener(
        "mouseleave",
        () => {
            mouseDown = false;
        }
    );

    track.addEventListener(
        "mouseup",
        () => {
            mouseDown = false;
        }
    );

    track.addEventListener(
        "mousemove",
        event => {

            if (!mouseDown) return;

            event.preventDefault();

            const walk =
                event.pageX - startX;

            track.scrollLeft =
                scrollLeft - walk;

        }
    );

    startAutoPlay();
}


/* ============================================================
   NEWS
   ============================================================ */

async function loadNews(teamId) {

    const container =
        document.getElementById("news-home-grid");

    if (!container) return;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("content")
            .select("*")
            .eq("status", "published")
            .in("area", ["news", "noticias"])
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        const items =
            filterActiveContent(data || []);

        renderNews(items);

    } catch (error) {

        console.error(
            "Erro ao carregar notícias:",
            error
        );

        container.innerHTML = `
            <div class="homepage-empty">
                Não foi possível carregar as notícias.
            </div>
        `;
    }
}


function renderNews(items) {

    const container =
        document.getElementById("news-home-grid");

    if (!container) return;

    if (!items.length) {

        container.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem notícias publicadas.
            </div>
        `;

        return;
    }

    const main =
        items[0];

    const secondary =
        items.slice(1, 7);

    container.innerHTML = "";


    /* MAIN STORY */

    const mainCard =
        document.createElement("article");

    mainCard.className =
        "news-main-card content-clickable";

    mainCard.innerHTML = `

        ${
            main.image_url
            ? `
                <img
                    src="${escapeAttribute(main.image_url)}"
                    alt="${escapeAttribute(main.title || "")}">
            `
            : `
                <div class="news-main-placeholder">
                    BR
                </div>
            `
        }

        <div class="news-main-body">

            <div class="news-type">
                ${escapeHtml(getContentLabel(main))}
            </div>

            <h3>
                ${escapeHtml(main.title || "Sem título")}
            </h3>

            ${
                main.description
                ? `
                    <p>
                        ${escapeHtml(main.description)}
                    </p>
                `
                : ""
            }

            <div class="news-time">
                ${formatDate(main.created_at)}
            </div>

        </div>
    `;

    mainCard.addEventListener(
        "click",
        () => openContent(main)
    );

    container.appendChild(mainCard);


    /* SIX SMALL STORIES */

    const smallContainer =
        document.createElement("div");

    smallContainer.className =
        "news-small-list";

    secondary.forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "news-small-card content-clickable";

        card.innerHTML = `

            ${
                item.image_url
                ? `
                    <img
                        src="${escapeAttribute(item.image_url)}"
                        alt="${escapeAttribute(item.title || "")}"
                        loading="lazy">
                `
                : `
                    <div class="news-small-placeholder">
                        BR
                    </div>
                `
            }

            <div class="news-small-body">

                <div class="news-type">
                    ${escapeHtml(getContentLabel(item))}
                </div>

                <h3>
                    ${escapeHtml(item.title || "Sem título")}
                </h3>

                <div class="news-time">
                    ${formatDate(item.created_at)}
                </div>

            </div>
        `;

        card.addEventListener(
            "click",
            () => openContent(item)
        );

        smallContainer.appendChild(card);
    });

    container.appendChild(smallContainer);
}


/* ============================================================
   OPINION & ANALYSIS
   ============================================================ */

async function loadOpinions(teamId) {

    const container =
        document.getElementById("opinion-home-grid");

    if (!container) return;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("content")
            .select("*")
            .eq("status", "published")
            .in("area", [
                "opinion",
                "opiniao",
                "analysis",
                "analise"
            ])
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        renderOpinions(
            filterActiveContent(data || [])
        );

    } catch (error) {

        console.error(
            "Erro ao carregar opiniões:",
            error
        );

        container.innerHTML = `
            <div class="homepage-empty">
                Não foi possível carregar a área de opinião.
            </div>
        `;
    }
}


function renderOpinions(items) {

    const container =
        document.getElementById("opinion-home-grid");

    if (!container) return;

    if (!items.length) {

        container.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem opiniões publicadas.
            </div>
        `;

        return;
    }

    const main =
        items[0];

    const others =
        items.slice(1, 7);

    container.innerHTML = "";


    const mainCard =
        document.createElement("article");

    mainCard.className =
        "opinion-main-card content-clickable";

    mainCard.innerHTML = `

        ${
            main.image_url
            ? `
                <img
                    src="${escapeAttribute(main.image_url)}"
                    alt="${escapeAttribute(main.title || "")}">
            `
            : `
                <div class="opinion-main-placeholder">
                    OPINIÃO
                </div>
            `
        }

        <div class="opinion-main-body">

            <div class="news-type">
                OPINIÃO &amp; ANÁLISE
            </div>

            <h3>
                ${escapeHtml(main.title || "Sem título")}
            </h3>

            ${
                main.description
                ? `
                    <p>
                        ${escapeHtml(main.description)}
                    </p>
                `
                : ""
            }

            <div class="opinion-author">
                ${escapeHtml(getAuthorName(main))}
            </div>

        </div>
    `;

    mainCard.addEventListener(
        "click",
        () => openContent(main)
    );

    container.appendChild(mainCard);


    const smallContainer =
        document.createElement("div");

    smallContainer.className =
        "opinion-small-list";

    others.forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "opinion-small-card content-clickable";

        card.innerHTML = `

            ${
                item.image_url
                ? `
                    <img
                        src="${escapeAttribute(item.image_url)}"
                        alt="${escapeAttribute(item.title || "")}"
                        loading="lazy">
                `
                : `
                    <div class="opinion-small-placeholder">
                        OP
                    </div>
                `
            }

            <div class="opinion-small-body">

                <div class="news-type">
                    OPINIÃO
                </div>

                <h3>
                    ${escapeHtml(item.title || "Sem título")}
                </h3>

                <div class="opinion-author">
                    ${escapeHtml(getAuthorName(item))}
                </div>

            </div>
        `;

        card.addEventListener(
            "click",
            () => openContent(item)
        );

        smallContainer.appendChild(card);
    });

    container.appendChild(smallContainer);
}


/* ============================================================
   FIXTURES
   ============================================================ */

/*
   Fixture adapter.

   Later, connect this function to the selected football-data
   provider/API. The homepage itself already has the complete
   presentation layer.

   Expected object:

   {
       competition: "La Liga",
       date: "2026-09-25T20:00:00",
       home: {
           name: "Barcelona",
           badge: "..."
       },
       away: {
           name: "Real Madrid",
           badge: "..."
       }
   }
*/

async function loadFixtures(team) {

    const mainDate =
        document.getElementById(
            "main-fixture-date"
        );

    if (!mainDate) return;

    try {

        const fixtures =
            await getExternalFixtures(team);

        currentFixtures =
            Array.isArray(fixtures)
                ? fixtures
                : [];

        renderFixtures(currentFixtures);

    } catch (error) {

        console.error(
            "Erro ao carregar jogos:",
            error
        );

        renderNoFixtures();
    }
}


async function getExternalFixtures(team) {

    /*
       This is intentionally kept as the external-data adapter.

       When the football API is connected, only this function
       needs to be connected to that provider.
    */

    if (
        window.BARCA_REAL_FIXTURES &&
        Array.isArray(
            window.BARCA_REAL_FIXTURES
        )
    ) {

        return window.BARCA_REAL_FIXTURES;
    }

    return [];
}


function renderFixtures(fixtures) {

    const main =
        fixtures[0];

    const next =
        fixtures.slice(1, 3);

    if (!main) {
        renderNoFixtures();
        return;
    }

    setText(
        "main-fixture-competition",
        main.competition || "JOGO"
    );

    setText(
        "main-fixture-date",
        formatFixtureDate(main.date)
    );

    setText(
        "main-home-name",
        main.home?.name || "—"
    );

    setText(
        "main-away-name",
        main.away?.name || "—"
    );

    setBadge(
        "main-home-badge",
        main.home
    );

    setBadge(
        "main-away-badge",
        main.away
    );

    const list =
        document.getElementById(
            "next-fixtures"
        );

    if (!list) return;

    list.innerHTML = "";

    next.forEach(fixture => {

        const card =
            document.createElement("div");

        card.className =
            "fixture-small-card";

        card.innerHTML = `

            <div class="fixture-small-date">
                ${escapeHtml(
                    formatFixtureDate(fixture.date)
                )}
            </div>

            <div class="fixture-small-teams">

                <strong>
                    ${escapeHtml(
                        fixture.home?.name || "—"
                    )}
                </strong>

                <span>vs</span>

                <strong>
                    ${escapeHtml(
                        fixture.away?.name || "—"
                    )}
                </strong>

            </div>

            <div class="fixture-small-competition">
                ${escapeHtml(
                    fixture.competition || "JOGO"
                )}
            </div>
        `;

        list.appendChild(card);
    });
}


function renderNoFixtures() {

    setText(
        "main-fixture-competition",
        "JOGOS"
    );

    setText(
        "main-fixture-date",
        "Dados dos próximos jogos ainda não disponíveis"
    );

    setText(
        "main-home-name",
        currentTeam?.short_name ||
        currentTeam?.name ||
        "—"
    );

    setText(
        "main-away-name",
        "Adversário"
    );

    setText(
        "main-home-badge",
        currentTeam?.short_name ||
        "—"
    );

    setText(
        "main-away-badge",
        "?"
    );

    const list =
        document.getElementById(
            "next-fixtures"
        );

    if (list) {

        list.innerHTML = `
            <div class="fixture-small-card fixture-data-empty">
                Os próximos jogos serão apresentados aqui.
            </div>
        `;
    }
}


function setBadge(id, team) {

    const element =
        document.getElementById(id);

    if (!element) return;

    if (team?.badge) {

        element.innerHTML = `
            <img
                src="${escapeAttribute(team.badge)}"
                alt="${escapeAttribute(team.name || "")}">
        `;

    } else {

        element.textContent =
            team?.short_name ||
            team?.name?.substring(0, 3) ||
            "?";
    }
}


/* ============================================================
   PREDICTION
   ============================================================ */

function setupPrediction() {

    const button =
        document.getElementById(
            "prediction-button"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            if (!currentFixtures.length) {
                return;
            }

            const fixture =
                currentFixtures[0];

            setText(
                "prediction-match-title",
                `${fixture.home?.name || "—"} vs ${fixture.away?.name || "—"}`
            );

            setText(
                "prediction-home-name",
                fixture.home?.name || "—"
            );

            setText(
                "prediction-away-name",
                fixture.away?.name || "—"
            );

            showView("prediction-view");
        }
    );


    const submit =
        document.getElementById(
            "prediction-submit"
        );

    if (!submit) return;

    submit.addEventListener(
        "click",
        async () => {

            const homeScore =
                document.getElementById(
                    "prediction-home-score"
                )?.value;

            const awayScore =
                document.getElementById(
                    "prediction-away-score"
                )?.value;

            const message =
                document.getElementById(
                    "prediction-message"
                );

            if (
                homeScore === "" ||
                awayScore === ""
            ) {

                if (message) {
                    message.textContent =
                        "Indica o resultado da tua previsão.";
                }

                return;
            }

            /*
               Prediction storage can be connected once the
               predictions table/schema is defined.
            */

            if (message) {

                message.textContent =
                    "Previsão registada nesta sessão.";
            }
        }
    );
}


/* ============================================================
   LEAGUE TABLE
   ============================================================ */

async function loadLeagueTable(team) {

    const body =
        document.getElementById(
            "league-table-body"
        );

    if (!body) return;

    renderEmptyTable(
        "A classificação será carregada a partir da fonte oficial de jogos."
    );

    document
        .querySelectorAll(".table-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".table-tab")
                        .forEach(other =>
                            other.classList.remove("active")
                        );

                    tab.classList.add("active");

                    const competition =
                        tab.dataset.competition;

                    loadTableCompetition(
                        team,
                        competition
                    );
                }
            );

        });
}


async function loadTableCompetition(
    team,
    competition
) {

    renderEmptyTable(
        `${competition === "champions"
            ? "Champions League"
            : "Liga"} — classificação a carregar.`
    );

    /*
       External league-table adapter.

       Connect the football-data provider here when the API
       credentials/source are configured.
    */
}


function renderEmptyTable(message) {

    const body =
        document.getElementById(
            "league-table-body"
        );

    if (!body) return;

    body.innerHTML = `
        <div class="table-empty">
            ${escapeHtml(message)}
        </div>
    `;
}


/* ============================================================
   PLAYER RATINGS
   ============================================================ */

async function loadPlayerRatings(team) {

    const container =
        document.getElementById(
            "ratings-list"
        );

    if (!container) return;

    /*
       Ratings should eventually come from a dedicated
       Supabase ratings table.

       We deliberately do not query a table that has not yet
       been defined in the project.
    */

    container.innerHTML = `
        <div class="table-empty">
            As avaliações dos adeptos aparecerão aqui depois dos jogos.
        </div>
    `;
}


/* ============================================================
   VIDEOS
   ============================================================ */

async function loadVideos(teamId) {

    const container =
        document.getElementById(
            "videos-home-grid"
        );

    if (!container) return;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("content")
            .select("*")
            .eq("status", "published")
            .eq("content_type", "video")
            .or(`team_id.eq.${teamId},team_id.is.null`)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        renderVideos(
            filterActiveContent(data || [])
        );

    } catch (error) {

        console.error(
            "Erro ao carregar vídeos:",
            error
        );

        container.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem vídeos publicados.
            </div>
        `;
    }
}


function renderVideos(items) {

    const container =
        document.getElementById(
            "videos-home-grid"
        );

    if (!container) return;

    if (!items.length) {

        container.innerHTML = `
            <div class="homepage-empty">
                Ainda não existem vídeos publicados.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    items.slice(0, 4).forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "video-card content-clickable";

        card.innerHTML = `

            <div class="video-image">

                ${
                    item.image_url
                    ? `
                        <img
                            src="${escapeAttribute(item.image_url)}"
                            alt="${escapeAttribute(item.title || "")}"
                            loading="lazy">
                    `
                    : ""
                }

                <span class="video-play">
                    ▶
                </span>

            </div>

            <div class="video-body">

                <div class="news-type">
                    VÍDEO
                </div>

                <h3>
                    ${escapeHtml(
                        item.title || "Sem título"
                    )}
                </h3>

            </div>
        `;

        card.addEventListener(
            "click",
            () => openContent(item)
        );

        container.appendChild(card);
    });
}


/* ============================================================
   CONTENT VIEW
   ============================================================ */

function openContent(item) {

    if (!item) return;

    const title =
        document.getElementById(
            "focused-content-title"
        );

    const description =
        document.getElementById(
            "focused-content-description"
        );

    const image =
        document.getElementById(
            "focused-content-image"
        );

    const meta =
        document.getElementById(
            "focused-content-meta"
        );

    const author =
        document.getElementById(
            "focused-content-author"
        );

    const media =
        document.getElementById(
            "focused-content-media"
        );

    if (title) {
        title.textContent =
            item.title || "Sem título";
    }

    if (description) {
        description.textContent =
            item.description || "";
    }

    if (meta) {
        meta.textContent =
            getContentLabel(item);
    }

    if (author) {

        const authorName =
            getAuthorName(item);

        author.textContent =
            authorName !== "Barça Real"
                ? `Por ${authorName}`
                : "";
    }

    if (image) {

        if (item.image_url) {

            image.innerHTML = `
                <img
                    src="${escapeAttribute(item.image_url)}"
                    alt="${escapeAttribute(item.title || "")}">
            `;

        } else {

            image.innerHTML = `
                <div class="focused-image-placeholder">
                    BARÇA REAL
                </div>
            `;
        }
    }

    if (media) {

        media.innerHTML = "";

        if (item.audio_url) {

            const audio =
                document.createElement("audio");

            audio.controls = true;
            audio.src = item.audio_url;

            media.appendChild(audio);
        }

        if (
            item.content_type === "video" &&
            item.video_url
        ) {

            const video =
                document.createElement("video");

            video.controls = true;
            video.src = item.video_url;

            media.appendChild(video);
        }
    }

    showView("focused-content-view");
}


/* ============================================================
   LIBRARY
   ============================================================ */

async function openLibrary(type) {

    currentLibraryType = type;

    const title =
        document.getElementById(
            "library-title"
        );

    const label =
        document.getElementById(
            "library-label"
        );

    const grid =
        document.getElementById(
            "library-grid"
        );

    if (!grid) return;

    if (type === "news") {

        title.textContent =
            "Todas as Notícias";

        label.textContent =
            "NOTÍCIAS";

    } else if (type === "opinion") {

        title.textContent =
            "Opinião & Análise";

        label.textContent =
            "VOZES";

    } else if (type === "videos") {

        title.textContent =
            "Todos os Vídeos";

        label.textContent =
            "VÍDEOS";
    }

    grid.innerHTML = `
        <div class="homepage-loading">
            A carregar biblioteca...
        </div>
    `;

    showView("library-view");

    let areas = [];

    if (type === "news") {
        areas = ["news", "noticias"];
    }

    if (type === "opinion") {
        areas = [
            "opinion",
            "opiniao",
            "analysis",
            "analise"
        ];
    }

    try {

        let query =
            supabaseClient
                .from("content")
                .select("*")
                .eq("status", "published")
                .or(`team_id.eq.${currentTeam.id},team_id.is.null`)
                .order("created_at", {
                    ascending: false
                });

        if (type === "videos") {

            query =
                query.eq(
                    "content_type",
                    "video"
                );

        } else {

            query =
                query.in(
                    "area",
                    areas
                );
        }

        const {
            data,
            error
        } = await query;

        if (error) {
            throw error;
        }

        renderLibrary(
            filterActiveContent(data || [])
        );

    } catch (error) {

        console.error(
            "Erro na biblioteca:",
            error
        );

        grid.innerHTML = `
            <div class="homepage-empty">
                Não foi possível carregar os conteúdos.
            </div>
        `;
    }
}


function renderLibrary(items) {

    const grid =
        document.getElementById(
            "library-grid"
        );

    if (!grid) return;

    if (!items.length) {

        grid.innerHTML = `
            <div class="homepage-empty">
                Não existem conteúdos publicados nesta área.
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    items.forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "library-card content-clickable";

        card.innerHTML = `

            ${
                item.image_url
                ? `
                    <img
                        src="${escapeAttribute(item.image_url)}"
                        alt="${escapeAttribute(item.title || "")}"
                        loading="lazy">
                `
                : `
                    <div class="library-placeholder">
                        BR
                    </div>
                `
            }

            <div class="library-card-body">

                <div class="news-type">
                    ${escapeHtml(
                        getContentLabel(item)
                    )}
                </div>

                <h3>
                    ${escapeHtml(
                        item.title || "Sem título"
                    )}
                </h3>

                <div class="news-time">
                    ${formatDate(item.created_at)}
                </div>

            </div>
        `;

        card.addEventListener(
            "click",
            () => openContent(item)
        );

        grid.appendChild(card);
    });
}


/* ============================================================
   VIEW SWITCHING
   ============================================================ */

function showView(viewId) {

    const homepageSections =
        document.querySelectorAll(
            ".homepage-section"
        );

    const featured =
        document.querySelector(
            ".section:not(.homepage-section)"
        );

    const focused =
        document.getElementById(
            "focused-content-view"
        );

    const library =
        document.getElementById(
            "library-view"
        );

    const prediction =
        document.getElementById(
            "prediction-view"
        );

    homepageSections.forEach(section => {
        section.hidden = true;
    });

    if (featured) {
        featured.hidden = true;
    }

    if (focused) {
        focused.hidden = true;
    }

    if (library) {
        library.hidden = true;
    }

    if (prediction) {
        prediction.hidden = true;
    }

    const selected =
        document.getElementById(viewId);

    if (selected) {
        selected.hidden = false;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function returnHome() {

    const homepageSections =
        document.querySelectorAll(
            ".homepage-section"
        );

    const featured =
        document.querySelector(
            ".section:not(.homepage-section)"
        );

    const focused =
        document.getElementById(
            "focused-content-view"
        );

    const library =
        document.getElementById(
            "library-view"
        );

    const prediction =
        document.getElementById(
            "prediction-view"
        );

    homepageSections.forEach(section => {
        section.hidden = false;
    });

    if (featured) {
        featured.hidden = false;
    }

    if (focused) {
        focused.hidden = true;
    }

    if (library) {
        library.hidden = true;
    }

    if (prediction) {
        prediction.hidden = true;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupHomepageNavigation() {

    const moreNews =
        document.getElementById(
            "more-news-button"
        );

    if (moreNews) {

        moreNews.addEventListener(
            "click",
            () => openLibrary("news")
        );
    }


    const moreOpinion =
        document.getElementById(
            "more-opinion-button"
        );

    if (moreOpinion) {

        moreOpinion.addEventListener(
            "click",
            () => openLibrary("opinion")
        );
    }


    const moreVideos =
        document.getElementById(
            "more-videos-button"
        );

    if (moreVideos) {

        moreVideos.addEventListener(
            "click",
            () => openLibrary("videos")
        );
    }


    document
        .getElementById("focused-back-button")
        ?.addEventListener(
            "click",
            returnHome
        );


    document
        .getElementById("library-back-button")
        ?.addEventListener(
            "click",
            returnHome
        );


    document
        .getElementById("prediction-back-button")
        ?.addEventListener(
            "click",
            returnHome
        );


    setupPrediction();


    document
        .getElementById("community-nav")
        ?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "community.html";
            }
        );


    document
        .getElementById("games-nav")
        ?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "games.html";
            }
        );
}


/* ============================================================
   HELPERS
   ============================================================ */

function filterActiveContent(items) {

    const now =
        new Date();

    return items.filter(item => {

        if (
            item.start_date &&
            new Date(item.start_date) > now
        ) {
            return false;
        }

        if (
            item.end_date &&
            new Date(item.end_date) < now
        ) {
            return false;
        }

        return true;
    });
}


function getContentLabel(item) {

    if (
        item.area === "opinion" ||
        item.area === "opiniao" ||
        item.area === "analysis" ||
        item.area === "analise"
    ) {
        return "OPINIÃO & ANÁLISE";
    }

    if (
        item.content_type === "video"
    ) {
        return "VÍDEO";
    }

    if (
        item.content_type === "community"
    ) {
        return "COMUNIDADE";
    }

    if (
        item.content_type === "advertisement"
    ) {
        return "PUBLICIDADE";
    }

    return "NOTÍCIA";
}


function getAuthorName(item) {

    return (
        item.author_name ||
        item.writer_name ||
        item.author ||
        "Barça Real"
    );
}


function formatDate(date) {

    if (!date) return "";

    const value =
        new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "";
    }

    return value.toLocaleDateString(
        "pt-PT",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatFixtureDate(date) {

    if (!date) {
        return "Data a confirmar";
    }

    const value =
        new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "Data a confirmar";
    }

    return value.toLocaleString(
        "pt-PT",
        {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}


/* ============================================================
   START
   ============================================================ */

loadHome();
