/* ============================================================
   BARÇA REAL
   ADMINISTRATION
   ============================================================ */

:root {
    --admin-bg: #0b0d11;
    --admin-panel: #11141a;
    --admin-panel-2: #171b22;
    --admin-border: rgba(255,255,255,0.08);
    --admin-text: #f5f5f5;
    --admin-muted: #8e96a3;
    --admin-primary: #a50044;
    --admin-secondary: #004d98;
}


/* ============================================================
   BASE
   ============================================================ */

.admin-page {
    min-height: 100vh;

    background: var(--admin-bg);

    color: var(--admin-text);
}


/* ============================================================
   TOPBAR
   ============================================================ */

.admin-topbar {
    height: 72px;

    padding: 0 28px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    border-bottom:
        1px solid var(--admin-border);

    background: #0d1015;
}


.admin-brand {
    font-size: 20px;

    font-weight: 900;

    letter-spacing: -0.8px;
}


.admin-brand span {
    opacity: 0.55;
}


.admin-topbar-right {
    display: flex;

    align-items: center;

    gap: 16px;
}


.admin-label {
    font-size: 10px;

    font-weight: 800;

    letter-spacing: 1.5px;

    color: var(--admin-muted);
}


.admin-profile-button {
    width: 38px;
    height: 38px;

    border: 0;

    border-radius: 50%;

    background:
        linear-gradient(
            135deg,
            var(--admin-primary),
            var(--admin-secondary)
        );

    color: white;

    font-size: 13px;

    font-weight: 900;

    cursor: pointer;
}


/* ============================================================
   LAYOUT
   ============================================================ */

.admin-layout {
    min-height:
        calc(100vh - 72px);

    display: flex;
}


/* ============================================================
   SIDEBAR
   ============================================================ */

.admin-sidebar {
    width: 250px;

    flex-shrink: 0;

    padding: 28px 16px;

    display: flex;

    flex-direction: column;

    border-right:
        1px solid var(--admin-border);

    background: #0d1015;
}


.admin-sidebar-title {
    padding: 0 12px 14px;

    font-size: 9px;

    font-weight: 800;

    letter-spacing: 1.5px;

    color: var(--admin-muted);
}


.admin-navigation {
    display: flex;

    flex-direction: column;

    gap: 5px;
}


.admin-nav-item {
    width: 100%;

    padding: 12px;

    display: flex;

    align-items: center;

    gap: 12px;

    border: 0;

    border-radius: 10px;

    background: transparent;

    color: #9ca3af;

    font-size: 13px;

    font-weight: 600;

    text-align: left;

    cursor: pointer;

    transition:
        background 0.2s ease,
        color 0.2s ease;
}


.admin-nav-item:hover {
    background:
        rgba(255,255,255,0.04);

    color: white;
}


.admin-nav-item.active {
    background:
        linear-gradient(
            90deg,
            rgba(165,0,68,0.18),
            rgba(0,77,152,0.12)
        );

    color: white;
}


.admin-nav-icon {
    width: 20px;

    text-align: center;

    font-size: 15px;
}


.admin-logout {
    margin-top: auto;

    width: 100%;

    padding: 12px;

    display: flex;

    align-items: center;

    gap: 12px;

    border: 0;

    border-radius: 10px;

    background: transparent;

    color: #8e96a3;

    font-size: 13px;

    cursor: pointer;
}


.admin-logout:hover {
    background:
        rgba(255,255,255,0.04);

    color: white;
}


/* ============================================================
   MAIN CONTENT
   ============================================================ */

.admin-content {
    flex: 1;

    min-width: 0;

    padding: 38px;

    overflow-x: hidden;
}


.admin-section {
    display: none;

    max-width: 1200px;

    margin: 0 auto;
}


.admin-section.active {
    display: block;
}


/* ============================================================
   SECTION HEADER
   ============================================================ */

.admin-section-header {
    margin-bottom: 30px;

    display: flex;

    align-items: flex-end;

    justify-content: space-between;

    gap: 24px;
}


.admin-eyebrow {
    margin-bottom: 8px;

    font-size: 9px;

    font-weight: 800;

    letter-spacing: 1.6px;

    color: var(--admin-muted);
}


.admin-section-header h1 {
    margin: 0;

    font-size: 32px;

    line-height: 1;

    font-weight: 900;

    letter-spacing: -1.2px;
}


.admin-section-header p {
    margin-top: 10px;

    color: var(--admin-muted);

    font-size: 13px;

    line-height: 1.5;
}


/* ============================================================
   BUTTON
   ============================================================ */

.admin-primary-button {
    padding: 11px 16px;

    border: 0;

    border-radius: 9px;

    background:
        linear-gradient(
            135deg,
            var(--admin-primary),
            var(--admin-secondary)
        );

    color: white;

    font-size: 12px;

    font-weight: 800;

    cursor: pointer;

    white-space: nowrap;
}


.admin-primary-button:hover {
    opacity: 0.9;
}


/* ============================================================
   STATISTICS
   ============================================================ */

.admin-stat-grid {
    margin-bottom: 26px;

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 14px;
}


.admin-stat-card {
    padding: 20px;

    border:
        1px solid var(--admin-border);

    border-radius: 14px;

    background: var(--admin-panel);
}


.admin-stat-label {
    font-size: 9px;

    font-weight: 800;

    letter-spacing: 1.2px;

    color: var(--admin-muted);
}


.admin-stat-value {
    margin-top: 10px;

    font-size: 28px;

    font-weight: 900;
}


/* ============================================================
   PANELS
   ============================================================ */

.admin-panel {
    border:
        1px solid var(--admin-border);

    border-radius: 14px;

    background: var(--admin-panel);

    overflow: hidden;
}


.admin-panel-header {
    padding: 18px 20px;

    border-bottom:
        1px solid var(--admin-border);
}


.admin-panel-header h2 {
    margin: 0;

    font-size: 14px;

    font-weight: 800;
}


.admin-empty-state {
    padding: 45px 20px;

    text-align: center;

    color: var(--admin-muted);

    font-size: 13px;
}


/* ============================================================
   CONTENT LIST
   ============================================================ */

.admin-content-list {
    display: flex;

    flex-direction: column;

    gap: 10px;
}


.admin-content-list .admin-empty-state {
    border:
        1px solid var(--admin-border);

    border-radius: 14px;

    background: var(--admin-panel);
}


/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 900px) {

    .admin-sidebar {
        width: 210px;
    }


    .admin-content {
        padding: 28px;
    }


    .admin-stat-grid {
        grid-template-columns:
            repeat(2, 1fr);
    }

}


@media (max-width: 700px) {

    .admin-topbar {
        padding: 0 18px;
    }


    .admin-label {
        display: none;
    }


    .admin-layout {
        display: block;
    }


    .admin-sidebar {
        width: 100%;

        padding: 10px;

        border-right: 0;

        border-bottom:
            1px solid var(--admin-border);
    }


    .admin-sidebar-title,
    .admin-logout {
        display: none;
    }


    .admin-navigation {
        display: grid;

        grid-template-columns:
            repeat(4, 1fr);
    }


    .admin-nav-item {
        padding: 10px 5px;

        justify-content: center;

        flex-direction: column;

        gap: 4px;

        font-size: 9px;

        text-align: center;
    }


    .admin-nav-icon {
        font-size: 14px;
    }


    .admin-content {
        padding: 22px 16px 40px;
    }


    .admin-section-header {
        align-items: flex-start;

        flex-direction: column;
    }


    .admin-section-header h1 {
        font-size: 27px;
    }


    .admin-stat-grid {
        grid-template-columns:
            repeat(2, 1fr);
    }

}


@media (max-width: 400px) {

    .admin-stat-grid {
        grid-template-columns: 1fr;
    }

}
/* ============================================================
   MODAL — CONTEÚDO
   ============================================================ */

.admin-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(10px);
}

.admin-modal {
    width: 100%;
    max-width: 650px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 22px;
    background: var(--admin-panel);
    box-shadow: 0 30px 100px rgba(0,0,0,0.55);
}

.admin-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 30px 22px;
    border-bottom: 1px solid var(--admin-border);
}

.admin-modal-eyebrow {
    display: block;
    margin-bottom: 7px;
    color: var(--admin-secondary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.6px;
}

.admin-modal-header h2 {
    margin: 0;
    font-size: 25px;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.admin-modal-subtitle {
    margin: 8px 0 0;
    max-width: 500px;
    color: var(--admin-muted);
    font-size: 12px;
    line-height: 1.5;
}

.admin-modal-close {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border: 1px solid var(--admin-border);
    border-radius: 11px;
    background: transparent;
    color: var(--admin-muted);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: 0.2s ease;
}

.admin-modal-close:hover {
    border-color: rgba(255,255,255,0.2);
    background: var(--admin-panel-2);
    color: var(--admin-text);
}

#featured-form {
    padding: 26px 30px 30px;
}

.admin-form-group {
    margin-bottom: 22px;
}

.admin-form-group label {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 9px;
    color: var(--admin-text);
    font-size: 12px;
    font-weight: 700;
}

.required-mark {
    color: #e5484d;
}

.optional-mark {
    color: var(--admin-muted);
    font-size: 10px;
    font-weight: 500;
}

.admin-form-group input,
.admin-form-group textarea,
.admin-form-group select {
    width: 100%;
    box-sizing: border-box;
    padding: 13px 14px;
    border: 1px solid var(--admin-border);
    border-radius: 11px;
    outline: none;
    background: var(--admin-panel-2);
    color: var(--admin-text);
    font: inherit;
    font-size: 13px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-form-group input::placeholder,
.admin-form-group textarea::placeholder {
    color: #626a76;
}

.admin-form-group input:focus,
.admin-form-group textarea:focus,
.admin-form-group select:focus {
    border-color: var(--admin-secondary);
    box-shadow: 0 0 0 3px rgba(0,77,152,0.12);
}

.admin-form-group textarea {
    min-height: 100px;
    resize: vertical;
}

.admin-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}


/* ============================================================
   UPLOAD
   ============================================================ */

.media-upload {
    display: flex !important;
    align-items: center;
    gap: 14px;
    min-height: 76px;
    margin: 0 !important;
    padding: 14px 16px;
    border: 1px dashed rgba(255,255,255,0.18);
    border-radius: 13px;
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: 0.2s ease;
}

.media-upload:hover {
    border-color: var(--admin-secondary);
    background: rgba(0,77,152,0.06);
}

.media-upload input {
    display: none;
}

.media-upload-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 11px;
    background: rgba(255,255,255,0.06);
    color: var(--admin-text);
    font-size: 20px;
}

.media-upload-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.media-upload-text strong {
    color: var(--admin-text);
    font-size: 12px;
}

.media-upload-text span {
    color: var(--admin-muted);
    font-size: 10px;
}


/* ============================================================
   IMAGEM PREVIEW
   ============================================================ */

.media-preview {
    margin-top: 12px;
}

.media-preview img {
    display: block;
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border: 1px solid var(--admin-border);
    border-radius: 13px;
}


/* ============================================================
   ÁUDIO PREVIEW
   ============================================================ */

.audio-preview {
    margin-top: 12px;
}

.audio-preview audio {
    display: block;
    width: 100%;
}


/* ============================================================
   MENSAGEM
   ============================================================ */

.admin-form-message {
    min-height: 18px;
    margin: 4px 0 18px;
    color: var(--admin-muted);
    font-size: 11px;
}


/* ============================================================
   BOTÕES DO MODAL
   ============================================================ */

.admin-modal-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
}

.admin-modal-actions .admin-button {
    min-width: 140px;
    height: 42px;
    padding: 0 18px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s ease;
}

.admin-modal-actions .admin-button.secondary {
    border: 1px solid var(--admin-border);
    background: transparent;
    color: var(--admin-muted);
}

.admin-modal-actions .admin-button.secondary:hover {
    border-color: rgba(255,255,255,0.18);
    background: var(--admin-panel-2);
    color: var(--admin-text);
}

.admin-modal-actions .admin-button.primary {
    border: 1px solid transparent;
    background: linear-gradient(
        135deg,
        var(--admin-primary),
        var(--admin-secondary)
    );
    color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.22);
}

.admin-modal-actions .admin-button.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.3);
}

.admin-modal-actions .admin-button.primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
}


/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 600px) {

    .admin-modal-overlay {
        padding: 10px;
    }

    .admin-modal-header {
        padding: 22px 20px 18px;
    }

    #featured-form {
        padding: 22px 20px 24px;
    }

    .admin-form-row {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .admin-modal-actions {
        flex-direction: column-reverse;
    }

    .admin-modal-actions .admin-button {
        width: 100%;
    }
}
