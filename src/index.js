import dashboard from './dashboard.js'

let queue = [];
let data = null;

const settings = {
  'viz__id': (el) => {
    dashboard(el, data)
  }
};

fetch('https://opensheet.elk.sh/13YO_fBoEtzbfzDEoc_m_0GG5FmvPCz-fofCXRy20ick/pathways_min').then(response => response.json()).then((_data)=>{
  data = _data;
  for(let i=0; i<queue.length; i++)
    queue[i]();
});

window.renderDataViz = function(el){
  let id = el.getAttribute('id');
  let chart = settings[id];
  if(!chart) return;

  if(data){
    chart(el);
  } else {
    queue.push(() => chart(el));
  }
}
