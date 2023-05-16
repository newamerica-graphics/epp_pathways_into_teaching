import * as d3 from 'd3'
import './index.scss'
import { colors } from './lib/colors'

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

  let current_question = data.questions[0]
  let current_question_code = current_question.question_code
  let current_answers = data.answers.filter(a => a.question == current_question_code)

  viz.select('.dv-pathways')
    .selectAll('div')
    .data(data.pathways)
    .join('div')
      .classed('dv-pathway', true)
      .html(d => d["usps"])
      .sort((a, b) => current_answers.findIndex(an => an['answer_code'] == a[current_question_code]) - current_answers.findIndex(an => an['answer_code'] == b[current_question_code]))
      .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')].light)
      .on("click", onclick)

  function onclick(e, d) {
    viz.select('.dv-info')
      .html(`
        <div>${d.state}</div>
        <div>${d.pathway}</div>
        <div>Credential: ${d.credential}</div>
        <div>${current_question.question_text}: ${d[current_question_code]}</div>
      `)

  }
}