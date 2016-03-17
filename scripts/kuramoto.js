window.onload = function () {  
  /* var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = 600
  canvas.height = 300; */
  var canvas = document.getElementById("canvas_oscillator");
  var ctx = canvas.getContext("2d");  
  var centerX = canvas.width / 4;
  var centerY = canvas.height / 2;

  var time_for_game = 30;
  var graph_update_steps = 20;
  var game_end = 0;
  var game_start = 0;
  var is_game = false;
  var is_autostimulated = false;
  var step_pulse = 0;
  var is_stimulated = 0;
  var should_stimulate = false;
  var in_stim_block = false;
  var last_stim_time = 0;
  var step = 0;
  var converged = false;
  var points = 0;
  var r_at_stim_onset = 0;

  var updateStimOptions = function() {
    var stim_options = document.getElementsByName('stim_option');
    for(var i = 0; i < stim_options.length; i++){
        if(stim_options[i].checked){
            stim_option = stim_options[i].value;
            return;
        }
    }
  };

  var K = parseFloat(document.getElementById("K").value);
  var noise_strength = parseFloat(document.getElementById("noise_strength").value);
  var dbs_strength = parseFloat(document.getElementById("dbs_strength").value);
  var w_mean = parseFloat(document.getElementById("w_mean").value);
  var w_std = parseFloat(document.getElementById("w_std").value);
  var num_nodes = parseFloat(document.getElementById("num_nodes").value);
  var sampling_freq = parseFloat(document.getElementById("sampling_freq").value);
  var pulse_freq = parseFloat(document.getElementById("pulse_freq").value);
  var num_pulses = parseFloat(document.getElementById("num_pulses").value);
  var phase_to_stim = parseFloat(document.getElementById("phase_to_stim").value);
  var stim_option;
  updateStimOptions();

  var stim_step = 1/pulse_freq;
  var inv_sf = 1/sampling_freq;

  var setDefaultValues = function() {
    document.getElementById("K").value = "5.0";
    document.getElementById("noise_strength").value = "0.5";
    document.getElementById("dbs_strength").value = "1.5";
    document.getElementById("w_mean").value = "32.0";
    document.getElementById("w_std").value = "2.0";
    document.getElementById("num_nodes").value = "10";
    document.getElementById("sampling_freq").value = "2048";
    document.getElementById("pulse_freq").value = "130";
    //document.getElementById("num_pulses").value = "6";
    document.getElementById("num_pulses").disabled = true;
    //document.getElementById("phase_to_stim").value = "0";
    document.getElementById("phase_to_stim").disabled = true;
    document.getElementById("stim_option_uniform").checked = true;
    document.getElementById("stim_option_half").checked = false;
    document.getElementById("stim_option_random").checked = false;
    //var params = document.getElementsByClassName("parameter");
  };

  var modulo = function(x, y) {
    return ((x % y) + y ) % y;
  }

  var randn = function(mean, std) {
    return mean + std*((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
  }

  var drawAnimation = function() {
    var dbs_patient = document.getElementById("dbs_patient");
    ctx.drawImage(dbs_patient,centerX * 2,centerY / 2.5, 150, 192);
    if (Math.abs(step - last_stim_time*sampling_freq) < 5) {
      var lightning_bolt = document.getElementById("lightning_bolt");
      ctx.drawImage(lightning_bolt, centerX * 2, centerY / 2.5, 51, 60);
    }
  }

  var drawCircle = function(radius) {
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font="24px Arial";

    // draw circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();

    // draw bottom-half circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#F08080"; // coral
    ctx.fill();
    ctx.closePath();

    // draw top-half circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#90EE90"; // light green
    ctx.fill();
    ctx.closePath();

    // for more color names: http://www.w3schools.com/colors/colors_names.asp

    // draw compass lines
    phases = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    labels = [0, 90, 180, 270];
    // off_x = [+5, 0, -10, 0];
    // off_y = [0, +10, 0, -5];
    var off_x = [+10, 0, -25, 0];
    var off_y = [0, +15, 0, -15];
    for (i = 0; i < phases.length; i++) {
      var x0 = centerX + radius * Math.cos(phases[i]);
      var y0 = centerY + radius * Math.sin(phases[i]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x0, y0);
      ctx.strokeStyle = "#778899"; // light slate gray
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.fillStyle="red";
      ctx.fillText(labels[i],x0+off_x[i],y0+off_y[i]);
      ctx.closePath();
    }

    // add text to bottom-half circle
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillText("Slow Down",centerX,centerY+radius/2);
    ctx.closePath();

    // add text to top-half circle
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillText("Speed Up",centerX,centerY-radius/2);
    ctx.closePath();
  }
  
 
  var drawPoint = function(radius, phase, color) {
    var x = centerX + radius * Math.cos(phase);
    var y = centerY + radius * Math.sin(phase);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(x,y,5,0,Math.PI*2);
    ctx.fillStyle = "purple";
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
  
  var r = 0;

  var getSum = function(ns) {
    var sum = ns.reduce(function (s, node) {
      s.sin += Math.sin(node.phase);
      s.cos += Math.cos(node.phase);
      return s;
    }, {sin:0, cos: 0});
    sum.sin /= num_nodes;
    sum.cos /= num_nodes; 
    
    return sum;
  }
  
  var updateNodes = function(ns, ds) {    
    var sum = getSum(ns);

    r = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
    //document.getElementById("r").innerHTML = "r = " + r;
    // document.getElementById("r_value").value = r;
    if (Math.abs(1 - r) < Math.pow(10,-5) && !converged) {
      //document.getElementById("converge").innerHTML = "Converged on step " + step + "!";
      converged = true;
    }

    var psi = modulo(Math.atan2(sum.sin,sum.cos), 2*Math.PI);
    if (is_autostimulated) {
      is_stimulated = false;

      if (step/sampling_freq - last_stim_time > stim_step) {
        if (in_stim_block) {
          is_stimulated = 1;
        }
        else {
          if (Math.abs(psi-phase_to_stim) < 0.1) {
            in_stim_block = true;
            is_stimulated = 1;
          }
        }

        if (is_stimulated == 1) {
          step_pulse++;
          last_stim_time = step/sampling_freq;
        }

        if (in_stim_block && step_pulse == num_pulses) {
          step_pulse = 0;
          in_stim_block = false;
        }
      }
    }

    if (should_stimulate) {
      is_stimulated = 0;
      if (step/sampling_freq - last_stim_time > stim_step) {
        is_stimulated = 1;
        last_stim_time = step/sampling_freq;
      } 
    }
    else {
      is_stimulated = 0;
    }

    var newNodes = [];
    for (var x = 0; x < ns.length; x++) {
      var dthdt = ns[x].weight + K * r * Math.sin(psi - ns[x].phase);
      newNodes.push({phase: (ns[x].phase + dthdt * inv_sf 
      + noise_strength * randn(0,Math.sqrt(inv_sf))
      + ns[x].dbs_strength * dbs_strength * (-Math.sin(ns[x].phase)) * is_stimulated), 
      weight: ns[x].weight,
      dbs_strength: ns[x].dbs_strength});
    }
    return newNodes;
  };
  
  var updateDbs = function (ds) {
    return {phase: ds.phase + ds.rate, rate: ds.rate};
  };
  
  var drawNodes = function(ns) {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    drawAnimation();
    var rad = 100;
    drawCircle(rad);
    for (var x = 0; x < ns.length; x++) {
      drawPoint(rad,ns[x].phase, ns[x].color);
      drawPoint(rad,ns[x].phase, ns[x].color);
    }
  };
  
  var getRandomColor = function () {
    /*var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;*/
    return "purple";
  };
  
  var generateDbsStrength = function() {
    var strengths = [];
    var cum_strengths = 0;
    for (var x = 0; x < num_nodes; x++) {
      var s = 0;
      switch (stim_option) {
        case "half":
          if (x < num_nodes/2) {
            s = 0;
          }
          else {
            s = 1;
          }
          break;
        case "random":
          s = Math.random();
          break;
        case "uniform":
        default:
          s = 1;
          break;
      }
      strengths.push(s);
      cum_strengths += s;
    }

    for (var x = 0; x < num_nodes; x++) {
      strengths[x] /= cum_strengths;
    }

    return strengths;
  };

  var newNodes = function () {
    var nodes = [];
    var dbs_strengths = generateDbsStrength();
    for (var x = 0; x < num_nodes; x++) {
      nodes.push({phase: Math.random() * 2 * Math.PI,
        weight: w_mean + Math.random() * w_std,
        dbs_strength: dbs_strengths[x],
        color: getRandomColor()});
    }
    return nodes;
  };
  
  var nodes = newNodes();
  
  var newDbs = function () {
    return {phase: 0, rate: inv_sf};
  };
  
  var dbs = newDbs();
    
  var r_data = [];
  var cos_data = [];
  var phase_data = [];
  var num_data_points = 100;

  var getGraphData = function (graph_type) {
    
    var sum = getSum(nodes);
    var graph_data = [];
    
    switch (graph_type) {
      case "r":
        var r_value = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
        r_data.push(r_value);
        graph_data = r_data;
        //document.getElementById("r_value").value = r_value;
        break;
      case "tremor":
        cos_data.push(sum.cos);
        graph_data = cos_data;
        //document.getElementById("cos_value").value = sum.cos;
        break;
      case "phase":
        var psi = Math.atan2(sum.sin,sum.cos);
        var phase = modulo(psi,2*Math.PI);
        phase_data.push(phase);
        graph_data = phase_data;
        break;
      default:
        break;
    }
    

    var data_length = graph_data.length;
    var diff = num_data_points - data_length;

    var res = [];
    
   // graph_data = graph_data.slice(Math.max(graph_data.length - num_data_points, 1));
    
    for (var i = 0; i < num_data_points; ++i) {
      res.push([i, graph_data[i-diff]]);
    }
    return res; 
  };

  var r_plot = $.plot("#r_graph", [ getGraphData("r") ], {
    series: {
      shadowSize: 0 // Drawing is faster without shadows
    },
    yaxis: {
      min: 0,
      max: 1
    },
    xaxes: [{axisLabel: 'Time'},],
    yaxes: [{position: 'left',
      axisLabel: 'Coherence (r)'},]
  }); 

  var cos_plot = $.plot("#cos_graph", [ getGraphData("tremor") ], {
    series: {
      shadowSize: 0 // Drawing is faster without shadows
    },
    yaxis: {
      min: -1,
      max: 1
    },
    axisLabels: {
      show: true
    },
    xaxes: [{axisLabel: 'Time'},],
    yaxes: [{position: 'left',
      axisLabel: 'Tremor (avg cos[oscillator])'},]
  }); 

  var phase_plot = $.plot("#phase_graph", [ getGraphData("phase") ], {
    series: {
      shadowSize: 0 // Drawing is faster without shadows
    },
    yaxis: {
      min: 0,
      max: 2*Math.PI
    },
    axisLabels: {
      show: true
    },
    xaxes: [{axisLabel: 'Time'},],
    yaxes: [{position: 'left',
      axisLabel: 'Phase (in radians)'},]
  }); 

  var updateGraph = function () {
    cos_plot.setData([getGraphData("tremor")]);
    cos_plot.draw();
    r_plot.setData([getGraphData("r")]);
    r_plot.draw();
    phase_plot.setData([getGraphData("phase")]);
    phase_plot.draw();
  };

  var clearGraph = function() {
    r_data = [];
    cos_data = [];
    phase_data = [];
    updateGraph();
  }

  var resetSim = function() {
    K = parseFloat(document.getElementById("K").value);
    noise_strength = parseFloat(document.getElementById("noise_strength").value);
    dbs_strength = parseFloat(document.getElementById("dbs_strength").value);
    w_mean = parseFloat(document.getElementById("w_mean").value);
    w_std = parseFloat(document.getElementById("w_std").value);
    num_nodes = parseFloat(document.getElementById("num_nodes").value);
    sampling_freq = parseFloat(document.getElementById("sampling_freq").value);
    num_pulses = parseFloat(document.getElementById("num_pulses").value);
    pulse_freq = parseFloat(document.getElementById("pulse_freq").value);
    phase_to_stim = parseFloat(document.getElementById("phase_to_stim").value);
    document.getElementById("time").innerHTML = "N/A";
    updateStimOptions();
    stim_step = 1/pulse_freq;
    inv_sf = 1/sampling_freq;
    is_stimulated = false;
    should_stimulate = false;
    in_stim_block = false;
    step = 0;
    points = 0;
    converged = false;
    step_pulse = 0;
    last_stim_time = 0;

    nodes = newNodes();
    dbs = newDbs();
    clearGraph();
  }

  var startTimer = function(duration, display) {
      var start = Date.now(),
          diff,
          minutes,
          seconds;
      function timer() {
          // get the number of seconds that have elapsed since 
          // startTimer() was called
          diff = duration - (((Date.now() - start) / 1000));

          // does the same job as parseInt truncates the float
          minutes = (diff / 60) | 0;
          seconds = (diff % 60) | 0;

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds; 

          if (diff <= 0) {
              // add one second so that the count down starts at the full duration
              // example 05:00 not 04:59
              start = Date.now() + 1000;
          }
      };
      // we don't want to wait a full second before the timer starts
      timer();
  };

  var id = setInterval(function () {
    var curr_time = Date.now();
    if (is_game && curr_time > game_end) {
      document.getElementById("reset").disabled = false;
      document.getElementById("play").disabled = false;
      document.getElementById("time").innerHTML = "N/A";
      return;
    }
    drawNodes(nodes);
    nodes = updateNodes(nodes, dbs);
    dbs = updateDbs(dbs);
    if (step % graph_update_steps == 0) {
      updateGraph();
      var sum = getSum(nodes);
    }
    step++;
    if (is_game) {
      document.getElementById("iterations").innerHTML =  "Points: " + Math.round(points);
      var time_left = game_end - Date.now();
      var min = Math.round(time_left / Math.pow(10,6));
      var sec = Math.round(time_left / Math.pow(10,3) - min * Math.pow(10,6));
        min = min < 10 ? "0" + min : min;
        sec = sec < 10 ? "0" + sec : sec;
      document.getElementById("time").innerHTML = min + ":" + sec;
    } else {
      // document.getElementById("iterations").innerHTML = "Step: " + step;
    }
  }, 1);
  
  document.getElementById("reset").addEventListener("click", function () {
    is_game = false;
    resetSim();
    }, false);
    
  document.getElementById("stimulate").addEventListener("mousedown", function () {
    should_stimulate = true;
    var sum = getSum(nodes);
    r_at_stim_onset = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
  }, false);
    
  document.getElementById("stimulate").addEventListener("mouseup", function () {
    should_stimulate = false;
    var sum = getSum(nodes);
    var r_at_stim_end = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
    points += 100*Math.max(r_at_stim_onset - r_at_stim_end, 0);
  }, false);

  document.getElementById("play").addEventListener("click", function() {
    is_game = true;
    is_autostimulated = false;
    document.getElementById("autostimulate").checked = false;
    document.getElementById("reset").disabled = true;
    document.getElementById("stimulate").disabled = false;
    document.getElementById("play").disabled = true;
    setDefaultValues();
    resetSim();
    game_start = Date.now();
    game_end = game_start + time_for_game * 1000;
    // var display = document.querySelector('#time');
    // startTimer(time_for_game, display);
  }, false);

  document.getElementById("autostimulate").addEventListener("click", function () {
    if (document.getElementById("autostimulate").checked) {
      document.getElementById("stimulate").disabled = true;
      document.getElementById("num_pulses").disabled = false;
      document.getElementById("phase_to_stim").disabled = false;
      is_autostimulated = true;
      resetSim();
    }
    else {
      document.getElementById("stimulate").disabled = false;
      document.getElementById("num_pulses").disabled = true;
      document.getElementById("phase_to_stim").disabled = true;
      is_autostimulated = false;
      is_stimulated = false;
    }
  }, false);

};

