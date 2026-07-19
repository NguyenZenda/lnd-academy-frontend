const API_URL = "https://lnd-academy-backend.onrender.com";

function getToken() { return localStorage.getItem("lnd_token"); }
function getUser() {
  const u = localStorage.getItem("lnd_user");
  return u ? JSON.parse(u) : null;
}
function setSession(token, user, refreshToken, expiresAt) {
  localStorage.setItem("lnd_token", token);
  localStorage.setItem("lnd_user", JSON.stringify(user));
  if (refreshToken) localStorage.setItem("lnd_refresh_token", refreshToken);
  if (expiresAt) localStorage.setItem("lnd_expires_at", String(expiresAt));
}
function clearSession() {
  localStorage.removeItem("lnd_token");
  localStorage.removeItem("lnd_user");
  localStorage.removeItem("lnd_refresh_token");
  localStorage.removeItem("lnd_expires_at");
}

// Tra ve access token con hieu luc, tu dong lam moi truoc khi het han (con ~5 phut thi refresh).
async function getValidToken() {
  const token = getToken();
  if (!token) return null;

  const expiresAt = parseInt(localStorage.getItem("lnd_expires_at") || "0", 10);
  const refreshToken = localStorage.getItem("lnd_refresh_token");
  const now = Math.floor(Date.now() / 1000);

  const stillFresh = !expiresAt || now < expiresAt - 300; // con hon 5 phut thi dung luon
  if (stillFresh || !refreshToken) return token;

  try {
    const res = await fetch(API_URL + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new Error("refresh failed");
    const data = await res.json();
    localStorage.setItem("lnd_token", data.access_token);
    localStorage.setItem("lnd_refresh_token", data.refresh_token);
    localStorage.setItem("lnd_expires_at", String(data.expires_at));
    return data.access_token;
  } catch (e) {
    return token; // that bai thi cu dung token cu, request se tu bao loi neu that su het han
  }
}

function authHeader() {
  const t = getToken();
  return t ? { "Authorization": "Bearer " + t } : {};
}

// Dung ham nay cho cac request quan trong (upload tai lieu, tao de thi...)
// de tu dong lam moi token truoc khi goi, tranh bi "Token khong hop le hoac da het han".
async function authHeaderAsync() {
  const t = await getValidToken();
  return t ? { "Authorization": "Bearer " + t } : {};
}

function isTeacher() {
  const u = getUser();
  return !!u && u.role === "teacher";
}
function logout() {
  clearSession();
  window.location.href = "index.html";
}

function renderNavAuth() {
  const el = document.getElementById("navAuth");
  const user = getUser();

  const adminMenuItem = document.getElementById("adminMenuItem");
  if (adminMenuItem) {
    adminMenuItem.style.display = (user && user.role === "admin") ? "flex" : "none";
  }

  if (!el) return;
  if (user) {
    const roleLabel = user.role === "teacher" ? "Giáo viên" : (user.role === "admin" ? "Admin" : "Học sinh");
    el.innerHTML =
      '<span class="nav-user">' + escapeHtml(user.full_name) +
      ' <span class="role-badge role-' + user.role + '">' + roleLabel + '</span></span>' +
      '<button class="btn btn-ghost" onclick="logout()">Đăng xuất</button>';
  } else {
    el.innerHTML =
      '<a class="btn btn-ghost" href="login.html">Đăng nhập</a>' +
      '<a class="btn btn-primary" href="register.html">Đăng ký</a>';
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  if (!menu || !overlay) return;
  const opening = !menu.classList.contains("open");
  menu.classList.toggle("open", opening);
  overlay.classList.toggle("open", opening);
  document.body.style.overflow = opening ? "hidden" : "";
}

function closeMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  if (!menu || !overlay) return;
  menu.classList.remove("open");
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", renderNavAuth);
