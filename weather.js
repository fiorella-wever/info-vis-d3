var width = 1000,
    height = 500;

var svgContainer = d3.select("body").append("svg")
			 .attr("height", height)
			 .attr("width", width);

var chart_height = 400,
   chart_width = 700;

var x = d3.scaleBand().rangeRound([0, chart_width]).padding(0.1),
    y = d3.scaleLinear().rangeRound([chart_height, 0]);

var chart = svgContainer.append('g')
      .attr("id", "chart")
      .attr("transform", "translate(" + 100 + "," + 70 + ")");

let current_idx = 0;
let y_axis_element = null;

d3.csv("meteo.csv", function(d) {
   return {
           "year" : +d["year"],
           "month" : +d["month"],
           "day" : +d["day"],
           "temperature" : +d["temperature"]
          };
   }).then(function(data) {
      var months = [];
      for (var i=0; i < data.length; i++) {
  	       months.push(data[i].month);
         };

      const nested_data = d3.nest()
            .key(function(d) { return d.year; })
            .rollup(function(year) { return nest_by_month(year) })
            .entries(data);

      update_chart(nested_data[current_idx], months);

      d3.select('body').on('keydown', () => {
          const { event } = d3;
          key_handler(event, nested_data, months);
          });
      });

function update_chart(nested_data_year, months) {
      var new_data = nested_data_year.value;

      x.domain(months);
      update_y_axis(new_data);

      const months_list = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chart.append('g')
           .attr("transform", "translate(" + 0 + "," + chart_height + ")")
           .call(d3.axisBottom(x)
           .tickFormat(function(d, i) { return months_list[i]; }));

       chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x",0 - (chart_height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "axisLeft")
            .text("Temperature");

        svgContainer.append("text")
            .attr("transform", "translate(" + (chart_width / 2 + 100) + " ," + 500 + ")")
            .style("text-anchor", "middle")
            .text("Month");

        const chart_section = chart.selectAll(".bar")
        	  .data(new_data)
        const chart_elements = chart_section.enter()
          	.append("rect")
          	.attr("class", "bar")
            .merge(chart_section);
        chart_elements
            .data(new_data)
          	.attr("x", function(d) { return x(d.key); })
            .transition().duration(1000)
          	.attr("y", function(d) { return y(d.value); })
          	.attr("width", function(d){ return x.bandwidth(); })
          	.attr("height", function(d) { return chart_height - y(d.value); });
        chart_section.exit().remove();

        update_temp_label(new_data);
        update_year(nested_data_year);
      }

function update_temp_label(new_data) {
        const label_section = svgContainer.selectAll("text.label")
             .data(new_data);
        const label_element = label_section.enter()
             .append("text")
             .attr("class","label")
             .merge(label_section);
        label_element
              .data(new_data)
             .attr("x", (function(d) { return x(d.key) + x.bandwidth() + 60; }  ))
             .transition().duration(1000)
             .attr("y", function(d) { return y(d.value) + 70; })
             .text(function(d) { return d.value.toFixed(2); });
          label_section.exit().remove();
        }

function update_year(nested_data_year) {
        const text_section = svgContainer.selectAll('text.title')
              .data([nested_data_year]);
        const text_element = text_section.enter()
             .append("text")
             .attr("class", "title")
             .attr('font-family', 'sans-serif')
             .attr('font-size', '20px')
             .attr("y", 20)
             .attr("x", 200)
             .merge(text_section)
            .text("KNMI Monthly Average Temperatures at Schiphol Airport in " + nested_data_year.key);
        text_section.exit().remove();
        }

function nest_by_month(year) {
        return d3.nest()
            .key(function(d) { return d.month; })
            .rollup(function(d) {
                return d3.mean(d, function(d) {
                    return (+d.temperature) / 10; });
            })
            .entries(year);
        }

function update_y_axis(new_data) {
        var y_data = new_data.map(entry => +entry.value.toFixed(1));
        var y_domain = y.domain([0, d3.max(y_data)]);
        var y_axis = d3.axisLeft(y_domain);
        if (!y_axis_element) {
            y_axis_element = svgContainer.append('g')
                .attr('transform', 'translate(' + 100 + ',' + 70 + ')')
                .attr('class', 'y-axis')
                .call(y_axis);
              }
        svgContainer.select('g.y-axis')
            .transition()
            .duration(1000)
            .call(y_axis);
      }

function key_handler(event, nested_data, months) {
        if (event.repeat) {
            return;
        }
        let idx = 0;
        if (event.key === 'ArrowLeft') {
            idx = -1;
        }
        if (event.key === 'ArrowRight') {
            idx = 1;
        }
        if (idx === 0) {
            return;
        }
        current_idx += idx;
        if (current_idx < 0) {
            current_idx = nested_data.length - 1;
        }
        if (current_idx >= nested_data.length) {
            current_idx = 0;
        }
        update_chart(nested_data[current_idx], months);
      }
