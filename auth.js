const API_URL = "https://lnd-academy-backend.onrender.com";

function getToken() { return localStorage.getItem("lnd_token"); }
function getUser() {
  const u = localStorage.getItem("lnd_user");
  return u ? JSON.parse(u) : null;
}
function setSession(token, user) {
  localStorage.setItem("lnd_token", token);
  localStorage.setItem("lnd_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("lnd_token");
  localStorage.removeItem("lnd_user");
}
function authHeader() {
  const t = getToken();
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
  if (!el) return;
  const user = getUser();
  if (user) {
    const roleLabel = user.role === "teacher" ? "Giáo viên" : "Học sinh";
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
