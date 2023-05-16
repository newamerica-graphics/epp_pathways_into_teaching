import * as d3 from 'd3'
import './index.scss'

export default function (el, data) {
  const viz = d3.select(el).html(`
  <div class="dv-header">
    <h3>Pathways into Teaching</h3>
    <!--div>description TK</div-->
  </div>
  <div class="dv-main">
    <div class="dv-pathways">
    </div>
  </div>
  `)

  console.log(data)

  viz.select('.dv-pathways')
    .selectAll('div')
    .data(data)
    .join('div')
      .html(d => d["usps"])
      .classed('dv-pathway', true)
}