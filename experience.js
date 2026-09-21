import {shiftDate,validDate,sleepHours} from './core.js';

// Matches Android SleepTimeCalculator: the selected date is the sleep date.
export function sleepTiming(date,sleepClock,wakeClock){
 if(!date||!validDate(date)||![sleepClock,wakeClock].every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t||'')))throw Error('请选择日期、睡觉时间和起床时间');
 return {sleepAt:date+'T'+sleepClock,wakeAt:(wakeClock>sleepClock?date:shiftDate(date,1))+'T'+wakeClock};
}
export function sleepSummary(rows){
 const valid=rows.filter(r=>!r.deletedAt&&sleepHours(r)>0&&sleepHours(r)<=12);
 const clock=key=>{if(!valid.length)return '—';const values=valid.map(r=>{const [h,m]=r[key].slice(11,16).split(':').map(Number);const n=h*60+m;return n<18*60?n+1440:n;});const n=Math.round(values.reduce((a,b)=>a+b,0)/values.length)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
 return {count:valid.length,hours:valid.length?(valid.reduce((n,r)=>n+sleepHours(r),0)/valid.length).toFixed(1):'—',sleep:clock('sleepAt'),wake:clock('wakeAt')};
}
export function renameGroup(s,from,to){
 to=String(to||'').trim();if(!to)throw Error('分组名称不能为空');if(from===to)return;
 if(s.tasks.some(t=>t.group===to))throw Error('已有同名分组，请在行动里选择移入，避免意外合并');
 for(const t of s.tasks)if(t.group===from){t.group=to;t.updatedAt=Date.now();}
 s.settings.groupOrder=(s.settings.groupOrder||[]).map(g=>g===from?to:g);
}
export function editProgress(s,taskId,updateId,changes,original){
 const t=s.tasks.find(t=>t.id===taskId),u=t?.updates.find(u=>u.id===updateId);
 if(!u||u.deletedAt)throw Error('进展记录不存在，请重新打开');
 if(u.kind==='completion')throw Error('完成记录请使用完成或撤销入口');
 if(JSON.stringify(u)!==JSON.stringify(original))throw Error('这条进展已在别处修改，请重新打开');
 if(!changes.content?.trim())throw Error('进展不能为空');
 const version={content:u.content,nextStep:u.nextStep||null,editedAt:Date.now()};
 u.versions=[...(u.versions||[]),version];u.content=changes.content.trim();u.nextStep=changes.nextStep?.trim()||null;u.updatedAt=Date.now();t.updatedAt=Date.now();
}
