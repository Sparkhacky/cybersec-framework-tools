// ====== Estado y utilidades ======
const state = {
  items: [],
  search: "",
  sort: "name-asc",
  activeMacros: new Set(),
  view: "cards",          // 'cards' | 'list'
  favs: new Set(),        // repos favoritos (key = repo URL)
  onlyFavs: false,
};

const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const filtersBox = $("#filters");
const stats = $("#stats");
const filtersPanel = $("#filtersPanel");
const filtersSummary = $("#filtersSummary");

// ====== Macros EXACTAS ======
const MACROS = [
  { id: "active-directory", name: "Active Directory", match: /(active\s*directory|bloodhound|sharp(hound)?|winrm|ldap|kerberoast|asreproast|certi(fy|py)|ad\s*cs|gpo|dcsync|impacket)/i },
  { id: "reconocimiento", name: "Reconocimiento", match: /(recon\b|theharvester|recon-ng|aquatone|httprobe|amass|masscan(?!.*wpa)|sub(list3r|finder)|screenshots?|fingerprint)/i },
  { id: "redes", name: "Redes", match: /(wireshark|tcpdump|socat|netcat|\bnc\b|scapy|ettercap|bettercap|kismet|netdiscover|network|sniffer)/i },
  { id: "hacking-web", name: "Hacking Web", match: /(burp|owasp\s*zap|sqlmap|xss|xsstrike|commix|nikto|wfuzz|dirsearch|gobuster(?!.*dns)|csrf|ssti|lfi|rfi|web(?!.*shell))/i },
  { id: "explotacion", name: "Explotación", match: /(metasploit|exploit(db)?|searchsploit|havoc|sliver|empire(?!.*persist)|pupy|impacket.*(psexec|atexec|wmiexec)|overflow|rop|shellcode)/i },
  { id: "movimiento-lateral", name: "Movimiento lateral", match: /(lateral|wmiexec|psexec|evil-?winrm|sharp(rdp|dp)|remotepotato0|token\s*imperson|delegate|constrained\s*delegation)/i },
  { id: "red-team", name: "Red Team", match: /(cobalt\s*strike|sliver|mythic|posh?c2|covenant|empire\s|inveigh|adversary|operator)/i },
  { id: "elevacion-privilegios", name: "Elevación de privilegios", match: /(linpeas|winpeas|gtfobins|lolbas|privesc(check)?|be?root|kernel\s*exploit|token\s*privileges?)/i },
  { id: "mobile", name: "Mobile", match: /(mobile(?!.*framework)|ios\s|needle|iossecuritysuite|ipa\b|xcode)/i },
  { id: "android", name: "Android", match: /(android|apk(tool)?|dex|jadx|androguard|drozer|qark|apk-?mitm|apkleaks)/i },
  { id: "phising", name: "Phising", match: /(gophish|modlishka|evilginx|king\s*phisher|socialfish|hiddeneye|evilnovnc|phishing\s|credential\s*harvest)/i },
  { id: "ingenieria-social", name: "Ingeniería Social", match: /(social-?engineer|set\s*\(|awareness|phish(ing)?\s*campaign|vishing|smishing)/i },
  { id: "threat-intelligence", name: "Threat Intelligence", match: /(misp|opencti|yeti|intelowl|stoq|threatbus|maltrail|cti|ioc)/i },
  { id: "analisis", name: "Análisis", match: /(analysis(?!.*malware)|diagn[oó]stico|osquery|m[ée]tricas|inspecci[oó]n|networkminer)/i },
  { id: "reversing", name: "Reversing", match: /(ghidra|radare2|cutter|ida\s*free|binary\s*ninja|frida(?!.*mobile)|angr|reverse(?!.*proxy))/i },
  { id: "cracking", name: "Cracking", match: /(hashcat|john\s*the\s*ripper|ophcrack|rainbowcrack|crack(station)?|cupp|crunch|hash-?identifier)/i },
  { id: "enumeracion", name: "Enumeración", match: /(enum4linux(-ng)?|dns(recon|enum)|snmp(check)?|ldapsearch|amass|nmap\s*nse|netdiscover)/i },
  { id: "auditoria", name: "Auditoría", match: /(lynis|openvas|nessus|scoutsuite|prowler|cloudsploit|kube-?bench|compliance|audit)/i },
  { id: "persistencia", name: "Persistencia", match: /(sharpersist|persistencesniper|autorun|schtasks|run\s*keys|sticky\s*keys|koadic|backdoor\s*factory|persistence)/i },
  { id: "autenticacion", name: "Autenticación", match: /(kerbrute|hydra|medusa|patator|eaphammer|nlbrute|password\s*spray|rdp|ssh\s*brute|wpa|wpa2|wep)/i },
  { id: "forense", name: "Forense", match: /(autopsy|sleuth\s*kit|volatility|rekall|plaso|bulk\s*extractor|memory\s*forensics|lime)/i },
  { id: "malware", name: "Malware", match: /(yara|cuckoo|remnux|thezoo|malwarebazaar|hybrid\s*analysis|intezer|viper)/i },
  { id: "automatizacion", name: "Automatización", match: /(autorecon|legion|scripts?\s*auto|pipeline|ci\/cd|pacu|metasploit\s*aux|stoq)/i },
  { id: "firmware", name: "Firmware", match: /(binwalk|firmware-?mod-?kit|qemu|u-boot|chipsec|firmadyne|fact\s*_core|iot\s*firmware)/i },
  { id: "devsecops", name: "DevSecOps", match: /(trivy|anchore|clair|sonarqube|bandit\b|checkov|semgrep|kube-?hunter|elk|elastic\s*stack)/i },
  { id: "post-explotacion", name: "post-explotación", match: /(post-?exploitation|empire(?!.*install)|\bc2\b|covenant|merlin|pupy|havoc|posh?c2)/i },
  { id: "monitoreo", name: "monitoreo", match: /(prometheus|grafana|wazuh|nagios|zabbix|netdata|glances|elk|elastic\s*stack|sysdig|osquery)/i },
];

function mapToMacros(tool) {
  const haystack = [
    ...(tool.categories || []),
    ...(tool.tags || []),
    tool.name || "",
    tool.description || "",
  ].join(" | ").toLowerCase();
  return MACROS.filter(m => m.match.test(haystack));
}

function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[s]);
}

// ====== Favoritos (localStorage) ======
const FAV_KEY = "cft:favs";
function loadFavs(){
  try { state.favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }
  catch { state.favs = new Set(); }
}
function saveFavs(){
  localStorage.setItem(FAV_KEY, JSON.stringify([...state.favs]));
}
function toggleFav(repo){
  if (state.favs.has(repo)) state.favs.delete(repo);
  else state.favs.add(repo);
  saveFavs();
  render(); // refresca íconos/filtrado
}

// ====== Carga de datos ======
async function loadData() {
  loadFavs();
  const res = await fetch("repos.json?v=now");
  const data = await res.json();
  state.items = data.map(t => ({ ...t, macros: mapToMacros(t) }));
  renderFilters();
  buildAutocomplete();  // datalist
  // Panel abierto en escritorio, plegado en móvil
  if (filtersPanel) filtersPanel.open = window.innerWidth >= 900;
  render();
}

// ====== Panel de filtros ======
function updateFiltersSummary(){
  const n = state.activeMacros.size;
  if (filtersSummary) filtersSummary.textContent = `Filtros (${n} activo${n===1?"":"s"})`;
}

function renderFilters() {
  filtersBox.innerHTML = MACROS.map(m => {
    const id = `macro-${m.id}`;
    const checked = state.activeMacros.has(m.id) ? "checked" : "";
    return `<label class="filter-chip" for="${id}">
      <input id="${id}" type="checkbox" data-macro="${m.id}" ${checked}/>
      <span>${m.name}</span>
    </label>`;
  }).join("");

  filtersBox.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-macro");
      if (e.target.checked) state.activeMacros.add(id);
      else state.activeMacros.delete(id);
      updateFiltersSummary();
      render();

      // En móvil, cerrar panel tras seleccionar para no tapar resultados
      if (window.innerWidth < 700 && filtersPanel?.open) {
        filtersPanel.open = false;
        $("#stats")?.scrollIntoView({behavior:"smooth", block:"start"});
      }
    });
  });

  updateFiltersSummary();
}

// ====== Autocompletado (datalist) ======
function buildAutocomplete(){
  const dl = $("#search-suggest");
  if (!dl) return;
  const names = state.items.map(i=>i.name);
  const macros = MACROS.map(m=>m.name);
  const tags = [...new Set(state.items.flatMap(i=>i.tags||[]))].slice(0,200);
  const opts = [...new Set([...names, ...macros, ...tags])].sort((a,b)=>a.localeCompare(b));
  dl.innerHTML = opts.map(v=>`<option value="${escapeHtml(v)}">`).join("");
}

// ====== Filtro, búsqueda y orden ======
function applyFilters(items) {
  let out = items;

  // Solo favoritos
  if (state.onlyFavs) {
    out = out.filter(it => state.favs.has(it.repo));
  }

  // por macros (OR). Si no hay activos, no filtra por macro.
  if (state.activeMacros.size > 0) {
    out = out.filter(it => {
      const macroIds = (it.macros || []).map(m => m.id);
      return [...state.activeMacros].some(id => macroIds.includes(id));
    });
  }

  // búsqueda
  if (state.search.trim() !== "") {
    const q = state.search.toLowerCase();
    out = out.filter(it => {
      const base = `${it.name||""} ${it.description||""} ${(it.tags||[]).join(" ")} ${(it.categories||[]).join(" ")} ${(it.macros||[]).map(m=>m.name).join(" ")}`.toLowerCase();
      return base.includes(q);
    });
  }

  // orden
  const [key, dir] = state.sort.split("-");
  out.sort((a,b)=>{
    let va="", vb="";
    if (key==="name"){ va=a.name||""; vb=b.name||""; }
    else if (key==="lang"){ va=a.language||""; vb=b.language||""; }
    else { va=a.name||""; vb=b.name||""; }
    const cmp = va.localeCompare(vb);
    return dir==="asc"? cmp : -cmp;
  });

  return out;
}

// ====== Render ======
function render() {
  const filtered = applyFilters(state.items);
  if (stats) stats.textContent = `Mostrando ${filtered.length} de ${state.items.length} repositorios`;

  // Cambia el layout del contenedor (grid vs lista)
  grid.classList.toggle('list', state.view === 'list');

  grid.innerHTML = (state.view === "cards")
    ? filtered.map(item => card(item)).join("")
    : renderTable(filtered);
}

function favStar(repo){
  const on = state.favs.has(repo);
  const title = on ? "Quitar de favoritos" : "Añadir a favoritos";
  return `<button class="star" title="${title}" data-fav="${repo}" aria-label="${title}">
    ${on ? "⭐" : "☆"}
  </button>`;
}

function card(item){
  const macros = (item.macros || []).map(m=>`<span class="badge">${escapeHtml(m.name)}</span>`).join("");
  const lang = item.language ? `<span class="badge">${escapeHtml(item.language)}</span>` : "";
  const plats = (item.platforms||[]).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");
  return `<article class="card">
    <div class="row">
      <h3>${escapeHtml(item.name)}</h3>
      <div class="row">
        <a class="button" href="${item.repo}" target="_blank" rel="noopener">Repo</a>
        ${favStar(item.repo)}
      </div>
    </div>
    <p>${escapeHtml(item.description||"")}</p>
    <div class="badges">${macros}</div>
    <div class="badges">${plats} ${lang}</div>
  </article>`;
}

function renderTable(list){
  const rows = list.map(it=>`
    <tr>
      <td style="white-space:nowrap">${favStar(it.repo)}</td>
      <td><a href="${it.repo}" target="_blank" rel="noopener">${escapeHtml(it.name)}</a></td>
      <td>${escapeHtml(it.description||"")}</td>
      <td>${(it.macros||[]).map(m=>`<span class="badge">${escapeHtml(m.name)}</span>`).join("")}</td>
    </tr>
  `).join("");

  return `
    <table class="table">
      <thead>
        <tr><th></th><th>Herramienta</th><th>Descripción</th><th>Macros</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ====== Controles ======
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  $("#search")?.addEventListener("input", e => { state.search = e.target.value; render(); });
  $("#sort")?.addEventListener("change", e => { state.sort = e.target.value; render(); });

  $("#clearFilters")?.addEventListener("click", () => {
    state.activeMacros.clear();
    state.search = "";
    state.sort = "name-asc";
    state.onlyFavs = false;
    $("#search") && ($("#search").value = "");
    $("#sort") && ($("#sort").value = "name-asc");
    $("#onlyFavs") && ($("#onlyFavs").checked = false);
    renderFilters();
    if (filtersPanel) filtersPanel.open = window.innerWidth >= 900;
    render();
  });

  $("#onlyFavs")?.addEventListener("change", e => {
    state.onlyFavs = !!e.target.checked;
    render();
  });

  $("#viewCards")?.addEventListener("click", () => {
    state.view = "cards";
    $("#viewCards").classList.add("is-active");
    $("#viewList").classList.remove("is-active");
    render();
  });
  $("#viewList")?.addEventListener("click", () => {
    state.view = "list";
    $("#viewList").classList.add("is-active");
    $("#viewCards").classList.remove("is-active");
    render();
  });

  // ⭐ Delegación para estrellas (cards y lista)
  $("#grid")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button.star[data-fav]");
    if (!btn) return;
    const repo = btn.getAttribute("data-fav");
    toggleFav(repo);
  });
});
