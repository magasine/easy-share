javascript: (() => {
  // CONFIGURAÇÕES GLOBAIS COMPLETAS
  const CONFIG = {
    APP_INFO: {
      name: "Easy Share ⚡",
      version: "v20250707", // beta
      versionUrl: "https://drive.google.com/file/d/1i_xH-UD1kcPZWUVTfVKNz2W7FxcPd8sy/view?usp=sharing",
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
    FACT_CHECK_SERVICES: [
      {
        name: "Google Fact Check",
        value: "google-fact-check",
        url: (text) => {
          const prepareText = (t) => {
            if (!t) return "";
            return t
              .substring(0, 70)
              .replace(/[#%&*+=\\|<>{}ˆ$?!'":@]/g, "")
              .replace(/\s{2,}/g, " ")
              .trim();
          };
          const query = prepareText(text) || "pesquisa";
          return `https://toolbox.google.com/factcheck/explorer/search/${encodeURIComponent(
            query
          )}?hl=pt`;
        },
      },
      {
        name: "Aos Fatos (Brasil)",
        value: "aos-fatos",
        url: (text) =>
          `https://www.aosfatos.org/noticias/?q=${encodeURIComponent(text)}`,
      },
      {
        name: "Lupa (Brasil)",
        value: "lupa",
        url: (text) =>
          `https://piaui.folha.uol.com.br/lupa/busca/?q=${encodeURIComponent(
            text
          )}`,
      },
    ],
    UI: {
      ANIMATION_DURATION: 200,
      FEEDBACK_DURATION: 1000,
      DEBOUNCE_DELAY: 300,
      MAX_WIDTH: 350, // Largura máxima garantida
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
      // Bind de métodos que são usados como event listeners
      this._moveHighlightUp = this._moveHighlightUp.bind(this);
      this._moveHighlightDown = this._moveHighlightDown.bind(this);
      this._handleMouseUp = this._handleMouseUp.bind(this);
      this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
      this._handleThemeChange = this._handleThemeChange.bind(this);
      this._toggleMinimize = this._toggleMinimize.bind(this);
      this._handleClose = this._handleClose.bind(this);
      this._handleDrag = this._handleDrag.bind(this);
      this._toggleSortOrder = this._toggleSortOrder.bind(this);
      this._debouncedSearch = this._debounce(
        this._handleSearch.bind(this),
        CONFIG.UI.DEBOUNCE_DELAY
      );
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
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        factCheckEnabled: true, // Novo estado para controle do checkbox
        factCheckService: "google-fact-check", // Serviço padrão
      };

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
      // Cache de elementos para melhor performance
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
          (option) => `
          <option value="${option.value}">${option.text || option.name}</option>
        `
        )
        .join("");
    }

    // ======================
    // GERENCIAMENTO DE EVENTOS
    // ======================

    _setupEventListeners() {
      if (this.isDestroyed) return;

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
      this.elements.header?.addEventListener("mousedown", this._handleDrag);

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
      // Observer para mudanças no DOM (restaurar destaques perdidos)
      this.observer = new MutationObserver((mutations) => {
        if (this.isDestroyed) return;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
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
    // FUNCIONALIDADES PRINCIPAIS
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

      // Validações melhoradas
      if (!text) {
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.TEXT_EMPTY, "warning");
        return;
      }

      if (text.length > CONFIG.HIGHLIGHT.MAX_SELECTION_LENGTH) {
        const message = CONFIG.TEXTS.FEEDBACK.TEXT_TOO_LONG.replace(
          "{limit}",
          CONFIG.HIGHLIGHT.MAX_SELECTION_LENGTH.toLocaleString()
        );
        this._showFeedback(message, "error");
        return;
      }

      const rangeData = this._serializeRange(range);
      if (!rangeData) {
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_FAILED, "error");
        return;
      }

      const highlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        url: location.href,
        timestamp: Date.now(),
        visible: true,
        rangeData,
      };

      this.state.highlights.set(highlight.id, highlight);

      try {
        this._applyHighlight(range, highlight.id);
        this._saveHighlights();
        this._updateUI();
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_CREATED, "success");
      } catch (error) {
        console.error("Failed to create highlight:", error);
        this.state.highlights.delete(highlight.id);
        this._showFeedback(CONFIG.TEXTS.FEEDBACK.HIGHLIGHT_FAILED, "error");
      }
    }

    _applyHighlight(range, id) {
      const span = document.createElement("span");
      span.id = id;
      span.className = "unified-highlight";
      span.setAttribute("data-highlight-id", id);
      span.setAttribute("aria-label", "Highlighted Text - Click to Copy");
      span.style.backgroundColor = this.state.hiddenHighlights
        ? "transparent"
        : CONFIG.HIGHLIGHT.COLORS[this.state.theme];
      span.style.transition = `background-color ${CONFIG.UI.ANIMATION_DURATION}ms ease`;
      span.style.cursor = "pointer";

      // Adiciona o evento de clique para copiar
      span.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._copyHighlightText(id);
      });

      try {
        range.surroundContents(span);
      } catch (error) {
        console.warn("Failed to apply highlight:", error);
        throw error;
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

    _toggleHighlightSelection(highlightId) {
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

    _scrollToHighlight(id) {
      const highlightElement = document.getElementById(id);
      if (!highlightElement) return;

      // Salvar o estilo original para restaurar depois
      const originalBackground = highlightElement.style.backgroundColor;
      const originalTransition = highlightElement.style.transition;

      // Aplicar efeito de destaque temporário
      highlightElement.style.backgroundColor =
        CONFIG.HIGHLIGHT.COLORS.success || "#28a745";
      highlightElement.style.transition = "background-color 0.5s ease";

      // Rolagem suave para o elemento
      highlightElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // Restaurar estilo original após a animação
      setTimeout(() => {
        highlightElement.style.backgroundColor = originalBackground;
        highlightElement.style.transition = originalTransition;
      }, 1000);
    }

    _updateHighlightVisualState(highlightId) {
      const element = document.getElementById(highlightId);
      const highlight = this.state.highlights.get(highlightId);

      if (!element || !highlight) return;

      const isSelected = this.state.selectedHighlights.has(highlight);
      // Use highlight.visible para determinar a cor de fundo
      const backgroundColor = highlight.visible
        ? CONFIG.HIGHLIGHT.COLORS[this.state.theme]
        : "transparent";

      element.style.backgroundColor = backgroundColor;
      element.style.outline = isSelected ? "2px solid #007bff" : "none";
      element.style.outlineOffset = "1px";
    }

    _restoreMissingHighlights() {
      if (this.isDestroyed) return;

      this.state.highlights.forEach((highlight) => {
        if (!document.getElementById(highlight.id)) {
          this._restoreHighlight(highlight);
        }
      });
    }

    _restoreHighlight(highlight) {
      const range = this._deserializeRange(highlight.rangeData);
      if (!range) return;

      try {
        this._applyHighlight(range, highlight.id);
      } catch (error) {
        console.warn("Failed to restore highlight:", error);
      }
    }

    _toggleHighlightsVisibility() {
      this.state.hiddenHighlights = !this.state.hiddenHighlights;

      this.state.highlights.forEach((highlight) => {
        // Sincronizar o estado do destaque individual
        highlight.visible = !this.state.hiddenHighlights;
        this._updateHighlightVisualState(highlight.id);
      });

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

    // ======================
    // NAVEGAÇÃO E UI
    // ======================

    _switchTab(tabName) {
      this.state.activeTab = tabName;

      // Update classes and ARIA attributes
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

      // Mostrar/ocultar conteúdo das tabs
      this.elements.highlightsTab?.classList.toggle(
        "hidden",
        tabName !== "highlights"
      );
      this.elements.citationTab?.classList.toggle(
        "hidden",
        tabName !== "citation"
      );

      this._saveSettings();

      // Atualizar conteúdo se necessário
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

      this._saveSettings();
    }

    _toggleTheme() {
      this.state.theme = this.state.theme === "dark" ? "light" : "dark";
      this._applyTheme(this.state.theme);
      this._saveSettings();

      // Atualizar cores dos destaques
      this.state.highlights.forEach((highlight) => {
        this._updateHighlightVisualState(highlight.id);
      });

      // Atualizar ícone do botão
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

    _handleDrag(e) {
      e.preventDefault();
      this.state.isDragging = true;

      const rect = this.host.getBoundingClientRect();
      this.state.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const handleMouseMove = (e) => {
        if (!this.state.isDragging) return;

        const x = e.clientX - this.state.dragOffset.x;
        const y = e.clientY - this.state.dragOffset.y;

        // Limitar às bordas da viewport
        const maxX = window.innerWidth - this.host.offsetWidth;
        const maxY = window.innerHeight - this.host.offsetHeight;

        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));

        this.host.style.left = constrainedX + "px";
        this.host.style.top = constrainedY + "px";
        this.host.style.right = "auto";

        this.state.position = {
          top: constrainedY + "px",
          left: constrainedX + "px",
          right: "auto",
        };
      };

      const handleMouseUp = () => {
        this.state.isDragging = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        this._saveSettings();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    _moveHighlightDown() {
      // 1. Não permite movimento se nenhum item estiver selecionado
      if (this.state.selectedHighlights.size === 0) {
        return;
      }

      // 2. Alerta e não permite movimento se mais de um item estiver selecionado
      if (this.state.selectedHighlights.size > 1) {
        alert("Select only one item to move.");
        return;
      }

      // Sabemos que exatamente UM item está selecionado.

      const highlights = Array.from(this.state.highlights.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      ); // Ordem crescente para match com UI

      // Um item selecionado, 'selectedIndices' terá apenas um elemento.
      const selectedIndices = highlights
        .map((h, i) => (this.state.selectedHighlights.has(h) ? i : -1)) // Usando 'h' para verificar se o Set guarda objetos
        .filter((i) => i !== -1);

      const index = selectedIndices[0]; // Pega o único índice selecionado
      const nextIndex = index + 1;
      const currentHighlight = highlights[index];
      const nextHighlight = highlights[nextIndex];

      let moved = false;

      // Condição de movimento para um único item:
      // 1. Não pode ser o último item da lista
      // 2. Não precisa mais verificar `!this.state.selectedHighlights.has(nextHighlight)`
      //    porque sabemos que apenas um item está selecionado e o de baixo, se existir, não estará selecionado.
      if (nextIndex < highlights.length) {
        // Trocar posições no array temporário
        [highlights[index], highlights[nextIndex]] = [
          nextHighlight,
          currentHighlight,
        ];
        moved = true;

        // Trocar os timestamps dos elementos que acabaram de trocar de posição
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
      // 1. Não permite movimento se nenhum item estiver selecionado
      if (this.state.selectedHighlights.size === 0) {
        return;
      }

      // 2. Alerta e não permite movimento se mais de um item estiver selecionado
      if (this.state.selectedHighlights.size > 1) {
        alert("Select only one item to move.");
        return;
      }

      // Sabemos que exatamente UM item está selecionado.

      const highlights = Array.from(this.state.highlights.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      ); // Ordem crescente para match com UI

      // Um item selecionado, 'selectedIndices' terá apenas um elemento.
      const selectedIndices = highlights
        .map((h, i) => (this.state.selectedHighlights.has(h) ? i : -1)) // Usando 'h' para verificar se o Set guarda objetos
        .filter((i) => i !== -1);

      const index = selectedIndices[0]; // Pega o único índice selecionado
      const prevIndex = index - 1;
      const currentHighlight = highlights[index];
      const prevHighlight = highlights[prevIndex];

      let moved = false;

      // Condição de movimento para um único item:
      // 1. Não pode ser o primeiro item da lista
      // 2. Não precisa mais verificar `!this.state.selectedHighlights.has(prevHighlight)`
      //    porque sabemos que apenas um item está selecionado e o de cima, se existir, não estará selecionado.
      if (prevIndex >= 0) {
        // Trocar posições no array temporário
        [highlights[index], highlights[prevIndex]] = [
          prevHighlight,
          currentHighlight,
        ];
        moved = true;

        // Trocar os timestamps dos elementos que acabaram de trocar de posição
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

    // ======================
    // FEEDBACK E NOTIFICAÇÕES
    // ======================

    _showFeedback(message, type = "info") {
      // Remove previous feedback if exists
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

      // Auto-remover após o tempo configurado
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.style.opacity = "0";
          setTimeout(() => feedback.remove(), CONFIG.UI.ANIMATION_DURATION);
        }
      }, CONFIG.UI.FEEDBACK_DURATION);
    }

    // ======================
    // UTILITÁRIOS
    // ======================

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
      // Só atualiza automaticamente se o usuário não definiu manualmente
      if (!this._hasManualTheme()) {
        this.state.theme = e.matches ? "dark" : "light";
        this._applyTheme(this.state.theme);
        this._updateThemeToggleIcon();

        // Atualizar cores dos destaques
        this.state.highlights.forEach((highlight) => {
          this._updateHighlightVisualState(highlight.id);
        });
      }
    }

    _hasManualTheme() {
      // Verifica se o usuário definiu um tema manualmente
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
      this._updateThemeToggleIcon(); // Garante que o ícone seja atualizado ao aplicar o tema
    }

    _handleBeforeUnload() {
      this._saveSettings();
      this._saveHighlights();
    }

    // ======================
    // PERSISTÊNCIA DE DADOS
    // ======================

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
          theme: this.state.theme, // Salvar tema escolhido
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

          // Atualiza apenas as propriedades existentes no estado
          Object.assign(this.state, {
            // Configurações existentes
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

            // Novas configurações de fact-checking
            factCheckEnabled:
              settings.factCheckEnabled !== undefined
                ? settings.factCheckEnabled
                : true,
            factCheckService: settings.factCheckService || "google-fact-check",
          });

          // Atualizar elementos da UI
          if (this.elements.factCheckCheck) {
            this.elements.factCheckCheck.checked = this.state.factCheckEnabled;
          }
          if (this.elements.factCheckSelect) {
            this.elements.factCheckSelect.value = this.state.factCheckService;
          }

          // Configurações existentes de UI
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
        // Valores padrão em caso de erro
        this._switchTab("citation");
        this._applyTheme(this._detectSystemTheme());

        // Garantir que os novos estados tenham valores padrão
        this.state.factCheckEnabled = true;
        this.state.factCheckService = "google-fact-check";
      }
    }

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
          })
        );
      } catch (error) {
        console.warn("Failed to save highlights:", error);
      }
    }

    _loadHighlights() {
      try {
        const saved = localStorage.getItem("unifiedTool_highlights");
        if (saved) {
          const data = JSON.parse(saved);

          // Carregar apenas destaques da URL atual
          if (data.url === location.href && data.highlights) {
            this.state.highlights = new Map(data.highlights);

            // Restaurar seleções
            if (data.selected) {
              data.selected.forEach((id) => {
                const highlight = this.state.highlights.get(id);
                if (highlight) {
                  this.state.selectedHighlights.add(highlight);
                }
              });
            }

            // Restaurar destaques no DOM
            this.state.highlights.forEach((highlight) => {
              this._restoreHighlight(highlight);
            });
          }
        }
      } catch (error) {
        console.warn("Failed to load highlights:", error);
      }
    }

    // ======================
    // SERIALIZAÇÃO DE RANGE
    // ======================

    _serializeRange(range) {
      try {
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        return {
          startContainerPath: this._getNodePath(startContainer),
          startOffset: range.startOffset,
          endContainerPath: this._getNodePath(endContainer),
          endOffset: range.endOffset,
          text: range.toString(),
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

        if (!startContainer || !endContainer) return null;

        const range = document.createRange();
        range.setStart(startContainer, rangeData.startOffset);
        range.setEnd(endContainer, rangeData.endOffset);

        // Verificar se o texto ainda corresponde
        if (range.toString() !== rangeData.text) {
          return null;
        }

        return range;
      } catch (error) {
        console.error("Failed to deserialize range:", error);
        return null;
      }
    }

    _getNodePath(node) {
      const path = [];
      let current = node;

      while (current && current !== document.body) {
        if (current.parentNode) {
          const siblings = Array.from(current.parentNode.childNodes);
          const index = siblings.indexOf(current);
          path.unshift({
            tagName: current.nodeName,
            index: index,
            nodeType: current.nodeType,
          });
        }
        current = current.parentNode;
      }

      return path;
    }

    _getNodeByPath(path) {
      let current = document.body;

      for (const step of path) {
        if (!current || !current.childNodes) return null;

        const child = current.childNodes[step.index];
        if (
          !child ||
          child.nodeName !== step.tagName ||
          child.nodeType !== step.nodeType
        ) {
          return null;
        }

        current = child;
      }

      return current;
    }

    // ======================
    // CLIPBOARD
    // ======================

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
        this.state.clipboardContent = text || "Clipboard vazio";
        this.state.clipboardError = null;

        // Atualizar a citação se estivermos no modo clipboard
        if (this.state.citationMode === "clipboard") {
          this._updateCitation();
        }

        this._showFeedback(CONFIG.TEXTS.FEEDBACK.CITATION_COPIED, "success");
      } catch (error) {
        console.error("Clipboard access failed:", error);
        this.state.clipboardError = error.message;
        this.state.clipboardContent = "Erro ao acessar clipboard";

        if (this.state.citationMode === "clipboard") {
          this._updateCitation();
        }

        this._showFeedback(error.message, "error");
      }
    }

    // ======================
    // TEMPLATES E ESTILOS
    // ======================

    _getMainTemplate() {
      return `
<div class="unified-header" id="header">
  <div class="header-content">
    <div class="app-title">
      <h3 class="app-name">${CONFIG.APP_INFO.name}</h3>
      <a class="app-version" href="${CONFIG.APP_INFO.versionUrl}" title="© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}" target="_blank" rel="noopener">${CONFIG.APP_INFO.version}</a>
    </div>
    <div class="header-controls">
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
  Citation Compose
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
    <!--- <button id="sort-toggle" class="btn btn-secondary">${CONFIG.TEXTS.SORT_CREATION}</button> --->
    <button id="move-up" class="btn btn-secondary" title="Move selected up">↑</button>
    <button id="move-down" class="btn btn-secondary" title="Move selected down">↓</button>
    <button id="clear-highlights" class="btn btn-danger">Clear All</button>
  </div>

  <div class="highlights-counter">0/0 selected</div>
</div>

    <div id="highlights-list" class="highlights-list" role="list"></div>

    <div class="highlights-help">
      <small>Select text and use <kbd>Ctrl</kbd> + <kbd>Click</kbd> to highlight
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
      <textarea id="citation-preview" class="citation-preview" readonly aria-label="Citation preview"></textarea>
    </div>
  </fieldset>

  <!--- <button id="refresh-clipboard" class="btn btn-secondary refresh-btn">
    🔄 Refresh Clipboard
  </button> --->

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

    _getStyles() {
      return `
        /* ===== VARIÁVEIS CSS OTIMIZADAS ===== */
        :host {
          /* Cores principais */
          --primary-color: #031D35; /* #143858; */
          --primary-hover: #205986;
          --primary-light: #e3f2fd;
          --secondary-color: #6c757d;
          --secondary-hover: #5a6268;
          
          /* Estados */
          --success-color: #28a745;
          --danger-color: #dc3545;
          --danger-hover: #c82333;
          --warning-color: #ffc107; 
          --info-color: #17a2b8;
    
          /* Cores novas - Tema claro Ativo */
          --light-bg: #afc0cd;
          --light-surface:rgba(234, 234, 234, 0.81);
          --light-border: #BBBBBB;
          --light-text:  #333333;
          --light-text-muted: #777777;

          /* Cores neutras - Tema escuro */
          --dark-bg: #031D35; /* #282c34; #1a202c; */
          --dark-surface: #2d3748;
          --dark-border: #555;/*  #4a5568; */
          --dark-text: #e2e8f0;
          --dark-text-muted: #a0aec0;
          --dark-input-bg: #2d3748;
          
          /* Layout */
          --container-width: ${CONFIG.UI.MAX_WIDTH}px;
          --border-radius: 8px;
          --border-radius-sm: 4px;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --shadow-dark: 0 4px 12px rgba(0, 0, 0, 0.3);
          
          /* Animações */
          --transition: all 0.2s ease;
          --transition-fast: all 0.15s ease;
          
          /* Espaçamentos */
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 12px;
          --spacing-lg: 16px;
          --spacing-xl: 20px;
          
          /* Tipografia */
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
          color: vwhite);
        }

        .unified-container[data-theme="dark"] .tab-btn:not(.active):hover {
          background: var(--primary-hover);
          color: vwhite);
        }

        .unified-container[data-theme="dark"] .fieldset {
          border-color: var(--dark-border);
        }

        .unified-container[data-theme="dark"] .fieldset legend {
          color: var(--dark-text-muted);
        }

        .unified-container[data-theme="dark"] .btn {
          background: var(--danger-surface);
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
          /* background: var(--light-bg); */
          border-color: var(--warning-color);
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
          cursor: move;
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
          /* outline: 0; */
        }

        .tab-btn.active {
          background: var(--primary-hover);
          color: white;
          border-top-color: transparent;
          border-righ-colort: transparent;
          border-bottom-color: var(--warning-color);
          border-left-color: transparent;
          outline: 0;
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
          border-color: black; /* var(--danger-hover); */
        }

        /* ===== BOTÕES DE MODO MELHORADOS ===== */
        .mode-buttons {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .mode-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--dark-border); /* light-border */
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
          background: var(--light-surface); /* light-bg */
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
          color: var(--litght-text);
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
          opacity: 1;
        }

        .highlight-item:hover {
          border-color: var(--warning-color);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .highlight-item:hover::before {
          opacity: 0;
        }

        .highlight-item.selected {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }

        .unified-container[data-theme="dark"] .highlight-item.selected {
          background: var(--dark-surface);
          border-color: var(--primary-color);
        }

        .highlight-item.selected::before {
          opacity: 1;
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
          background: var(--light-surface); /* light-bg */
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

        /* Inativo
        .citation-preview-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        */  

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

        /* Inativo
        .fieldset .citation-preview {
         padding: 0;
         margin: -12px;
         width: 100%;
         box-sizing: border-box;
        }
        */

        .citation-preview:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        .refresh-btn {
          width: 100%;
          margin-top: var(--spacing-md);
        }

        /* Estilo quando o modo clipboard está ativo */
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
          /* background: var(--light-surface); */
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--light-border);
        }

        .highlights-help kbd {
          background: var(--warning-color);
          color: var(--primary-color);
          padding: 2px var(--spacing-xs);
          border-radius: 2px;
          font-size: var(--font-size-xs);
          font-weight: bold;
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

        button:focus,
        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        fieldset textarea { /* teste */
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

      /* Inativo para teste
        .unified-highlight:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 1px;
        }

        .unified-highlight::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent, rgba(0, 123, 255, 0.1), transparent);
          border-radius: 4px;
          opacity: 0;
          transition: opacity ${CONFIG.UI.ANIMATION_DURATION}ms ease;
          pointer-events: none;
        }

        .unified-highlight:hover::before {
          opacity: 1;
        }
        */
      `;
    }

    // ======================
    // MÉTODOS FALTANTES (IMPLEMENTAÇÃO COMPLETA)
    // ======================

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

      // Ordenação mantida
      const sorted = highlights.sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>⚠️ ${
                  this.state.searchQuery
                    ? "No matches found"
                    : "No highlights found"
                }</p>
                <small>${
                  this.state.searchQuery
                    ? "Try a different search term"
                    : "Select text and press Ctrl+Click to create highlights"
                }</small>
            </div>
        `;
        return;
      }

      list.innerHTML = sorted
        .map((highlight, index) => {
          const date = new Date(highlight.timestamp);
          const dateStr = this._formatDate(date);

          return `
                <div class="highlight-item ${
                  this.state.selectedHighlights.has(highlight) ? "selected" : ""
                }" 
                     data-highlight-id="${highlight.id}" 
                     tabindex="0" 
                     role="listitem">
                    <div class="highlight-content">
                        <div class="highlight-text">${this._escapeHtml(
                          highlight.text
                        )}</div>
                        <hr>
                        <div class="highlight-meta">
                            <span class="highlight-id"># ${index + 1}</span>
                            <span class="highlight-date">${dateStr}</span>
                            <span class="highlight-length">${
                              highlight.text.length
                            } char</span>
                        </div>
                    </div>
                    <button class="delete-highlight" aria-label="Remover destaque" title="Remover destaque">×</button>
                </div>
            `;
        })
        .join("");

      // Adicionar event listeners
      list.querySelectorAll(".highlight-item").forEach((item) => {
        const id = item.dataset.highlightId;

        item.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-highlight")) {
            this._toggleHighlightSelection(id);
            this._scrollToHighlight(id);
          }
        });
      });

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

    _deleteHighlight(id) {
      const highlight = this.state.highlights.get(id);
      if (!highlight) return;

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
          // Converte para array e ordena por timestamp para manter consistência
          const selected = Array.from(this.state.selectedHighlights).sort(
            (a, b) => a.timestamp - b.timestamp
          ); // Ordem crescente

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
          content = this.state.clipboardContent || "Clipboard vazio";
          // Aplicar formatação mesmo para conteúdo do clipboard se não estiver vazio
          if (content !== "Clipboard vazio") {
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

      // Adicionar link de legibilidade se habilitado
      if (
        this.state.readabilityEnabled &&
        content &&
        !content.includes("No highlights") &&
        content !== "Empty clipboard"
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
        !content.includes("No highlights")
      ) {
        const service = this.elements.factCheckSelect?.value;
        const serviceConfig = CONFIG.FACT_CHECK_SERVICES.find(
          (s) => s.value === service
        );

        if (serviceConfig) {
          // Extrair o primeiro parágrafo ou linha para a busca
          const searchText = content.split("\n")[0].substring(0, 100);
          content += `\n- Fact-Check: ${serviceConfig.url(searchText)}`;
        }
      }

      content += `\n---\n© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}\n${CONFIG.APP_INFO.creditsUrl}`;

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
      let content = `<h3>${title}</h3>`;
      content += `<ul>`;
      content += texts.map((t) => `<li>${t}</li>`).join("");
      content += `</ul>`;
      content += `<p>- Source: <a href="${url}" target="_blank">${url}</a></p>`;
      return content;
    }

    _formatMarkdown(texts, title, url) {
      let content = `## ${title}\n\n`;
      content += texts.map((t) => `- ${t}`).join("\n\n");
      content += `\n\n- Source: (${url})`;
      return content;
    }

    _formatTwitter(texts, title, url) {
      const maxLength = 280 - url.length - 5; // 5 chars for space and ellipsis
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
      return `${title}\n\n${texts.join("\n\n")}\n\n- Souce: ${url}`;
    }

    _getActionContent() {
      const format = this.elements.formatSelect.value;
      const rawContent = this.elements.citationPreview.value;

      if (!rawContent) return null;

      // Formatar conforme o tipo selecionado
      switch (format) {
        case "html":
          return `<blockquote>${rawContent.replace(
            /\n/g,
            "<br>"
          )}</blockquote>`;

        case "markdown":
          return rawContent
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");

        case "plain":
          return rawContent;

        case "whatsapp":
          return `${rawContent}`;

        case "twitter":
          const maxLength = 280 - 24; // 24 para URL e espaços
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
        // twitter
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          content
        )}&url=${pageUrl}`;
      }

      window.open(url, "_blank", "width=600,height=400");
    }

    _sendEmail() {
      // Obter o conteúdo formatado da citação
      const content = this.elements.citationPreview?.value || "";
      if (
        !content ||
        content === "⚠️ No highlights selected" ||
        content === "Empty clipboard"
      ) {
        this._showFeedback("No valid content to send by email", "warning");
        return;
      }

      // Criar elementos do e-mail
      const pageTitle = document.title;
      const subject = `${pageTitle} [© ${CONFIG.APP_INFO.name} by ${CONFIG.APP_INFO.credits}]`;
      const body = encodeURIComponent(content);

      // Criar o link mailto com todos os parâmetros
      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${body}`;

      // Abrir nova janela com o cliente de e-mail
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

      // Atualizar botões de modo
      this.elements.citationModes?.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
        btn.setAttribute("aria-checked", btn.dataset.mode === mode);
      });

      // Se o modo for clipboard, atualizar automaticamente
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

    _handleActionSelect(e) {
      const action = e.target.value;
      if (!action) return;

      // Reset do seletor após ação
      e.target.value = "";

      // Obter conteúdo formatado
      const content = this._getActionContent();

      if (!content || content === "⚠️ No highlights selected") {
        this._showFeedback(
          "⚠️ No content available for this action",
          "warning"
        );
        return;
      }

      // Executar ação específica
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

        // Obter texto baseado no modo
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

        // Abrir serviço
        const url = serviceConfig.url(searchText);
        window.open(url, "_blank", "noopener,noreferrer");

        this._showFeedback(
          `Checking in ${serviceConfig.name}...`,
          "success"
        );
      } catch (error) {
        console.error("Fact-Check Error:", error);
        this._showFeedback("Error opening verification", "error");
      }
    }

    // Novo método auxiliar para preparar o texto
    _prepareFactCheckText(text) {
      if (!text) return "";

      // 1. Limite aumentado para 70 caracteres (melhor cobertura)
      let processed = text.substring(0, 70);

      // 2. Otimização para frases completas
      const lastSpace = processed.lastIndexOf(" ");
      if (lastSpace > 50) {
        // Se cortou no meio de uma palavra
        processed = processed.substring(0, lastSpace);
      }

      // 3. Sanitização aprimorada
      processed = processed
        .replace(/[#%&*+=\\|<>{}ˆ$?!'":@]/g, "") // Mantém hífens e vírgulas
        .replace(/\s{2,}/g, " ")
        .trim();

      // 4. Fallback inteligente
      return processed || document.title.substring(0, 50);
    }

    _escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    // ======================
    // LIMPEZA E DESTRUIÇÃO
    // ======================

    destroy() {
      if (this.isDestroyed) return;

      this.isDestroyed = true;

      // Remover event listeners globais
      document.removeEventListener("mouseup", this._handleMouseUp);
      window.removeEventListener("beforeunload", this._handleBeforeUnload);
      document.removeEventListener(
        "selectionchange",
        this.state._handleSingleSelectionChange
      );

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
  }

  // Inicializar a ferramenta
  new UnifiedTool();
})();
