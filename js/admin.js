// ============================================================
// BARÇA REAL
// ADMIN — DASHBOARD + DESTAQUES
// ============================================================

let currentAdmin = null;

// ============================================================
// 1. VERIFICAR ADMINISTRADOR
// ============================================================

async function verifyAdministrator() {

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        window.location.href = "login.html";
        return false;
    }

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

    if (profileError || !profile) {
        window.location.href = "login.html";
        return false;
    }

    const {
        data: role,
        error: roleError
    } = await supabaseClient
        .from("roles")
        .select("id, name")
        .eq("id", profile.role_id)
        .single();

    if (roleError || !role || role.name !== "administrator") {
        window.location.href = "home.html";
        return false;
    }

    currentAdmin = {
        user,
        profile,
        role
    };

    const profileButton = document.getElementById("admin-profile-button");

    if (profileButton) {
        const name =
            profile.display_name ||
            profile.username ||
            user.email ||
            "Administrador";

        profileButton.textContent = name.charAt(0).toUpperCase();
        profileButton.title = name;
    }

    return true;
}


// ============================================================
// 2. NAVEGAÇÃO
// ============================================================

function setupNavigation() {

    const navItems = document.querySelectorAll("[data-section]");
    const sections = document.querySelectorAll(".admin-section");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const target = item.dataset.section;

            navItems.forEach(nav => {
                nav.classList.remove("active");
            });

            item.classList.add("active");

            sections.forEach(section => {
                section.classList.remove("active");
            });

            const targetSection =
                document.getElementById(`section-${target}`);

            if (targetSection) {
                targetSection.classList.add("active");
            }
        });
    });
}


// ============================================================
// 3. TERMINAR SESSÃO
// ============================================================

function setupLogout() {

    const logoutButton = document.querySelector("[data-action='logout']");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    });
}


// ============================================================
// 4. MODAL DE CRIAR DESTAQUE
// ============================================================

function setupFeaturedCreation() {

    const button = document.getElementById("create-featured");

    if (!button) return;

    button.addEventListener("click", () => {

        openFeaturedModal();

    });
}


// ============================================================
// 5. CRIAR MODAL
// ============================================================

function openFeaturedModal() {

    const existingModal =
        document.getElementById("featured-modal");

    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");

    modal.id = "featured-modal";

    modal.className = "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal">

            <div class="admin-modal-header">

                <div>
                    <span class="admin-modal-eyebrow">
                        NOVO DESTAQUE
                    </span>

                    <h2>Criar destaque</h2>
                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="close-featured-modal"
                >
                    ×
                </button>

            </div>

            <form id="featured-form">

                <div class="admin-form-group">

                    <label for="featured-title">
                        Título
                    </label>

                    <input
                        id="featured-title"
                        type="text"
                        placeholder="Ex.: O próximo grande jogo aproxima-se"
                        required
                    >

                </div>


                <div class="admin-form-group">

                    <label for="featured-description">
                        Descrição
                    </label>

                    <textarea
                        id="featured-description"
                        rows="4"
                        placeholder="Escreve uma breve descrição..."
                    ></textarea>

                </div>


                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="featured-team">
                            Clube
                        </label>

                        <select id="featured-team">

                            <option value="">
                                Ambos os clubes
                            </option>

                            <option value="barcelona">
                                FC Barcelona
                            </option>

                            <option value="real-madrid">
                                Real Madrid
                            </option>

                        </select>

                    </div>


                    <div class="admin-form-group">

                        <label for="featured-status">
                            Estado
                        </label>

                        <select id="featured-status">

                            <option value="draft">
                                Rascunho
                            </option>

                            <option value="published">
                                Publicado
                            </option>

                        </select>

                    </div>

                </div>


                <div
                    id="featured-form-message"
                    class="admin-form-message"
                ></div>


                <div class="admin-modal-actions">

                    <button
                        type="button"
                        class="admin-button secondary"
                        id="cancel-featured"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="admin-button primary"
                    >
                        Criar destaque
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("close-featured-modal")
        .addEventListener("click", closeFeaturedModal);

    document
        .getElementById("cancel-featured")
        .addEventListener("click", closeFeaturedModal);

    document
        .getElementById("featured-form")
        .addEventListener("submit", createFeatured);

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeFeaturedModal();
        }

    });
}


// ============================================================
// 6. FECHAR MODAL
// ============================================================

function closeFeaturedModal() {

    const modal =
        document.getElementById("featured-modal");

    if (modal) {
        modal.remove();
    }
}


// ============================================================
// 7. CRIAR DESTAQUE NA BASE DE DADOS
// ============================================================

async function createFeatured(event) {

    event.preventDefault();

    const title =
        document.getElementById("featured-title").value.trim();

    const description =
        document.getElementById("featured-description").value.trim();

    const teamSlug =
        document.getElementById("featured-team").value;

    const status =
        document.getElementById("featured-status").value;

    const message =
        document.getElementById("featured-form-message");

    if (!title) {
        message.textContent = "Introduz um título.";
        return;
    }

    message.textContent = "A criar destaque...";


    // --------------------------------------------------------
    // Obter ID do clube, se tiver sido escolhido
    // --------------------------------------------------------

    let teamId = null;

    if (teamSlug) {

        const {
            data: team,
            error: teamError
        } = await supabaseClient
            .from("teams")
            .select("id")
            .eq("slug", teamSlug)
            .single();

        if (teamError || !team) {
            message.textContent =
                "Não foi possível encontrar o clube selecionado.";
            return;
        }

        teamId = team.id;
    }


    // --------------------------------------------------------
    // Inserir destaque
    // --------------------------------------------------------

    const {
        error
    } = await supabaseClient
        .from("content")
        .insert({
            title,
            description: description || null,
            content_type: "news",
            area: "featured",
            team_id: teamId,
            status,
            created_by: currentAdmin.user.id
        });


    if (error) {

        console.error(error);

        message.textContent =
            "Não foi possível criar o destaque.";

        return;
    }


    message.textContent =
        "Destaque criado com sucesso.";

    setTimeout(() => {

        closeFeaturedModal();

        loadFeaturedCount();

    }, 700);
}


// ============================================================
// 8. CARREGAR TOTAL DE DESTAQUES
// ============================================================

async function loadFeaturedCount() {

    const stat =
        document.getElementById("stat-featured");

    if (!stat) return;

    const {
        count,
        error
    } = await supabaseClient
        .from("content")
        .select("id", {
            count: "exact",
            head: true
        })
        .eq("area", "featured");

    if (error) {
        stat.textContent = "—";
        return;
    }

    stat.textContent = count ?? 0;
}


// ============================================================
// 9. INICIALIZAÇÃO
// ============================================================

async function initAdmin() {

    const authorized =
        await verifyAdministrator();

    if (!authorized) return;

    setupNavigation();

    setupLogout();

    setupFeaturedCreation();

    await loadFeaturedCount();
}


// ============================================================
// 10. INICIAR
// ============================================================

document.addEventListener("DOMContentLoaded", initAdmin);
