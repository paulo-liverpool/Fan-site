// ============================================================
// BARÇA REAL — ADMINISTRAÇÃO
// DASHBOARD + DESTAQUES + NOTÍCIAS
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

        currentAdmin = {
            user,
            profile,
            role
        };

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

                if (target === "news") {
                    await loadNewsLibrary();
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
            .eq(
                "area",
                "featured"
            );

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
            .from("news")
            .select("id", {
                count: "exact",
                head: true
            });

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

    try {

        const {
            count,
            error
        } = await supabaseClient
            .from("football_matches")
            .select("id", {
                count: "exact",
                head: true
            });

        if (error) throw error;

        element.textContent =
            count ?? 0;

    } catch (error) {

        console.warn(
            "Contador de Jogos:",
            error
        );

        element.textContent =
            "0";
    }
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
            data: contentData,
            error: contentError
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

        if (contentError) throw contentError;

        const {
            data: newsData,
            error: newsError
        } = await supabaseClient
            .from("news")
            .select(
                "id,title,translated_title,status,created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(6);

        if (newsError) throw newsError;

        const activities = [

            ...(contentData || []).map(
                item => ({
                    ...item,
                    activity_type: "content"
                })
            ),

            ...(newsData || []).map(
                item => ({
                    ...item,
                    title:
                        item.translated_title ||
                        item.title,
                    area: "news",
                    activity_type: "news"
                })
            )

        ]
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )
            .slice(0, 6);

        if (!activities.length) {

            list.innerHTML =
                "Ainda não existem actividades.";

            return;
        }

        list.innerHTML =
            activities
                .map(
                    item => `
                        <div class="activity-item">

                            <div class="activity-icon">
                                ${item.area === "news" ? "N" : "★"}
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

        if (item.status === "published") {
            return "Destaque publicado";
        }

        if (item.status === "draft") {
            return "Destaque criado";
        }

        if (item.status === "archived") {
            return "Destaque arquivado";
        }

        return "Destaque actualizado";
    }

    if (item.area === "news") {

        if (item.status === "published") {
            return "Notícia publicada";
        }

        if (item.status === "unpublished") {
            return "Notícia despublicada";
        }

        return "Notícia criada";
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

        await renderFeaturedLibrary(
            data || []
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
                    item.status === "published"
            ).length,

        draft:
            items.filter(
                item =>
                    item.status === "draft"
            ).length,

        archived:
            items.filter(
                item =>
                    item.status === "archived"
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
        teams = teamData || [];
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
                        ? teamMap[item.team_id]
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

    if (item.status === "published") {

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

    if (item.status === "archived") {

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

    if (item.status === "archived") {
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

                        if (!id || !action) {
                            return;
                        }

                        if (action === "edit") {
                            await editFeatured(id);
                            return;
                        }

                        if (action === "delete") {
                            await deleteFeatured(id);
                            return;
                        }

                        if (action === "publish") {
                            await changeFeaturedStatus(
                                id,
                                "published"
                            );
                            return;
                        }

                        if (action === "unpublish") {
                            await changeFeaturedStatus(
                                id,
                                "draft"
                            );
                            return;
                        }

                        if (action === "archive") {
                            await changeFeaturedStatus(
                                id,
                                "archived"
                            );
                            return;
                        }

                        if (action === "restore") {
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
        await getFeaturedById(id);

    if (!item) return;

    const messages = {

        published:
            "Publicar este destaque?",

        draft:
            item.status === "published"
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

        console.error(error);

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
        await getFeaturedById(id);

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

        console.error(error);

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

    if (error || !data) {

        console.error(error);

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
        document.createElement("div");

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

    document.body.appendChild(modal);

    document
        .getElementById("close-featured-modal")
        ?.addEventListener(
            "click",
            closeFeaturedModal
        );

    document
        .getElementById("cancel-featured")
        ?.addEventListener(
            "click",
            closeFeaturedModal
        );

    document
        .getElementById("featured-form")
        ?.addEventListener(
            "submit",
            createFeatured
        );

    document
        .getElementById("featured-image")
        ?.addEventListener(
            "change",
            previewFeaturedImage
        );

    document
        .getElementById("featured-audio")
        ?.addEventListener(
            "change",
            previewFeaturedAudio
        );

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
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

        submitButton.disabled = true;
        submitButton.textContent = "A guardar...";
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

            if (teamError || !team) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId = team.id;
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

        let audioUrl = null;

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

        await loadFeaturedLibrary();
        await loadDashboardCounts();

        setTimeout(
            closeFeaturedModal,
            500
        );

    } catch (error) {

        console.error(error);

        if (message) {
            message.textContent =
                error.message ||
                "Não foi possível criar o destaque.";
        }

        if (submitButton) {
            submitButton.disabled = false;
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
        await getFeaturedById(id);

    if (!item) return;

    closeModalById(
        "featured-edit-modal"
    );

    const modal =
        document.createElement("div");

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
                            item.title || ""
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
                        item.description || ""
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
                                Number(item.sort_order)
                            )
                                ? Number(item.sort_order)
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

    document.body.appendChild(modal);

    document
        .getElementById(
            "edit-featured-team"
        ).value =
        await getTeamSlugById(
            item.team_id
        );

    document
        .getElementById(
            "edit-featured-status"
        ).value =
        item.status || "draft";

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

            if (event.target === modal) {
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

    if (error || !data) {
        return "";
    }

    return data.slug || "";
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
                Number(orderValue) || 0
            );

    if (saveButton) {

        saveButton.disabled = true;
        saveButton.textContent = "A guardar...";
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

            if (teamError || !team) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId = team.id;
        }

        let imageUrl =
            item.image_url || null;

        let audioUrl =
            item.audio_url || null;

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

        } else if (removeAudio) {

            audioUrl = null;
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

        await loadFeaturedLibrary();
        await loadDashboardCounts();

        setTimeout(
            closeFeaturedEditModal,
            500
        );

    } catch (error) {

        console.error(error);

        if (message) {
            message.textContent =
                error.message ||
                "Não foi possível guardar as alterações.";
        }

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                "Guardar alterações";
        }
    }
}


// ============================================================
// 13. NOTÍCIAS — BIBLIOTECA
// ============================================================

async function loadNewsLibrary() {

    const list =
        document.getElementById(
            "news-list"
        );

    if (!list) return;

    list.innerHTML = `
        <div class="news-library-loading">
            A carregar as notícias...
        </div>
    `;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("news")
            .select(`
                      id,
        team_id,
        title,
        description,
        image_url,
        article_url,
        source_name,
        source_url,
        author,
        published_at,
        imported_at,
        external_id,
        category,
        status,
        editorial_locked,
        is_featured,
        sort_order,
        created_at,
        article_body,
        translated_title,
        translated_description
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) throw error;

        await renderNewsLibrary(
            data || []
        );

    } catch (error) {

        console.error(
            "Erro ao carregar Notícias:",
            error
        );

        list.innerHTML = `
            <div class="news-library-error">

                <strong>
                    Não foi possível carregar as notícias.
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


// ============================================================
// 14. RENDER NEWS LIBRARY
// ============================================================

async function renderNewsLibrary(items) {

    const container = document.getElementById("news-list");

    if (!container) return;

    const total = items.length;
    const published = items.filter(item => item.status === "published").length;
    const pending = items.filter(item => item.status === "draft").length;
    const unpublished = items.filter(item => item.status === "unpublished").length;

    // Load teams directly here
    const { data: teams } = await supabase
        .from("teams")
        .select("id,name,short_name,slug");

    const teamMap = {};

    (teams || []).forEach(team => {
        teamMap[team.id] = team;
    });

    container.innerHTML = `
        <div class="news-library-shell">

            <div class="news-library-toolbar">

                <div class="news-library-toolbar-left">

                    <div class="news-library-stat">
                        <span>TODAS</span>
                        <strong>${total}</strong>
                    </div>

                    <div class="news-library-stat">
                        <span>PENDENTES</span>
                        <strong>${pending}</strong>
                    </div>

                    <div class="news-library-stat">
                        <span>PUBLICADAS</span>
                        <strong>${published}</strong>
                    </div>

                    <div class="news-library-stat">
                        <span>NÃO PUBLICADAS</span>
                        <strong>${unpublished}</strong>
                    </div>

                </div>

                <div class="news-library-toolbar-right">

                    <select id="news-status-filter" class="admin-select">
                        <option value="all">Todas</option>
                        <option value="draft">Pendentes</option>
                        <option value="published">Publicadas</option>
                        <option value="unpublished">Não publicadas</option>
                    </select>

                    <select id="news-team-filter" class="admin-select">
                        <option value="all">Todos os clubes</option>
                        <option value="barcelona">Barcelona</option>
                        <option value="real-madrid">Real Madrid</option>
                        <option value="both">Ambos</option>
                    </select>

                </div>

            </div>

            <div id="news-library-results" class="news-library-results">
                ${renderNewsCardsHTML(items, teamMap)}
            </div>

        </div>
    `;

    document
        .getElementById("news-status-filter")
        ?.addEventListener("change", () => {

            applyNewsLibraryFilters(items, teamMap);
        });

    document
        .getElementById("news-team-filter")
        ?.addEventListener("change", () => {

            applyNewsLibraryFilters(items, teamMap);
        });

    bindNewsActions();
    document
    .getElementById("news-empty-create")
    ?.addEventListener("click", openNewsCreateModal);
}


// ============================================================
// NEWS FILTERS
// ============================================================

function applyNewsLibraryFilters(items, teamMap) {

    const statusFilter =
        document.getElementById("news-status-filter")?.value || "all";

    const teamFilter =
        document.getElementById("news-team-filter")?.value || "all";

    let filtered = [...items];

    if (statusFilter !== "all") {

        filtered = filtered.filter(
            item => item.status === statusFilter
        );
    }

    if (teamFilter !== "all") {

        filtered = filtered.filter(item => {

            const team = teamMap[item.team_id];

            if (teamFilter === "both") {
                return !item.team_id;
            }

            return team?.slug === teamFilter;
        });
    }

    const results =
        document.getElementById("news-library-results");

    if (!results) return;

    results.innerHTML =
        renderNewsCardsHTML(filtered, teamMap);

    bindNewsActions();
    document
    .getElementById("news-empty-create")
    ?.addEventListener("click", openNewsCreateModal);
}


// ============================================================
// NEWS CARD HTML
// ============================================================

function renderNewsCardsHTML(items, teamMap = {}) {

    if (!items.length) {

        return `
            <div class="news-library-empty">

                <div class="news-library-empty-icon">
                    N
                </div>

                <h3>Nenhuma notícia encontrada</h3>

                <p>
                    Não existem notícias que correspondam aos filtros seleccionados.
                </p>

                <button
                    type="button"
                    class="admin-primary-button"
                    id="news-empty-create"
                >
                    + Criar Notícia
                </button>

            </div>
        `;
    }

    const lead = items[0];
    const secondary = items.slice(1);


    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    const renderImage = (item, large = false) => {

        const title =
            item.translated_title ||
            item.title ||
            "Notícia";

        const mediaClass = large
            ? "news-admin-lead-media"
            : "news-admin-small-media";

        if (!item.image_url) {

            return `
                <div class="${mediaClass} image-missing">

                    <div class="news-image-fallback">
                        <span>IMAGEM</span>
                        <strong>Indisponível</strong>
                    </div>

                </div>
            `;
        }

        return `
            <div class="${mediaClass}">

                <img
                    src="${escapeAttribute(item.image_url)}"
                    alt="${escapeAttribute(title)}"
                    class="news-admin-card-image"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                        this.parentElement.classList.add('image-missing');
                        this.parentElement.querySelector('.news-image-fallback').style.display='flex';
                    "
                >

                <div
                    class="news-image-fallback"
                    style="display:none;"
                >
                    <span>IMAGEM</span>
                    <strong>Indisponível</strong>
                </div>

                <div class="news-image-overlay"></div>

                <div class="news-card-status">
                    ${renderNewsStatusBadge(item)}
                </div>

            </div>
        `;
    };


    // --------------------------------------------------------
    // META
    // --------------------------------------------------------

    const renderMeta = item => {

        const team = teamMap[item.team_id];

        const teamName =
            team?.short_name ||
            team?.name ||
            (!item.team_id ? "BARÇA REAL" : "BR");

        return `
            <div class="news-card-meta">

                <span class="news-card-team">
                    ${escapeHTML(teamName)}
                </span>

                <span class="news-card-separator">•</span>

                <span>
                    ${escapeHTML(item.category || "news")}
                </span>

                <span class="news-card-separator">•</span>

                <span>
                    ${formatDate(
                        item.published_at ||
                        item.created_at ||
                        item.imported_at
                    )}
                </span>

            </div>
        `;
    };


    // --------------------------------------------------------
    // EDITORIAL BADGES
    // --------------------------------------------------------

    const renderEditorialInfo = item => {

        let html = "";

        if (item.editorial_locked) {

            html += `
                <span class="news-editorial-badge">
                    EDITORIAL
                </span>
            `;
        }

        if (item.source_name) {

            html += `
                <span class="news-source-badge">
                    ${escapeHTML(item.source_name)}
                </span>
            `;
        }

        return html
            ? `<div class="news-editorial-info">${html}</div>`
            : "";
    };


    // --------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------

    const renderActions = item => {

        const statusAction =
            getNewsStatusAction(item);

        return `
            <div class="news-card-actions">

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="preview"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Pré-visualizar
                </button>

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="edit"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="${statusAction.action}"
                    data-id="${escapeAttribute(item.id)}"
                >
                    ${statusAction.label}
                </button>

                <button
                    type="button"
                    class="admin-danger-button"
                    data-news-action="delete"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Eliminar
                </button>

            </div>
        `;
    };


    // --------------------------------------------------------
    // LEAD STORY
    // --------------------------------------------------------

    const leadTitle =
        lead.translated_title ||
        lead.title ||
        "Sem título";

    const leadDescription =
        lead.translated_description ||
        lead.description ||
        "";

    const leadHTML = `
        <article
            class="news-admin-lead-card"
            data-news-id="${escapeAttribute(lead.id)}"
        >

            ${renderImage(lead, true)}

            <div class="news-admin-lead-content">

                ${renderMeta(lead)}

                ${renderEditorialInfo(lead)}

                <h2>
                    ${escapeHTML(leadTitle)}
                </h2>

                ${
                    leadDescription
                        ? `
                            <p>
                                ${escapeHTML(leadDescription)}
                            </p>
                        `
                        : ""
                }

                ${renderActions(lead)}

            </div>

        </article>
    `;


    // --------------------------------------------------------
    // SECONDARY STORIES
    // --------------------------------------------------------

    const secondaryHTML = secondary
        .map(item => {

            const title =
                item.translated_title ||
                item.title ||
                "Sem título";

            const description =
                item.translated_description ||
                item.description ||
                "";

            return `
                <article
                    class="news-admin-small-card"
                    data-news-id="${escapeAttribute(item.id)}"
                >

                    ${renderImage(item, false)}

                    <div class="news-admin-small-content">

                        ${renderMeta(item)}

                        ${renderEditorialInfo(item)}

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        ${
                            description
                                ? `
                                    <p>
                                        ${escapeHTML(description)}
                                    </p>
                                `
                                : ""
                        }

                        ${renderActions(item)}

                    </div>

                </article>
            `;
        })
        .join("");


    return `

        <div class="news-admin-lead">
            ${leadHTML}
        </div>

        ${
            secondary.length
                ? `
                    <div class="news-admin-small-grid">
                        ${secondaryHTML}
                    </div>
                `
                : ""
        }

    `;
}


// ============================================================
// 15. NEWS TEAMS
// ============================================================

async function loadNewsTeams() {

    const { data, error } = await supabase
        .from("teams")
        .select("id,name,short_name,slug");

    if (error) {
        console.error("Erro ao carregar clubes das notícias:", error);
        return {};
    }

    const teamMap = {};

    (data || []).forEach(team => {
        teamMap[team.id] = team;
    });

    return teamMap;
}


// ============================================================
// 15A. NEWS CARDS — HOMEPAGE STYLE
// ============================================================

function renderNewsCards(items, teamMap = {}) {

    const container = document.getElementById("news-library-results");

    if (!container) return;

    if (!items.length) {

        container.innerHTML = `
            <div class="news-library-empty">
                <div class="news-library-empty-icon">N</div>
                <h3>Nenhuma notícia encontrada</h3>
                <p>
                    Não existem notícias que correspondam aos filtros seleccionados.
                </p>
                <button
                    type="button"
                    class="admin-primary-button"
                    id="news-empty-create"
                >
                    + Criar Notícia
                </button>
            </div>
        `;

        document
            .getElementById("news-empty-create")
            ?.addEventListener("click", openNewsCreateModal);

        return;
    }

    const lead = items[0];
    const secondary = items.slice(1);

    const renderImage = (item, large = false) => {

        const title =
            item.translated_title ||
            item.title ||
            "Notícia";

        if (!item.image_url) {

            return `
                <div class="${large
                    ? "news-admin-lead-media"
                    : "news-admin-small-media"
                } image-missing">

                    <div class="news-image-fallback">
                        <span>IMAGEM</span>
                        <strong>Indisponível</strong>
                    </div>

                </div>
            `;
        }

        return `
            <div class="${large
                ? "news-admin-lead-media"
                : "news-admin-small-media"
            }">

                <img
                    src="${escapeAttribute(item.image_url)}"
                    alt="${escapeAttribute(title)}"
                    class="news-admin-card-image"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                        this.parentElement.classList.add('image-missing');
                        this.parentElement.querySelector('.news-image-fallback').style.display='flex';
                    "
                >

                <div
                    class="news-image-fallback"
                    style="display:none;"
                >
                    <span>IMAGEM</span>
                    <strong>Indisponível</strong>
                </div>

                <div class="news-image-overlay"></div>

                <div class="news-card-status">
                    ${renderNewsStatusBadge(item)}
                </div>

            </div>
        `;
    };


    const renderMeta = item => {

        const team = teamMap[item.team_id];

        const teamName =
            team?.short_name ||
            team?.name ||
            (!item.team_id ? "BARÇA REAL" : "BR");

        const category =
            item.category ||
            "news";

        const date =
            item.published_at ||
            item.created_at ||
            item.imported_at;

        return `
            <div class="news-card-meta">

                <span class="news-card-team">
                    ${escapeHTML(teamName)}
                </span>

                <span class="news-card-separator">•</span>

                <span>
                    ${escapeHTML(category)}
                </span>

                <span class="news-card-separator">•</span>

                <span>
                    ${formatDate(date)}
                </span>

            </div>
        `;
    };


    const renderEditorialInfo = item => {

        const badges = [];

        if (item.editorial_locked) {

            badges.push(`
                <span class="news-editorial-badge">
                    EDITORIAL
                </span>
            `);
        }

        if (item.source_name) {

            badges.push(`
                <span class="news-source-badge">
                    ${escapeHTML(item.source_name)}
                </span>
            `);
        }

        return badges.length
            ? `<div class="news-editorial-info">${badges.join("")}</div>`
            : "";
    };


    const renderActions = item => {

        const statusAction =
            getNewsStatusAction(item);

        return `
            <div class="news-card-actions">

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="preview"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Pré-visualizar
                </button>

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="edit"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="admin-secondary-button"
                    data-news-action="${statusAction.action}"
                    data-id="${escapeAttribute(item.id)}"
                >
                    ${statusAction.label}
                </button>

                <button
                    type="button"
                    class="admin-danger-button"
                    data-news-action="delete"
                    data-id="${escapeAttribute(item.id)}"
                >
                    Eliminar
                </button>

            </div>
        `;
    };


    // --------------------------------------------------------
    // LEAD NEWS
    // --------------------------------------------------------

    const leadTitle =
        lead.translated_title ||
        lead.title ||
        "Sem título";

    const leadDescription =
        lead.translated_description ||
        lead.description ||
        "";

    const leadHTML = `
        <article
            class="news-admin-lead-card"
            data-news-id="${escapeAttribute(lead.id)}"
        >

            ${renderImage(lead, true)}

            <div class="news-admin-lead-content">

                ${renderMeta(lead)}

                ${renderEditorialInfo(lead)}

                <h2>
                    ${escapeHTML(leadTitle)}
                </h2>

                <p>
                    ${escapeHTML(leadDescription)}
                </p>

                ${renderActions(lead)}

            </div>

        </article>
    `;


    // --------------------------------------------------------
    // SMALL NEWS
    // --------------------------------------------------------

    const secondaryHTML = secondary
        .map(item => {

            const title =
                item.translated_title ||
                item.title ||
                "Sem título";

            const description =
                item.translated_description ||
                item.description ||
                "";

            return `
                <article
                    class="news-admin-small-card"
                    data-news-id="${escapeAttribute(item.id)}"
                >

                    ${renderImage(item, false)}

                    <div class="news-admin-small-content">

                        ${renderMeta(item)}

                        ${renderEditorialInfo(item)}

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <p>
                            ${escapeHTML(description)}
                        </p>

                        ${renderActions(item)}

                    </div>

                </article>
            `;
        })
        .join("");


    container.innerHTML = `

        <div class="news-admin-lead">
            ${leadHTML}
        </div>

        ${
            secondary.length
                ? `
                    <div class="news-admin-small-grid">
                        ${secondaryHTML}
                    </div>
                `
                : ""
        }

    `;

    bindNewsActions();
}


// ============================================================
// 15B. NEWS STATUS BADGE
// ============================================================

function renderNewsStatusBadge(item) {

    const status = normalizeNewsStatus(item.status);

    return `
        <span class="news-status-badge ${status.className}">
            ${escapeHTML(status.label)}
        </span>
    `;
}


// ============================================================
// 15C. NEWS PREVIEW
// ============================================================

async function previewNews(id) {

    const item = await getNewsById(id);

    if (!item) {

        alert("Não foi possível carregar esta notícia.");

        return;
    }

    closeModalById("news-preview-modal");

    const title =
        item.translated_title ||
        item.title ||
        "Sem título";

    const description =
        item.translated_description ||
        item.description ||
        "";

    const articleBody =
        String(item.article_body || "").trim();

    const sourceUrl =
        item.source_url ||
        item.article_url ||
        "";

    const validSourceUrl =
        /^https?:\/\//i.test(sourceUrl)
            ? sourceUrl
            : "";

    const bodyHTML = articleBody
        ? articleBody
            .split(/\n\s*\n/)
            .filter(paragraph => paragraph.trim())
            .map(paragraph => `
                <p>
                    ${escapeHTML(paragraph).replace(/\n/g, "<br>")}
                </p>
            `)
            .join("")
        : `
            <p class="news-preview-empty-body">
                Esta notícia ainda não possui conteúdo completo.
            </p>
        `;

    const imageHTML = item.image_url
        ? `
            <div class="news-preview-hero">

                <img
                    src="${escapeAttribute(item.image_url)}"
                    alt="${escapeAttribute(title)}"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                        this.parentElement.classList.add('image-missing');
                        this.parentElement.querySelector('.news-image-fallback').style.display='flex';
                    "
                >

                <div
                    class="news-image-fallback"
                    style="display:none;"
                >
                    <span>IMAGEM</span>
                    <strong>Indisponível</strong>
                </div>

            </div>
        `
        : `
            <div class="news-preview-hero image-missing">

                <div class="news-image-fallback">
                    <span>IMAGEM</span>
                    <strong>Indisponível</strong>
                </div>

            </div>
        `;

    const modal = document.createElement("div");

    modal.className = "admin-modal news-preview-modal";
    modal.id = "news-preview-modal";

    modal.innerHTML = `
        <div class="admin-modal-overlay"></div>

        <div class="admin-modal-content news-preview-modal-content">

            <div class="admin-modal-header">

                <div>
                    <div class="admin-eyebrow">
                        PRÉ-VISUALIZAÇÃO
                    </div>

                    <h2>
                        Como a notícia aparece no BR
                    </h2>
                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="news-preview-close"
                >
                    ×
                </button>

            </div>

            <div class="news-preview-page">

                ${imageHTML}

                <div class="news-preview-article">

                    <div class="news-preview-topline">

                        <span class="news-status-badge ${normalizeNewsStatus(item.status).className}">
                            ${escapeHTML(normalizeNewsStatus(item.status).label)}
                        </span>

                        ${
                            item.editorial_locked
                                ? `
                                    <span class="news-editorial-badge">
                                        EDITORIAL
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <div class="news-preview-meta">

                        <span>
                            ${escapeHTML(item.category || "news")}
                        </span>

                        <span>•</span>

                        <span>
                            ${formatDate(
                                item.published_at ||
                                item.created_at ||
                                item.imported_at
                            )}
                        </span>

                        ${
                            item.source_name
                                ? `
                                    <span>•</span>
                                    <span>
                                        ${escapeHTML(item.source_name)}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <h1>
                        ${escapeHTML(title)}
                    </h1>

                    ${
                        description
                            ? `
                                <div class="news-preview-description">
                                    ${escapeHTML(description)}
                                </div>
                            `
                            : ""
                    }

                    <div class="news-preview-body">
                        ${bodyHTML}
                    </div>

                </div>

            </div>

            <div class="news-preview-footer">

                <button
                    type="button"
                    class="admin-secondary-button"
                    id="news-preview-edit"
                >
                    Editar notícia
                </button>

                ${
                    validSourceUrl
                        ? `
                            <a
                                href="${escapeAttribute(validSourceUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="admin-secondary-button"
                            >
                                Abrir fonte
                            </a>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="admin-primary-button"
                    id="news-preview-done"
                >
                    Fechar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
        modal.remove();
    };

    document
        .getElementById("news-preview-close")
        ?.addEventListener("click", close);

    document
        .getElementById("news-preview-done")
        ?.addEventListener("click", close);

    modal
        .querySelector(".admin-modal-overlay")
        ?.addEventListener("click", close);

    document
        .getElementById("news-preview-edit")
        ?.addEventListener("click", () => {

            close();

            setTimeout(() => {
                editNews(id);
            }, 50);
        });
}
// ============================================================
// 16. NEWS STATUS
// ============================================================

function normalizeNewsStatus(
    status
) {

    const statuses = {

        draft: {
            label: "Pendente",
            className: "draft"
        },

        published: {
            label: "Publicado",
            className: "published"
        },

        unpublished: {
            label: "Não publicado",
            className: "unpublished"
        }
    };

    return (
        statuses[status] ||
        statuses.draft
    );
}


function getNewsStatusAction(
    item
) {

    if (item.status === "published") {

        return `
            <button
                type="button"
                class="news-action-button"
                data-news-action="unpublish"
                data-news-id="${escapeAttribute(
                    item.id
                )}"
            >
                Despublicar
            </button>
        `;
    }

    return `
        <button
            type="button"
            class="news-action-button primary"
            data-news-action="publish"
            data-news-id="${escapeAttribute(
                item.id
            )}"
        >
            Publicar
        </button>
    `;
}


function bindNewsActions() {

    document
        .querySelectorAll("[data-news-action]")
        .forEach(button => {

            if (button.dataset.bound === "true") {
                return;
            }

            button.dataset.bound = "true";

            button.addEventListener("click", async () => {

                const action = button.dataset.newsAction;
                const id = button.dataset.id;

                if (!id || !action) {
                    return;
                }

                button.disabled = true;

                try {

                    if (action === "preview") {
                        await previewNews(id);
                        return;
                    }

                    if (action === "edit") {
                        await editNews(id);
                        return;
                    }

                    if (action === "publish") {
                        await changeNewsStatus(id, "published");
                        return;
                    }

                    if (action === "unpublish") {
                        await changeNewsStatus(id, "unpublished");
                        return;
                    }

                    if (action === "delete") {
                        await deleteNews(id);
                        return;
                    }

                } finally {

                    button.disabled = false;
                }
            });
        });
}

// ============================================================
// 17. OBTER NOTÍCIA
// ============================================================

async function getNewsById(
    id
) {

    const {
        data,
        error
    } = await supabaseClient
        .from("news")
        .select(`
                   id,
        team_id,
        title,
        description,
        image_url,
        article_url,
        source_name,
        source_url,
        author,
        published_at,
        imported_at,
        external_id,
        category,
        status,
        editorial_locked,
        is_featured,
        sort_order,
        created_at,
        article_body,
        translated_title,
        translated_description
        `)
        .eq(
            "id",
            id
        )
        .single();

    if (error || !data) {

        console.error(
            "Erro ao obter notícia:",
            error
        );

        return null;
    }

    return data;
}


// ============================================================
// 18. ALTERAR ESTADO DA NOTÍCIA
// ============================================================

async function changeNewsStatus(
    id,
    status
) {

    const item =
        await getNewsById(id);

    if (!item) return;

    const title =
        item.translated_title ||
        item.title ||
        "esta notícia";

    const message =
        status === "published"
            ? `Publicar "${title}"?`
            : `Despublicar "${title}"?`;

    if (!confirm(message)) {
        return;
    }

    try {

        const updateData = {
            status
        };

        if (status === "published") {

            updateData.published_at =
                item.published_at ||
                new Date().toISOString();
        }

        const {
            error
        } = await supabaseClient
            .from("news")
            .update(updateData)
            .eq(
                "id",
                id
            );

        if (error) throw error;

        await loadNewsLibrary();
        await loadDashboardCounts();
        await loadRecentActivity();

    } catch (error) {

        console.error(
            "Erro ao alterar estado da notícia:",
            error
        );

        alert(
            error.message ||
            "Não foi possível alterar o estado da notícia."
        );
    }
}


// ============================================================
// 19. ELIMINAR NOTÍCIA
// ============================================================

async function deleteNews(
    id
) {

    const item =
        await getNewsById(id);

    if (!item) return;

    const title =
        item.translated_title ||
        item.title ||
        "esta notícia";

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
            .from("news")
            .delete()
            .eq(
                "id",
                id
            );

        if (error) throw error;

        await loadNewsLibrary();
        await loadDashboardCounts();
        await loadRecentActivity();

    } catch (error) {

        console.error(
            "Erro ao eliminar notícia:",
            error
        );

        alert(
            error.message ||
            "Não foi possível eliminar a notícia."
        );
    }
}


// ============================================================
// 20. CRIAR NOTÍCIA
// ============================================================

function setupNewsCreation() {

    document
        .getElementById(
            "create-news"
        )
        ?.addEventListener(
            "click",
            openNewsCreateModal
        );
}


function openNewsCreateModal() {

    closeModalById(
        "news-create-modal"
    );

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "news-create-modal";

    modal.className =
        "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal news-modal">

            <div class="admin-modal-header">

                <div>

                    <span class="admin-modal-eyebrow">
                        NOVA NOTÍCIA
                    </span>

                    <h2>
                        Criar notícia
                    </h2>

                    <p class="admin-modal-subtitle">
                        Cria uma notícia original
                        directamente na plataforma.
                    </p>

                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="close-news-create-modal"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <form id="news-create-form">

                <div class="admin-form-group">

                    <label for="create-news-image">
                        Imagem
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <label
                        class="media-upload"
                        for="create-news-image"
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
                            id="create-news-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                        >

                    </label>

                    <div
                        id="create-news-image-preview"
                        class="media-preview"
                    ></div>

                </div>

                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="create-news-team">
                            Clube
                        </label>

                        <select id="create-news-team">

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

                        <label for="create-news-category">
                            Categoria
                        </label>

                        <select id="create-news-category">

                            <option value="news">
                                Notícias
                            </option>

                            <option value="transfer">
                                Transferências
                            </option>

                            <option value="match">
                                Jogos
                            </option>

                            <option value="club">
                                Clube
                            </option>

                            <option value="player">
                                Jogadores
                            </option>

                        </select>

                    </div>

                </div>

                <div class="admin-form-group">

                    <label for="create-news-title">
                        Título
                    </label>

                    <input
                        id="create-news-title"
                        type="text"
                        maxlength="200"
                        required
                        placeholder="Título da notícia"
                    >

                </div>

                <div class="admin-form-group">

                    <label for="create-news-description">
                        Descrição
                    </label>

                    <textarea
                        id="create-news-description"
                        rows="3"
                        maxlength="600"
                        placeholder="Resumo da notícia..."
                    ></textarea>

                </div>

                <div class="admin-form-group">

                    <label for="create-news-body">
                        Artigo
                    </label>

                    <textarea
                        id="create-news-body"
                        rows="10"
                        placeholder="Escreve aqui o conteúdo completo..."
                    ></textarea>

                </div>

                <div class="admin-form-group">

                    <label for="create-news-source">
                        Fonte
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <input
                        id="create-news-source"
                        type="text"
                        maxlength="150"
                        placeholder="Ex.: Barça Real"
                    >

                </div>

                <div class="admin-form-group">

                    <label for="create-news-source-url">
                        URL da fonte
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <input
                        id="create-news-source-url"
                        type="url"
                        placeholder="https://..."
                    >

                </div>

                <div class="admin-form-group">

                    <label for="create-news-status">
                        Estado
                    </label>

                    <select id="create-news-status">

                        <option value="draft">
                            Rascunho
                        </option>

                        <option value="published">
                            Publicado
                        </option>

                    </select>

                </div>

                <div
                    id="create-news-message"
                    class="admin-form-message"
                ></div>

                <div class="admin-modal-actions">

                    <button
                        type="button"
                        class="admin-button secondary"
                        id="cancel-news-create"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="admin-button primary"
                        id="submit-news-create"
                    >
                        Criar notícia
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
            "close-news-create-modal"
        )
        ?.addEventListener(
            "click",
            closeNewsCreateModal
        );

    document
        .getElementById(
            "cancel-news-create"
        )
        ?.addEventListener(
            "click",
            closeNewsCreateModal
        );

    document
        .getElementById(
            "news-create-form"
        )
        ?.addEventListener(
            "submit",
            createNews
        );

    document
        .getElementById(
            "create-news-image"
        )
        ?.addEventListener(
            "change",
            previewCreateNewsImage
        );

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeNewsCreateModal();
            }
        }
    );
}


function closeNewsCreateModal() {

    closeModalById(
        "news-create-modal"
    );
}


// ============================================================
// 21. GUARDAR NOVA NOTÍCIA
// ============================================================

async function createNews(
    event
) {

    event.preventDefault();

    const title =
        document
            .getElementById(
                "create-news-title"
            )
            ?.value
            .trim();

    const description =
        document
            .getElementById(
                "create-news-description"
            )
            ?.value
            .trim() ||
        null;

    const articleBody =
        document
            .getElementById(
                "create-news-body"
            )
            ?.value
            .trim() ||
        null;

    const sourceName =
        document
            .getElementById(
                "create-news-source"
            )
            ?.value
            .trim() ||
        "Barça Real";

    const sourceUrl =
        document
            .getElementById(
                "create-news-source-url"
            )
            ?.value
            .trim() ||
        null;

    const category =
        document
            .getElementById(
                "create-news-category"
            )
            ?.value ||
        "news";

    const teamSlug =
        document
            .getElementById(
                "create-news-team"
            )
            ?.value ||
        "";

    const status =
        document
            .getElementById(
                "create-news-status"
            )
            ?.value ||
        "draft";

    const imageFile =
        document
            .getElementById(
                "create-news-image"
            )
            ?.files?.[0] ||
        null;

    const message =
        document.getElementById(
            "create-news-message"
        );

    const submit =
        document.getElementById(
            "submit-news-create"
        );

    if (!title) {

        if (message) {
            message.textContent =
                "O título é obrigatório.";
        }

        return;
    }

    if (submit) {

        submit.disabled = true;
        submit.textContent = "A guardar...";
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

            if (teamError || !team) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId = team.id;
        }

        let imageUrl = null;

        if (imageFile) {

            if (message) {
                message.textContent =
                    "A carregar a imagem...";
            }

            imageUrl =
                await uploadContentFile(
                    imageFile,
                    "images"
                );
        }

        if (message) {
            message.textContent =
                "A criar a notícia...";
        }

        const now =
            new Date().toISOString();

        const {
            error
        } = await supabaseClient
            .from("news")
            .insert({

                team_id:
                    teamId,

                title,

                translated_title:
                    title,

                description,

                translated_description:
                    description,

                article_body:
                    articleBody,

                image_url:
                    imageUrl,

                article_url:
                    sourceUrl ||
                    `br://${crypto.randomUUID()}`,

                source_name:
                    sourceName,

                source_url:
                    sourceUrl,

                author:
                    currentAdmin
                        ?.profile
                        ?.display_name ||
                    currentAdmin
                        ?.profile
                        ?.username ||
                    "Barça Real",

                published_at:
                    status === "published"
                        ? now
                        : null,

                imported_at:
                    now,

               category,
status,
editorial_locked: true,
is_featured: false,
sort_order: 0
            });

        if (error) throw error;

        await loadNewsLibrary();
        await loadDashboardCounts();
        await loadRecentActivity();

        setTimeout(
            closeNewsCreateModal,
            500
        );

    } catch (error) {

        console.error(
            "Erro ao criar notícia:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Não foi possível criar a notícia.";
        }

        if (submit) {
            submit.disabled = false;
            submit.textContent =
                "Criar notícia";
        }
    }
}


// ============================================================
// 22. EDITAR NOTÍCIA
// ============================================================

async function editNews(
    id
) {

    const item =
        await getNewsById(id);

    if (!item) return;

    closeModalById(
        "news-edit-modal"
    );

    const title =
        item.translated_title ||
        item.title ||
        "";

    const description =
        item.translated_description ||
        item.description ||
        "";

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "news-edit-modal";

    modal.className =
        "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal news-modal news-edit-modal">

            <div class="admin-modal-header">

                <div>

                    <span class="admin-modal-eyebrow">
                        EDITAR NOTÍCIA
                    </span>

                    <h2>
                        Editar notícia
                    </h2>

                    <p class="admin-modal-subtitle">
                        Revê e corrige o conteúdo
                        antes de o publicar.
                    </p>

                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="close-news-edit-modal"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <form id="news-edit-form">

                ${
                    item.image_url
                        ? `
                            <div class="news-edit-current-image">

                                <span>
                                    Imagem actual
                                </span>

                                <img
                                    src="${escapeAttribute(
                                        item.image_url
                                    )}"
                                    alt="${escapeAttribute(
                                        title
                                    )}"
                                >

                            </div>
                        `
                        : ""
                }

                <div class="admin-form-group">

                    <label for="edit-news-image">
                        Nova imagem
                        <span class="optional-mark">
                            Opcional
                        </span>
                    </label>

                    <label
                        class="media-upload"
                        for="edit-news-image"
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
                            id="edit-news-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                        >

                    </label>

                    <div
                        id="edit-news-image-preview"
                        class="media-preview"
                    ></div>

                </div>

                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="edit-news-team">
                            Clube
                        </label>

                        <select id="edit-news-team">

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

                        <label for="edit-news-category">
                            Categoria
                        </label>

                        <select id="edit-news-category">

                            <option value="news">
                                Notícias
                            </option>

                            <option value="transfer">
                                Transferências
                            </option>

                            <option value="match">
                                Jogos
                            </option>

                            <option value="club">
                                Clube
                            </option>

                            <option value="player">
                                Jogadores
                            </option>

                            <option value="opinion">
                                Opinião
                            </option>

                            <option value="analysis">
                                Análise
                            </option>

                        </select>

                    </div>

                </div>

                <div class="admin-form-group">

                    <label for="edit-news-title">
                        Título
                    </label>

                    <input
                        id="edit-news-title"
                        type="text"
                        maxlength="200"
                        value="${escapeAttribute(
                            title
                        )}"
                        required
                    >

                </div>

                <div class="admin-form-group">

                    <label for="edit-news-description">
                        Descrição
                    </label>

                    <textarea
                        id="edit-news-description"
                        rows="4"
                        maxlength="600"
                    >${escapeHTML(
                        description
                    )}</textarea>

                </div>

                <div class="admin-form-group">

                    <label for="edit-news-body">
                        Artigo
                    </label>

                    <textarea
                        id="edit-news-body"
                        rows="12"
                    >${escapeHTML(
                        item.article_body ||
                        ""
                    )}</textarea>

                </div>

                <div class="admin-form-group">

                    <label for="edit-news-source">
                        Fonte
                    </label>

                    <input
                        id="edit-news-source"
                        type="text"
                        maxlength="150"
                        value="${escapeAttribute(
                            item.source_name ||
                            ""
                        )}"
                    >

                </div>

                <div class="admin-form-group">

                    <label for="edit-news-source-url">
                        URL da fonte
                    </label>

                    <input
                        id="edit-news-source-url"
                        type="url"
                        value="${escapeAttribute(
                            item.source_url ||
                            item.article_url ||
                            ""
                        )}"
                    >

                </div>

                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="edit-news-status">
                            Estado
                        </label>

                        <select id="edit-news-status">

                            <option value="draft">
                                Pendente
                            </option>

                            <option value="published">
                                Publicado
                            </option>

                            <option value="unpublished">
                                Não publicado
                            </option>

                        </select>

                    </div>

                    <div class="admin-form-group">

                        <label for="edit-news-featured">
                            Destaque
                        </label>

                        <select id="edit-news-featured">

                            <option value="false">
                                Não
                            </option>

                            <option value="true">
                                Sim
                            </option>

                        </select>

                    </div>

                </div>

                <div
                    id="edit-news-message"
                    class="admin-form-message"
                ></div>

                <div class="admin-modal-actions">

                    <button
                        type="button"
                        class="admin-button secondary"
                        id="cancel-news-edit"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="admin-button primary"
                        id="save-news-edit"
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
            "edit-news-team"
        ).value =
        await getTeamSlugById(
            item.team_id
        );

    document
        .getElementById(
            "edit-news-category"
        ).value =
        item.category ||
        "news";

    document
        .getElementById(
            "edit-news-status"
        ).value =
        item.status ||
        "draft";

    document
        .getElementById(
            "edit-news-featured"
        ).value =
        item.is_featured
            ? "true"
            : "false";

    document
        .getElementById(
            "close-news-edit-modal"
        )
        ?.addEventListener(
            "click",
            closeNewsEditModal
        );

    document
        .getElementById(
            "cancel-news-edit"
        )
        ?.addEventListener(
            "click",
            closeNewsEditModal
        );

    document
        .getElementById(
            "news-edit-form"
        )
        ?.addEventListener(
            "submit",
            event =>
                saveNewsEdit(
                    event,
                    item
                )
        );

    document
        .getElementById(
            "edit-news-image"
        )
        ?.addEventListener(
            "change",
            previewEditNewsImage
        );

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeNewsEditModal();
            }
        }
    );
}


function closeNewsEditModal() {

    closeModalById(
        "news-edit-modal"
    );
}


// ============================================================
// 23. GUARDAR EDIÇÃO DA NOTÍCIA
// ============================================================

async function saveNewsEdit(
    event,
    item
) {

    event.preventDefault();

    const message =
        document.getElementById(
            "edit-news-message"
        );

    const saveButton =
        document.getElementById(
            "save-news-edit"
        );

    const title =
        document
            .getElementById(
                "edit-news-title"
            )
            ?.value
            .trim();

    const description =
        document
            .getElementById(
                "edit-news-description"
            )
            ?.value
            .trim() ||
        null;

    const articleBody =
        document
            .getElementById(
                "edit-news-body"
            )
            ?.value
            .trim() ||
        null;

    const sourceName =
        document
            .getElementById(
                "edit-news-source"
            )
            ?.value
            .trim() ||
        item.source_name ||
        "Barça Real";

    const sourceUrl =
        document
            .getElementById(
                "edit-news-source-url"
            )
            ?.value
            .trim() ||
        null;

    const category =
        document
            .getElementById(
                "edit-news-category"
            )
            ?.value ||
        "news";

    const teamSlug =
        document
            .getElementById(
                "edit-news-team"
            )
            ?.value ||
        "";

    const status =
        document
            .getElementById(
                "edit-news-status"
            )
            ?.value ||
        "draft";

    const isFeatured =
        document
            .getElementById(
                "edit-news-featured"
            )
            ?.value ===
        "true";

    const imageFile =
        document
            .getElementById(
                "edit-news-image"
            )
            ?.files?.[0] ||
        null;

    if (!title) {

        if (message) {
            message.textContent =
                "O título é obrigatório.";
        }

        return;
    }

    if (saveButton) {

        saveButton.disabled = true;
        saveButton.textContent =
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

            if (teamError || !team) {
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId = team.id;
        }

        let imageUrl =
            item.image_url ||
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

        if (message) {
            message.textContent =
                "A guardar as alterações...";
        }

       const updateData = {
    team_id: teamId,
    title,
    translated_title: title,
    description,
    translated_description: description,
    article_body: articleBody,
    image_url: imageUrl,
    source_name: sourceName,
    source_url: sourceUrl,
    article_url: item.article_url || sourceUrl || `br://${item.id}`,
    category,
    status,
    editorial_locked: true,
    is_featured: isFeatured
};

        if (
            status === "published" &&
            !item.published_at
        ) {

            updateData.published_at =
                new Date().toISOString();
        }

        const {
            error
        } = await supabaseClient
            .from("news")
            .update(updateData)
            .eq(
                "id",
                item.id
            );

        if (error) throw error;

        await loadNewsLibrary();
        await loadDashboardCounts();
        await loadRecentActivity();

        setTimeout(
            closeNewsEditModal,
            500
        );

    } catch (error) {

        console.error(
            "Erro ao guardar notícia:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Não foi possível guardar as alterações.";
        }

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                "Guardar alterações";
        }
    }
}


// ============================================================
// 24. PREVIEWS DE NOTÍCIAS
// ============================================================

function previewCreateNewsImage(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "create-news-image-preview"
        );

    if (!preview) return;

    preview.innerHTML = "";

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


function previewEditNewsImage(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "edit-news-image-preview"
        );

    if (!preview) return;

    preview.innerHTML = "";

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


// ============================================================
// 25. PREVIEWS DE DESTAQUES
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

    preview.innerHTML = "";

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

    preview.innerHTML = "";

    if (!file) return;

    const audio =
        document.createElement(
            "audio"
        );

    audio.controls = true;

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

    preview.innerHTML = "";

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

    preview.innerHTML = "";

    if (!file) return;

    const audio =
        document.createElement(
            "audio"
        );

    audio.controls = true;

    audio.src =
        URL.createObjectURL(
            file
        );

    preview.appendChild(
        audio
    );
}


// ============================================================
// 26. STORAGE
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
// 27. TECLADO / MODAIS
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

        const modalIds = [

            "news-edit-modal",

            "news-create-modal",

            "featured-edit-modal",

            "featured-modal"
        ];

        for (
            const id of modalIds
        ) {

            const modal =
                document.getElementById(
                    id
                );

            if (modal) {

                closeModalById(id);

                return;
            }
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
// 28. UTILITÁRIOS
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
        new Date(value);

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
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
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
// 29. INICIALIZAÇÃO
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

    setupNewsCreation();

    setupDashboardRetry();

    await loadDashboardCounts();

    await loadRecentActivity();

    await loadFeaturedLibrary();
}


document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);
