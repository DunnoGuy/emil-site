
precision highp float;

// A custom uniform to control the color
uniform vec4 color;
// A custom uniform to control how abrupt the color changes
uniform int falloffLevel;

varying vec2 pos;

void main() {
    float dist = distance(vec2(0.5, 0.5), pos);
    dist = clamp(dist, 0., 1.);

    vec4 color = color;
    int falloffLevel = -falloffLevel;
    vec4 falloffVec4 = vec4(falloffLevel);
    vec4 resultColor = mix(color, falloffVec4, dist);

    gl_FragColor = resultColor;
}