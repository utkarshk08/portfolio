/* Original portfolio interactions. All application previews use synthetic data. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const g = window.gsap;
  const scrollPlugin = window.ScrollTrigger;
  if (g && scrollPlugin) g.registerPlugin(scrollPlugin);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 801px)');
  const tallViewport = matchMedia('(min-height: 850px)');
  let motion = document.documentElement.dataset.motion !== 'off' && !reduced.matches;
  let animationContext = null;
  let scene = null;
  let sceneMode = 0;
  let initialEntry = true;
  const motionButton = $('.motion-toggle');
  const header = $('.site-header');
  const progress = $('.reading-progress');
  const navSections = ['work', 'about', 'contact'].map(id => document.getElementById(id));
  $('#year').textContent = new Date().getFullYear();

  function updateMotionLabel() {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(motion));
    motionButton.setAttribute('aria-label', motion ? 'Pause motion' : 'Enable motion');
    $('.motion-label').textContent = motion ? 'Motion on' : 'Motion off';
  }
  function makeAnimations() {
    animationContext?.revert();
    animationContext = null;
    if (!g || !scrollPlugin || !motion) return;
    animationContext = g.context(() => {
      if (initialEntry) {
        g.from('.title-mask > span', {yPercent:110, duration:1.25, stagger:.13, ease:'power4.out', delay:.38});
        g.from('.hero-reveal', {y:26, opacity:0, duration:1, stagger:.12, ease:'power3.out', delay:.7});
        g.from('.hero-object', {opacity:0, scale:.88, duration:1.6, ease:'power3.out', delay:.3});
        initialEntry = false;
      }
      $$('.reveal-lines').forEach(el => g.from(el, {y:48, opacity:0, duration:1.1, ease:'power3.out', scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
      g.from('.intro-aside', {y:25,opacity:0,duration:1,scrollTrigger:{trigger:'.section-intro',start:'top 80%',once:true}});
      if (desktop.matches) {
        g.to('.hero-copy', {y:-65,opacity:.2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
        g.to('.hero-object', {y:60,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
        const cards = $$('.project-panel');
        cards.forEach((card,i) => {
          g.from($('.project-art',card), {y:45,rotate:1.4,opacity:.65,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 85%',once:true}});
          if (cards[i+1] && tallViewport.matches) g.to(card, {scale:.955,opacity:.6,y:-10,ease:'none',scrollTrigger:{trigger:cards[i+1],start:'top 75%',end:'top 110px',scrub:true}});
        });
      } else {
        $$('.project-art').forEach(el => g.from(el,{y:22,opacity:.55,duration:.85,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
      }
      g.from('.about-right', {y:35,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.about-grid',start:'top 78%',once:true}});
      g.from('.community-photos figure',{y:20,opacity:0,rotate:-2,duration:.8,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:'.community-photos',start:'top 92%',once:true}});
      g.to('.contact-orbit',{rotate:38,y:-65,ease:'none',scrollTrigger:{trigger:'.contact-section',start:'top bottom',end:'bottom bottom',scrub:1}});
      g.from('.contact-round',{scale:.6,rotate:-20,opacity:0,duration:1,ease:'elastic.out(1,.7)',scrollTrigger:{trigger:'.contact-details',start:'top 85%',once:true}});
    });
    scrollPlugin.refresh();
  }
  function setMotion(enabled, persist = false) {
    motion = Boolean(enabled) && !reduced.matches;
    if (persist) { try { localStorage.setItem('uk-motion', motion ? 'on' : 'off'); } catch (_) {} }
    updateMotionLabel();
    scene?.setMotion(motion);
    makeAnimations();
    window.dispatchEvent(new CustomEvent('portfolio:motion', {detail:{enabled:motion}}));
  }
  motionButton.addEventListener('click', () => {
    if (reduced.matches) { showToast('Reduced motion is enabled in your device settings.'); return; }
    setMotion(!motion, true);
  });
  reduced.addEventListener('change', () => {
    let stored = 'on';try { stored=localStorage.getItem('uk-motion') || 'on'; } catch (_) {}
    setMotion(!reduced.matches && stored !== 'off');
  });
  desktop.addEventListener('change', makeAnimations);
  tallViewport.addEventListener('change', makeAnimations);
  updateMotionLabel();
  makeAnimations();
  document.fonts?.ready.then(() => scrollPlugin?.refresh());

  let scrollQueued = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const y = scrollY;
    progress.style.transform = `scaleX(${max > 0 ? y/max : 0})`;
    header.classList.toggle('scrolled',y > 35);
    let active = '';
    navSections.forEach(section => { if (section.getBoundingClientRect().top <= innerHeight*.35) active=section.id; });
    $$('[data-nav]').forEach(link => {
      const on = link.dataset.nav === active;
      link.classList.toggle('current',on);
      if(on) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    });
    scene?.setProgress(Math.min(1,y / Math.max(1,$('.hero').offsetHeight)));
    scrollQueued = false;
  }
  addEventListener('scroll',() => { if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);} },{passive:true});
  updateScroll();

  const sceneButtons = $$('[data-scene-mode]');
  sceneButtons.forEach(button => button.addEventListener('click',() => {
    sceneMode=Number(button.dataset.sceneMode);
    sceneButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    scene?.setMode(sceneMode);
  }));
  const loadScene = () => import(document.documentElement.dataset.sceneSrc || './assets/scene.bundle.js').then(module => {
    scene = module.initScene($('#hero-scene'),{motion});
    scene.setMode(sceneMode);
    updateScroll();
  }).catch(() => { $('#hero-scene').dataset.scene='fallback'; });
  if ('requestIdleCallback' in window) requestIdleCallback(loadScene,{timeout:500}); else setTimeout(loadScene,100);

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove',event=>{
      if (!motion || !g || event.pointerType!=='mouse') return;
      const r=el.getBoundingClientRect();
      g.to(el,{x:(event.clientX-r.left-r.width/2)*.11,y:(event.clientY-r.top-r.height/2)*.11,duration:.4,ease:'power3.out',overwrite:true});
    });
    const reset=()=>g?.to(el,{x:0,y:0,duration:motion ? .5 : 0,ease:'elastic.out(1,.5)',overwrite:true});
    el.addEventListener('pointerleave',reset);el.addEventListener('blur',reset);
  });

  const layers = {
    interface:{kicker:'THE PART YOU FEEL',title:'Clear, responsive,\nand a little delightful.',description:'React, JavaScript, HTML, and CSS turn application logic into interfaces people can understand. Keyboard access, responsive layouts, and small details belong here too.',tools:['React','JavaScript','HTML / CSS']},
    logic:{kicker:'THE PART THAT CONNECTS',title:'Clear responsibilities.\nStronger foundations.',description:'Java and Spring Boot bring structure to the application: authentication, validation, REST APIs, and business logic. I keep controllers, services, and persistence responsibilities separate.',tools:['Java','Spring Boot','Spring Security','REST APIs']},
    data:{kicker:'THE PART YOU RELY ON',title:'Designed to remember.\nBuilt to make sense.',description:'Data models connect the features people use. I work with relational databases and document stores, with a focus on useful relationships, persistence, and access scoped to the right user.',tools:['MySQL','PostgreSQL','H2','MongoDB Atlas']}
  };
  const layerButtons = $$('.system-tabs [data-layer]');
  function selectLayer(key, focus=false) {
    const data=layers[key];if(!data)return;
    layerButtons.forEach(button=>{const on=button.dataset.layer===key;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;if(on&&focus)button.focus();});
    const panel=$('#layer-panel');panel.setAttribute('aria-labelledby',`layer-tab-${key}`);
    $('.system-lab').dataset.layer=key;
    $('.layer-kicker').textContent=data.kicker;
    $('.layer-panel h3').replaceChildren(...data.title.split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));
    $('.layer-description').textContent=data.description;
    $('.layer-tools').replaceChildren(...data.tools.map(text=>{const span=document.createElement('span');span.textContent=text;return span;}));
    if(motion&&g)g.fromTo(panel,{opacity:.35,y:12},{opacity:1,y:0,duration:.4,ease:'power3.out',overwrite:true});
  }
  layerButtons.forEach((button,i)=>{
    button.addEventListener('click',()=>selectLayer(button.dataset.layer));
    button.addEventListener('keydown',event=>{
      let next;
      if(['ArrowRight','ArrowDown'].includes(event.key))next=(i+1)%3;
      else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(i+2)%3;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=2;
      if(next!==undefined){event.preventDefault();selectLayer(layerButtons[next].dataset.layer,true);}
    });
  });
  $('.system-lab').dataset.layer='interface';

  const dialog=$('#project-dialog');
  let lastTrigger,closing=false;
  function openProject(id,trigger) {
    const project=projectData[id];if(!project)return;
    closing=false;lastTrigger=trigger;
    const content=$('#dialog-content');content.replaceChildren();
    const add=(tag,text,className,parent=content)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
    add('p',project.label.replace(/^\d+\s*\/\s*/,''),'eyebrow');
    add('h2',project.name).id='dialog-title';
    add('p',project.intro,'dialog-intro');
    const idea=add('section','','dialog-section');add('h3','The idea','',idea);add('p',project.overview,'',idea);
    const choices=add('section','','dialog-section');add('h3','Decisions that matter','',choices);const list=add('ul','','',choices);project.decisions.forEach(d=>add('li',d,'',list));
    const focus=add('section','','dialog-section');add('h3','The engineering focus','',focus);add('p',project.focus,'',focus);
    const links=add('div','','dialog-links');project.links.forEach(link=>{const a=add('a',link.label,'',links);a.href=link.url;a.target='_blank';a.rel='noopener';});
    if(project.note)add('p',project.note,'dialog-note');
    dialog.showModal();dialog.scrollTop=0;document.body.style.overflow='hidden';
    if(motion&&g)g.fromTo(dialog,{y:80,opacity:0},{y:0,opacity:1,duration:.45,ease:'power3.out',overwrite:true});
    $('.dialog-close').focus({preventScroll:true});
  }
  function closeProject(){
    if(closing||!dialog.open)return;closing=true;
    const done=()=>{dialog.close();closing=false;};
    if(motion&&g)g.to(dialog,{y:35,opacity:0,duration:.2,ease:'power2.in',overwrite:true,onComplete:done});else done();
  }
  document.addEventListener('click',event=>{const trigger=event.target.closest('[data-project]');if(trigger)openProject(trigger.dataset.project,trigger);});
  $('.dialog-close').addEventListener('click',closeProject);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeProject();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject();});
  dialog.addEventListener('close',()=>{document.body.style.overflow='';g?.set(dialog,{clearProps:'transform,opacity'});lastTrigger?.focus({preventScroll:true});});

  let toastTimer;
  function showToast(text){$('.toast').textContent=text;$('.toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('visible'),3200);}
  $('.copy-email').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText('utkarshk0804@gmail.com');showToast('Email copied. Let’s make something good.');}
    catch(_){showToast('You can select and copy the email address above.');}
  });
  $('.portrait-colour').addEventListener('click',()=>{
    const button=$('.portrait-colour');
    const colour=button.getAttribute('aria-pressed')!=='true';
    button.setAttribute('aria-pressed',String(colour));
    button.setAttribute('aria-label',colour?'Show portrait in black and white':'Show portrait in colour');
    $('.portrait-card').dataset.colour=String(colour);
    $('.portrait-colour-label').textContent=colour?'Monochrome':'In colour';
  });

  // BFCache restoration should preserve a usable page without a stale transition.
  addEventListener('pageshow',event=>{if(event.persisted){scrollPlugin?.refresh();updateScroll();}});
})();
