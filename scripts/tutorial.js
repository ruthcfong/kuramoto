window.onload = function () { 

    var coupled_c = "coupled_canvas";
    var noisy_c = "noisy_canvas";
    var dbs_c = "dbs_canvas";
    var animation_c = "stim_animation_canvas";

    var drawCircle = function(c, radius) {
        var canvas = document.getElementById(c);
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.font="24px Arial";

        if (c === dbs_c) {
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
        }
        
        // draw circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.closePath();

        // draw compass lines
        phases = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
        labels = [0, 90, 180, 270];
        var off_x = [+10, 0, -25, 0];
        var off_y = [0, +15, 0, -15];
        for (i = 0; i < phases.length; i++) {
            var x0 = centerX + radius * Math.cos(phases[i]);
            var y0 = centerY + radius * Math.sin(phases[i]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x0, y0);
            ctx.strokeStyle = "#D3D3D3";
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.fillStyle="red";
            ctx.fillText(labels[i],x0+off_x[i],y0+off_y[i]);
            ctx.closePath();
        }

        if (c === dbs_c) {
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
    };

    var drawPoint = function(c, radius, phase) {
        var canvas = document.getElementById(c);
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

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
    };

    var clearCanvas = function(c) {
        var canvas = document.getElementById(c);
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width, canvas.height);
    };

    var drawNodes = function(c, radius, ns) {
        clearCanvas(c);
        drawCircle(c,radius);
        for (var x = 0; x < ns.length; x++) {
          drawPoint(c,radius,ns[x].phase);
          drawPoint(c,radius,ns[x].phase);
        }
    };

    var drawAnimation = function(c, is_stimulated, step, stim_step) {
        var dbs_patient = document.getElementById("dbs_patient");
        var canvas = document.getElementById(c);
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        var sf = 1.5;
        ctx.drawImage(dbs_patient,centerX,centerY, sf*150, sf*192);
        if (is_stimulated == 1 && step % stim_step == 0) {
          var lightning_bolt = document.getElementById("lightning_bolt");
          ctx.drawImage(lightning_bolt, centerX, centerY, sf*51, sf*60);
        }
    }

    var getSum = function(ns) {
        var sum = ns.reduce(function (s, node) {
          s.sin += Math.sin(node.phase);
          s.cos += Math.cos(node.phase);
          return s;
        }, {sin:0, cos: 0});
        var num_nodes = ns.length;
        sum.sin /= num_nodes;
        sum.cos /= num_nodes; 

        return sum;
    }

    var modulo = function(x, y) {
    return ((x % y) + y ) % y;
    }

    var randn = function(mean, std) {
    return mean + std*((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) * Math.sqrt(2);
    }

    var updateNodes = function(ns, K, noise_strength, dbs_strength, is_stimulated, inv_sf, step, stim_step) {    
        var sum = getSum(ns);

        r = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
        var psi = modulo(Math.atan2(sum.sin,sum.cos),2*Math.PI);
        var newNodes = [];
        for (var x = 0; x < ns.length; x++) {
          var dthdt = ns[x].weight + K * r * Math.sin(psi - ns[x].phase);
          newNodes.push({phase: (ns[x].phase + dthdt * inv_sf 
            + noise_strength * randn(0,Math.sqrt(inv_sf)) 
            + dbs_strength * (-Math.sin(ns[x].phase)) * is_stimulated * (step % stim_step == 0)), 
            weight: ns[x].weight});
          
        }
        return newNodes;
    };

    var newNodes = function (num_nodes, w_mean, w_std) {
        var nodes = [];
        for (var x = 0; x < num_nodes; x++) {
          nodes.push({phase: Math.random() * 2 * Math.PI,
            weight: w_mean + Math.random() * w_std});
        }
        return nodes;
    };
  
    var radius = 150;
    
    var K = 10.0;
    var w_mean = 32;
    var w_std = 2;
    var noise_strength = 1.0;
    var dbs_strength = 0.5;
    var inv_sf = 1/2048;
    var num_nodes = 10;
    var is_stimulated = false;

    var step = 0;
    var stim_step = 20;

    var coupled_nodes = newNodes(num_nodes,w_mean,w_std);
    var noisy_nodes = newNodes(num_nodes,w_mean,w_std);
    var dbs_nodes = newNodes(num_nodes,w_mean,w_std);

    
    var id = setInterval(function () {
        drawNodes(coupled_c, radius, coupled_nodes);
        drawNodes(noisy_c, radius, noisy_nodes);
        drawNodes(dbs_c, radius, dbs_nodes);
        drawAnimation(animation_c, is_stimulated, step, stim_step);
        coupled_nodes = updateNodes(coupled_nodes, K, 0, 0, false, inv_sf, 
            step, stim_step);
        noisy_nodes = updateNodes(noisy_nodes, K, noise_strength, 0, false, 
            inv_sf, step, stim_step);
        dbs_nodes = updateNodes(dbs_nodes, K, noise_strength, dbs_strength, is_stimulated, 
            inv_sf, step, stim_step);
        step++;
    }, 1);

    document.getElementById(coupled_c).addEventListener("mousedown", function () {
        coupled_nodes = newNodes(num_nodes,w_mean,w_std);
    });

    document.getElementById(noisy_c).addEventListener("mousedown", function () {
        noisy_nodes = newNodes(num_nodes,w_mean,w_std);
    });

    document.getElementById(dbs_c).addEventListener("mousedown", function () {
        dbs_nodes = newNodes(num_nodes,w_mean,w_std);
    });

    document.getElementById("stimulate").addEventListener("mousedown", function () {
      is_stimulated = 1;
    }, false);

    document.getElementById("stimulate").addEventListener("mouseup", function () {
      is_stimulated = 0;
    }, false);
};