"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import "./import-manager.css";

type GenericAgent = Record<string, any>;
type ImportStats = { files:number; rows:number; added:number; updated:number; departed:number; mutualized:number; duplicates:number; rejected:number };

const emptyStats=():ImportStats=>({files:0,rows:0,added:0,updated:0,departed:0,mutualized:0,duplicates:0,rejected:0});
const text=(v:any)=>String(v??"").trim();
const key=(v:any)=>text(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const dateText=(v:any)=>{
  if(!v) return "";
  const d=v instanceof Date?v:new Date(v);
  return Number.isNaN(d.getTime())?text(v):d.toLocaleDateString("fr-FR");
};
const unique=(values:string[])=>Array.from(new Set(values.filter(Boolean)));

function classify(headers:string[],rows:GenericAgent[]){
  const h=headers.map(key);
  if(h.includes("action")&&h.includes("date action")) return "departures";
  const first=rows.find(r=>text(r["ID Unique"]||r["ID unique"]));
  const main=key(first?.["Activité Principale"]), activity=key(first?.["Activité"]);
  if(main==="front"&&activity==="asynchrone") return "front_to_async";
  if(main==="asynchrone"&&activity==="front") return "async_to_front";
  if(main==="front") return "front";
  if(main==="asynchrone") return "async";
  return "unknown";
}

function buildDraft(existing:GenericAgent[], batches:{name:string;type:string;rows:GenericAgent[]}[]){
  const hasImported=existing.some(a=>a.uniqueId);
  const base=hasImported?existing:[];
  const map=new Map<string,GenericAgent>(base.map(a=>[text(a.uniqueId||a.id),{...a,asyCapabilities:[...(a.asyCapabilities||[])],mutualizedCapabilities:[...(a.mutualizedCapabilities||[])],contacts:{...(a.contacts||{})},managers:{...(a.managers||{})}}]));
  const originalIds=new Set(map.keys()), touched=new Set<string>(), departureEvents=new Set<string>();
  const stats=emptyStats(); stats.files=batches.length;
  const fileResults:{name:string;type:string;rows:number;accepted:number;rejected:number}[]=[];

  for(const batch of batches){
    let accepted=0,rejected=0;
    for(const row of batch.rows){
      stats.rows++;
      const uid=text(row["ID Unique"]||row["ID unique"]);
      if(!uid){stats.rejected++;rejected++;continue;}
      const isDeparture=batch.type==="departures"&&key(row["Action"]).startsWith("depart");
      if(batch.type==="departures"&&!isDeparture){stats.rejected++;rejected++;continue;}
      if(isDeparture){
        const departureDate=dateText(row["Date Action"]);
        if(!departureDate){stats.rejected++;rejected++;continue;}
        const eventKey=`${uid}|${departureDate}|departure`;
        if(departureEvents.has(eventKey)){stats.duplicates++;continue;}
        departureEvents.add(eventKey);
        const current=map.get(uid)||{id:uid,uniqueId:uid,nom:uid,equipe:text(row["Activité"])||"Non renseigné",activite:text(row["Activité"])||"Front",arrivee:"—",prod:0,qualite:0,tendance:0,asyCapabilities:[],mutualizedCapabilities:[],contacts:{},managers:{}};
        map.set(uid,{...current,statut:"Parti",departureDate,departureReason:text(row["Motif"]).replace("periode","période"),mutualizedCapabilities:[],departureLog:text(row["Log Mayday"])});
        stats.departed++;accepted++;touched.add(uid);continue;
      }

      const mainRaw=text(row["Activité Principale"]||row["Activité"]||"Front");
      const main:"Front"|"Asynchrone"=key(mainRaw)==="asynchrone"?"Asynchrone":"Front";
      const asyncType=text(row["Activité ASY"]).toUpperCase();
      const current=map.get(uid)||{id:uid,uniqueId:uid,nom:text(row["Nom Prénom"])||uid,equipe:main==="Front"?"CC Front":"CC Asynchrone",activite:main,statut:"Actif",arrivee:dateText(row["Date entrée prod"])||"—",prod:0,qualite:0,tendance:0,asyCapabilities:[],mutualizedCapabilities:[],contacts:{},managers:{}};
      const asyCapabilities=[...(current.asyCapabilities||[])];
      const mutualized=[...(current.mutualizedCapabilities||[])];
      if(batch.type==="async"&&asyncType) asyCapabilities.push(asyncType);
      if(batch.type==="front_to_async") mutualized.push(`Asynchrone${asyncType?` ${asyncType}`:""}`);
      if(batch.type==="async_to_front") mutualized.push("Front");
      const channel=batch.type==="front"||batch.type==="async_to_front"?"Front":asyncType?`ASY ${asyncType}`:main;
      map.set(uid,{...current,id:uid,uniqueId:uid,nom:text(row["Nom Prénom"])||current.nom,site:text(row["Site"])||current.site,email:text(row["Adresse mail"])||current.email,activite:main,equipe:main==="Front"?"CC Front":`CC Asynchrone${asyncType?` ${asyncType}`:""}`,statut:current.statut==="Parti"?"Parti":"Actif",arrivee:dateText(row["Date entrée prod"])||current.arrivee,asyCapabilities:unique(asyCapabilities),mutualizedCapabilities:unique(mutualized),contacts:{...(current.contacts||{}),[channel]:text(row["Contact"])},managers:{...(current.managers||{}),[channel]:text(row["Manager"])}});
      accepted++;touched.add(uid);
    }
    fileResults.push({name:batch.name,type:batch.type,rows:batch.rows.length,accepted,rejected});
  }
  for(const uid of touched){originalIds.has(uid)?stats.updated++:stats.added++;}
  stats.mutualized=Array.from(map.values()).filter(a=>(a.mutualizedCapabilities||[]).length>0&&a.statut!=="Parti").length;
  return {agents:Array.from(map.values()),stats,fileResults};
}

const typeLabel:Record<string,string>={front:"Effectif Front",async:"Effectif Asynchrone",front_to_async:"Front mutualisé vers ASY",async_to_front:"ASY mutualisé vers Front",departures:"Départs",unknown:"Format non reconnu"};

export default function ImportManager({agents,onApply,onCancel}:{agents:GenericAgent[];onApply:(next:GenericAgent[],stats:ImportStats)=>void;onCancel:()=>void}){
  const [draft,setDraft]=useState<ReturnType<typeof buildDraft>|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const choose=async(files:FileList|null)=>{
    if(!files?.length)return; setLoading(true);setError("");
    try{
      const batches=[] as {name:string;type:string;rows:GenericAgent[]}[];
      for(const file of Array.from(files)){
        const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json<GenericAgent>(ws,{defval:"",raw:true});
        const headers=rows.length?Object.keys(rows[0]):[];
        const type=classify(headers,rows);
        if(type==="unknown") throw new Error(`${file.name} : colonnes non reconnues`);
        batches.push({name:file.name,type,rows});
      }
      setDraft(buildDraft(agents,batches));
    }catch(e:any){setError(e?.message||"Impossible de lire les fichiers.");setDraft(null)}finally{setLoading(false)}
  };
  return <div className="import-manager">
    <label className="import-drop"><input type="file" accept=".xlsx,.xls,.csv" multiple onChange={e=>choose(e.target.files)}/><b>{loading?"Lecture des fichiers…":"Sélectionner les fichiers d’effectif"}</b><span>Front, ASY CD, ASY MP, mutualisations et départs · plusieurs fichiers autorisés</span></label>
    {error&&<div className="import-error">⚠ {error}</div>}
    {draft&&<><div className="import-stats">
      <div><strong>{draft.stats.files}</strong><span>fichiers</span></div><div><strong>{draft.stats.rows}</strong><span>lignes</span></div><div><strong>{draft.stats.added}</strong><span>ajouts</span></div><div><strong>{draft.stats.updated}</strong><span>mises à jour</span></div><div><strong>{draft.stats.departed}</strong><span>départs</span></div><div><strong>{draft.stats.duplicates}</strong><span>doublons</span></div><div><strong>{draft.stats.rejected}</strong><span>rejets</span></div>
    </div><div className="import-files">{draft.fileResults.map(f=><div key={f.name}><span>✓</span><div><strong>{f.name}</strong><small>{typeLabel[f.type]} · {f.accepted}/{f.rows} lignes acceptées</small></div></div>)}</div>
    <p className="import-note">L’activité principale est conservée. Les habilitations mutualisées sont ajoutées séparément. Les doublons sont rapprochés par ID Unique.</p>
    <div className="form-actions"><button type="button" className="btn secondary" onClick={onCancel}>Annuler</button><button type="button" className="btn primary" onClick={()=>onApply(draft.agents,draft.stats)}>Confirmer l’import</button></div></>}
  </div>
}
