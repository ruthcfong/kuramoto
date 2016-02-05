window.onload = function () { 

    var drawCircle = function(c, radius) {
        var canvas = document.getElementById(c);
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        
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

    var updateNodes = function(ns, K, noise_strength, dbs_strength, is_stimulated, inv_sf, step, stim_step) {    
        var sum = getSum(ns);

        r = Math.sqrt(Math.pow(sum.sin,2) + Math.pow(sum.cos,2));
        var psi = Math.atan2(sum.sin,sum.cos);
        var newNodes = [];
        for (var x = 0; x < ns.length; x++) {
          var dthdt = ns[x].weight + K * r * Math.sin(psi - ns[x].phase);
          newNodes.push({phase: (ns[x].phase + dthdt * inv_sf 
            + noise_strength * (Math.random() - 0.5) * Math.sqrt(inv_sf) 
            + dbs_strength * Math.sin(ns[x].phase) * is_stimulated * (step % stim_step == 0)), 
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
    var noise_strength = 5.0;
    var dbs_strength = 0.5;
    var inv_sf = 1/2048;
    var num_nodes = 10;
    var is_stimulated = false;

    var step = 0;
    var stim_step = 20;

    var coupled_c = "coupled_canvas";
    var coupled_nodes = newNodes(num_nodes,w_mean,w_std);

    var noisy_c = "noisy_canvas";
    var noisy_nodes = newNodes(num_nodes,w_mean,w_std);

    var dbs_c = "dbs_canvas";
    var dbs_nodes = newNodes(num_nodes,w_mean,w_std);

    var animation_c = "stim_animation_canvas";
    
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

    document.getElementById("stimulate").addEventListener("mousedown", function () {
      is_stimulated = 1;
    }, false);
    document.getElementById("stimulate").addEventListener("mouseup", function () {
      is_stimulated = 0;
    }, false);
};