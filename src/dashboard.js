import * as d3 from 'd3'
import { marked } from 'marked'
import './index.scss'
import { colors } from './lib/colors'

marked.use({
  headerIds: false,
  mangle: false,
  breaks: true,
});

export default function (el, data) {
  const viz = d3.select(el).html(`
  <div class="dv-header">
    <h3>Pathways into Teaching</h3>
    <!--div>description TK</div-->
    <!--div class="dv-filters"></div-->
  </div>
  <div class="dv-main">
    <div class="dv-question">
      <ul class="dv-legend"></ul>
      <div class="dv-pathways-container">
        <div class="dv-pathways"></div>
        <div class="dv-info"></div>
      </div>
    </div>
  </div>
  `)

  let current_question = data.questions[0]
  let current_question_code = current_question.question_code
  let current_answers = data.answers.filter(a => a.question == current_question_code)

  viz.select('.dv-legend')
    .selectAll('li')
    .data(current_answers)
    .join('li')
      .html(d => d.answer_text)
      .style('background-color', d => colors[d.color].lightest)
      .style('color', d => colors[d.color].darkest)

  viz.select('.dv-pathways')
    .selectAll('div')
    .data(data.pathways)
    .join('div')
      .classed('dv-pathway', true)
      .html(d => d["usps"])
      .sort((a, b) => current_answers.findIndex(an => an['answer_code'] == a[current_question_code]) - current_answers.findIndex(an => an['answer_code'] == b[current_question_code]))
      .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')].light)
      .on("click", onclick)
  
  let selectedPathway
  let infoBox = viz.select('.dv-info')

  const selectPathway = (d) => {
    selectedPathway
      .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')].darkest)
      .style('color', 'white')
    infoBox.html(`
      <div>${d.state}</div>
      <div>${marked.parseInline(d.pathway)}</div>
      <div>Credential: ${marked.parseInline(d.credential)}</div>
      <div>${current_question.question_text}: ${d[current_question_code]}</div>
    `)
  }
  const unselectPathway = (d) => {
    selectedPathway
      .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')].light)
      .style('color', null)
      infoBox.html('Click on a pathway for more information.')
    }
    
  function onclick(e, d) {
    if (selectedPathway) {
      unselectPathway(selectedPathway.datum())
      if (selectedPathway.datum() == d) {
        selectedPathway = null
        return
      }
    }
    selectedPathway = d3.select(this)
    selectPathway(selectedPathway.datum())
  }
}