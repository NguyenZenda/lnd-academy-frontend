(function () {
  let pendingWord = null; // tu dang cho luu vao thu muc

  function injectFolderModal() {
    if (document.getElementById("vocabFolderModal")) return;
    const modal = document.createElement("div");
    modal.id = "vocabFolderModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Lưu từ vào thư mục</h3>
          <button class="modal-close" onclick="window.__closeVocabFolderModal()">✕</button>
        </div>
        <div class="error-msg" id="vocabFolderError"></div>
        <div id="vocabFolderList" class="doc-list" style="margin-bottom:14px;"></div>
        <label>Hoặc tạo thư mục mới</label>
        <input type="text" id="newFolderNameInput" placeholder="VD: Từ vựng Reading Passage 1" />
        <button class="btn btn-ghost btn-block" onclick="window.__createFolderAndSave()">+ Tạo thư mục mới & lưu vào đó</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  window.__closeVocabFolderModal = function () {
    document.getElementById("vocabFolderModal").classList.remove("open");
    pendingWord = null;
  };

  window.__saveWordToFolder = async function (folderId) {
    const errEl = document.getElementById("vocabFolderError");
    errEl.style.display = "none";
    try {
      const res = await fetch(API_URL + "/vocab/words", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaderAsync()) },
        body: JSON.stringify({ folder_id: folderId, ...pendingWord }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lưu từ thất bại");
      window.__closeVocabFolderModal();
      if (pendingWord && pendingWord.__starBtn) {
        pendingWord.__starBtn.classList.add("starred");
        pendingWord.__starBtn.textContent = "⭐";
      }
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = "block";
    }
  };

  window.__createFolderAndSave = async function () {
    const errEl = document.getElementById("vocabFolderError");
    errEl.style.display = "none";
    const name = document.getElementById("newFolderNameInput").value.trim();
    if (!name) {
      errEl.textContent = "Nhập tên thư mục trước đã.";
      errEl.style.display = "block";
      return;
    }
    try {
      const res = await fetch(API_URL + "/vocab/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaderAsync()) },
        body: JSON.stringify({ name }),
      });
      const folder = await res.json();
      if (!res.ok) throw new Error(folder.detail || "Tạo thư mục thất bại");
      await window.__saveWordToFolder(folder.id);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = "block";
    }
  };

  async function openFolderPicker(wordData, starBtn) {
    const user = getUser();
    if (!user) {
      alert("Đăng nhập để lưu từ vựng vào thư mục của bạn nhé.");
      return;
    }
    pendingWord = { ...wordData, __starBtn: starBtn };
    injectFolderModal();

    const listEl = document.getElementById("vocabFolderList");
    listEl.innerHTML = '<div class="empty-state">Đang tải danh sách thư mục...</div>';
    document.getElementById("vocabFolderModal").classList.add("open");
    document.getElementById("newFolderNameInput").value = "";

    try {
      const res = await fetch(API_URL + "/vocab/folders", { headers: { ...(await authHeaderAsync()) } });
      const folders = await res.json();
      if (!res.ok) throw new Error("Không tải được danh sách thư mục");

      if (!folders.length) {
        listEl.innerHTML = '<div class="empty-state">Bạn chưa có thư mục nào — tạo mới bên dưới.</div>';
        return;
      }
      listEl.innerHTML = folders.map(f => `
        <div class="doc-item">
          <div class="doc-info"><h4>${escapeHtml(f.name)}</h4></div>
          <div class="doc-actions"><button class="btn btn-primary" onclick="window.__saveWordToFolder('${f.id}')">Lưu vào đây</button></div>
        </div>
      `).join("");
    } catch (e) {
      listEl.innerHTML = '<div class="empty-state">Lỗi: ' + e.message + '</div>';
    }
  }

  window.renderKeyVocab = async function (containerId, sourceType, sourceId, text) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="empty-state" style="padding:12px;">Đang phân tích từ vựng...</div>';

    try {
      const res = await fetch(API_URL + "/key-vocab/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, source_id: sourceId, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Không trích xuất được từ vựng");

      if (!data.words || !data.words.length) {
        container.innerHTML = "";
        container.style.display = "none";
        return;
      }

      container.style.display = "block";
      container.innerHTML = `
        <div class="key-vocab-title">📚 Từ vựng quan trọng (B1+)</div>
        <div class="key-vocab-grid">
          ${data.words.map((w, i) => renderVocabCard(w, `${sourceType}_${sourceId}_${i}`)).join("")}
        </div>
      `;

      data.words.forEach((w, i) => {
        const cardId = `${sourceType}_${sourceId}_${i}`;
        const starBtn = document.getElementById("star_" + cardId);
        if (starBtn) {
          starBtn.addEventListener("click", () => openFolderPicker({
            word: w.word,
            part_of_speech: w.part_of_speech || "",
            cefr_level: w.cefr_level || "",
            english_meaning: w.english_meaning || "",
            vietnamese_meaning: w.vietnamese_meaning || "",
            common_phrases: w.common_phrases || [],
          }, starBtn));
        }
        const phraseBtn = document.getElementById("phrases_" + cardId);
        if (phraseBtn) {
          phraseBtn.addEventListener("click", () => {
            const box = document.getElementById("phrasebox_" + cardId);
            box.style.display = box.style.display === "none" ? "block" : "none";
          });
        }
      });
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Không tải được từ vựng: ' + escapeHtml(e.message) + '</div>';
    }
  };

  function renderVocabCard(w, cardId) {
    const phrases = w.common_phrases || [];
    return `
      <div class="key-vocab-card">
        <button type="button" class="key-vocab-star" id="star_${cardId}" title="Lưu vào Từ vựng của tôi">☆</button>
        <div class="key-vocab-word">${escapeHtml(w.word)} ${w.part_of_speech ? `<span class="key-vocab-pos">${escapeHtml(w.part_of_speech)}</span>` : ""} <span class="key-vocab-level">${escapeHtml(w.cefr_level || "")}</span></div>
        <div class="key-vocab-meaning-en">${escapeHtml(w.english_meaning || "")}</div>
        <div class="key-vocab-meaning-vi">${escapeHtml(w.vietnamese_meaning || "")}</div>
        ${phrases.length ? `
          <button type="button" class="btn btn-ghost key-vocab-phrase-btn" id="phrases_${cardId}">💬 Cụm từ phổ biến</button>
          <div class="key-vocab-phrasebox" id="phrasebox_${cardId}" style="display:none;">
            ${phrases.map(p => `<div class="key-vocab-phrase-item">${escapeHtml(p)}</div>`).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
})();
