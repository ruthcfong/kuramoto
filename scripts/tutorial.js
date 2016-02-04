window.onload = function () { 

    var drawCircle = function(ctx, radius) {
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

    var regularity_canvas = document.getElementById("regularity_canvas");
    var regularity_ctx = regularity_canvas.getContext("2d");
    drawCircle(regularity_ctx,100);


};