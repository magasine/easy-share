javascript: (() => {
  const prepareTextForFactCheck = (text) => {
    if (!text) return "pesquisa";

    const h1Element = document.querySelector("h1");
    let finalQuery = text; // Padrão: usa o título completo

    // Se houver um <h1> no documento, e seu texto for de um tamanho razoável,
    // use-o como a consulta de busca. Isso é mais confiável do que o título da página.
    if (h1Element && h1Element.textContent.trim().length > 15) {
      finalQuery = h1Element.textContent;
    }

    // Aplica a limpeza final (remove caracteres especiais e espaços extras)
    // e limita a 70 caracteres para garantir que a consulta seja válida para os serviços.
    return finalQuery
      .replace(/[#%&*+=\\|<>{}ˆ$?!'":@]/g, "")
      .replace(/\s{2,}/g, " ")
      .substring(0, 70)
      .trim();
  };

  // CONFIGURAÇÕES GLOBAIS COMPLETAS
  const CONFIG = {
    APP_INFO: {
      name: "Easy Share",
      version: "v20251019",
      versionUrl:
        "https://drive.google.com/file/d/1i_xH-UD1kcPZWUVTfVKNz2W7FxcPd8sy/view?usp=sharing",
      credits: "@magasine",
      creditsUrl: "https://linktr.ee/magasine/shop",
    },
    HIGHLIGHT: {
      MAX_SELECTION_LENGTH: 10000,
      COLORS: {
        light: "rgba(255, 193, 7, 0.4)",
        dark: "rgba(255, 215, 0, 0.6)",
        success: "rgba(40, 167, 69, 0.6)",
      },
    },
    TEXTS: {
      SHOW_HIGHLIGHTS: "Show",
      HIDE_HIGHLIGHTS: "Hide",
      SORT_CREATION: "↓ Creation",
      SORT_ALPHABETICAL: "↑ A-Z",
      ADD_FACT_CHECK: "Add Fact-Check Links",
      FACT_CHECK_ENABLED: "Fact-check links added",
      FACT_CHECK_DISABLED: "Fact-check links removed",
      FEEDBACK: {
        HIGHLIGHT_CREATED: "Highlight created successfully!",
        HIGHLIGHT_FAILED:
          "Failed to create highlight. Try selecting different text.",
        TEXT_TOO_LONG: "Selected text is too long. Limit: {limit} characters.",
        TEXT_EMPTY: "Please select text to highlight.",
        CITATION_COPIED: "Citation copied to clipboard!",
        COPY_FAILED: "Failed to copy. Check browser permissions.",
        CLIPBOARD_UPDATING: "Updating clipboard content...",
        CLIPBOARD_PERMISSION_DENIED:
          "Permission denied to access clipboard. Check browser settings.",
        CONFIRM_CLEAR_HIGHLIGHTS:
          "Are you sure you want to remove all highlights? This cannot be undone.",
      },
    },
    CITATION: {
      FORMATS: [
        { value: "whatsapp", text: "WhatsApp Format" },
        { value: "academic", text: "Academic Citation" },
        { value: "html", text: "HTML" },
        { value: "markdown", text: "Markdown" },
        { value: "plain", text: "Plain Text" },
        { value: "twitter", text: "Twitter/X" },
      ],
      ACTION_FORMATS: [
        { value: "", text: "Select action..." },
        { value: "copy", text: "Copy" },
        { value: "whatsapp", text: "WhatsApp" },
        { value: "twitter", text: "Twitter/X" },
        { value: "email", text: "Email" },
        { value: "download", text: "Download" },
      ],
      READABILITY_SERVICES: [
        {
          name: "PrintFriendly",
          value: "printfriendly",
          url: (url) =>
            `https://www.printfriendly.com/print/?url=${encodeURIComponent(
              url
            )}`,
        },
        {
          name: "Archive.is",
          value: "archive",
          url: (url) => `https://archive.is/${encodeURIComponent(url)}`,
        },
      ],
      TEXT_OMITTED: "\n---\n",
    },
    SELECTORS: {
      CONTENT: [
        "article",
        '[role="main"]',
        ".main-content",
        "#content",
        ".content",
        "main",
      ],
    },
    // FACT_CHECK_SERVICES: [
    //   {
    //     name: "Google Fact Check",
    //     value: "google-fact-check",
    //     url: (text) => {
    //       const prepareText = (t) => {
    //         if (!t) return "";
    //         return t
    //           .substring(0, 70)
    //           .replace(/[#%&*+=\\|<>{}ˆ$?!'":@]/g, "")
    //           .replace(/\s{2,}/g, " ")
    //           .trim();
    //       };
    //       const query = prepareText(text) || "pesquisa";
    //       return `https://toolbox.google.com/factcheck/explorer/search/${encodeURIComponent(
    //         query
    //       )}?hl=pt`;
    //     },
    //   },
    //   {
    //     name: "Aos Fatos (Brasil)",
    //     value: "aos-fatos",
    //     url: (text) =>
    //       `https://www.aosfatos.org/noticias/?q=${encodeURIComponent(text)}`,
    //   },
    //   {
    //     name: "Lupa (Brasil)",
    //     value: "lupa",
    //     url: (text) =>
    //       `https://lupa.uol.com.br/busca/${encodeURIComponent(text)}`,
    //   },
    // ],
    FACT_CHECK_SERVICES: [
      {
        name: "Google Fact Check",
        value: "google-fact-check",
        url: () => {
          // Usa o título da página com os refinamentos
          const query = prepareTextForFactCheck(document.title);
          return `https://toolbox.google.com/factcheck/explorer/search/${encodeURIComponent(
            query
          )}?hl=pt`;
        },
      },
      {
        name: "Aos Fatos (Brasil)",
        value: "aos-fatos",
        url: () => {
          // Usa o título da página com os refinamentos
          const query = prepareTextForFactCheck(document.title);
          return `https://www.aosfatos.org/noticias/?q=${encodeURIComponent(
            query
          )}`;
        },
      },
      {
        name: "Lupa (Brasil)",
        value: "lupa",
        url: () => {
          // Usa o título da página com os refinamentos
          const query = prepareTextForFactCheck(document.title);
          return `https://lupa.uol.com.br/busca/${encodeURIComponent(query)}`;
        },
      },
    ],
    UI: {
      ANIMATION_DURATION: 200,
      FEEDBACK_DURATION: 1000,
      DEBOUNCE_DELAY: 300,
      MAX_WIDTH: 350,
    },
  };

  class UnifiedTool {
    constructor() {
      this._initializeInstance();
      this._initializeState();
      this._initializeApp();
    }

    // ======================
    // INICIALIZAÇÃO
    // ======================

    _initializeInstance() {
      if (window.unifiedCitationHighlighterInstance) {
        window.unifiedCitationHighlighterInstance.destroy();
      }
      window.unifiedCitationHighlighterInstance = this;
      this._bindMethods();
    }

    _bindMethods() {
      this._moveHighlightUp = this._moveHighlightUp.bind(this);
      this._moveHighlightDown = this._moveHighlightDown.bind(this);
      this._handleMouseUp = this._handleMouseUp.bind(this);
      this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
      this._handleThemeChange = this._handleThemeChange.bind(this);
      this._toggleMinimize = this._toggleMinimize.bind(this);
      this._handleClose = this._handleClose.bind(this);
      this._toggleSortOrder = this._toggleSortOrder.bind(this);
      this._debouncedSearch = this._debounce(
        this._handleSearch.bind(this),
        CONFIG.UI.DEBOUNCE_DELAY
      );

      // Novos métodos para sistema de marcações robusto
      this._restoreMissingHighlights =
        this._restoreMissingHighlights.bind(this);
      this._scheduleHighlightRestore =
        this._scheduleHighlightRestore.bind(this);
      this._serializeRange = this._serializeRange.bind(this);
      this._deserializeRange = this._deserializeRange.bind(this);
      this._getNodePath = this._getNodePath.bind(this);
      this._getNodeByPath = this._getNodeByPath.bind(this);
      this._findTextNodesForRange = this._findTextNodesForRange.bind(this);
      this._findAndHighlightText = this._findAndHighlightText.bind(this);
      this._getStableParentInfo = this._getStableParentInfo.bind(this);
      this._findTextStartIndex = this._findTextStartIndex.bind(this);
      this._copyHighlightText = this._copyHighlightText.bind(this);
      this._toggleHighlightSelection =
        this._toggleHighlightSelection.bind(this);
      this._scrollToHighlight = this._scrollToHighlight.bind(this);
      this._updateHighlightsSelectedButton =
        this._updateHighlightsSelectedButton.bind(this);
      this._updateHideToggleText = this._updateHideToggleText.bind(this);
      this._updateHighlightsCounter = this._updateHighlightsCounter.bind(this);
      this._updateHighlightsList = this._updateHighlightsList.bind(this);
      this._formatDate = this._formatDate.bind(this);
      this._escapeHtml = this._escapeHtml.bind(this);
      this._updateCitation = this._updateCitation.bind(this);
      this._formatContent = this._formatContent.bind(this);
      this._formatWhatsApp = this._formatWhatsApp.bind(this);
      this._formatAcademic = this._formatAcademic.bind(this);
      this._formatHTML = this._formatHTML.bind(this);
      this._formatMarkdown = this._formatMarkdown.bind(this);
      this._formatTwitter = this._formatTwitter.bind(this);
      this._formatPlain = this._formatPlain.bind(this);
      this._getActionContent = this._getActionContent.bind(this);
      this._copyContent = this._copyContent.bind(this);
      this._shareContent = this._shareContent.bind(this);
      this._sendEmail = this._sendEmail.bind(this);
      this._downloadContent = this._downloadContent.bind(this);
      this._setCitationMode = this._setCitationMode.bind(this);
      this._toggleReadability = this._toggleReadability.bind(this);
      this._toggleFactCheck = this._toggleFactCheck.bind(this);
      this._openReadability = this._openReadability.bind(this);
      this._openFactCheck = this._openFactCheck.bind(this);
      this._prepareFactCheckText = this._prepareFactCheckText.bind(this);
      this._switchTab = this._switchTab.bind(this);
      this._updateThemeToggleIcon = this._updateThemeToggleIcon.bind(this);
      this._showFeedback = this._showFeedback.bind(this);
    }

    _initializeState() {
      this.state = {
        activeTab: "citation",
        theme: this._detectSystemTheme(),
        isMinimized: false,
        highlights: new Map(),
        selectedHighlights: new Set(),
        citationMode: "highlights",
        readabilityEnabled: true,
        sortOrder: "creation",
        searchQuery: "",
        hiddenHighlights: false,
        clipboardContent: "",
        clipboardError: null,
        clipboardPermission: "prompt",
        position: { top: "20px", right: "20px", left: "auto" },
        previewContent: "",
        factCheckEnabled: true,
        factCheckService: "google-fact-check",
        highlightLock: false,
      };

      // Novo: Fila de restauração para highlights
      this.restoreQueue = new Map();

      // Cache de elementos DOM para melhor performance
      this.elements = {};
      this.isDestroyed = false;
    }

    _initializeApp() {
      this._setupDOM();
      this._setupEventListeners();
      this._setupObservers();
      this._loadSettings();
      this._loadHighlights();
      this._updateUI();
    }

    // ======================
    // CONFIGURAÇÃO DO DOM
    // ======================

    _setupDOM() {
      this._createHostElement();
      this._injectStyles();
      this._renderUI();
      this._cacheElements();
      this._applyTheme(this.state.theme);
    }

    _createHostElement() {
      this.host = document.createElement("div");
      this.host.id = "unified-tool-host";
      Object.assign(this.host.style, {
        position: "fixed",
        top: this.state.position.top,
        right: this.state.position.right,
        left: this.state.position.left,
        zIndex: "2147483647",
        transition: `all ${CONFIG.UI.ANIMATION_DURATION}ms ease-in-out`,
      });
      document.body.appendChild(this.host);

      // Force reflow para garantir que a transição funcione
      void this.host.offsetWidth;
      this.host.classList.add("visible");

      this.shadow = this.host.attachShadow({ mode: "open" });
    }

    _injectStyles() {
      const style = document.createElement("style");
      style.textContent = this._getStyles();
      this.shadow.appendChild(style);

      this.globalStyle = document.createElement("style");
      this.globalStyle.id = "unified-highlight-style";
      this.globalStyle.textContent = this._getHighlightStyles();
      document.head.appendChild(this.globalStyle);
    }

    _renderUI() {
      const container = document.createElement("div");
      container.className = "unified-container";
      container.innerHTML = this._getMainTemplate();
      this.shadow.appendChild(container);
      this._populateSelects();
    }

    _cacheElements() {
      const shadowRoot = this.shadow;
      this.elements = {
        container: shadowRoot.querySelector(".unified-container"),
        header: shadowRoot.getElementById("header"),
        tabHighlights: shadowRoot.getElementById("tab-highlights"),
        tabCitation: shadowRoot.getElementById("tab-citation"),
        highlightsTab: shadowRoot.getElementById("highlights-tab"),
        citationTab: shadowRoot.getElementById("citation-tab"),
        clearHighlights: shadowRoot.getElementById("clear-highlights"),
        hideToggle: shadowRoot.getElementById("hide-toggle"),
        searchInput: shadowRoot.getElementById("search-input"),
        clearSearch: shadowRoot.getElementById("clear-search"),
        sortToggle: shadowRoot.getElementById("sort-toggle"),
        highlightsList: shadowRoot.getElementById("highlights-list"),
        citationModes: shadowRoot.querySelectorAll("[data-mode]"),
        formatSelect: shadowRoot.getElementById("format-select"),
        readabilityCheck: shadowRoot.getElementById("readability-check"),
        readabilitySelect: shadowRoot.getElementById("readability-select"),
        actionSelect: shadowRoot.getElementById("action-select"),
        readabilityButton: shadowRoot.getElementById("readability-button"),
        citationPreview: shadowRoot.getElementById("citation-preview"),
        resetPreview: shadowRoot.getElementById("reset-preview"),
        minimizeButton: shadowRoot.getElementById("minimize-button"),
        closeButton: shadowRoot.getElementById("close-button"),
        refreshClipboard: shadowRoot.getElementById("refresh-clipboard"),
        themeToggle: shadowRoot.getElementById("theme-toggle"),
        moveUp: shadowRoot.getElementById("move-up"),
        moveDown: shadowRoot.getElementById("move-down"),
        factCheckCheck: shadowRoot.getElementById("fact-check-check"),
        factCheckSelect: shadowRoot.getElementById("fact-check-select"),
        factCheckButton: shadowRoot.getElementById("fact-check-button"),
      };
    }

    _populateSelects() {
      this._populateSelect("format-select", CONFIG.CITATION.FORMATS);
      this._populateSelect(
        "readability-select",
        CONFIG.CITATION.READABILITY_SERVICES
      );
      this._populateSelect("action-select", CONFIG.CITATION.ACTION_FORMATS);
      this._populateSelect("fact-check-select", CONFIG.FACT_CHECK_SERVICES);
    }

    _populateSelect(id, options) {
      const select = this.shadow.getElementById(id);
      if (!select) return;

      select.innerHTML = options
        .map(
          (option) =>
            `<option value="${option.value}">${
              option.text || option.name
            }</option>`
        )
        .join("");
    }

    // ======================
    // GERENCIAMENTO DE EVENTOS
    // ======================

    _setupEventListeners() {
      if (this.isDestroyed) return;

      // Novo: Listener para edições na textarea
      this.elements.citationPreview?.addEventListener("input", (e) => {
        this.state.previewContent = e.target.value;
      });

      // Novo: Listener para resetar preview
      this.elements.resetPreview?.addEventListener("click", () => {
        this.state.previewContent = ""; // Limpa edições manuais
        this._updateCitation(); // Regenera o preview original
        this._showFeedback("Preview reset to original content", "info");
      });

      // Eventos globais
      document.addEventListener("mouseup", this._handleMouseUp);
      window.addEventListener("beforeunload", this._handleBeforeUnload);

      // Navegação de abas
      this.elements.tabHighlights?.addEventListener("click", () =>
        this._switchTab("highlights")
      );
      this.elements.tabCitation?.addEventListener("click", () =>
        this._switchTab("citation")
      );

      // Controles de destaques
      this.elements.clearHighlights?.addEventListener("click", () =>
        this._clearHighlights()
      );
      this.elements.hideToggle?.addEventListener("click", () =>
        this._toggleHighlightsVisibility()
      );
      this.elements.searchInput?.addEventListener("input", (e) =>
        this._debouncedSearch(e.target.value)
      );
      this.elements.clearSearch?.addEventListener("click", () =>
        this._handleSearch("")
      );
      this.elements.sortToggle?.addEventListener(
        "click",
        this._toggleSortOrder
      );

      // Controles de citação
      this.elements.citationModes?.forEach((btn) => {
        btn.addEventListener("click", () =>
          this._setCitationMode(btn.dataset.mode)
        );
      });
      this.elements.formatSelect?.addEventListener("change", () =>
        this._updateCitation()
      );
      this.elements.readabilityCheck?.addEventListener("change", () =>
        this._toggleReadability()
      );
      this.elements.actionSelect?.addEventListener("change", (e) =>
        this._handleActionSelect(e)
      );
      this.elements.readabilityButton?.addEventListener("click", () =>
        this._openReadability()
      );

      // Controles da janela
      this.elements.minimizeButton?.addEventListener(
        "click",
        this._toggleMinimize
      );
      this.elements.closeButton?.addEventListener("click", this._handleClose);

      // Listener para o botão de highlight
      this.shadow
        .getElementById("highlight-action-btn")
        .addEventListener("click", () => {
          if (this.highlightLock) return;

          const selection = window.getSelection();

          if (selection.isCollapsed || !selection.toString().trim()) {
            this._showFeedback(CONFIG.TEXTS.FEEDBACK.TEXT_EMPTY, "warning");

            const btn = this.shadow.getElementById("highlight-action-btn");
            btn.classList.add("error-pulse");
            setTimeout(() => btn.classList.remove("error-pulse"), 1000);
            return;
          }

          this.highlightLock = true;
          this._createHighlight(selection.getRangeAt(0));

          setTimeout(() => {
            this.highlightLock = false;
          }, 1000);
        });

      // Função nomeada para o listener da tecla H
      const handleHighlightHotkey = (e) => {
        if ((e.key === "h" || e.key === "H") && !this.highlightLock) {
          const selection = window.getSelection();

          if (!selection.isCollapsed) {
            this.highlightLock = true;
            this._createHighlight(selection.getRangeAt(0));

            // Remova o listener após a criação do destaque
            document.removeEventListener("keydown", handleHighlightHotkey);

            // Temporizador para reativar o listener após um breve período de tempo, se necessário
            setTimeout(() => {
              this.highlightLock = false;
              // Adiciona o listener de volta
              document.addEventListener("keydown", handleHighlightHotkey);
            }, 2000);
          }
        }
      };

      // Adicione o listener de tecla 'H' para desktop, usando a função nomeada
      document.addEventListener("keydown", handleHighlightHotkey);

      // Toggle de tema
      this.elements.themeToggle?.addEventListener("click", () =>
        this._toggleTheme()
      );

      // Clipboard
      this.elements.refreshClipboard?.addEventListener("click", async () => {
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.CLIPBOARD_UPDATING, "info");
        await this._updateClipboardContent();
      });

      // Mover Highlights
      this.elements.moveUp?.addEventListener("click", () =>
        this._moveHighlightUp()
      );
      this.elements.moveDown?.addEventListener("click", () =>
        this._moveHighlightDown()
      );

      // Controles de fact-checking
      this.elements.factCheckCheck?.addEventListener("change", () =>
        this._toggleFactCheck()
      );
      this.elements.factCheckSelect?.addEventListener("change", () =>
        this._updateCitation()
      );
      this.elements.factCheckButton?.addEventListener("click", () =>
        this._openFactCheck()
      );
    }

    _setupObservers() {
      // Observer para mudanças no DOM (restaurar destaques perdidos) - MELHORADO
      this.observer = new MutationObserver((mutations) => {
        if (this.isDestroyed) return;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            this._restoreMissingHighlights();
          }
        });
      });

      this.observer.observe(document.body, { childList: true, subtree: true });

      // Observer para mudanças de tema do sistema
      this.themeObserver = window.matchMedia("(prefers-color-scheme: dark)");
      this.themeObserver.addEventListener("change", this._handleThemeChange);
    }

    // ======================
    // FUNCIONALIDADES PRINCIPAIS (MARCAÇÕES)
    // ======================

    _handleMouseUp(e) {
      if (this.isDestroyed) return;

      if (e.ctrlKey) {
        const selection = window.getSelection();
        if (!selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          this._createHighlight(range);
          selection.removeAllRanges();
        }
      }
    }

    _createHighlight(range) {
      const text = range.toString().trim();
      const btn = this.shadow.getElementById("highlight-action-btn");

      // Bloqueio inicial
      if (this.state.highlightLock) return;
      this.state.highlightLock = true;
      btn.disabled = true;
      btn.textContent = "⏳";

      const cleanup = () => {
        this.state.highlightLock = false;
        btn.disabled = false;
        btn.textContent = "⚡";
      };

      try {
        // Validações existentes
        if (!text) {
          this._showFeedback(CONFIG.TEXTS.FEEDBACK.TEXT_EMPTY, "warning");
          return cleanup();
        }

        if (text.length > CONFIG.HIGHLIGHT.MAX_SELECTION_LENGTH) {
          const message = CONFIG.TEXTS.FEEDBACK.TEXT_TOO_LONG.replace(
            "{limit}",
            CONFIG.HIGHLIGHT.MAX_SELECTION_LENGTH.toLocaleString()
          );
          this._showFeedback(message, "error");
          return cleanup();
        }

        // ▼ NOVA VALIDAÇÃO: Impede seleção de múltiplos parágrafos (CORRIGIDA) ▼
        const startParent = range.startContainer.parentNode;
        const endParent = range.endContainer.parentNode;

        // Função auxiliar: Encontra o parágrafo (ou elemento de bloco) ancestral
        function getParagraphAncestor(node) {
          return node.closest(
            'p, div[contenteditable], [data-block="paragraph"]'
          );
        }

        // Obtém o parágrafo de início e fim da seleção
        const startParagraph = getParagraphAncestor(startParent);
        const endParagraph = getParagraphAncestor(endParent);

        // Verifica se os parágrafos ancestrais são diferentes
        if (
          !startParagraph ||
          !endParagraph ||
          startParagraph !== endParagraph
        ) {
          this._showFeedback(
            "❌ Please select text within a single paragraph.",
            "error"
          );
          return cleanup();
        }
        // ▲ Fim da validação corrigida ▲

        const rangeData = this._serializeRange(range);
        if (!rangeData) {
          this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_FAILED, "error");
          return cleanup();
        }

        // Modificação crítica (mantida)
        const highlight = {
          id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          url: location.href,
          timestamp: Date.now(),
          visible: !this.state.hiddenHighlights,
          rangeData,
        };

        // Aplicação do destaque
        this.state.selectedHighlights.add(highlight);
        this._applyHighlight(range, highlight.id);
        this.state.highlights.set(highlight.id, highlight);

        // Atualizações adicionais (mantidas)
        this._updateHighlightVisualState(highlight.id);
        this._saveHighlights();
        this._updateUI();
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_CREATED, "success");
        if (this.state.activeTab === "citation") {
          this._switchTab("highlights");
        }
      } catch (error) {
        console.error("Failed to create highlight:", error);
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_FAILED, "error");
      } finally {
        cleanup();
      }
    }

    _applyHighlight(range, id) {
      const span = document.createElement("span");
      span.id = id;
      span.className = "unified-highlight";
      span.setAttribute("data-highlight-id", id);
      span.setAttribute("aria-label", "Highlighted Text - Click to Copy");

      this._updateHighlightVisualState(id);

      span.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._copyHighlightText(id);
      });

      try {
        range.surroundContents(span);
      } catch (error) {
        console.warn("Failed to apply highlight:", error);
        // Fallback: inserir manualmente
        span.textContent = range.toString();
        range.deleteContents();
        range.insertNode(span);
      }
    }

    async _copyHighlightText(highlightId) {
      const highlight = this.state.highlights.get(highlightId);
      if (!highlight) return;

      try {
        await navigator.clipboard.writeText(highlight.text);

        // Feedback visual temporário
        const element = document.getElementById(highlightId);
        if (element) {
          const originalColor = element.style.backgroundColor;
          element.style.backgroundColor =
            CONFIG.HIGHLIGHT.COLORS.success || "#28a745";
          element.style.transition = "background-color 0.3s ease";

          setTimeout(() => {
            element.style.backgroundColor = originalColor;
          }, 1000);
        }

        this._showFeedback("Text copied to clipboard!", "success");
      } catch (error) {
        console.error("Failed to copy text:", error);
        this._showFeedback("Failed to copy text", "error");
      }
    }

    // ======================
    // PREVENÇÃO SIMPLES DE MÚLTIPLAS SELEÇÕES
    // ======================

    _toggleHighlightSelection(highlightId) {
      // Método original simples - apenas alterna a seleção
      const highlight = this.state.highlights.get(highlightId);
      if (!highlight) return;

      if (this.state.selectedHighlights.has(highlight)) {
        this.state.selectedHighlights.delete(highlight);
      } else {
        this.state.selectedHighlights.add(highlight);
      }

      this._updateHighlightVisualState(highlightId);
      this._updateHighlightsSelectedButton();
      this._updateUI();
      this._saveSettings();
    }

    // ======================
    // CORREÇÃO DA ROLAGEM ATÉ MARCAÇÃO
    // ======================

    _scrollToHighlight(id) {
      const highlightElement = document.getElementById(id);
      if (!highlightElement) {
        console.warn(`Highlight element with id ${id} not found`);
        return;
      }

      // Salvar o estilo original para restaurar depois
      const originalBackground = highlightElement.style.backgroundColor;
      const originalTransition = highlightElement.style.transition;

      // Aplicar efeito de destaque temporário
      highlightElement.style.backgroundColor =
        CONFIG.HIGHLIGHT.COLORS.success || "#28a745";
      highlightElement.style.transition = "background-color 0.5s ease";

      // Rolagem suave para o elemento - CORRIGIDO: comportamento melhorado
      highlightElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // Restaurar estilo original após a animação
      setTimeout(() => {
        if (highlightElement && highlightElement.style) {
          highlightElement.style.backgroundColor = originalBackground;
          highlightElement.style.transition = originalTransition;
        }
      }, 1000);
    }

    _updateHighlightVisualState(highlightId) {
      const element = document.getElementById(highlightId);
      const highlight = this.state.highlights.get(highlightId);

      if (!element || !highlight) return;

      // Estado único de controle
      const shouldShow = !this.state.hiddenHighlights && highlight.visible;

      element.style.backgroundColor = shouldShow
        ? CONFIG.HIGHLIGHT.COLORS[this.state.theme]
        : "transparent";

      element.style.outline = this.state.selectedHighlights.has(highlight)
        ? "2px solid #007bff"
        : "none";
    }

    // NOVO: Sistema de restauração robusto
    _restoreMissingHighlights() {
      if (this.isDestroyed) return;

      // Verifica se há highlights no estado que não estão no DOM
      this.state.highlights.forEach((highlight) => {
        if (!document.getElementById(highlight.id)) {
          this._scheduleHighlightRestore(highlight.id);
        }
      });
    }

    _scheduleHighlightRestore(id) {
      if (!this.restoreQueue.has(id)) {
        this.restoreQueue.set(
          id,
          setTimeout(() => {
            const highlight = this.state.highlights.get(id);
            if (highlight) {
              const success = this._restoreHighlight(highlight);
              if (!success) {
                console.warn(`Failed to restore highlight ${id} after retry`);
                // Não remove do estado, apenas marca como não restaurado
                highlight.restorationFailed = true;
              }
            }
            this.restoreQueue.delete(id);
          }, 500) // Reduzido para 500ms para resposta mais rápida
        );
      }
    }

    _restoreHighlight(highlightId, highlightData) {
      try {
        if (
          !highlightData ||
          !highlightData.startContainerPath ||
          !highlightData.endContainerPath
        ) {
          // Mensagem de aviso mais clara
          console.warn(
            `Highlight data for highlightId: ${highlightId} is incomplete or corrupted. Skipping restoration.`
          );
          return;
        }

        const range = this._deserializeRange(highlightData);
        if (range) {
          const highlighter = new Rangy.ClassApplier("highlight", {
            tagNames: ["span", "em", "i", "b"],
            elementAttributes: {
              "data-highlight-id": highlightId,
            },
          });
          highlighter.applyToRange(range);
        } else {
          console.warn(
            `Failed to deserialize range for highlight ${highlightId}.`
          );
        }
      } catch (error) {
        console.warn(`Failed to restore highlight ${highlightId} after retry.`);
      }
    }

    _findAndHighlightText(
      parentEl,
      textToFind,
      initialOffset,
      highlightId,
      isVisible = true
    ) {
      const fullText = parentEl.textContent;
      let foundIndex = fullText.indexOf(textToFind, initialOffset);

      if (foundIndex === -1) {
        foundIndex = fullText.indexOf(textToFind);
      }

      if (foundIndex === -1) {
        console.warn(`Text '${textToFind}' not found in parent element`);
        return false;
      }

      const range = document.createRange();
      const nodes = this._findTextNodesForRange(
        parentEl,
        foundIndex,
        textToFind.length
      );

      if (nodes.startNode && nodes.endNode) {
        const span = document.createElement("span");
        span.id = highlightId;
        span.className = "unified-highlight";
        span.setAttribute("data-highlight-id", highlightId);

        this._updateHighlightVisualState(highlightId);

        span.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._copyHighlightText(highlightId);
        });

        try {
          range.setStart(nodes.startNode, nodes.startOffset);
          range.setEnd(nodes.endNode, nodes.endOffset);
          range.surroundContents(span);
          return true;
        } catch (err) {
          console.error(`Error restoring highlight ${highlightId}:`, err);
          // Fallback
          span.textContent = textToFind;
          range.deleteContents();
          range.insertNode(span);
          return true;
        }
      }
      return false;
    }

    _findTextNodesForRange(parentEl, startIndex, length) {
      const range = document.createRange();
      let currentOffset = 0;
      let startNode = null,
        endNode = null;
      let startOffset = 0,
        endOffset = 0;

      const walker = document.createTreeWalker(parentEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let node;
      while ((node = walker.nextNode())) {
        const nodeLength = node.length;

        if (startNode === null && currentOffset + nodeLength > startIndex) {
          startNode = node;
          startOffset = startIndex - currentOffset;
        }

        if (
          endNode === null &&
          currentOffset + nodeLength >= startIndex + length
        ) {
          endNode = node;
          endOffset = startIndex + length - currentOffset;
          break;
        }
        currentOffset += nodeLength;
      }

      return { startNode, startOffset, endNode, endOffset };
    }

    // ======================
    // SERIALIZAÇÃO DE RANGE (MELHORADA)
    // ======================

    // ======================
    // SISTEMA DE SERIALIZAÇÃO CORRIGIDO
    // ======================

    _serializeRange(range) {
      try {
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        // Obter informações do elemento pai estável para melhor recuperação
        const stableParentInfo = this._getStableParentInfo(
          range.commonAncestorContainer
        );

        return {
          startContainerPath: this._getNodePath(startContainer),
          startOffset: range.startOffset,
          endContainerPath: this._getNodePath(endContainer),
          endOffset: range.endOffset,
          text: range.toString(),
          stableParentSelector: stableParentInfo.selector,
          parentTextContent: stableParentInfo.element.textContent,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error("Failed to serialize range:", error);
        return null;
      }
    }

    _deserializeRange(rangeData) {
      try {
        const startContainer = this._getNodeByPath(
          rangeData.startContainerPath
        );
        const endContainer = this._getNodeByPath(rangeData.endContainerPath);

        // Verificação de segurança: Se os nós não puderem ser encontrados, retorne null.
        if (!startContainer || !endContainer) return null;

        const range = document.createRange();

        // Lógica de correção para o IndexSizeError
        let endOffset = rangeData.endOffset;
        if (
          endContainer.nodeType === Node.TEXT_NODE &&
          endContainer.length === 0
        ) {
          endOffset = 0;
        }

        range.setStart(startContainer, rangeData.startOffset);
        range.setEnd(endContainer, endOffset);

        // Verificar se o texto ainda corresponde (melhora a resiliência)
        if (range.toString() !== rangeData.text) {
          return null;
        }

        return range;
      } catch (error) {
        console.error("Failed to deserialize range:", error);
        return null;
      }
    }

    _findTextRange(parentElement, textToFind, initialOffset = 0) {
      const fullText = parentElement.textContent;
      let foundIndex = fullText.indexOf(textToFind, initialOffset);

      if (foundIndex === -1) {
        // Tenta encontrar em qualquer posição
        foundIndex = fullText.indexOf(textToFind);
      }

      if (foundIndex === -1) {
        console.warn(`Text '${textToFind}' not found in parent element`);
        return null;
      }

      const range = document.createRange();
      const nodes = this._findTextNodesForRange(
        parentElement,
        foundIndex,
        textToFind.length
      );

      if (nodes.startNode && nodes.endNode) {
        range.setStart(nodes.startNode, nodes.startOffset);
        range.setEnd(nodes.endNode, nodes.endOffset);
        return range;
      }

      return null;
    }

    _getNodePath(node) {
      const path = [];
      let current = node;
      let depth = 0;
      const maxDepth = 15; // Limite de profundidade para evitar loops infinitos

      while (current && current !== document.body && depth < maxDepth) {
        if (current.parentNode) {
          const siblings = Array.from(current.parentNode.childNodes);
          const index = siblings.indexOf(current);

          if (index !== -1) {
            path.unshift({
              tagName: current.nodeName,
              index: index,
              nodeType: current.nodeType,
              nodeName: current.nodeName,
            });
          }
        }
        current = current.parentNode;
        depth++;
      }

      return path;
    }

    _getNodeByPath(path) {
      let current = document.body;

      for (const step of path) {
        if (
          !current ||
          !current.childNodes ||
          step.index >= current.childNodes.length
        ) {
          return null;
        }

        const child = current.childNodes[step.index];

        // Verificação mais flexível para compatibilidade
        if (!child || child.nodeType !== step.nodeType) {
          return null;
        }

        // Verifica se a tag name corresponde (mais tolerante a mudanças)
        if (step.tagName && child.nodeName !== step.tagName) {
          return null;
        }

        current = child;
      }

      return current;
    }

    // ======================
    // GERENCIAMENTO DE VISUALIZAÇÃO
    // ======================

    _toggleHighlightsVisibility() {
      this.state.hiddenHighlights = !this.state.hiddenHighlights;

      this.state.highlights.forEach((_, id) =>
        this._updateHighlightVisualState(id)
      );
      this._saveSettings();
      this._updateUI();

      const message = this.state.hiddenHighlights
        ? CONFIG.TEXTS.HIDE_HIGHLIGHTS
        : CONFIG.TEXTS.SHOW_HIGHLIGHTS;
      this._showFeedback(`Highlights ${message.toLowerCase()}`, "info");
    }

    _clearHighlights() {
      if (!confirm(CONFIG.TEXTS.FEEDBACK.CONFIRM_CLEAR_HIGHLIGHTS)) {
        return;
      }

      // Limpar fila de restauração
      this.restoreQueue.forEach(clearTimeout);
      this.restoreQueue.clear();

      // Remover elementos do DOM
      this.state.highlights.forEach((highlight) => {
        const element = document.getElementById(highlight.id);
        if (element) {
          const parent = element.parentNode;
          while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
          }
          parent.removeChild(element);
        }
      });

      // Limpar estado
      this.state.highlights.clear();
      this.state.selectedHighlights.clear();

      this._saveHighlights();
      this._updateHighlightsSelectedButton();
      this._updateUI();
      this._showFeedback("All highlights have been removed", "info");
    }

    _deleteHighlight(id) {
      const highlight = this.state.highlights.get(id);
      if (!highlight) return;

      // Remover da fila de restauração
      if (this.restoreQueue.has(id)) {
        clearTimeout(this.restoreQueue.get(id));
        this.restoreQueue.delete(id);
      }

      // Remover do DOM
      const element = document.getElementById(id);
      if (element) {
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }

      // Remover do estado
      this.state.highlights.delete(id);
      this.state.selectedHighlights.delete(highlight);

      this._saveHighlights();
      this._updateHighlightsSelectedButton();
      this._updateUI();
      this._showFeedback("Highlight removed", "info");
    }

    // ======================
    // PERSISTÊNCIA DE DADOS (ATUALIZADA)
    // ======================

    _saveHighlights() {
      try {
        const highlights = Array.from(this.state.highlights.entries());
        const selected = Array.from(this.state.selectedHighlights).map(
          (h) => h.id
        );

        localStorage.setItem(
          "unifiedTool_highlights",
          JSON.stringify({
            highlights,
            selected,
            url: location.href,
            savedAt: Date.now(),
          })
        );
      } catch (error) {
        console.warn("Failed to save highlights:", error);

        if (error.name === "QuotaExceededError") {
          this._handleStorageQuotaExceeded();
        }
      }
    }

    _handleStorageQuotaExceeded() {
      try {
        // Ordena highlights por timestamp (mais antigos primeiro)
        const highlightsArray = Array.from(this.state.highlights.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // Mantém apenas os 50% mais recentes
        const keepCount = Math.floor(highlightsArray.length / 2);
        const newData = highlightsArray.slice(-keepCount);

        this.state.highlights = new Map(newData.map((item) => [item.id, item]));
        this._saveHighlights();

        this._showFeedback(
          "Storage limit exceeded. Oldest highlights removed.",
          "warning"
        );
      } catch (error) {
        console.error("Failed to handle storage quota:", error);
      }
    }

    _loadHighlights() {
      try {
        const saved = localStorage.getItem("unifiedTool_highlights");
        if (saved) {
          const data = JSON.parse(saved);

          // Verifica se os dados são da URL atual
          if (data.url === location.href && data.highlights) {
            // Converte o array de volta para Map
            this.state.highlights = new Map(data.highlights);

            // Restaura seleções
            if (data.selected) {
              data.selected.forEach((id) => {
                const highlight = this.state.highlights.get(id);
                if (highlight) {
                  this.state.selectedHighlights.add(highlight);
                }
              });
            }

            // Agenda restauração mas não espera por ela para atualizar UI
            this.state.highlights.forEach((highlight) => {
              this._scheduleHighlightRestore(highlight.id);
            });

            // Atualiza UI imediatamente
            this._updateUI();
          }
        }
      } catch (error) {
        console.error("Failed to load highlights:", error);
        // Limpa dados corrompidos
        localStorage.removeItem("unifiedTool_highlights");
      }
    }

    // ======================
    // LIMPEZA E DESTRUIÇÃO (ATUALIZADA)
    // ======================

    destroy() {
      if (this.isDestroyed) return;

      this.isDestroyed = true;

      // Limpar fila de restauração
      this.restoreQueue.forEach(clearTimeout);
      this.restoreQueue.clear();

      // Remover event listeners globais
      document.removeEventListener("mouseup", this._handleMouseUp);
      window.removeEventListener("beforeunload", this._handleBeforeUnload);

      // Parar observers
      if (this.observer) {
        this.observer.disconnect();
      }

      if (this.themeObserver) {
        this.themeObserver.removeEventListener(
          "change",
          this._handleThemeChange
        );
      }

      // Remover elementos DOM
      if (this.host && this.host.parentNode) {
        this.host.parentNode.removeChild(this.host);
      }

      if (this.globalStyle && this.globalStyle.parentNode) {
        this.globalStyle.parentNode.removeChild(this.globalStyle);
      }

      // Limpar referências
      delete window.unifiedCitationHighlighterInstance;

      console.log("UnifiedTool destroyed successfully");
    }

    // ======================
    // MÉTODOS ORIGINAIS (MANTIDOS)
    // ======================

    _getStableParentInfo(node) {
      let current = node;
      let depth = 0;
      const maxDepth = 10; // Limite de profundidade para busca

      while (current && current !== document.body && depth < maxDepth) {
        // Prefere elementos com ID
        if (current.id) {
          return {
            selector: `#${current.id}`,
            element: current,
          };
        }

        // Se não tem ID, tenta usar classes únicas
        if (current.classList && current.classList.length > 0) {
          const classSelector = Array.from(current.classList)
            .map((cls) => `.${cls}`)
            .join("");

          // Verifica se o seletor é único
          const elements = document.querySelectorAll(classSelector);
          if (elements.length === 1) {
            return {
              selector: classSelector,
              element: current,
            };
          }
        }

        current = current.parentNode;
        depth++;
      }

      // Fallback para body
      return { selector: "body", element: document.body };
    }

    _findTextStartIndex(range, parentElement, parentTextContent, text) {
      let startIndex = -1;
      const tempRange = document.createRange();
      tempRange.selectNodeContents(parentElement);
      const walker = document.createTreeWalker(
        parentElement,
        NodeFilter.SHOW_TEXT
      );
      let currentOffset = 0;
      let node;

      while ((node = walker.nextNode())) {
        if (node === range.startContainer) {
          startIndex = currentOffset + range.startOffset;
          break;
        }
        currentOffset += node.length;
      }

      if (startIndex === -1) {
        startIndex = parentTextContent.indexOf(text, 0);
      }

      return startIndex;
    }

    _updateUI() {
      this._updateHighlightsCounter();
      this._updateHighlightsList();
      this._updateCitation();
      this._updateThemeToggleIcon();
      this._updateHideToggleText();
      this._updateHighlightsSelectedButton();
    }

    _updateHighlightsSelectedButton() {
      const selectedCount = this.state.selectedHighlights.size;
      const highlightsBtn = this.shadow.querySelector(
        '[data-mode="highlights"]'
      );
      if (highlightsBtn) {
        highlightsBtn.textContent = `Highlights Selected (${selectedCount})`;
      }
    }

    _updateHideToggleText() {
      const hideToggle = this.elements.hideToggle;
      if (hideToggle) {
        hideToggle.textContent = this.state.hiddenHighlights
          ? CONFIG.TEXTS.SHOW_HIGHLIGHTS
          : CONFIG.TEXTS.HIDE_HIGHLIGHTS;
      }
    }

    _updateHighlightsCounter() {
      const counter = this.elements.container?.querySelector(
        ".highlights-counter"
      );
      if (counter) {
        const total = this.state.highlights.size;
        const selected = this.state.selectedHighlights.size;
        counter.textContent = `${selected}/${total} selected`;
      }
    }

    // ======================
    // CORREÇÃO DO TEMPLATE HTML
    // ======================

    _updateHighlightsList() {
      const list = this.elements.highlightsList;
      if (!list) return;

      let highlights = Array.from(this.state.highlights.values());

      // Aplicar filtro de busca se houver query
      if (this.state.searchQuery) {
        highlights = highlights.filter((highlight) =>
          highlight.text.toLowerCase().includes(this.state.searchQuery)
        );
      }

      // Ordenação por timestamp
      const sorted = highlights.sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <p>⚠️ ${
          this.state.searchQuery ? "No matches found" : "No highlights found"
        }</p>
        <small>${
          this.state.searchQuery
            ? "Try a different search term"
            : "To highlight, select the text and<br>type <kbd>H</kbd>, or press ⚡ on top"
        }</small>
      </div>
    `;
        return;
      }

      // CORREÇÃO: Usar data-highlight-id (com hífen) em vez de data-highlightId
      list.innerHTML = sorted
        .map((highlight, index) => {
          const date = new Date(highlight.timestamp);
          const dateStr = this._formatDate(date);
          const isRestored = !!document.getElementById(highlight.id);

          return `
      <div class="highlight-item ${
        this.state.selectedHighlights.has(highlight) ? "selected" : ""
      }" 
           data-highlight-id="${highlight.id}" 
           tabindex="0" 
           role="listitem">
        <div class="highlight-content">
          <div class="highlight-text">${this._escapeHtml(highlight.text)}</div>
          ${
            highlight.text.length > 100
              ? '<button class="toggle-expand" aria-label="Toggle expand">▼</button>'
              : ""
          }
          <hr>
          <div class="highlight-meta">
            <span class="highlight-id">⚡ ${index + 1}</span>
            <span class="highlight-date">${dateStr}</span>
            <span class="highlight-length">${highlight.text.length} char</span>
          </div>
        </div>
        <button class="delete-highlight" aria-label="Remover destaque" title="Remover destaque">×</button>
      </div>
    `;
        })
        .join("");

      // Reanexar os event listeners
      this._attachHighlightEventListeners();
    }

    // ======================
    // EVENT LISTENER SIMPLIFICADO
    // ======================

    _attachHighlightEventListeners() {
      const list = this.elements.highlightsList;
      if (!list) return;

      // Listeners para expandir/contrair texto
      list.querySelectorAll(".toggle-expand").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const item = e.target.closest(".highlight-item");
          item.classList.toggle("expanded");
          e.target.textContent = item.classList.contains("expanded")
            ? "▲"
            : "▼";
        });
      });

      // Listener principal para seleção - SIMPLES
      list.querySelectorAll(".highlight-item").forEach((item) => {
        const id = item.dataset.highlightId;

        item.addEventListener("click", (e) => {
          // Não faz nada se clicar nos botões de ação
          if (
            e.target.classList.contains("delete-highlight") ||
            e.target.classList.contains("toggle-expand")
          ) {
            return;
          }

          // Seleção simples
          this._toggleHighlightSelection(id);
          this._scrollToHighlight(id);
        });
      });

      // Listener para deletar
      list.querySelectorAll(".delete-highlight").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const item = btn.closest(".highlight-item");
          const id = item.dataset.highlightId;
          this._deleteHighlight(id);
        });
      });
    }

    _formatDate(date) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    }

    _escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    _updateCitation() {
      const preview = this.elements.citationPreview;
      if (!preview) return;

      let content = "";
      const format = this.elements.formatSelect?.value || "plain";
      const pageTitle = document.title;
      const pageUrl = location.href;
      const currentDate = new Date().toLocaleDateString();

      switch (this.state.citationMode) {
        case "highlights":
          const selected = Array.from(this.state.selectedHighlights).sort(
            (a, b) => a.timestamp - b.timestamp
          );
          if (selected.length === 0) {
            content = "⚠️ No highlights selected";
          } else {
            content = this._formatContent(
              selected.map((h) => h.text),
              format,
              pageTitle,
              pageUrl,
              currentDate
            );
          }
          break;

        case "selection":
          const currentSelection = window.getSelection().toString().trim();
          if (currentSelection) {
            content = this._formatContent(
              [currentSelection],
              format,
              pageTitle,
              pageUrl,
              currentDate
            );
          } else {
            content = `⚠️ No selection\n---\n`;
          }
          break;

        case "clipboard":
          content = this.state.clipboardContent || "⚠️ Empty clipboard";
          if (content !== "⚠️ Empty clipboard") {
            content = this._formatContent(
              [content],
              format,
              pageTitle,
              pageUrl,
              currentDate
            );
          }
          break;
      }

      // Novo: Usa edições manuais se existirem; caso contrário, o conteúdo gerado
      content = this.state.previewContent || content;
      preview.value = content;

      // Adicionar link de legibilidade se habilitado
      if (
        this.state.readabilityEnabled &&
        content &&
        !content.includes("⚠️ No highlights") &&
        content !== "⚠️ Empty clipboard"
      ) {
        const service = this.elements.readabilitySelect?.value;
        const serviceConfig = CONFIG.CITATION.READABILITY_SERVICES.find(
          (s) => s.value === service
        );
        if (serviceConfig) {
          content += `\n- Readability: ${serviceConfig.url(location.href)}`;
        }
      }

      // Adicionar link de fact-checking se habilitado
      if (
        this.state.factCheckEnabled &&
        content &&
        !content.includes("⚠️ No highlights")
      ) {
        const service = this.elements.factCheckSelect?.value;
        const serviceConfig = CONFIG.FACT_CHECK_SERVICES.find(
          (s) => s.value === service
        );
        if (serviceConfig) {
          const searchText = content.split("\n")[0].substring(0, 100);
          content += `\n- Fact-Check: ${serviceConfig.url(searchText)}`;
        }
      }

      // content += `\n---\n© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}\n${CONFIG.APP_INFO.creditsUrl}`; // inativo temporariamente

      preview.value = content;
    }

    _formatContent(texts, format, pageTitle, pageUrl, date) {
      switch (format) {
        case "whatsapp":
          return this._formatWhatsApp(texts, pageTitle, pageUrl);
        case "academic":
          return this._formatAcademic(texts, pageTitle, pageUrl, date);
        case "html":
          return this._formatHTML(texts, pageTitle, pageUrl);
        case "markdown":
          return this._formatMarkdown(texts, pageTitle, pageUrl);
        case "twitter":
          return this._formatTwitter(texts, pageTitle, pageUrl);
        case "plain":
        default:
          return this._formatPlain(texts, pageTitle, pageUrl);
      }
    }

    _formatWhatsApp(texts, title, url) {
      let content = `*${title}*\n\n`;
      content += texts.map((t) => `➤ ${t}`).join("\n\n");
      content += `\n\n- Source: ${url}`;
      return content;
    }

    _formatAcademic(texts, title, url, date) {
      let content = `${title}\n`;
      content += `Acesso em: ${date}\n\n`;
      content += texts.map((t, i) => `Citação ${i + 1}: "${t}"`).join("\n\n");
      content += `\n\nDisponível em: ${url}`;
      return content;
    }

    _formatHTML(texts, title, url) {
      let content = `<h2>${title}</h2>`;
      content += `<ul>`;
      content += texts.map((t) => `<li>${t}</li>`).join("");
      content += `</ul>`;
      content += `</br></br>`;
      content += `- Source: <a href="${url}" target="_blank">${url}</a>`;
      return content;
    }

    _formatMarkdown(texts, title, url) {
      let content = `## ${title}\n\n`;
      content += texts.map((t) => `- ${t}`).join("\n\n");
      content += `\n\n- Source: (${url})`;
      return content;
    }

    _formatTwitter(texts, title, url) {
      const maxLength = 280 - url.length - 5;
      let content = `${title}\n\n`;
      const mainText = texts.join(" ");

      if (content.length + mainText.length > maxLength) {
        content += mainText.substring(0, maxLength - content.length) + "...";
      } else {
        content += mainText;
      }

      content += `\n\n- ${url}`;
      return content;
    }

    _formatPlain(texts, title, url) {
      return `${title}\n\n${texts.join("\n\n")}\n\n- Source: ${url}`;
    }

    _getActionContent() {
      const format = this.elements.formatSelect.value;
      const rawContent = this.elements.citationPreview.value;

      if (!rawContent) return null;

      switch (format) {
        case "html":
          return `<blockquote>${rawContent.replace(
            /\n/g,
            "<br>"
          )}</blockquote>`;

        case "markdown":
          return rawContent
            .split("\n")
            .map((line) => `${line}`)
            .join("\n");

        case "plain":
          return rawContent;

        case "whatsapp":
          return `${rawContent}`;

        case "twitter":
          const maxLength = 280 - 24;
          return rawContent.length > maxLength
            ? `${rawContent.substring(0, maxLength)}...`
            : rawContent;

        case "academic":
        default:
          return `${rawContent}`;
      }
    }

    _copyContent(content) {
      navigator.clipboard
        .writeText(content)
        .then(() =>
          this._showFeedback("Content copied to clipboard!", "success")
        )
        .catch((err) => {
          console.error("Copy failed:", err);
          this._showFeedback("Failed to copy content", "error");
        });
    }

    _shareContent(platform, content) {
      let url;
      const pageUrl = encodeURIComponent(location.href);

      if (platform === "whatsapp") {
        url = `https://wa.me/?text=${encodeURIComponent(
          `${content}\n\n${pageUrl}`
        )}`;
      } else {
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          content
        )}&url=${pageUrl}`;
      }

      window.open(url, "_blank", "width=600,height=400");
    }

    _sendEmail() {
      const content = this.elements.citationPreview?.value || "";
      if (
        !content ||
        content === "⚠️ No highlights selected" ||
        content === "⚠️ Empty clipboard"
      ) {
        this._showFeedback("No valid content to send by email", "warning");
        return;
      }

      const pageTitle = document.title;
      const subject = `${pageTitle} [© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}]`;
      const body = encodeURIComponent(content);

      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${body}`;

      try {
        const emailWindow = window.open(
          mailtoLink,
          "_blank",
          "noopener,noreferrer"
        );
        if (
          !emailWindow ||
          emailWindow.closed ||
          typeof emailWindow.closed === "undefined"
        ) {
          throw new Error("Popup bloqueado");
        }
        this._showFeedback("Email client opened in new window", "success");
      } catch (error) {
        console.error("Falha ao abrir cliente de e-mail:", error);
        this._showFeedback("Allow popups to open email client", "error");
      }
    }

    _downloadContent(content) {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${new Date()
        .toISOString()
        .slice(0, 10)}_EasyShare_ByMagasine.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    _handleSearch(query) {
      this.state.searchQuery = query.toLowerCase();
      this._updateHighlightsList();

      const clearBtn = this.elements.clearSearch;
      if (clearBtn) {
        clearBtn.classList.toggle("hidden", !query);
      }

      if (query === "") {
        this.elements.searchInput.value = "";
      }
    }

    _toggleSortOrder() {
      this.state.sortOrder =
        this.state.sortOrder === "creation" ? "alphabetical" : "creation";
      this._updateHighlightsList();
      this._saveSettings();

      const sortBtn = this.elements.sortToggle;
      if (sortBtn) {
        sortBtn.textContent =
          this.state.sortOrder === "creation"
            ? CONFIG.TEXTS.SORT_CREATION
            : CONFIG.TEXTS.SORT_ALPHABETICAL;
      }
    }

    _setCitationMode(mode) {
      this.state.citationMode = mode;

      this.elements.citationModes?.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
        btn.setAttribute("aria-checked", btn.dataset.mode === mode);
      });

      if (mode === "clipboard") {
        this._updateClipboardContent();
      } else {
        this._updateCitation();
      }

      this._saveSettings();
    }

    _toggleReadability() {
      this.state.readabilityEnabled =
        this.elements.readabilityCheck?.checked || false;
      this._updateCitation();
      this._saveSettings();
    }

    _toggleFactCheck() {
      this.state.factCheckEnabled =
        this.elements.factCheckCheck?.checked || false;
      this._updateCitation();
      this._saveSettings();

      const message = this.state.factCheckEnabled
        ? CONFIG.TEXTS.FACT_CHECK_ENABLED
        : CONFIG.TEXTS.FACT_CHECK_DISABLED;
      this._showFeedback(message, "info");
    }

    _openReadability() {
      const service = this.elements.readabilitySelect?.value;
      const serviceConfig = CONFIG.CITATION.READABILITY_SERVICES.find(
        (s) => s.value === service
      );
      if (serviceConfig) {
        const url = serviceConfig.url(location.href);
        window.open(url, "_blank");
      }
    }

    _openFactCheck() {
      try {
        const service = this.elements.factCheckSelect?.value;
        const serviceConfig = CONFIG.FACT_CHECK_SERVICES.find(
          (s) => s.value === service
        );
        if (!serviceConfig) {
          this._showFeedback("Select a fact-checking service", "error");
          return;
        }

        let searchText = "";
        switch (this.state.citationMode) {
          case "highlights":
            const selected = Array.from(this.state.selectedHighlights);
            searchText = selected[0]?.text || document.title;
            break;
          case "selection":
            searchText =
              window.getSelection().toString().trim() || document.title;
            break;
          case "clipboard":
            searchText = this.state.clipboardContent || document.title;
            break;
          default:
            searchText = document.title;
        }

        const url = serviceConfig.url(searchText);
        window.open(url, "_blank", "noopener,noreferrer");
        this._showFeedback(`Checking in ${serviceConfig.name}...`, "success");
      } catch (error) {
        console.error("Fact-Check Error:", error);
        this._showFeedback("Error opening verification", "error");
      }
    }

    _prepareFactCheckText(text) {
      if (!text) return "";
      let processed = text.substring(0, 70);
      const lastSpace = processed.lastIndexOf(" ");
      if (lastSpace > 50) {
        processed = processed.substring(0, lastSpace);
      }
      processed = processed
        .replace(/[#%&*+=\\|<>{}ˆ$?!'":@]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      return processed || document.title.substring(0, 50);
    }

    _switchTab(tabName) {
      this.state.activeTab = tabName;
      this.elements.tabHighlights?.classList.toggle(
        "active",
        tabName === "highlights"
      );
      this.elements.tabCitation?.classList.toggle(
        "active",
        tabName === "citation"
      );
      this.elements.tabHighlights?.setAttribute(
        "aria-selected",
        tabName === "highlights"
      );
      this.elements.tabCitation?.setAttribute(
        "aria-selected",
        tabName === "citation"
      );
      this.elements.highlightsTab?.classList.toggle(
        "hidden",
        tabName !== "highlights"
      );
      this.elements.citationTab?.classList.toggle(
        "hidden",
        tabName !== "citation"
      );
      this._saveSettings();
      if (tabName === "citation") {
        this._updateCitation();
      }
    }

    _toggleMinimize() {
      this.state.isMinimized = !this.state.isMinimized;

      this.elements.container?.classList.toggle(
        "minimized",
        this.state.isMinimized
      );

      // Alterna texto e atributos do botão com operador ternário
      const btn = this.elements.minimizeButton;
      if (btn) {
        btn.textContent = this.state.isMinimized ? "+" : "−";
        btn.title = this.state.isMinimized ? "Maximize" : "Minimize";
        btn.setAttribute("aria-label", btn.title);
      }

      this._saveSettings();
    }

    _toggleTheme() {
      this.state.theme = this.state.theme === "dark" ? "light" : "dark";
      this._applyTheme(this.state.theme);
      this._saveSettings();
      this.state.highlights.forEach((highlight) => {
        this._updateHighlightVisualState(highlight.id);
      });
      this._updateThemeToggleIcon();
    }

    _updateThemeToggleIcon() {
      const themeToggle = this.elements.themeToggle;
      if (themeToggle) {
        themeToggle.textContent = this.state.theme === "dark" ? "🌙" : "☀️";
        themeToggle.title =
          this.state.theme === "dark" ? "Tema escuro" : "Tema claro";
      }
    }

    _handleClose() {
      if (confirm("Close the tool? Highlights will be kept.")) {
        this.destroy();
      }
    }

    _moveHighlightDown() {
      if (this.state.selectedHighlights.size === 0) return;
      if (this.state.selectedHighlights.size > 1) {
        alert("Select only one item to move.");
        return;
      }

      const highlights = Array.from(this.state.highlights.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      const selectedIndices = highlights
        .map((h, i) => (this.state.selectedHighlights.has(h) ? i : -1))
        .filter((i) => i !== -1);
      const index = selectedIndices[0];
      const nextIndex = index + 1;
      const currentHighlight = highlights[index];
      const nextHighlight = highlights[nextIndex];
      let moved = false;

      if (nextIndex < highlights.length) {
        [highlights[index], highlights[nextIndex]] = [
          nextHighlight,
          currentHighlight,
        ];
        moved = true;
        const tempTimestamp = currentHighlight.timestamp;
        currentHighlight.timestamp = nextHighlight.timestamp;
        nextHighlight.timestamp = tempTimestamp;
      }

      if (moved) {
        this.state.highlights = new Map(highlights.map((h) => [h.id, h]));
        this._saveHighlights();
        this._updateUI();
        this._updateCitation();
      }
    }

    _moveHighlightUp() {
      if (this.state.selectedHighlights.size === 0) return;
      if (this.state.selectedHighlights.size > 1) {
        alert("Select only one item to move.");
        return;
      }

      const highlights = Array.from(this.state.highlights.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      const selectedIndices = highlights
        .map((h, i) => (this.state.selectedHighlights.has(h) ? i : -1))
        .filter((i) => i !== -1);
      const index = selectedIndices[0];
      const prevIndex = index - 1;
      const currentHighlight = highlights[index];
      const prevHighlight = highlights[prevIndex];
      let moved = false;

      if (prevIndex >= 0) {
        [highlights[index], highlights[prevIndex]] = [
          prevHighlight,
          currentHighlight,
        ];
        moved = true;
        const tempTimestamp = currentHighlight.timestamp;
        currentHighlight.timestamp = prevHighlight.timestamp;
        prevHighlight.timestamp = tempTimestamp;
      }

      if (moved) {
        this.state.highlights = new Map(highlights.map((h) => [h.id, h]));
        this._saveHighlights();
        this._updateUI();
        this._updateCitation();
      }
    }

    _showFeedback(message, type = "info") {
      const existingFeedback = this.shadow.querySelector(".feedback-message");
      if (existingFeedback) {
        existingFeedback.remove();
      }

      const feedback = document.createElement("div");
      feedback.className = `feedback-message feedback-${type}`;
      feedback.textContent = message;
      feedback.setAttribute("role", "alert");
      feedback.setAttribute("aria-live", "polite");
      this.elements.container?.appendChild(feedback);

      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.style.opacity = "0";
          setTimeout(() => feedback.remove(), CONFIG.UI.ANIMATION_DURATION);
        }
      }, CONFIG.UI.FEEDBACK_DURATION);
    }

    _debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    _detectSystemTheme() {
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    _handleThemeChange(e) {
      if (!this._hasManualTheme()) {
        this.state.theme = e.matches ? "dark" : "light";
        this._applyTheme(this.state.theme);
        this._updateThemeToggleIcon();
        this.state.highlights.forEach((highlight) => {
          this._updateHighlightVisualState(highlight.id);
        });
      }
    }

    _hasManualTheme() {
      try {
        const saved = localStorage.getItem("unifiedTool_settings");
        if (saved) {
          const settings = JSON.parse(saved);
          return settings.hasOwnProperty("theme");
        }
      } catch (error) {
        console.warn("Failed to check manual theme:", error);
      }
      return false;
    }

    _applyTheme(theme) {
      if (this.elements.container) {
        this.elements.container.setAttribute("data-theme", theme);
      }
      this._updateThemeToggleIcon();
    }

    _handleBeforeUnload() {
      this._saveSettings();
      this._saveHighlights();
    }

    _saveSettings() {
      try {
        const settings = {
          activeTab: this.state.activeTab,
          isMinimized: this.state.isMinimized,
          citationMode: this.state.citationMode,
          readabilityEnabled: this.state.readabilityEnabled,
          sortOrder: this.state.sortOrder,
          hiddenHighlights: this.state.hiddenHighlights,
          position: this.state.position,
          theme: this.state.theme,
          factCheckEnabled: this.state.factCheckEnabled,
          factCheckService: this.state.factCheckService,
        };
        localStorage.setItem("unifiedTool_settings", JSON.stringify(settings));
      } catch (error) {
        console.warn("Failed to save settings:", error);
      }
    }

    _loadSettings() {
      try {
        const saved = localStorage.getItem("unifiedTool_settings");
        if (saved) {
          const settings = JSON.parse(saved);
          Object.assign(this.state, {
            activeTab: settings.activeTab || "citation",
            isMinimized: settings.isMinimized || false,
            citationMode: settings.citationMode || "highlights",
            readabilityEnabled:
              settings.readabilityEnabled !== undefined
                ? settings.readabilityEnabled
                : true,
            sortOrder: settings.sortOrder || "creation",
            hiddenHighlights: settings.hiddenHighlights || false,
            position: settings.position || {
              top: "20px",
              right: "20px",
              left: "auto",
            },
            theme: settings.theme || this._detectSystemTheme(),
            factCheckEnabled:
              settings.factCheckEnabled !== undefined
                ? settings.factCheckEnabled
                : true,
            factCheckService: settings.factCheckService || "google-fact-check",
          });

          if (this.elements.factCheckCheck) {
            this.elements.factCheckCheck.checked = this.state.factCheckEnabled;
          }
          if (this.elements.factCheckSelect) {
            this.elements.factCheckSelect.value = this.state.factCheckService;
          }

          this._applyTheme(this.state.theme);
          this._switchTab(this.state.activeTab);
          if (this.elements.readabilityCheck) {
            this.elements.readabilityCheck.checked =
              this.state.readabilityEnabled;
          }
          if (this.elements.hideToggle) {
            this.elements.hideToggle.textContent = this.state.hiddenHighlights
              ? CONFIG.TEXTS.SHOW_HIGHLIGHTS
              : CONFIG.TEXTS.HIDE_HIGHLIGHTS;
          }
          if (this.elements.sortToggle) {
            this.elements.sortToggle.textContent =
              this.state.sortOrder === "creation"
                ? CONFIG.TEXTS.SORT_CREATION
                : CONFIG.TEXTS.SORT_ALPHABETICAL;
          }
        }
      } catch (error) {
        console.warn("Failed to load settings:", error);
        this._switchTab("citation");
        this._applyTheme(this._detectSystemTheme());
        this.state.factCheckEnabled = true;
        this.state.factCheckService = "google-fact-check";
      }
    }

    async _updateClipboardContent() {
      try {
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.CLIPBOARD_UPDATING, "info");
        if (!navigator.clipboard) {
          throw new Error("API de clipboard não disponível");
        }
        const permission = await navigator.permissions.query({
          name: "clipboard-read",
        });
        this.state.clipboardPermission = permission.state;
        if (permission.state === "denied") {
          throw new Error(CONFIG.TEXTS.FEEDBACK.CLIPBOARD_PERMISSION_DENIED);
        }
        const text = await navigator.clipboard.readText();
        this.state.clipboardContent = text || "⚠️ Empty clipboard";
        this.state.clipboardError = null;
        if (this.state.citationMode === "clipboard") {
          this._updateCitation();
        }
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.CITATION_COPIED, "success");
      } catch (error) {
        console.error("Clipboard access failed:", error);
        this.state.clipboardError = error.message;
        this.state.clipboardContent = "Error accessing clipboard";
        if (this.state.citationMode === "clipboard") {
          this._updateCitation();
        }
        this._showFeedback(error.message, "error");
      }
    }

    _handleActionSelect(e) {
      const action = e.target.value;
      if (!action) return;
      e.target.value = "";
      const content = this._getActionContent();
      if (!content || content === "⚠️ No highlights selected") {
        this._showFeedback(
          "⚠️ No content available for this action",
          "warning"
        );
        return;
      }
      switch (action) {
        case "copy":
          this._copyContent(content);
          break;
        case "whatsapp":
          this._shareContent(action, content);
          break;
        case "twitter":
          this._shareContent(action, content);
          break;
        case "email":
          this._sendEmail(content);
          break;
        case "download":
          this._downloadContent(content);
          break;
        default:
          console.warn("Unknown action:", action);
      }
    }

    _getStyles() {
      return `
        /* ===== VARIÁVEIS CSS OTIMIZADAS ===== */
        :host {
          --primary-color: #031D35;
          --primary-hover: #205986;
          --primary-light: #e3f2fd;
          --secondary-color: #6c757d;
          --secondary-hover: #5a6268;
          --success-color: #28a745;
          --danger-color: #dc3545;
          --danger-hover: #c82333;
          --warning-color: #ffc107; 
          --info-color: #17a2b8;
          --light-bg: #afc0cd;
          --light-surface:rgba(234, 234, 234, 0.81);
          --light-border: #BBBBBB;
          --light-text:  #333333;
          --light-text-muted: #777777;
          --dark-bg: #031D35;
          --dark-surface: #2d3748;
          --dark-border: #555;
          --dark-text: #e2e8f0;
          --dark-text-muted: #a0aec0;
          --dark-input-bg: #2d3748;
          --container-width: ${CONFIG.UI.MAX_WIDTH}px;
          --border-radius: 8px;
          --border-radius-sm: 4px;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --shadow-dark: 0 4px 12px rgba(0, 0, 0, 0.3);
          --transition: all 0.2s ease;
          --transition-fast: all 0.15s ease;
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 12px;
          --spacing-lg: 16px;
          --spacing-xl: 20px;
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --font-size-xs: 11px;
          --font-size-sm: 12px;
          --font-size-base: 14px;
          --font-size-lg: 16px;
          --font-size-xl: 18px;
          --line-height: 1.5;
        }

        /* ===== CONTAINER PRINCIPAL ===== */
        .unified-container {
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          line-height: var(--line-height);
          color: var(--light-text);
          background: var(--light-bg);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          width: var(--container-width);
          max-width: var(--container-width);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          overflow: hidden;
        }

        .unified-container.minimized {
          max-height: 60px;
        }

        .unified-container.minimized .unified-content,
        .unified-container.minimized .tab-navigation {
          display: none;
        }

        /* ===== TEMA ESCURO OTIMIZADO ===== */
        .unified-container[data-theme="dark"] {
          background: var(--dark-bg);
          color: var(--dark-text);
          border-color: var(--dark-border);
          box-shadow: var(--shadow-dark);
        }

        .unified-container[data-theme="dark"] .unified-header {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          border-bottom-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] .tab-navigation {
          background: var(--dark-surface);
        }

        .unified-container[data-theme="dark"] .tab-btn:not(.active) {
          background: var(--primary-hover);
          color: white;
        }

        .unified-container[data-theme="dark"] .tab-btn:not(.active):hover {
          background: var(--primary-hover);
          color: white;
        }

        .unified-container[data-theme="dark"] .fieldset {
          border-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] .fieldset legend {
          color: var(--dark-text-muted);
        }

        .unified-container[data-theme="dark"] .btn {
          background: var(--dark-surface);
          color: var(--dark-text);
          border-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] .btn:hover {
          background: var(--dark-border);
        }

        .unified-container[data-theme="dark"] input,
        .unified-container[data-theme="dark"] select,
        .unified-container[data-theme="dark"] textarea {
          background: var(--dark-input-bg);
          color: var(--dark-text);
          border-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] input::placeholder {
          color: var(--dark-text-muted);
        }

        .unified-container[data-theme="dark"] .highlight-item {
          background: var(--dark-surface);
          border-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] .highlight-item:hover {
          border-color: var(--warning-color);
        }

.unified-container[data-theme="dark"] .highlight-item.selected {
      background: var(--dark-surface) !important;
      border-color: var(--primary-color) !important;
    }

        .unified-container[data-theme="dark"] .highlights-counter,
        .unified-container[data-theme="dark"] .highlights-help {
          background: var(--dark-bg);
          color: var(--dark-text-muted);
          border-color: var(--dark-bg);
        }

        .unified-container[data-theme="dark"] .citation-preview {
          background: var(--dark-input-bg);
          color: var(--dark-text);
        }

        .unified-container[data-theme="dark"] .control-group label {
          color: var(--dark-text);
        }

        /* ===== HEADER MELHORADO ===== */
        .unified-header {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          border-bottom: 1px solid var(--light-border);
          padding: 0 var(--spacing-md);
          cursor: default;
          user-select: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 48px;
        }

        .app-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .app-name {
          color: white;
          font-weight: 600;
          font-size: var(--font-size-lg);
          margin: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .app-version {
          font-size: var(--font-size-sm);
          color: var(--dark-text-muted);
          padding: 2px 6px;
          border-radius: var(--border-radius-sm);
          backdrop-filter: blur(4px);
          text-decoration: none;
          cursor: alias;
        }

        .header-controls {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
        }

        #highlight-action-btn {
          font-size: var(--font-size-lg);
        }

        /* ===== BOTÕES DE CONTROLE MELHORADOS ===== */
        .control-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          font-size: var(--font-size-lg);
          font-weight: 500;
          padding: var(--spacing-sm);
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          backdrop-filter: blur(4px);
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .control-btn:active {
          transform: translateY(0);
        }

        #close-button.control-btn:hover {
          background: var(--danger-color);
        }

        /* ===== NAVEGAÇÃO DE ABAS MELHORADA ===== */
        .tab-navigation {
          display: flex;
          width: 100%;
          gap: 0;
          margin: 0;
          background: var(--light-surface);
          border-bottom: 1px solid var(--light-border);
        }

        .tab-btn {
          flex: 1;
          background: var(--primary-hover);
          border: none;
          border-bottom: 3px solid transparent;
          padding: var(--spacing-md) var(--spacing-sm);
          cursor: pointer;
          font-size: var(--font-size-base);
          font-weight: 500;
          transition: var(--transition);
          color: var(--primary-light);
          position: relative;
        }

        .tab-btn.active {
          background: var(--primary-hover);
          color: white;
          border-bottom-color: var(--warning-color);
        }

        .tab-btn:not(.active):hover {
          background: var(--primary-hover);
          color: white;
          border-bottom-color: var(--warning-color);
        }

        /* ===== CONTEÚDO PRINCIPAL ===== */
        .unified-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tab-content {
          flex: 1;
          padding: var(--spacing-lg);
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .tab-content.hidden {
          display: none;
        }

        /* ===== FIELDSETS MELHORADOS ===== */
        .fieldset {
          border: 1px solid var(--primary-color);
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-md);
          transition: var(--transition);
        }

        .fieldset:hover {
          border-color: var(--primary-color);
        }

        .fieldset legend {
          font-weight: 400;
          font-size: var(--font-size-sm);
          color: var(--primary-color);
          padding: 0 var(--spacing-sm);
        }

        /* ===== BOTÕES PADRÃO MELHORADOS ===== */
        .btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius-sm);
          background: var(--light-bg);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          text-decoration: none;
          min-height: 36px;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn:hover {
          background: var(--light-surface);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn.btn-secondary {
          background: var(--primary-hover);
          color: white;
          border-color: var(--secondary-color);
        }

        .btn.btn-secondary:hover {
          background: var(--secondary-color);
          border-color: var(--secondary-color);
        }

        .btn.btn-danger {
          background: var(--danger-color);
          color: white;
          border-color: var(--danger-color);
        }

        .unified-container[data-theme="dark"] .btn.btn-danger {
          background: var(--danger-color);
          color: white;
          border-color: var(--danger-color);
        }

        .btn.btn-danger:hover {
          background: var(--danger-hover);
          border-color: black;
        }

        /* ===== BOTÕES DE MODO MELHORADOS ===== */
        .mode-buttons {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .mode-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--dark-border);
          border-radius: var(--border-radius-sm);
          background: var(--secondary-color);
          color: white;
          cursor: pointer;
          font-size: var(--font-size-base);
          font-weight: 400;
          transition: var(--transition);
          flex: 1;
          min-width: 0;
          position: relative;
        }

        .mode-btn.active {
          background: var(--primary-hover);
          color: white;
          border-color: var(--primary-hover);
          box-shadow: 0 0 0 2px var(--warning-color);
        }

        .mode-btn:not(.active) {
          background: var(--primary-hover);
          border-color: var(--dark-border);
        }

        .mode-btn:not(.active):hover {
          background: var(--primary-hover);
          border-color: var(--primary-color);
        }

        /* ===== CONTROLES DE HIGHLIGHTS MELHORADOS ===== */
        .highlights-controls {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .search-container {
          position: relative;
        }

        .search-container input {
          width: 100%;
          padding: var(--spacing-sm) 32px var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-base);
          background: var(--light-surface);
          box-sizing: border-box;
          transition: var(--transition);
        }

        .search-container input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        .clear-btn {
          position: absolute;
          right: var(--spacing-sm);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: var(--font-size-lg);
          color: var(--light-text-muted);
          padding: var(--spacing-xs);
          border-radius: 50%;
          transition: var(--transition);
        }

        .clear-btn:hover {
          color: var(--danger-color);
          background: rgba(220, 53, 69, 0.1);
        }

        .control-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .highlights-counter {
          font-size: var(--font-size-sm);
          color: var(--light-text);
          text-align: center;
          padding: var(--spacing-sm);
          background: var(--light-bg);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--light-border);
          font-weight: 500;
        }

        /* ===== LISTA DE HIGHLIGHTS MELHORADA ===== */
        .highlights-list {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
        }

        .highlight-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-xs);
          padding: var(--spacing-md);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius-sm);
          margin: var(--spacing-sm);
          cursor: pointer;
          transition: var(--transition);
          background: var(--primary-hover);
          color: white;
          position: relative;
        }

        .highlight-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--warning-color);
          border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
          opacity: 0;
          transition: var(--transition);
        }

        .highlight-item:hover::before {
          opacity: 0;
        }

        .highlight-item:hover {
          border-color: var(--warning-color);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

.highlight-item.selected {
      background: var(--primary-color) !important;
      border-color: var(--primary-color) !important;
      color: white !important;
    }

        .unified-container[data-theme="dark"] .highlight-item.selected {
          background: var(--dark-surface);
          border-color: var(--primary-color);
        }

.highlight-item.selected::before {
      opacity: 1 !important;
    }

        .highlight-content {
          flex: 1;
          min-width: 0;
        }

        .highlight-text {
          font-size: var(--font-size-base);
          line-height: var(--line-height);
          margin-bottom: var(--spacing-xs);
          word-wrap: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.3s ease;
          line-height: 1.4;
        }

        .highlight-item.expanded .highlight-text {
          -webkit-line-clamp: unset;
        }

        .toggle-expand {
          background: none;
          border: none;
          color: var(--warning-color);
          cursor: pointer;
          font-size: 0.8em;
          padding: 2px 3px;
          margin-top: 5px;
          display: block;
          text-align: center;
        }

        .toggle-expand:hover {
          opacity: 0.8;
        }

        .highlight-meta {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          color: var(--light-surface);
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .highlight-meta span {
          white-space: nowrap;
        }

        .highlight-item hr {
          border: none;
          border-top: 1px solid #ccc;
          margin: 0.8em 0;
          width: 100%;
          flex-basis: 100%;
        }

        .highlight-id {
          font-weight: bold;
          color: var(--warning-color);
        }
        
        .highlight-date {
          flex-grow: 1;
          text-align: center;
        }
        
        .highlight-length {
          font-style: italic;
        }

        .delete-highlight {
          background: none;
          border: none;
          color: var(--danger-color);
          cursor: pointer;
          font-size: var(--font-size-xl);
          font-weight: 500;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: var(--transition);
          opacity: 1;
        }

        .delete-highlight:hover {
          background: var(--danger-color);
          color: white;
          opacity: 1;
          transform: scale(1.1);
        }

        /* ===== CONTROLES DE CITAÇÃO MELHORADOS ===== */
        .control-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
          padding: var(--spacing-xs) 0;
        }

        .control-group label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          min-width: 60px;
          color: var(--primary-color);
        }

        .control-group select {
          flex: 1;
          min-width: 150px;
          padding: var(--spacing-sm);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-sm);
          background: var(--light-surface);
          color: var(--light-text);
          transition: var(--transition);
        }

        .control-group select:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        .control-group input[type="checkbox"] {
          margin-right: var(--spacing-xs);
          transform: scale(1.2);
          accent-color: var(--danger-color);
        }

        .readability-control {
          display: flex;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .readability-control select {
          flex: 1;
        }

        .fact-check-control {
          display: flex;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .fact-check-control select {
          flex: 1;
        }

        /* ===== PREVIEW DE CITAÇÃO MELHORADO ===== */
        .citation-preview {
          width: 100%;
          min-height: 120px;
          max-height: 200px;
          padding: var(--spacing-md);
          border: 1px solid var(--light-border);
          border-radius: var(--border-radius-sm);
          font-family: 'Courier New', monospace;
          font-size: var(--font-size-sm);
          line-height: var(--line-height);
          resize: vertical;
          background: var(--light-surface);
          color: var(--light-text);
          box-sizing: border-box;
          transition: var(--transition);
        }

        .citation-preview:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        .refresh-btn {
          width: 100%;
          margin-top: var(--spacing-md);
        }

        [data-mode="clipboard"].active ~ .refresh-btn {
          background-color: var(--primary-color);
          color: white;
        }

        /* ===== ESTADOS VAZIOS E AJUDA MELHORADOS ===== */
        .empty-state {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--light-text);
        } 

        [data-theme="dark"] .empty-state {
          color: var(--dark-text-muted);
        }

        .empty-state p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
        }

        .empty-state small {
          font-size: var(--font-size-sm);
        }

        .highlights-help {
          text-align: center;
          padding: var(--spacing-sm);
        }

        kbd {
          color: var(--warning-color);
          padding: 2px var(--spacing-xs);
          border-radius: 2px;
          font-size: var(--font-size-sm);
          font-family: monospace;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* ===== MENSAGENS DE FEEDBACK MELHORADAS ===== */
        .feedback-message {
          position: fixed;
          top: var(--spacing-xl);
          right: var(--spacing-xl);
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: var(--border-radius-sm);
          color: white;
          font-weight: 500;
          z-index: 2147483647;
          max-width: var(--container-width);
          word-wrap: break-word;
          transition: var(--transition);
          box-shadow: var(--shadow);
          backdrop-filter: blur(8px);
        }

        .feedback-success {
          background: var(--success-color);
        }

        .feedback-error {
          background: var(--danger-color);
        }

        .feedback-warning {
          background: var(--warning-color);
          color: var(--light-text);
        }

        .feedback-info {
          background: var(--info-color);
        }

        /* ===== UTILITÁRIOS ===== */
        .hidden {
          display: none !important;
        }

        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* ===== RESPONSIVIDADE MELHORADA ===== */
        @media (max-width: 400px) {
          .unified-container {
            width: calc(100vw - 20px);
            max-width: calc(100vw - 20px);
          }
          #highlight-action-btn {
            font-size: var(--font-size-xl);
          }
          .control-buttons {
            flex-direction: column;
          }
          .mode-buttons {
            flex-direction: column;
          }
          .control-group {
            flex-direction: column;
            align-items: stretch;
          }
          .control-group label {
            min-width: auto;
            color: var(--primary-color);
          }
          .readability-control {
            flex-direction: column;
          }
          .header-content {
            min-height: 44px;
          }
          .control-btn {
            min-width: 32px;
            min-height: 32px;
          }
        }

        /* ===== ACESSIBILIDADE MELHORADA ===== */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }

        @media (prefers-contrast: high) {
          .unified-container {
            border-width: 2px;
          }
          
          .btn, .mode-btn, .tab-btn {
            border-width: 2px;
          }
        }

        .unified-container:focus-within {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        /* button:focus, */
        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        fieldset textarea {
          border: none;
        }

        .highlight-item:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        /* ===== MELHORIAS DE HOVER ===== */
        @media (hover: hover) {
          .highlight-item:hover .delete-highlight {
            opacity: 1;
          }
        }

        /* ===== ANIMAÇÕES SUAVES ===== */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .unified-container {
          animation: slideIn 0.3s ease-out;
        }

        .feedback-message {
          animation: slideIn 0.2s ease-out;
        }
      `;
    }

    _getHighlightStyles() {
      return `
        .unified-highlight {
          transition: all ${CONFIG.UI.ANIMATION_DURATION}ms ease;
          cursor: pointer;
          border-radius: 3px;
          padding: 1px 3px;
          position: relative;
        }

        .unified-highlight:hover {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.4);
          transform: scale(1.02);
        }

        .unified-highlight:active {
          transform: scale(0.98);
        }

        .unified-highlight::after {
          content: '📋';
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .unified-highlight:hover::after {
          opacity: 1;
        }
      `;
    }

    _getMainTemplate() {
      return `
<div class="unified-header" id="header">
  <div class="header-content">
    <div class="app-title">
      <h3 class="app-name">${CONFIG.APP_INFO.name}</h3>
      <a class="app-version" href="${CONFIG.APP_INFO.versionUrl}" title="© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}" target="_blank" rel="noopener">${CONFIG.APP_INFO.version}</a>
    </div>
    <div class="header-controls">
      <button id="highlight-action-btn" class="control-btn" aria-label="Criar destaque" title="Criar destaque (H)">⚡</button>
      <button id="theme-toggle" class="control-btn" aria-label="Toggle theme" title="Toggle theme">🌙</button>
      <button id="minimize-button" class="control-btn" aria-label="Minimize" title="Minimize">−</button>
      <button id="close-button" class="control-btn" aria-label="Close" title="Close">×</button>
    </div>
  </div>
</div>

<nav class="tab-navigation" role="tablist">
<button id="tab-highlights" class="tab-btn" role="tab" aria-selected="true" aria-controls="highlights-tab">
  Highlights List
</button>
<button id="tab-citation" class="tab-btn active" role="tab" aria-selected="false" aria-controls="citation-tab">
  Citation Options
</button>
</nav>

<main class="unified-content">
  <section id="highlights-tab" class="tab-content hidden" role="tabpanel" aria-labelledby="tab-highlights">
<div class="highlights-controls">
  <div class="search-container">
    <label for="search-input" class="visually-hidden">Search highlights</label>
    <input type="text" id="search-input" placeholder="Search highlights..." aria-label="Search highlights">
    <button id="clear-search" class="clear-btn hidden" aria-label="Clear search" title="Clear search">×</button>
  </div>

  <div class="control-buttons">
    <button id="hide-toggle" class="btn btn-secondary">${CONFIG.TEXTS.HIDE_HIGHLIGHTS}</button>
    <button id="move-up" class="btn btn-secondary" title="Move selected up">↑</button>
    <button id="move-down" class="btn btn-secondary" title="Move selected down">↓</button>
    <button id="clear-highlights" class="btn btn-danger">Clear All</button>
  </div>

  <div class="highlights-counter">0/0 selected</div>
</div>

    <div id="highlights-list" class="highlights-list" role="list"></div>

    <div class="highlights-help">
      <small>
      <br>Click on the highlight list to select and scroll
      </small>
    </div>
  </section>

<section id="citation-tab" class="tab-content" role="tabpanel" aria-labelledby="tab-citation">
  <!-- Agrupamento: Source -->
  <fieldset class="fieldset">
    <legend>Text Source to Load</legend>
    <div class="mode-buttons" role="radiogroup" aria-label="Citation mode">
      <button class="mode-btn active" data-mode="highlights" role="radio" aria-checked="true">Highlights Selected (0)</button>
      <button class="mode-btn" data-mode="selection" role="radio" aria-checked="false">Single Selection</button>
      <button class="mode-btn" data-mode="clipboard" role="radio" aria-checked="false">Clipboard</button>
    </div>
  </fieldset>
  
  <!-- Agrupamento: Preview -->
  <fieldset class="fieldset">
    <legend>Text Preview</legend>
    <div class="citation-preview-container">
      <textarea id="citation-preview" class="citation-preview" aria-label="Citation preview"></textarea>
      <button id="reset-preview" class="btn btn-secondary" style="margin-top: 8px; width: 100%;" aria-label="Reset preview to original" title="Reset preview to original">Reset Preview</button>
    </div>
  </fieldset>

  <!-- Checkbox separado, fora dos agrupamentos -->
  <div class="control-group">
    <input type="checkbox" id="readability-check" checked>
    <label for="readability-check">Add Readability Services Links</label>
  </div>
    
  <div class="control-group">
    <input type="checkbox" id="fact-check-check" checked>
    <label for="fact-check-check">${CONFIG.TEXTS.ADD_FACT_CHECK}</label>
  </div>

  <!-- Agrupamento: Selectors -->
  <fieldset class="fieldset">
    <legend>Text Settings and Submission </legend>

    <div class="control-group">
      <label for="format-select">Formats:</label>
      <select id="format-select" aria-label="Citation format"></select>
    </div>

    <div class="control-group">
      <label for="readability-select">Readability:</label>
      <div class="readability-control">
        <select id="readability-select" aria-label="Reading service"></select>
        <button id="readability-button" class="btn btn-secondary" aria-label="Open readable page" title="Open readable page">🔎</button>
      </div>
   </div>
        
   <div class="control-group">
        <label for="fact-check-select">Fact Check:</label>
        <select id="fact-check-select" aria-label="Fact-check service"></select>
        <button id="fact-check-button" class="btn btn-secondary" aria-label="Open fact check page" title="Open fact check page">🔎</button>
   </div>

    <div class="control-group">
      <label for="action-select" id="submit">Submit: ⚡</label>
      <select id="action-select" aria-label="Action for citation"></select>
    </div>
  </fieldset>

</section>
</main>
      `;
    }
  }

  // Lógica de alternância:
  if (window.unifiedCitationHighlighterInstance) {
    window.unifiedCitationHighlighterInstance.destroy();
    delete window.unifiedCitationHighlighterInstance;
  } else {
    new UnifiedTool();
  }
})();
