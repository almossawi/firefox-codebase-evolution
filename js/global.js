"use strict";

var point_size = 0.8,
	alpha = 0.2,
	min_version = 16,
	max_version = 17,
	pause = false,
	matrix_load_delay = 1000,
	use_raster_for_matrix = true,
	what_is_lhs = 16,
	what_is_rhs = 17;
	
var data_lhs,
	data_rhs,
	architectural_data_full;

var modules = ["accessible", "browser", "content", "dom", "gfx", "ipc", "js", "layout", "media", "modules", "netwerk", "security", "toolkit", "widget"];

var module_colors = new Object();
	module_colors["-"] = "199,244,100"; //from, to - Java classes, python libs, etc...
	module_colors["accessible"] = "199, 23, 13";
	module_colors["browser"] = "240,198,98";
	module_colors["content"] = "84,215,71";
	module_colors["dom"] = "186,0,209";
	module_colors["gfx"] = "0, 210, 255";
	module_colors["ipc"] = "48, 255, 228";
	module_colors["js"] = "240,150,9";
	module_colors["layout"] = "227, 50, 88";
	module_colors["media"] = "140,191,38";
	module_colors["modules"] = "51,153,51";
	module_colors["netwerk"] = "92, 100, 196";
	module_colors["security"] = "0,171,169";
	module_colors["toolkit"] = "45,109,255";
	module_colors["widget"] = "230,113,184";

//0 = start in .files, 1 = end in .files, 
//2 = matrix highlight coords [width, height, left, top]
var matrix_v16_modules = new Object();
	matrix_v16_modules["-"] = [0,637, [0,0,0,0]];
	matrix_v16_modules["accessible"] = [638,1073, [6,8,16,12]];
	matrix_v16_modules["browser"] = [1094,2507, [20,20,22,19]];
	matrix_v16_modules["content"] = [2721,5361, [37,35,46,42]];
	matrix_v16_modules["dom"] = [5544,8825, [47,45,84,80]];
	matrix_v16_modules["gfx"] = [9520,11713, [30,30,139,135]];
	matrix_v16_modules["ipc"] = [12665,13479, [11,10,180,178]];
	matrix_v16_modules["js"] = [13480,19593, [81,85,193,188]];
	matrix_v16_modules["layout"] = [19594,24684, [70,71,276,273]];
	matrix_v16_modules["media"] = [24695,27484, [38,38,346,343]];
	matrix_v16_modules["modules"] = [28591,29187, [8,8,399,395]];
	matrix_v16_modules["netwerk"] = [29212,29860, [10,10,408,404]];
	matrix_v16_modules["security"] = [30926,32117, [17,17,431,428]];
	matrix_v16_modules["toolkit"] = [32842,34754, [25,26,458,454]];
	matrix_v16_modules["widget"] = [35372,35845, [7,7,493,488]];
	
var matrix_v17_modules = new Object();
	matrix_v17_modules["-"] = [0,667, [0,0,0,0]];
	matrix_v17_modules["accessible"] = [668,1105, [6,8,18,12]];
	matrix_v17_modules["browser"] = [1128,2592, [20,20,22,19]];
	matrix_v17_modules["content"] = [2818,5516, [36,35,47,43]];
	matrix_v17_modules["dom"] = [5704,9188, [47,46,84,80]];
	matrix_v17_modules["gfx"] = [9891,12162, [31,30,142,138]];
	matrix_v17_modules["ipc"] = [13115,13936, [11,11,184,180]];
	matrix_v17_modules["js"] = [13937,20057, [83,85,197,190]];
	matrix_v17_modules["layout"] = [20058,25209, [73,70,277,273]];
	matrix_v17_modules["media"] = [25210,28056, [37,38,348,343]];
	matrix_v17_modules["modules"] = [29181,29776, [8,8,401,396]];
	matrix_v17_modules["netwerk"] = [29802,30451, [9,9,409,405]];
	matrix_v17_modules["security"] = [31525,32720, [17,15,433,429]];
	matrix_v17_modules["toolkit"] = [33457,35414, [25,26,461,454]];
	matrix_v17_modules["widget"] = [36031,36511, [7,7,493,488]];
		
var chart_data_already_loaded = false,
	matrix_data_already_loaded = false,
	network_data_already_loaded = false,
	active_view = "chart";
	
var version = ["1", "1.5", "2", "3", "3.5", "3.6", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"];

var metrics_nice = new Object();
metrics_nice["mccabe_per_kloc_code"] = "Cyclomatic complexity";
metrics_nice["loc_code"] = "LOC";
metrics_nice["dependencies_density"] = "Dependency density";
metrics_nice["prop_cost"] = "Propagation cost";
metrics_nice["percent_in_core"] = "Core size";
metrics_nice["sum_fanin"] = "Direct dependencies";
metrics_nice["sum_vfanin"] = "Indirect dependencies";

$(document).ready(function () {
	//if the user has a small resolution, zoom out
	if(window.screen.availWidth <= 1024) {
		document.body.style.zoom=0.75;
		$("body").blur();
	}

	//other initializations
	$("select, input, a.button, button").uniform();

	//load the charts in the belo-the-fold container
	drawCharts();
	
	//show chart view by default
	$("#main_options a#switch_to_chart div div.selected_view").show();
	$("#chart_view").show();
	loadChartView(false);
	
	//set the chart titles only once
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
	
	//add legend and matrix highlighters on page load to save time
	addModulesLegend();
	

	//add our highlighters to the dom
	$.each(modules, function(i, module) {
		$("#canvases").append("<div class='overlay_" + module + " left_overlay overlay horizontal'></div>");
		$("#canvases").append("<div class='overlay_" + module + " left_overlay overlay vertical'></div>");
		$("#canvases").append("<div class='overlay_" + module + " right_overlay overlay horizontal'></div>");
		$("#canvases").append("<div class='overlay_" + module + " right_overlay overlay vertical'></div>");
	});

	addMatrixHighlighters("lhs");
	addMatrixHighlighters("rhs");
	
	$(".version_arrow").delay(1500).fadeIn("slow");
	
	assignEventListeners();
});

function resetLoadedDataFlags() {
	chart_data_already_loaded=false;
	matrix_data_already_loaded=false;
	network_data_already_loaded=false;		
}

function assignEventListeners() {
	$("#rhs_left").off("click");
	$("#rhs_right").off("click");
	$("#lhs_left").off("click");
	$("#lhs_right").off("click");
	$("#switch_to_matrix").off("click");
	$("#switch_to_chart").off("click");
	$("#switch_to_network").off("click");
	$(".version_arrow").off("mouseenter");
	$(".version_arrow").off("mouseleave");
	
	$("#rhs_left").on("click", function() {
		if(what_is_rhs-1 < min_version) {
			console.log(what_is_rhs);
			return  what_is_rhs;
		}
		else {
			//redraw using the new data
			what_is_rhs--;
			
			redrawCurrentView();
			console.log(what_is_rhs);
		}
		
		return false;
	});
	
	$("#rhs_right").on("click", function() {
		if(what_is_rhs+1 > max_version) {
			//todo shake the element so the user knows
			
			console.log(what_is_rhs);
			return  what_is_rhs;
		}
		else {
			//redraw using the new data
			what_is_rhs++

			redrawCurrentView();
			console.log(what_is_rhs);
		}
		
		return false;
	});
	
	$("#lhs_left").on("click", function() {
		if(what_is_lhs-1 < min_version) {
			//todo shake the element so the user knows
			
			console.log(what_is_lhs);
			return  what_is_lhs;
		}
		else {
			//redraw using the new data
			what_is_lhs--;

			redrawCurrentView();
			console.log(what_is_lhs);
		}
		
		return false;
	});
	
	$("#lhs_right").on("click", function() {
		if(what_is_lhs+1 > max_version) {
			//todo shake the element so the user knows
			
			console.log(what_is_lhs);
			return  what_is_lhs;
		}
		else {
			//redraw using the new data
			what_is_lhs++;

			redrawCurrentView();
			console.log(what_is_lhs);
		}
		
		return false;
	});
	
	$("#switch_to_matrix").on("click", function() {
		//$("#metric").html($("#matrix_view").html());
		$(".view").hide();
		$("#matrix_view").show();
		
		active_view = "matrix";
		$("#main_options a div div.selected_view").hide();
		$("#main_options a#switch_to_matrix div div.selected_view").show();
		
		loadMatrixView();
		
		return false;
	});
	
	$("#switch_to_chart").on("click", function() {
		$(".view").hide();
		$("#chart_view").show();
		
		active_view = "chart";
		$("#main_options a div div.selected_view").hide();
		$("#main_options a#switch_to_chart div div.selected_view").show();
		
		loadChartView(true);
		
		return false;
	});
	
	$("#switch_to_network").on("click", function() {
		$(".view").hide();
		$("#network_view").show();
		
		active_view = "network";
		$("#main_options a div div.selected_view").hide();
		$("#main_options a#switch_to_network div div.selected_view").show();
		loadNetworkView();
		
		return false;
	});
	

	$(".version_arrow").on("mouseenter", function(d) {
		$(this).css("opacity", 1);
		
		return false;
	});
	
	$(".version_arrow").on("mouseleave", function(d) {
		$(this).css("opacity", 0.4);
		
		return false;
	});
	
	
	
	$("#metric #chart_view div").on("mouseenter", function(d) {//console.log($(this).attr("id"));
		$("#" + $(this).attr("id") + " .module_name_box").show();
		$("#" + $(this).attr("id") + " .module_name").show();
	});
	
	$("#metric #chart_view div").on("mouseleave", function(d) {//console.log($(this).attr("id"));
		$("#" + $(this).attr("id") + " .module_name_box").hide();
		$("#" + $(this).attr("id") + " .module_name").hide();
		
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#dcdcdc");
			
		$(".module_name_box")
			.css("fill", "#dcdcdc");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
	});
	
	//listeners for our modules' bars
	$("svg rect.module_bar_transparent").on("mouseenter", function(d) {
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#dcdcdc");
			
		$(".module_name_box")
			.css("fill", "#dcdcdc");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
			
			var srcE = d.srcElement ? d.srcElement : d.target;
			var module_name = $(srcE).attr("class").split(' ')[0];
		
		$("svg.left rect.module_bar." + module_name)
			.css("fill", "#fff");
			
		$(".module_name_box." + module_name)
			.css("fill", "#fff");
			
		$("svg.right rect.module_bar." + module_name)
			.css("fill", "#4898ff");
	});
	
	//listeners for our modules' bars
	$(".module_name, .module_name_box").on("mouseenter", function(d) {
		//clear existing highlights
		$("svg.left rect.module_bar")
			.css("fill", "#dcdcdc");
			
		$(".module_name_box")
			.css("fill", "#dcdcdc");
			
		$("svg.right rect.module_bar")
			.css("fill", "#76B0D8");
			
		var srcE = d.srcElement ? d.srcElement : d.target;
		var module_name = $(srcE).attr("class").split(' ')[0];
		
		$("svg.left rect.module_bar." + module_name)
			.css("fill", "#fff");
			
		$(".module_name_box." + module_name)
			.css("fill", "#fff");
			
		$("svg.right rect.module_bar." + module_name)
			.css("fill", "#4898ff");
			
	});
}

function redrawCurrentView() {
	//called when we switch the version of either the lhs or rhs
	resetLoadedDataFlags();

	//update the version headers
	$("#lhs_version_header").html("Firefox " + what_is_lhs);
	$("#rhs_version_header").html("Firefox " + what_is_rhs);

	//todo determine which the current view is
	//right now, ill just assume it's the default chart view

	if(active_view == "chart")
		loadChartView(true);
	else if(active_view == "matrix")
		loadMatrixView();
	else if(active_view == "network")
		loadNetworkView();
}

function addMatrixHighlighters(which_one) {
	//set their coords
	var which_side_selector = (which_one == "lhs") ? ".left_overlay" : ".right_overlay";
	
	//do the horizontal ones
	$(which_side_selector + ".horizontal").each(function(i) {
		var which_module = $(this).attr("class").split(" ")[0].split("_")[1];
		
		$(this)
			.css("width", 500)
			.css("height", function() {
				if(which_one == "lhs")
					return eval("matrix_v" + what_is_lhs + "_modules[which_module][2][1]");
				else if(which_one == "rhs")
					return eval("matrix_v" + what_is_rhs + "_modules[which_module][2][1]");
			})
			.css("top", function() {
				if(which_one == "lhs")
					return eval("matrix_v" + what_is_lhs + "_modules[which_module][2][3]");
				else if(which_one == "rhs")
					return eval("matrix_v" + what_is_rhs + "_modules[which_module][2][3]");
			});
	});
	
	//do the vertical ones
	$(which_side_selector + ".vertical").each(function(i) {
		var which_module = $(this).attr("class").split(" ")[0].split("_")[1];
		
		$(this)
			.css("height", 500)
			.css("width", function() {
				if(which_one == "lhs")
					return eval("matrix_v" + what_is_lhs + "_modules[which_module][2][0]");
				else if(which_one == "rhs")
					return eval("matrix_v" + what_is_rhs + "_modules[which_module][2][0]");
			})
			.css("left", function() {
				if(which_one == "lhs")
					return eval("matrix_v" + what_is_lhs + "_modules[which_module][2][2]");
				else if(which_one == "rhs")
					return eval("matrix_v" + what_is_rhs + "_modules[which_module][2][2]");
			});
	});
}

function assignDynamicContentEventListeners() {
	$("#close_modal_matrix").off("click");
	$("#what_mean_matrix").off("click");
	$("#modules_legend div").off("mouseover");
	$("#matrix_view").off("click");
	//$("#modules_legend div").off("mouseout");
	
	$("#modules_legend div").on("mouseover", function(d) {
		$(".overlay").hide();
		
		var srcE = d.srcElement ? d.srcElement : d.target;
		var id = $(srcE).attr("id");
		$(".overlay_" + id)
			.css("background-color", "rgb(" + module_colors[id] + ")")
			.show();
	});
	
	$("#matrix_view").on("click", function(d) {
		$(".overlay").fadeOut();
	});
	
	/*$("#modules_legend div").on("mouseout", function(d) {
		var srcE = d.srcElement ? d.srcElement : d.target;
		var id = $(srcE).attr("id");
		$(".overlay_" + id).hide();
	});*/
	
	$("#what_mean_matrix").on("click", function() {
		$("#matrix_modal").show();
		
		return false;
	});
	
	$("#close_modal").on("click", function() {
		$("#matrix_modal").hide();
		
		return false;
	});
	
	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
			$("#matrix_modal").hide();
		}
	});
	
}

function loadChartView(are_we_updating) {
	if(chart_data_already_loaded) return;

	console.log("about to draw");

	d3.json("data/firefox" + what_is_lhs + "_module_breakdown.json", function(d_lhs) {
	 	d3.json("data/firefox" + what_is_rhs + "_module_breakdown.json", function(d_rhs) {
	 		data_lhs = d_lhs;
	 		data_rhs = d_rhs;
	 		data_lhs.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
	 		data_rhs.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
	 		
			drawMetric("#metric #chart_view #loc_code", ["loc_code", "loc_code"], "", 0, are_we_updating);
			drawMetric("#metric #chart_view #mccabe_per_kloc_code", ["mccabe_per_kloc_code", "mccabe_per_kloc_code"], "", 0, are_we_updating);
			//drawMetric("#metric", ["loc_code", "dependencies_density"], "", 1, are_we_updating);
			drawMetric("#metric #chart_view #prop_cost", ["prop_cost", "prop_cost"], "", 1, are_we_updating);
			drawMetric("#metric #chart_view #percent_in_core", ["percent_in_core", "percent_in_core"], "", 1, are_we_updating);
			drawMetric("#metric #chart_view #sum_fanin", ["sum_fanin", "sum_fanin"], "", 0, are_we_updating);
			drawMetric("#metric #chart_view #sum_vfanin", ["sum_vfanin", "sum_vfanin"], "", 0, are_we_updating);	 
			
			
			chart_data_already_loaded = true;
	 	})	
	 });
}

function loadMatrixView() {
	if(matrix_data_already_loaded) return;
	
	$("#loading_matrices").show();
	
	setTimeout(function() {
		//update the {files, density} metrics if necessary
		//ok to add trailing .0 since we're only going from 16 onwards for module breakdown and matrix views
		$("#lhs_files").text(addCommas(architectural_data_full.allversions_files_with_dependencies[what_is_lhs + ".0"]));
		$("#rhs_files").text(addCommas(architectural_data_full.allversions_files_with_dependencies[what_is_rhs + ".0"]));
		$("#lhs_density").text((architectural_data_full.allversions_dependencies_density[what_is_lhs + ".0"] * 100).toFixed(4) + "%");
		$("#rhs_density").text((architectural_data_full.allversions_dependencies_density[what_is_rhs + ".0"] * 100).toFixed(4) + "%");
		
		addMatrixHighlighters("lhs");
		addMatrixHighlighters("rhs");
	
		//png
		if(use_raster_for_matrix) {
			$("#canvas1").attr("src", "images/matrix_v" + what_is_lhs + "_raster.png");
			$("#canvas2").attr("src", "images/matrix_v" + what_is_rhs + "_raster.png");
		
			$("#loading_matrices").delay(400).fadeOut();
			matrix_data_already_loaded = true;
		}
		//canvas
		else {
			addModulesLegend();
			drawMatrixCanvas();
		}
	}, matrix_load_delay);
}

function loadNetworkView() {
	if(network_data_already_loaded) return;
	//todo
	
	network_data_already_loaded = true;
}

function addModulesLegend() {
	//make idempotent
	$("#modules_legend").empty();
	
	//add legend
	var i=0;
	for(i; i < modules.length; i++) {
		$("#modules_legend").append("<div id='" + modules[i] + "' style='background-color:rgb(" + module_colors[modules[i]] + ")'>" + modules[i] + "</div> ");
	}
	
	setTimeout(function() {
		assignDynamicContentEventListeners();
	}, 1000);
}

function drawMetric(container, metrics, max_value, is_percent, are_we_updating) {
	//make idempotent if redrawing, otherwise, we'll just update the data
	if(!are_we_updating)
		$(container + " svg").remove();
	
	setTimeout(function() {
		var h = 340,
				w = 200,
				rect_height = 15,
				rect_padding = 5,
				svgPaddingTop = 30,
				svgPaddingRight = 40;
				
				
		//if we're updating, just update the data, don't add anything
		if(are_we_updating) {
			console.log("updating...");
			$.each(metrics, function(metric_i, metric) {
				//depending on whether we're on the first metric or the second, choose the appropriate svg container
				var svg = (metric_i == 0) ? container + " svg.left" : container + " svg.right";
			
				//show data for each metric (there will always be two), each in its own svg
				var data;
				if(metric_i == 0)
					data = data_lhs;
				else
					data = data_rhs;
				
				var xMax = (max_value != "") ? max_value : d3.max(data.json_data, function(d) { return eval("d.data[0]."+metric); });
				var xScale = d3.scale.linear()
			    	.domain([0, xMax])
    			    .range([0, w-svgPaddingRight]);
    			
				//for each of the modules in our "new" data file, update its corresponding .module_bar's x and width values
				$.each(data.json_data, function(module_i, module_d) {
					d3.selectAll(svg + " ." + module_d.module + ".module_bar")
						.transition()
						.duration(1000)	
						.attr("x", function() {
								if(metric_i == 0) { //lhs metric
									return w-xScale(eval("module_d.data[0]."+metric));
								}
								else { //rhs metric
									return 0;
								}
						})
						.attr("width", function() {
							return xScale(eval("module_d.data[0]."+metric));
						});
						
					//show value for rhs metric
					if(metric_i == 1) {
						d3.selectAll(svg + " ." + module_d.module + ".module_value")
							.transition()
							.duration(1000)
			    			.text(function() {
			    				if(is_percent)
			    					return (eval("module_d.data[0]."+metric)*100).toFixed(2) + "%";
			    				else
									return getHumanSize(eval("module_d.data[0]."+metric));
							})
							.attr('x', xScale(eval("module_d.data[0]."+metric))+3);
					}
					else {
						d3.selectAll(svg + " ." + module_d.module + ".module_value")
							.transition()
							.duration(1000)
			    			.text(function() {
			    				if(is_percent)
			    					return (eval("module_d.data[0]."+metric)*100).toFixed(2) + "%";
			    				else
									return getHumanSize(eval("module_d.data[0]."+metric));
							})
							.attr("text-anchor", "end")
							.attr('x', w-xScale(eval("module_d.data[0]."+metric))-3);
					}
				});
			});
			
			return;
		}
	
	 		//console.log(data.json_data);
	 		//data.json_data.map(function(d, i) { console.log(d.data[0].mccabe/(d.data[0].loc_code/1000)); });
	 	
			//draw a set of bars for each module
			//data.json_data.sort(function(a,b) { return b.data[0].loc_code - a.data[0].loc_code;});
		
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
				if(metric_i == 0)
					data = data_lhs;
				else
					data = data_rhs;
				
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
							.attr("class", d.module + " module_value")
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
							.attr("class", d.module + " module_value")
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
	//draw the charts
	d3.json("data/architectural_by_chart.json", function(data) {
		architectural_data_full = data;
		
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
			if(id == "allversions_defects_per_hundred_thousand_loc_code") splice_from = 7;
			
			drawEachBelowTheFoldChart(eval("data."+id), "#chart_container_container #" + id, format, humanify_numbers, custom_units, splice_from);
		});
	});
}

function drawEachBelowTheFoldChart(data, container, format, humanify_numbers, custom_units, splice_from) {
	var w = 570,
		h = 180,
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
        .domain([0, yMax])
        .range([h-yPadding+2-30, yPadding-6]);
            
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
	    .attr("transform", "translate(-10," + (h-xPadding-3-30) + ")")
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
    	.attr('y1', h-xPadding-30)
    	.attr('y2', xPadding)
    	.attr('x1', 0)
    	.attr('x2', 0);

    //y labels
    svg.append('svg:text')
			.text("Firefox release")
			.attr('class', 'y_label')
    		.attr('text-anchor', 'bottom')
			.attr('dy', 160)
			.attr('dx', 260)

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

function drawMatrixCanvas(container) {
 	var data_file_a = "data/firefox" + what_is_lhs + "_file_dependencies.csv.deps",
	 	data_file_b = "data/firefox" + what_is_rhs + "_file_dependencies.csv.deps";
 		//data_file_b = "data/firefox17_file_dependencies.csv";
 		//data_file_b = "data/firefox16_visibility.csv";
 		
	//get a reference to the canvas
	var ctx_a = $('#canvas1')[0].getContext("2d"),
		ctx_b = $('#canvas2')[0].getContext("2d");
		

	d3.csv(data_file_a, function(data) {
		drawEachMatrixCanvas(data, ctx_a, false, eval("matrix_v" + what_is_lhs + "_modules"));
	});
	
	d3.csv(data_file_b, function(data) {
		drawEachMatrixCanvas(data, ctx_b, true, eval("matrix_v" + what_is_rhs + "_modules"));
	});
	
	matrix_data_already_loaded = true;
}

function drawEachMatrixCanvas(data, which_canvas, last_one, which_version) {
		var total_deps = 0,
			nnz = data.length,
			max_from_file,
			max_to_file,
			max_file,
			length = 500;
			
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
			which_canvas.fillStyle = getModuleColor(d, which_version);
			which_canvas.beginPath();
			which_canvas.rect(xScale(d.to_file), yScale(d.from_file), point_size, point_size)
			which_canvas.closePath();
			which_canvas.fill();
		});		
		
		
		if(last_one) {
			console.log("done");
			$("#loading_matrices").delay(2000).fadeOut();
		}
}

function getModuleColor(d, which_version) {
	for(var i=0; i < modules.length; i++) {
		if((d.from_file <= which_version[modules[i]][1] && d.from_file >= which_version[modules[i]][0])
			&& (d.to_file <= which_version[modules[i]][1] && d.to_file >= which_version[modules[i]][0])
		) {
			return "rgba(" + module_colors[modules[i]] + "," + alpha + ")";
		}
	}
	
	//return white
	return "rgba(236, 235, 235," + alpha + ")";
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