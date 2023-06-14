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
      <h2>Filter pathways <button id="clearFilters">Clear</button></h2>
    </div>
    <div class="dv-info">Click on a pathway for more information.</div>
    <div class="dv-questions"></div>
    </div>
  </div>
  `)

  let pathwaysData = data.pathways
  let questionsData = data.questions.filter(q => q.include == 'TRUE')
  let filtersData = d3.groups(data.filters, d => d.heading)
  filtersData.forEach(f => f[1].splice(0, 0, { text: 'All', filter_name: f[1][0].filter_name }))

  const filterHeadings = viz.select('.dv-filters')
    .selectAll('div')
    .data(filtersData)
    .join('div')
      .html((d, i) => `<label class="dv-filters__label" for="filter${i}">${d[0]}</label>`)
      
  filterHeadings.each(function (f, i) {
    d3.select(this)
      .append('select')
      .classed('dv-filters__select', true)
      .attr('id', `filter${i}`)
      .on('change', onFilterChange)
      .selectAll('option')
      .data(filtersData[i][1])
      .join('option')
        .html((d, i) => `${d.indent ? '&nbsp;&nbsp;&nbsp;' : ''}${d.text} ${
          i == 0 ? '' : `(${ data.pathways.filter(p => (d.modifier == 'NOT') ? p[d.filter_name] != d.code : p[d.filter_name] == d.code).length })`
          }`)
        .attr('value', d => d.text)
  })

  let filters = viz.selectAll('.dv-filters__select')

  function onFilterChange() {
    pathwaysData = data.pathways
    filters.each(function (f, i) {
      let value = d3.select(this).property("value")
      if (value != 'All') {
        let filter = filtersData[i][1].find(g => g.text == value)
        pathwaysData = pathwaysData.filter(p => (filter.modifier == 'NOT') ? p[filter.filter_name] != filter.code : p[filter.filter_name] == filter.code)
      }
    })
    updatePathways()
  }

  viz.select('#clearFilters').on('click', () => {
    filters.each(function (f) {
      d3.select(this).property('value', 'All')
    })
    onFilterChange()
  })

  const questions = viz.select('.dv-questions')
    .selectAll('div')
    .data(questionsData)
    .join('div')
      .classed('dv-question', true)
      .classed('dv-question--indented', d => d.heading_level == 'h4')
      .html(d => `
        ${d.heading_before ? `<h2>${d.heading_before}</h2>` : ''}
        <${d.heading_level}>${d.question_text}</${d.heading_level}>
        ${d.description ? `<p class="dv-question__description">${d.description}</p>` : ''}
      `)
  
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
        .style('background-color', d => {
            let current_answer = current_answers.find(a => a.answer_code == d[current_question_code])
            return colors[current_answer ? current_answer.color : 'grey'][d.isSelected ? 'darkest' : ((current_answer && current_answer.color_variation) ? current_answer.color_variation : 'light')]
          })
          .style('color', d => d.isSelected ? 'white' : null)
          .on("click", onPathwayClick)
      question.select('.dv-legend')
        .selectAll('li')
        .data(current_answers)
        .join('li')
          .html(d => `${pathwaysData.filter(p => d.answer_code == p[current_question_code]).length} ${d.answer_text}`)
          .style('background-color', d => colors[d.color][d.color_variation ? d.color_variation : 'light'])
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