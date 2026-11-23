/* Original, local-only portfolio studies. No network requests or real account data. */
(() => {
  'use strict';
  const paths = {
    backend: { title:'Build better APIs', detail:'Java · Spring Boot · REST', icon:'{ }', note:'Explore the backend path. Find people who want to build it with you.' },
    frontend: { title:'Make every interaction count', detail:'React · JavaScript · CSS', icon:'⌘', note:'Explore the frontend path. Turn a shared idea into an interface.' },
    dsa: { title:'Find a better way through', detail:'Patterns · Algorithms · Practice', icon:'⌁', note:'Explore the DSA path. Work through the problem, together.' }
  };
  const samples = [
    {name:'Groceries',category:'Food',method:'UPI',amount:520},
    {name:'Bus pass',category:'Travel',method:'UPI',amount:300},
    {name:'A good book',category:'Learning',method:'Card',amount:450},
    {name:'Lunch with friends',category:'Food',method:'UPI',amount:410},
    {name:'Auto ride',category:'Travel',method:'Cash',amount:150},
    {name:'Course notes',category:'Learning',method:'UPI',amount:350}
  ];
  const money = amount => `₹${amount.toLocaleString('en-IN')}`;
  const initSphere = root => {
    const buttons=[...root.querySelectorAll('[data-ex-track]')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const path=paths[button.dataset.exTrack];
      if(!path)return;
      buttons.forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));
      root.querySelector('.ex-path-title').textContent=path.title;
      root.querySelector('.ex-path-detail').textContent=path.detail;
      root.querySelector('.ex-path-icon').textContent=path.icon;
      root.querySelector('.ex-path-note').textContent=path.note;
    }));
  };
  const initWall = root => {
    const wall=root.querySelector('.ex-gallery-wall');
    const frames=[...root.querySelectorAll('[data-ex-frame]')];
    const initial=[{x:3,y:7,r:-9},{x:35,y:0,r:5},{x:67,y:12,r:-5}];
    const variations=[initial,[{x:5,y:0,r:0},{x:35,y:14,r:0},{x:65,y:0,r:0}],[{x:8,y:16,r:7},{x:34,y:0,r:-4},{x:61,y:19,r:8}]];
    let layout=initial.map(v=>({...v}));
    let arrangement=0;
    let activeDrag=null;
    const status=root.querySelector('.ex-wall-status');
    const paint=()=>frames.forEach((frame,i)=>{
      frame.style.left=`${layout[i].x}%`;
      frame.style.top=`${layout[i].y}%`;
      frame.style.setProperty('--ex-frame-r',`${layout[i].r}deg`);
    });
    const constrain=(i,x,y)=>{
      const width=wall.clientWidth||1,height=wall.clientHeight||1;
      const maxX=Math.max(0,100-frames[i].offsetWidth/width*100);
      const maxY=Math.max(0,100-frames[i].offsetHeight/height*100);
      layout[i].x=Math.max(0,Math.min(maxX,x));
      layout[i].y=Math.max(0,Math.min(maxY,y));
      paint();
    };
    const finish=()=>{
      if(!activeDrag)return;
      activeDrag.frame.classList.remove('is-dragging');
      activeDrag=null;
      status.textContent='A small move. A different composition.';
    };
    frames.forEach((frame,i)=>{
      frame.addEventListener('pointerdown',event=>{
        if(event.button!==0 || activeDrag)return;
        activeDrag={frame,index:i,pointer:event.pointerId,x:event.clientX,y:event.clientY,originX:layout[i].x,originY:layout[i].y};
        frame.setPointerCapture(event.pointerId);
        frame.classList.add('is-dragging');
        frame.focus({preventScroll:true});
      });
      frame.addEventListener('pointermove',event=>{
        if(!activeDrag || activeDrag.frame!==frame || activeDrag.pointer!==event.pointerId)return;
        constrain(i,activeDrag.originX+(event.clientX-activeDrag.x)/(wall.clientWidth||1)*100,activeDrag.originY+(event.clientY-activeDrag.y)/(wall.clientHeight||1)*100);
      });
      frame.addEventListener('pointerup',finish);
      frame.addEventListener('pointercancel',finish);
      frame.addEventListener('lostpointercapture',finish);
      frame.addEventListener('keydown',event=>{
        const step=event.shiftKey?5:2;
        const keys={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
        if(keys[event.key]){
          event.preventDefault();
          constrain(i,layout[i].x+keys[event.key][0],layout[i].y+keys[event.key][1]);
          status.textContent='Composition updated. R rotates the selected frame.';
        }else if(event.key.toLowerCase()==='r'){
          event.preventDefault();
          layout[i].r=layout[i].r>=15?-15:layout[i].r+3;
          paint();
          status.textContent=`Frame rotated to ${layout[i].r} degrees.`;
        }
      });
    });
    root.querySelector('[data-ex-arrange]').addEventListener('click',()=>{
      finish();
      arrangement=(arrangement+1)%variations.length;
      layout=variations[arrangement].map(v=>({...v}));
      paint();
      status.textContent=['Back to the original composition.','A little more structure.','A little more movement.'][arrangement];
    });
    root.querySelector('[data-ex-reset]').addEventListener('click',()=>{
      finish();arrangement=0;layout=initial.map(v=>({...v}));paint();status.textContent='Original composition restored.';
    });
    let resizeTimer;
    if('ResizeObserver' in window)new ResizeObserver(()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>layout.forEach((position,i)=>constrain(i,position.x,position.y)),150);
    }).observe(wall);
    paint();
  };
  const initExpense = root => {
    const buttons=[...root.querySelectorAll('[data-ex-expense]')];
    const categories=['Food','Travel','Learning'];
    const render=(category,announce=true)=>{
      const transactions=samples.filter(row=>category==='all'||row.category===category);
      const total=transactions.reduce((sum,row)=>sum+row.amount,0);
      root.querySelector('.ex-total').textContent=money(total);
      root.querySelector('.ex-total-label').textContent=category==='all'?'Total spending':`${category} spending`;
      root.querySelector('.ex-transaction-count').textContent=`${transactions.length} sample transactions`;
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exExpense===category)));
      const ledger=root.querySelector('.ex-ledger-rows');
      ledger.replaceChildren();
      transactions.forEach(transaction=>{
        const row=document.createElement('div');row.className='ex-ledger-row';
        const icon=document.createElement('span');icon.className=`ex-transaction-icon ex-cat-${transaction.category.toLowerCase()}`;icon.textContent=transaction.category[0];icon.setAttribute('aria-hidden','true');
        const label=document.createElement('span');label.textContent=transaction.name;
        const meta=document.createElement('small');meta.textContent=`${transaction.category} · ${transaction.method}`;label.append(meta);
        const amount=document.createElement('strong');amount.textContent=money(transaction.amount);
        row.append(icon,label,amount);ledger.append(row);
      });
      let offset=0;
      const circumference=2*Math.PI*44;
      const description=[];
      categories.forEach(name=>{
        const sum=transactions.filter(row=>row.category===name).reduce((value,row)=>value+row.amount,0);
        const length=total?sum/total*circumference:0;
        const circle=root.querySelector(`.ex-ring-${name.toLowerCase()}`);
        circle.style.strokeDasharray=`${length} ${circumference-length}`;
        circle.style.strokeDashoffset=String(-offset);offset+=length;
        if(sum)description.push(`${name} ${sum} rupees`);
      });
      root.querySelector('.ex-donut').setAttribute('aria-label',`Sample spending: ${description.join(', ')}.`);
      if(announce)root.querySelector('.ex-expense-announcement').textContent=`${category==='all'?'All categories':category}: ${transactions.length} sample transactions, totaling ${money(total)}.`;
    };
    buttons.forEach(button=>button.addEventListener('click',()=>render(button.dataset.exExpense)));
    render('all',false);
  };
  window.initExhibits = () => {
    document.querySelectorAll('.exhibit[data-exhibit]').forEach(root=>{
      if(root.dataset.exReady)return;
      root.dataset.exReady='true';
      ({skillsphere:initSphere,cutroom:initWall,expense:initExpense})[root.dataset.exhibit]?.(root);
      let inView=true;
      const updateAnimation=()=>root.classList.toggle('ex-is-inactive',document.hidden||!inView);
      if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
        inView=entries[0].isIntersecting;updateAnimation();
      },{threshold:0.05}).observe(root);
      document.addEventListener('visibilitychange',updateAnimation);
      updateAnimation();
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.initExhibits,{once:true});
  else window.initExhibits();
})();
