(function () {
  const CHAT_API_URL = "https://lnd-academy-backend.onrender.com";
  let history = [];

  function injectWidget() {
    const wrap = document.createElement("div");
    wrap.id = "lndChatWidget";
    wrap.innerHTML = `
      <button id="chatBubble" class="chat-bubble" aria-label="Mở chat">💬</button>
      <div id="chatPanel" class="chat-panel">
        <div class="chat-panel-header">
          <div>
            <div class="chat-panel-title">Trợ lý LND Academy</div>
            <div class="chat-panel-sub">Tư vấn khóa học &amp; hỏi đáp học thuật</div>
          </div>
          <button id="chatClose" class="chat-panel-close" aria-label="Đóng chat">✕</button>
        </div>
        <div id="chatMessages" class="chat-messages">
          <div class="chat-msg chat-msg-bot">Chào bạn 👋 Mình là trợ lý ảo của LND Academy. Bạn cần tư vấn khóa học, hay hỏi về IELTS/bài tập?</div>
        </div>
        <form id="chatForm" class="chat-input-row">
          <input type="text" id="chatInput" placeholder="Nhập câu hỏi..." autocomplete="off" />
          <button type="submit" class="chat-send-btn" aria-label="Gửi">➤</button>
        </form>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById("chatBubble").addEventListener("click", () => {
      document.getElementById("chatPanel").classList.toggle("open");
      document.getElementById("chatInput").focus();
    });
    document.getElementById("chatClose").addEventListener("click", () => {
      document.getElementById("chatPanel").classList.remove("open");
    });
    document.getElementById("chatForm").addEventListener("submit", sendMessage);
  }

  function addMessage(role, text) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "chat-msg " + (role === "user" ? "chat-msg-user" : "chat-msg-bot");
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMessage("user", text);
    history.push({ role: "user", content: text });

    const box = document.getElementById("chatMessages");
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-msg chat-msg-bot chat-typing";
    typingDiv.id = "chatTyping";
    typingDiv.textContent = "Đang trả lời...";
    box.appendChild(typingDiv);
    box.scrollTop = box.scrollHeight;

    try {
      const res = await fetch(CHAT_API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      document.getElementById("chatTyping")?.remove();
      if (!res.ok) throw new Error(data.detail || "Lỗi máy chủ");
      addMessage("assistant", data.reply);
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      document.getElementById("chatTyping")?.remove();
      addMessage("assistant", "Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau hoặc liên hệ hotline/Zalo nhé.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectWidget);
  } else {
    injectWidget();
  }
})();
