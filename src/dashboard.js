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
  <div class="dv-main">
    <div class="dv-filters">
      <h2>Filter pathways</h2>
    </div>
    <div class="dv-info">Click on a pathway for more information.</div>
    <div class="dv-questions"></div>
    </div>
  </div>
  `)

  let pathwaysData = data.pathways

  let filters = viz.select('.dv-filters')
    .selectAll('div')
    .data(data.filters)
    .join('div')
      .html(d => d.type == 'filter' ? `${d.text}` : `<h3>${d.text}</h3>`)
      .classed('dv-filter', true)
      .classed('dv-filter--indent', d => d.indent)
      .on('click', onFilterClick)
  
  function onFilterClick(e, d) {
    if (d.type == 'filter') {
      if (d.active) {
        d.active = false
        pathwaysData = data.pathways
      } else {
        filters.each(f => f.active = false)
        d.active = true
        let filterNot = d.modifier == 'NOT'
        pathwaysData = data.pathways.filter(p => filterNot ? p[d.filter_name] != d.code : p[d.filter_name] == d.code)
      }
      filters.classed('active', f => f.active)
      updatePathways()
    }
  }

  const questions = viz.select('.dv-questions')
    .selectAll('div')
    .data(data.questions)
    .join('div')
      .classed('dv-question', true)
      .classed('dv-question--indented', d => d.heading_level == 'h4')

  questions
    .append('div')
      .html(d => `${d.heading_before ? `<h2>${d.heading_before}</h2>` : ''}<${d.heading_level}>${d.question_text}</${d.heading_level}>`)
  
  
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
  })
  
  function updatePathways() {
    questions.each(function (q) {
      let current_question_code = q.question_code
      let current_answers = data.answers.filter(a => a.question == current_question_code)
      d3.select(this).select('.dv-pathways')
        .selectAll('div')
        .data(pathwaysData)
        .join('div')
        .classed('dv-pathway', true)
        .html(d => d["usps"])
        .sort((a, b) => current_answers.findIndex(an => an.answer_code == a[current_question_code]) - current_answers.findIndex(an => an['answer_code'] == b[current_question_code]))
        .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')][d.isSelected ? 'darkest' : 'light'])
        .style('color', d => d.isSelected ? 'white' : null)
        .on("click", onPathwayClick)
    })
  }

  updatePathways()

  let infoBox = viz.select('.dv-info')

  function highlightPathway (d) {
    d.isSelected = true
    infoBox.html(`
      <div>${d.state}</div>
      <div class="dv-info__heading">${marked.parseInline(d.pathway)}</div>
      <dt>Credential</dt><dd>${marked.parseInline(d.credential)}</dd>
      ${data.questions.reduce((acc, q) => acc + `
        <dt>${q.question_text}</dt>
        <dd class="color color--${data.answers.find(a => a.answer_code == d[q.question_code])
          ? data.answers.find(a => a.answer_code == d[q.question_code]).color
          : 'grey'}">
          ${data.answers.find(a => a.answer_code == d[q.question_code])
            ? data.answers.find(a => a.answer_code == d[q.question_code]).answer_text
            : d[q.question_code]}
        </dd>
      `, '')}
      `)
  }
  function unhighlightPathway() {
    viz.selectAll('.dv-pathway')
      .each(d => d.isSelected = false)
    infoBox.html('Click on a pathway for more information.')
  }
    
  function onPathwayClick(e, d) {
    if (d.isSelected) {
      unhighlightPathway()
    } else {
      unhighlightPathway()
      highlightPathway(d)
    }
    updatePathways()
  }
}