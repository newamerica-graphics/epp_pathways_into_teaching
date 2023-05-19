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
  let questionsData = data.questions.filter(q => q.include == 'TRUE')
  let filtersData = d3.groups(data.filters, d => d.heading)

  const filterHeadings = viz.select('.dv-filters')
    .selectAll('div')
    .data(filtersData)
    .join('div')
      .html(d => `<h3>${d[0]}</h3>`)
      
  filterHeadings.each(function(f, i) {
    d3.select(this)
      .append('ul')
        .classed('dv-filters__list', true)
      .selectAll('li')
      .data(filtersData[i][1])
      .join('li')
        .html(d => `${d.text}
            <span class="dv-filter__count">${data.pathways.filter(p => (d.modifier == 'NOT') ? p[d.filter_name] != d.code : p[d.filter_name] == d.code).length}<span>`)
        .classed('dv-filter', true)
        .classed('dv-filter--indent', d => d.indent)
        .on('click', onFilterClick)
  })
  
  let filters = filterHeadings.selectAll('.dv-filter')

  function onFilterClick(e, d) {
    d.active = !d.active
    pathwaysData = data.pathways
    filters
      .classed('active', f => f.active)
      .each(f => f.active && (
        pathwaysData = pathwaysData.filter(p => (f.modifier == 'NOT')
          ? p[f.filter_name] != f.code
          : p[f.filter_name] == f.code)
      ))
    updatePathways()
  }

  const questions = viz.select('.dv-questions')
    .selectAll('div')
    .data(questionsData)
    .join('div')
      .classed('dv-question', true)
      .classed('dv-question--indented', d => d.heading_level == 'h4')
      .html(d => `${d.heading_before ? `<h2>${d.heading_before}</h2>` : ''}<${d.heading_level}>${d.question_text}</${d.heading_level}>`)
  
  questions.each(function(q) {
    d3.select(this).append('div')
      .classed('dv-legend', true)
    d3.select(this).append('div')
      .classed('dv-pathways', true)
  })

  function updatePathwaysHeight() {
    let questionsWidth = questions.node().getBoundingClientRect().width
    viz.selectAll('.dv-pathways')
      .style('height', `${24.7*Math.ceil(pathwaysData.length/((questionsWidth-30)/35))}px`)
  }


  function updatePathways() {
    questions.each(function (q) {
      let current_question_code = q.question_code
      let current_answers = data.answers.filter(a => a.question == current_question_code)
      let question = d3.select(this)
      question.select('.dv-pathways')
        .selectAll('div')
        .data(pathwaysData)
        .join('div')
          .classed('dv-pathway', true)
          .html(d => d["usps"])
          .sort((a, b) => current_answers.findIndex(an => an.answer_code == a[current_question_code]) - current_answers.findIndex(an => an['answer_code'] == b[current_question_code]))
          .style('background-color', d => colors[(current_answers.find(a => a.answer_code == d[current_question_code]) ? current_answers.find(a => a.answer_code == d[current_question_code]).color : 'grey')][d.isSelected ? 'darkest' : 'light'])
          .style('color', d => d.isSelected ? 'white' : null)
          .on("click", onPathwayClick)
      question.select('.dv-legend')
        .selectAll('li')
        .data(current_answers)
        .join('li')
          .html(d => `${pathwaysData.filter(p => d.answer_code == p[current_question_code]).length} ${d.answer_text}`)
          .style('background-color', d => colors[d.color].lightest)
        .style('color', d => colors[d.color].darkest)
    })
    updatePathwaysHeight()
  }

  updatePathways()

  let infoBox = viz.select('.dv-info')

  function highlightPathway (d) {
    d.isSelected = true
    infoBox.html(`
      <div>${d.state}</div>
      <div class="dv-info__heading">${marked.parseInline(d.pathway)}</div>
      <dt>Credential</dt><dd>${marked.parseInline(d.credential)}</dd>
      ${questionsData.reduce((acc, q) => acc + `
        <div class="dv-info__item ${q.heading_level == 'h4' ? 'dv-info__item--indented' : ''}">
          <dt>${q.question_text}</dt>
          <dd class="color color--${data.answers.filter(a => a.question == q.question_code).find(a => a.answer_code == d[q.question_code])
            ? data.answers.filter(a => a.question == q.question_code).find(a => a.answer_code == d[q.question_code]).color
            : 'grey'}">
            ${data.answers.filter(a => a.question == q.question_code).find(a => a.answer_code == d[q.question_code])
              ? data.answers.filter(a => a.question == q.question_code).find(a => a.answer_code == d[q.question_code]).answer_text
              : d[q.question_code]}
          </dd>
        </div>
      `, '')}
      ${d.notes ? `<dt>Notes</dt><dd>${marked.parseInline(d.notes)}</dd>` : ''}
    `)
  }
  function unhighlightPathway() {
    data.pathways.forEach(d => d.isSelected = false)
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

  let timeout = false // holder for timeout id

  // window.resize event listener
  window.addEventListener('resize', function() {
    // clear the timeout
    clearTimeout(timeout);
    // start timing for event "completion"
    timeout = setTimeout(updatePathwaysHeight, 250);
  });

  updatePathwaysHeight()
}