const path=require('path');require('dotenv').config({path:path.join(__dirname,'..','.env')});
const{initializeApp}=require('firebase/app');const{getFirestore,collection,getDocs,updateDoc,doc}=require('firebase/firestore');
const https=require('https');
const app=initializeApp({apiKey:process.env.EXPO_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,projectId:process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,storageBucket:process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,messagingSenderId:process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,appId:process.env.EXPO_PUBLIC_FIREBASE_APP_ID},'final-fix');
const db=getFirestore(app);
const AREA_COORDS={palma:[39.5696,2.6502],calvia:[39.5650,2.5060],andratx:[39.5760,2.4200],pollenca:[39.8770,3.0170],alcudia:[39.8530,3.1210],soller:[39.7670,2.7140],inca:[39.7210,2.9100],manacor:[39.5690,3.2090],santanyi:[39.3540,3.1280],llucmajor:[39.4900,2.8900],marratxi:[39.6420,2.7530],capdepera:[39.7030,3.4350],arta:[39.6930,3.3490],felanitx:[39.4700,3.1480],campos:[39.4310,3.0190],muro:[39.7350,3.0580],'sa-pobla':[39.7690,3.0230],'santa-maria':[39.6510,2.7730],binissalem:[39.6860,2.8360],'ses-salines':[39.3360,3.0510],esporles:[39.6680,2.5790],porreres:[39.5160,3.0220],'son-servera':[39.6210,3.3600],deia:[39.7480,2.6490],valldemossa:[39.7100,2.6220],bunyola:[39.6960,2.6990],araro:[39.7040,2.7920]};

function nominatimSearch(query){return new Promise(resolve=>{const url='https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(query)+'&limit=1&countrycodes=es';https.get(url,{headers:{'User-Agent':'MallorcaDirectory/1.0'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d))}catch{resolve(null)}})}).on('error',()=>resolve(null))})}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function distKm(l1,ln1,l2,ln2){const R=6371;const d=(b,a)=>(b-a)*Math.PI/180;const a=Math.sin(d(l2,l1)/2)**2+Math.cos(l1*Math.PI/180)*Math.cos(l2*Math.PI/180)*Math.sin(d(ln2,ln1)/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

async function main(){
  const snap=await getDocs(collection(db,'businesses'));
  let geoFixed=0, areaFixed=0, skipped=0;

  for(const d of snap.docs){
    const b=d.data();const area=b.area;const c=AREA_COORDS[area];
    if(!c){skipped++;continue}
    const d2=distKm(b.location.lat,b.location.lng,c[0],c[1]);
    if(d2<=25){skipped++;continue}

    const addr=(b.address||'').trim();
    const hasAddr=addr!=='Mallorca'&&addr.length>10;

    if(hasAddr){
      // Try Nominatim with full address
      const query=addr+', Mallorca, Spain';
      const result=await nominatimSearch(query);
      await sleep(1100);
      if(result&&result.length>0){
        const lat=parseFloat(result[0].lat);const lng=parseFloat(result[0].lon);
        if(lat>=39&&lat<=40&&lng>=2&&lng<=4){
          await updateDoc(doc(db,'businesses',d.id),{
            location:{lat:Math.round(lat*1e6)/1e6,lng:Math.round(lng*1e6)/1e6},
            updatedAt:new Date().toISOString(),
          });
          console.log('GEO:'+b.name+'['+area+'] '+addr.substring(0,40)+' -> '+lat.toFixed(4)+','+lng.toFixed(4));
          geoFixed++;
          continue;
        }
      }
      // Nominatim failed, fall through to area center
    }

    // Assign area center
    await updateDoc(doc(db,'businesses',d.id),{
      location:{lat:Math.round(c[0]*1e6)/1e6,lng:Math.round(c[1]*1e6)/1e6},
      updatedAt:new Date().toISOString(),
    });
    console.log('AREA:'+b.name+'['+area+'] was '+b.location.lat.toFixed(4)+','+b.location.lng.toFixed(4)+' -> center');
    areaFixed++;
  }

  console.log('\nDone. Geo-fixed:'+geoFixed+', Area-center:'+areaFixed+', Skipped:'+skipped);
  process.exit(0);
}
main();
