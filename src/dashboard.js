import * as d3 from 'd3'
import './index.scss'
import { colors, getColorset } from './lib/colors'

export default function (el, data) {
  const viz = d3.select(el).html(`
  <div class="dv-header">
    <h3>Pathways into Teaching</h3>
    <!--div>description TK</div-->
    <!--div class="dv-filters"></div-->
  </div>
  <div class="dv-main">
    <div class="dv-question"></div>
    <div class="dv-pathways"></div>
    <div class="dv-info"></div>
  </div>
  `)

  let current_question = data.questions[0].question_code
  let current_answers = data.answers.filter(a => a['question'] == current_question)

  viz.select('.dv-pathways')
    .selectAll('div')
    .data(data.pathways)
    .join('div')
      .classed('dv-pathway', true)
      .html(d => d["usps"])
      // .html(d => current_answers.findIndex(a => a['answer_code'] == d[current_question]))
      .sort(d => current_answers.findIndex(a => a['answer_code'] == d[current_question]))
      .style('background-color', d => getColorset('light')[current_answers.findIndex(a => a['answer_code'] == d[current_question])])
      // .style('background-color', d => colors[current_answers.find(a => a['answer_code'] == d[current_question]).color].light)
}