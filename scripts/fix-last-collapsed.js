const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}, 'fix-last');
const db = getFirestore(app);

const AREA_COORDS = {
  palma:[39.5696,2.6502],calvia:[39.5650,2.5060],andratx:[39.5760,2.4200],
  pollenca:[39.8770,3.0170],alcudia:[39.8530,3.1210],soller:[39.7670,2.7140],
  inca:[39.7210,2.9100],manacor:[39.5690,3.2090],santanyi:[39.3540,3.1280],
  llucmajor:[39.4900,2.8900],marratxi:[39.6420,2.7530],capdepera:[39.7030,3.4350],
  arta:[39.6930,3.3490],felanitx:[39.4700,3.1480],campos:[39.4310,3.0190],
  muro:[39.7350,3.0580],'sa-pobla':[39.7690,3.0230],'santa-maria':[39.6510,2.7730],
  binissalem:[39.6860,2.8360],'ses-salines':[39.3360,3.0510],esporles:[39.6680,2.5790],
  porreres:[39.5160,3.0220],'son-servera':[39.6210,3.3600],
  deia:[39.7480,2.6490],valldemossa:[39.7100,2.6220],
  bunyola:[39.6960,2.6990],araro:[39.7040,2.7920],
};

function distKm(lat1,lng1,lat2,lng2){const R=6371;const dLat=(lat2-lat1)*Math.PI/180;const dLng=(lng2-lng1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

async function main(){
  const snap=await getDocs(collection(db,'businesses'));
  const groups={};
  for(const d of snap.docs){
    const b=d.data();
    const key=(b.name||'')+'|'+(b.category||'');
    if(!groups[key])groups[key]=[];
    groups[key].push({id:d.id,...b});
  }

  let fixed=0;
  for(const[key,entries]of Object.entries(groups)){
    if(entries.length<=1)continue;
    const locs=entries.map(e=>(e.location?.lat||0).toFixed(4)+','+(e.location?.lng||0).toFixed(4));
    const unique=[...new Set(locs)];
    if(unique.length!==1)continue;
    const areas=[...new Set(entries.map(e=>e.area))];
    if(areas.length<=1)continue;

    // Find which area is closest to the collapsed coordinate
    const sharedLat=entries[0].location.lat;
    const sharedLng=entries[0].location.lng;
    let bestArea=areas[0],bestDist=Infinity;
    for(const a of areas){
      const c=AREA_COORDS[a];if(!c)continue;
      const d=distKm(sharedLat,sharedLng,c[0],c[1]);
      if(d<bestDist){bestDist=d;bestArea=a;}
    }

    // Fix entries whose area != bestArea
    for(const e of entries){
      if(e.area===bestArea)continue;
      const c=AREA_COORDS[e.area];
      if(!c){console.log('SKIP no coords for area:'+e.area+' name:'+e.name);continue;}
      await updateDoc(doc(db,'businesses',e.id),{
        location:{lat:Math.round(c[0]*1e6)/1e6,lng:Math.round(c[1]*1e6)/1e6},
        updatedAt:new Date().toISOString(),
      });
      console.log('FIXED:'+e.name+'('+e.area+'): was '+e.location.lat.toFixed(4)+','+e.location.lng.toFixed(4)+' -> '+c[0]+','+c[1]);
      fixed++;
    }
  }
  console.log('Done. Fixed:'+fixed);
  process.exit(0);
}
main();
