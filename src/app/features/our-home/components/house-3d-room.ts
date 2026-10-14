import * as THREE from 'three';
import type { HouseRoomId } from '../models/our-home.model';

export interface House3DRoom {
  readonly group: THREE.Group;
  readonly anchors: ReadonlyMap<string, THREE.Vector3>;
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraTarget: readonly [number, number, number];
  readonly lamp?: THREE.PointLight;
}

type XYZ = readonly [number, number, number];
type Size3 = readonly [number, number, number];
type Paint = (context: CanvasRenderingContext2D, size: number) => void;

const palette = {
  plum: '#69404d', deepPlum: '#432c3b', rose: '#c9878a', paleRose: '#e8b9ae', peach: '#efc5ad',
  cream: '#f9ecd8', paper: '#fff6e7', wood: '#986951', lightWood: '#bf8d6d', darkWood: '#63463f',
  green: '#718a72', lightGreen: '#a4b883', deepGreen: '#4f6d5c', gold: '#dcb56f', blue: '#87aebb',
  night: '#303953', paleBlue: '#b7d9d9', terracotta: '#c57862', charcoal: '#403d47', white: '#fffaf0'
} as const;

class RoomBuilder {
  readonly group = new THREE.Group();
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly textures = new Map<string, THREE.CanvasTexture>();

  material(color: string, roughness = 0.82, emissive = '#000000', emissiveIntensity = 0): THREE.MeshStandardMaterial {
    const key = `${color}|${roughness}|${emissive}|${emissiveIntensity}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness, emissive, emissiveIntensity });
      this.materials.set(key, material);
    }
    return material;
  }

  textureMaterial(key: string, paint: Paint, roughness = 0.9): THREE.MeshStandardMaterial {
    let texture = this.textures.get(key);
    if (!texture) {
      const size = 384;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return this.material(palette.cream, roughness);
      paint(context, size);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(key, texture);
    }
    const materialKey = `texture:${key}|${roughness}`;
    let material = this.materials.get(materialKey);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, roughness });
      this.materials.set(materialKey, material);
    }
    return material;
  }

  box(parent: THREE.Object3D, name: string, position: XYZ, size: Size3, color: string, hotspotId?: string, roughness = 0.82): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.material(color, roughness));
    return this.place(parent, mesh, name, position, hotspotId);
  }

  texturedBox(parent: THREE.Object3D, name: string, position: XYZ, size: Size3, material: THREE.MeshStandardMaterial, hotspotId?: string): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    return this.place(parent, mesh, name, position, hotspotId);
  }

  sphere(parent: THREE.Object3D, name: string, position: XYZ, radius: number, color: string, scale: Size3 = [1, 1, 1], hotspotId?: string, roughness = 0.76): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), this.material(color, roughness));
    mesh.scale.set(...scale);
    return this.place(parent, mesh, name, position, hotspotId);
  }

  cylinder(parent: THREE.Object3D, name: string, position: XYZ, topRadius: number, bottomRadius: number, height: number, color: string, hotspotId?: string, radialSegments = 12): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments), this.material(color, 0.76));
    return this.place(parent, mesh, name, position, hotspotId);
  }

  plane(parent: THREE.Object3D, name: string, position: XYZ, width: number, height: number, material: THREE.MeshStandardMaterial, rotation: XYZ = [0, 0, 0], hotspotId?: string): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.rotation.x = rotation[0];
    mesh.rotation.y = rotation[1];
    mesh.rotation.z = rotation[2];
    return this.place(parent, mesh, name, position, hotspotId);
  }

  groupAt(parent: THREE.Object3D, name: string, position: XYZ, hotspotId?: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    if (hotspotId) group.userData['hotspotId'] = hotspotId;
    parent.add(group);
    return group;
  }

  private place<T extends THREE.Mesh>(parent: THREE.Object3D, mesh: T, name: string, position: XYZ, hotspotId?: string): T {
    mesh.name = name;
    mesh.position.set(...position);
    if (hotspotId) mesh.userData['hotspotId'] = hotspotId;
    parent.add(mesh);
    return mesh;
  }
}

function artPaint(kind: string, colors: readonly string[]): Paint {
  return (ctx, size) => {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);
    if (kind === 'night') {
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#283650'); gradient.addColorStop(1, '#65778c');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#f7dfae'; ctx.beginPath(); ctx.arc(size * .72, size * .25, size * .09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#283650'; ctx.beginPath(); ctx.arc(size * .76, size * .22, size * .085, 0, Math.PI * 2); ctx.fill();
      for (const [x, y, r] of [[.18,.2,3],[.38,.12,2],[.54,.32,2],[.87,.44,3],[.27,.42,2]] as const) {
        ctx.fillStyle = '#fff0c8'; ctx.beginPath(); ctx.arc(x * size, y * size, r, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    if (kind === 'landscape' || kind === 'balcony') {
      ctx.fillStyle = colors[1]; ctx.fillRect(0, size * .55, size, size * .45);
      ctx.fillStyle = colors[2]; ctx.beginPath(); ctx.moveTo(0, size * .68); ctx.lineTo(size * .28, size * .35); ctx.lineTo(size * .54, size * .68); ctx.fill();
      ctx.fillStyle = colors[3] ?? '#7f9c82'; ctx.beginPath(); ctx.moveTo(size * .34, size * .7); ctx.lineTo(size * .68, size * .28); ctx.lineTo(size, size * .7); ctx.fill();
      ctx.fillStyle = '#f5d7a0'; ctx.beginPath(); ctx.arc(size * .76, size * .22, size * .09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3d8'; ctx.fillRect(0, size * .82, size, size * .06);
      return;
    }
    ctx.fillStyle = colors[1];
    ctx.beginPath(); ctx.ellipse(size * .5, size * .58, size * .18, size * .24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors[2]; ctx.lineWidth = size * .035; ctx.beginPath(); ctx.moveTo(size * .5, size * .83); ctx.lineTo(size * .5, size * .68); ctx.stroke();
    for (const [x, y] of [[.34,.39],[.63,.42],[.42,.54],[.59,.59],[.5,.31]] as const) {
      ctx.fillStyle = colors[3] ?? '#f4d7b7'; ctx.beginPath(); ctx.arc(x * size, y * size, size * .07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(size * .12, size * .12); ctx.lineTo(size * .88, size * .12); ctx.stroke();
  };
}

function rugPaint(colors: readonly string[], pattern: 'floral' | 'stripe' | 'diamond' = 'floral'): Paint {
  return (ctx, size) => {
    ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = colors[1]; ctx.lineWidth = 12; ctx.strokeRect(18, 18, size - 36, size - 36);
    ctx.strokeStyle = colors[2]; ctx.lineWidth = 3; ctx.strokeRect(34, 34, size - 68, size - 68);
    if (pattern === 'stripe') {
      for (let x = 54; x < size; x += 54) { ctx.fillStyle = x % 108 ? colors[1] : colors[2]; ctx.globalAlpha = .55; ctx.fillRect(x, 55, 18, size - 110); }
    } else if (pattern === 'diamond') {
      ctx.strokeStyle = colors[2]; ctx.lineWidth = 3;
      for (let x = 70; x < size - 50; x += 58) for (let y = 70; y < size - 50; y += 58) {
        ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 16, y); ctx.lineTo(x, y + 16); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.stroke();
      }
    } else {
      for (let x = 70; x < size - 50; x += 75) for (let y = 70; y < size - 50; y += 75) {
        ctx.fillStyle = colors[2]; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors[1]; for (let angle = 0; angle < 6; angle += 1) {
          const a = angle * Math.PI / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  };
}

function addShell(b: RoomBuilder, floor = '#d9b7a1'): void {
  b.box(b.group, 'deep plum display base', [0, -.36, 0], [6.64, .32, 5.2], palette.deepPlum);
  b.box(b.group, 'thin brass base inlay', [0, -.17, 0], [6.58, .055, 5.14], palette.gold, undefined, .5);
  b.box(b.group, 'painted room floor', [0, -.055, 0], [6.42, .2, 4.98], floor);
  for (let z = -1.95; z <= 1.8; z += .53) b.box(b.group, `floorboard seam ${z.toFixed(1)}`, [0, .052, z], [6.15, .008, .018], '#a87867');
  b.box(b.group, 'back plaster wall', [0, 1.72, -2.4], [6.24, 3.48, .18], '#f0d3bf');
  b.box(b.group, 'left painted wall', [-3.12, 1.28, -.03], [.18, 2.62, 4.7], '#dfb8a9');
  b.box(b.group, 'right painted wall', [3.12, 1.28, -.03], [.18, 2.62, 4.7], '#e5c3b0');
  b.box(b.group, 'back wall wooden cap', [0, 3.5, -2.36], [6.32, .13, .26], palette.wood);
  b.box(b.group, 'left wall wooden cap', [-3.12, 2.62, -.02], [.25, .13, 4.78], palette.wood);
  b.box(b.group, 'right wall wooden cap', [3.12, 2.62, -.02], [.25, .13, 4.78], palette.wood);
  for (const x of [-2.63, 2.63]) {
    b.box(b.group, `front cutaway wall ${x}`, [x, .43, 2.37], [.92, .86, .18], '#e5bbae');
    b.box(b.group, `front wall cap ${x}`, [x, .89, 2.37], [1.0, .1, .24], palette.wood);
  }
}

function addRug(b: RoomBuilder, name: string, x: number, z: number, width: number, depth: number, colors: readonly string[], pattern: 'floral' | 'stripe' | 'diamond' = 'floral'): void {
  const mat = b.textureMaterial(`rug-${colors.join('-')}-${pattern}`, rugPaint(colors, pattern));
  b.plane(b.group, `${name} woven patterned rug`, [x, .062, z], width, depth, mat, [-Math.PI / 2, 0, 0]);
  b.box(b.group, `${name} rug fringe front`, [x, .064, z + depth / 2 - .035], [width * .86, .014, .13], colors[2]);
  b.box(b.group, `${name} rug fringe back`, [x, .064, z - depth / 2 + .035], [width * .86, .014, .13], colors[2]);
}

function addArt(b: RoomBuilder, x: number, y: number, z: number, width: number, height: number, id: string, kind: string, colors: readonly string[], hotspotId?: string): void {
  const frame = b.groupAt(b.group, `${id} complete picture frame`, [x, y, z], hotspotId);
  b.box(frame, `${id} gilt frame`, [0, 0, 0], [width, height, .11], palette.gold, hotspotId, .55);
  b.box(frame, `${id} warm cream mount`, [0, 0, .067], [width - .16, height - .16, .035], palette.paper, hotspotId);
  const art = b.textureMaterial(`art-${kind}-${colors.join('-')}`, artPaint(kind, colors));
  b.plane(frame, `${id} hand-painted art`, [0, 0, .09], width - .25, height - .25, art, [0, 0, 0], hotspotId);
}

function addWindow(b: RoomBuilder, x: number, y: number, z: number, width: number, height: number, id?: string, night = false): void {
  const hot = id;
  const glassMat = b.textureMaterial(night ? 'night-window' : 'day-window', (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, night ? '#27334e' : '#80b8c4'); gradient.addColorStop(1, night ? '#737991' : '#d7e5d1');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    if (night) {
      ctx.fillStyle = '#fae4bd'; ctx.beginPath(); ctx.arc(size * .68, size * .27, size * .085, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#27334e'; ctx.beginPath(); ctx.arc(size * .73, size * .24, size * .08, 0, Math.PI * 2); ctx.fill();
      for (const [sx, sy] of [[.2,.2],[.48,.14],[.83,.42],[.28,.54],[.8,.68]] as const) { ctx.fillStyle = '#fff1cf'; ctx.fillRect(size * sx, size * sy, 5, 5); }
    } else {
      ctx.fillStyle = '#d8e8cb'; ctx.fillRect(0, size * .66, size, size * .34);
      ctx.fillStyle = '#82a982'; for (const [tx, th] of [[.17,.27],[.32,.39],[.76,.31],[.9,.22]] as const) ctx.fillRect(size * tx, size * (.66 - th), size * .12, size * th);
      ctx.fillStyle = '#fae1a8'; ctx.beginPath(); ctx.arc(size * .75, size * .24, size * .09, 0, Math.PI * 2); ctx.fill();
    }
  }, .5);
  const depth = .22;
  b.box(b.group, `${id ?? 'window'} deep timber surround`, [x, y, z], [width + .28, height + .28, depth], palette.darkWood, hot);
  b.box(b.group, `${id ?? 'window'} linen inner reveal`, [x, y, z + .12], [width + .07, height + .07, .045], palette.cream, hot);
  b.plane(b.group, `${id ?? 'window'} glass with view`, [x, y, z + .15], width, height, glassMat, [0, 0, 0], hot);
  b.box(b.group, `${id ?? 'window'} center mullion`, [x, y, z + .17], [.055, height, .04], palette.paper, hot);
  b.box(b.group, `${id ?? 'window'} cross rail`, [x, y, z + .17], [width, .055, .04], palette.paper, hot);
  b.box(b.group, `${id ?? 'window'} broad sill`, [x, y - height / 2 - .13, z + .22], [width + .46, .12, .37], palette.lightWood, hot);
}

function addCurtains(b: RoomBuilder, x: number, y: number, z: number, width: number, height: number): void {
  b.cylinder(b.group, 'brass curtain rod', [x, y + height / 2 + .14, z + .2], .035, .035, width + .56, palette.gold, undefined, 10).rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const panelX = x + side * width * .39;
    b.box(b.group, `rose curtain pleats ${side}`, [panelX, y, z + .19], [width * .24, height + .22, .13], side < 0 ? '#ad7480' : '#bc7c85');
    for (let fold = -2; fold <= 2; fold += 1) b.box(b.group, `curtain fold ${side} ${fold}`, [panelX + fold * .055, y, z + .27], [.025, height + .16, .018], '#d79b99');
    b.box(b.group, `curtain tie ${side}`, [panelX, y - .04, z + .3], [width * .25, .08, .16], palette.gold);
  }
}

function addPlant(b: RoomBuilder, x: number, z: number, kind: 'broad' | 'flowers' | 'tall' = 'broad', hotspotId?: string): void {
  const plant = b.groupAt(b.group, `${kind} potted plant`, [x, 0, z], hotspotId);
  b.cylinder(plant, 'tapered terracotta planter', [0, .29, 0], .28, .19, .46, palette.terracotta, hotspotId, 10);
  b.cylinder(plant, 'pot lip', [0, .51, 0], .3, .3, .08, '#d48d70', hotspotId, 12);
  b.cylinder(plant, 'dark potting soil', [0, .56, 0], .23, .23, .035, '#51403a', hotspotId, 10);
  if (kind === 'flowers') {
    for (let i = 0; i < 3; i += 1) {
      const a = i * Math.PI * .72, fx = Math.cos(a) * .2, fz = Math.sin(a) * .2, fy = 1.02 + (i % 2) * .12;
      b.cylinder(plant, `flower green stem ${i}`, [fx * .6, .79, fz * .6], .014, .014, .52, palette.deepGreen, hotspotId, 6);
      b.sphere(plant, `flower head ${i}`, [fx, fy, fz], .12, i % 2 ? '#e7a99e' : '#f1d79a', [.95, .72, .8], hotspotId);
      b.sphere(plant, `flower center ${i}`, [fx, fy + .01, fz], .043, palette.gold, [.9, .65, .9], hotspotId);
    }
  } else {
    const tall = kind === 'tall';
    const height = tall ? 2.05 : 1.12;
    b.cylinder(plant, 'woody plant stem', [0, .58 + height * .42, 0], .035, .045, height * .84, palette.darkWood, hotspotId, 7);
    const count = tall ? 17 : 9;
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399, level = .68 + (i % (tall ? 6 : 4)) * (tall ? .27 : .2);
      const spread = (tall ? .38 : .28) * (1 - Math.max(0, level - 1.2) * .2);
      const leaf = b.sphere(plant, `pointed foliage ${i}`, [Math.cos(angle) * spread, level, Math.sin(angle) * spread], tall ? .27 : .23, i % 3 ? palette.green : palette.lightGreen, [.62, 1.5, .45], hotspotId);
      leaf.rotation.z = Math.cos(angle) * .42;
      leaf.rotation.x = Math.sin(angle) * .4;
    }
  }
}

function addBooks(b: RoomBuilder, x: number, y: number, z: number, count = 4, horizontal = false): void {
  const colors = ['#a85f68', '#557d79', '#d1a568', '#72647f', '#dfb3a5'];
  for (let i = 0; i < count; i += 1) {
    const color = colors[i % colors.length];
    if (horizontal) {
      b.box(b.group, `stacked book cover ${i}`, [x, y + i * .09, z], [.55, .075, .36], color, undefined, .9);
      b.box(b.group, `stacked book pages ${i}`, [x, y + .045 + i * .09, z + .01], [.49, .02, .31], palette.paper);
    } else {
      const h = .42 + (i % 3) * .08;
      b.box(b.group, `upright book spine ${i}`, [x + i * .15, y + h / 2, z], [.13, h, .32], color, undefined, .9);
      b.box(b.group, `book title inset ${i}`, [x + i * .15, y + h * .63, z + .165], [.085, .1, .012], palette.gold, undefined, .55);
    }
  }
}

function addShelf(b: RoomBuilder, x: number, y: number, z: number, width: number, levels: number): void {
  b.box(b.group, 'floating shelf plank', [x, y, z], [width, .12, .42], palette.wood);
  b.box(b.group, 'floating shelf underside trim', [x, y - .07, z + .02], [width, .045, .44], palette.darkWood);
  addBooks(b, x - width * .34, y + .07, z - .03, 4);
  addPlant(b, x + width * .33, z, 'flowers');
  if (levels > 1) addShelf(b, x, y + .77, z, width, levels - 1);
}

function addLamp(b: RoomBuilder, x: number, z: number, hotspotId: string, on: boolean, kind: 'table' | 'floor' = 'table'): THREE.PointLight {
  if (kind === 'floor') {
    b.cylinder(b.group, `${hotspotId} heavy lamp foot`, [x, .17, z], .33, .35, .12, palette.darkWood, hotspotId);
    b.cylinder(b.group, `${hotspotId} tall brass stem`, [x, 1.04, z], .035, .035, 1.72, palette.gold, hotspotId, 8);
    b.cylinder(b.group, `${hotspotId} broad linen shade`, [x, 1.92, z], .25, .48, .48, palette.cream, hotspotId, 12);
  } else {
    b.cylinder(b.group, `${hotspotId} lamp base`, [x, 1.22, z], .2, .25, .12, palette.gold, hotspotId);
    b.cylinder(b.group, `${hotspotId} lamp stem`, [x, 1.48, z], .035, .04, .45, palette.darkWood, hotspotId, 8);
    b.cylinder(b.group, `${hotspotId} pleated linen shade`, [x, 1.79, z], .24, .4, .42, palette.cream, hotspotId, 12);
  }
  const point = new THREE.PointLight('#ffd596', on ? 1.4 : .08, 5.5, 2);
  point.name = hotspotId;
  point.position.set(x, kind === 'floor' ? 1.72 : 1.68, z);
  b.group.add(point);
  return point;
}

function addTable(b: RoomBuilder, x: number, z: number, width: number, depth: number, y = .78, color: string = palette.lightWood, round = false): void {
  if (round) {
    b.cylinder(b.group, 'round table pedestal', [x, y / 2, z], .11, .16, y - .12, palette.darkWood, undefined, 12);
    b.cylinder(b.group, 'round table foot', [x, .09, z], .43, .43, .1, palette.darkWood, undefined, 16);
    b.cylinder(b.group, 'round polished tabletop', [x, y, z], width / 2, width / 2, .13, color, undefined, 20);
  } else {
    b.box(b.group, 'table top', [x, y, z], [width, .14, depth], color);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) b.box(b.group, 'turned table leg', [x + dx * (width / 2 - .16), y / 2, z + dz * (depth / 2 - .14)], [.12, y, .12], palette.darkWood);
    b.box(b.group, 'table apron', [x, y - .13, z], [width * .82, .19, depth * .82], palette.wood);
  }
}

function addChair(b: RoomBuilder, x: number, z: number, upholstery: string, hotspotId?: string, wicker = false): void {
  const backZ = z - .37;
  b.box(b.group, 'chair seat frame', [x, .68, z], [.82, .2, .82], palette.darkWood, hotspotId);
  b.box(b.group, 'upholstered chair cushion', [x, .81, z + .02], [.74, .16, .72], upholstery, hotspotId);
  b.box(b.group, 'chair back cushion', [x, 1.31, backZ], [.78, 1.04, .19], wicker ? '#a87954' : upholstery, hotspotId);
  if (wicker) for (let i = -3; i <= 3; i += 1) b.box(b.group, `woven back strand ${i}`, [x + i * .1, 1.31, backZ + .11], [.025, .95, .025], '#d0a77d', hotspotId);
  for (const dx of [-.34, .34]) {
    b.box(b.group, 'chair wooden front leg', [x + dx, .36, z + .32], [.09, .66, .09], palette.darkWood, hotspotId);
    b.box(b.group, 'chair wooden back post', [x + dx, .91, backZ], [.09, 1.55, .1], palette.darkWood, hotspotId);
    b.box(b.group, 'chair curved arm', [x + dx * 1.13, 1.02, z], [.13, .12, .62], palette.lightWood, hotspotId);
  }
  if (!wicker) b.box(b.group, 'chair decorative lumbar pillow', [x, 1.24, z - .24], [.46, .36, .13], palette.paleRose, hotspotId);
}

function addPillow(b: RoomBuilder, x: number, y: number, z: number, color: string, hotspotId?: string, heart = false): void {
  b.box(b.group, heart ? 'heart-shaped accent cushion' : 'soft stitched pillow', [x, y, z], [.74, .23, .56], color, hotspotId);
  b.box(b.group, 'pillow seam top', [x, y + .122, z], [.56, .012, .016], '#f3e2d3', hotspotId);
  if (heart) {
    b.sphere(b.group, 'pillow heart upper left', [x - .1, y + .18, z + .05], .13, palette.rose, [1.2, .75, .4], hotspotId);
    b.sphere(b.group, 'pillow heart upper right', [x + .1, y + .18, z + .05], .13, palette.rose, [1.2, .75, .4], hotspotId);
    b.box(b.group, 'pillow heart point', [x, y + .12, z + .05], [.2, .2, .1], palette.rose, hotspotId).rotation.z = Math.PI / 4;
  }
}

function addClockOnTable(b: RoomBuilder, x: number, z: number, radius: number, id: string, color: string): void {
  const clock = b.groupAt(b.group, `${id} analog tabletop clock`, [x, .91, z], 'two-clocks');
  b.cylinder(clock, `${id} dark clock back`, [0, 0, 0], radius, radius, .1, palette.darkWood, 'two-clocks', 20);
  b.cylinder(clock, `${id} ivory clock dial`, [0, .056, 0], radius * .84, radius * .84, .025, palette.paper, 'two-clocks', 20);
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = mark * Math.PI / 6;
    b.box(clock, `${id} clock numeral mark ${mark}`, [Math.sin(angle) * radius * .65, .076, Math.cos(angle) * radius * .65], [.025, .012, mark % 3 === 0 ? .09 : .045], color, 'two-clocks');
  }
  b.box(clock, `${id} minute hand`, [0, .09, -.075], [.025, .016, radius * .55], palette.plum, 'two-clocks').rotation.y = -.2;
  b.box(clock, `${id} hour hand`, [.08, .095, .03], [radius * .4, .018, .035], palette.rose, 'two-clocks').rotation.y = .65;
  b.sphere(clock, `${id} clock pin`, [0, .106, 0], .045, palette.gold, [.8, .4, .8], 'two-clocks');
}

function addEntrance(b: RoomBuilder, anchors: Map<string, THREE.Vector3>): void {
  b.box(b.group, 'garden island foundation', [0, -.23, 0], [6.72, .42, 5.28], '#66594f');
  b.box(b.group, 'soft moss lawn', [0, -.005, .5], [6.5, .12, 4.85], '#80916f');
  b.box(b.group, 'cottage warm plaster facade', [0, 1.53, -1.49], [4.52, 3.08, .28], '#e9c6a7');
  b.box(b.group, 'left timber corner beam', [-2.19, 1.58, -1.3], [.18, 3.18, .32], palette.darkWood);
  b.box(b.group, 'right timber corner beam', [2.19, 1.58, -1.3], [.18, 3.18, .32], palette.darkWood);
  b.box(b.group, 'front porch deck', [0, .12, -.1], [4.75, .2, 1.15], palette.lightWood);
  b.box(b.group, 'porch step one', [0, -.005, .59], [2.25, .16, .38], palette.darkWood);
  b.box(b.group, 'porch step two', [0, -.065, .88], [2.05, .11, .33], palette.lightWood);

  // Two sloping roof planes, with individually raised clay tiles to preserve the cottage silhouette.
  const tiledRoof = b.textureMaterial('hand laid terracotta roof tiles', (ctx, size) => {
    ctx.fillStyle = '#783c3b'; ctx.fillRect(0, 0, size, size);
    const tileW = 48, tileH = 38;
    for (let row = 0; row < 12; row += 1) {
      const offset = row % 2 ? -tileW / 2 : 0;
      for (let col = -1; col < 9; col += 1) {
        const x = col * tileW + offset, y = row * tileH;
        ctx.fillStyle = (row + col) % 3 ? '#ad554b' : '#c36955';
        ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 5);
        ctx.strokeStyle = '#df8064'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + tileW - 5, y + 4); ctx.stroke();
        ctx.strokeStyle = '#82423e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + tileW - 3, y + 4); ctx.lineTo(x + tileW - 3, y + tileH - 4); ctx.stroke();
      }
    }
  }, .92);
  const roofLeft = b.texturedBox(b.group, 'left tiled red clay pitched roof', [-1.16, 3.49, -1.42], [2.76, .18, 3.35], tiledRoof);
  roofLeft.rotation.z = .47;
  const roofRight = b.texturedBox(b.group, 'right tiled red clay pitched roof', [1.16, 3.49, -1.42], [2.76, .18, 3.35], tiledRoof);
  roofRight.rotation.z = -.47;
  for (let row = 0; row < 6; row += 1) {
    const x = -2.08 + row * .36;
    const side = x < 0 ? -1 : 1;
    const y = 4.24 - Math.abs(x) * .47;
    for (let col = 0; col < 7; col += 1) {
      const z = -2.76 + col * .46;
      const tile = b.box(b.group, `hand-set roof tile ${row}-${col}`, [x, y, z], [.39, .11, .49], (row + col) % 3 ? '#b95e52' : '#c36d59');
      tile.rotation.z = side < 0 ? .47 : -.47;
    }
  }
  b.box(b.group, 'dark timber front roof gable', [0, 3.25, -1.68], [3.6, .14, .22], palette.darkWood);
  b.box(b.group, 'roof ridge finial', [0, 4.15, -1.43], [.24, .22, 3.7], '#7b403e');
  b.box(b.group, 'chimney masonry', [-1.42, 4.02, -2.18], [.55, 1.12, .58], '#a85b4c');
  b.box(b.group, 'chimney cap', [-1.42, 4.59, -2.18], [.72, .14, .72], '#713e3d');

  // Timber front door, carved panels, brass handle, and welcome plaque.
  b.box(b.group, 'door stone surround', [0, 1.44, -1.29], [1.35, 2.72, .22], '#f9e7ce', 'door');
  b.box(b.group, 'solid stained oak front door', [0, 1.43, -1.13], [1.12, 2.53, .13], '#704944', 'door');
  b.box(b.group, 'upper carved door panel', [0, 2.02, -1.04], [.78, .93, .055], '#94614e', 'door');
  b.box(b.group, 'lower carved door panel', [0, .88, -1.04], [.78, .74, .055], '#875746', 'door');
  b.sphere(b.group, 'polished brass door knob', [.39, 1.36, -.97], .09, palette.gold, [1, 1, .7], 'door');
  b.box(b.group, 'doorstep woven mat', [0, .235, .47], [1.35, .045, .52], '#a96168');
  b.box(b.group, 'woven mat border', [0, .264, .47], [1.21, .018, .39], palette.gold);

  for (const x of [-1.44, 1.44]) {
    b.box(b.group, `window recessed casing ${x}`, [x, 2.03, -1.28], [1.02, 1.35, .22], palette.darkWood);
    b.box(b.group, `window warm glass ${x}`, [x, 2.03, -1.13], [.81, 1.13, .045], '#9fc7c5');
    b.box(b.group, `window center bar ${x}`, [x, 2.03, -1.09], [.06, 1.1, .035], palette.paper);
    b.box(b.group, `window cross bar ${x}`, [x, 2.03, -1.09], [.82, .06, .035], palette.paper);
    b.box(b.group, `window sill ${x}`, [x, 1.34, -1.04], [1.2, .12, .38], palette.lightWood);
    addCurtains(b, x, 2.03, -1.19, .8, 1.07);
    b.box(b.group, `window flower trough ${x}`, [x, 1.35, -.96], [.94, .19, .34], palette.terracotta);
    for (let flower = 0; flower < 3; flower += 1) addFlowerCluster(b, [x - .28 + flower * .28, 1.4, -.8], flower);
  }
  b.box(b.group, 'house plaque carved wood', [0, 2.87, -1.16], [1.08, .36, .13], palette.darkWood, 'nameplate');
  b.box(b.group, 'house plaque brass face', [0, 2.87, -1.08], [.92, .24, .035], palette.gold, 'nameplate');
  const plaqueText = b.textureMaterial('house-plaque-lettering', (ctx, size) => {
    ctx.fillStyle = '#d7b87c'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#56383d'; ctx.font = 'bold 120px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('H  ♡  Q', size / 2, size / 2 + 4);
  }, .7);
  b.plane(b.group, 'H heart Q painted house name', [0, 2.87, -1.04], .78, .2, plaqueText, [0, 0, 0], 'nameplate');

  // Lanterns, post box, stepping stones, flowers, climbing ivy, and low garden fencing.
  for (const x of [-2.02, 2.02]) {
    b.box(b.group, `black iron lantern bracket ${x}`, [x, 2.42, -1.02], [.12, .35, .24], '#413a3a');
    b.box(b.group, `glowing porch lantern glass ${x}`, [x, 2.24, -.93], [.27, .32, .2], '#f7d897', undefined, .5);
    b.box(b.group, `lantern cap ${x}`, [x, 2.43, -.93], [.35, .08, .25], palette.darkWood);
    const lamp = new THREE.PointLight('#ffd38f', .34, 2.8, 2); lamp.position.set(x, 2.21, -.84); b.group.add(lamp);
  }
  b.box(b.group, 'mailbox wooden post', [2.45, .48, -.3], [.12, .9, .12], palette.darkWood, 'mailbox');
  b.box(b.group, 'letterbox red body', [2.45, 1.02, -.3], [.7, .52, .48], '#a7505c', 'mailbox');
  b.box(b.group, 'letterbox rounded lid', [2.45, 1.31, -.3], [.78, .1, .56], palette.gold, 'mailbox');
  b.box(b.group, 'letterbox mail slot', [2.45, 1.06, -.03], [.34, .045, .025], palette.deepPlum, 'mailbox');
  b.box(b.group, 'postbox flag', [2.83, 1.18, -.26], [.12, .36, .045], '#e4c57d', 'mailbox');
  for (let i = 0; i < 5; i += 1) {
    const z = .6 + i * .47;
    b.box(b.group, `garden path stepping stone ${i}`, [.1 + Math.sin(i * .9) * .12, .075, z], [.63, .08, .39], i % 2 ? '#cbbba2' : '#dbceb8');
  }
  for (const side of [-1, 1]) {
    const x = side * 2.47;
    b.box(b.group, `low garden fence rail ${side}`, [x, .45, .9], [.12, .12, 2.25], '#9b7158');
    for (let i = 0; i < 6; i += 1) b.box(b.group, `white picket ${side}-${i}`, [x, .31, -.04 + i * .38], [.1, .64, .09], '#ead8ba');
    addPlant(b, side * 2.7, 1.42, 'tall');
    b.box(b.group, `long flower bed ${side}`, [side * 1.9, .16, 1.15], [.58, .25, 2.48], '#77594d');
    for (let i = 0; i < 3; i += 1) addFlowerCluster(b, [side * (1.9 + (i % 2) * .2), .29, .4 + i * .69], i + (side + 1) * 3);
  }
  for (let i = 0; i < 6; i += 1) {
    const vine = b.sphere(b.group, `climbing ivy leaf ${i}`, [-2.22 + (i % 2) * .24, .98 + i * .38, -1.04], .18, i % 2 ? palette.green : palette.lightGreen, [.6, 1.2, .35]);
    vine.rotation.z = -.45;
  }
  anchors.set('door', new THREE.Vector3(0, 1.38, -.82));
  anchors.set('nameplate', new THREE.Vector3(0, 2.87, -.9));
  anchors.set('mailbox', new THREE.Vector3(2.45, 1.08, .03));
}

function addFlowerCluster(b: RoomBuilder, base: XYZ, seed: number): void {
  const [x, y, z] = base;
  const colors = ['#e5a09d', '#f3d58d', '#f3c1ad', '#e9debb'];
  for (let i = 0; i < 3; i += 1) {
    const dx = (i - 1) * .12, dz = i === 1 ? .04 : -.05;
    const height = .42 + ((seed + i) % 2) * .1;
    b.cylinder(b.group, `flower stem ${seed}-${i}`, [x + dx, y + height / 2, z + dz], .012, .012, height, palette.deepGreen, undefined, 6);
    b.sphere(b.group, `flower leaf ${seed}-${i}`, [x + dx + .065, y + .25, z + dz], .09, palette.lightGreen, [.65, .45, 1.1]);
    b.sphere(b.group, `garden bloom ${seed}-${i}`, [x + dx, y + height + .08, z + dz], .105, colors[(seed + i) % colors.length], [.9, .78, .9]);
    b.sphere(b.group, `garden flower center ${seed}-${i}`, [x + dx, y + height + .085, z + dz], .031, palette.gold, [.9, .8, .9]);
  }
}

function addSofa(b: RoomBuilder, x: number, z: number): void {
  b.box(b.group, 'sofa dark wooden underframe', [x, .37, z], [2.72, .37, .98], palette.darkWood, 'sofa');
  b.box(b.group, 'plum upholstered sofa base', [x, .64, z], [2.65, .46, .98], '#8c5968', 'sofa');
  b.box(b.group, 'overstuffed sofa back', [x, 1.15, z - .43], [2.68, 1.05, .3], '#925d6b', 'sofa');
  for (const side of [-1, 1]) b.box(b.group, `rolled sofa arm ${side}`, [x + side * 1.24, .89, z], [.3, .82, 1.03], '#a56c76', 'sofa');
  for (let i = 0; i < 3; i += 1) {
    b.box(b.group, `separate sofa seat cushion ${i}`, [x - .83 + i * .83, .91, z + .02], [.78, .17, .7], i % 2 ? '#e4b6a4' : '#d29a97', 'sofa');
    addPillow(b, x - .88 + i * .82, 1.39, z - .18, i === 1 ? '#ecd6bb' : '#c98c91', 'sofa', i === 1);
  }
  b.box(b.group, 'draped knitted sofa throw', [x + .87, 1.14, z + .08], [.58, .55, .42], '#dcc08e', 'sofa');
  for (let i = 0; i < 5; i += 1) b.box(b.group, `sofa throw knit line ${i}`, [x + .65 + i * .1, 1.14, z + .3], [.018, .5, .02], '#f2ddb3', 'sofa');
}

function addLiving(b: RoomBuilder, anchors: Map<string, THREE.Vector3>): void {
  addShell(b, '#d5b69c');
  addRug(b, 'living room', .1, .72, 3.9, 2.45, ['#b57473', '#e8c5a5', '#f3dfbd']);
  addArt(b, -2.25, 2.55, -2.26, .72, .96, 'pressed flower picture', 'botanical', ['#d7c9a9', '#536d5e', '#d08876', '#e5c382'], 'photo-wall');
  addArt(b, -1.26, 2.55, -2.26, .72, .96, 'sunset hills picture', 'landscape', ['#edd5b7', '#d99977', '#647987', '#879b79'], 'photo-wall');
  addArt(b, -.27, 2.55, -2.26, .72, .96, 'pale rose flower picture', 'botanical', ['#e3d2c5', '#607f6a', '#c87e87', '#e8b86b'], 'photo-wall');
  addSofa(b, -.52, -.83);
  addTable(b, .28, .77, 1.72, 1.06, .66, palette.lightWood);
  b.box(b.group, 'tea tray on coffee table', [.28, .75, .75], [.72, .045, .48], '#d5b78f');
  b.cylinder(b.group, 'porcelain teacup', [.07, .85, .72], .13, .15, .2, palette.paper, undefined, 14);
  b.cylinder(b.group, 'tea inside cup', [.07, .96, .72], .105, .105, .012, '#8a5b4a', undefined, 14);
  b.cylinder(b.group, 'turntable console base', [2.15, .65, -.9], .44, .48, 1.1, palette.wood, undefined, 8).scale.set(1.45, 1, .72);
  for (let y of [.4, .85]) b.box(b.group, `console shelf at ${y}`, [2.15, y, -.55], [1.2, .075, .56], palette.darkWood);
  b.box(b.group, 'record player wood plinth', [2.15, 1.3, -.95], [1.38, .18, .94], palette.plum, 'record-player');
  b.cylinder(b.group, 'black vinyl record', [2.02, 1.405, -.96], .38, .38, .025, '#242632', 'record-player', 24);
  b.cylinder(b.group, 'vinyl center label', [2.02, 1.423, -.96], .11, .11, .018, '#d59b85', 'record-player', 18);
  b.box(b.group, 'turntable tonearm', [2.37, 1.45, -.8], [.48, .035, .035], palette.gold, 'record-player').rotation.y = -.64;
  b.sphere(b.group, 'turntable stylus', [2.2, 1.46, -.93], .055, palette.cream, [.8, .5, .8], 'record-player');
  addBooks(b, 1.7, .34, -.52, 4);
  addPlant(b, 2.65, -1.28, 'flowers');
  addChair(b, 2.12, .68, '#778f83', undefined, false);
  addPillow(b, 2.12, 1.52, .33, '#e6c19f');
  addLamp(b, -2.48, -.65, 'living-floor-lamp', true, 'floor');
  b.box(b.group, 'console with framed snapshot', [-2.54, .65, .08], [.65, .92, .54], palette.wood);
  addArt(b, -2.54, 1.28, -.17, .42, .48, 'small portrait on console', 'botanical', ['#f2ddc5', '#829984', '#d18380', '#e3bf72']);
  addPlant(b, -2.53, .83, 'broad');
  addShelf(b, 2.72, 1.52, -1.98, .78, 3);
  anchors.set('photo-wall', new THREE.Vector3(-1.25, 2.55, -2.1));
  anchors.set('sofa', new THREE.Vector3(-.52, 1.34, -.2));
  anchors.set('record-player', new THREE.Vector3(2.05, 1.48, -.36));
}

function addKitchen(b: RoomBuilder, anchors: Map<string, THREE.Vector3>): void {
  addShell(b, '#d7c29d');
  // Long rear run and a shorter return make a proper L-shaped kitchen.
  b.box(b.group, 'rear oak lower cabinets', [.05, .68, -1.78], [4.82, .92, .86], '#c58f6e');
  b.box(b.group, 'rear stone countertop', [.05, 1.2, -1.64], [4.95, .14, 1.02], '#f1e1c9');
  b.box(b.group, 'left return lower cabinets', [-2.56, .68, -.77], [.83, .92, 1.95], '#b97d65');
  b.box(b.group, 'left return countertop', [-2.51, 1.2, -.77], [1.03, .14, 2.03], '#f1e1c9');
  for (const x of [-1.94, -1.02, -.1, .82, 1.74]) {
    b.box(b.group, `lower cabinet door ${x}`, [x, .67, -1.31], [.83, .71, .055], x % 2 ? '#e1ba94' : '#d5a985');
    b.box(b.group, `cabinet inset panel ${x}`, [x, .67, -1.27], [.67, .54, .025], '#edcba9');
    b.sphere(b.group, `brass cabinet knob ${x}`, [x + .27, .68, -1.22], .044, palette.gold, [.7, .7, .65]);
  }
  for (const z of [-1.22, -.54, .14]) b.box(b.group, `return cabinet front ${z}`, [-2.08, .68, z], [.055, .72, .62], '#d2a680');
  addWindow(b, -1.6, 2.28, -2.27, 1.32, 1.28, undefined, false);
  addCurtains(b, -1.6, 2.28, -2.36, 1.32, 1.25);
  addPlant(b, -2.05, -1.47, 'flowers');
  // Deep enamel sink with visible basin and curved swan-neck faucet.
  b.box(b.group, 'white porcelain sink rim', [-1.54, 1.29, -1.46], [1.06, .08, .69], palette.white);
  b.box(b.group, 'sink dark basin', [-1.54, 1.32, -1.45], [.77, .035, .45], '#b7c9c2');
  b.cylinder(b.group, 'sink faucet riser', [-1.54, 1.52, -1.78], .035, .035, .38, palette.gold, undefined, 10);
  b.box(b.group, 'sink faucet curved spout', [-1.54, 1.69, -1.64], [.36, .045, .045], palette.gold).rotation.x = -.45;
  b.cylinder(b.group, 'sink faucet tap handle', [-1.83, 1.52, -1.72], .03, .03, .18, palette.gold, undefined, 8);
  // Tile backsplash and wood ledges with everyday dishes and jars.
  b.box(b.group, 'warm cream tiled backsplash', [.29, 1.86, -2.24], [3.43, 1.12, .08], '#f8e9d3');
  for (let x = -1.3; x <= 1.8; x += .34) for (let y = 1.38; y <= 2.36; y += .32) b.box(b.group, `hand painted backsplash grout ${x.toFixed(1)}-${y.toFixed(1)}`, [x, y, -2.18], [.012, .95, .012], '#d7c9b6');
  for (const x of [-.25, 1.06]) {
    b.box(b.group, `spice shelf ${x}`, [x, 2.55, -2.05], [1.24, .1, .38], palette.lightWood);
    addBooks(b, x - .36, 2.62, -2.08, 3);
    b.cylinder(b.group, `ceramic jar ${x}`, [x + .4, 2.78, -2.02], .1, .12, .31, '#e0ad91', undefined, 10);
  }
  // A freestanding range with four burners, enamel oven, dials, hood and utensils.
  b.box(b.group, 'ivory gas range body', [.15, .91, -1.47], [1.05, .78, .77], '#f5ebd9');
  b.box(b.group, 'black oven glass', [.15, .88, -1.065], [.71, .43, .06], '#393d43');
  b.box(b.group, 'oven brass handle', [.15, 1.17, -1.01], [.7, .055, .07], palette.gold);
  for (const dx of [-.33, -.11, .11, .33]) b.sphere(b.group, `oven dial ${dx}`, [.15 + dx, 1.35, -1.04], .055, palette.darkWood, [1, 1, .52]);
  for (const x of [-.15, .44]) for (const z of [-1.75, -1.34]) {
    b.cylinder(b.group, `black enamel burner ${x}-${z}`, [x, 1.31, z], .2, .2, .045, palette.charcoal, undefined, 18);
    b.cylinder(b.group, `burner cap ${x}-${z}`, [x, 1.34, z], .085, .085, .04, '#88817a', undefined, 14);
  }
  b.box(b.group, 'cream extractor hood canopy', [.15, 2.69, -2.12], [1.56, .22, .7], '#e8ddcd');
  b.box(b.group, 'extractor vent chimney', [.15, 3.02, -2.25], [.54, .52, .32], '#d7c9b6');
  b.box(b.group, 'hanging utensil rail', [1.34, 2.04, -2.06], [1.12, .07, .08], palette.darkWood);
  for (let i = 0; i < 4; i += 1) {
    const x = .95 + i * .27;
    b.box(b.group, `utensil hook ${i}`, [x, 1.93, -2.06], [.025, .2, .025], palette.gold);
    b.box(b.group, `hanging kitchen tool ${i}`, [x, 1.76, -2.02], [.12, .3, .04], i % 2 ? palette.darkWood : '#89959a');
  }
  // Tall cream fridge with freezer split, handle and hand pinned note.
  b.box(b.group, 'tall mint refrigerator cabinet', [2.53, 1.61, -1.65], [.98, 3.08, 1.02], '#d5e2d8', 'fridge-note');
  b.box(b.group, 'refrigerator freezer door', [2.53, 2.53, -1.08], [.84, .95, .08], '#e8eee2', 'fridge-note');
  b.box(b.group, 'refrigerator lower door', [2.53, 1.34, -1.08], [.84, 1.36, .08], '#edf1e7', 'fridge-note');
  b.box(b.group, 'refrigerator brass handle', [2.17, 1.75, -.99], [.055, .73, .07], palette.gold, 'fridge-note');
  b.box(b.group, 'pinned square fridge message', [2.74, 2.0, -.99], [.43, .46, .045], palette.paper, 'fridge-note');
  b.box(b.group, 'fridge note pink ribbon', [2.74, 2.0, -.96], [.035, .39, .025], palette.rose, 'fridge-note');
  b.sphere(b.group, 'magnet holding fridge note', [2.74, 2.25, -.95], .09, palette.rose, [.8, .55, .5], 'fridge-note');
  // Front breakfast table with two place settings and chairs.
  addTable(b, .92, 1.23, 1.72, 1.18, .76, '#b98766');
  for (const x of [.44, 1.39]) {
    b.cylinder(b.group, 'white ceramic dinner plate', [x, .85, 1.23], .25, .25, .035, palette.white, 'two-plates', 18);
    b.cylinder(b.group, 'plate inner groove', [x, .874, 1.23], .18, .18, .012, '#d9cab2', 'two-plates', 18);
    b.cylinder(b.group, 'linen napkin roll', [x + .24, .91, 1.23], .045, .045, .21, '#e7b49e', 'two-plates', 10).rotation.z = Math.PI / 2;
  }
  addChair(b, .93, 2.0, '#cf9980');
  addChair(b, .93, .38, '#879c88');
  addRug(b, 'kitchen striped', .15, .42, 2.9, 1.02, ['#c98576', '#eed9bb', '#9a5660'], 'stripe');
  // Tea set sits where the tea hotspot points, on the clear counter beside the range.
  b.cylinder(b.group, 'rose glazed tea pot body', [-.63, 1.47, -1.45], .23, .29, .36, '#c66d75', 'tea', 14);
  b.cylinder(b.group, 'tea pot lid', [-.63, 1.68, -1.45], .12, .17, .1, palette.gold, 'tea', 12);
  b.sphere(b.group, 'tea pot lid knob', [-.63, 1.75, -1.45], .055, palette.gold, [.85, .85, .85], 'tea');
  b.box(b.group, 'tea pot spout', [-.34, 1.53, -1.45], [.29, .08, .09], '#c66d75', 'tea').rotation.z = .34;
  b.box(b.group, 'tea pot handle side', [-.9, 1.51, -1.45], [.08, .32, .08], palette.gold, 'tea');
  b.cylinder(b.group, 'one porcelain tea cup', [-.43, 1.34, -1.0], .13, .16, .19, palette.white, 'tea', 12);
  b.cylinder(b.group, 'tea in cup', [-.43, 1.445, -1.0], .11, .11, .012, '#8a5947', 'tea', 12);
  anchors.set('tea', new THREE.Vector3(-.43, 1.49, -.98));
  anchors.set('fridge-note', new THREE.Vector3(2.74, 2.02, -.8));
  anchors.set('two-plates', new THREE.Vector3(.92, .93, 1.15));
}

function addDeskLamp(b: RoomBuilder, x: number, z: number, id: string, on: boolean): THREE.PointLight {
  b.cylinder(b.group, 'brass desk lamp weighted foot', [x, 1.18, z], .2, .28, .08, palette.gold, id, 16);
  const lower = b.cylinder(b.group, 'desk lamp articulated lower arm', [x - .06, 1.38, z], .035, .035, .42, palette.gold, id, 8); lower.rotation.z = -.42;
  const upper = b.cylinder(b.group, 'desk lamp upper arm', [x - .25, 1.68, z], .03, .03, .4, palette.darkWood, id, 8); upper.rotation.z = .66;
  b.cylinder(b.group, 'enamel desk lamp shade', [x - .37, 1.88, z], .19, .29, .26, '#e4bd78', id, 12).rotation.z = .5;
  const light = new THREE.PointLight('#ffe0a7', on ? 1.65 : .06, 4.2, 2);
  light.name = 'desk-lamp'; light.position.set(x - .34, 1.76, z + .04); b.group.add(light);
  return light;
}

function addStudy(b: RoomBuilder, anchors: Map<string, THREE.Vector3>, lampOn: boolean): THREE.PointLight {
  addShell(b, '#bfae91');
  addRug(b, 'study', -.25, .55, 3.6, 2.35, ['#788c7b', '#ddc9a6', '#f1e0c7'], 'diamond');
  addWindow(b, -1.92, 2.3, -2.26, 1.4, 1.32, 'window', true);
  addCurtains(b, -1.92, 2.3, -2.36, 1.4, 1.3);
  // Deep desk, side drawers, brass pulls, paper stack and open notebook.
  b.box(b.group, 'solid writing desk pedestal', [.66, .65, -.62], [2.74, .92, .95], '#956851');
  b.box(b.group, 'writing desk polished oak top', [.66, 1.2, -.62], [3.02, .15, 1.18], '#c39470');
  b.box(b.group, 'left desk drawer', [-.11, .78, -.1], [.55, .28, .08], '#b78362');
  b.box(b.group, 'right desk drawer', [.61, .78, -.1], [.55, .28, .08], '#b78362');
  for (const x of [-.11, .61]) b.sphere(b.group, `drawer brass pull ${x}`, [x, .79, -.04], .045, palette.gold, [.8, .8, .5]);
  b.box(b.group, 'opened journal cover', [-.12, 1.31, -.43], [.88, .065, .64], '#7e5663', 'notebook');
  b.box(b.group, 'cream open journal pages', [-.12, 1.35, -.41], [.78, .018, .55], palette.paper, 'notebook');
  b.box(b.group, 'journal center binding', [-.12, 1.37, -.41], [.025, .018, .54], palette.rose, 'notebook');
  for (let line = 0; line < 5; line += 1) b.box(b.group, `journal handwritten line ${line}`, [-.12, 1.365, -.61 + line * .09], [.58, .008, .009], '#a7a7a2', 'notebook');
  b.box(b.group, 'little paper pile on desk', [.55, 1.31, -.45], [.48, .045, .38], '#eddfc7');
  const pen = b.cylinder(b.group, 'wooden pencil on desk', [.7, 1.36, -.45], .018, .018, .55, palette.deepPlum, undefined, 6); pen.rotation.z = Math.PI / 2;
  addDeskLamp(b, 1.78, -.54, 'desk-lamp', lampOn);
  b.cylinder(b.group, 'painted pencil cup', [.82, 1.48, -.92], .13, .16, .28, '#748f7c', undefined, 12);
  for (let i = 0; i < 5; i += 1) {
    const pencil = b.cylinder(b.group, `pencil set ${i}`, [.72 + i * .05, 1.73 + (i % 2) * .04, -.92], .014, .014, .48, ['#d4a565','#795f7a','#b86361'][i % 3], undefined, 6);
    pencil.rotation.z = (i - 2) * .05;
  }
  // Corkboard with pinned notes, pressed flower, string and a small clip rail.
  b.box(b.group, 'wood framed cork notice board', [.15, 2.55, -2.23], [1.68, 1.24, .13], '#a77552');
  b.box(b.group, 'warm cork insert', [.15, 2.55, -2.14], [1.5, 1.06, .035], '#bd8a61');
  for (let i = 0; i < 4; i += 1) {
    const x = -.36 + (i % 2) * .95, y = 2.78 - Math.floor(i / 2) * .45;
    b.box(b.group, `pinned paper ${i}`, [x, y, -2.1], [.48, .34, .045], i % 2 ? '#f6e8cf' : '#efe0c7');
    b.box(b.group, `pinned note ink ${i}`, [x, y, -2.07], [.3, .015, .012], '#aa8c7a');
    b.sphere(b.group, `colored board pin ${i}`, [x, y + .12, -2.045], .04, i % 2 ? '#bc6970' : palette.gold, [.8, .8, .55]);
  }
  b.box(b.group, 'notice board hanging string', [.16, 2.42, -2.05], [1.1, .018, .018], palette.rose).rotation.z = -.12;
  addShelf(b, 2.53, 2.18, -2.09, .85, 2);
  addArt(b, 2.53, 2.98, -2.19, .58, .62, 'little landscape by desk', 'landscape', ['#e4d3b9','#c4a081','#5d7180','#819071']);
  // Reading chair and small lounge corner with throw, mug and open book.
  addChair(b, .66, .6, '#7b7d70');
  addChair(b, -2.12, .94, '#7c6473');
  b.box(b.group, 'reading chair knitted throw', [-2.37, 1.42, .73], [.32, .74, .62], '#d7ad9c');
  for (let i = 0; i < 4; i += 1) b.box(b.group, `knit throw tassel ${i}`, [-2.35 + i * .12, 1.01, 1.08], [.025, .2, .025], '#f0d6c2');
  addTable(b, -2.48, 1.15, .62, .58, .56, palette.lightWood);
  b.cylinder(b.group, 'lounge corner tea mug', [-2.48, .68, 1.15], .13, .16, .24, palette.white, undefined, 12);
  addBooks(b, -2.48, .66, 1.42, 2, true);
  addPlant(b, 2.54, 1.4, 'broad');
  anchors.set('desk-lamp', new THREE.Vector3(1.42, 1.9, -.48));
  anchors.set('notebook', new THREE.Vector3(-.12, 1.43, -.3));
  anchors.set('window', new THREE.Vector3(-1.92, 2.3, -2.03));
  return b.group.children.find((child) => child.name === 'desk-lamp') as THREE.PointLight;
}

function addBedroom(b: RoomBuilder, anchors: Map<string, THREE.Vector3>, lampOn: boolean): THREE.PointLight {
  addShell(b, '#c9a3a3');
  addRug(b, 'bedroom rose and cream', -.08, .78, 3.65, 2.18, ['#b97883', '#f0d9c9', '#f5e4cf'], 'floral');
  addWindow(b, -2.03, 2.34, -2.27, 1.2, 1.45, undefined, true);
  addCurtains(b, -2.03, 2.34, -2.37, 1.2, 1.43);
  // Large bed with carved headboard, layered bedding, piping, three pillows and quilted folded throw.
  b.box(b.group, 'dark rose bed plinth', [-.72, .38, .44], [3.34, .56, 2.48], '#79515d');
  b.box(b.group, 'cream mattress', [-.72, .77, .39], [3.22, .3, 2.4], '#f8e8d7');
  b.box(b.group, 'tall upholstered headboard', [-.72, 1.3, -.83], [3.36, 1.25, .18], '#a66e77');
  b.box(b.group, 'headboard inset panel', [-.72, 1.33, -.72], [2.96, .92, .055], '#bd8790');
  b.box(b.group, 'rose duvet cover', [-.72, 1.0, .72], [3.03, .17, 1.55], '#cc8491');
  b.box(b.group, 'duvet cream top fold', [-.72, 1.1, .04], [3.04, .12, .42], '#f0d4ca');
  b.box(b.group, 'knitted blush throw at foot', [-.72, 1.12, 1.58], [3.05, .15, .44], '#e7aaa7');
  for (let i = 0; i < 11; i += 1) b.box(b.group, `quilt stitch ${i}`, [-2.12 + i * .28, 1.205, 1.58], [.018, .012, .34], '#f1c8ba');
  addPillow(b, -1.65, 1.13, -.39, '#fff5e5', 'pillow');
  addPillow(b, -.77, 1.13, -.39, '#f0d6d0', 'pillow', true);
  addPillow(b, .1, 1.13, -.39, '#fff1e2', 'pillow');
  // Matching bedside cabinet with drawer, keepsake box and shaded night light.
  b.box(b.group, 'bedside cabinet carcass', [1.72, .67, -.19], [.92, .91, .79], palette.wood, 'letter-box');
  b.box(b.group, 'bedside cabinet drawer front', [1.72, .77, .23], [.75, .3, .055], '#bb8b6d', 'letter-box');
  b.sphere(b.group, 'bedside brass drawer pull', [1.72, .78, .275], .055, palette.gold, [.8, .8, .5], 'letter-box');
  b.box(b.group, 'keepsake letters box lower half', [1.72, 1.24, -.25], [.64, .26, .45], '#9d5666', 'letter-box');
  b.box(b.group, 'keepsake box gold lid', [1.72, 1.4, -.25], [.72, .08, .52], palette.gold, 'letter-box');
  b.box(b.group, 'keepsake heart clasp', [1.72, 1.35, .025], [.15, .11, .035], palette.rose, 'letter-box');
  const lamp = addLamp(b, 1.72, -.22, 'night-lamp', lampOn);
  b.box(b.group, 'stacked bedside bedtime books', [1.45, 1.0, .1], [.42, .07, .3], '#718078');
  b.box(b.group, 'book pages', [1.45, 1.045, .1], [.37, .015, .26], palette.paper);
  // Wide dresser, small jewelry case and a pair of floating shelves.
  b.box(b.group, 'bedroom dresser body', [.9, .74, -1.98], [1.84, 1.0, .7], '#a87963');
  b.box(b.group, 'dresser top slab', [.9, 1.28, -1.91], [2.0, .12, .82], '#c39a77');
  for (const y of [.52, .86]) for (const x of [.34, 1.28]) {
    b.box(b.group, `dresser drawer ${x}-${y}`, [x, y, -1.59], [.75, .25, .055], '#c39172');
    b.sphere(b.group, `dresser drawer pull ${x}-${y}`, [x, y, -1.54], .04, palette.gold, [.8, .8, .5]);
  }
  b.box(b.group, 'pink jewelry case', [.73, 1.48, -1.82], [.52, .3, .42], '#bd7180');
  b.box(b.group, 'jewelry case lid', [.73, 1.65, -1.82], [.57, .07, .46], palette.gold);
  addPlant(b, 1.52, -1.83, 'flowers');
  addShelf(b, -.18, 2.27, -2.11, .86, 2);
  addArt(b, 1.67, 2.62, -2.24, .58, .72, 'quiet moon print', 'night', ['#303953','#e6bd8e','#5e788b','#95a3a3']);
  addArt(b, -.94, 2.7, -2.23, .58, .7, 'small pressed leaf print', 'botanical', ['#e5d4c4','#617969','#bb7a77','#d9b36f']);
  // Woven wall textile with tassels and a round foot pouf.
  b.box(b.group, 'woven rose wall hanging', [.58, 2.52, -2.15], [.86, 1.05, .08], '#aa7972');
  for (let i = 0; i < 6; i += 1) b.box(b.group, `wall hanging woven stripe ${i}`, [.58, 2.52, -2.09], [.06, .94, .025], i % 2 ? '#d9b393' : '#efd7bd');
  for (let i = -2; i <= 2; i += 1) b.box(b.group, `wall hanging fringe ${i}`, [.58 + i * .13, 1.92, -2.12], [.025, .2, .03], '#e2c29d');
  b.cylinder(b.group, 'round knitted foot pouf', [1.96, .34, 1.36], .52, .52, .48, '#a47978', undefined, 16);
  for (let i = 0; i < 7; i += 1) b.box(b.group, `pouf stitched seam ${i}`, [1.96, .35, 1.36], [.02, .36, .92], '#d3aaa0').rotation.y = i * Math.PI / 7;
  addPlant(b, -2.62, 1.1, 'broad');
  anchors.set('letter-box', new THREE.Vector3(1.72, 1.44, .1));
  anchors.set('pillow', new THREE.Vector3(-.77, 1.33, -.1));
  anchors.set('night-lamp', new THREE.Vector3(1.72, 1.98, -.22));
  return lamp;
}

function citySkyPaint(ctx: CanvasRenderingContext2D, size: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#202b48'); gradient.addColorStop(.65, '#4a536d'); gradient.addColorStop(1, '#d19582');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fae3b9'; ctx.beginPath(); ctx.arc(size * .78, size * .19, size * .065, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#202b48'; ctx.beginPath(); ctx.arc(size * .805, size * .17, size * .06, 0, Math.PI * 2); ctx.fill();
  for (const [x, y, w, h] of [[0,.52,.18,.48],[.15,.42,.16,.58],[.3,.59,.17,.41],[.47,.35,.17,.65],[.63,.52,.15,.48],[.77,.45,.13,.55],[.88,.58,.12,.42]] as const) {
    ctx.fillStyle = ['#303a53','#45445a','#343c55'][Math.round(x * 10) % 3]; ctx.fillRect(x * size, y * size, w * size, h * size);
    ctx.fillStyle = '#f4ca8b';
    for (let wx = x * size + 9; wx < (x + w) * size - 5; wx += 18) for (let wy = y * size + 12; wy < size - 8; wy += 23) if ((Math.floor(wx + wy) % 3) !== 0) ctx.fillRect(wx, wy, 6, 9);
  }
}

function addBalcony(b: RoomBuilder, anchors: Map<string, THREE.Vector3>): void {
  b.box(b.group, 'balcony floating stone plinth', [0, -.24, .1], [6.62, .38, 5.08], '#55485e');
  b.box(b.group, 'balcony sandstone floor', [0, -.005, .1], [6.42, .14, 4.96], '#867780');
  for (let x = -2.8; x <= 2.7; x += .48) b.box(b.group, `balcony deck board joint ${x}`, [x, .075, .15], [.018, .012, 4.65], '#635b66');
  const sky = b.textureMaterial('balcony-city-skyline', citySkyPaint, .7);
  b.plane(b.group, 'procedural Japanese city at dusk', [0, 2.52, -2.48], 6.32, 4.75, sky);
  b.box(b.group, 'left balcony plaster wall', [-3.1, 1.65, -.12], [.2, 3.4, 4.7], '#b98f84');
  b.box(b.group, 'left balcony wall crown', [-3.08, 3.38, -.12], [.28, .14, 4.78], palette.wood);
  // A small lantern and trailing ivy frame the open view without turning the balcony into an indoor room.
  b.box(b.group, 'balcony wall lantern backplate', [-2.96, 2.58, -.86], [.12, .4, .32], palette.darkWood);
  b.box(b.group, 'balcony amber lantern', [-2.78, 2.44, -.86], [.25, .34, .24], '#f5d391');
  b.box(b.group, 'balcony lantern roof', [-2.78, 2.63, -.86], [.34, .09, .31], palette.darkWood);
  const wallLamp = new THREE.PointLight('#ffd39a', .45, 3, 2); wallLamp.position.set(-2.65, 2.38, -.85); b.group.add(wallLamp);
  for (let i = 0; i < 8; i += 1) {
    const leaf = b.sphere(b.group, `balcony wall ivy ${i}`, [-2.78 + Math.sin(i) * .2, 1.22 + i * .24, -.58 + Math.cos(i * 2) * .1], .15, i % 2 ? palette.green : palette.lightGreen, [.55, 1.2, .48]);
    leaf.rotation.z = -.4;
  }
  // Front and right handrail remain open above their thin rails to reveal the city.
  b.box(b.group, 'balcony front stone curb', [0, .55, 2.38], [5.9, .16, .19], '#c3a695');
  b.box(b.group, 'balcony front brass top rail', [0, .88, 2.38], [6.02, .12, .18], palette.darkWood);
  b.box(b.group, 'balcony right stone curb', [2.93, .55, .04], [.18, .16, 3.88], '#c3a695');
  b.box(b.group, 'balcony right top rail', [2.93, .96, .04], [.18, .12, 3.96], palette.darkWood);
  for (let x = -2.8; x <= 2.8; x += .47) b.box(b.group, `front iron baluster ${x.toFixed(1)}`, [x, .72, 2.38], [.055, .3, .07], '#dbcfb9');
  for (let z = -1.7; z <= 1.5; z += .48) b.box(b.group, `right iron baluster ${z.toFixed(1)}`, [2.93, .75, z], [.07, .42, .055], '#dbcfb9');
  // Crescent and stars have depth against the painted urban sky.
  b.sphere(b.group, 'warm ivory crescent moon', [2.16, 3.1, -2.24], .49, '#f5dfb5', [1, 1, .22], 'moon', .45);
  b.sphere(b.group, 'shadow carving the moon crescent', [2.39, 3.18, -2.16], .45, '#4e546b', [1, 1, .22]);
  for (const [i, x, y] of [[0,-.94,3.12],[1,-.18,3.32],[2,.62,2.95],[3,1.26,3.5],[4,2.75,2.64]] as const) b.sphere(b.group, `small star ${i}`, [x, y, -2.18], .045, '#fff0cc', [.8, .8, .35]);
  // Wicker lounge chair, stitched cushion and a warm throw on the left.
  addChair(b, -1.78, .78, '#9a826d', 'empty-chair', true);
  b.box(b.group, 'empty chair soft seat cushion', [-1.78, .91, .8], [.72, .16, .68], '#d6bfa6', 'empty-chair');
  b.box(b.group, 'folded rose throw over wicker arm', [-2.12, 1.52, .42], [.3, .78, .58], '#c78387', 'empty-chair');
  for (let i = 0; i < 5; i += 1) b.box(b.group, `chair throw crochet stripe ${i}`, [-2.25 + i * .055, 1.52, .73], [.018, .7, .025], '#ebc5b3', 'empty-chair');
  // Round table with two working looking clocks and a little flower vase.
  addTable(b, .42, .69, 1.5, 1.5, .86, '#9c705d', true);
  addClockOnTable(b, .12, .62, .34, 'Vietnam', '#b75f67');
  addClockOnTable(b, .82, .62, .34, 'Japan', '#58807b');
  b.cylinder(b.group, 'round lilac flower vase', [.42, 1.14, .99], .13, .19, .27, '#a88a9c', undefined, 12);
  b.cylinder(b.group, 'vase mouth', [.42, 1.29, .99], .12, .12, .035, palette.gold, undefined, 12);
  for (let i = 0; i < 5; i += 1) {
    const angle = i * Math.PI * .4;
    b.cylinder(b.group, `vase flower stem ${i}`, [.42 + Math.cos(angle) * .12, 1.56, .99 + Math.sin(angle) * .12], .012, .012, .55, palette.deepGreen, undefined, 6);
    b.sphere(b.group, `vase flower head ${i}`, [.42 + Math.cos(angle) * .18, 1.84 + (i % 2) * .08, .99 + Math.sin(angle) * .18], .12, i % 2 ? '#e6a2a1' : '#efd18c', [.9, .75, .9]);
  }
  // Tall fairy-lit shrub and rail-side flower troughs.
  addPlant(b, 2.35, -1.44, 'tall');
  for (let i = 0; i < 15; i += 1) {
    const angle = i * 2.4, y = .84 + (i % 6) * .27;
    b.sphere(b.group, `warm fairy bulb in shrub ${i}`, [2.35 + Math.cos(angle) * .44, y, -1.44 + Math.sin(angle) * .38], .045, '#f8d88e', [.9, .9, .9], undefined, .35);
  }
  b.box(b.group, 'front balcony flower trough', [-.15, .67, 1.77], [2.2, .32, .38], '#8a6156');
  for (let i = 0; i < 8; i += 1) {
    const x = -.95 + i * .23;
    b.cylinder(b.group, `front rail flower stem ${i}`, [x, .9, 1.68], .012, .012, .42, palette.deepGreen, undefined, 6);
    b.sphere(b.group, `front rail flower ${i}`, [x, 1.13 + (i % 2) * .04, 1.68], .09, i % 2 ? '#e5a29e' : '#f2d28c', [.9, .8, .8]);
    b.sphere(b.group, `front rail flower center ${i}`, [x, 1.14 + (i % 2) * .04, 1.68], .03, palette.gold, [.8, .8, .8]);
  }
  addRug(b, 'balcony midnight', -.25, .8, 2.68, 2.08, ['#5a576d', '#d7b48e', '#e8d4bc'], 'diamond');
  anchors.set('moon', new THREE.Vector3(2.16, 3.1, -1.98));
  anchors.set('two-clocks', new THREE.Vector3(.42, 1.18, .62));
  anchors.set('empty-chair', new THREE.Vector3(-1.78, 1.49, .86));
}

export function createHouse3DRoom(roomId: HouseRoomId, lampOn: boolean): House3DRoom {
  const b = new RoomBuilder();
  b.group.name = `our-home-room-${roomId}`;
  const anchors = new Map<string, THREE.Vector3>();
  let lamp: THREE.PointLight | undefined;
  let cameraPosition: readonly [number, number, number] = [0, 4.6, 9.8];
  let cameraTarget: readonly [number, number, number] = [0, 1.2, 0];

  switch (roomId) {
    case 'entrance':
      addEntrance(b, anchors); cameraPosition = [0, 5.55, 11.2]; cameraTarget = [0, 1.65, .12]; break;
    case 'living': addLiving(b, anchors); break;
    case 'kitchen': addKitchen(b, anchors); break;
    case 'study': lamp = addStudy(b, anchors, lampOn); break;
    case 'bedroom': lamp = addBedroom(b, anchors, lampOn); break;
    case 'balcony': addBalcony(b, anchors); cameraPosition = [0, 4.55, 10.2]; cameraTarget = [0, 1.3, 0]; break;
  }

  return { group: b.group, anchors, cameraPosition, cameraTarget, lamp };
}
