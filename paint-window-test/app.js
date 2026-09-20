const GA_ID='G-1B9F5Q2TKZ';
const OPERATOR_MODE=new URLSearchParams(location.search).get('operator')==='1';
const BASE='/traffic-revenue-lab-hhw/paint-window-test/';
const PRODUCTS={
 duration:{name:'Sherwin-Williams Duration Exterior',brand:'Sherwin-Williams',minF:35,maxF:null,precipHours:3,postMinF:35,postHours:48,dewSpreadF:5,source:'https://sherlink.sherwin.com/sher-link/ViewHearsCountryCodeDoc?language=E&sku=650405830&type=DP',rule:'Air, surface and material above 35°F and at least 5°F above dew point; avoid rain or snow expected within 2–3 hours; do not allow air or surface below 35°F within 48 hours.'},
 latitude:{name:'Sherwin-Williams Latitude Exterior',brand:'Sherwin-Williams',minF:35,maxF:120,precipHours:1,postMinF:null,postHours:0,dewSpreadF:null,source:'https://www.sherwin-williams.com/homeowners/products/latitude-exterior-acrylic-latex',rule:'Application range 35–120°F; develops resistance to rain or dew in as little as one hour.'},
 duramax:{name:'Valspar Duramax Exterior',brand:'Valspar',minF:35,maxF:90,precipHours:12,postMinF:35,postHours:48,dewSpreadF:null,heavyDew:true,source:'https://www.valspar.com/en/products/exterior-paints-primers/duramax-exterior-paint-primer',rule:'Paint, surface and air 35–90°F during application and drying; no temperature below 35°F within 48 hours; avoid heavy dew or precipitation expected in the next 12 hours.'},
 integrity:{name:'Valspar Integrity Select Exterior',brand:'Valspar',minF:35,maxF:90,precipHours:3,postMinF:35,postHours:48,dewSpreadF:null,heavyDew:true,source:'https://www.valspar.com/en/products/exterior-paints-primers/integrity-select-exterior-paint-primer',rule:'Application 35–90°F; no temperature below 35°F within 48 hours; avoid heavy dew or precipitation expected in the next 2.5 hours. This prototype checks a conservative 3-hour block.'}
};
let analyticsReady=false;
function gtag(){window.dataLayer=window.dataLayer||[];window.dataLayer.push(arguments)}
function loadAnalytics(){if(OPERATOR_MODE||analyticsReady)return;analyticsReady=true;window.dataLayer=window.dataLayer||[];gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);document.head.appendChild(s);gtag('js',new Date());gtag('config',GA_ID,{send_page_view:true,allow_google_signals:false});}
function setConsent(choice){localStorage.setItem('trl_analytics_consent',choice);const c=document.getElementById('consent');if(c)c.hidden=true;if(choice==='granted')loadAnalytics()}
function sendEvent(name,params={}){if(analyticsReady)gtag('event',name,params)}
function initConsent(){const c=document.getElementById('consent');if(!c)return;const saved=localStorage.getItem('trl_analytics_consent');if(saved==='granted')loadAnalytics();else if(saved!=='denied')c.hidden=false;document.getElementById('acceptAnalytics')?.addEventListener('click',()=>setConsent('granted'));document.getElementById('declineAnalytics')?.addEventListener('click',()=>setConsent('denied'));document.getElementById('privacyPrefs')?.addEventListener('click',e=>{e.preventDefault();c.hidden=false})}
function cToF(c){return c*9/5+32}
function isPrecipText(s=''){return /(rain|shower|thunder|snow|sleet|drizzle|freezing)/i.test(s)}
function fmt(v,d=0){return Number.isFinite(v)?v.toFixed(d):'—'}
function evaluate(product,periods){
 const p=PRODUCTS[product], now=periods[0];
 if(!p||!now)return {state:'DATA INSUFFICIENT',cls:'warn',reasons:['No usable NWS hourly forecast was returned.']};
 const reasons=[], blockers=[];
 const t=now.temperature;
 if(t<p.minF)blockers.push('Current air temperature is below the product minimum.');
 if(p.maxF!==null&&t>p.maxF)blockers.push('Current air temperature is above the product maximum.');
 const risk=periods.slice(0,Math.max(1,p.precipHours));
 if(risk.some(x=>isPrecipText(x.shortForecast)))blockers.push('NWS hourly wording includes precipitation inside the product-specific rain window.');
 if(p.postMinF!==null){const post=periods.slice(0,p.postHours);if(post.length<Math.min(p.postHours,periods.length))reasons.push('Full post-application temperature horizon is not available.');if(post.some(x=>x.temperature<p.postMinF))blockers.push('NWS hourly air temperature falls below the product post-application minimum.');}
 if(p.dewSpreadF!==null&&Number.isFinite(now.dewF)){const spread=t-now.dewF;if(spread<p.dewSpreadF)blockers.push('Current forecast air/dew-point spread is below the product minimum.');else reasons.push('Current forecast air/dew-point spread is '+fmt(spread,0)+'°F.');}
 if(p.heavyDew){const maxRh=Math.max(...risk.map(x=>Number.isFinite(x.rh)?x.rh:-1));if(maxRh>=90)reasons.push('Relative humidity reaches '+fmt(maxRh,0)+'% in the product window; heavy-dew risk still needs manual judgment.');}
 reasons.push('NWS air forecast does not measure your actual surface temperature, surface moisture, shade/sun exposure, or substrate condition.');
 if(blockers.length)return {state:'WAIT / CONDITION NOT MET',cls:'stop',reasons:[...blockers,...reasons]};
 return {state:'POSSIBLE WINDOW',cls:'ok',reasons};
}
async function getForecast(lat,lon){
 const point=await fetch('https://api.weather.gov/points/'+lat.toFixed(4)+','+lon.toFixed(4),{headers:{Accept:'application/geo+json'}});
 if(!point.ok)throw new Error('NWS point lookup failed');
 const pj=await point.json(), url=pj?.properties?.forecastHourly;
 if(!url)throw new Error('NWS hourly forecast link missing');
 const fc=await fetch(url,{headers:{Accept:'application/geo+json'}});
 if(!fc.ok)throw new Error('NWS hourly forecast failed');
 const fj=await fc.json();
 return (fj?.properties?.periods||[]).map(x=>({start:x.startTime,temperature:x.temperature,shortForecast:x.shortForecast||'',pop:x.probabilityOfPrecipitation?.value,dewF:Number.isFinite(x.dewpoint?.value)?cToF(x.dewpoint.value):NaN,rh:x.relativeHumidity?.value}));
}
function renderWeather(product,periods){
 const p=PRODUCTS[product], out=document.getElementById('weatherResult'), ev=evaluate(product,periods), first=periods[0];
 out.hidden=false;out.innerHTML='<span class="status '+ev.cls+'">'+ev.state+'</span><h2>'+p.name+'</h2><div class="metric"><strong>NWS now</strong><span>'+fmt(first.temperature,0)+'°F · '+first.shortForecast+' · precip '+(first.pop??'—')+'%</span></div><div class="metric"><strong>Official product rule</strong><span>'+p.rule+'</span></div><div class="metric"><strong>What this check found</strong><span>'+ev.reasons.map(x=>'• '+x).join('<br>')+'</span></div><div class="source"><a id="officialSource" target="_blank" rel="noopener" href="'+p.source+'">Open official manufacturer source</a><p class="small">Experimental decision support only. The current label/TDS, actual surface temperature/moisture and substrate condition control.</p></div>';
 sendEvent('weather_result_rendered',{product,result:ev.state});
 document.getElementById('officialSource')?.addEventListener('click',()=>sendEvent('official_source_clicked',{product,result:ev.state}));
 out.scrollIntoView({behavior:'smooth',block:'start'});
}
function startWeather(product){
 sendEvent('weather_check_started',{product});
 if(!navigator.geolocation){document.getElementById('weatherResult').hidden=false;document.getElementById('weatherResult').innerHTML='<span class="status warn">DATA INSUFFICIENT</span><p>Your browser does not expose location to this page.</p>';sendEvent('weather_data_insufficient',{product,reason:'geolocation_unavailable'});return}
 navigator.geolocation.getCurrentPosition(async pos=>{try{const periods=await getForecast(pos.coords.latitude,pos.coords.longitude);renderWeather(product,periods)}catch(e){const out=document.getElementById('weatherResult');out.hidden=false;out.innerHTML='<span class="status warn">DATA INSUFFICIENT</span><p>NWS weather data could not be loaded. Use the official product source and a local forecast directly.</p>';sendEvent('weather_data_insufficient',{product,reason:'nws_fetch_failed'})}},()=>{const out=document.getElementById('weatherResult');out.hidden=false;out.innerHTML='<span class="status warn">DATA INSUFFICIENT</span><p>Location was not shared. You can still use the product rule and official source below.</p>';sendEvent('weather_data_insufficient',{product,reason:'location_denied'})},{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
}
function initProduct(){
 const product=document.body.dataset.product;if(!product)return;const p=PRODUCTS[product];document.querySelectorAll('[data-product-name]').forEach(x=>x.textContent=p.name);document.querySelectorAll('[data-product-rule]').forEach(x=>x.textContent=p.rule);const src=document.getElementById('productSource');if(src)src.href=p.source;document.getElementById('checkWeather')?.addEventListener('click',()=>startWeather(product));document.getElementById('compareGeneric')?.addEventListener('click',()=>{document.getElementById('genericCompare').hidden=false;sendEvent('generic_vs_product_compared',{product})});document.getElementById('shareResult')?.addEventListener('click',async()=>{sendEvent('share_clicked',{product});if(navigator.share){try{await navigator.share({title:document.title,url:location.href})}catch(e){}}else{await navigator.clipboard?.writeText(location.href);alert('Page link copied.') }})}
document.addEventListener('DOMContentLoaded',()=>{initConsent();initProduct()});