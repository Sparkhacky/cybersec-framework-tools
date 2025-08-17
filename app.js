
// Data loading + UI logic (vanilla JS)
const state = {
  items: [],
  categories: new Set(),
  activeCategories: new Set(),
  search: "",
  sort: "name-asc",
};

const el = (sel) => document.querySelector(sel);
const grid = el("#grid");
const filtersBox = el("#filters");
const stats = el("#stats");

async function loadData() {
  const res = await fetch("repos.json");
  const data = await res.json();
  state.items = data;
  // Collect categories
  data.forEach(it => (it.categories||[]).forEach(c => state.categories.add(c)));
  renderFilters();
  render();
}

function renderFilters() {
  const cats = Array.from(state.categories).sort((a,b)=>a.localeCompare(b));
  filtersBox.innerHTML = cats.map(c => {
    const id = `cat-${c.replace(/\s+/g,'-').toLowerCase()}`;
    const checked = state.activeCategories.has(c) ? "checked" : "";
    return `<label class="filter-chip" for="${id}">
      <input id="${id}" type="checkbox" data-cat="${c}" ${checked}/>
      <span>${c}</span>
    </label>`;
  }).join("");
  filtersBox.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const cat = e.target.getAttribute("data-cat");
      if (e.target.checked) state.activeCategories.add(cat);
      else state.activeCategories.delete(cat);
      render();
    });
  });
}

function applyFilters(items) {
  let out = items;
  // category filter
  if (state.activeCategories.size > 0) {
    out = out.filter(it => it.categories && it.categories.some(c => state.activeCategories.has(c)));
  }
  // search filter
  if (state.search.trim() !== "") {
    const q = state.search.toLowerCase();
    out = out.filter(it =>
      (it.name||"").toLowerCase().includes(q) ||
      (it.description||"").toLowerCase().includes(q) ||
      (it.tags||[]).some(t => t.toLowerCase().includes(q)) ||
      (it.language||"").toLowerCase().includes(q)
    );
  }
  // sort
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

function render() {
  const filtered = applyFilters(state.items);
  stats.textContent = `Mostrando ${filtered.length} de ${state.items.length} repositorios`;
  grid.innerHTML = filtered.map(item => card(item)).join("");
}

function card(item){
  const tags = (item.tags||[]).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");
  const cats = (item.categories||[]).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");
  const plats = (item.platforms||[]).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");
  const lang = item.language ? `<span class="badge">${escapeHtml(item.language)}</span>` : "";
  return `<article class="card">
    <div class="row">
      <h3>${escapeHtml(item.name)}</h3>
      <a class="button" href="${item.repo}" target="_blank" rel="noopener">Repo</a>
    </div>
    <p>${escapeHtml(item.description||"")}</p>
    <div class="badges">${cats}</div>
    <div class="badges">${tags}</div>
    <div class="badges">${plats} ${lang}</div>
  </article>`;
}

function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[s]);
}

// Wiring controls
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const clear = document.getElementById("clearFilters");
  search.addEventListener("input", e => { state.search = e.target.value; render(); });
  sort.addEventListener("change", e => { state.sort = e.target.value; render(); });
  clear.addEventListener("click", () => {
    state.activeCategories.clear();
    state.search = "";
    state.sort = "name-asc";
    document.getElementById("search").value = "";
    document.getElementById("sort").value = "name-asc";
    renderFilters();
    render();
  });
});
