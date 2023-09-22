export const getColorRamp = (elevationRamp) => {
  if (elevationRamp == null) {
    elevationRamp = { 0.0: "blue", 0.1: "cyan", 0.37: "lime", 0.54: "yellow", 1: "red"};
  }
  var ramp = document.createElement('canvas');
  ramp.width = 1;
  ramp.height = 100;
  var ctx = ramp.getContext('2d');
  var grd = ctx.createLinearGradient(0, 0, 0, 100);
  for (var key in elevationRamp) {
    grd.addColorStop(1 - Number(key), elevationRamp[key]);
  }
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1, 100);
  return ramp;
}