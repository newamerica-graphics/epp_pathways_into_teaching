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
    <h1>Pathways into Teaching</h1>
    <!--div>description TK</div-->
    <!--div class="dv-filters"></div-->
  </div>
  <div class="dv-main">
    <div class="dv-sidebar">
      <div class="dv-filters"></div>
      <div class="dv-info"></div>
    </div>
    <div class="dv-questions"></div>
    </div>
  </div>
  `)

  const questions = viz.select('.dv-questions')
    .selectAll('div')
    .data(data.questions)
    .join('div')

  questions
    .append('h3')
      .html(d => d.question_text)
        
  questions.each(function(q) {
    let current_question_code = q.question_code
    let current_answers = data.answers.filter(a => a.question == current_question_code)
    d3.select(this).append('div')
      .classed('dv-legend', true)
      .selectAll('li')
      .data(current_answers)
      .join('li')
        .html(d => d.answer_text)
        .style('background-color', d => colors[d.color].lightest)
      .style('color', d => colors[d.color].darkest)
    d3.select(this).append('div')
      .classed('dv-pathways', true)
      .selectAll('div')
      .data(data.pathways)
      .join('div')
        // .attr('color', d => current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')
        .classed('dv-pathway', true)
        .html(d => d["usps"])
        .sort((a, b) => current_answers.findIndex(an => an['answer_code'] == a[current_question_code]) - current_answers.findIndex(an => an['answer_code'] == b[current_question_code]))
        .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')][d.isSelected ? 'darkest' : 'light'])
        .on("click", onclick)
        
      })
      
      
  let infoBox = viz.select('.dv-info')


  const highlightPathway = (d) => {
    d.isSelected = true
    viz.selectAll('.dv-pathway')
      .filter(p => p.isSelected)
        // .style('color', 'white')
        .style('font-weight', 'bold')

    infoBox.html(`
      <div>${d.state}</div>
      <div>${marked.parseInline(d.pathway)}</div>
      <div>Credential: ${marked.parseInline(d.credential)}</div>
      `)
      // <div>${current_question.question_text}: ${d[current_question_code]}</div>
  }
  const unhighlightPathway = () => {
    viz.selectAll('.dv-pathway')
      .filter(d => d.isSelected)
      // .style('color', null)
      .style('font-weight', 'normal')
      .datum(d => d.isSelected = false)
    infoBox.html('Click on a pathway for more information.')
  }
    
  function onclick(e, d) {
    unhighlightPathway()
    if (!d.isSelected) {
      highlightPathway(d)
    }
  }
}