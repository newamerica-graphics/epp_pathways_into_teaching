import dashboard from './dashboard.js'

let queue = [];
let data = null;

const settings = {
  'viz__id': (el) => {
    dashboard(el, data)
  }
};

fetch('https://na-data-sheetsstorm.s3.us-west-2.amazonaws.com/prod/epp/pathways_into_teaching.json').then(response => response.json()).then((_data)=>{
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
