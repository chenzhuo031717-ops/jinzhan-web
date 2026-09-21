// The installed shell never uploads records or caches AI responses.
const connectionNotice=document.createElement('div');connectionNotice.id='connection-state';connectionNotice.setAttribute('role','status');
document.querySelector('main').insertBefore(connectionNotice,document.querySelector('#composer'));
function updateConnection(){connectionNotice.hidden=navigator.onLine;connectionNotice.textContent='网络暂时断开，请连接网络后继续。未提交的输入会保留。';}
updateConnection();window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 navigator.serviceWorker.register(new URL('sw.js',location.href),{updateViaCache:'none'}).then(reg=>{
  const notifyUpdate=()=>{if(!reg.waiting||!reg.active||document.querySelector('.pwa-update'))return;const bar=document.createElement('div');bar.className='pwa-update';bar.innerHTML='<span>新版已准备好。保存后关闭所有进展窗口，再重新打开即可更新。</span><button type="button">知道了</button>';bar.querySelector('button').onclick=()=>bar.remove();document.body.append(bar);};
  notifyUpdate();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',notifyUpdate);});
 }).catch(error=>{console.warn('网页更新检查暂不可用，下次打开会重试',error.name);});
}

