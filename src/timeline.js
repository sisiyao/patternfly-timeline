import d3 from 'd3';

import configurable from 'configurable.js';
import defaultConfig from './config';
import drawer from './drawer';
import context from './drawer/context';
import Zoom from './zoom';


function timeline(config = {}) {
  const finalConfiguration = {...defaultConfig, ...config};
  let zoomInstance = new Zoom();

  const yScale = (data) => {
    return d3.scale.ordinal()
      .domain(data.map((d) => d.name))
      .range(data.map((d, i) => i * finalConfiguration.lineHeight));
  };

  const xScale = (width, timeBounds) => {
    return d3.time.scale()
      .range([0, width])
      .domain(timeBounds);
  };

  function timelineGraph(selection) {
    // selection is an array with one element that is a div
    // each is jquery or d3 ???
    selection.each(function selector(data) {
      console.log(data);
      // data is json data transformed in script.js (includes display key)
      let ungroupedData = data;
      // groups evnets within one minute together
      // data = [
      //    {data: [{date: _, details: {event: _, object: _}},
      //            {date: _, events: [{details}, {details}]}],
      //     name: "event"},
      //    {}]
      data = groupEvents(data, finalConfiguration.eventGrouping);
      console.log(data);;

      // line height for each row of events in the timeline
      finalConfiguration.lineHeight = (data.length <= 3) ? 80 : 40;
      // context is the timeline slider below the timeline
      finalConfiguration.contextStart = finalConfiguration.contextStart || d3.min(getDates(data));
      finalConfiguration.contextEnd = finalConfiguration.contextEnd || finalConfiguration.end;

      // 'this' is the div that contains the timeline, context, and slider
      console.log(this);
      // timeline and slider are removed from dom
      // .timeline-pf-chart is the svg tag (timeline) and context, no slider
      d3.select(this).select('.timeline-pf-chart').remove();
      // .timeline-pf-zoom is 3 elements associated with the slider
      d3.select(this).selectAll('.timeline-pf-zoom').remove();

      const SCALEHEIGHT = 40;
      let outer_width = finalConfiguration.width || selection.node().clientWidth;
      const height = data.length * finalConfiguration.lineHeight;

      const dimensions = {
        width: outer_width - finalConfiguration.padding.right - finalConfiguration.padding.left - finalConfiguration.labelWidth - ((finalConfiguration.slider) ? finalConfiguration.sliderWidth : 0),
        height,
        ctxHeight: finalConfiguration.contextHeight,
        outer_height: height + finalConfiguration.padding.top + finalConfiguration.padding.bottom + ((finalConfiguration.context) ? finalConfiguration.contextHeight + SCALEHEIGHT: 0)
      };
      const scales = {
        x: xScale(dimensions.width, [finalConfiguration.start, finalConfiguration.end]),
        y: yScale(data),
        ctx: xScale(dimensions.width, [finalConfiguration.contextStart, finalConfiguration.contextEnd]),
        cty: d3.scale.linear().range([dimensions.ctxHeight, 0])
      };

      // svg timeline is added back to dom with width and height
      const svg = d3.select(this).append('svg')
        .classed('timeline-pf-chart', true)
        .attr({
          width: outer_width,
          height: dimensions.outer_height,
        });
      // draw timeline
      const draw = drawer(svg, dimensions, scales, finalConfiguration).bind(selection);

      draw(data);

      // draw context
      if (finalConfiguration.context) {
        context(svg, scales, dimensions, finalConfiguration, ungroupedData);
      }

      // update zoom
      zoomInstance.updateZoom(d3.select(this), dimensions, scales, finalConfiguration, data, draw);

    });
  }

  // make timelineGraph function configurable with finalConfiguration
  configurable(timelineGraph, finalConfiguration);
  // configure timelineGraph with Zoom attribute
  timelineGraph.Zoom = zoomInstance;
  // return timelineGraph function defined above
  return timelineGraph;
}

d3.chart = d3.chart || {};
d3.chart.timeline = timeline;

module.exports = timeline;

// loop through all data points and return dates in an array
function getDates(data) {
  let toReturn = [];
  for (let i = 0; i < data.length; i++){
    for (let j = 0; j < data[i].data.length; j++){
      toReturn.push(data[i].data[j].date);
    }
  }
  return toReturn;
}

// group data points by rounded to time
function groupEvents(data, toRoundTo) {
  let rounded,
      temp = {},
      toReturn = [];

  for (let i = 0; i < data.length; i++) {
    toReturn[i] = {};
    toReturn[i].name = data[i].name;
    toReturn[i].data = [];
    for (let j = 0; j < data[i].data.length; j++) {
      rounded = Math.round(data[i].data[j].date / toRoundTo) * toRoundTo;
      if (temp[rounded] === undefined) {
        temp[rounded] = [];
      }
      temp[rounded].push(data[i].data[j]);
    }
    for (let k in temp) {
      if (temp[k].length === 1) {
        toReturn[i].data.push(temp[k][0]);
      } else {
        let tempDate = new Date();
        tempDate.setTime(+k);
        toReturn[i].data.push({'date': tempDate,'events': temp[k]});
      }
    }
    temp = {};
  }
  return toReturn;
}
