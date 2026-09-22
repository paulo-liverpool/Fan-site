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
                document.getElementById(
                    `section-${target}`
                );

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

    const logoutButton =
        document.querySelector("[data-action='logout']");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    });
}


// ============================================================
// 4. BOTÃO CRIAR DESTAQUE
// ============================================================

function setupFeaturedCreation() {

    const button =
        document.getElementById("create-featured");

    if (!button) return;

    button.addEventListener("click", openFeaturedModal);
}


// ============================================================
// 5. MODAL DE CRIAR DESTAQUE
// ============================================================

function openFeaturedModal() {

    const existing =
        document.getElementById("featured-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.id = "featured-modal";
    modal.className = "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal featured-modal">

            <div class="admin-modal-header">

                <div>
                    <span class="admin-modal-eyebrow">
                        NOVO DESTAQUE
                    </span>

                    <h2>Criar destaque</h2>

                    <p class="admin-modal-subtitle">
                        Publica uma imagem para a área de destaques.
                        Podes adicionar áudio, título ou descrição.
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


                <!-- ==================================================
                     IMAGEM
                     ================================================== -->

                <div class="admin-form-group">

                    <label>
                        Imagem
                        <span class="required-mark">*</span>
                    </label>

                    <label
                        class="media-upload"
                        for="featured-image"
                        id="featured-image-upload"
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


                <!-- ==================================================
                     ÁUDIO
                     ================================================== -->

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


                <!-- ==================================================
                     TÍTULO
                     ================================================== -->

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


                <!-- ==================================================
                     DESCRIÇÃO
                     ================================================== -->

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


                <!-- ==================================================
                     CLUBE + ESTADO
                     ================================================== -->

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


                <!-- ==================================================
                     MENSAGEM
                     ================================================== -->

                <div
                    id="featured-form-message"
                    class="admin-form-message"
                ></div>


                <!-- ==================================================
                     BOTÕES
                     ================================================== -->

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


    // Fechar
    document
        .getElementById("close-featured-modal")
        .addEventListener("click", closeFeaturedModal);

    document
        .getElementById("cancel-featured")
        .addEventListener("click", closeFeaturedModal);


    // Formulário
    document
        .getElementById("featured-form")
        .addEventListener("submit", createFeatured);


    // Preview da imagem
    document
        .getElementById("featured-image")
        .addEventListener("change", previewFeaturedImage);


    // Preview do áudio
    document
        .getElementById("featured-audio")
        .addEventListener("change", previewFeaturedAudio);


    // Fechar clicando fora
    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeFeaturedModal();
        }

    });
}


// ============================================================
// 6. PREVIEW DA IMAGEM
// ============================================================

function previewFeaturedImage(event) {

    const file = event.target.files[0];

    const preview =
        document.getElementById("featured-image-preview");

    if (!preview) return;

    preview.innerHTML = "";

    if (!file) return;

    const image =
        document.createElement("img");

    image.src =
        URL.createObjectURL(file);

    image.alt = "Pré-visualização";

    preview.appendChild(image);
}


// ============================================================
// 7. PREVIEW DO ÁUDIO
// ============================================================

function previewFeaturedAudio(event) {

    const file = event.target.files[0];

    const preview =
        document.getElementById("featured-audio-preview");

    if (!preview) return;

    preview.innerHTML = "";

    if (!file) return;

    const audio =
        document.createElement("audio");

    audio.controls = true;
    audio.src =
        URL.createObjectURL(file);

    preview.appendChild(audio);
}


// ============================================================
// 8. FECHAR MODAL
// ============================================================

function closeFeaturedModal() {

    const modal =
        document.getElementById("featured-modal");

    if (modal) {
        modal.remove();
    }
}


// ============================================================
// 9. UPLOAD DE FICHEIRO
// ============================================================

async function uploadContentFile(file, folder) {

    if (!file) return null;

    const extension =
        file.name.split(".").pop().toLowerCase();

    const safeName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const filePath =
        `${folder}/${safeName}`;


    const {
        error
    } = await supabaseClient.storage
        .from("content-media")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
        });

    if (error) {
        console.error("Storage upload error:", error);
        throw error;
    }


    const {
        data
    } = supabaseClient.storage
        .from("content-media")
        .getPublicUrl(filePath);

    return data.publicUrl;
}


// ============================================================
// 10. CRIAR DESTAQUE
// ============================================================

async function createFeatured(event) {

    event.preventDefault();


    const imageFile =
        document.getElementById("featured-image").files[0];

    const audioFile =
        document.getElementById("featured-audio").files[0];

    const title =
        document.getElementById("featured-title")
            .value
            .trim();

    const description =
        document.getElementById("featured-description")
            .value
            .trim();

    const teamSlug =
        document.getElementById("featured-team").value;

    const status =
        document.getElementById("featured-status").value;

    const message =
        document.getElementById("featured-form-message");

    const submitButton =
        document.getElementById("submit-featured");


    // ========================================================
    // VALIDAR IMAGEM
    // ========================================================

    if (!imageFile) {

        message.textContent =
            "É necessário carregar uma imagem.";

        return;
    }


    // ========================================================
    // BLOQUEAR BOTÃO
    // ========================================================

    submitButton.disabled = true;
    submitButton.textContent = "A publicar...";
    message.textContent = "A preparar os ficheiros...";


    try {

        // ======================================================
        // CLUBE
        // ======================================================

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
                throw new Error(
                    "Não foi possível encontrar o clube."
                );
            }

            teamId = team.id;
        }


        // ======================================================
        // UPLOAD IMAGEM
        // ======================================================

        message.textContent =
            "A carregar a imagem...";

        const imageUrl =
            await uploadContentFile(
                imageFile,
                "images"
            );


        // ======================================================
        // UPLOAD ÁUDIO
        // ======================================================

        let audioUrl = null;

        if (audioFile) {

            message.textContent =
                "A carregar o áudio...";

            audioUrl =
                await uploadContentFile(
                    audioFile,
                    "audio"
                );
        }


        // ======================================================
        // GUARDAR CONTEÚDO
        // ======================================================

        message.textContent =
            "A guardar o destaque...";


        const {
            error: contentError
        } = await supabaseClient
            .from("content")
            .insert({

                title:
                    title || null,

                description:
                    description || null,

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

                status:
                    status,

                created_by:
                    currentAdmin.user.id
            });


        if (contentError) {
            throw contentError;
        }


        // ======================================================
        // SUCESSO
        // ======================================================

        message.textContent =
            "Destaque criado com sucesso.";

        submitButton.textContent =
            "Publicado";


        setTimeout(() => {

            closeFeaturedModal();

            loadFeaturedCount();

        }, 800);


    } catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            "Não foi possível criar o destaque.";

        submitButton.disabled = false;
        submitButton.textContent =
            "Criar destaque";
    }
}


// ============================================================
// 11. TOTAL DE DESTAQUES
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

        console.error(error);

        stat.textContent = "—";

        return;
    }


    stat.textContent =
        count ?? 0;
}


// ============================================================
// 12. INICIALIZAÇÃO
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
// 13. INICIAR
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);
