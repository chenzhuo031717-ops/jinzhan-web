import {systemPrompt,resultFromAI,explicitConflict} from './core.js';
// 本地 launch.py 提供 /api/chat 转发；纯静态托管（如 GitHub Pages）没有该入口时，
// DeepSeek API 支持浏览器 CORS 直连，自动回退到直连，功能不变。
function endpoints(){
 const direct='https://api.deepseek.com/chat/completions';
 if(location.protocol==='file:')return [direct];
 return ['/api/chat',direct];
}
export async function requestJSON(settings,key,system,text,signal,deadline=Date.now()+90000){
 if(!key)throw Error('先在设置填写你的 DeepSeek API Key；也可以手动记录');
 const controller=new AbortController();const relay=()=>controller.abort();signal?.addEventListener('abort',relay,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(()=>controller.abort(),Math.max(1,deadline-Date.now()));
 try{for(let attempt=0;attempt<2;attempt++){
  let response=null,staticHost=false;
  for(const endpoint of endpoints()){
   response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model:settings.model||'deepseek-v4-flash',messages:[{role:'system',content:system},{role:'user',content:text}],response_format:{type:'json_object'},max_tokens:6000,stream:false}),signal:controller.signal});
   if(response.status===404||response.status===405||response.status===501)continue; // 该托管无转发入口，换直连
   staticHost=endpoint.startsWith('https://');break;
  }
  if(!response)throw Error('AI 请求失败；原文已保留。');
  if(!response.ok){if(attempt===0&&[429,502,503,504].includes(response.status)&&deadline-Date.now()>3000)continue;throw Error(`AI 请求失败（${response.status}）。检查模型、Key 和网络；原文已保留。`);}
  const body=await response.json();const choice=body.choices?.[0];if(choice?.finish_reason!=='stop')throw Error('AI 未完整返回，原文已保留，请重试');try{return JSON.parse(choice.message.content);}catch{throw Error('AI 返回的 JSON 无法读取，原文已保留');}
 }}catch(e){if(e.name==='AbortError')throw Error(signal?.aborted?'已取消，原文已保留':'AI 请求超时，原文已保留');if(e instanceof TypeError)throw Error('无法连接模型服务，请检查网络后重试；原文已保留。');throw e;}finally{clearTimeout(timer);signal?.removeEventListener('abort',relay);}
}
export async function organize(s,key,text,signal,onCandidate){const deadline=Date.now()+90000;const prompt=systemPrompt(s,text);let result=resultFromAI(await requestJSON(s.settings,key,prompt,text,signal,deadline));await onCandidate(result);let conflict=explicitConflict(text,result);if(conflict){result=resultFromAI(await requestJSON(s.settings,key,prompt+'\n上次结果与明确数量冲突：'+conflict,text,signal,deadline));await onCandidate(result);conflict=explicitConflict(text,result);if(conflict)throw Error(conflict+' 候选已保留，可手动纠正。');}return result;}
