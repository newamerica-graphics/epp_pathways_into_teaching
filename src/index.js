import dashboard from './dashboard.js'

let queue = [];
let data = null;

const settings = {
  'viz__id': (el) => {
    dashboard(el, data)
  }
};

// TODO: use https://na-data-sheetsstorm.s3.us-west-2.amazonaws.com/prod/epp/pathways_into_teaching.json
async function fetchData() {
  const pathways = await fetch('https://opensheet.elk.sh/13YO_fBoEtzbfzDEoc_m_0GG5FmvPCz-fofCXRy20ick/pathways_min')
  const filters = await fetch('https://opensheet.elk.sh/13YO_fBoEtzbfzDEoc_m_0GG5FmvPCz-fofCXRy20ick/filters_min')
  const questions = await fetch('https://opensheet.elk.sh/13YO_fBoEtzbfzDEoc_m_0GG5FmvPCz-fofCXRy20ick/questions_min')
  const answers = await fetch('https://opensheet.elk.sh/13YO_fBoEtzbfzDEoc_m_0GG5FmvPCz-fofCXRy20ick/question_answers')
  return {
    pathways: await pathways.json(),
    filters: await filters.json(),
    questions: await questions.json(),
    answers: await answers.json(),
  }
}

fetchData().then((_data) => {
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
