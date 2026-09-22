// ============================================================
// BARÇA REAL — ADMINISTRAÇÃO
// DASHBOARD + BIBLIOTECA DE DESTAQUES
// ============================================================

let currentAdmin = null;


// ============================================================
// 1. VERIFICAR ADMINISTRADOR
// ============================================================

async function verifyAdministrator() {

    try {

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
            .select("id, display_name, username, role_id")
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

        currentAdmin = { user, profile, role };

        const profileButton =
            document.getElementById("admin-profile-button");

        if (profileButton) {

            const name =
                profile.display_name ||
                profile.username ||
                user.email ||
                "Administrador";

            profileButton.textContent =
                name.charAt(0).toUpperCase();

            profileButton.title = name;
        }

        return true;

    } catch (error) {

        console.error(
            "Erro ao verificar administrador:",
            error
        );

        window.location.href = "login.html";

        return false;
    }
}


// ============================================================
// 2. NAVEGAÇÃO
// ============================================================

function setupNavigation() {

    const navItems =
        document.querySelectorAll("[data-section]");

    const sections =
        document.querySelectorAll(".admin-section");

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            async () => {

                const target =
                    item.dataset.section;

                if (!target) return;

                navItems.forEach(nav =>
                    nav.classList.toggle(
                        "active",
                        nav === item
                    )
                );

                sections.forEach(section =>
                    section.classList.toggle(
                        "active",
                        section.id ===
                        `section-${target}`
                    )
                );

                closeMobileSidebar();

                if (target === "featured") {
                    await loadFeaturedLibrary();
                }

                if (target === "dashboard") {
                    await loadDashboardCounts();
                    await loadRecentActivity();
                }
            }
        );
    });
}


// ============================================================
// 3. SIDEBAR
// ============================================================

function setupSidebar() {

    const page =
        document.querySelector(".admin-page");

    const toggle =
        document.getElementById("sidebar-toggle");

    const close =
        document.getElementById("mobile-sidebar-close");

    const overlay =
        document.getElementById("sidebar-overlay");

    if (toggle && page) {

        toggle.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 768) {

                    page.classList.toggle(
                        "sidebar-open"
                    );

                } else {

                    page.classList.toggle(
                        "sidebar-collapsed"
                    );
                }
            }
        );
    }

    close?.addEventListener(
        "click",
        closeMobileSidebar
    );

    overlay?.addEventListener(
        "click",
        closeMobileSidebar
    );

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 768) {

                page?.classList.remove(
                    "sidebar-open"
                );
            }
        }
    );
}


function closeMobileSidebar() {

    document
        .querySelector(".admin-page")
        ?.classList.remove(
            "sidebar-open"
        );
}


// ============================================================
// 4. TERMINAR SESSÃO
// ============================================================

function setupLogout() {

    const button =
        document.getElementById("admin-logout");

    if (!button) return;

    button.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth.signOut();

            } finally {

                window.location.href =
                    "login.html";
            }
        }
    );
}


// ============================================================
// 5. DASHBOARD — CONTADORES
// ============================================================

async function loadDashboardCounts() {

    await Promise.all([
        loadFeaturedCount(),
        loadUserCount(),
        loadNewsCount(),
        loadMatchCount()
    ]);
}


// ============================================================
// DESTAQUES
// ============================================================

async function loadFeaturedCount() {

    const element =
        document.getElementById(
            "stat-featured"
        );

    if (!element) return;

    try {

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

        if (error) throw error;

        element.textContent =
            count ?? 0;

    } catch (error) {

        console.error(
            "Erro no contador de Destaques:",
            error
        );

        element.textContent =
            "—";
    }
}


// ============================================================
// UTILIZADORES
// ============================================================

async function loadUserCount() {

    const element =
        document.getElementById(
            "stat-users"
        );

    if (!element) return;

    try {

        const {
            count,
            error
        } = await supabaseClient
            .from("profiles")
            .select("id", {
                count: "exact",
                head: true
            });

        if (error) throw error;

        element.textContent =
            count ?? 0;

    } catch (error) {

        console.error(
            "Erro no contador de Utilizadores:",
            error
        );

        element.textContent =
            "—";
    }
}


// ============================================================
// NOTÍCIAS
// ============================================================

async function loadNewsCount() {

    const element =
        document.getElementById(
            "stat-news"
        );

    if (!element) return;

    try {

        const {
            count,
            error
        } = await supabaseClient
            .from("content")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("content_type", "news")
            .in(
                "area",
                [
                    "news",
                    "both"
                ]
            );

        if (error) throw error;

        element.textContent =
            count ?? 0;

    } catch (error) {

        console.warn(
            "Contador de Notícias:",
            error
        );

        element.textContent =
            "0";
    }
}


// ============================================================
// JOGOS
// ============================================================

async function loadMatchCount() {

    const element =
        document.getElementById(
            "stat-matches"
        );

    if (!element) return;

    element.textContent =
        "0";
}


// ============================================================
// 6. DASHBOARD — ACTIVIDADE
// ============================================================

async function loadRecentActivity() {

    const list =
        document.getElementById(
            "dashboard-activity"
        );

    if (!list) return;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("content")
            .select(
                "id,title,area,status,created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(6);

        if (error) throw error;

        if (!data?.length) {

            list.innerHTML =
                "Ainda não existem atividades.";

            return;
        }

        list.innerHTML =
            data
                .map(
                    item => `
                        <div class="activity-item">

                            <div class="activity-icon">
                                ★
                            </div>

                            <div class="activity-content">

                                <div class="activity-title">
                                    ${escapeHTML(
                                        getActivityLabel(
                                            item
                                        )
                                    )}
                                </div>

                                <div class="activity-meta">
                                    ${escapeHTML(
                                        item.title ||
                                        "Sem título"
                                    )}
                                    ·
                                    ${escapeHTML(
                                        formatDate(
                                            item.created_at
                                        )
                                    )}
                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");

    } catch (error) {

        console.warn(
            "Erro na actividade recente:",
            error
        );

        list.innerHTML =
            "Não foi possível carregar a actividade recente.";
    }
}


function getActivityLabel(item) {

    if (item.area === "featured") {

        if (
            item.status ===
            "published"
        ) {
            return "Destaque publicado";
        }

        if (
            item.status ===
            "draft"
        ) {
            return "Destaque criado";
        }

        if (
            item.status ===
            "archived"
        ) {
            return "Destaque arquivado";
        }

        return "Destaque actualizado";
    }

    if (
        item.area === "news" ||
        item.area === "both"
    ) {

        return item.status ===
            "published"

            ? "Notícia publicada"

            : "Notícia criada";
    }

    return "Conteúdo criado";
}


function setupDashboardRetry() {

    document
        .getElementById(
            "dashboard-retry"
        )
        ?.addEventListener(
            "click",
            async () => {

                await loadDashboardCounts();
                await loadRecentActivity();
            }
        );
}


// ============================================================
// 7. BIBLIOTECA DE DESTAQUES
// ============================================================

async function loadFeaturedLibrary() {

    const list =
        document.getElementById(
            "featured-list"
        );

    if (!list) return;

    list.innerHTML = `
        <div class="featured-library-loading">
            A carregar a biblioteca de destaques...
        </div>
    `;

    try {

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
                sort_order,
                created_at,
                updated_at
            `)
            .eq(
                "area",
                "featured"
            )
            .order(
                "sort_order",
                {
                    ascending: true,
                    nullsFirst: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) throw error;

        const items =
            data || [];

        await renderFeaturedLibrary(
            items
        );

    } catch (error) {

        console.error(
            "Erro ao carregar Destaques:",
            error
        );

        list.innerHTML = `
            <div class="featured-library-error">
                <strong>
                    Não foi possível carregar os destaques.
                </strong>

                <span>
                    ${escapeHTML(
                        error.message ||
                        "Erro desconhecido."
                    )}
                </span>
            </div>
        `;
    }
}


async function renderFeaturedLibrary(
    items
) {

    const list =
        document.getElementById(
            "featured-list"
        );

    if (!list) return;

    const counts = {

        all:
            items.length,

        published:
            items.filter(
                item =>
                    item.status ===
                    "published"
            ).length,

        draft:
            items.filter(
                item =>
                    item.status ===
                    "draft"
            ).length,

        archived:
            items.filter(
                item =>
                    item.status ===
                    "archived"
            ).length
    };

    let teams = [];

    const {
        data: teamData,
        error: teamError
    } = await supabaseClient
        .from("teams")
        .select(
            "id,name,short_name"
        )
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (!teamError) {
        teams =
            teamData || [];
    }

    const teamMap =
        Object.fromEntries(
            teams.map(
                team => [
                    team.id,
                    team
                ]
            )
        );

    list.innerHTML = `

        <div class="featured-library-shell">

            <div class="featured-library-toolbar">

                <div class="featured-library-summary">

                    <strong>
                        ${counts.all}
                    </strong>

                    <span>
                        ${
                            counts.all === 1
                                ? "destaque"
                                : "destaques"
                        }
                    </span>

                </div>

                <label class="featured-filter-wrap">

                    <span>
                        Estado
                    </span>

                    <select
                        id="featured-status-filter"
                    >

                        <option value="all">
                            Todos (${counts.all})
                        </option>

                        <option value="published">
                            Publicados (${counts.published})
                        </option>

                        <option value="draft">
                            Rascunhos (${counts.draft})
                        </option>

                        <option value="archived">
                            Arquivados (${counts.archived})
                        </option>

                    </select>

                </label>

            </div>

            <div
                class="featured-library-results"
                id="featured-library-results"
            >
                ${renderFeaturedCards(
                    items,
                    teamMap
                )}
            </div>

        </div>
    `;

    document
        .getElementById(
            "featured-status-filter"
        )
        ?.addEventListener(
            "change",
            event => {

                const filter =
                    event.target.value;

                const filteredItems =
                    filter === "all"

                        ? items

                        : items.filter(
                            item =>
                                item.status ===
                                filter
                        );

                const results =
                    document.getElementById(
                        "featured-library-results"
                    );

                if (results) {

                    results.innerHTML =
                        renderFeaturedCards(
                            filteredItems,
                            teamMap
                        );
                }

                bindFeaturedActions();
            }
        );

    bindFeaturedActions();
}


function renderFeaturedCards(
    items,
    teamMap
) {

    if (!items.length) {

        return `
            <div class="featured-library-empty">

                <div class="featured-library-empty-icon">
                    ★
                </div>

                <strong>
                    Nenhum destaque nesta categoria.
                </strong>

                <span>
                    Cria um novo destaque ou altera o filtro.
                </span>

            </div>
        `;
    }

    return items
        .map(
            item => {

                const team =
                    item.team_id
                        ? teamMap[
                            item.team_id
                        ]
                        : null;

                const status =
                    normalizeStatus(
                        item.status
                    );

                const media =
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
                                class="featured-card-image"
                                loading="lazy"
                                onerror="this.style.display='none';"
                            >
                        `

                        : `
                            <div class="featured-card-placeholder">
                                ★
                            </div>
                        `;

                const teamLabel =
                    team?.short_name ||
                    team?.name ||
                    "Ambos os clubes";

                return `
                    <article
                        class="featured-library-card"
                        data-featured-id="${escapeAttribute(
                            item.id
                        )}"
                    >

                        <div class="featured-card-media">

                            ${media}

                            <span
                                class="featured-status-badge ${escapeAttribute(
                                    item.status ||
                                    "draft"
                                )}"
                            >
                                ${escapeHTML(
                                    status.label
                                )}
                            </span>

                            ${
                                item.audio_url
                                    ? `
                                        <span class="featured-audio-badge">
                                            ♪ Áudio
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="featured-card-content">

                            <div class="featured-card-topline">

                                <span>
                                    DESTAQUE
                                </span>

                                <span>
                                    ${escapeHTML(
                                        teamLabel
                                    )}
                                </span>

                            </div>

                            <h3>
                                ${escapeHTML(
                                    item.title ||
                                    "Sem título"
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    "Sem descrição."
                                )}
                            </p>

                            <div class="featured-card-meta">

                                <span>
                                    Criado
                                    ${escapeHTML(
                                        formatDate(
                                            item.created_at
                                        )
                                    )}
                                </span>

                                ${
                                    item.updated_at &&
                                    item.updated_at !==
                                    item.created_at

                                        ? `
                                            <span>
                                                Actualizado
                                                ${escapeHTML(
                                                    formatDate(
                                                        item.updated_at
                                                    )
                                                )}
                                            </span>
                                        `

                                        : ""
                                }

                            </div>

                            <div class="featured-card-actions">

                                <button
                                    type="button"
                                    class="featured-action-button secondary"
                                    data-featured-action="edit"
                                    data-featured-id="${escapeAttribute(
                                        item.id
                                    )}"
                                >
                                    Editar
                                </button>

                                ${getStatusAction(
                                    item
                                )}

                                <button
                                    type="button"
                                    class="featured-action-button danger"
                                    data-featured-action="delete"
                                    data-featured-id="${escapeAttribute(
                                        item.id
                                    )}"
                                >
                                    Eliminar
                                </button>

                            </div>

                            <div class="featured-card-secondary-actions">

                                ${getArchiveAction(
                                    item
                                )}

                            </div>

                        </div>

                    </article>
                `;
            }
        )
        .join("");
}


function getStatusAction(
    item
) {

    if (
        item.status ===
        "published"
    ) {

        return `
            <button
                type="button"
                class="featured-action-button"
                data-featured-action="unpublish"
                data-featured-id="${escapeAttribute(
                    item.id
                )}"
            >
                Despublicar
            </button>
        `;
    }

    if (
        item.status ===
        "archived"
    ) {

        return `
            <button
                type="button"
                class="featured-action-button"
                data-featured-action="restore"
                data-featured-id="${escapeAttribute(
                    item.id
                )}"
            >
                Restaurar
            </button>
        `;
    }

    return `
        <button
            type="button"
            class="featured-action-button primary"
            data-featured-action="publish"
            data-featured-id="${escapeAttribute(
                item.id
            )}"
        >
            Publicar
        </button>
    `;
}


function getArchiveAction(
    item
) {

    if (
        item.status ===
        "archived"
    ) {
        return "";
    }

    return `
        <button
            type="button"
            class="featured-text-action"
            data-featured-action="archive"
            data-featured-id="${escapeAttribute(
                item.id
            )}"
        >
            Arquivar
        </button>
    `;
}


function bindFeaturedActions() {

    document
        .querySelectorAll(
            "[data-featured-action]"
        )
        .forEach(
            button => {

                if (
                    button.dataset.bound ===
                    "true"
                ) {
                    return;
                }

                button.dataset.bound =
                    "true";

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.featuredId;

                        const action =
                            button.dataset.featuredAction;

                        if (
                            !id ||
                            !action
                        ) {
                            return;
                        }

                        if (
                            action ===
                            "edit"
                        ) {

                            await editFeatured(
                                id
                            );

                            return;
                        }

                        if (
                            action ===
                            "delete"
                        ) {

                            await deleteFeatured(
                                id
                            );

                            return;
                        }

                        if (
                            action ===
                            "publish"
                        ) {

                            await changeFeaturedStatus(
                                id,
                                "published"
                            );

                            return;
                        }

                        if (
                            action ===
                            "unpublish"
                        ) {

                            await changeFeaturedStatus(
                                id,
                                "draft"
                            );

                            return;
                        }

                        if (
                            action ===
                            "archive"
                        ) {

                            await changeFeaturedStatus(
                                id,
                                "archived"
                            );

                            return;
                        }

                        if (
                            action ===
                            "restore"
                        ) {

                            await changeFeaturedStatus(
                                id,
                                "draft"
                            );
                        }
                    }
                );
            }
        );
}


// ============================================================
// 8. ESTADOS DE DESTAQUE
// ============================================================

async function changeFeaturedStatus(
    id,
    status
) {

    const item =
        await getFeaturedById(
            id
        );

    if (!item) return;

    const messages = {

        published:
            "Publicar este destaque?",

        draft:
            item.status ===
            "published"

                ? "Despublicar este destaque?"

                : "Restaurar este destaque como rascunho?",

        archived:
            "Arquivar este destaque?"
    };

    if (
        !confirm(
            messages[status] ||
            "Alterar o estado deste destaque?"
        )
    ) {
        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("content")
            .update({
                status,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                id
            )
            .eq(
                "area",
                "featured"
            );

        if (error) throw error;

        await loadFeaturedLibrary();

        await loadDashboardCounts();

    } catch (error) {

        console.error(
            error
        );

        alert(
            error.message ||
            "Não foi possível alterar o estado."
        );
    }
}


// ============================================================
// 9. APAGAR DESTAQUE
// ============================================================

async function deleteFeatured(
    id
) {

    const item =
        await getFeaturedById(
            id
        );

    if (!item) return;

    const title =
        item.title ||
        "este destaque";

    if (
        !confirm(
            `Eliminar "${title}"? Esta ação não pode ser anulada.`
        )
    ) {
        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("content")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "area",
                "featured"
            );

        if (error) throw error;

        await loadFeaturedLibrary();

        await loadDashboardCounts();

    } catch (error) {

        console.error(
            error
        );

        alert(
            error.message ||
            "Não foi possível eliminar o destaque."
        );
    }
}


// ============================================================
// 10. OBTER DESTAQUE
// ============================================================

async function getFeaturedById(
    id
) {

    const {
        data,
        error
    } = await supabaseClient
        .from("content")
        .select(`
            id,
            title,
            description,
            team_id,
            image_url,
            audio_url,
            status,
            sort_order,
            created_at,
            updated_at
        `)
        .eq(
            "id",
            id
        )
        .eq(
            "area",
            "featured"
        )
        .single();

    if (
        error ||
        !data
    ) {

        console.error(
            error
        );

        return null;
    }

    return data;
}


// ============================================================
// 11. NOVO DESTAQUE
// ============================================================

function setupFeaturedCreation() {

    document
        .getElementById(
            "create-featured"
        )
        ?.addEventListener(
            "click",
            openFeaturedModal
        );
}


function openFeaturedModal() {

    closeModalById(
        "featured-modal"
    );

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "featured-modal";

    modal.className =
        "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal featured-modal">

            <div class="admin-modal-header">

                <div>

                    <span class="admin-modal-eyebrow">
                        NOVO DESTAQUE
                    </span>

                    <h2>
                        Criar destaque
                    </h2>

                    <p class="admin-modal-subtitle">
                        Carrega a imagem principal e,
                        opcionalmente, áudio,
                        título e descrição.
                    </p>

                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="close-featured-modal"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <form id="featured-form">

                <div class="admin-form-group">

                    <label>
                        Imagem
                        <span class="required-mark">*</span>
                    </label>

                    <label
                        class="media-upload"
                        for="featured-image"
                    >

                        <div class="media-upload-icon">
                            ↑
                        </div>

                        <div class="media-upload-text">

                            <strong>
                                Carregar imagem
                            </strong>

                            <span>
                                JPG, PNG ou WEBP
                            </span>

                        </div>

                        <input
                            id="featured-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                        >

                    </label>

                    <div
                        id="featured-image-preview"
                        class="media-preview"
                    ></div>

                </div>

                <div class="admin-form-group">

                    <label>
                        Áudio
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <label
                        class="media-upload media-upload-audio"
                        for="featured-audio"
                    >

                        <div class="media-upload-icon">
                            ♪
                        </div>

                        <div class="media-upload-text">

                            <strong>
                                Adicionar áudio
                            </strong>

                            <span>
                                MP3, M4A, WAV ou OGG
                            </span>

                        </div>

                        <input
                            id="featured-audio"
                            type="file"
                            accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/x-m4a"
                        >

                    </label>

                    <div
                        id="featured-audio-preview"
                        class="audio-preview"
                    ></div>

                </div>

                <div class="admin-form-group">

                    <label for="featured-title">
                        Título
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <input
                        id="featured-title"
                        type="text"
                        maxlength="150"
                        placeholder="Ex.: O próximo grande jogo aproxima-se"
                    >

                </div>

                <div class="admin-form-group">

                    <label for="featured-description">
                        Descrição
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <textarea
                        id="featured-description"
                        rows="4"
                        maxlength="500"
                        placeholder="Texto para acompanhar o destaque..."
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
                        id="submit-featured"
                    >
                        Criar destaque
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    document
        .getElementById(
            "close-featured-modal"
        )
        ?.addEventListener(
            "click",
            closeFeaturedModal
        );

    document
        .getElementById(
            "cancel-featured"
        )
        ?.addEventListener(
            "click",
            closeFeaturedModal
        );

    document
        .getElementById(
            "featured-form"
        )
        ?.addEventListener(
            "submit",
            createFeatured
        );

    document
        .getElementById(
            "featured-image"
        )
        ?.addEventListener(
            "change",
            previewFeaturedImage
        );

    document
        .getElementById(
            "featured-audio"
        )
        ?.addEventListener(
            "change",
            previewFeaturedAudio
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeFeaturedModal();
            }
        }
    );
}


function closeFeaturedModal() {

    closeModalById(
        "featured-modal"
    );
}


async function createFeatured(
    event
) {

    event.preventDefault();

    const imageFile =
        document
            .getElementById(
                "featured-image"
            )
            ?.files?.[0];

    const audioFile =
        document
            .getElementById(
                "featured-audio"
            )
            ?.files?.[0];

    const title =
        document
            .getElementById(
                "featured-title"
            )
            ?.value
            .trim() ||
        null;

    const description =
        document
            .getElementById(
                "featured-description"
            )
            ?.value
            .trim() ||
        null;

    const teamSlug =
        document
            .getElementById(
                "featured-team"
            )
            ?.value ||
        "";

    const status =
        document
            .getElementById(
                "featured-status"
            )
            ?.value ||
        "draft";

    const message =
        document.getElementById(
            "featured-form-message"
        );

    const submitButton =
        document.getElementById(
            "submit-featured"
        );

    if (!imageFile) {

        if (message) {

            message.textContent =
                "É necessário carregar uma imagem.";
        }

        return;
    }

    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "A guardar...";
    }

    try {

        let teamId = null;

        if (teamSlug) {

            const {
                data: team,
                error: teamError
            } = await supabaseClient
                .from("teams")
                .select("id")
                .eq(
                    "slug",
                    teamSlug
                )
                .single();

            if (
                teamError ||
                !team
            ) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId =
                team.id;
        }

        if (message) {

            message.textContent =
                "A carregar a imagem...";
        }

        const imageUrl =
            await uploadContentFile(
                imageFile,
                "images"
            );

        let audioUrl =
            null;

        if (audioFile) {

            if (message) {

                message.textContent =
                    "A carregar o áudio...";
            }

            audioUrl =
                await uploadContentFile(
                    audioFile,
                    "audio"
                );
        }

        if (message) {

            message.textContent =
                "A guardar o destaque...";
        }

        const {
            error
        } = await supabaseClient
            .from("content")
            .insert({

                title,

                description,

                content_type:
                    "news",

                area:
                    "featured",

                team_id:
                    teamId,

                image_url:
                    imageUrl,

                audio_url:
                    audioUrl,

                status,

                created_by:
                    currentAdmin
                        .user
                        .id
            });

        if (error) throw error;

        if (message) {

            message.textContent =
                "Destaque criado com sucesso.";
        }

        await loadFeaturedLibrary();

        await loadDashboardCounts();

        setTimeout(
            closeFeaturedModal,
            500
        );

    } catch (error) {

        console.error(
            error
        );

        if (message) {

            message.textContent =
                error.message ||
                "Não foi possível criar o destaque.";
        }

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Criar destaque";
        }
    }
}


// ============================================================
// 12. EDITAR DESTAQUE
// ============================================================

async function editFeatured(
    id
) {

    const item =
        await getFeaturedById(
            id
        );

    if (!item) return;

    closeModalById(
        "featured-edit-modal"
    );

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "featured-edit-modal";

    modal.className =
        "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal featured-modal">

            <div class="admin-modal-header">

                <div>

                    <span class="admin-modal-eyebrow">
                        EDITAR DESTAQUE
                    </span>

                    <h2>
                        Editar destaque
                    </h2>

                    <p class="admin-modal-subtitle">
                        Altera o conteúdo,
                        o clube, o estado
                        ou os ficheiros
                        deste destaque.
                    </p>

                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="close-featured-edit-modal"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <form id="featured-edit-form">

                <div class="featured-edit-current-media">

                    <div>

                        <span>
                            Imagem actual
                        </span>

                        ${
                            item.image_url

                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            item.image_url
                                        )}"
                                        alt="Imagem actual"
                                    >
                                `

                                : `
                                    <div class="featured-edit-no-media">
                                        Sem imagem
                                    </div>
                                `
                        }

                    </div>

                    <div>

                        <span>
                            Áudio actual
                        </span>

                        ${
                            item.audio_url

                                ? `
                                    <audio
                                        controls
                                        src="${escapeAttribute(
                                            item.audio_url
                                        )}"
                                    ></audio>
                                `

                                : `
                                    <div class="featured-edit-no-media">
                                        Sem áudio
                                    </div>
                                `
                        }

                    </div>

                </div>

                <div class="admin-form-group">

                    <label for="edit-featured-image">

                        Nova imagem
                        <span class="optional-mark">
                            Opcional
                        </span>

                    </label>

                    <label
                        class="media-upload"
                        for="edit-featured-image"
                    >

                        <div class="media-upload-icon">
                            ↑
                        </div>

                        <div class="media-upload-text">

                            <strong>
                                Substituir imagem
                            </strong>

                            <span>
                                JPG, PNG ou WEBP
                            </span>

                        </div>

                        <input
                            id="edit-featured-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                        >

                    </label>

                    <div
                        id="edit-featured-image-preview"
                        class="media-preview"
                    ></div>

                </div>

                <div class="admin-form-group">

                    <label for="edit-featured-audio">

                        Novo áudio
                        <span class="optional-mark">
                            Opcional
                        </span>

                    </label>

                    <label
                        class="media-upload media-upload-audio"
                        for="edit-featured-audio"
                    >

                        <div class="media-upload-icon">
                            ♪
                        </div>

                        <div class="media-upload-text">

                            <strong>
                                Substituir áudio
                            </strong>

                            <span>
                                MP3, M4A, WAV ou OGG
                            </span>

                        </div>

                        <input
                            id="edit-featured-audio"
                            type="file"
                            accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/x-m4a"
                        >

                    </label>

                    <div
                        id="edit-featured-audio-preview"
                        class="audio-preview"
                    ></div>

                    ${
                        item.audio_url

                            ? `
                                <label class="featured-remove-audio">

                                    <input
                                        id="edit-featured-remove-audio"
                                        type="checkbox"
                                    >

                                    Remover o áudio actual

                                </label>
                            `

                            : ""
                    }

                </div>

                <div class="admin-form-group">

                    <label for="edit-featured-title">
                        Título
                    </label>

                    <input
                        id="edit-featured-title"
                        type="text"
                        maxlength="150"
                        value="${escapeAttribute(
                            item.title ||
                            ""
                        )}"
                    >

                </div>

                <div class="admin-form-group">

                    <label for="edit-featured-description">
                        Descrição
                    </label>

                    <textarea
                        id="edit-featured-description"
                        rows="4"
                        maxlength="500"
                    >${escapeHTML(
                        item.description ||
                        ""
                    )}</textarea>

                </div>

                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="edit-featured-team">
                            Clube
                        </label>

                        <select
                            id="edit-featured-team"
                        >

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

                        <label for="edit-featured-status">
                            Estado
                        </label>

                        <select
                            id="edit-featured-status"
                        >

                            <option value="draft">
                                Rascunho
                            </option>

                            <option value="published">
                                Publicado
                            </option>

                            <option value="archived">
                                Arquivado
                            </option>

                        </select>

                    </div>

                </div>

                <div class="admin-form-group">

                    <label for="edit-featured-order">

                        Ordem
                        <span class="optional-mark">
                            Opcional
                        </span>

                    </label>

                    <input
                        id="edit-featured-order"
                        type="number"
                        min="0"
                        step="1"
                        value="${
                            Number.isFinite(
                                Number(
                                    item.sort_order
                                )
                            )
                                ? Number(
                                    item.sort_order
                                )
                                : 0
                        }"
                    >

                </div>

                <div
                    id="featured-edit-message"
                    class="admin-form-message"
                ></div>

                <div class="admin-modal-actions">

                    <button
                        type="button"
                        class="admin-button secondary"
                        id="cancel-featured-edit"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="admin-button primary"
                        id="save-featured-edit"
                    >
                        Guardar alterações
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    document
        .getElementById(
            "edit-featured-team"
        )
        .value =
        await getTeamSlugById(
            item.team_id
        );

    document
        .getElementById(
            "edit-featured-status"
        )
        .value =
        item.status ||
        "draft";

    document
        .getElementById(
            "close-featured-edit-modal"
        )
        ?.addEventListener(
            "click",
            closeFeaturedEditModal
        );

    document
        .getElementById(
            "cancel-featured-edit"
        )
        ?.addEventListener(
            "click",
            closeFeaturedEditModal
        );

    document
        .getElementById(
            "featured-edit-form"
        )
        ?.addEventListener(
            "submit",
            event =>
                saveFeaturedEdit(
                    event,
                    item
                )
        );

    document
        .getElementById(
            "edit-featured-image"
        )
        ?.addEventListener(
            "change",
            previewEditFeaturedImage
        );

    document
        .getElementById(
            "edit-featured-audio"
        )
        ?.addEventListener(
            "change",
            previewEditFeaturedAudio
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeFeaturedEditModal();
            }
        }
    );
}


async function getTeamSlugById(
    teamId
) {

    if (!teamId) return "";

    const {
        data,
        error
    } = await supabaseClient
        .from("teams")
        .select("slug")
        .eq(
            "id",
            teamId
        )
        .single();

    if (
        error ||
        !data
    ) {
        return "";
    }

    return data.slug ||
        "";
}


function closeFeaturedEditModal() {

    closeModalById(
        "featured-edit-modal"
    );
}


async function saveFeaturedEdit(
    event,
    item
) {

    event.preventDefault();

    const message =
        document.getElementById(
            "featured-edit-message"
        );

    const saveButton =
        document.getElementById(
            "save-featured-edit"
        );

    const imageFile =
        document
            .getElementById(
                "edit-featured-image"
            )
            ?.files?.[0] ||
        null;

    const audioFile =
        document
            .getElementById(
                "edit-featured-audio"
            )
            ?.files?.[0] ||
        null;

    const removeAudio =
        document
            .getElementById(
                "edit-featured-remove-audio"
            )
            ?.checked ||
        false;

    const title =
        document
            .getElementById(
                "edit-featured-title"
            )
            ?.value
            .trim() ||
        null;

    const description =
        document
            .getElementById(
                "edit-featured-description"
            )
            ?.value
            .trim() ||
        null;

    const teamSlug =
        document
            .getElementById(
                "edit-featured-team"
            )
            ?.value ||
        "";

    const status =
        document
            .getElementById(
                "edit-featured-status"
            )
            ?.value ||
        "draft";

    const orderValue =
        document
            .getElementById(
                "edit-featured-order"
            )
            ?.value;

    const sortOrder =
        orderValue === ""

            ? 0

            : Math.max(
                0,
                Number(
                    orderValue
                ) || 0
            );

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "A guardar...";
    }

    try {

        let teamId =
            null;

        if (teamSlug) {

            const {
                data: team,
                error: teamError
            } = await supabaseClient
                .from("teams")
                .select("id")
                .eq(
                    "slug",
                    teamSlug
                )
                .single();

            if (
                teamError ||
                !team
            ) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId =
                team.id;
        }

        let imageUrl =
            item.image_url ||
            null;

        let audioUrl =
            item.audio_url ||
            null;

        if (imageFile) {

            if (message) {

                message.textContent =
                    "A carregar a nova imagem...";
            }

            imageUrl =
                await uploadContentFile(
                    imageFile,
                    "images"
                );
        }

        if (audioFile) {

            if (message) {

                message.textContent =
                    "A carregar o novo áudio...";
            }

            audioUrl =
                await uploadContentFile(
                    audioFile,
                    "audio"
                );

        } else if (
            removeAudio
        ) {

            audioUrl =
                null;
        }

        if (message) {

            message.textContent =
                "A guardar as alterações...";
        }

        const {
            error
        } = await supabaseClient
            .from("content")
            .update({

                title,

                description,

                team_id:
                    teamId,

                image_url:
                    imageUrl,

                audio_url:
                    audioUrl,

                status,

                sort_order:
                    sortOrder,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                item.id
            )
            .eq(
                "area",
                "featured"
            );

        if (error) throw error;

        if (message) {

            message.textContent =
                "Destaque actualizado com sucesso.";
        }

        await loadFeaturedLibrary();

        await loadDashboardCounts();

        setTimeout(
            closeFeaturedEditModal,
            500
        );

    } catch (error) {

        console.error(
            error
        );

        if (message) {

            message.textContent =
                error.message ||
                "Não foi possível guardar as alterações.";
        }

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Guardar alterações";
        }
    }
}


// ============================================================
// 13. PREVIEWS
// ============================================================

function previewFeaturedImage(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "featured-image-preview"
        );

    if (!preview) return;

    preview.innerHTML =
        "";

    if (!file) return;

    const image =
        document.createElement(
            "img"
        );

    image.src =
        URL.createObjectURL(
            file
        );

    image.alt =
        "Pré-visualização";

    preview.appendChild(
        image
    );
}


function previewFeaturedAudio(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "featured-audio-preview"
        );

    if (!preview) return;

    preview.innerHTML =
        "";

    if (!file) return;

    const audio =
        document.createElement(
            "audio"
        );

    audio.controls =
        true;

    audio.src =
        URL.createObjectURL(
            file
        );

    preview.appendChild(
        audio
    );
}


function previewEditFeaturedImage(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "edit-featured-image-preview"
        );

    if (!preview) return;

    preview.innerHTML =
        "";

    if (!file) return;

    const image =
        document.createElement(
            "img"
        );

    image.src =
        URL.createObjectURL(
            file
        );

    image.alt =
        "Nova imagem";

    preview.appendChild(
        image
    );
}


function previewEditFeaturedAudio(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "edit-featured-audio-preview"
        );

    if (!preview) return;

    preview.innerHTML =
        "";

    if (!file) return;

    const audio =
        document.createElement(
            "audio"
        );

    audio.controls =
        true;

    audio.src =
        URL.createObjectURL(
            file
        );

    preview.appendChild(
        audio
    );
}


// ============================================================
// 14. STORAGE
// ============================================================

async function uploadContentFile(
    file,
    folder
) {

    if (!file) return null;

    const extension =
        file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
        "bin";

    const randomPart =
        typeof crypto?.randomUUID ===
        "function"

            ? crypto.randomUUID()

            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

    const filePath =
        `${folder}/${Date.now()}-${randomPart}.${extension}`;

    const {
        error
    } = await supabaseClient
        .storage
        .from("content-media")
        .upload(
            filePath,
            file,
            {
                cacheControl:
                    "3600",
                upsert:
                    false
            }
        );

    if (error) {

        console.error(
            "Storage upload error:",
            error
        );

        throw error;
    }

    const {
        data
    } = supabaseClient
        .storage
        .from("content-media")
        .getPublicUrl(
            filePath
        );

    return data.publicUrl;
}


// ============================================================
// 15. TECLADO / MODAIS
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }

        if (
            document.getElementById(
                "featured-edit-modal"
            )
        ) {

            closeFeaturedEditModal();

            return;
        }

        if (
            document.getElementById(
                "featured-modal"
            )
        ) {

            closeFeaturedModal();
        }
    }
);


function closeModalById(
    id
) {

    const modal =
        document.getElementById(
            id
        );

    if (modal) {

        modal.remove();
    }
}


// ============================================================
// 16. UTILITÁRIOS
// ============================================================

function normalizeStatus(
    status
) {

    const labels = {

        draft:
            "Rascunho",

        published:
            "Publicado",

        archived:
            "Arquivado"
    };

    return {

        value:
            status ||
            "draft",

        label:
            labels[status] ||
            "Rascunho"
    };
}


function formatDate(
    value
) {

    if (!value) return "—";

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "pt-PT",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


function escapeHTML(
    value
) {

    return String(
        value ??
        ""
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}


// ============================================================
// 17. INICIALIZAÇÃO
// ============================================================

async function initAdmin() {

    const authorized =
        await verifyAdministrator();

    if (!authorized) {
        return;
    }

    setupNavigation();

    setupSidebar();

    setupLogout();

    setupFeaturedCreation();

    setupDashboardRetry();

    await loadDashboardCounts();

    await loadRecentActivity();

    await loadFeaturedLibrary();
}


document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);
