// ===========================================================
// BARÇA REAL
// HOME PAGE
// ============================================================


// ============================================================
// CARREGAR UTILIZADOR + CLUBE
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


    // --------------------------------------------------------
    // PERFIL
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // CLUBE
    // --------------------------------------------------------

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

        window.location.href = "choose-team.html";

        return;
    }


    // ========================================================
    // IDENTIDADE VISUAL
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
    // CONTEÚDO PERSONALIZADO
    // ========================================================

    document.getElementById(
        "team-title"
    ).textContent =
        team.slug === "barcelona"
            ? "VISCA BARÇA"
            : "HALA MADRID";


    document.getElementById(
        "team-subtitle"
    ).textContent =
        "Bem-vindo à tua experiência de futebol personalizada.";


    document.getElementById(
        "selected-team-name"
    ).textContent =
        team.short_name;


    document.getElementById(
        "selected-team-badge"
    ).textContent =
        team.slug === "barcelona"
            ? "FCB"
            : "RMA";


    // ========================================================
    // CARREGAR DESTAQUES
    // ========================================================

    await loadFeaturedContent(team.id);


    // ========================================================
    // INICIAR CAROUSEL
    // ========================================================

    setupFeaturedCarousel();
}



// ============================================================
// CARREGAR DESTAQUES DO SUPABASE
// ============================================================

async function loadFeaturedContent(teamId) {

    const track =
        document.getElementById(
            "featured-track"
        );


    const dotsContainer =
        document.getElementById(
            "featured-dots"
        );


    if (!track) {
        return;
    }


    // --------------------------------------------------------
    // CARREGAMENTO
    // --------------------------------------------------------

    track.innerHTML = `
        <article class="featured-slide">
            <div class="featured-slide-background"></div>

            <div class="featured-content">

                <span class="featured-tag">
                    BARÇA REAL
                </span>

                <h2>
                    A carregar os destaques...
                </h2>

            </div>
        </article>
    `;


    if (dotsContainer) {
        dotsContainer.innerHTML = "";
    }


    // --------------------------------------------------------
    // CONSULTAR SUPABASE
    // --------------------------------------------------------

    const {
        data,
        error
    } = await supabaseClient
        .from("content")
        .select(`
            id,
            title,
            description,
            content_type,
            area,
            team_id,
            image_url,
            audio_url,
            status,
            start_date,
            end_date,
            sort_order,
            created_at
        `)
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


    if (error) {

        console.error(
            "Erro ao carregar destaques:",
            error
        );


        renderEmptyFeatured(
            "Não foi possível carregar os destaques."
        );


        return;
    }


    // --------------------------------------------------------
    // FILTRAR DATAS + IMAGEM
    // --------------------------------------------------------

    const now = new Date();


    const validItems =
        (data || []).filter(
            (item) => {

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


                // Todos os destaques precisam de imagem
                if (!item.image_url) {
                    return false;
                }


                return true;
            }
        );


    // --------------------------------------------------------
    // SEM DESTAQUES
    // --------------------------------------------------------

    if (!validItems.length) {

        renderEmptyFeatured(
            "Ainda não existem destaques publicados."
        );

        return;
    }


    // --------------------------------------------------------
    // RENDERIZAR
    // --------------------------------------------------------

    renderFeaturedSlides(
        validItems
    );
}



// ============================================================
// RENDERIZAR DESTAQUES
// ============================================================

function renderFeaturedSlides(items) {

    const track =
        document.getElementById(
            "featured-track"
        );


    const dotsContainer =
        document.getElementById(
            "featured-dots"
        );


    if (!track) {
        return;
    }


    track.innerHTML = "";


    if (dotsContainer) {
        dotsContainer.innerHTML = "";
    }


    // --------------------------------------------------------
    // CRIAR CADA SLIDE
    // --------------------------------------------------------

    items.forEach(
        (item, index) => {

            const slide =
                document.createElement(
                    "article"
                );


            slide.className =
                "featured-slide";


            // ------------------------------------------------
            // IMAGEM
            // ------------------------------------------------

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "featured-slide-image";


            image.src =
                item.image_url;


            image.alt =
                item.title ||
                "Destaque Barça Real";


            // ------------------------------------------------
            // OVERLAY
            // ------------------------------------------------

            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "featured-slide-overlay";


            // ------------------------------------------------
            // CONTEÚDO
            // ------------------------------------------------

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "featured-content";


            // ------------------------------------------------
            // ETIQUETA
            // ------------------------------------------------

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "featured-tag";


            tag.textContent =
                getFeaturedLabel(
                    item
                );


            content.appendChild(
                tag
            );


            // ------------------------------------------------
            // TÍTULO — OPCIONAL
            // ------------------------------------------------

            if (item.title) {

                const title =
                    document.createElement(
                        "h2"
                    );


                title.textContent =
                    item.title;


                content.appendChild(
                    title
                );
            }


            // ------------------------------------------------
            // DESCRIÇÃO — OPCIONAL
            // ------------------------------------------------

            if (item.description) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    item.description;


                content.appendChild(
                    description
                );
            }


            // ------------------------------------------------
            // ÁUDIO — OPCIONAL
            // ------------------------------------------------

            if (item.audio_url) {

                const audioButton =
                    document.createElement(
                        "button"
                    );


                audioButton.type =
                    "button";


                audioButton.className =
                    "featured-audio-button";


                audioButton.textContent =
                    "▶ Ouvir";


                audioButton.dataset.audio =
                    item.audio_url;


                audioButton.addEventListener(
                    "click",
                    (event) => {

                        event.stopPropagation();


                        playFeaturedAudio(
                            audioButton,
                            item.audio_url
                        );
                    }
                );


                content.appendChild(
                    audioButton
                );
            }


            // ------------------------------------------------
            // MONTAR SLIDE
            // ------------------------------------------------

            slide.appendChild(
                image
            );


            slide.appendChild(
                overlay
            );


            slide.appendChild(
                content
            );


            track.appendChild(
                slide
            );


            // ------------------------------------------------
            // DOT
            // ------------------------------------------------

            if (dotsContainer) {

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


                dot.dataset.slide =
                    index;


                dot.setAttribute(
                    "aria-label",
                    `Ir para destaque ${index + 1}`
                );


                dotsContainer.appendChild(
                    dot
                );
            }

        }
    );
}



// ============================================================
// ETIQUETA DO DESTAQUE
// ============================================================

function getFeaturedLabel(item) {

    if (
        item.content_type ===
        "advertisement"
    ) {
        return "PUBLICIDADE";
    }


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


    if (item.team_id) {
        return "DESTAQUE";
    }


    return "BARÇA REAL";
}



// ============================================================
// SEM DESTAQUES
// ============================================================

function renderEmptyFeatured(message) {

    const track =
        document.getElementById(
            "featured-track"
        );


    const dotsContainer =
        document.getElementById(
            "featured-dots"
        );


    if (!track) {
        return;
    }


    track.innerHTML = `
        <article class="featured-slide">

            <div class="featured-slide-background"></div>

            <div class="featured-content">

                <span class="featured-tag">
                    BARÇA REAL
                </span>

                <h2>
                    ${message}
                </h2>

            </div>

        </article>
    `;


    if (dotsContainer) {
        dotsContainer.innerHTML = "";
    }
}



// ============================================================
// REPRODUZIR ÁUDIO
// ============================================================

function playFeaturedAudio(
    button,
    audioUrl
) {

    // --------------------------------------------------------
    // PARAR OUTROS ÁUDIOS
    // --------------------------------------------------------

    if (
        window.featuredAudio &&
        !window.featuredAudio.paused
    ) {

        window.featuredAudio.pause();
    }


    // --------------------------------------------------------
    // SE CLICAR NO MESMO BOTÃO
    // --------------------------------------------------------

    if (
        window.featuredAudio &&
        window.featuredAudio.src ===
        audioUrl
    ) {

        if (
            window.featuredAudio.paused
        ) {

            window.featuredAudio.play();

            button.textContent =
                "⏸ A ouvir";

        } else {

            window.featuredAudio.pause();

            button.textContent =
                "▶ Ouvir";
        }


        return;
    }


    // --------------------------------------------------------
    // RESETAR BOTÕES
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".featured-audio-button"
        )
        .forEach(
            (btn) => {

                btn.textContent =
                    "▶ Ouvir";
            }
        );


    // --------------------------------------------------------
    // NOVO ÁUDIO
    // --------------------------------------------------------

    const audio =
        new Audio(
            audioUrl
        );


    window.featuredAudio =
        audio;


    audio.addEventListener(
        "ended",
        () => {

            button.textContent =
                "▶ Ouvir";
        }
    );


    audio.addEventListener(
        "error",
        () => {

            button.textContent =
                "▶ Ouvir";

            console.error(
                "Não foi possível reproduzir o áudio."
            );
        }
    );


    audio.play()
        .then(
            () => {

                button.textContent =
                    "⏸ A ouvir";
            }
        )
        .catch(
            (error) => {

                console.error(
                    "Erro ao reproduzir áudio:",
                    error
                );

                button.textContent =
                    "▶ Ouvir";
            }
        );
}



// ============================================================
// CAROUSEL
// ============================================================

function setupFeaturedCarousel() {

    const track =
        document.getElementById(
            "featured-track"
        );


    const dots =
        document.querySelectorAll(
            ".featured-dot"
        );


    if (!track || !dots.length) {
        return;
    }


    const slides =
        track.querySelectorAll(
            ".featured-slide"
        );


    let currentSlide = 0;


    // --------------------------------------------------------
    // ACTUALIZAR DOTS
    // --------------------------------------------------------

    function updateDots() {

        const slideWidth =
            track.clientWidth;


        if (!slideWidth) {
            return;
        }


        currentSlide =
            Math.round(
                track.scrollLeft /
                slideWidth
            );


        dots.forEach(
            (dot, index) => {

                dot.classList.toggle(
                    "active",
                    index === currentSlide
                );

            }
        );
    }


    // --------------------------------------------------------
    // IR PARA UM SLIDE
    // --------------------------------------------------------

    function goToSlide(index) {

        if (!slides.length) {
            return;
        }


        if (
            index >=
            slides.length
        ) {

            index = 0;
        }


        if (index < 0) {

            index =
                slides.length - 1;
        }


        currentSlide =
            index;


        track.scrollTo({

            left:
                track.clientWidth *
                currentSlide,

            behavior:
                "smooth"

        });


        updateDots();
    }


    // --------------------------------------------------------
    // SCROLL
    // --------------------------------------------------------

    track.addEventListener(
        "scroll",
        updateDots,
        {
            passive: true
        }
    );


    // --------------------------------------------------------
    // DOTS
    // --------------------------------------------------------

    dots.forEach(
        (dot) => {

            dot.addEventListener(
                "click",
                () => {

                    const slide =
                        Number(
                            dot.dataset.slide
                        );


                    goToSlide(
                        slide
                    );

                }
            );

        }
    );


    // --------------------------------------------------------
    // MOVIMENTO AUTOMÁTICO
    // --------------------------------------------------------

    setInterval(
        () => {

            goToSlide(
                currentSlide + 1
            );

        },
        4000
    );


    // --------------------------------------------------------
    // MOUSE DRAG
    // --------------------------------------------------------

    let isDragging = false;

    let startX = 0;

    let startScroll = 0;


    track.addEventListener(
        "mousedown",
        (event) => {

            isDragging = true;

            startX =
                event.pageX;

            startScroll =
                track.scrollLeft;

            track.classList.add(
                "dragging"
            );

        }
    );


    track.addEventListener(
        "mousemove",
        (event) => {

            if (!isDragging) {
                return;
            }


            const distance =
                event.pageX -
                startX;


            track.scrollLeft =
                startScroll -
                distance;

        }
    );


    window.addEventListener(
        "mouseup",
        () => {

            if (!isDragging) {
                return;
            }


            isDragging = false;


            track.classList.remove(
                "dragging"
            );

        }
    );


    // --------------------------------------------------------
    // INICIALIZAR
    // --------------------------------------------------------

    updateDots();
}



// ============================================================
// INICIAR HOME
// ============================================================

loadHome();
