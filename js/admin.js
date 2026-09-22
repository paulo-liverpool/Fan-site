// ============================================================
// BARÇA REAL
// ADMINISTRATION
// ============================================================


// ============================================================
// ELEMENTOS
// ============================================================

const adminSections =
    document.querySelectorAll(".admin-section");

const adminNavItems =
    document.querySelectorAll(".admin-nav-item");


// ============================================================
// VERIFICAR ADMINISTRADOR
// ============================================================

async function verifyAdministrator() {

    // --------------------------------------------------------
    // UTILIZADOR AUTENTICADO
    // --------------------------------------------------------

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        window.location.href =
            "login.html";

        return null;
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
            id,
            display_name,
            username,
            role_id
        `)
        .eq("id", user.id)
        .single();


    if (
        profileError ||
        !profile ||
        !profile.role_id
    ) {

        window.location.href =
            "home.html";

        return null;
    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const {
        data: role,
        error: roleError
    } = await supabaseClient
        .from("roles")
        .select(`
            id,
            name
        `)
        .eq("id", profile.role_id)
        .single();


    if (
        roleError ||
        !role ||
        role.name !== "administrator"
    ) {

        window.location.href =
            "home.html";

        return null;
    }


    // --------------------------------------------------------
    // ADMINISTRADOR CONFIRMADO
    // --------------------------------------------------------

    const profileButton =
        document.getElementById(
            "admin-profile-button"
        );


    if (profileButton) {

        const initial =
            (
                profile.display_name ||
                profile.username ||
                user.email ||
                "A"
            )
            .charAt(0)
            .toUpperCase();


        profileButton.textContent =
            initial;
    }


    return {
        user,
        profile,
        role
    };
}



// ============================================================
// NAVEGAÇÃO
// ============================================================

function setupNavigation() {

    adminNavItems.forEach(
        (item) => {

            item.addEventListener(
                "click",
                () => {

                    const sectionName =
                        item.dataset.section;


                    if (!sectionName) {
                        return;
                    }


                    // --------------------------------------------
                    // NAVEGAÇÃO
                    // --------------------------------------------

                    adminNavItems.forEach(
                        (navItem) => {

                            navItem.classList.toggle(
                                "active",
                                navItem === item
                            );

                        }
                    );


                    // --------------------------------------------
                    // SECÇÃO
                    // --------------------------------------------

                    adminSections.forEach(
                        (section) => {

                            section.classList.toggle(
                                "active",
                                section.id ===
                                `section-${sectionName}`
                            );

                        }
                    );

                }
            );

        }
    );
}



// ============================================================
// TERMINAR SESSÃO
// ============================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "admin-logout"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";

        }
    );
}



// ============================================================
// BOTÕES TEMPORÁRIOS
// ============================================================

function setupTemporaryButtons() {

    const buttons = [

        "create-featured",

        "create-news",

        "create-match"

    ];


    buttons.forEach(
        (id) => {

            const button =
                document.getElementById(id);


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                () => {

                    alert(
                        "Esta função será configurada no próximo passo."
                    );

                }
            );

        }
    );
}



// ============================================================
// INICIAR ADMIN
// ============================================================

async function initAdmin() {

    const administrator =
        await verifyAdministrator();


    if (!administrator) {
        return;
    }


    setupNavigation();

    setupLogout();

    setupTemporaryButtons();
}



// ============================================================
// START
// ============================================================

initAdmin();

