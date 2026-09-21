import {addRaw,applyNewResult,patchTask,today,shiftDate,periodicDoneToday,completedOn,uid,localDateOf} from './core.js';

export const isDaily=t=>new Set(t.recurrenceDays||[]).size===7;
export function saveDaily(s,text){
 const content=String(text||'').trim();
 if(!content)throw Error('先写一件每天要做的事');
 const sourceId=addRaw(s,content);
 applyNewResult(s,sourceId,{tasks:[{title:content.split(/\r?\n/)[0],details:content,timeText:'',nextDate:today(),recurrenceDays:[1,2,3,4,5,6,7],recurrenceTime:null,tags:[]}],cognitions:[]});
 return sourceId;
}
// Toggling repetition never creates a replacement task or removes progress.
export function setDaily(s,id,enabled){
 const t=s.tasks.find(t=>t.id===id);if(!t)throw Error('行动不存在');
 if(isDaily(t)===enabled)return;
 const wasDone=periodicDoneToday(t),wasCompleted=t.status==='completed';
 if(enabled&&wasCompleted&&Number.isFinite(t.completedAt)&&!t.updates.some(u=>u.kind==='completion'&&!u.cancelledAt&&localDateOf(u.createdAt)===localDateOf(t.completedAt))){
  t.updates.push({id:uid(),kind:'completion',content:'完成行动（开启每日重复前）',createdAt:t.completedAt});
 }
 const changes={recurrenceDays:enabled?[1,2,3,4,5,6,7]:[],recurrenceTime:enabled?(t.recurrenceTime||t.nextTime||t.time||null):null};
 if(enabled)changes.nextDate=completedOn(t,today())?shiftDate(today(),1):wasCompleted?today():(t.nextDate||t.date||today());
 Object.assign(t,patchTask(t,changes));
 if(enabled&&wasCompleted){t.status='pending';t.completedAt=null;}
 if(!enabled&&wasDone){t.previousStatus='pending';t.status='completed';t.completedAt=t.updates.filter(u=>u.kind==='completion'&&!u.cancelledAt&&localDateOf(u.createdAt)===today()).at(-1).createdAt;}
}

export function taskCaption(t,displayTime){
 if(t.status==='waiting_confirmation')return '原文有冲突，待你判断';
 if(isDaily(t))return '每日'+(t.recurrenceTime?' '+t.recurrenceTime:'')+(t.nextDate&&t.nextDate>today()?' · 下次 '+t.nextDate:'');
 const time=displayTime(t);return time?(t.recurrenceDays?.length?'':'下次 ')+time:'待安排';
}
