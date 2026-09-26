const BC_MUSIC_DB="boundless-cultivation-music";
const BC_MUSIC_STORE="tracks";
const BC_MUSIC_SLOT="slot-1";
const BC_MUSIC_SETTINGS="boundless-cultivation-music-settings";
const BC_BUILTIN_URL="/Cultivation/assets/music/ni-tian-xing-loop.ogg";
const BC_BUILTIN_NAME="Ni Tian Xing (逆天行) · Latar Bawaan";
const BC_XIAN_URL="/Cultivation/assets/music/Xian%20Dao%20Chang%20(%E4%BB%99%E9%81%93%E9%95%BF).mp3";
const BC_XIAN_NAME="Xian Dao Chang (仙道长) · Muzik Repo";
let bcAudio=null;
let bcObjectUrl=null;

function bcMusicSettings(){
  try{
    const raw=JSON.parse(localStorage.getItem(BC_MUSIC_SETTINGS)||"{}");
    const source=["builtin","xian","slot1","off"].includes(raw.source)?raw.source:(raw.enabled===false?"off":"builtin");
    return {enabled:source!=="off",volume:Number.isFinite(Number(raw.volume))?Math.max(0,Math.min(1,Number(raw.volume))):.32,source};
  }catch{return {enabled:true,volume:.32,source:"builtin"};}
}
function bcSaveMusicSettings(next){
  const source=["builtin","xian","slot1","off"].includes(next.source)?next.source:"builtin";
  localStorage.setItem(BC_MUSIC_SETTINGS,JSON.stringify({...next,source,enabled:source!=="off"}));
}
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
  bcAudio.dataset.boundlessMusic="true";
  return bcAudio;
}
function bcClearAudio(){
  const audio=bcEnsureAudio();
  audio.pause();
  if(bcObjectUrl){URL.revokeObjectURL(bcObjectUrl);bcObjectUrl=null;}
  audio.removeAttribute("src");
  audio.load();
  return audio;
}
async function bcApplySelected(play=false){
  const settings=bcMusicSettings(),audio=bcClearAudio();
  audio.volume=settings.volume;
  if(settings.source==="off")return;
  if(settings.source==="xian"){
    audio.src=BC_XIAN_URL;
  }else if(settings.source==="slot1"){
    const track=await bcGetTrack().catch(()=>null);
    if(track?.blob){
      bcObjectUrl=URL.createObjectURL(track.blob);
      audio.src=bcObjectUrl;
    }else{
      bcSaveMusicSettings({...settings,source:"builtin"});
      audio.src=BC_BUILTIN_URL;
    }
  }else{
    audio.src=BC_BUILTIN_URL;
  }
  audio.load();
  if(play)try{await audio.play();}catch{}
}
function bcArmPlayback(){
  const resume=async()=>{const s=bcMusicSettings();if(s.source!=="off")try{await bcApplySelected(true);}catch{}};
  document.addEventListener("pointerdown",resume,{once:true,capture:true});
  document.addEventListener("keydown",resume,{once:true,capture:true});
}
function bcEscape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function bcRenderMusic(host){
  const track=await bcGetTrack().catch(()=>null),settings=bcMusicSettings();
  const status=settings.source==="builtin"
    ?"Aktif selepas interaksi pertama: "+BC_BUILTIN_NAME+"."
    :settings.source==="xian"
      ?"Aktif selepas interaksi pertama: "+BC_XIAN_NAME+"."
      :settings.source==="slot1"&&track
        ?"Tersimpan: "+bcEscape(track.name)
        :"Muzik dimatikan.";
  host.innerHTML=`<section class="bc-music-panel" aria-labelledby="bc-music-title">
    <header><div><p>Muzik permainan</p><h3 id="bc-music-title">Muzik Latar</h3><small>Ni Tian Xing (逆天行) tersedia sebagai trek bawaan. Slot Muzik 1 menyimpan MP3 pilihan anda pada pelayar ini.</small></div></header>
    <div class="bc-music-row">
      <label><span>Pilihan lagu</span><select id="bc-music-select">
        <option value="builtin" ${settings.source==="builtin"?"selected":""}>${BC_BUILTIN_NAME}</option>
        <option value="xian" ${settings.source==="xian"?"selected":""}>${BC_XIAN_NAME}</option>
        <option value="slot1" ${settings.source==="slot1"?"selected":""} ${track?"":"disabled"}>${track?"Slot Muzik 1 · "+bcEscape(track.name):"Slot Muzik 1 · kosong"}</option>
        <option value="off" ${settings.source==="off"?"selected":""}>Tiada muzik</option>
      </select></label>
      <button type="button" id="bc-music-pick">Pilih / Ganti MP3</button>
      <button type="button" id="bc-music-toggle">${bcAudio&&!bcAudio.paused?"Jeda":"Main"}</button>
      <button type="button" id="bc-music-remove" ${track?"":"disabled"}>Kosongkan Slot 1</button>
    </div>
    <div class="bc-music-volume"><label for="bc-music-volume">Volume <b>${Math.round(settings.volume*100)}%</b></label><input id="bc-music-volume" type="range" min="0" max="1" step="0.01" value="${settings.volume}"></div>
    <input id="bc-music-file" type="file" accept=".mp3,audio/mpeg" hidden>
    <p class="bc-music-status" role="status">${status}</p>
  </section>`;
  const file=host.querySelector("#bc-music-file");
  host.querySelector("#bc-music-pick").onclick=()=>file.click();
  file.onchange=async()=>{
    const picked=file.files?.[0];if(!picked)return;
    if(!/\.mp3$/i.test(picked.name)&&picked.type!=="audio/mpeg"){host.querySelector(".bc-music-status").textContent="Pilih fail MP3.";return;}
    await bcPutTrack(picked);
    bcSaveMusicSettings({...bcMusicSettings(),source:"slot1"});
    await bcApplySelected(true);
    await bcRenderMusic(host);
  };
  host.querySelector("#bc-music-select").onchange=async e=>{
    bcSaveMusicSettings({...bcMusicSettings(),source:e.target.value});
    await bcApplySelected(e.target.value!=="off");
    await bcRenderMusic(host);
  };
  host.querySelector("#bc-music-toggle").onclick=async()=>{
    const audio=bcEnsureAudio();
    if(audio.paused){
      if(bcMusicSettings().source==="off")bcSaveMusicSettings({...bcMusicSettings(),source:"builtin"});
      await bcApplySelected(true);
    }else audio.pause();
    await bcRenderMusic(host);
  };
  host.querySelector("#bc-music-remove").onclick=async()=>{
    if(!confirm("Kosongkan Slot Muzik 1?"))return;
    const current=bcMusicSettings();
    await bcDeleteTrack();
    bcSaveMusicSettings({...current,source:current.source==="slot1"?"builtin":current.source});
    await bcApplySelected(false);
    await bcRenderMusic(host);
  };
  host.querySelector("#bc-music-volume").oninput=e=>{
    const volume=Number(e.target.value);
    bcEnsureAudio().volume=volume;
    bcSaveMusicSettings({...bcMusicSettings(),volume});
    host.querySelector(".bc-music-volume b").textContent=Math.round(volume*100)+"%";
  };
}
async function bcMountMusic(){
  const host=document.getElementById("bc-music-manager-mount");if(!host||host.dataset.musicMounted==="true")return;
  host.dataset.musicMounted="true";await bcRenderMusic(host);
}
async function bcBootMusic(){
  await bcApplySelected(false);
  bcArmPlayback();
  bcMountMusic();
  new MutationObserver(()=>bcMountMusic()).observe(document.documentElement,{subtree:true,childList:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bcBootMusic,{once:true});else bcBootMusic();
