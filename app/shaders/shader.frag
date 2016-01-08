precision mediump float;

uniform sampler2D texture;
uniform highp vec2 textureSize;
uniform highp float factor;
uniform highp float filter[9];
uniform highp float zoom;
uniform highp vec2 offset;

#define FILTER_WIDTH 3
#define FILTER_HEIGHT 3

varying highp vec2 texturePosition;

void main() {
  vec2 pixel = vec2(1.0, 1.0) / textureSize * zoom;
  vec4 sum = vec4(0.0, 0.0, 0.0, 0.0);
  
  for(int i = 0; i < FILTER_WIDTH; i++) {
    for(int j = 0; j < FILTER_HEIGHT; j++) {
      sum += texture2D(texture, (texturePosition - vec2(0.5, 0.5) + pixel * vec2(i - FILTER_WIDTH / 2, j - FILTER_HEIGHT / 2)) / zoom - offset + vec2(0.5, 0.5)) * filter[j * FILTER_WIDTH + i];
    }
  }

  sum /= factor;

  gl_FragColor = vec4(sum.rgb, 1.0);
}
