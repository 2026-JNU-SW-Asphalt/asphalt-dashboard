declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level: number });
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    getLevel(): number;
    panTo(latlng: LatLng): void;
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ): void;
  }

  class Marker {
    constructor(options: { position: LatLng; map?: Map; image?: MarkerImage; title?: string; zIndex?: number });
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    setPosition(position: LatLng): void;
    setImage(image: MarkerImage): void;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: { offset?: Point });
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  namespace event {
    function addListener(target: Marker | Map, type: string, handler: () => void): void;
    function removeListener(target: Marker | Map, type: string, handler: () => void): void;
  }

  namespace services {
    const Status: {
      OK: string;
      ZERO_RESULT: string;
      ERROR: string;
    };

    interface RegionCode {
      region_type: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      region_4depth_name: string;
      code: string;
      x: number;
      y: number;
    }

    class Geocoder {
      coord2RegionCode(x: number, y: number, callback: (result: RegionCode[], status: string) => void): void;
      coord2Address(x: number, y: number, callback: (result: unknown[], status: string) => void): void;
    }
  }
}

interface Window {
  kakao: typeof kakao;
}
