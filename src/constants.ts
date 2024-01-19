export const RADIUS = 36
export const infoMap = new Map([
  [0, { num: 12, scale: .2 }],
  [15, { num: 36, scale: .1 }],
  [30, { num: 24, scale: .1 }],
  [45, { num: 16, scale: .1 }],
  [60, { num: 12, scale: .1 }],
  [75, { num: 8, scale: .1 }],
  [90, { num: 1, scale: .2 }]


  // [0, { num: 36, scale: .2 }],
  // [15, { num: 32, scale: .15 }],
  // [30, { num: 24, scale: .15 }],
  // [45, { num: 24, scale: .15 }],
  // [60, { num: 16, scale: .15 }],
  // [75, { num: 12, scale: .15 }],
  // [90, { num: 1, scale: .2 }]
])

export class Coordinate {
  public x: number;
  public y: number;
  public z: number;
  public scale: number;

  constructor(a: number, b: number, scale: number) {
    const radA = Math.PI * a / 180
    const radB = Math.PI * b / 180
    this.x = Number((RADIUS * Math.cos(radA) * Math.cos(radB)).toFixed(1));
    this.y = Number((RADIUS * Math.cos(radA) * Math.sin(radB)).toFixed(1));
    this.z = Number((RADIUS * Math.sin(radA)).toFixed(1));
    this.scale = scale
  }
}