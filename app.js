const state={items:[],search:"",sort:"name-asc",activeMacros:new Set(),view:localStorage.getItem("cft:view")||"cards",favs:new Set(),onlyFavs:false};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const MACROS=[
  {id:"osint",name:"OSINT",match:/\b(osint|sherlock|maigret|maltego|spiderfoot|username|social.?media|geoint|ghunt)\b/i},
  {id:"threat-intelligence",name:"Threat Intelligence",match:/(threat.?intel|opencti|misp|ioc|yeti|intelowl|attack.?navigator|ail.?framework|signature.?base)/i},
  {id:"reconocimiento",name:"Reconocimiento",match:/(recon|theharvester|amass|subfinder|aquatone|httpx|naabu|masscan|fingerprint|gowitness|hakrawler)/i},
  {id:"hacking-web",name:"Hacking Web",match:/(hacking web|web security|burp|owasp zap|sqlmap|xss|nikto|wfuzz|dirsearch|gobuster|ffuf|nuclei|kiterunner|arjun|turbo.?intruder)/i},
  {id:"active-directory",name:"Active Directory",match:/(active directory|bloodhound|sharphound|winrm|ldap|kerberoast|asreproast|ad cs|gpo|dcsync|impacket)/i},
  {id:"redes",name:"Redes",match:/(redes|network|wireshark|tcpdump|socat|netcat|scapy|ettercap|bettercap|kismet|sniffer|nmap)/i},
  {id:"cloud",name:"Cloud",match:/(cloud|aws|azure|gcp|scubagear|cloudfox|custodian|pacu|stratus)/i},
  {id:"devsecops",name:"DevSecOps",match:/(devsecops|container|kubernetes|trivy|anchore|syft|grype|osv|scorecard|gitleaks|trufflehog|semgrep|dependency|sbom)/i},
  {id:"auditoria",name:"Auditoría",match:/(audit|auditoría|lynis|openvas|nessus|scoutsuite|prowler|compliance|vulnerabil)/i},
  {id:"explotacion",name:"Explotación",match:/(explotación|exploitation|metasploit|exploit|overflow|rop|shellcode|routersploit)/i},
  {id:"post-explotacion",name:"Post-explotación",match:/(post.?explot|post.?exploit|movimiento lateral|persistence|persistencia|privilege|privesc|c2|sliver|empire|havoc)/i},
  {id:"cracking",name:"Cracking",match:/(cracking|hashcat|john the ripper|ophcrack|rainbow|password|wordlist|seclists|hydra|bruteforce)/i},
  {id:"forense",name:"Forense",match:/(forense|forensic|autopsy|sleuth|volatility|rekall|plaso|timesketch|velociraptor|memory)/i},
  {id:"malware",name:"Malware",match:/(malware|yara|cuckoo|remnux|thezoo|malwarebazaar|capa|flare.?vm|viper)/i},
  {id:"reversing",name:"Reversing",match:/(reversing|reverse engineering|ghidra|radare|cutter|ida|binary ninja|frida|angr)/i},
  {id:"mobile",name:"Mobile",match:/(mobile|android|ios|apk|jadx|androguard|drozer|qark|mobsf)/i},
  {id:"wireless",name:"Wireless",match:/(wireless|wifi|wi-fi|wpa|wep|aircrack|kismet|eaphammer)/i},
  {id:"ingenieria-social",name:"Ingeniería Social",match:/(ingeniería social|social engineering|phishing|gophish|evilginx|vishing|smishing)/i},
  {id:"firmware",name:"Firmware / IoT",match:/(firmware|iot|binwalk|u-boot|chipsec|firmadyne|qemu)/i},
  {id:"monitoreo",name:"Monitoreo",match:/(monitoreo|monitoring|prometheus|grafana|wazuh|nagios|zabbix|osquery|sysdig|maltrail)/i}
];
const FAV_KEY="cft:favs";
function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));}
function safeUrl(value){try{const url=new URL(value);return ["https:","http:"].includes(url.protocol)?url.href:"#";}catch{return "#";}}
function mapToMacros(tool){const text=[...(tool.categories||[]),...(tool.tags||[]),tool.name,tool.description,tool.language].join(" | ");return MACROS.filter(macro=>macro.match.test(text));}
function loadFavs(){try{state.favs=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||"[]"));}catch{state.favs=new Set();}}
function saveFavs(){localStorage.setItem(FAV_KEY,JSON.stringify([...state.favs]));}
function toggleFav(repo){state.favs.has(repo)?state.favs.delete(repo):state.favs.add(repo);saveFavs();render();}

async function loadData(){
  loadFavs();
  try{
    const response=await fetch("repos.json?v=4");
    if(!response.ok)throw new Error("No se pudo cargar el catálogo");
    const data=await response.json();
    state.items=data.map((tool,index)=>({...tool,index:index+1,macros:mapToMacros(tool)}));
    $("#totalTools").textContent=state.items.length;
    $("#totalAreas").textContent=MACROS.length;
    renderFilters();buildAutocomplete();setView(state.view);render();
  }catch(error){
    $("#stats").textContent="No se pudo cargar el catálogo.";
    $("#grid").innerHTML='<div class="empty-state"><h3>Error al cargar los datos</h3><p>Actualiza la página para intentarlo de nuevo.</p></div>';
  }
}
function macroCount(id){return state.items.filter(item=>item.macros.some(macro=>macro.id===id)).length;}
function renderFilters(){
  $("#filters").innerHTML=MACROS.map(macro=>`<label class="filter-chip ${state.activeMacros.has(macro.id)?"is-active":""}"><input type="checkbox" data-macro="${macro.id}" ${state.activeMacros.has(macro.id)?"checked":""}><span>${escapeHtml(macro.name)}</span><span class="filter-count">${macroCount(macro.id)}</span></label>`).join("");
}
function buildAutocomplete(){
  const values=[...new Set([...state.items.map(item=>item.name),...MACROS.map(m=>m.name),...state.items.flatMap(item=>item.tags||[])])].sort((a,b)=>a.localeCompare(b,"es"));
  $("#search-suggest").innerHTML=values.slice(0,350).map(value=>`<option value="${escapeHtml(value)}">`).join("");
}
function applyFilters(){
  let output=[...state.items];
  if(state.onlyFavs)output=output.filter(item=>state.favs.has(item.repo));
  if(state.activeMacros.size)output=output.filter(item=>[...state.activeMacros].some(id=>item.macros.some(macro=>macro.id===id)));
  if(state.search.trim()){
    const query=state.search.toLocaleLowerCase("es");
    output=output.filter(item=>[item.name,item.description,item.language,...(item.tags||[]),...(item.categories||[]),...item.macros.map(m=>m.name)].join(" ").toLocaleLowerCase("es").includes(query));
  }
  const [key,direction]=state.sort.split("-");
  output.sort((a,b)=>String(key==="lang"?a.language||"":a.name||"").localeCompare(String(key==="lang"?b.language||"":b.name||""),"es")*(direction==="asc"?1:-1));
  return output;
}
function favButton(repo){const active=state.favs.has(repo);return `<button class="star ${active?"is-favorite":""}" type="button" data-fav="${escapeHtml(repo)}" aria-label="${active?"Quitar de":"Añadir a"} favoritos" aria-pressed="${active}">${active?"★":"☆"}</button>`;}
function card(item,position){
  const areas=item.macros.slice(0,2).map(m=>`<span class="badge">${escapeHtml(m.name)}</span>`).join("");
  const language=item.language?`<span class="badge">${escapeHtml(item.language)}</span>`:"";
  return `<article class="card"><div class="tool-index">/${String(position+1).padStart(3,"0")}</div><div class="card-top"><h3>${escapeHtml(item.name)}</h3>${favButton(item.repo)}</div><p>${escapeHtml(item.description||"Sin descripción disponible.")}</p><div class="card-meta"><div class="badges">${areas}${language}</div><a class="repo-link" href="${safeUrl(item.repo)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir repositorio de ${escapeHtml(item.name)}">Abrir ↗</a></div></article>`;
}
function table(items){
  return `<div class="table-wrap"><table class="table"><thead><tr><th class="col-star">Fav.</th><th class="col-name">Herramienta</th><th>Descripción</th><th class="col-macros">Especialidad</th></tr></thead><tbody>${items.map(item=>`<tr><td class="col-star">${favButton(item.repo)}</td><td class="col-name"><a href="${safeUrl(item.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)} ↗</a></td><td>${escapeHtml(item.description||"")}</td><td class="col-macros"><div class="badges">${item.macros.slice(0,3).map(m=>`<span class="badge">${escapeHtml(m.name)}</span>`).join("")}</div></td></tr>`).join("")}</tbody></table></div>`;
}
function render(){
  const filtered=applyFilters();
  $("#stats").innerHTML=`<strong>${filtered.length}</strong> de ${state.items.length} herramientas`;
  $("#grid").classList.toggle("list",state.view==="list");
  $("#grid").innerHTML=state.view==="cards"?filtered.map(card).join(""):table(filtered);
  $("#grid").hidden=!filtered.length;$("#emptyState").hidden=!!filtered.length;
}
function clearAll(){
  state.activeMacros.clear();state.search="";state.sort="name-asc";state.onlyFavs=false;
  $("#search").value="";$("#sort").value="name-asc";$("#onlyFavs").checked=false;renderFilters();render();
}
function setView(view){
  state.view=view==="list"?"list":"cards";localStorage.setItem("cft:view",state.view);
  ["Cards","List"].forEach(name=>{const button=$("#view"+name);const active=state.view===name.toLowerCase();button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active));});render();
}
document.addEventListener("DOMContentLoaded",()=>{
  loadData();
  $("#search").addEventListener("input",event=>{state.search=event.target.value;render();});
  $("#sort").addEventListener("change",event=>{state.sort=event.target.value;render();});
  $("#onlyFavs").addEventListener("change",event=>{state.onlyFavs=event.target.checked;render();});
  $("#viewCards").addEventListener("click",()=>setView("cards"));$("#viewList").addEventListener("click",()=>setView("list"));
  $("#clearFilters").addEventListener("click",clearAll);$("[data-clear]").addEventListener("click",clearAll);
  $("#filters").addEventListener("change",event=>{const id=event.target.dataset.macro;if(!id)return;event.target.checked?state.activeMacros.add(id):state.activeMacros.delete(id);renderFilters();render();});
  $("#grid").addEventListener("click",event=>{const button=event.target.closest("[data-fav]");if(button)toggleFav(button.dataset.fav);});
  $$(".search-hint [data-query]").forEach(button=>button.addEventListener("click",()=>{$("#search").value=button.dataset.query;state.search=button.dataset.query;render();$("#catalogo").scrollIntoView({behavior:"smooth"});}));
  document.addEventListener("keydown",event=>{if(event.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){event.preventDefault();$("#search").focus();}});
});
