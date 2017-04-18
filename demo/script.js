$(document).ready(function() {
  $('[data-toggle="popover"]').popover({
    'container': '#pf-timeline',
    'placement': 'top'
  });
});

$(document).on('click', '.drop', function () {$(this).popover('show'); });

$(document).on('click', '.grid', function () {$('[data-toggle="popover"]').popover('hide');});

const ONE_HOUR = 60 * 60 * 1000,
      ONE_DAY = 24 * ONE_HOUR,
      ONE_WEEK = 7 * ONE_DAY,
      ONE_MONTH = 30 * ONE_DAY,
      SIX_MONTHS = 6 * ONE_MONTH;

var data = [],
  start = new Date('2016-04-02T20:14:22.691Z'),
  today = new Date('2016-05-02T17:59:06.134Z');

for (var x in json) { //json lives in external file for testing
  // data becomes array of objects
  data[x] = {};
  // [{name: _, data: [{date: _, details: _}, {}, {}], display: true]
  // transforms json date to date object
  data[x].name = json[x].name;
  data[x].data = [];
  for (var y in json[x].data) {
    data[x].data.push({});
    data[x].data[y].date = new Date(json[x].data[y].date);
    data[x].data[y].details = json[x].data[y].details;
  }
  // adds a select option for each event type
  $('#timeline-selectpicker').append("<option>" + data[x].name + "</option>");
  data[x].display = true;
}
// default selects all event types
$('#timeline-selectpicker').selectpicker('selectAll');

// returns inner timeline function with time and scale configs and eventClick listener
var timeline = d3.chart.timeline()
  .end(today)
  .start(today - ONE_WEEK)
  .minScale(ONE_WEEK / ONE_MONTH)
  .maxScale(ONE_WEEK / ONE_HOUR)
  .eventClick(function(el) {
    var table = '<table class="table table-striped table-bordered">';
    if(el.hasOwnProperty("events")) {
      table = table + '<thead>This is a group of ' + el.events.length + ' events starting on '+ el.date + '</thead><tbody>';
      table = table + '<tr><th>Date</th><th>Event</th><th>Object</th></tr>';
      for (var i = 0; i < el.events.length; i++) {
        table = table + '<tr><td>' + el.events[i].date + ' </td> ';
        for (var j in el.events[i].details) {
          table = table +'<td> ' + el.events[i].details[j] + ' </td> ';
        }
        table = table + '</tr>';
      }
      table = table + '</tbody>';
    } else {
      table = table + 'Date: ' + el.date + '<br>';
      for (i in el.details) {
        table = table + i.charAt(0).toUpperCase() + i.slice(1) + ': ' + el.details[i] + '<br>';
      }
    }
    $('#legend').html(table);

  });
if(countNames(data) <= 0) {
  timeline.labelWidth(60);
}


// create a d3 element in the DOM if that event type has display = true
var element = d3.select('#pf-timeline').append('div').datum(data.filter(function(eventGroup) {
  return eventGroup.display === true;
}));
//
console.log(element);
timeline(element);

// event listener: when selectpicker changes, selectpicker options update, timeline data shown updates, timeline is inner function reruns
$('#timeline-selectpicker').on('changed.bs.select', function(event, clickedIndex, newValue, oldValue) {
  data[clickedIndex].display = !data[clickedIndex].display;
  element.datum(data.filter(function(eventGroup) {
    return eventGroup.display === true;
  }));
  console.log(element);
  timeline(element);
  // ???
  $('[data-toggle="popover"]').popover({
    'container': '#pf-timeline',
    'placement': 'top'
  });
});

// event listener: when window resizes, timeline inner function reruns
$(window).on('resize', function() {
  timeline(element);
  // ???
  $('[data-toggle="popover"]').popover({
    'container': '#pf-timeline',
    'placement': 'top'
  });
});

// datepicker settings
$('#datepicker').datepicker({
  autoclose: true,
  todayBtn: "linked",
  todayHighlight: true
});

$('#datepicker').datepicker('setDate', today);

// datepicker event listener for zooming
$('#datepicker').on('changeDate', zoomFilter);

// event listener for clicking in time filters dropdown menus
// when a time dropdown item is clicked, finds closest dropdown label, and sets label text
$( document.body ).on( 'click', '.dropdown-menu li', function( event ) {
  var $target = $( event.currentTarget );
    $target.closest( '.dropdown' )
      .find( '[data-bind="label"]' ).text( $target.text() )
        .end()
      .children( '.dropdown-toggle' ).dropdown( 'toggle' );

    zoomFilter();

    return false;
  });

function countNames(data) {
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].name !== undefined && data[i].name !=='') {
      count++;
    }
  }
  return count;
}

function zoomFilter() {
  // get range, position, and date variables from dropdown labels and datepicker
  var range = $('#range-dropdown').find('[data-bind="label"]' ).text(),
      position = $('#position-dropdown').find('[data-bind="label"]' ).text(),
      date = $('#datepicker').datepicker('getDate'),
      startDate,
      endDate;

  switch (range) {
    case '1 hour':
      range = ONE_HOUR;
      break;

    case '1 day':
      range = ONE_DAY;
      break;

    case '1 week':
      range = ONE_WEEK;
      break;

    case '1 month':
      range = ONE_MONTH;
      break;
  }
  switch (position) {
    case 'centered on':
      startDate = new Date(date.getTime() - range/2);
      endDate = new Date(date.getTime() + range/2);
      break;

    case 'starting':
      startDate = date;
      endDate = new Date(date.getTime() + range);
      break;

    case 'ending':
      startDate =  new Date(date.getTime() - range);
      endDate = date;
      break;
  }
  // set zoomfilter
  timeline.Zoom.zoomFilter(startDate, endDate);
}

// event listener for reset button
$('#reset-button').click(function() {
  timeline(element);
  // ???
  $('[data-toggle="popover"]').popover({
    'container': '#pf-timeline',
    'placement': 'top'
  });
});
