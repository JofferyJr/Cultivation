const BC_MUSIC_DB="boundless-cultivation-music";
const BC_MUSIC_STORE="tracks";
const BC_MUSIC_SLOT="slot-1";
const BC_MUSIC_SETTINGS="boundless-cultivation-music-settings";
let bcAudio=null;
let bcObjectUrl=null;

function bcMusicSettings(){
  try{return {...{enabled:false,volume:.32},...JSON.parse(localStorage.getItem(BC_MUSIC_SETTINGS)||"{}")};}
  catch{return {enabled:false,volume:.32};}
}
function bcSaveMusicSettings(next){localStorage.setItem(BC_MUSIC_SETTINGS,JSON.stringify(next));}
function bcOpenMusicDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(BC_MUSIC_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(BC_MUSIC_STORE))req.result.createObjectStore(BC_MUSIC_STORE,{keyPath:"id"});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function bcGetTrack(){
  const db=await bcOpenMusicDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction(BC_MUSIC_STORE,"readonly");const req=tx.objectStore(BC_MUSIC_STORE).get(BC_MUSIC_SLOT);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});
}
async function bcPutTrack(file){
  const db=await bcOpenMusicDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction(BC_MUSIC_STORE,"readwrite");tx.objectStore(BC_MUSIC_STORE).put({id:BC_MUSIC_SLOT,name:file.name,type:file.type||"audio/mpeg",blob:file,updatedAt:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});
}
async function bcDeleteTrack(){
  const db=await bcOpenMusicDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction(BC_MUSIC_STORE,"readwrite");tx.objectStore(BC_MUSIC_STORE).delete(BC_MUSIC_SLOT);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});
}
function bcEnsureAudio(){
  if(bcAudio)return bcAudio;
  bcAudio=new Audio();bcAudio.loop=true;bcAudio.preload="metadata";bcAudio.volume=bcMusicSettings().volume;
  return bcAudio;
}
async function bcApplyTrack(track,play=false){
  const audio=bcEnsureAudio();
  if(bcObjectUrl){URL.revokeObjectURL(bcObjectUrl);bcObjectUrl=null;}
  audio.pause();audio.removeAttribute("src");
  if(!track?.blob)return;
  bcObjectUrl=URL.createObjectURL(track.blob);audio.src=bcObjectUrl;audio.load();
  const settings=bcMusicSettings();audio.volume=Math.max(0,Math.min(1,Number(settings.volume)||0));
  if(play&&settings.enabled)try{await audio.play();}catch{}
}
function bcArmPlayback(){
  const resume=async()=>{const s=bcMusicSettings();if(s.enabled&&bcAudio?.src)try{await bcAudio.play();}catch{}};
  document.addEventListener("pointerdown",resume,{once:true,capture:true});
  document.addEventListener("keydown",resume,{once:true,capture:true});
}
function bcEscape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function bcRenderMusic(host){
  const track=await bcGetTrack().catch(()=>null),settings=bcMusicSettings();
  host.innerHTML=`<section class="bc-music-panel" aria-labelledby="bc-music-title">
    <header><div><p>Muzik permainan</p><h3 id="bc-music-title">Slot Muzik 1</h3><small>Pilih Ni Tian Xing (逆天行).mp3 atau MP3 lain. Fail disimpan hanya dalam pelayar peranti ini.</small></div></header>
    <div class="bc-music-row">
      <label><span>Pilihan lagu</span><select id="bc-music-select"><option value="off">Tiada muzik</option><option value="slot1" ${track&&settings.enabled?"selected":""} ${track?"":"disabled"}>${track?bcEscape(track.name):"Slot 1 belum berisi"}</option></select></label>
      <button type="button" id="bc-music-pick">Pilih / Ganti MP3</button>
      <button type="button" id="bc-music-toggle" ${track?"":"disabled"}>${bcAudio&&!bcAudio.paused?"Jeda":"Main"}</button>
      <button type="button" id="bc-music-remove" ${track?"":"disabled"}>Kosongkan Slot</button>
    </div>
    <div class="bc-music-volume"><label for="bc-music-volume">Volume <b>${Math.round(settings.volume*100)}%</b></label><input id="bc-music-volume" type="range" min="0" max="1" step="0.01" value="${settings.volume}"></div>
    <input id="bc-music-file" type="file" accept=".mp3,audio/mpeg" hidden>
    <p class="bc-music-status" role="status">${track?`Tersimpan: ${bcEscape(track.name)}`:"Belum ada MP3 dalam Slot Muzik 1."}</p>
  </section>`;
  const file=host.querySelector("#bc-music-file");
  host.querySelector("#bc-music-pick").onclick=()=>file.click();
  file.onchange=async()=>{const picked=file.files?.[0];if(!picked)return;if(!/\.mp3$/i.test(picked.name)&&picked.type!=="audio/mpeg"){host.querySelector(".bc-music-status").textContent="Pilih fail MP3.";return;}await bcPutTrack(picked);const next={...bcMusicSettings(),enabled:true};bcSaveMusicSettings(next);await bcApplyTrack(await bcGetTrack(),true);await bcRenderMusic(host);};
  host.querySelector("#bc-music-select").onchange=async e=>{const enabled=e.target.value==="slot1";const next={...bcMusicSettings(),enabled};bcSaveMusicSettings(next);if(enabled){await bcApplyTrack(await bcGetTrack(),true);}else bcEnsureAudio().pause();await bcRenderMusic(host);};
  host.querySelector("#bc-music-toggle").onclick=async()=>{const audio=bcEnsureAudio();if(audio.paused){const next={...bcMusicSettings(),enabled:true};bcSaveMusicSettings(next);await bcApplyTrack(await bcGetTrack(),true);}else audio.pause();await bcRenderMusic(host);};
  host.querySelector("#bc-music-remove").onclick=async()=>{if(!confirm("Kosongkan Slot Muzik 1?"))return;bcEnsureAudio().pause();await bcDeleteTrack();bcSaveMusicSettings({...bcMusicSettings(),enabled:false});await bcApplyTrack(null);await bcRenderMusic(host);};
  host.querySelector("#bc-music-volume").oninput=e=>{const volume=Number(e.target.value);bcEnsureAudio().volume=volume;const next={...bcMusicSettings(),volume};bcSaveMusicSettings(next);host.querySelector(".bc-music-volume b").textContent=Math.round(volume*100)+"%";};
}
async function bcMountMusic(){
  const host=document.getElementById("bc-music-manager-mount");if(!host||host.dataset.musicMounted==="true")return;
  host.dataset.musicMounted="true";await bcRenderMusic(host);
}
async function bcBootMusic(){
  const track=await bcGetTrack().catch(()=>null);await bcApplyTrack(track,false);bcArmPlayback();bcMountMusic();
  new MutationObserver(()=>bcMountMusic()).observe(document.documentElement,{subtree:true,childList:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bcBootMusic,{once:true});else bcBootMusic();
