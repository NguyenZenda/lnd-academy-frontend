(function () {
  const HIGHLIGHT_COLORS = ["#FFF3B0", "#C8F0D8", "#D6E8FF", "#FBD6E5"];
  let toolbarEl, popoverEl, savedRange = null;

  function injectUI() {
    toolbarEl = document.createElement("div");
    toolbarEl.id = "lndSelectionToolbar";
    toolbarEl.className = "selection-toolbar";
    toolbarEl.innerHTML =
      HIGHLIGHT_COLORS.map(c => `<button type="button" class="sel-color-btn" style="background:${c};" data-color="${c}"></button>`).join("") +
      `<button type="button" class="sel-lookup-btn">🔍 Tra cứu</button>`;
    document.body.appendChild(toolbarEl);

    popoverEl = document.createElement("div");
    popoverEl.id = "lndLookupPopover";
    popoverEl.className = "lookup-popover";
    document.body.appendChild(popoverEl);

    toolbarEl.querySelectorAll(".sel-color-btn").forEach(btn => {
      btn.addEventListener("mousedown", (e) => e.preventDefault()); // giu selection khong bi mat
      btn.addEventListener("click", () => applyHighlight(btn.dataset.color));
    });
    const lookupBtn = toolbarEl.querySelector(".sel-lookup-btn");
    lookupBtn.addEventListener("mousedown", (e) => e.preventDefault());
    lookupBtn.addEventListener("click", () => lookupSelection());

    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("mousedown", (e) => {
      if (!toolbarEl.contains(e.target) && !popoverEl.contains(e.target)) {
        hidePopover();
      }
    });
  }

  function isToolEnabled() {
    return window.LND_DISABLE_LOOKUP_TOOL !== true;
  }

  function handleSelectionChange(e) {
    if (toolbarEl.contains(e.target) || popoverEl.contains(e.target)) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      if (!text || sel.rangeCount === 0) {
        hideToolbar();
        return;
      }
      // Bo qua neu dang bôi trong 1 o input/textarea (nhu o go dap an)
      const anchorEl = sel.anchorNode && sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
      if (anchorEl && anchorEl.closest && anchorEl.closest("input, textarea, .rte-editable")) {
        hideToolbar();
        return;
      }
      savedRange = sel.getRangeAt(0).cloneRange();
      showToolbar(sel.getRangeAt(0));
    }, 5);
  }

  function showToolbar(range) {
    const rect = range.getBoundingClientRect();
    const top = rect.top + window.scrollY - 50;
    const left = rect.left + window.scrollX + rect.width / 2;
    toolbarEl.style.top = top + "px";
    toolbarEl.style.left = left + "px";
    toolbarEl.classList.add("open");
    // Highlight luon dung duoc; chi an nut Tra cuu/dich khi dang o che do Kiem tra
    toolbarEl.querySelector(".sel-lookup-btn").style.display = isToolEnabled() ? "inline-flex" : "none";
    hidePopover();
  }

  function hideToolbar() {
    toolbarEl.classList.remove("open");
  }

  function hidePopover() {
    popoverEl.classList.remove("open");
  }

  function applyHighlight(color) {
    if (!savedRange) return;
    const span = document.createElement("span");
    span.className = "lnd-highlight";
    span.style.backgroundColor = color;
    try {
      savedRange.surroundContents(span);
    } catch (err) {
      const contents = savedRange.extractContents();
      span.appendChild(contents);
      savedRange.insertNode(span);
    }
    window.getSelection().removeAllRanges();
    hideToolbar();
  }

  async function lookupSelection() {
    if (!savedRange) return;
    const text = savedRange.toString().trim();
    if (!text) return;

    const rect = savedRange.getBoundingClientRect();
    popoverEl.style.top = (rect.bottom + window.scrollY + 8) + "px";
    popoverEl.style.left = (rect.left + window.scrollX) + "px";
    popoverEl.innerHTML = `<div class="lookup-loading">Đang tra cứu...</div>`;
    popoverEl.classList.add("open");
    hideToolbar();

    try {
      const res = await fetch(API_URL + "/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Tra cứu thất bại");
      renderLookupResult(data);
    } catch (e) {
      popoverEl.innerHTML = `<div class="lookup-error">Lỗi: ${escapeHtml(e.message)}</div>`;
    }
  }

  function renderLookupResult(data) {
    if (data.is_phrase) {
      popoverEl.innerHTML = `
        <div class="lookup-close" onclick="document.getElementById('lndLookupPopover').classList.remove('open')">✕</div>
        <div class="lookup-label">Bản dịch</div>
        <div class="lookup-translation">${escapeHtml(data.translation || "")}</div>
      `;
      return;
    }
    popoverEl.innerHTML = `
      <div class="lookup-close" onclick="document.getElementById('lndLookupPopover').classList.remove('open')">✕</div>
      <div class="lookup-word-row">
        <strong class="lookup-word">${escapeHtml(data.word || "")}</strong>
        ${data.part_of_speech ? `<span class="lookup-pos">${escapeHtml(data.part_of_speech)}</span>` : ""}
      </div>
      <div class="lookup-label">Nghĩa tiếng Việt</div>
      <div class="lookup-vi">${escapeHtml(data.vietnamese_meaning || "")}</div>
      <div class="lookup-label">English definition</div>
      <div class="lookup-en">${escapeHtml(data.english_definition || "")}</div>
      ${(data.synonyms || []).length ? `
        <div class="lookup-label">Synonyms</div>
        <div class="lookup-tags">${data.synonyms.map(s => `<span class="lookup-tag syn">${escapeHtml(s)}</span>`).join("")}</div>
      ` : ""}
      ${(data.antonyms || []).length ? `
        <div class="lookup-label">Antonyms</div>
        <div class="lookup-tags">${data.antonyms.map(s => `<span class="lookup-tag ant">${escapeHtml(s)}</span>`).join("")}</div>
      ` : ""}
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
})();
