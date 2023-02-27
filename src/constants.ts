export enum EnumEngineType {
  Direction = 0,
  Power
}

// export enum EnumEnginePart {
//   Body = 0,
//   Flame
// }

export enum EnumEngineSize {
  Large = 1,
  Small = 0.5
}
export const CONSTANT_DEG: number = Math.PI / 180;

export interface IEngineInfo {
  id: number,
  type: EnumEngineType,
  size: EnumEngineSize,
  position: {
    lng: number,
    lat: number
  }
}

export const engineBaseInfo: IEngineInfo[] = [
  // // 转向发动机
  // { id: 1, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 0 } },
  // { id: 2, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 30 } },
  // { id: 3, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 60 } },
  // { id: 4, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 90 } },
  // { id: 5, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: -30 } },
  // { id: 6, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: -60 } },
  // { id: 7, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: -90 } },
  // { id: 8, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: 0 } },
  // { id: 9, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: 30 } },
  // { id: 10, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: 60 } },
  // { id: 11, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: 90 } },
  // { id: 12, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: -30 } },
  // { id: 13, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 180, lat: -60 } },
  // 转向发动机
  { id: 1, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 0 } },      // 90 0 -120
  { id: 1, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 15, lat: 0 } },      // 
  { id: 2, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 30, lat: 0 } },     // 90 30
  { id: 2, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 45, lat: 0 } },     // 
  { id: 3, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 60, lat: 0 } },    // 90 60
  { id: 3, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 75, lat: 0 } },    // 
  { id: 4, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 90, lat: 0 } },       // 90 90

  { id: 5, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -15, lat: 0 } },
  { id: 5, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -30, lat: 0 } },       // -90 150
  { id: 5, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -45, lat: 0 } },
  { id: 6, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -60, lat: 0 } },          // -90  120  
  { id: 6, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -75, lat: 0 } },
  { id: 7, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -90, lat: 0 } },        // -90 90

  { id: 8, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 0, lat: 180 } },      // -90 0 
  { id: 8, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 15, lat: 180 } },
  { id: 9, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 30, lat: 180 } },     // -90 30
  { id: 9, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 45, lat: 180 } },
  { id: 10, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 60, lat: 180 } }, // -90 60
  { id: 10, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: 75, lat: 180 } },

  { id: 11, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -15, lat: 180 } },
  { id: 11, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -30, lat: 180 } }, // 90 150
  { id: 11, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -45, lat: 180 } },
  { id: 12, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -60, lat: 180 } },   //90 120
  { id: 12, type: EnumEngineType.Direction, size: EnumEngineSize.Large, position: { lng: -75, lat: 180 } },
]