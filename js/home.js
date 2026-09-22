// ============================================================
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

        window.location.href =
            "login.html";

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

        window.location.href =
            "choose-team.html";

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

        window.location.href =
            "choose-team.html";

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


    // --------------------------------------------------------
    // ACTUALIZAR DOTS
    // --------------------------------------------------------

    function updateDots() {

        const slideWidth =
            track.clientWidth;

        if (!slideWidth) {
            return;
        }


        const currentSlide =
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


                    track.scrollTo({
                        left:
                            track.clientWidth *
                            slide,

                        behavior:
                            "smooth"
                    });

                }
            );

        }
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

setupFeaturedCarousel();

loadHome();
