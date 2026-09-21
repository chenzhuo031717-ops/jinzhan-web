import {shiftDate,sleepHours,esc} from './core.js';
import {sleepSummary} from './experience.js';

export function durationLabel(hours){const m=Math.round(hours*60);return Number.isFinite(m)&&m>0?`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}m`:'—';}
export function sleepDays(end,range,month=''){
 if(month){const start=month+'-01',next=shiftMonth(month,1)+'-01';const days=[];for(let d=start;d<next;d=shiftDate(d,1))days.push(d);return days;}
 return Array.from({length:range},(_,i)=>shiftDate(end,i-range+1));
}
export function shiftMonth(month,delta){const [y,m]=month.split('-').map(Number),date=new Date(y,m-1+delta,1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;}
function valid(row){return sleepHours(row)>0&&sleepHours(row)<=12;}
function startMinutes(row){const [h,m]=row.sleepAt.slice(11,16).split(':').map(Number);return h*60+m+(h<12?1440:0);}
export function windowAxis(rows){
 const values=rows.filter(valid).flatMap(r=>{const start=startMinutes(r);return [start,start+Math.round(sleepHours(r)*60)];});
 const low=values.length?Math.min(...values):1320,high=values.length?Math.max(...values):2160;
 const floor=Math.min(1320,Math.floor((low-30)/120)*120),ceil=Math.max(2160,Math.ceil((high+30)/120)*120);
 return {floor,ceil,ticks:Array.from({length:(ceil-floor)/120+1},(_,i)=>floor+i*120)};
}
function clock(n){n=((n%1440)+1440)%1440;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function dateLabel(days,i){return days.length<=7||i===0||i===days.length-1||(i%5===4&&days.length-1-i>=3)?days[i].slice(5).split('-').map(Number).join('/'):'';}
function chart(days,rows,selected,duration=false){
 const axis=windowAxis(rows),ticks=duration?[12,9,8,7,6,3,0]:axis.ticks;
 const y=n=>duration?(12-n)/12*100:(n-axis.floor)/(axis.ceil-axis.floor)*100;
 return `<section class="sleep-chart ${duration?'sleep-duration':'sleep-window'}"><h2>${duration?'睡眠时长':'睡眠趋势'}</h2><p class="muted">${duration?'柱高对应每天实际时长；缺失日期保持空白。':'每根柱的上端是睡觉时间，下端是起床时间。'}</p><div class="sleep-window-plot"><div class="sleep-axis">${ticks.map(n=>`<span style="top:${y(n)}%">${duration?n+'h':clock(n)}</span>`).join('')}</div><div class="sleep-window-grid" style="--sleep-days:${days.length}">${ticks.map(n=>`<i style="top:${y(n)}%"></i>`).join('')}${days.map((d,i)=>{
 const r=rows.find(r=>r.date===d),ok=r&&valid(r),a=ok?startMinutes(r):0,h=ok?sleepHours(r):0,b=a+Math.round(h*60);
 const top=duration?y(h):y(a),height=duration?h/12*100:y(b)-y(a);
 const label=r?`${r.sleepAt.slice(11,16)} 睡，${r.wakeAt.slice(11,16)} 起，${durationLabel(sleepHours(r))}${ok?'':'，异常时长'}`:'未记录';
 return `<button class="sleep-window-day${selected===d?' selected':''}" data-act="sleep-select" data-id="${d}" style="--day:${i};--sleep-top:${top}%;--sleep-height:${height}%" aria-label="${d} ${esc(label)}" aria-pressed="${selected===d}">${ok?`<span class="sleep-window-bar">${days.length<=7?`<b>${duration?durationLabel(h):clock(a)}</b>${duration?'':`<em>${clock(b)}</em>`}`:''}</span>`:r?'<span class="sleep-abnormal">!</span>':''}<small>${dateLabel(days,i)}</small></button>`;
 }).join('')}</div></div></section>`;
}
export function renderSleepPage(all,{today,range=7,month='',selected='',backLabel='现在'}){
 const rows=all.filter(r=>!r.deletedAt),removed=all.filter(r=>r.deletedAt),days=sleepDays(today,range,month),ranged=rows.filter(r=>days.includes(r.date)),stats=sleepSummary(ranged),validRows=ranged.filter(valid);
 const avg=validRows.length?durationLabel(validRows.reduce((n,r)=>n+sleepHours(r),0)/validRows.length):'—';
 const chosen=days.includes(selected)?selected:'',row=rows.find(r=>r.date===chosen);
 const detail=chosen?`<div class="sleep-selected"><div><b>${chosen}</b><p>${row?`${esc(row.sleepAt.slice(11,16))} 睡 · ${esc(row.wakeAt.slice(11,16))} 起 · ${durationLabel(sleepHours(row))}`:'这一天没有记录，点击补录。'}</p>${row&&!valid(row)?'<p class="error">异常记录，不参与平均值和趋势</p>':''}${row?.note?`<p>${esc(row.note)}</p>`:''}</div><button class="plain" data-act="${row?'sleep-edit':'sleep'}" data-id="${esc(row?.id||chosen)}">${row?'编辑':'补录'}</button>${row?`<button class="plain danger" data-act="sleep-delete" data-id="${esc(row.id)}">删除</button>`:''}</div>`:'';
 return `<div class="sleep-page-head"><button class="plain sleep-back" data-act="${month?'sleep-dashboard':'sleep-back'}" aria-label="返回${month?'睡眠记录':esc(backLabel)}">←</button><h1>${month?'睡眠历史':'睡眠记录'}</h1><button class="plain sleep-add" data-act="sleep" data-id="${today}" aria-label="添加睡眠记录">＋</button></div>${month?`<div class="sleep-month-nav"><button class="plain" data-act="sleep-month" data-id="-1" aria-label="上个月">‹</button><h2>${month.replace('-',' 年 ')} 月</h2><button class="plain" data-act="sleep-month" data-id="1" aria-label="下个月" ${month>=today.slice(0,7)?'disabled':''}>›</button></div>`:`<button class="sleep-record-cta" data-act="sleep" data-id="${today}"><span class="sleep-moon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 15.2A9 9 0 0 1 8.8 3.2 9 9 0 1 0 20.8 15.2Z"/></svg></span><span><b>记录昨晚睡眠</b><small>睡觉时间、起床时间、可选备注</small></span><strong>＋</strong></button><div class="sleep-range-row"><div class="chip-row">${[7,30].map(n=>`<button class="chip${range===n?' on':''}" data-act="sleep-range" data-id="${n}" aria-pressed="${range===n}">近 ${n} 天</button>`).join('')}</div><button class="plain" data-act="sleep-history">历史记录 ›</button></div>`}<p class="sleep-count muted">已记录 ${ranged.length}/${days.length} 天</p><div class="sleep-stats"><div><span>平均睡觉</span><b>${stats.sleep}</b></div><div><span>平均起床</span><b>${stats.wake}</b></div><div><span>平均时长</span><b>${avg}</b></div></div>${chart(days,ranged,chosen)}${detail}${chart(days,ranged,chosen,true)}${month&&removed.length?`<details><summary>已删除记录 · ${removed.length}</summary>${removed.map(r=>`<div class="record">${esc(r.date)} · ${durationLabel(sleepHours(r))} <button data-act="sleep-restore" data-id="${esc(r.id)}">恢复</button></div>`).join('')}</details>`:''}`;
}
