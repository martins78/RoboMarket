const DEFAULT_PRODUCTS=[
  {id:1,name:"Brazo Seleccionador",type:"vision",price:34900,tag:"VISIÓN ARTIFICIAL",desc:"Brazo seleccionador con visión artificial para clasificar y manipular piezas de forma automática.",img:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",features:["Visión artificial","Detección de objetos","Clasificación automática"]},
  {id:2,name:"Brazo Sin Visión",type:"industrial",price:28500,tag:"SIN VISIÓN",desc:"Brazo sin visión artificial, de alta precisión para procesos de producción controlada.",img:"https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=700&q=80",features:["Alta precisión","Movimientos controlados","Carga: 10 kg"]},
  {id:3,name:"Brazo Normal",type:"collaborative",price:18500,tag:"ESTÁNDAR",desc:"Brazo normal para tareas básicas de automatización, laboratorio y educación.",img:"https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=700&q=80",features:["Diseño simple","Configuración rápida","Bajo consumo"]}
];
/* ═══ CAPA DE COMUNICACIÓN CON LA API PHP + MySQL ═══ */
const API = {
  async req(url, opts = {}) {
    let r;
    try {
      r = await fetch("api/" + url, { headers: { "Content-Type": "application/json" }, ...opts });
    } catch (e) {
      throw new Error("No hay conexión con el servidor. Verifica que Laragon esté corriendo.");
    }
    let j = null;
    try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || `Error del servidor (${r.status})`);
    return j;
  },
  get: u => API.req(u),
  post: (u, b) => API.req(u, { method: "POST", body: JSON.stringify(b || {}) }),
  put: (u, b) => API.req(u, { method: "PUT", body: JSON.stringify(b || {}) }),
  del: u => API.req(u, { method: "DELETE" })
};

let products = [];
async function loadProducts() {
  let list = null;
  try { list = (await API.get("products.php")).productos; } catch (e) { list = null; }
  if (!Array.isArray(list) || !list.length) list = DEFAULT_PRODUCTS.map(p => ({ ...p }));
  products = list;
  renderProducts();
}

let cart = [];
try {
  const savedCart = JSON.parse(localStorage.getItem("robomarket-cart") || "[]");
  if (Array.isArray(savedCart)) cart = savedCart;
} catch (e) { cart = []; }

const grid = document.getElementById("productsGrid");
const search = document.getElementById("searchInput");
const filter = document.getElementById("filterSelect");

function money(n){return "Bs. " + n.toLocaleString("es-BO");}

function productHTML(p){
  return `
  <article class="product-card" data-tilt>
    <div class="product-visual">
      <span class="product-tag">${p.tag}</span>
      <div class="mini-arm"><span></span></div>
      <img class="product-img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">
    </div>
    <div class="product-info">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="product-bottom">
        <span class="price">${money(p.price)}</span>
        <div class="product-actions">
          <button onclick="showProduct(${p.id})">Ver más</button>
          <button class="add" onclick="addToCart(${p.id})">+ Carrito</button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderProducts(){
  const q = search.value.toLowerCase();
  const f = filter.value;
  const result = products.filter(p => (f==="all" || p.type===f) && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))).slice(0,3);
  grid.innerHTML = result.length ? result.map(productHTML).join("") : `<div class="empty" style="grid-column:1/-1">No se encontraron productos.</div>`;
  attachTilt();
}
search.addEventListener("input",renderProducts);
filter.addEventListener("change",renderProducts);

function addToCart(id){
  const p = products.find(x=>x.id===id);
  const existing = cart.find(x=>x.id===id);
  if(existing) existing.qty++;
  else cart.push({id:p.id,qty:1});
  saveCart();
  const badge=document.getElementById("cartCount");
  badge.classList.remove("bump");void badge.offsetWidth;badge.classList.add("bump");
  showToast(`${p.name} agregado al carrito`);
}
function saveCart(){
  localStorage.setItem("robomarket-cart",JSON.stringify(cart));
  updateCart();
}
function updateCart(){
  const items = document.getElementById("cartItems");
  let total=0,count=0;
  if(!cart.length) items.innerHTML=`<p class="empty">Tu carrito está vacío.</p>`;
  else items.innerHTML=cart.map(item=>{
    const p=products.find(x=>x.id===item.id);
    total += p.price*item.qty; count += item.qty;
    return `<div class="cart-item"><div><h4>${p.name}</h4><small>${money(p.price)} × ${item.qty}</small></div><button class="remove-item" onclick="removeFromCart(${p.id})">Eliminar</button></div>`;
  }).join("");
  document.getElementById("cartCount").textContent=count;
  document.getElementById("cartTotal").textContent=money(total);
}
function removeFromCart(id){cart=cart.filter(x=>x.id!==id);saveCart()}

const cartPanel=document.getElementById("cartPanel"),overlay=document.getElementById("overlay");
function openCart(){cartPanel.classList.add("open");overlay.classList.add("show")}
function closeCart(){cartPanel.classList.remove("open");overlay.classList.remove("show")}
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
overlay.onclick=closeCart;

function showProduct(id){
  const p=products.find(x=>x.id===id);
  document.getElementById("modalContent").innerHTML=`
  <div class="modal-product">
    <div class="product-visual"><div class="mini-arm"><span></span></div><img class="product-img" src="${p.img}" alt="${p.name}" onerror="this.remove()"></div>
    <div><span class="eyebrow">${p.tag}</span><h2>${p.name}</h2><p>${p.desc}</p><ul>${p.features.map(f=>`<li>✓ ${f}</li>`).join("")}</ul><strong class="price">${money(p.price)}</strong><br><button class="btn primary" style="margin-top:16px" onclick="addToCart(${p.id});closeModal()">Agregar al carrito</button></div>
  </div>`;
  document.getElementById("productModal").classList.add("show");
}
function closeModal(){document.getElementById("productModal").classList.remove("show")}
document.getElementById("modalClose").onclick=closeModal;
document.getElementById("productModal").addEventListener("click",e=>{if(e.target.id==="productModal")closeModal()});

let ORDERS = [];
async function loadOrders() {
  try { ORDERS = (await API.get("orders.php")).pedidos; }
  catch (e) { ORDERS = []; }
}
function getOrders(){ return ORDERS; }

document.getElementById("checkoutBtn").onclick=async()=>{
  if(!cart.length){alert("Agrega al menos un producto.");return}
  if(!session){ showToast("Inicia sesión para registrar tu cotización ⚠"); tryLogin(); return; }
  let total=0;
  const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);total+=p.price*i.qty;return{name:p.name,qty:i.qty}});
  const summary=items.map(i=>`${i.name} ×${i.qty}`).join(", ");
  try {
    await API.post("orders.php",{summary,total});
    await loadOrders();
    if (dashView.classList.contains("open")) renderDashPanel();
  } catch (e) { showToast(e.message + " ✗"); return; }
  const text="Hola, quiero solicitar una cotización de: "+items.map(i=>`${i.name} (${i.qty})`).join(", ");
  window.open("https://wa.me/59160514977?text="+encodeURIComponent(text),"_blank");
  cart=[];saveCart();
  showToast("Cotización enviada y pedido registrado ✓");
};

document.getElementById("projectionBtn").onclick=()=>{
  const total=document.getElementById("salesTotal");
  const values=[13200,16800,20500,24300,28700,32100,36900];
  const sum=values.reduce((a,b)=>a+b,0);
  total.textContent=sum.toLocaleString("es-BO");
  alert("Escenario actualizado: se proyecta un crecimiento sostenido de las ventas durante el periodo.");
};

function updateThemeIcons(){const ic=document.body.classList.contains("light")?"☀":"◐";document.getElementById("themeBtn").textContent=ic;const dt=document.getElementById("dashThemeBtn");if(dt)dt.textContent=ic}
function toggleTheme(){const light=document.body.classList.toggle("light");localStorage.setItem("rm-theme",light?"light":"dark");updateThemeIcons()}
document.getElementById("themeBtn").onclick=toggleTheme;
document.getElementById("dashThemeBtn").onclick=toggleTheme;
if(localStorage.getItem("rm-theme")==="light")document.body.classList.add("light");
updateThemeIcons();

const menuToggle=document.getElementById("menuToggle"),mainNav=document.getElementById("mainNav");
menuToggle.onclick=()=>{const open=mainNav.classList.toggle("open");menuToggle.textContent=open?"✕":"☰"};
document.querySelectorAll("#mainNav a").forEach(a=>a.onclick=()=>{mainNav.classList.remove("open");menuToggle.textContent="☰"});

document.getElementById("contactForm").addEventListener("submit",e=>{
  e.preventDefault();
  const d=new FormData(e.target);
  const name=d.get("name"),email=d.get("email"),interest=d.get("interest"),message=d.get("message");
  const text=`Hola, soy ${name} (${email || "sin correo"}). Estoy interesado en: ${interest}. Mensaje: ${message}`;
  window.open("https://wa.me/59160514977?text="+encodeURIComponent(text),"_blank");
  document.getElementById("formMessage").textContent=`✓ Solicitud enviada a WhatsApp, ${name}. Te responderemos pronto.`;
  e.target.reset();
});

function attachTilt(){
  document.querySelectorAll("[data-tilt]").forEach(card=>{
    if(card.dataset.tiltReady)return;
    card.dataset.tiltReady="1";
    card.addEventListener("mousemove",e=>{
      if(innerWidth<800)return;
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(800px) rotateX(${-y*7}deg) rotateY(${x*9}deg) translateZ(4px)`;
    });
    card.addEventListener("mouseleave",()=>card.style.transform="");
  });
}

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

document.querySelectorAll("[data-counter]").forEach(el=>{
  const target=+el.dataset.counter;
  let n=0;
  const step=Math.max(1,Math.ceil(target/35));
  const timer=setInterval(()=>{n=Math.min(target,n+step);el.textContent=n+(target===98?"%":"+");if(n>=target)clearInterval(timer)},35);
});

const barValues=[38,48,57,64,73,82,94];
document.getElementById("bars").innerHTML=barValues.map(v=>`<i class="bar" style="height:${v}%"></i>`).join("");

const progressBar=document.getElementById("progressBar"),toTop=document.getElementById("toTop");
const sections=[...document.querySelectorAll("section[id]")];
const navLinks=[...document.querySelectorAll("#mainNav a")];
function onScroll(){
  const d=document.documentElement,max=d.scrollHeight-d.clientHeight;
  progressBar.style.width=(max?d.scrollTop/max*100:0)+"%";
  toTop.classList.toggle("show",d.scrollTop>400);
  let cur=sections.length?sections[0].id:"";
  sections.forEach(s=>{if(s.offsetTop<=scrollY+130)cur=s.id});
  navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+cur));
}
addEventListener("scroll",onScroll,{passive:true});
onScroll();
toTop.onclick=()=>scrollTo({top:0,behavior:"smooth"});

document.getElementById("newsletterForm").addEventListener("submit",e=>{
  e.preventDefault();
  const em=e.target.querySelector("input").value;
  e.target.reset();
  showToast(`✓ Suscripción confirmada: ${em}`);
});

let offerEnd=+(localStorage.getItem("offer-end")||0);
if(!offerEnd||offerEnd<Date.now()){offerEnd=Date.now()+6*3600*1000;localStorage.setItem("offer-end",offerEnd);}
function tickCountdown(){
  let s=Math.max(0,Math.floor((offerEnd-Date.now())/1000));
  const h=Math.floor(s/3600).toString().padStart(2,"0"),m=Math.floor(s%3600/60).toString().padStart(2,"0"),sec=(s%60).toString().padStart(2,"0");
  document.getElementById("countdown").textContent=`${h}:${m}:${sec}`;
}
tickCountdown();
setInterval(tickCountdown,1000);

let toastTimer;
function showToast(msg){
  const t=document.getElementById("toast");
  t.innerHTML="<b>✓</b>"+msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
}

const typedEl=document.querySelector(".typed");
const words=["brazos robóticos","fábricas inteligentes","automatización total","robots industriales"];
let wi=0,ci=0,deleting=false;
function type(){
  const w=words[wi];
  typedEl.textContent=w.slice(0,ci);
  let wait=deleting?35:95;
  if(!deleting&&ci<w.length)ci++;
  else if(!deleting&&ci===w.length){deleting=true;wait=1700;}
  else if(deleting&&ci>0)ci--;
  else{deleting=false;wi=(wi+1)%words.length;wait=320;}
  setTimeout(type,wait);
}
type();

const loader=document.getElementById("loader");
setTimeout(()=>loader.classList.add("done"),1700);
window.addEventListener("load",()=>loader.classList.add("done"));

/* ===== AUTENTICACIÓN Y CUENTAS ===== */
let USERS = [];
async function loadUsers() {
  try { USERS = (await API.get("users.php")).usuarios; }
  catch (e) { USERS = []; }
}

/* La sesión vive en el servidor (cookie PHP); se consulta al cargar */
let session = null;

const loginModal = document.getElementById("loginModal");
const loginBox = document.getElementById("loginBox");
const dashView = document.getElementById("dashboardView");
const prodModal = document.getElementById("prodModal");

/* --- LOGIN PREMIUM --- */
const emailWrap = document.getElementById("emailWrap");
const passWrap = document.getElementById("passWrap");
const loginEmailEl = document.getElementById("loginEmail");
const loginPassEl = document.getElementById("loginPass");
const strengthMeter = document.getElementById("strengthMeter");
const strengthLabel = document.getElementById("strengthLabel");
const capsHint = document.getElementById("capsHint");
const loginSuccess = document.getElementById("loginSuccess");

function initLoginParticles() {
  const container = document.getElementById("loginParticles");
  if (!container || container.children.length > 0) return;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("div");
    p.className = "login-particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.top = 80 + Math.random() * 40 + "%";
    p.style.animationDelay = Math.random() * 8 + "s";
    p.style.animationDuration = 6 + Math.random() * 4 + "s";
    p.style.width = p.style.height = 3 + Math.random() * 4 + "px";
    p.style.opacity = 0.3 + Math.random() * 0.5;
    container.appendChild(p);
  }
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "¡Buenos días!";
  if (h < 19) return "¡Buenas tardes!";
  return "¡Buenas noches!";
}

// SALUDO DINÁMICO SEGÚN LA HORA
function badgeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "☀ Buenos días";
  if (h < 19) return "🌤 Buenas tardes";
  return "🌙 Buenas noches";
}

// MINI ROBOT DEL LOGIN (clic = reacción)
const lcRobot = document.getElementById("lcRobot");
if (lcRobot) lcRobot.addEventListener("click", () => {
  lcRobot.classList.remove("excited"); void lcRobot.offsetWidth; lcRobot.classList.add("excited");
  const b = document.getElementById("lcBubble");
  if (b) {
    b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
    b.textContent = ["¡Jeje! 😆", "Bzzzt… ⚡", "¡Vamos! 🚀", "¿Listo? 🤖", "¡Hola! 👋"][Math.floor(Math.random() * 5)];
    b.classList.add("show");
    setTimeout(() => b.classList.remove("show"), 2300);
  }
});

if (matchMedia("(hover:hover)").matches) {
  loginBox.addEventListener("mousemove", e => {
    if (innerWidth < 900) return;
    const r = loginBox.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    loginBox.classList.add("tilting");
    loginBox.style.transform = `perspective(1100px) rotateX(${-y * 2.5}deg) rotateY(${x * 3.5}deg)`;
  });
  loginBox.addEventListener("mouseleave", () => {
    loginBox.classList.remove("tilting");
    loginBox.style.transform = "";
  });
}

function resetLoginStates() {
  loginBox.classList.remove("shake");
  loginSuccess.classList.remove("show");
  emailWrap.classList.remove("valid", "err-state");
  passWrap.classList.remove("err-state");
}

function openLogin() {
  loginModal.classList.add("show");
  const badge = document.getElementById("loginBadge");
  if (badge) badge.textContent = badgeGreeting();
  initLoginParticles();
  resetLoginStates();
  setTimeout(() => loginEmailEl.focus(), 380);
}
document.getElementById("loginClose").onclick = () => loginModal.classList.remove("show");
loginModal.addEventListener("click", e => { if (e.target.id === "loginModal") loginModal.classList.remove("show"); });

// VALIDACIÓN EN VIVO DEL CORREO
loginEmailEl.addEventListener("input", () => {
  emailWrap.classList.toggle("valid", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(loginEmailEl.value.trim()));
});

// MEDIDOR DE FUERZA DE CONTRASEÑA
function passScore(v) {
  let s = 0;
  if (v.length >= 6) s++;
  if (v.length >= 10 || (/\d/.test(v) && /[a-zA-Z]/.test(v))) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/[^a-zA-Z0-9]/.test(v)) s++;
  return Math.min(4, s);
}
loginPassEl.addEventListener("input", () => {
  const v = loginPassEl.value;
  if (!v) { strengthMeter.className = "strength-meter"; strengthLabel.textContent = ""; return; }
  const s = passScore(v);
  strengthMeter.className = "strength-meter on s" + s;
  strengthLabel.textContent = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"][s];
});

// DETECTAR BLOQ MAYÚS
["keydown", "keyup"].forEach(ev => loginPassEl.addEventListener(ev, e => {
  if (e.getModifierState) capsHint.classList.toggle("show", e.getModifierState("CapsLock"));
}));

// REVELAR CONTRASEÑA
document.getElementById("pwToggle").onclick = function () {
  loginPassEl.type = loginPassEl.type === "password" ? "text" : "password";
  this.textContent = loginPassEl.type === "password" ? "👁" : "🙈";
};

// AUTOCOMPLETAR CREDENCIALES DEMO
document.querySelectorAll(".demo-cred").forEach(b => b.onclick = () => {
  loginEmailEl.value = b.dataset.e;
  loginPassEl.value = b.dataset.p; loginPassEl.type = "password";
  document.getElementById("pwToggle").textContent = "👁";
  emailWrap.classList.add("valid"); passWrap.classList.remove("err-state");
  loginPassEl.dispatchEvent(new Event("input"));
  document.querySelectorAll(".demo-cred").forEach(x => x.classList.remove("picked"));
  b.classList.add("picked");
  showToast("Credenciales autocompletadas ✓");
  setTimeout(() => b.classList.remove("picked"), 1200);
});

document.getElementById("forgotLink").addEventListener("click", e => {
  e.preventDefault();
  showToast("Escribe a ventas@robomarket.bo para recuperar tu acceso 🔑");
});
document.getElementById("registerLink").addEventListener("click", e => {
  e.preventDefault();
  showToast("Cuenta demo: usuario@robomarket.bo / user123 😉");
});

// EFECTO RIPPLE EN EL BOTÓN
const loginSubmit = document.getElementById("loginSubmit");
loginSubmit.addEventListener("pointerdown", e => {
  const r = loginSubmit.getBoundingClientRect();
  const rip = document.createElement("span");
  rip.className = "ripple";
  rip.style.left = (e.clientX - r.left) + "px";
  rip.style.top = (e.clientY - r.top) + "px";
  loginSubmit.appendChild(rip);
  setTimeout(() => rip.remove(), 700);
});

// SUBMIT FORMULARIO DE LOGIN
const loginMsgEl = document.getElementById("loginMsg");
function resetLoginBtn() {
  loginSubmit.disabled = false;
  loginSubmit.classList.remove("loading", "ok");
  loginSubmit.querySelector(".btn-text").textContent = "Iniciar sesión";
}

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = loginEmailEl.value.trim().toLowerCase();
  const pass = loginPassEl.value;
  if (!email || !pass) return;

  loginSubmit.disabled = true;
  loginSubmit.classList.add("loading");
  loginSubmit.classList.remove("ok");
  loginMsgEl.textContent = "";
  loginMsgEl.className = "login-msg";

  let u = null;
  try {
    const j = await API.post("login.php", { email, pass });
    u = j.user;
  } catch (err) {
    resetLoginBtn();
    loginMsgEl.textContent = err.message;
    loginMsgEl.className = "login-msg err";
    passWrap.classList.add("err-state");
    setTimeout(() => passWrap.classList.remove("err-state"), 420);
    loginBox.classList.remove("shake");
    void loginBox.offsetWidth;
    loginBox.classList.add("shake");
    return;
  }
  loginSubmit.classList.remove("loading");
  loginSubmit.classList.add("ok");
  loginSubmit.querySelector(".btn-text").textContent = "Acceso concedido";
  loginSuccess.classList.add("show");
  loginAsUser(u);
  setTimeout(() => {
    e.target.reset();
    strengthMeter.className = "strength-meter"; strengthLabel.textContent = "";
    emailWrap.classList.remove("valid");
    resetLoginBtn();
    loginModal.classList.remove("show");
  }, 1250);
});

function loginAsUser(userObj) {
  session = { name: userObj.name, email: userObj.email, role: userObj.role };
  updateAuthUI();
  showToast(`👋 ¡Bienvenido de nuevo, ${session.name}!`);
  openDashboard();
}

function updateAuthUI() {
  const authLabel = document.getElementById("authLabel");
  const authAvatar = document.getElementById("authAvatar");
  if (authLabel) authLabel.textContent = session ? session.name : "Iniciar sesión";
  if (authAvatar) authAvatar.textContent = session ? session.name[0].toUpperCase() : "👤";
  const umName = document.getElementById("userMenuName");
  const umEmail = document.getElementById("userMenuEmail");
  const umAvatar = document.getElementById("userMenuAvatar");
  if (session) {
    const dashAvatar = document.getElementById("dashAvatar");
    if (dashAvatar) dashAvatar.textContent = session.name[0].toUpperCase();
    const dashName = document.getElementById("dashName");
    if (dashName) dashName.textContent = session.name;
    const r = document.getElementById("dashRole");
    if (r) {
      r.textContent = session.role === "admin" ? "Administrador" : "Usuario";
      r.className = "role-badge " + session.role;
    }
    if (umName) umName.textContent = session.name;
    if (umEmail) umEmail.textContent = session.email;
    if (umAvatar) umAvatar.textContent = session.name[0].toUpperCase();
  }
}
function tryLogin() { if (session) { openDashboard(); } else { openLogin(); } }
document.getElementById("loginBtn").onclick = tryLogin;

addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const openFloatEl = document.querySelector(".float-layer.open");
  if (openFloatEl) { openFloatEl.classList.remove("open"); return; }
  if (loginModal.classList.contains("show")) { loginModal.classList.remove("show"); return; }
  if (userModalEl && userModalEl.classList.contains("show")) { userModalEl.classList.remove("show"); return; }
  if (prodModal && prodModal.classList.contains("show")) { prodModal.classList.remove("show"); return; }
  if (!["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName) && dashView.classList.contains("open")) closeDashboard();
});

/* ===== DASHBOARD PRO ===== */
const DASH_PANELS = {
  admin: [
    ["resumen", "📊", "Resumen"],
    ["productos", "📦", "Productos"],
    ["pedidos", "🧾", "Pedidos"],
    ["usuarios", "👥", "Usuarios"],
    ["perfil", "👤", "Mi perfil"]
  ],
  user: [
    ["resumen", "📊", "Resumen"],
    ["pedidos", "🧾", "Mis pedidos"],
    ["perfil", "👤", "Mi perfil"]
  ]
};

const PANEL_META = {
  resumen: { title: "Resumen", crumb: "Vista general" },
  productos: { title: "Gestión de Productos", crumb: "Catálogo · alta, edición y baja" },
  pedidos: { title: "Pedidos", crumb: "Cotizaciones recibidas" },
  usuarios: { title: "Usuarios", crumb: "Cuentas registradas" },
  perfil: { title: "Mi Perfil", crumb: "Datos de tu cuenta" }
};

let currentPanel = "resumen";
async function openDashboard() {
  if (!session) return;
  if (!DASH_PANELS[session.role].some(p => p[0] === currentPanel)) currentPanel = "resumen";
  renderDashMenu();
  renderDashPanel();
  updateAuthUI();
  dashView.classList.add("open");
  document.body.style.overflow = "hidden";
  /* precarga de datos del servidor */
  const jobs = [loadOrders()];
  if (session.role === "admin") jobs.push(loadUsers());
  await Promise.all(jobs);
  if (dashView.classList.contains("open")) { renderDashMenu(); renderDashPanel(); }
}
function closeDashboard() {
  dashView.classList.remove("open");
  document.body.style.overflow = "";
  dashView.classList.remove("side-open");
}
function logout() {
  API.post("logout.php").catch(() => {});
  session = null;
  updateAuthUI();
  closeDashboard();
  showToast("Sesión cerrada correctamente");
}
document.getElementById("logoutBtn").onclick = logout;
document.getElementById("dashToggleBtn").onclick = () => dashView.classList.toggle("side-open");
document.getElementById("dashSideClose").onclick = () => dashView.classList.remove("side-open");
document.getElementById("dashOverlay").onclick = () => dashView.classList.remove("side-open");
document.querySelector(".dash-brand").onclick = e => { e.preventDefault(); closeDashboard(); };

// MODO COLAPSADO (SOLO ESCRITORIO)
document.getElementById("dashCollapseBtn").onclick = () => {
  const c = dashView.classList.toggle("collapsed");
  localStorage.setItem("rm-dash-collapsed", c ? "1" : "0");
};
if (localStorage.getItem("rm-dash-collapsed") === "1" && innerWidth > 900) dashView.classList.add("collapsed");

// RELOJ EN VIVO
setInterval(() => {
  const c = document.getElementById("dashClock");
  if (c) c.innerHTML = `<b>${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</b>`;
}, 1000);

function renderDashMenu() {
  const groups = session.role === "admin"
    ? [["General", ["resumen", "perfil"]], ["Gestión", ["productos", "pedidos", "usuarios"]]]
    : [["General", ["resumen", "perfil"]], ["Actividad", ["pedidos"]]];
  const defs = Object.fromEntries(DASH_PANELS[session.role].map(p => [p[0], p]));
  const pend = getOrders().filter(o => (o.status || "pendiente") === "pendiente").length;
  document.getElementById("dashMenu").innerHTML = groups.map(([label, ids]) =>
    `<div class="menu-label">${label}</div>` +
    ids.map(id => {
      const [, ic, lbl] = defs[id];
      const badge = id === "pedidos" && pend ? `<span class="menu-badge">${pend}</span>` : "";
      return `<button class="${id === currentPanel ? "active" : ""}" onclick="goPanel('${id}')"><i class="dm-ico">${ic}</i><span class="dm-txt">${lbl}</span>${badge}</button>`;
    }).join("")
  ).join("");
}
function goPanel(p) { currentPanel = p; renderDashMenu(); renderDashPanel(); }

/* --- HELPERS DE RENDER --- */
function bs(n) { return "Bs. " + n.toLocaleString("es-BO"); }
function shortBs(n) { return n >= 1000 ? "Bs " + (n / 1000).toFixed(1).replace(".0", "") + "k" : bs(n); }
function emptyState(icon, title, sub) {
  return `<div class="empty-state"><span>${icon}</span><b>${title}</b><p>${sub}</p></div>`;
}
function animateStats(scope) {
  scope.querySelectorAll("[data-count]").forEach(el => {
    const target = parseFloat(el.dataset.count), fmt = el.dataset.fmt || "", dur = 950, t0 = performance.now();
    requestAnimationFrame(function frame(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt === "bs" ? bs(Math.round(target * e)) : Math.round(target * e);
      if (p < 1) requestAnimationFrame(frame);
    });
  });
}
function sparkline(vals, w = 88, h = 34) {
  if (!vals || vals.length < 2) return "";
  const max = Math.max(...vals), min = Math.min(...vals), rng = max - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - 4 - ((v - min) / rng) * (h - 10)}`).join(" ");
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}"/></svg>`;
}
function statCard(icon, label, value, o = {}) {
  const raw = typeof value === "number";
  const shown = raw ? (o.fmt === "bs" ? bs(value) : value) : value;
  return `<div class="stat-card"><span class="stat-ico">${icon}</span>
    <div class="stat-body"><small>${label}</small>
      <b ${raw ? `data-count="${value}" data-fmt="${o.fmt || ""}"` : ""}>${shown}</b>
      ${o.note ? `<em class="trend-chip ${o.tone || "flat"}">${o.note}</em>` : ""}
    </div>${o.spark ? sparkline(o.spark) : ""}</div>`;
}
function helloGreeting() { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; }
function fullDateES() { return new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, c => c.toUpperCase()); }

const SALES_SERIES = [13200, 16800, 20500, 24300, 28700, 32100, 36900];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"];
let scenarioBoost = 1, metaPct = 76;
function simulateScenario() {
  scenarioBoost = scenarioBoost === 1 ? 1.24 : 1;
  metaPct = scenarioBoost === 1 ? 76 : 88;
  renderDashPanel();
  showToast(scenarioBoost === 1 ? "↩ Escenario base restaurado" : "🚀 Escenario optimista aplicado (+24%)");
}

function areaChartSVG(series) {
  const W = 560, H = 200, PX = 18, PY = 30;
  const max = Math.max(...series) * 1.12;
  const pts = series.map((v, i) => [PX + i * (W - 2 * PX) / (series.length - 1), H - PY - (v / max) * (H - 2 * PY)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i], [px, py] = pts[i - 1];
    d += ` Q${px},${py} ${(px + x) / 2},${(py + y) / 2}`;
  }
  d += ` L${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  const area = d + ` L${pts[pts.length - 1][0]},${H - 8} L${pts[0][0]},${H - 8} Z`;
  return `<svg viewBox="0 0 ${W} ${H}">
    <path class="chart-area" d="${area}"/>
    <path class="chart-line" d="${d}"/>
    ${pts.map((p, i) => `<g class="pt"><circle class="chart-dot" style="animation-delay:${(.7 + i * .12).toFixed(2)}s" cx="${p[0]}" cy="${p[1]}" r="5"/><text x="${p[0]}" y="${p[1] - 13}">${shortBs(series[i])}</text></g>`).join("")}
    ${MONTHS.map((m, i) => `<text class="chart-x" x="${pts[i][0]}" y="${H - 6}">${m}</text>`).join("")}
  </svg>`;
}
function ringSVG(pct) {
  const C = 283;
  return `<div class="ring-wrap"><svg width="158" height="158" viewBox="0 0 120 120">
    <circle class="ring-track" cx="60" cy="60" r="45"/>
    <circle class="ring-val" cx="60" cy="60" r="45" style="--ringTarget:${(C * (1 - pct / 100)).toFixed(1)}"/>
    <text class="ring-center" x="60" y="62" text-anchor="middle">${pct}%</text>
    <text class="ring-center-sub" x="60" y="78" text-anchor="middle">ALCANZADO</text>
  </svg></div>`;
}

const SVG_DEFS = `<svg width="0" height="0" style="position:absolute"><defs>
  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a855f7"/><stop offset=".55" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient>
  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a855f7" stop-opacity=".35"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a855f7"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
</defs></svg>`;

function renderDashPanel() {
  const meta = PANEL_META[currentPanel];
  document.getElementById("dashTitle").textContent =
    currentPanel === "pedidos" && session.role === "user" ? "Mis Pedidos" : meta.title;
  document.getElementById("dashBreadcrumb").innerHTML =
    `Panel ${session.role === "admin" ? "Admin" : "de Usuario"} <b>·</b> ${meta.crumb}`;
  const c = document.getElementById("dashContent");
  let html = "";
  if (currentPanel === "productos") html = adminProductosHTML();
  else if (currentPanel === "pedidos") html = pedidosHTML();
  else if (currentPanel === "usuarios") html = usuariosHTML();
  else if (currentPanel === "perfil") html = perfilHTML();
  else html = session.role === "admin" ? adminResumenHTML() : userResumenHTML();
  c.innerHTML = SVG_DEFS + html;
  animateStats(c);
  renderQuickStats();
}

/* --- ESTADÍSTICAS RÁPIDAS DEL SIDEBAR --- */
function renderQuickStats() {
  const qs = document.getElementById("dashQuickStats");
  if (!qs || !session) return;
  if (session.role === "admin") {
    const orders = getOrders(), total = orders.reduce((s, o) => s + o.total, 0);
    qs.innerHTML = `<div class="qs-card"><small>Ventas</small><b>${shortBs(total)}</b></div>
      <div class="qs-card"><small>Pedidos</small><b>${orders.length}</b></div>`;
  } else {
    const mine = getOrders().filter(o => o.user === session.email), spent = mine.reduce((s, o) => s + o.total, 0);
    qs.innerHTML = `<div class="qs-card"><small>Pedidos</small><b>${mine.length}</b></div>
      <div class="qs-card"><small>Cotizado</small><b>${shortBs(spent)}</b></div>`;
  }
}

/* --- BÚSQUEDA GLOBAL DEL PANEL (Ctrl+K) --- */
const dashSearchInput = document.getElementById("dashSearchInput");
dashSearchInput.addEventListener("input", () => {
  const q = dashSearchInput.value.trim();
  if (currentPanel === "productos") { prodQuery = q; renderDashPanel(); refocusProd(); }
  else if (currentPanel === "pedidos") { orderQuery = q; renderDashPanel(); }
  else if (q.length >= 2) {
    const ql = q.toLowerCase();
    if (session.role === "admin" && products.some(p => (p.name + " " + p.desc + " " + p.type).toLowerCase().includes(ql))) {
      currentPanel = "productos"; prodQuery = q; renderDashMenu(); renderDashPanel();
      showToast(`Productos encontrados para "${q}"`);
    } else if (getOrders().some(o => (o.id + " " + o.user + " " + o.summary).toLowerCase().includes(ql))) {
      currentPanel = "pedidos"; orderQuery = q; renderDashMenu(); renderDashPanel();
      showToast(`Pedidos encontrados para "${q}"`);
    }
  }
});
addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && dashView.classList.contains("open")) {
    e.preventDefault();
    dashSearchInput.focus(); dashSearchInput.select();
  }
});

/* --- NOTIFICACIONES --- */
let NOTIFS = (() => {
  try { const n = JSON.parse(localStorage.getItem("rm-notifs")); return Array.isArray(n) ? n : null; }
  catch (e) { return null; }
})() || [{ i: "👋", t: "¡Bienvenido a RoboMarket!", s: "Explora tu nuevo panel de control.", read: false }];
function saveNotifs() { localStorage.setItem("rm-notifs", JSON.stringify(NOTIFS.slice(0, 12))); }
function renderNotifs() {
  const list = document.getElementById("notifyList"), badge = document.getElementById("notifyBadge");
  if (!list || !badge) return;
  const unread = NOTIFS.filter(n => !n.read).length;
  badge.hidden = unread === 0;
  badge.textContent = unread;
  list.innerHTML = NOTIFS.length ? NOTIFS.map(n =>
    `<div class="notify-item ${n.read ? "" : "unread"}"><span class="ni-ico">${n.i}</span><div><b>${n.t}</b><small>${n.s}</small></div></div>`
  ).join("") : `<div class="notify-empty"><span>🔔</span>No tienes notificaciones nuevas</div>`;
}
function pushNotif(icon, title, sub) {
  NOTIFS.unshift({ i: icon, t: title, s: sub, read: false });
  NOTIFS = NOTIFS.slice(0, 12);
  saveNotifs(); renderNotifs();
  const b = document.getElementById("notifyBadge");
  b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}
document.getElementById("notifyClear").onclick = () => {
  NOTIFS.forEach(n => n.read = true);
  saveNotifs(); renderNotifs();
  showToast("Notificaciones marcadas como leídas ✓");
};
const notifyDropdown = document.getElementById("notifyDropdown");
const userDropdown = document.getElementById("userDropdown");
document.getElementById("notifyBtn").onclick = e => { e.stopPropagation(); notifyDropdown.classList.toggle("open"); userDropdown.classList.remove("open"); };
document.getElementById("userMenuBtn").onclick = e => { e.stopPropagation(); userDropdown.classList.toggle("open"); notifyDropdown.classList.remove("open"); };
document.addEventListener("click", e => {
  if (!e.target.closest("#dashNotifications")) notifyDropdown.classList.remove("open");
  if (!e.target.closest("#dashUserMenu")) userDropdown.classList.remove("open");
});
document.getElementById("ddPerfil").onclick = e => { e.preventDefault(); userDropdown.classList.remove("open"); goPanel("perfil"); };
document.getElementById("ddConfig").onclick = e => {
  e.preventDefault();
  userDropdown.classList.remove("open");
  goPanel("perfil");
  showToast("⚙ Ajustes: edita tus datos o cambia tu contraseña");
};
document.getElementById("ddLogout").onclick = () => logout();

/* --- ESTADOS DE PEDIDO --- */
const STATUS_FLOW = ["pendiente", "proceso", "done"];
const STATUS_META = {
  pendiente: { cls: "pending", icon: "⏳", label: "Cotizado" },
  proceso: { cls: "proceso", icon: "🔧", label: "En proceso" },
  done: { cls: "done", icon: "✅", label: "Completado" }
};
async function cycleOrderStatus(id) {
  const o = getOrders().find(x => x.id == id);
  if (!o) return;
  const next = STATUS_FLOW[(STATUS_FLOW.indexOf(o.status || "pendiente") + 1) % STATUS_FLOW.length];
  try {
    await API.put("orders.php?id=" + id, { status: next });
    await loadOrders();
    renderDashPanel();
    showToast(`Pedido #${id} → ${STATUS_META[next].label}`);
  } catch (err) { showToast(err.message + " ✗"); }
}

function typePill(t) {
  const map = { vision: "Visión IA", industrial: "Industrial", collaborative: "Colaborativo" };
  return `<span class="type-pill ${t}">${map[t] || t}</span>`;
}

function ordersTable(list, interactive) {
  return `<div class="table-scroll"><table class="dtable"><thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Detalle</th><th>Total</th><th>Estado</th>${interactive ? "<th>Acciones</th>" : ""}</tr></thead><tbody>
  ${list.map(o => {
    const st = STATUS_META[o.status || "pendiente"];
    return `<tr><td><b>#${o.id}</b></td><td>${o.date}</td><td>${o.user}</td><td>${o.summary}</td><td><b>${bs(o.total)}</b></td><td><span class="status ${st.cls}${interactive ? " clickable" : ""}" ${interactive ? `title="Clic para avanzar el estado" onclick="cycleOrderStatus('${o.id}')"` : ""} ${interactive ? `data-status="${o.status || "pendiente"}"` : ""}>${st.icon} ${st.label}</span></td>${interactive ? `<td style="white-space:nowrap"><button class="del-btn" onclick="delOrder('${o.id}',this)">Eliminar</button></td>` : ""}</tr>`;
  }).join("")}
  </tbody></table></div>`;
}
async function delOrder(id, btn) {
  if (btn.dataset.armed !== "1") {
    btn.dataset.armed = "1"; btn.textContent = "¿Confirmar?"; btn.classList.add("armed");
    setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = "0"; btn.textContent = "Eliminar"; btn.classList.remove("armed"); } }, 2600);
    return;
  }
  const o = getOrders().find(x => x.id == id);
  try {
    await API.del("orders.php?id=" + id);
    await loadOrders();
    renderDashPanel();
    showToast(`Pedido #${id} eliminado`);
    pushNotif("🗑️", `Pedido #${id} eliminado`, o ? `Cliente: ${o.user}` : "Registro eliminado por el administrador");
  } catch (err) { showToast(err.message + " ✗"); }
}

function adminResumenHTML() {
  const orders = getOrders();
  const total = orders.reduce((s, o) => s + o.total, 0);
  const pendientes = orders.filter(o => (o.status || "pendiente") === "pendiente").length;
  const admins = USERS.filter(u => u.role === "admin").length;
  const series = SALES_SERIES.map(v => Math.round(v * scenarioBoost));
  return `
  <div class="hello-card">
    <div><h3>${helloGreeting()}, ${session.name.split(" ")[0]} 👋</h3>
      <p>${fullDateES()} · Esto es lo que está pasando en RoboMarket hoy.</p></div>
    <div class="hello-actions">
      <button class="btn primary small" onclick="newProductFlow()">＋ Nuevo producto</button>
      <button class="btn ghost small" onclick="goPanel('pedidos')">Ver pedidos</button>
      <button class="btn ghost small" onclick="simulateScenario()">🎲 Simular escenario</button>
    </div>
  </div>
  <div class="stat-grid">
    ${statCard("💰", "Ventas totales", total, { fmt: "bs", tone: "up", note: "↗ +18.4% este mes", spark: [12, 18, 15, 22, 26, 31, 38] })}
    ${statCard("🧾", "Pedidos", orders.length, { tone: pendientes ? "down" : "up", note: pendientes ? `⏳ ${pendientes} por gestionar` : "✓ Todo al día", spark: [3, 5, 4, 7, 6, 9, Math.max(2, orders.length)] })}
    ${statCard("📦", "Productos activos", products.length, { tone: "flat", note: "Catálogo actualizado ✓" })}
    ${statCard("👥", "Usuarios registrados", USERS.length, { tone: "flat", note: `${admins} admin · ${USERS.length - admins} usuario(s)` })}
  </div>
  <div class="dash-cols">
    <section class="dash-card-lg chart-card">
      <div class="card-head"><h4>Ventas proyectadas · semestre</h4><span class="chip up">↗ +18.4%</span></div>
      ${areaChartSVG(series)}
    </section>
    <section class="dash-card-lg">
      <div class="card-head"><h4>Meta comercial anual</h4><span class="chip">2026</span></div>
      ${ringSVG(metaPct)}
      <ul class="mini-legend">
        <li><i class="dot c1"></i>Alcanzado<b>Bs. ${Math.round(225000 * metaPct / 100).toLocaleString("es-BO")}</b></li>
        <li><i class="dot c2"></i>Restante<b>Bs. ${Math.round(225000 * (1 - metaPct / 100)).toLocaleString("es-BO")}</b></li>
      </ul>
      <button class="btn primary small w100" onclick="simulateScenario()">🎲 Simular escenario optimista</button>
    </section>
  </div>
  <section class="dash-card-lg">
    <div class="card-head"><h4>Pedidos recientes</h4><span class="chip up">● En vivo</span><button class="btn small ghost" style="margin-left:auto" onclick="goPanel('pedidos')">Ver todos →</button></div>
    ${orders.length ? ordersTable(orders.slice(0, 4), true) : emptyState("📭", "Aún no hay pedidos", "Cuando un cliente solicite una cotización desde el catálogo, aparecerá aquí en tiempo real.")}
  </section>`;
}

function userResumenHTML() {
  const mine = getOrders().filter(o => o.user === session.email);
  const spent = mine.reduce((s, o) => s + o.total, 0);
  return `
  <div class="hello-card">
    <div><h3>${helloGreeting()}, ${session.name.split(" ")[0]} 👋</h3>
      <p>${fullDateES()} · Gracias por ser parte de RoboMarket.</p></div>
    <div class="hello-actions">
      <button class="btn primary small" onclick="exitToCatalog()">🛒 Explorar catálogo</button>
      <button class="btn ghost small" onclick="goPanel('pedidos')">Mis pedidos</button>
    </div>
  </div>
  <div class="stat-grid">
    ${statCard("🧾", "Mis pedidos", mine.length, { tone: mine.length ? "up" : "flat", note: mine.length ? "Historial disponible" : "Realiza tu primer pedido" })}
    ${statCard("💰", "Total cotizado", spent, { fmt: "bs", tone: "flat", note: "Acumulado histórico" })}
    ${statCard("🤖", "Modelos disponibles", products.length, { tone: "flat", note: "Listos para cotizar" })}
  </div>
  <section class="dash-card-lg">
    <div class="card-head"><h4>Mis solicitudes de cotización</h4><span class="chip">${mine.length} registro(s)</span></div>
    ${mine.length ? ordersTable(mine) : emptyState("🗂️", "Todavía no tienes pedidos", "Explora el catálogo y solicita tu primera cotización en segundos.")}
  </section>`;
}

function exitToCatalog() {
  closeDashboard();
  setTimeout(() => document.getElementById("productos").scrollIntoView({ behavior: "smooth" }), 250);
}
function newProductFlow() {
  goPanel("productos");
  lastFloatAction = Date.now();
  setTimeout(() => openFloat("prodFloat"), 400);
}

let prodQuery = "";
let orderQuery = "";
let prodType = "";
function refocusProd() {
  const s = document.getElementById("prodSearch");
  if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
}
const TYPE_LABELS = { vision: "Visión IA", industrial: "Industrial", collaborative: "Colaborativo" };
function adminProductosHTML() {
  const list = products.filter(p =>
    (p.name + " " + p.desc + " " + p.type).toLowerCase().includes(prodQuery.toLowerCase()) &&
    (!prodType || p.type === prodType));
  return `
  <div class="float-layer" id="prodFloat">
    <div class="float-bk" onclick="closeFloat('prodFloat')"></div>
    <div class="float-card">
      <div class="ff-head"><b><i class="ff-ico">📦</i> Nuevo producto</b><button type="button" class="icon-btn ff-close" onclick="closeFloat('prodFloat')">✕</button></div>
      <form id="prodForm" class="prod-form float-grid">
        <input required name="name" placeholder="Nombre del producto" class="f-name">
        <select name="type"><option value="vision">Visión artificial</option><option value="industrial">Industrial</option><option value="collaborative">Colaborativo</option></select>
        <input required name="price" type="number" min="1" placeholder="Precio (Bs.)">
        <input name="tag" placeholder="Etiqueta (ej. NUEVO)">
        <textarea name="desc" rows="2" required placeholder="Descripción corta..."></textarea>
        <button class="btn primary f-btn" type="submit">Agregar al catálogo ✓</button>
      </form>
    </div>
  </div>
  <section class="dash-card-lg">
    <div class="table-head">
      <h4>Catálogo (${list.length}/${products.length})</h4>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="prodTypeSel" class="table-search" style="width:auto;cursor:pointer">
          <option value="">Todos los tipos</option>
          ${Object.entries(TYPE_LABELS).map(([k, v]) => `<option value="${k}"${prodType === k ? " selected" : ""}>${v}</option>`).join("")}
        </select>
        <input id="prodSearch" class="table-search" placeholder="🔍 Buscar producto..." value="${prodQuery}">
        <button class="btn small ghost" data-csv="productos" title="Exportar catálogo a CSV">⬇ CSV</button>
        <button class="btn primary small" onclick="openFloat('prodFloat')">＋ Nuevo producto</button>
      </div>
    </div>
    <div class="table-scroll"><table class="dtable"><thead><tr><th>Producto</th><th>Tipo</th><th>Etiqueta</th><th>Precio</th><th>Acciones</th></tr></thead><tbody>
    ${list.length ? list.map(p => `<tr><td><b>${p.name}</b><br><small style="color:var(--muted)">${p.desc || ""}</small></td><td>${typePill(p.type)}</td><td>${p.tag || "—"}</td><td><b>${bs(p.price || 0)}</b></td><td style="white-space:nowrap"><button class="edit-btn" onclick="editProduct(${p.id})">✎ Editar</button> <button class="del-btn" onclick="delProduct(${p.id},this)">Eliminar</button></td></tr>`).join("") : `<tr><td colspan="5">${emptyState("🔍", "Sin resultados", prodType ? `No hay productos "${TYPE_LABELS[prodType]}" que coincidan.` : `No encontramos productos para "${prodQuery}".`)}</td></tr>`}
    </tbody></table></div>
  </section>`;
}

function pedidosHTML() {
  const all = getOrders();
  const q = orderQuery.trim().toLowerCase();
  const orders = q ? all.filter(o => (o.id + " " + o.user + " " + o.summary).toLowerCase().includes(q)) : all;
  const income = all.reduce((s, o) => s + o.total, 0);
  const ticket = all.length ? Math.round(income / all.length) : 0;
  const pend = all.filter(o => (o.status || "pendiente") === "pendiente").length;
  return `
  ${session.role === "admin" ? `
  <div class="float-layer" id="orderFloat">
    <div class="float-bk" onclick="closeFloat('orderFloat')"></div>
    <div class="float-card">
      <div class="ff-head"><b><i class="ff-ico">🧾</i> Nuevo pedido</b><button type="button" class="icon-btn ff-close" onclick="closeFloat('orderFloat')">✕</button></div>
      <form id="orderForm" class="prod-form float-grid">
        <input required name="user" type="email" placeholder="Correo del cliente" spellcheck="false">
        <input required name="summary" placeholder="Detalle (ej. Brazo KR-410 x2)">
        <input required name="total" type="number" min="1" placeholder="Total (Bs.)">
        <select name="status"><option value="pendiente">Estado: Pendiente</option><option value="proceso">Estado: En proceso</option><option value="done">Estado: Completado</option></select>
        <button class="btn primary f-btn" type="submit">Registrar pedido ✓</button>
      </form>
    </div>
  </div>` : ""}
  <div class="stat-grid">
    ${statCard("💰", "Ingresos cotizados", income, { fmt: "bs", tone: "up", note: `${all.length} pedido(s)` })}
    ${statCard("🎫", "Ticket promedio", ticket, { fmt: "bs", tone: "flat", note: "Valor por pedido" })}
    ${statCard("⏳", "Por gestionar", pend, { tone: pend ? "down" : "up", note: pend ? "Requieren atención" : "Todo gestionado ✓" })}
  </div>
  <section class="dash-card-lg">
    <div class="table-head">
      <h4>${q ? `Resultados para "${orderQuery}"` : `Todos los pedidos (${all.length})`}</h4>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="chip">Clic en el estado para avanzarlo →</span>
        <select id="orderStatusSel" class="table-search" style="width:auto;cursor:pointer">
          <option value="">Todos los estados</option>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="proceso">⚙ En proceso</option>
          <option value="done">✓ Completado</option>
        </select>
        <button class="btn small ghost" data-csv="pedidos" title="Exportar pedidos a CSV">⬇ CSV</button>
        ${session.role === "admin" ? `<button class="btn primary small" onclick="openFloat('orderFloat')">＋ Nuevo pedido</button>` : ""}
      </div>
    </div>
    ${orders.length ? ordersTable(orders, true) : emptyState("🔎", "Sin coincidencias", "Prueba con otro código, cliente o detalle de pedido.")}
  </section>`;
}

function usuariosHTML() {
  const admins = USERS.filter(u => u.role === "admin").length;
  return `
  <div class="stat-grid">
    ${statCard("👥", "Usuarios totales", USERS.length, { tone: "up", note: "Cuentas registradas" })}
    ${statCard("👑", "Administradores", admins, { tone: "flat", note: "Acceso total al panel" })}
    ${statCard("👤", "Estándar", USERS.length - admins, { tone: "flat", note: "Catálogo y pedidos" })}
  </div>
  <div class="float-layer" id="userFloat">
    <div class="float-bk" onclick="closeFloat('userFloat')"></div>
    <div class="float-card">
      <div class="ff-head"><b><i class="ff-ico">👤</i> Nuevo usuario</b><button type="button" class="icon-btn ff-close" onclick="closeFloat('userFloat')">✕</button></div>
      <form id="userForm" class="prod-form float-grid">
        <input required name="name" placeholder="Nombre completo" class="f-name">
        <input required type="email" name="email" placeholder="Correo electrónico" spellcheck="false">
        <select name="role"><option value="user">Rol: Usuario</option><option value="admin">Rol: Administrador</option></select>
        <input required type="password" name="pass" placeholder="Contraseña (mín. 6)" autocomplete="new-password">
        <button class="btn primary f-btn" type="submit">Crear usuario ✓</button>
      </form>
    </div>
  </div>
  <section class="dash-card-lg">
    <div class="card-head"><h4>Cuentas registradas (${USERS.length})</h4>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="chip up">● Gestión completa</span>
        <button class="btn small ghost" data-csv="usuarios" title="Exportar usuarios a CSV">⬇ CSV</button>
        <button class="btn primary small" onclick="openFloat('userFloat')">＋ Nuevo usuario</button>
      </div>
    </div>
    <div class="table-scroll"><table class="dtable"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
  ${USERS.map(u => {
    const self = session && u.email === session.email;
    return `<tr><td><span class="u-cell"><span class="u-avatar">${(u.name[0] || "?").toUpperCase()}</span><b>${u.name}${self ? ' <span class="chip" style="margin-left:6px;font-size:9px;padding:2px 8px">TÚ</span>' : ""}</b></span></td><td>${u.email}</td><td><i class="role-badge ${u.role}">${u.role === "admin" ? "Administrador" : "Usuario"}</i></td><td><span class="u-dot"></span> Activo</td><td style="white-space:nowrap"><button class="edit-btn" onclick="editUser('${u.email}')">✎ Editar</button> <button class="del-btn" onclick="delUser('${u.email}',this)">Eliminar</button></td></tr>`;
  }).join("")}
  </tbody></table></div>
  </section>`;
}

const userModalEl = document.getElementById("userModal");
let selfEdit = false;
function openUserModal(mode, origEmail) {
  const f = document.getElementById("userEditForm");
  const msg = document.getElementById("userMsg");
  msg.textContent = ""; msg.className = "login-msg";
  f.reset();
  selfEdit = mode === "self";
  if (mode === "self" || mode === "edit") {
    const u = USERS.find(x => x.email === (mode === "self" ? session.email : origEmail));
    if (!u) return;
    document.getElementById("userModalTitle").textContent = mode === "self" ? "Editar mi perfil" : "Editar usuario";
    document.getElementById("userSaveBtn").textContent = "Guardar cambios ✓";
    f.elements.origEmail.value = u.email;
    f.elements.name.value = u.name;
    f.elements.email.value = u.email;
    f.elements.role.value = u.role;
    f.elements.pass.placeholder = "(sin cambios)";
  } else {
    document.getElementById("userModalTitle").textContent = "Nuevo usuario";
    document.getElementById("userSaveBtn").textContent = "Crear usuario ✓";
    f.elements.origEmail.value = "";
    f.elements.pass.placeholder = "Mínimo 6 caracteres";
  }
  userModalEl.classList.add("show");
  setTimeout(() => f.elements.name.focus(), 250);
}
function editUser(email) { openUserModal("edit", email); }
document.getElementById("userClose").onclick = () => userModalEl.classList.remove("show");
document.getElementById("userCancel").onclick = () => userModalEl.classList.remove("show");
userModalEl.addEventListener("click", e => { if (e.target.id === "userModal") userModalEl.classList.remove("show"); });
document.getElementById("userEditForm").addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const orig = fd.get("origEmail");
  const name = fd.get("name").trim();
  const email = fd.get("email").trim().toLowerCase();
  const role = fd.get("role");
  const pass = fd.get("pass");
  const msg = document.getElementById("userMsg");
  const fail = t => { msg.textContent = t; msg.className = "login-msg err"; };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Ingresa un correo electrónico válido.");
  if (pass && pass.length < 6) return fail("La contraseña debe tener al menos 6 caracteres.");

  const btn = document.getElementById("userSaveBtn");
  btn.disabled = true;
  API.put("users.php?email=" + encodeURIComponent(orig), { name, email, role, pass: pass || undefined })
    .then(async () => {
      await loadUsers();
      if (orig === session.email) {
        try { session = (await API.get("me.php")).user || session; } catch (err) {}
      }
      userModalEl.classList.remove("show");
      updateAuthUI();
      renderDashPanel();
      showToast(`Usuario "${name}" actualizado correctamente ✓`);
      pushNotif("✏️", `Usuario editado: ${name}`, `Rol actual: ${role === "admin" ? "Administrador" : "Usuario"}`);
    })
    .catch(err => fail(err.message))
    .finally(() => { btn.disabled = false; });
});
async function delUser(email, btn) {
  if (email === session.email) { showToast("No puedes eliminar tu propia cuenta ⚠"); return; }
  const u = USERS.find(x => x.email === email);
  if (!u) return;
  if (btn.dataset.armed !== "1") {
    btn.dataset.armed = "1"; btn.textContent = "¿Confirmar?"; btn.classList.add("armed");
    setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = "0"; btn.textContent = "Eliminar"; btn.classList.remove("armed"); } }, 2600);
    return;
  }
  try {
    await API.del("users.php?email=" + encodeURIComponent(email));
    await loadUsers();
    renderDashPanel();
    showToast(`Cuenta de ${u.name} eliminada`);
    pushNotif("🗑️", `Usuario eliminado: ${u.name}`, `Correo liberado: ${email}`);
  } catch (err) { showToast(err.message + " ✗"); }
}

function perfilHTML() {
  const mine = getOrders().filter(o => o.user === session.email);
  return `<div class="dash-cols">
   <section class="dash-card-lg">
    <div class="perfil-top">
      <span class="dash-avatar big">${session.name[0].toUpperCase()}</span>
      <div><b id="pfName">${session.name}</b><br><small style="color:var(--muted)" id="pfEmail">${session.email}</small><br><i class="role-badge ${session.role}" id="pfRole" style="margin-top:6px;display:inline-block">${session.role === "admin" ? "Administrador" : "Usuario"}</i></div>
    </div>
    <div class="hello-actions" style="margin-top:18px">
      <button class="btn primary small" onclick="openUserModal('self')">✎ Editar mi perfil</button>
      <button class="btn ghost small" onclick="toggleTheme()">◐ Cambiar tema</button>
      <button class="btn ghost small" onclick="logout()">⏻ Cerrar sesión</button>
    </div>
   </section>
   <section class="dash-card-lg">
    <h4>Detalles de cuenta</h4>
    <ul class="perfil-info">
      <li><span>Miembro desde</span><b>Agosto 2026</b></li>
      <li><span>Pedidos realizados</span><b>${mine.length}</b></li>
      <li><span>Total cotizado</span><b>${bs(mine.reduce((s, o) => s + o.total, 0))}</b></li>
      <li><span>Sesión</span><b style="color:#4ee3a0">Activa ✓</b></li>
    </ul>
   </section>
   <section class="dash-card-lg w100-col">
    <h4>🔐 Seguridad · Cambiar contraseña</h4>
    <form id="passForm" class="prod-form" style="grid-template-columns:repeat(3,1fr)">
      <input required type="password" name="cur" placeholder="Contraseña actual" autocomplete="current-password">
      <input required type="password" name="new1" placeholder="Nueva contraseña (mín. 6)" minlength="6" autocomplete="new-password">
      <input required type="password" name="new2" placeholder="Repetir nueva contraseña" autocomplete="new-password">
      <button class="btn primary f-btn" type="submit" style="grid-column:span 3">Actualizar contraseña ✓</button>
    </form>
   </section>
  </div>`;
}

const IMGS_POOL = ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80", "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=700&q=80", "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=700&q=80"];
async function addProduct(fd) {
  const data = {
    name: fd.get("name"), type: fd.get("type"), tag: fd.get("tag"),
    price: +fd.get("price") || 0, desc: fd.get("desc"),
    img: IMGS_POOL[Math.floor(Math.random() * IMGS_POOL.length)],
    features: ["Configuración personalizada"]
  };
  try {
    await API.post("products.php", data);
    await loadProducts();
    renderDashPanel();
    showToast("Producto agregado al catálogo ✓");
    pushNotif("📦", `Producto agregado: ${data.name}`, "Ya está visible en el catálogo público");
  } catch (e) { showToast(e.message + " ✗"); }
}
let editingId = null;
function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  const f = document.getElementById("prodEditForm");
  f.elements.name.value = p.name || "";
  f.elements.type.value = p.type || "industrial";
  f.elements.tag.value = p.tag || "";
  f.elements.price.value = p.price || 0;
  f.elements.desc.value = p.desc || "";
  prodModal.classList.add("show");
}
document.getElementById("prodClose").onclick = () => prodModal.classList.remove("show");
document.getElementById("prodCancel").onclick = () => prodModal.classList.remove("show");
prodModal.addEventListener("click", e => { if (e.target.id === "prodModal") prodModal.classList.remove("show"); });
document.getElementById("prodEditForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p = products.find(x => x.id === editingId);
  if (!p) return;
  const fd = new FormData(e.target);
  const data = {
    name: fd.get("name"), type: fd.get("type"), tag: (fd.get("tag") || "").toUpperCase(),
    price: +fd.get("price") || 0, desc: fd.get("desc")
  };
  try {
    await API.put("products.php?id=" + editingId, data);
    await loadProducts();
    renderDashPanel();
    prodModal.classList.remove("show");
    showToast(`"${data.name}" actualizado correctamente ✓`);
  } catch (err) { showToast(err.message + " ✗"); }
});
async function delProduct(id, btn) {
  if (btn.dataset.armed !== "1") {
    btn.dataset.armed = "1"; btn.textContent = "¿Confirmar?"; btn.classList.add("armed");
    setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = "0"; btn.textContent = "Eliminar"; btn.classList.remove("armed"); } }, 2600);
    return;
  }
  const name = (products.find(p => p.id === id) || {}).name || "Producto";
  try {
    await API.del("products.php?id=" + id);
    await loadProducts();
    renderDashPanel();
    showToast(`${name} eliminado del catálogo`);
    pushNotif("🗑️", `Producto eliminado: ${name}`, "El catálogo público fue actualizado");
  } catch (err) { showToast(err.message + " ✗"); }
}
let lastFloatAction = 0;
function openFloat(id) {
  const now = Date.now();
  if (now - lastFloatAction < 220) return;
  lastFloatAction = now;
  const el = document.getElementById(id);
  if (!el || el.classList.contains("open")) return;
  document.querySelectorAll(".float-layer.open").forEach(f => f.classList.remove("open"));
  el.classList.add("open");
  setTimeout(() => el.querySelector("input,select,textarea")?.focus(), 300);
}
function closeFloat(id) {
  lastFloatAction = Date.now();
  document.getElementById(id)?.classList.remove("open");
}
function closeAllFloats() { document.querySelectorAll(".float-layer.open").forEach(f => f.classList.remove("open")); }

function downloadCSV(name, rows) {
  const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
const CSV_BUILDERS = {
  productos: () => ({
    file: `robomarket-catalogo-${Date.now()}.csv`,
    rows: [["Nombre", "Tipo", "Etiqueta", "Precio (Bs.)", "Descripción"],
      ...products.map(p => [p.name, TYPE_LABELS[p.type] || p.type, p.tag || "", p.price || 0, p.desc || ""])]
  }),
  pedidos: () => ({
    file: `robomarket-pedidos-${Date.now()}.csv`,
    rows: [["Código", "Fecha", "Cliente", "Detalle", "Total (Bs.)", "Estado"],
      ...getOrders().map(o => [`#${o.id}`, o.date, o.user, o.summary, o.total, STATUS_META[o.status || "pendiente"].label])]
  }),
  usuarios: () => ({
    file: `robomarket-usuarios-${Date.now()}.csv`,
    rows: [["Nombre", "Correo", "Rol"],
      ...USERS.map(u => [u.name, u.email, u.role === "admin" ? "Administrador" : "Usuario"])]
  })
};
document.getElementById("dashContent").addEventListener("click", e => {
  const btn = e.target.closest("[data-csv]");
  if (!btn) return;
  const build = CSV_BUILDERS[btn.dataset.csv];
  if (!build) return;
  const { file, rows } = build();
  downloadCSV(file, rows);
  showToast(`📄 ${file} descargado`);
});

document.getElementById("dashContent").addEventListener("input", e => {
  if (e.target.id === "prodSearch") {
    prodQuery = e.target.value;
    renderDashPanel();
    refocusProd();
  }
});
document.getElementById("dashContent").addEventListener("change", e => {
  if (e.target.id === "prodTypeSel") {
    prodType = e.target.value;
    renderDashPanel();
  }
  if (e.target.id === "orderStatusSel") {
    orderQuery = "";
    const v = e.target.value;
    if (v) document.querySelectorAll("#dashContent .status.clickable").forEach(s => {
      const row = s.closest("tr");
      row.style.display = s.dataset.status === v ? "" : "none";
    });
    else document.querySelectorAll("#dashContent .status.clickable").forEach(s => s.closest("tr").style.display = "");
  }
});
document.getElementById("dashContent").addEventListener("submit", e => {
  if (e.target.id === "prodForm") {
    e.preventDefault();
    addProduct(new FormData(e.target));
    e.target.reset();
    closeFloat("prodFloat");
  }
  if (e.target.id === "userForm") {
    e.preventDefault();
    (async () => {
      const fd = new FormData(e.target);
      try {
        await API.post("users.php", {
          name: fd.get("name").trim(),
          email: fd.get("email").trim().toLowerCase(),
          pass: fd.get("pass"),
          role: fd.get("role")
        });
        await loadUsers();
        renderDashPanel();
        showToast(`Usuario "${fd.get("name").trim()}" creado ✓`);
        pushNotif("👤", "Nuevo usuario registrado", `${fd.get("name").trim()} · rol ${fd.get("role") === "admin" ? "Administrador" : "Usuario"}`);
        closeFloat("userFloat");
      } catch (err) { showToast(err.message + " ✗"); }
    })();
  }
  if (e.target.id === "orderForm") {
    e.preventDefault();
    (async () => {
      const fd = new FormData(e.target);
      try {
        await API.post("orders.php", {
          user: fd.get("user").trim(),
          summary: fd.get("summary").trim(),
          total: +fd.get("total") || 0,
          status: fd.get("status") || "pendiente"
        });
        await loadOrders();
        renderDashPanel();
        closeFloat("orderFloat");
        showToast("Pedido registrado en la base de datos ✓");
      } catch (err) { showToast(err.message + " ✗"); }
    })();
  }
  if (e.target.id === "passForm") {
    e.preventDefault();
    (async () => {
      const fd = new FormData(e.target);
      if ((fd.get("new1") || "").length < 6) { showToast("La nueva contraseña es muy corta (mín. 6)"); return; }
      if (fd.get("new1") !== fd.get("new2")) { showToast("Las contraseñas nuevas no coinciden ✗"); return; }
      try {
        await API.post("password.php", { cur: fd.get("cur"), new: fd.get("new1") });
        e.target.reset();
        showToast("Contraseña actualizada correctamente ✓");
        pushNotif("🔑", "Contraseña actualizada", "Tu contraseña fue cambiada con éxito");
      } catch (err) { showToast(err.message + " ✗"); }
    })();
  }
});

(async function init() {
  attachTilt();
  updateCart();
  renderNotifs();
  try { session = (await API.get("me.php")).user || null; } catch (e) { session = null; }
  await loadProducts();
  if (session) { updateAuthUI(); openDashboard(); } else updateAuthUI();
})();
