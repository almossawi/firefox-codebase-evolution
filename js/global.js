"use strict";

var point_size = 0.5,
	alpha = 0.2,
	max_version = 17,
	pause = false;
	
var data_v16,
	data_v17;
	
var version = ["1", "1.5", "2", "3", "3.5", "3.6", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"];

var metrics_nice = new Object();
metrics_nice["mccabe_per_kloc_code"] = "Cyclomatic complexity";
metrics_nice["loc_code"] = "LOC";
metrics_nice["dependencies_density"] = "Dependency density";
metrics_nice["prop_cost"] = "Propagation cost";
metrics_nice["percent_in_core"] = "Core size";
metrics_nice["sum_fanin"] = "Direct dependencies";
metrics_nice["sum_vfanin"] = "Reachability";

$(document).ready(function () {	
	//other initializations
	$("select, input, a.button, button").uniform();

	getDataFiles();
	drawCharts();
	assignEventListeners();
	
	$("#loc_code")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["loc_code"] + "</div>");
		
	$("#mccabe_per_kloc_code")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["mccabe_per_kloc_code"] + "</div>");
		
	$("#prop_cost")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["prop_cost"] + "</div>");
		
	$("#percent_in_core")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["percent_in_core"] + "</div>");
		
	$("#sum_fanin")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["sum_fanin"] + "</div>");
		
	$("#sum_vfanin")
		.append("<div class='metric_title' style='width:460px'>" + metrics_nice["sum_vfanin"] + "</div>");
		
	$(".version_arrow").delay(1500).fadeIn("slow");
});

function assignEventListeners() {
	$(".version_arrow").on("mouseenter", function(d) {
		$(this).css("opacity", 1);
		
		return false;
	});
	
	$(".version_arrow").on("mouseleave", function(d) {
		$(this).css("opacity", 0.4);
		
		return false;
	});
	
	
	
	$("#metric div").on("mouseenter", function(d) {//console.log($(this).attr("id"));
		$("#" + $(this).attr("id") + " .module_name_box").show();
		$("#" + $(this).attr("id") + " .module_name").show();
	});
	
	$("#metric div").on("mouseleave", function(d) {//console.log($(this).attr("id"));
		$("#" + $(this).attr("id") + " .module_name_box").hide();
		$("#" + $(this).attr("id") + " .module_name").hide();
		
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#594F4F");
			
		$(".module_name_box")
			.css("fill", "#594F4F");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
	});
	
	//listeners for our modules' bars
	$("svg rect.module_bar_transparent").on("mouseenter", function(d) {
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#594F4F");
			
		$(".module_name_box")
			.css("fill", "#594F4F");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
			
			var srcE = d.srcElement ? d.srcElement : d.target;
			var module_name = $(srcE).attr("class").split(' ')[0];
		
		$("svg.left rect.module_bar." + module_name)
			.css("fill", "#242424");
			
		$(".module_name_box." + module_name)
			.css("fill", "#242424");
			
		$("svg.right rect.module_bar." + module_name)
			.css("fill", "#4898ff");
	});
	
	//listeners for our modules' bars
	$(".module_name, .module_name_box").on("mouseenter", function(d) {
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#594F4F");
			
		$(".module_name_box")
			.css("fill", "#594F4F");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
			
		var srcE = d.srcElement ? d.srcElement : d.target;
		var module_name = $(srcE).attr("class").split(' ')[0];
		
		$("svg.left rect.module_bar." + module_name)
			.css("fill", "#242424");
			
		$(".module_name_box." + module_name)
			.css("fill", "#242424");
			
		$("svg.right rect.module_bar." + module_name)
			.css("fill", "#4898ff");
	});
			
	/*$("svg rect.module_bar").on("mouseleave", function(d) {
		var module_name = $(d.srcElement).attr("class").split(' ')[0];	
		
		$("svg.left rect.module_bar." + module_name)
			.css("fill", "#594F4F");
			
		$(".module_name_box." + module_name)
			.css("fill", "#594F4F");
			
		$("svg.right rect.module_bar." + module_name)
			.css("fill", "#76B0D8");
	});*/
}

function getDataFiles() {
	d3.json("data/firefox16_module_breakdown.json", function(d_v16) {
	 	d3.json("data/firefox17_module_breakdown.json", function(d_v17) {
	 		data_v16 = d_v16;
	 		data_v17 = d_v17;
	 		data_v16.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
	 		data_v17.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
	 		
			drawMetric("#metric #loc_code", ["loc_code", "loc_code"], "", 0);
			drawMetric("#metric #mccabe_per_kloc_code", ["mccabe_per_kloc_code", "mccabe_per_kloc_code"], "", 0);
			//drawMetric("#metric", ["loc_code", "dependencies_density"], "", 1);
			drawMetric("#metric #prop_cost", ["prop_cost", "prop_cost"], "", 1);
			drawMetric("#metric #percent_in_core", ["percent_in_core", "percent_in_core"], "", 1);
			drawMetric("#metric #sum_fanin", ["sum_fanin", "sum_fanin"], "", 0);
			drawMetric("#metric #sum_vfanin", ["sum_vfanin", "sum_vfanin"], "", 0);	 
	 	})	
	 });
}

function drawMetric(container, metrics, max_value, is_percent) {
	setTimeout(function() {
	 		//console.log(data.json_data);
	 		//data.json_data.map(function(d, i) { console.log(d.data[0].mccabe/(d.data[0].loc_code/1000)); });
	 	
			//draw a set of bars for each module
			//data.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
		
			var h = 340,
				w = 200,
				rect_height = 15,
				rect_padding = 5,
				svgPaddingTop = 30,
				svgPaddingRight = 40;
		
			$.each(metrics, function(metric_i, metric) {
				var svg = d3.select(container)
		        	.append("svg")
	    	    		.attr("class", function() {
		    	    		if(metric_i == 0)
		    	    			return "left";
	    		    		else
	    		    			return "right";
	    	    		})
	        			//.attr("id", metric)
			    		.attr("width", w)
				   	 .attr("height", h);
				
				//show module name block background rect
				/*if(metric_i == 0) {
					svg.append("svg:rect")
						.attr("class", "module_name_box")
						.attr("x", svgPaddingRight)
						.attr("y", svgPaddingTop)
						.attr("height", h-65)
						.attr("width", w);
				}*/
			
				//show data for each metric (there will always be two), each in its own svg
				var data;
				if(metric_i == 0) data = data_v16;
				else data = data_v17;
				
				$.each(data.json_data, function(i, d) {
					var xMax = (max_value != "") ? max_value : d3.max(data.json_data, function(d) { return eval("d.data[0]."+metric);});
			
					//console.log(xMax);
					var xScale = d3.scale.linear()
			    	    .domain([0, xMax])
    			    	.range([0, w-svgPaddingRight]);
			        
					svg.append("svg:rect")
						.attr("class", function() {
							return d.module + " module_bar";
						})
						.style("position", "absolute")
						.style("float", "left")
						.attr("x", function() {
							if(metric_i == 0) { //lhs metric
								return w-xScale(eval("d.data[0]."+metric));
							}
							else { //rhs metric
								return 0;
							}
						})
						.attr("y", function() { return svgPaddingTop + ((rect_height+rect_padding) * i); })
						.attr("height", rect_height)
						.attr("width", function() {
							//console.log(xScale(eval("d.data[0]."+metric)));
							return xScale(eval("d.data[0]."+metric));
						});
	   						
					
					//a transparent copy of each to attach the mouse listener to
					svg.append("svg:rect")
						.attr("class", function() {
							return d.module + " module_bar_transparent";
						})
						.style("position", "absolute")
						.style("float", "left")
						.attr("x", 0)
						.attr("y", function() { return svgPaddingTop + ((rect_height+rect_padding) * i); })
						.attr("height", rect_height)
						.attr("width", w);
					
					//show background rect for each module
					if(metric_i == 0) {
						svg.append("svg:rect")
						.attr("class", d.module + " module_name_box")
						.attr("x", function() {
							return 180 - (d.module.length*5);
						})
						.attr("y", function() { return svgPaddingTop + ((rect_height+rect_padding) * i); })
						.attr("height", rect_height)
						.attr("width", function() {
							//console.log(xScale(eval("d.data[0]."+metric)));
							return w;
						});
					}
						
					//show value for rhs metric
					if(metric_i == 1) {
						svg.append("svg:text")
			    			.text(function() {
			    				if(is_percent)
			    					return (eval("d.data[0]."+metric)*100).toFixed(2) + "%";
			    				else
									return getHumanSize(eval("d.data[0]."+metric));
							})
							.attr("class", "metric_value")
							.attr('y', function() {
								return Math.floor(svgPaddingTop + ((rect_height+rect_padding) * i) + (rect_height/2+4));
							})
							.attr('x', xScale(eval("d.data[0]."+metric))+3);
					}
					else {
						svg.append("svg:text")
			    			.text(function() {
			    				if(is_percent)
			    					return (eval("d.data[0]."+metric)*100).toFixed(2) + "%";
			    				else
									return getHumanSize(eval("d.data[0]."+metric));
							})
							.attr("text-anchor", "end")
							.attr("class", "metric_value")
							.attr('y', function() {
								return Math.floor(svgPaddingTop + ((rect_height+rect_padding) * i) + (rect_height/2+4));
							})
							.attr('x', w-xScale(eval("d.data[0]."+metric))-3);
					}
											
					
					//module names block
					if(metric_i == 0) {
						svg.append("svg:text")
			    			.text(function() {
								return d.module;
							})
							.attr('text-anchor', "end")
							.attr("class", function() {
								return d.module + " module_name";
							})
							.attr('y', function() {
								return Math.floor(svgPaddingTop + ((rect_height+rect_padding) * i) + (rect_height/2+4));
							})
							.attr("x", w-5);
					}
				});
			
			/*svg.append("svg:text")
		   		.text(function() {
					return metrics_nice[metric];
				})
				.attr('text-anchor', 'start')
				.attr('class', 'metric_title')
				.attr('dy', 10)
				.attr('dx', function() {
					return 10;
				});*/
			});
			
			assignEventListeners();
	}, 0);
}

function drawCharts() {
	//$(".chart_container div").empty();

	//draw the charts
	d3.json("data/architectural_by_chart.json", function(data) {
		$.each($(".chart_container"), function(index, value) {
			var id= $(value).attr("id"); //console.log("id is " + id);
			var format = "s",
				humanify_numbers = true,
				custom_units = "",
				splice_from = 0;
			
			if(id == "allversions_prop_cost" || id == "allversions_dependencies_density" || id == "allversions_percent_in_core")
				format = "%";
			
			if(id == "speed" || id == "defects_per_kloc")
				humanify_numbers = false;
				
			if(id == "mem")
				custom_units = "MB";
				
			if(id == "allversions_crashes") splice_from = 8;
			if(id == "allversions_mem" || id == "allversions_speed") splice_from = 6;
			if(id == "allversions_defects_per_kloc") splice_from = 7;
			
			drawEachChart(eval("data."+id), "#chart_container_container #" + id, format, humanify_numbers, custom_units, splice_from);
		});
	});
}

function drawEachChart(data, container, format, humanify_numbers, custom_units, splice_from) {
	var w = 570,
		h = 150,
		xPadding = 22,
		yPadding = 30,
		enter_animation_duration = 600;
	
	//we always use the div within the container for placing the svg
	container += " div";
	console.log(container);
	//for clarity, we reassign
	var which_metric = container;
	
    //prepare our scales and axes
    var xMax = Object.keys(data).length,
	    xMin = 1,
	    yMin = d3.min(d3.values(data)),
        yMax = d3.max(d3.values(data));

    //scale exceptions
    if(format == "%") {
    	yMax = 1; //0 to 100%
    }

	//console.log(d3.keys(data));
	
   	var xScale = d3.scale.ordinal()
        .domain(d3.keys(data))
		.rangeBands([xPadding+16, w]); 
            
    var yScale = d3.scale.linear()
        .domain([yMin, yMax])
        .range([h-yPadding+2, yPadding-6]);
            
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        //.ticks(20);
	$(".x g text").attr("text-anchor", "left");
   
            
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
	    .attr("transform", "translate(-10," + (h-xPadding-3) + ")")
    	.call(xAxis);
    	    	
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
    	.attr('y1', h-xPadding)
    	.attr('y2', xPadding)
    	.attr('x1', 0)
    	.attr('x2', 0);

    //y labels
    /*ticks
    	.append('svg:text')
    		.text(function(d) {
				return d;
			})
		.attr('text-anchor', 'bottom')
		.attr('dy', 125)
		.attr('dx', -4);
	*/

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
							d3.selectAll(".tooltip").remove(); //timestamp is used as id
							d3.select(which_metric + " svg")
								.append("svg:rect")
									.attr("width", 44)
									.attr("height", 15)
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
								})
								.on('mouseout.tooltip', function() {
									d3.select(".tooltip_box").remove();
									d3.select(".tooltip")
										.transition()
										.duration(200)
										.style("opacity", 0)
										.attr("transform", "translate(0,-10)")
										.remove();
								});
				});
   			
	/*svg.selectAll("circle")
		.on('mouseover.tooltip', function(d,i) {
			d3.selectAll(".tooltip").remove(); //timestamp is used as id
			d3.select(which_metric + " svg")
				.append("svg:rect")
					.attr("width", 40)
					.attr("height", 15)
					.attr("x", function() { return xScale(i)-22; })
					.attr("y", function() { return yScale(d)-25; })
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
					.attr("id", function() { return i; })
					.attr("dy", "0.35m")
					.attr("text-anchor", "middle")
					.attr("class", "tooltip");
		})
		.on('mouseout.tooltip', function(d) {
			d3.select(".tooltip_box").remove();
			d3.select(".tooltip")
				.transition()
				.duration(200)
				.style("opacity", 0)
				.attr("transform", "translate(0,-10)")
				.remove();
		})
		.on('mouseover', function(d) {				
			d3.select(this)
				.transition()
		    	.attr('r', 6);
		}).on('mouseout', function() {
      		d3.select(this)
				.transition()
			   	.attr('r', 4);
      	})
		.append("text")
			.text(function(d) {
		    	return d;
		})
		.attr('class', 'line_label')
		.attr("x", function(d,i) {
   			return xScale(i)-5;
		})
		.attr("y", function(d) { return yScale(d); });
		*/
		
		//hide points that are 0
		d3.selectAll("circle").each(function(d, i) {
			if(d == 0) d3.select(this).attr("display", "none");
		});
}

function startRotate() {
	var i = 0;
	var interval = setInterval(function() {
		console.log(version[i]);
		$("#rotate img")
			.attr("src", "images/" + version[i]);
			//.fadeOut().html("<img src='images/" + version[i] + ".png' />").fadeIn();
		
		i++;
		if(i == version.length) {
			pause = true;
		}
		
		if(pause) {
			console.log("pausing");
			clearInterval(interval);
		}
	}, 100);
}

//draw the arcs
function drawCanvas(container) {
 	var data_file_a = "data/firefox16_file_dependencies.csv.deps",
	 	data_file_b = "data/firefox17_file_dependencies.csv.deps";
 		//data_file_b = "data/firefox17_file_dependencies.csv";
 		//data_file_b = "data/firefox16_visibility.csv";
 		
	//get a reference to the canvas
	var ctx_a = $('#canvas1')[0].getContext("2d"),
		ctx_b = $('#canvas2')[0].getContext("2d");
		

	d3.csv(data_file_a, function(data) {
		draw(data, ctx_a);
	});
	
	d3.csv(data_file_b, function(data) {
		draw(data, ctx_b);
	});
	
}


function draw(data, which_canvas) {
		var total_deps = 0,
			nnz = data.length,
			max_from_file,
			max_to_file,
			max_file,
			length = 650;
			
		max_from_file = d3.max(data, function(d) { return Number(d.from_file); });
		max_to_file = d3.max(data, function(d) { return Number(d.to_file); });
		max_file = (max_from_file > max_to_file) ? max_from_file : max_to_file;
			
		//data.map(function(d) { total_deps += Number(d.count_references); });
		//console.log(data);
		console.log("nnz", nnz);
		console.log("max_file", max_file);
		console.log("matrix size", Math.pow(max_file, 2));
		
		console.log("density", (nnz/(Math.pow(max_file, 2))*100).toFixed(2) + "%");
		
		var xMin = 0,
	    xMax = max_file,
	    yMin = 0,
	    yMax = max_file;
	    
		var xScale = d3.scale.linear()
    	    .domain([xMin, xMax])
        	.range([0, length]);
        
	    var yScale = d3.scale.linear()
    	    .domain([yMin, yMax])
        	.range([0, length]);
	
		//a circle per observation
		$.each(data, function(i, d) {
			which_canvas.fillStyle = "rgba(235, 235, 235, " + alpha + ")";
			which_canvas.beginPath();
			which_canvas.rect(xScale(d.to_file), yScale(d.from_file), point_size, point_size)
			which_canvas.closePath();
			which_canvas.fill();
			
			//add the module name here
			/*which_canvas.lineWidth=1;
			which_canvas.fillStyle = "rgba(235, 235, 235, " + 0.1 + ")";
			//which_canvas.lineStyle="#ffffff";
			which_canvas.font="8px sans-serif";
			which_canvas.fillText(d.from_file, xScale(d.to_file), yScale(d.from_file));*/
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
	return (Math.round(size * 100 / Math.pow(1000, t2)) / 100) +
	//return (Math.round(size * 10 / Math.pow(1000, t2)) / 10) +
		sizePrefixes.charAt(t2).replace(' ', '');
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}