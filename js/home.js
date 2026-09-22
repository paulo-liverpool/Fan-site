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
        team.short_name;


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
// INICIAR HOME
// ============================================================

loadHome();
