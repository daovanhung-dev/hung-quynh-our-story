import * as THREE from 'three';
import type { HouseRoomId } from '../models/our-home.model';

export interface House3DRoom {
  readonly group: THREE.Group;
  readonly anchors: ReadonlyMap<string, THREE.Vector3>;
  readonly lamp?: THREE.PointLight;
}

const colors = {
  plum: '#69404d',
  darkPlum: '#472a39',
  rose: '#c9878a',
  peach: '#e9b7a6',
  cream: '#f8e7cf',
  wood: '#9b6858',
  darkWood: '#67463f',
  green: '#718a72',
  leaf: '#a4b883',
  gold: '#e7bd76',
  blue: '#8caeb8',
  paleBlue: '#c2e0df',
  white: '#fff7e9'
} as const;

type XYZ = readonly [number, number, number];
type Dimensions = readonly [number, number, number];

function box(
  parent: THREE.Object3D,
  name: string,
  position: XYZ,
  dimensions: Dimensions,
  color: string,
  hotspotId?: string,
  roughness = 0.82
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...dimensions),
    new THREE.MeshStandardMaterial({ color, roughness })
  );
  mesh.name = name;
  mesh.position.set(...position);
  if (hotspotId) mesh.userData['hotspotId'] = hotspotId;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent: THREE.Object3D,
  name: string,
  position: XYZ,
  radius: number,
  color: string,
  hotspotId?: string,
  widthSegments = 14,
  heightSegments = 10
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
    new THREE.MeshStandardMaterial({ color, roughness: 0.72 })
  );
  mesh.name = name;
  mesh.position.set(...position);
  if (hotspotId) mesh.userData['hotspotId'] = hotspotId;
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  position: XYZ,
  radius: number,
  height: number,
  color: string,
  hotspotId?: string,
  radialSegments = 12
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, radialSegments),
    new THREE.MeshStandardMaterial({ color, roughness: 0.76 })
  );
  mesh.name = name;
  mesh.position.set(...position);
  if (hotspotId) mesh.userData['hotspotId'] = hotspotId;
  parent.add(mesh);
  return mesh;
}

function addRoomShell(group: THREE.Group, floorColor = '#d9aa91'): void {
  // The layered plinth makes each room read as a small playable diorama.
  box(group, 'display plinth', [0, -0.34, 0], [6.55, 0.3, 5.05], colors.darkPlum);
  box(group, 'gold plinth trim', [0, -0.16, 0], [6.44, 0.075, 4.94], colors.gold);
  box(group, 'room floor', [0, 0, 0], [6.32, 0.28, 4.82], floorColor);

  // Low side and front walls keep the furniture visible while the camera circles it.
  box(group, 'back wall', [0, 1.68, -2.29], [6.18, 3.12, 0.18], '#edcbbb');
  box(group, 'left side wall', [-3.0, 0.82, -0.1], [0.18, 1.5, 4.18], '#dcaea2');
  box(group, 'right side wall', [3.0, 0.82, -0.1], [0.18, 1.5, 4.18], '#dcaea2');
  box(group, 'front left low wall', [-2.48, 0.45, 2.26], [1.0, 0.78, 0.16], '#e5bbae');
  box(group, 'front right low wall', [2.48, 0.45, 2.26], [1.0, 0.78, 0.16], '#e5bbae');
  box(group, 'back wall crown', [0, 3.28, -2.25], [6.28, 0.13, 0.25], colors.wood);
  box(group, 'left wall cap', [-3.0, 1.62, -0.1], [0.28, 0.14, 4.24], colors.wood);
  box(group, 'right wall cap', [3.0, 1.62, -0.1], [0.28, 0.14, 4.24], colors.wood);
  box(group, 'front left wall cap', [-2.48, 0.87, 2.26], [1.05, 0.12, 0.22], colors.wood);
  box(group, 'front right wall cap', [2.48, 0.87, 2.26], [1.05, 0.12, 0.22], colors.wood);

  // Floor seams and a soft rug add depth without large textures or external assets.
  for (let index = -2; index <= 2; index += 1) {
    box(group, `floor seam ${index}`, [index * 1.08, 0.145, 0.05], [0.035, 0.012, 4.45], '#b98270');
  }
}

function addWindow(group: THREE.Group, x: number, y: number, color: string = colors.paleBlue, hotspotId?: string): void {
  const z = -2.17;
  box(group, 'window outer frame', [x, y, z], [1.24, 1.48, 0.12], colors.wood, hotspotId);
  box(group, 'window glass', [x, y, z + 0.075], [1.04, 1.27, 0.055], color, hotspotId);
  box(group, 'window crossbar', [x, y, z + 0.12], [1.04, 0.065, 0.045], colors.white, hotspotId);
  box(group, 'window mullion', [x, y, z + 0.125], [0.065, 1.27, 0.045], colors.white, hotspotId);
  box(group, 'window sill', [x, y - 0.76, z + 0.08], [1.42, 0.12, 0.32], colors.cream, hotspotId);
}

function addPlant(group: THREE.Group, x: number, z: number): void {
  cylinder(group, 'terracotta plant pot', [x, 0.38, z], 0.28, 0.48, colors.rose, undefined, 9);
  cylinder(group, 'plant soil', [x, 0.64, z], 0.22, 0.045, colors.darkWood, undefined, 9);
  sphere(group, 'plant leaves', [x, 1.02, z], 0.42, colors.green, undefined, 9, 7);
  sphere(group, 'plant leaf light', [x - 0.18, 1.2, z + 0.02], 0.24, colors.leaf, undefined, 8, 6);
  sphere(group, 'plant leaf dark', [x + 0.2, 1.13, z - 0.04], 0.22, '#5f795f', undefined, 8, 6);
}

function addWallFrame(group: THREE.Group, x: number, y: number, color: string, hotspotId: string): void {
  const z = -2.12;
  box(group, 'photo frame', [x, y, z], [0.7, 0.82, 0.14], colors.gold, hotspotId);
  box(group, 'photo mat', [x, y, z + 0.09], [0.56, 0.66, 0.04], colors.white, hotspotId);
  box(group, 'photo art', [x, y, z + 0.12], [0.44, 0.52, 0.04], color, hotspotId);
  sphere(group, 'photo heart', [x, y, z + 0.16], 0.105, colors.rose, hotspotId, 9, 7);
}

function addDoor(group: THREE.Group, x = 0, color: string = colors.darkWood, hotspotId?: string): void {
  const z = -2.12;
  box(group, 'door surround', [x, 1.25, z], [1.42, 2.42, 0.22], colors.cream, hotspotId);
  box(group, 'front door', [x, 1.22, z + 0.14], [1.12, 2.13, 0.15], color, hotspotId);
  box(group, 'door inset upper', [x, 1.65, z + 0.23], [0.73, 0.72, 0.05], colors.plum, hotspotId);
  box(group, 'door inset lower', [x, 0.72, z + 0.23], [0.73, 0.65, 0.05], colors.wood, hotspotId);
  sphere(group, 'door knob', [x + 0.37, 1.13, z + 0.3], 0.09, colors.gold, hotspotId, 10, 8);
}

function addSofa(group: THREE.Group, hotspotId: string): void {
  box(group, 'sofa shadow', [-1.2, 0.22, 0.78], [2.7, 0.07, 1.2], '#8c6670');
  box(group, 'sofa base', [-1.2, 0.56, 0.68], [2.5, 0.63, 0.94], colors.plum, hotspotId);
  box(group, 'sofa back', [-1.2, 1.12, -0.02], [2.55, 1.0, 0.35], '#845263', hotspotId);
  box(group, 'sofa left arm', [-2.37, 0.9, 0.65], [0.28, 0.85, 1.05], '#9a6271', hotspotId);
  box(group, 'sofa right arm', [-0.03, 0.9, 0.65], [0.28, 0.85, 1.05], '#9a6271', hotspotId);
  box(group, 'sofa cushion one', [-1.77, 0.92, 0.66], [0.94, 0.16, 0.71], '#cf9893', hotspotId);
  box(group, 'sofa cushion two', [-0.73, 0.92, 0.66], [0.94, 0.16, 0.71], '#e6b6a8', hotspotId);
  sphere(group, 'sofa heart pillow', [-1.23, 1.32, 0.45], 0.25, '#f1d6c8', hotspotId, 10, 8);
}

function addLamp(group: THREE.Group, x: number, z: number, hotspotId: string): THREE.PointLight {
  cylinder(group, 'lamp base', [x, 0.93, z], 0.28, 0.1, colors.gold, hotspotId);
  cylinder(group, 'lamp stem', [x, 1.28, z], 0.045, 0.64, colors.darkWood, hotspotId, 8);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.4, 0.38, 10),
    new THREE.MeshStandardMaterial({ color: colors.cream, emissive: colors.gold, emissiveIntensity: 0.22, roughness: 0.68 })
  );
  shade.name = 'lamp shade';
  shade.position.set(x, 1.78, z);
  shade.userData['hotspotId'] = hotspotId;
  group.add(shade);
  const light = new THREE.PointLight('#ffd99b', 1.55, 5.5, 2);
  light.name = 'room-lamp';
  light.position.set(x, 1.64, z);
  group.add(light);
  return light;
}

function entrance(group: THREE.Group, anchors: Map<string, THREE.Vector3>): void {
  addRoomShell(group, '#c8947c');
  addDoor(group, 0, '#774957', 'door');
  box(group, 'welcome mat', [0, 0.18, 1.36], [1.72, 0.06, 0.72], '#b56970');
  box(group, 'welcome mat trim', [0, 0.22, 1.36], [1.5, 0.025, 0.55], colors.cream);
  box(group, 'house name plaque', [-1.48, 2.06, -2.08], [1.0, 0.46, 0.13], colors.wood, 'nameplate');
  box(group, 'plaque paper', [-1.48, 2.06, -1.99], [0.79, 0.29, 0.035], colors.cream, 'nameplate');
  sphere(group, 'plaque heart', [-1.48, 2.07, -1.95], 0.11, colors.rose, 'nameplate', 9, 7);
  box(group, 'mailbox post', [2.05, 0.69, -1.62], [0.12, 1.1, 0.12], colors.darkWood, 'mailbox');
  box(group, 'mailbox body', [2.05, 1.23, -1.62], [0.72, 0.52, 0.48], '#9c5364', 'mailbox');
  box(group, 'mailbox lid', [2.05, 1.52, -1.62], [0.82, 0.11, 0.55], colors.gold, 'mailbox');
  box(group, 'mail slot', [2.05, 1.29, -1.36], [0.36, 0.045, 0.035], colors.darkPlum, 'mailbox');
  addPlant(group, -2.3, 1.3);
  addPlant(group, 2.38, 1.35);
  anchors.set('door', new THREE.Vector3(0, 1.2, -1.83));
  anchors.set('nameplate', new THREE.Vector3(-1.48, 2.06, -1.9));
  anchors.set('mailbox', new THREE.Vector3(2.05, 1.24, -1.34));
}

function living(group: THREE.Group, anchors: Map<string, THREE.Vector3>): void {
  addRoomShell(group, '#d9b09a');
  addWallFrame(group, -1.72, 2.32, '#a4c4ba', 'photo-wall');
  addWallFrame(group, -0.78, 2.32, '#dba18d', 'photo-wall');
  addWallFrame(group, 0.16, 2.32, '#9aa9c1', 'photo-wall');
  addSofa(group, 'sofa');
  box(group, 'coffee table legs', [0.45, 0.42, 1.0], [1.45, 0.4, 0.83], colors.darkWood);
  box(group, 'coffee table top', [0.45, 0.67, 1.0], [1.72, 0.15, 1.02], colors.wood);
  sphere(group, 'coffee table tea cup', [0.02, 0.84, 1.0], 0.18, colors.cream);
  cylinder(group, 'record cabinet', [1.92, 0.63, -0.18], 0.44, 1.03, '#875c52', undefined, 6).scale.set(1.7, 1, 0.7);
  box(group, 'record cabinet shelf', [1.92, 0.38, 0.18], [1.33, 0.12, 0.55], colors.darkWood);
  box(group, 'record player base', [1.92, 1.23, -0.2], [1.2, 0.16, 0.8], colors.plum, 'record-player');
  cylinder(group, 'vinyl record', [1.84, 1.34, -0.22], 0.32, 0.035, '#302638', 'record-player', 24);
  cylinder(group, 'record label', [1.84, 1.37, -0.22], 0.095, 0.04, colors.rose, 'record-player', 16);
  box(group, 'record player arm', [2.17, 1.39, -0.1], [0.42, 0.04, 0.055], colors.gold, 'record-player');
  addPlant(group, 2.34, 1.58);
  anchors.set('photo-wall', new THREE.Vector3(-0.78, 2.3, -1.82));
  anchors.set('sofa', new THREE.Vector3(-1.2, 1.18, 0.58));
  anchors.set('record-player', new THREE.Vector3(1.84, 1.43, -0.2));
}

function kitchen(group: THREE.Group, anchors: Map<string, THREE.Vector3>): void {
  addRoomShell(group, '#d7bc94');
  addWindow(group, -1.58, 2.24, '#a8d0d0');
  box(group, 'kitchen counter', [0.0, 0.78, -1.48], [3.72, 0.88, 0.72], '#f5e2ca');
  box(group, 'counter top', [0.0, 1.26, -1.42], [3.92, 0.16, 0.88], colors.cream);
  for (const x of [-1.15, 0, 1.15]) {
    box(group, `cabinet panel ${x}`, [x, 0.8, -1.07], [0.92, 0.65, 0.04], colors.rose);
    sphere(group, `cabinet knob ${x}`, [x + 0.31, 0.84, -1.02], 0.045, colors.gold, undefined, 8, 6);
  }
  box(group, 'fridge cabinet', [2.49, 1.33, -0.78], [0.88, 2.38, 0.92], '#d9e1d9', 'fridge-note');
  box(group, 'fridge door', [2.49, 1.56, -0.28], [0.77, 1.86, 0.08], '#eef2e9', 'fridge-note');
  box(group, 'fridge handle', [2.19, 1.57, -0.19], [0.055, 0.64, 0.06], colors.gold, 'fridge-note');
  box(group, 'fridge note paper', [2.52, 1.87, -0.17], [0.39, 0.45, 0.05], colors.cream, 'fridge-note');
  sphere(group, 'fridge note heart', [2.52, 1.88, -0.12], 0.1, colors.rose, 'fridge-note', 9, 7);
  box(group, 'tea island base', [-0.92, 0.66, 0.25], [1.9, 0.76, 1.05], '#a97966');
  box(group, 'tea island top', [-0.92, 1.08, 0.25], [2.08, 0.14, 1.18], colors.cream);
  cylinder(group, 'tea pot body', [-1.12, 1.39, 0.22], 0.28, 0.4, '#bd6873', 'tea', 12);
  sphere(group, 'tea pot lid', [-1.12, 1.62, 0.22], 0.12, colors.gold, 'tea', 10, 7);
  cylinder(group, 'tea pot spout', [-0.79, 1.45, 0.22], 0.095, 0.32, '#bd6873', 'tea', 8).rotation.z = -0.8;
  cylinder(group, 'tea cup', [-0.57, 1.28, 0.52], 0.16, 0.2, colors.white, 'tea', 12);
  cylinder(group, 'tea surface', [-0.57, 1.39, 0.52], 0.125, 0.018, '#92654e', 'tea', 12);
  box(group, 'dining table legs', [1.05, 0.47, 1.12], [1.35, 0.42, 0.98], colors.darkWood);
  box(group, 'dining table', [1.05, 0.72, 1.12], [1.7, 0.14, 1.2], colors.wood, 'two-plates');
  cylinder(group, 'dining plate one', [0.65, 0.82, 1.12], 0.25, 0.035, colors.white, 'two-plates', 14);
  cylinder(group, 'dining plate two', [1.43, 0.82, 1.12], 0.25, 0.035, colors.white, 'two-plates', 14);
  anchors.set('tea', new THREE.Vector3(-0.57, 1.42, 0.54));
  anchors.set('fridge-note', new THREE.Vector3(2.52, 1.9, -0.1));
  anchors.set('two-plates', new THREE.Vector3(1.05, 0.84, 1.25));
}

function study(group: THREE.Group, anchors: Map<string, THREE.Vector3>, lampOn: boolean): THREE.PointLight {
  addRoomShell(group, '#bcae91');
  addWindow(group, -1.57, 2.28, '#aec8d4', 'window');
  box(group, 'study desk drawers', [0.82, 0.62, -0.48], [2.65, 0.76, 0.9], '#976c58');
  box(group, 'study desktop', [0.82, 1.06, -0.47], [2.92, 0.16, 1.08], '#c69671');
  box(group, 'desk drawer front', [0.82, 0.66, 0.0], [2.34, 0.32, 0.08], '#ad7c63');
  for (const x of [0.12, 0.82, 1.52]) sphere(group, `drawer knob ${x}`, [x, 0.66, 0.08], 0.04, colors.gold, undefined, 8, 6);
  box(group, 'open notebook', [0.07, 1.18, -0.15], [0.8, 0.08, 0.58], '#f8e8d2', 'notebook');
  box(group, 'notebook page', [0.07, 1.23, -0.1], [0.66, 0.018, 0.43], '#fff8e9', 'notebook');
  box(group, 'notebook ribbon', [0.08, 1.25, -0.12], [0.045, 0.018, 0.44], colors.rose, 'notebook');
  const lamp = addLamp(group, 1.72, -0.2, 'desk-lamp');
  lamp.intensity = lampOn ? 1.55 : 0.08;
  box(group, 'pencil cup', [0.75, 1.37, -0.72], [0.28, 0.35, 0.27], '#7f9a81');
  for (const x of [0.66, 0.76, 0.85]) cylinder(group, `pencil ${x}`, [x, 1.62, -0.72], 0.018, 0.48, colors.gold, undefined, 6);
  anchors.set('desk-lamp', new THREE.Vector3(1.72, 1.84, -0.2));
  anchors.set('notebook', new THREE.Vector3(0.07, 1.25, 0.08));
  anchors.set('window', new THREE.Vector3(-1.57, 2.28, -2.0));
  return lamp;
}

function bedroom(group: THREE.Group, anchors: Map<string, THREE.Vector3>, lampOn: boolean): THREE.PointLight {
  addRoomShell(group, '#c9a0a2');
  addWindow(group, -1.62, 2.26, '#8495b5');
  box(group, 'bed base', [-1.12, 0.46, 0.65], [2.85, 0.58, 2.18], '#77515e');
  box(group, 'bed mattress', [-1.12, 0.83, 0.58], [2.78, 0.32, 2.1], '#f5e5d6');
  box(group, 'bed duvet', [-1.12, 1.02, 1.02], [2.62, 0.14, 1.28], '#c88591');
  box(group, 'bed blanket fold', [-1.12, 1.1, 1.52], [2.64, 0.18, 0.28], '#e5b2b0');
  box(group, 'bed pillow one', [-1.72, 1.08, -0.12], [0.9, 0.25, 0.58], '#fff4e5', 'pillow');
  box(group, 'bed pillow two', [-0.65, 1.08, -0.12], [0.9, 0.25, 0.58], '#f2d6d6', 'pillow');
  sphere(group, 'pillow heart', [-1.17, 1.29, 0.14], 0.2, colors.rose, 'pillow', 10, 7);
  box(group, 'bedside table', [1.72, 0.68, 0.18], [1.0, 0.92, 0.8], colors.wood, 'letter-box');
  box(group, 'bedside drawer', [1.72, 0.63, 0.6], [0.74, 0.32, 0.06], '#bd8d70', 'letter-box');
  sphere(group, 'drawer handle', [1.72, 0.63, 0.65], 0.05, colors.gold, 'letter-box', 8, 6);
  box(group, 'letters box', [1.72, 1.24, 0.08], [0.68, 0.25, 0.48], '#a95266', 'letter-box');
  box(group, 'letters box lid', [1.72, 1.39, 0.08], [0.76, 0.08, 0.54], colors.gold, 'letter-box');
  const lamp = addLamp(group, 1.72, 0.18, 'night-lamp');
  lamp.intensity = lampOn ? 1.55 : 0.08;
  anchors.set('letter-box', new THREE.Vector3(1.72, 1.43, 0.38));
  anchors.set('pillow', new THREE.Vector3(-1.17, 1.28, 0.16));
  anchors.set('night-lamp', new THREE.Vector3(1.72, 1.85, 0.18));
  return lamp;
}

function balcony(group: THREE.Group, anchors: Map<string, THREE.Vector3>): void {
  addRoomShell(group, '#79758e');
  addWindow(group, -1.56, 2.3, '#4e6581');
  box(group, 'balcony rail base', [0, 0.62, 1.88], [5.2, 0.16, 0.14], colors.cream);
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) {
    box(group, `balcony baluster ${x}`, [x, 0.94, 1.88], [0.11, 0.62, 0.12], colors.white);
  }
  box(group, 'balcony top rail', [0, 1.3, 1.88], [5.28, 0.14, 0.2], colors.wood);
  box(group, 'clock frame', [0.65, 2.24, -2.12], [1.24, 1.06, 0.16], colors.gold, 'two-clocks');
  cylinder(group, 'clock face', [0.65, 2.24, -2.0], 0.45, 0.07, colors.cream, 'two-clocks', 20);
  cylinder(group, 'clock center', [0.65, 2.24, -1.95], 0.045, 0.045, colors.plum, 'two-clocks', 10);
  box(group, 'clock hand long', [0.65, 2.41, -1.94], [0.045, 0.34, 0.035], colors.darkPlum, 'two-clocks');
  box(group, 'clock hand short', [0.76, 2.24, -1.93], [0.25, 0.045, 0.035], colors.darkPlum, 'two-clocks');
  box(group, 'empty chair seat', [-1.36, 0.9, 0.56], [0.82, 0.18, 0.78], colors.rose, 'empty-chair');
  box(group, 'empty chair back', [-1.36, 1.47, 0.1], [0.82, 1.08, 0.16], '#bf7d89', 'empty-chair');
  for (const x of [-1.68, -1.05]) {
    box(group, `chair leg ${x}`, [x, 0.48, 0.29], [0.09, 0.76, 0.09], colors.darkWood, 'empty-chair');
    box(group, `chair back support ${x}`, [x, 1.4, 0.16], [0.09, 1.18, 0.09], colors.darkWood, 'empty-chair');
  }
  box(group, 'second chair seat', [1.25, 0.9, 0.58], [0.82, 0.18, 0.78], '#8a9b8a');
  box(group, 'second chair back', [1.25, 1.47, 0.12], [0.82, 1.08, 0.16], '#93a68e');
  sphere(group, 'moon', [2.27, 2.76, -2.04], 0.47, '#fff0bd', 'moon', 22, 16);
  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 18, 12),
    new THREE.MeshBasicMaterial({ color: '#f9d996', transparent: true, opacity: 0.17, depthWrite: false })
  );
  moonGlow.name = 'moon glow';
  moonGlow.position.set(2.27, 2.76, -2.03);
  moonGlow.userData['hotspotId'] = 'moon';
  group.add(moonGlow);
  sphere(group, 'balcony star one', [-0.4, 2.86, -2.02], 0.075, colors.gold);
  sphere(group, 'balcony star two', [1.2, 2.96, -2.02], 0.06, colors.cream);
  anchors.set('moon', new THREE.Vector3(2.27, 2.76, -1.72));
  anchors.set('two-clocks', new THREE.Vector3(0.65, 2.24, -1.82));
  anchors.set('empty-chair', new THREE.Vector3(-1.36, 1.22, 0.62));
}

export function createHouse3DRoom(roomId: HouseRoomId, lampOn: boolean): House3DRoom {
  const group = new THREE.Group();
  group.name = `our-home-room-${roomId}`;
  const anchors = new Map<string, THREE.Vector3>();
  let lamp: THREE.PointLight | undefined;

  switch (roomId) {
    case 'entrance': entrance(group, anchors); break;
    case 'living': living(group, anchors); break;
    case 'kitchen': kitchen(group, anchors); break;
    case 'study': lamp = study(group, anchors, lampOn); break;
    case 'bedroom': lamp = bedroom(group, anchors, lampOn); break;
    case 'balcony': balcony(group, anchors); break;
  }

  return { group, anchors, lamp };
}
