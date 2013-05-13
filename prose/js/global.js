"use strict";

$(document).ready(function () {
	drawCharts();
});

function drawCharts() {
	//draw the charts
	d3.json("../data/architectural_by_chart.json", function(data) {
		var architectural_data_full = data;
		
		$.each($(".chart_container"), function(index, value) {
			var id= $(value).attr("id"); //console.log("id is " + id);
			var format = "s",
				humanify_numbers = true,
				custom_units = "",
				splice_from = 0,
				max_y_value = "";
			
			if(id == "allversions_prop_cost" || id == "allversions_percent_in_core" || id == "allversions_percent_in_core_at_discontinuity")
				format = "%";
			
			if(id == "allversions_speed")
				humanify_numbers = false;
				
			if(id == "allversions_mem")
				custom_units = "MB";
				
			if(id == "allversions_crashes") splice_from = 8;
			if(id == "allversions_mem" || id == "allversions_speed") splice_from = 6;
			if(id == "allversions_defects_per_hundred_thousand_loc_code") splice_from = 7;
			
			if(id == "allversions_prop_cost")
				max_y_value = 0.25;
				
			if(id == "allversions_percent_in_core")
				max_y_value = 1;
				
			if(id == "allversions_percent_in_core_at_discontinuity")
				max_y_value = 0.5;
				
			console.log(id);
			drawEachBelowTheFoldChart(eval("data."+id), "#" + id, format, humanify_numbers, custom_units, splice_from, max_y_value);
		});
	});
}

function drawEachBelowTheFoldChart(data, container, format, humanify_numbers, custom_units, splice_from, max_y_value) {
	var w = 700,
		h = 200,
		xPadding = 22,
		yPadding = 30,
		enter_animation_duration = 600;
	
	//we always use the div within the container for placing the svg
	container += " div";
	//console.log(container);
	//for clarity, we reassign
	var which_metric = container;
	
    //prepare our scales and axes
    var xMax = Object.keys(data).length,
	    xMin = 1,
	    yMin = d3.min(d3.values(data)),
        yMax = (max_y_value == "") ? d3.max(d3.values(data)) : max_y_value;
   
    //scale exceptions
    //if(format == "%") {
    //	yMax = 1; //0 to 100%
    //}

	//console.log(d3.keys(data));
	//console.log(d3.keys(data).sort(function(a,b) { return a-b; }));
   	var xScale = d3.scale.ordinal()
        .domain(d3.keys(data))
		.rangeBands([xPadding+16, w]); 
            
    var yScale = d3.scale.linear()
        .domain([0, yMax])
        .range([h-yPadding+2-30, yPadding-6]);
            
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    	//.ticks(20);
    	
	$(".x g text")
		.attr("text-anchor", "left");
   
            
	var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickFormat(d3.format(format)) //so e.g. convert 4,000,000 to 4M
        .ticks(2);
            
    //draw svg
	var svg = d3.select(container)
        .append("svg")
        .attr("width", w)
        .attr("height", h);
    
        	
    //draw extended ticks (horizontal)
    var ticks = svg.selectAll('.ticky')
    	.data(yScale.ticks(2))
    	.enter()
    		.append('svg:g')
    		.attr('transform', function(d) {
      			return "translate(0, " + (yScale(d)) + ")";
    		})
    		.attr('class', 'ticky')
    	.append('svg:line')
    		.attr('y1', -1)
    		.attr('y2', -1)
    		.attr('x1', yPadding+5)
    		.attr('x2', w-yPadding+8);
    		
	//draw x axis
	var xAxis = svg.append("g")
    	.attr("class", "axis x")
	    .attr("transform", "translate(-10," + (h-xPadding-3-30) + ")")
    	.call(xAxis);
    	
    //remove .0 in labels
    $(".x .tick text")
    	.text(function(i, d) {
    		if(d.split(".")[1] == 0) return d.split(".")[0];
    	})
        .attr('transform', function(d) {
      		return "translate(-4, 0)";
    	});;
    	    	
	//draw y axis
	svg.append("g")
    	.attr("class", "axis y")
	    .attr("transform", "translate(" + (yPadding+10) + ",0)")
    	.call(yAxis);
    
    //draw left y-axis
    /*svg.append('svg:line')
    	.attr('x1', yPadding+6)
    	.attr('x2', yPadding+6)
    	.attr('y1', yPadding-14)
    	.attr('y2', h-xPadding-5);*/
    
    //extended ticks (vertical)
    /*ticks = svg.selectAll('.tickx')
    	.d(xScale.ticks(10))
    	.enter()
    		.append('svg:g')
    			.attr('transform', function(d, i) {console.log(xScale(d));
				    return "translate(" + xScale(d) + ", 0)";
			    })
			    .attr('class', 'tickx');*/
	
	//draw y ticks
    ticks.append('svg:line')
    	.attr('y1', h-xPadding-30)
    	.attr('y2', xPadding)
    	.attr('x1', 0)
    	.attr('x2', 0);
			
    //y labels
    svg.append('svg:text')
			.text("Firefox release")
			.attr('class', 'y_label')
    		.attr('text-anchor', 'bottom')
			.attr('dy', 190)
			.attr('dx', 307)

	//draw the line
	var spliced_data;
	if(splice_from != 0) {
		spliced_data = d3.entries(data).splice(splice_from,d3.keys(data).length);
		//console.log(data);
	}
	
	var line = d3.svg.line()
		.x(function(d,i){ return xScale(d.key); })
		.y(function(d){ return yScale(d.value); })
		//.interpolate("basis");

	var paths = svg.append("svg:path")
	    .attr("class", "the_glorious_line default_path_format")
    	.attr("d", function() {
	    			//this only works if we don't have blanks in the beginning
	    			/*var data_zeros_removed = Array();
	    			
	    			$.each(data, function(i, value) {
	    				console.log(value);
	    				if(value != 0)
	    					data_zeros_removed.push(value);
	    			});
	    			console.log(d3.entries(data_zeros_removed));
	    			return line(d3.entries(data_zeros_removed));
	    			*/
	    			
    		if(splice_from != 0)
    			return line(spliced_data);
    		else
    			return line(d3.entries(data));
    	});
    	
    //x-axis text	
    /*d3.select(which_metric + " svg")
		.append("text")
			.text("release")					
			.attr("x", function() { return w-41; })
			.attr("y", function() { return h; })
			.attr("fill", "#cccccc")
			.style("font-size", "10px")
			.style("cursor", "default");*/

	//draw points
	var circle = svg.selectAll("circle")
   		.data(d3.values(data))
   		.enter()
   			.append("circle")
   			.attr('class','point')
   			.attr('opacity', 1)
   			.attr("cx", function(d,i) {
        		return xScale(i);
   			})
   			.attr("cy", function(d) { return yScale(d); })
   			.attr("r", 4)
   			.each(function(d, i) {
					//a transparent copy of each rect to make it easier to hover over rects
					svg.append('rect')
		    			.attr('shape-rendering', 'crispEdges')
		    			.style('opacity', 0)
			    		.attr('x', function() { return xScale(i)-10; })
    					.attr('y', 10)
	    				.attr("class", "trans_rect")
		    			.attr("display", function() {
		    				if(d == 0) {
	    						return "none";
	    					}
		    			})
    					.attr('shape-rendering', 'crispEdges')
	    				.attr('width', function() {
	    					return (w-40)/d3.keys(data).length;
			    		})
				    	.attr('height', 120) //height of transparent bar
				    	.on('mouseover.tooltip', function() {
							d3.selectAll(".tooltip, .tooltip_box").remove(); //timestamp is used as id
							d3.select(which_metric + " svg")
								.append("svg:rect")
									.attr("width", 44)
									.attr("height", 17)
									.attr("x", xScale(i)-22)
									.attr("y", yScale(d)-25)
									.attr("class", "tooltip_box");
						
							d3.select(which_metric + " svg")
								.append("text")
									.text(function() {
										if(humanify_numbers == false)
											return d;
							
										if(custom_units != "")
											return d + custom_units;
								
										return (format == "%") ? (d*100).toFixed(2) + "%" : getHumanSize(d);
									})					
									.attr("x", function() { return xScale(i); })
									.attr("y", function() { return yScale(d)-13; })
									.style("cursor", "default")
									.attr("dy", "0.35m")
									.attr("text-anchor", "middle")
									.attr("class", "tooltip");
								});
								/*.on('mouseout.tooltip', function() {
									d3.select(".tooltip_box").remove();
									d3.select(".tooltip")
										.transition()
										.duration(200)
										.style("opacity", 0)
										.attr("transform", "translate(0,-10)")
										.remove();
								});*/
				});

		//hide points that are 0
		d3.selectAll("circle").each(function(d, i) {
			if(d == 0) d3.select(this).attr("display", "none");
		});
}



function addCommas(nStr) {
	nStr += '';
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function getHumanSize(size) {
	var sizePrefixes = ' kmbtpezyxwvu';
	if(size <= 0) return '0';
	var t2 = Math.min(Math.floor(Math.log(size)/Math.log(1000)), 12);
	return (Math.round(size * 100 / Math.pow(1000, t2)) / 100).toFixed(2) +
	//return (Math.round(size * 10 / Math.pow(1000, t2)) / 10) +
		sizePrefixes.charAt(t2).replace(' ', '');
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}