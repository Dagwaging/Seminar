$(document).ready(function() {
  /*
  esper.WebGLContext._get = esper.WebGLContext.get;
  esper.WebGLContext.get = function(canvas, options) {
    var context = esper.WebGLContext._get(canvas, options);

    for(var f in context) {
      if(typeof context[f] == "function" && !context[f].wrapped) {
        var old = context[f];
        context[f] = (function(old, f){ return function() {
          //console.log(f + '(' + Array.prototype.slice.call(arguments).join(', ') + ')');
          console.log(f);
          console.log(arguments);
          return old.apply(this, arguments);
        }; })(old, f);
        context[f].wrapped = true;
      }
    }
    
    return context;
  };
  */

  var filters = {
    identity:
    { factor: 1,
      filter:
        [ 0, 0, 0,
          0, 1, 0,
          0, 0, 0 ] },
    gaussian:
    { factor: 16,
      filter:
        [ 1, 2, 1,
          2, 4, 2,
          1, 2, 1 ] },
    edge:
    { factor: 1,
      filter:
        [ -1, -1, -1,
          -1, 8, -1,
          -1, -1, -1 ] },
    sharpen:
    { factor: 1,
      filter:
        [ 0, -1, 0,
          -1, 5, -1,
          0, -1, 0 ] },
    box:
    { factor: 9,
      filter:
        [ 1, 1, 1,
          1, 1, 1,
          1, 1, 1] },
    custom:
    { factor: 1,
      filter:
        [ 0, 0, 0,
          0, 1, 0,
          0, 0, 0 ] }
  };

  var MAX_ZOOM = 10;

  var filter,
      gl,
      shader,
      texture,
      vertexBuffer,
      viewport,
      zoom,
      offset;

  function setFilter(_factor, _filter) {
    filter = {
      factor: _factor,
      filter: _filter };

    shader.setUniform('factor', filter.factor);
    shader.setUniform('filter', filter.filter);

    $(".kernel").each(function(i, input) {
      input.value = _filter[i];
    });

    $("#factor > input").val(_factor);
  }

  function getFilter() {
    $(".kernel").each(function(i, input) {
      filters.custom.filter[i] = input.value;
    });

    filters.custom.factor = $("#factor > input").val();
  }

  gl = esper.WebGLContext.get("canvas", {
    antialias: false,
     depth: false
  });

  if(!gl) {
    console.log("Unable to create WebGL context.");
  }

  shader = new esper.Shader({
    vert: 'shaders/shader.vert',
         frag: 'shaders/shader.frag'
  }, function(shader) {
    shader.push();
    setFilter(filters.identity.factor, filters.identity.filter);
  });

  var vertices = [
    [ -1.0, 1.0 ],
    [ 1.0, 1.0 ],
    [ -1.0, -1.0 ],
    [ 1.0, -1.0 ] ];

  var uvs = [
    [ 0.0, 1.0 ],
    [ 1.0, 1.0 ],
    [ 0.0, 0.0 ],
    [ 1.0, 0.0 ] ];

  vertexBuffer = new esper.VertexBuffer(new esper.VertexPackage({
    0: vertices,
    1: uvs
  }));

  function draw() {
    if(texture) {
      viewport.pop();
      viewport.push(0, 0, $("#canvas").width(), $("#canvas").height());

      shader.setUniform('zoom', zoom);
      shader.setUniform('offset', [ offset.x, -offset.y ]);
      /*
      viewport.push(
          texture.width * (1 - zoom) / 2 + offset.x,
          texture.height * (1 - zoom) / 2 - offset.y,
          texture.width * zoom,
          texture.height * zoom);
          */

      vertexBuffer.bind();
      vertexBuffer.draw({
        mode: 'TRIANGLE_STRIP',
        count: 4
      });
    }
  }

  $("#file").on("change", function(e) {
    var file = e.target.files[0];
    var url = URL.createObjectURL(file);

    texture = new esper.Texture2D({
      url: url,
      wrap: 'CLAMP_TO_EDGE',
      filter: 'NEAREST',
      invertY: true
    }, function(texture) {
      var ratio = texture.height / texture.width * 100;
      $("#canvas-container").css("padding-bottom", ratio + "%");

      $("#canvas").prop({
        width: $("#canvas").width(),
        height: $("#canvas").height()
      });

      viewport = new esper.Viewport({
        x: 0,
        y: 0,
        width: $("#canvas").width(),
        height: $("#canvas").height()
      });

      zoom = 1;
      offset = {
        x: 0,
        y: 0
      };

      texture.pop();
      texture.push(0);
      shader.setUniform('texture', 0);
      shader.setUniform('textureSize', [ texture.width, texture.height ]);

      draw();
    });
  });

  $("#canvas").on("wheel", function(e) {
    if(texture) {
      var delta = e.originalEvent.wheelDelta / 120;
      zoom = Math.max(1, Math.min(MAX_ZOOM, zoom + delta));

      draw();
      e.preventDefault();
    }
  });

  $("#canvas").on("mousedown", function(e) {
    var startOffset = {
      x: offset.x,
      y: offset.y
    };
    var startDrag = {
      x: e.offsetX,
      y: e.offsetY
    };

    $("#canvas").on("mousemove", function(e) {
      if(texture) {
        var drag = {
          x: e.offsetX,
          y: e.offsetY
        };

        var scale = 1 / $("#canvas").width() / zoom;
        offset.x = startOffset.x + (drag.x - startDrag.x) * scale;
        offset.y = startOffset.y + (drag.y - startDrag.y) * scale;
        draw();
      }

      e.preventDefault();
    });

    $("#canvas").on("mouseup mouseleave", function(e) {
      console.log(offset);
      $("#canvas").off("mousemove");
    });
  });

  $("#filter").on("change", function(e) {
    var _filter = e.target.value;
    setFilter(filters[_filter].factor, filters[_filter].filter);
    draw();
  });

  $(".kernel, #factor > input").on("keyup", function(e) {
    if(e.keyCode == 9)
      return;

    getFilter();
    setFilter(filters.custom.factor, filters.custom.filter);
    $("#filter").val("custom");
    draw();
  });
});
