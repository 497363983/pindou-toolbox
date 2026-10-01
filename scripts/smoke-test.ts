// 冒烟测试：合成左红右蓝的图片，验证网格、映射与用料统计
import { getDefaultPalette } from '../src/core/palette';
import { convertToBeads } from '../src/core/quantize';

const W = 60;
const H = 60;
const data = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (x < W / 2) {
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
    } else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 255;
    }
    data[i + 3] = 255;
  }
}

const palette = getDefaultPalette();
const pattern = convertToBeads(
  { data, width: W, height: H },
  palette,
  { gridW: 10, gridH: 10, sampling: 'dominant' },
);

console.log('grid:', pattern.gridW + 'x' + pattern.gridH);
console.log('totalBeads:', pattern.totalBeads, '(expect 100)');
console.log('colorCount:', pattern.colorCount, '(expect 2)');
const used = [...pattern.counts.entries()].map(([idx, n]) => ({
  code: palette.beads[idx].code,
  hex: palette.beads[idx].hex,
  n,
}));
console.log('used:', JSON.stringify(used));

// 校验左半红、右半蓝
const topLeft = pattern.cells[0];
const topRight = pattern.cells[9];
console.log('topLeft bead:', palette.beads[topLeft].hex, '(expect red-ish)');
console.log('topRight bead:', palette.beads[topRight].hex, '(expect blue-ish)');

// 透明测试：全透明图
const empty = new Uint8Array(W * H * 4);
const p2 = convertToBeads(
  { data: empty, width: W, height: H },
  palette,
  { gridW: 5, gridH: 5 },
);
console.log('transparent totalBeads:', p2.totalBeads, '(expect 0)');
