window.onload = function () {  
  var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = 600
  canvas.height = 300;
  var ctx = canvas.getContext("2d");  
  var centerX = canvas.width / 4;
  var centerY = canvas.height / 2;

  var is_stimulated = 0;
  var step = 0;
  var converged = false;
  
  var inv_sf = 1/2048;
  
  var K = 20;
  var noise_strength = .5;
  var dbs_strength = .1;
  var w_mean = 2;
  var w_std = 0.5;
  var num_nodes = 10;

  var drawAnimation = function() {
    var dbs_patient = document.getElementById("dbs_patient");
    ctx.drawImage(dbs_patient,centerX * 2,centerY / 2.5, 150, 192);
    if (is_stimulated == 1) {
      var lightning_bolt = document.getElementById("lightning_bolt");
      ctx.drawImage(lightning_bolt, centerX * 2, centerY / 2.5, 51, 60);
    }
  }

  var drawCircle = function(radius) {
    // draw circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();

    // draw compass lines
    phases = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    labels = [0, 90, 180, 270];
    // off_x = [+5, 0, -10, 0];
    // off_y = [0, +10, 0, -5];
    var off_x = [+5, 0, -10, 0];
    var off_y = [0, +5, 0, -8];
    for (i = 0; i < phases.length; i++) {
      var x0 = centerX + radius * Math.cos(phases[i]);
      var y0 = centerY + radius * Math.sin(phases[i]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x0, y0);
      ctx.strokeStyle = "red";
      ctx.stroke();
      ctx.closePath();
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillStyle="red";
      ctx.fillText(labels[i],x0+off_x[i],y0+off_y[i]);
    }
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
    document.getElementById("r").innerHTML = "r = " + r;
    document.getElementById("r_value").value = r;
    if (Math.abs(1 - r) < Math.pow(10,-5) && !converged) {
      document.getElementById("converge").innerHTML = "Converged on step " + step + "!";
      converged = true;
    }

    var psi = Math.atan2(sum.sin,sum.cos);
    document.getElementById("psi").innerHTML = "psi = " + psi;
    var newNodes = [];
    for (var x = 0; x < ns.length; x++) {
      var dthdt = ns[x].weight + K * r * Math.sin(psi - ns[x].phase);
      newNodes.push({phase: (ns[x].phase + dthdt * inv_sf 
        + noise_strength * (Math.random() - 0.5) * Math.sqrt(inv_sf) 
        + dbs_strength * Math.sin(ns[x].phase) * is_stimulated), 
        weight: ns[x].weight});
      
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
  }
  
  var newNodes = function () {
    var nodes = [];
    for (var x = 0; x < num_nodes; x++) {
      nodes.push({phase: Math.random() * 2 * Math.PI,
        weight: w_mean + Math.random() * w_std,
        color: getRandomColor()});
    }
    return nodes;
  };
  
  var nodes = newNodes();
  
  var newDbs = function () {
    return {phase: 0, rate: inv_sf};
  };
  
  var dbs = newDbs();
    
  var graph_data = [];
  var num_data_points = 100;

  var getGraphData = function () {
    
    document.getElementById("data_length").value = graph_data.length;
    //var sum = getSum(nodes);
    //var r_value = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
    var r_value = parseFloat(document.getElementById("r_value").value);
    graph_data.push(r_value);

    // console.log(graph_data);

    var data_length = graph_data.length;
    var diff = num_data_points - data_length;

    var res = [];
    if (diff > 0) {
      for (var i = 0; i < graph_data.length; ++i) {
        if (diff - i > 0) {
          res.push([i,0.0]);
        }
        else {
          res.push([i + diff, graph_data[i-diff]]);
        }
      }
      console.log(res);
      return res;
    }
    for (var i = 0; i < num_data_points; ++i) {
      res.push([i, graph_data[i-diff]]);
    }
    document.getElementById("res_length").value = res.length;
    console.log(res);
    return res; 

    
    /* if (graph_data.length > 0)
        graph_data = graph_data.slice(1);

      // Do a random walk

      while (graph_data.length < num_data_points) {

        var prev = graph_data.length > 0 ? graph_data[graph_data.length - 1] : 50,
          y = (prev + Math.random()) / 2;

        if (y < 0) {
          y = 0;
        } else if (y > 1) {
          y = 1;
        }

        graph_data.push(y);
      }

      // Zip the generated y values with the x values

      var res = [];
      for (var i = 0; i < graph_data.length; ++i) {
        res.push([i, graph_data[i]])
      }

      document.getElementById("data_length").value = graph_data.length;
      document.getElementById("res_length").value = res.length;
      console.log(graph_data);
      return res; */
  };

  var plot = $.plot("#placeholder", [ getGraphData() ], {
    series: {
      shadowSize: 0 // Drawing is faster without shadows
    },
    yaxis: {
      min: 0,
      max: 1
    },
    xaxis: {
      show: false
    }
  }); 

  var updateGraph = function () {
    plot.setData([getGraphData()]);
    plot.draw();
    // setTimeout(update, updateInterval);
  };

  var id = setInterval(function () {
    drawNodes(nodes);
    nodes = updateNodes(nodes, dbs);
    dbs = updateDbs(dbs);
    if (step % 20 == 0)
      updateGraph();
    document.getElementById("iterations").innerHTML = "Step: " + step++;
  }, 1);
  
document.getElementById("reset").addEventListener("click", function () {
  K = parseFloat(document.getElementById("K").value);
  noise_strength = parseFloat(document.getElementById("noise_strength").value);
  dbs_strength = parseFloat(document.getElementById("dbs_strength").value);
  w_mean = parseFloat(document.getElementById("w_mean").value);
  w_std = parseFloat(document.getElementById("w_std").value);
  num_nodes = parseFloat(document.getElementById("num_nodes").value);
  nodes = newNodes();
  dbs = newDbs();
  step = 0;
  converged = false;
  document.getElementById("converge").innerHTML = "Hasn't converged yet...";
  }, false);
  
document.getElementById("stimulate").addEventListener("mousedown", function () {
  is_stimulated = 1;
  var b_is = (is_stimulated == 1) ? true : false;
  document.getElementById("is_stimulated").innerHTML = "Is Stimulated? " + b_is;
}, false);
  
document.getElementById("stimulate").addEventListener("mouseup", function () {
  is_stimulated = 0;
  var b_is = (is_stimulated == 1) ? true : false;
  document.getElementById("is_stimulated").innerHTML = "Is Stimulated? " + b_is;
}, false);

};

