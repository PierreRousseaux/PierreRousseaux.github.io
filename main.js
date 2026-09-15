
document.querySelector('.menu')?.addEventListener('click',()=>document.querySelector('.navlinks')?.classList.toggle('open'));
document.querySelectorAll('.abstract-details').forEach(d=>{
  d.addEventListener('toggle',()=>{
    if(d.open) document.querySelectorAll('.abstract-details').forEach(o=>{if(o!==d)o.open=false;});
  });
});
