const LABELS={family:"Keluarga",civilian:"Orang Awam",sect:"Sekte"};
let activeMode=null;
let lastTrigger=null;
function sourceGrid(mode){return mode==="player"?document.querySelector(".player-portrait-picker .player-portrait-options"):document.querySelector(".true-love-face-picker .true-love-face-grid");}
function groupOf(button,mode){const text=(button.querySelector("small")?.textContent||"").toLowerCase();if(mode==="player"){if(text.includes("keluarga"))return "family";if(text.includes("sekte"))return "sect";return "civilian";}return text.includes("sekte")?"sect":"civilian";}
function selectedLabel(grid){const selected=grid?.querySelector('[aria-checked="true"],.selected');return selected?.querySelector("b")?.textContent?.trim()||"Muka semasa";}
function ensurePaper(){
 let overlay=document.getElementById("bc-portrait-paper-overlay");if(overlay)return overlay;
 overlay=document.createElement("div");overlay.id="bc-portrait-paper-overlay";overlay.hidden=true;
 overlay.innerHTML='<section id="bc-portrait-paper" class="bc-portrait-paper" role="dialog" aria-modal="true" aria-labelledby="bc-portrait-paper-title"><header class="bc-portrait-paper-head"><div><small>Boundless Cultivation · v8.1.5</small><h2 id="bc-portrait-paper-title">Kertas Pemilihan Muka</h2><p>Pilih muka daripada koleksi yang sesuai. Kertas kekal terbuka selepas pilihan.</p></div><button type="button" class="bc-portrait-paper-close" aria-label="Tutup Kertas Pemilihan Muka">×</button></header><div class="bc-portrait-paper-groups"></div></section>';
 document.body.appendChild(overlay);
 overlay.querySelector(".bc-portrait-paper-close").addEventListener("click",closePaper);
 overlay.addEventListener("pointerdown",event=>{if(event.target===overlay)event.preventDefault();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!overlay.hidden)closePaper();});
 return overlay;
}
function rebuildPaper(){
 if(!activeMode)return;const grid=sourceGrid(activeMode),overlay=ensurePaper(),host=overlay.querySelector(".bc-portrait-paper-groups");if(!grid||!host)return;
 const buttons=[...grid.querySelectorAll("button")];host.replaceChildren();
 for(const source of ["family","civilian","sect"]){
  const entries=buttons.map((button,index)=>({button,index})).filter(entry=>groupOf(entry.button,activeMode)===source);if(!entries.length)continue;
  const section=document.createElement("section");section.className="bc-portrait-group";const title=document.createElement("h3");title.textContent=LABELS[source];
  const choices=document.createElement("div");choices.className="portrait-paper-grid";
  for(const entry of entries){
   const clone=entry.button.cloneNode(true);clone.classList.add("bc-portrait-choice");clone.removeAttribute("role");clone.setAttribute("aria-pressed",entry.button.getAttribute("aria-checked")==="true"||entry.button.classList.contains("selected")?"true":"false");
   clone.addEventListener("click",()=>{const live=sourceGrid(activeMode),liveButton=live?.querySelectorAll("button")[entry.index];liveButton?.click();setTimeout(()=>{rebuildPaper();refreshSummaries();},40);});choices.appendChild(clone);
  }
  section.append(title,choices);host.appendChild(section);
 }
}
function openPaper(mode,trigger){activeMode=mode;lastTrigger=trigger;const overlay=ensurePaper();rebuildPaper();overlay.hidden=false;overlay.querySelector(".bc-portrait-paper-close")?.focus();}
function closePaper(){const overlay=ensurePaper();overlay.hidden=true;activeMode=null;lastTrigger?.focus();lastTrigger=null;}
function createSummary(mode,grid){
 const wrap=document.createElement("div");wrap.className="bc-portrait-summary";wrap.dataset.mode=mode;
 const copy=document.createElement("div");copy.innerHTML="<small>"+(mode==="player"?"Muka pemain":"Muka pasangan")+"</small><b class=\"bc-portrait-current\"></b>";
 const button=document.createElement("button");button.type="button";button.className="bc-portrait-open";button.textContent=mode==="player"?"Pilih Muka Pemain":"Pilih Muka Pasangan";button.addEventListener("click",()=>openPaper(mode,button));
 wrap.append(copy,button);grid.insertAdjacentElement("afterend",wrap);return wrap;
}
function refreshSummaries(){
 for(const mode of ["player","true-love"]){const grid=sourceGrid(mode);if(!grid)continue;grid.classList.add("bc-v815-hidden-portrait-grid");const parent=grid.parentElement;let summary=parent?.querySelector('.bc-portrait-summary[data-mode="'+mode+'"]');if(!summary)summary=createSummary(mode,grid);const current=summary.querySelector(".bc-portrait-current");if(current)current.textContent=selectedLabel(grid);}
}
function boot(){refreshSummaries();let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refreshSummaries();if(activeMode&&!ensurePaper().hidden)rebuildPaper();});});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["aria-checked","class"]});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();