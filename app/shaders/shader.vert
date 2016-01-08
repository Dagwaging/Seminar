attribute highp vec2 vertexPosition;

attribute highp vec2 uv;
varying highp vec2 texturePosition;

void main() {
  gl_Position = vec4(vertexPosition, 0.0, 1.0);
  texturePosition = uv;
}
