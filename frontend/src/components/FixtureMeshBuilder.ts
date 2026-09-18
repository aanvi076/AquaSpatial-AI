/**
 * FixtureMeshBuilder.ts
 *
 * Parametric 3D Mesh Generator for Kohler Products.
 * Converts product-specific visual profiles into distinct Three.js geometry.
 * Grounded in official Kohler catalog metadata (dimensions, mounting, subcategory, features).
 */

import * as THREE from 'three';
import type { KohlerProduct, FixturePlacement } from '../types';
import { getProductProfile } from './KohlerProductProfiles';

export interface FixtureMaterials {
  chinaWhite: THREE.Material;
  fixtureMetal: THREE.Material;
  vanityWood: THREE.Material;
  countertop: THREE.Material;
  glass: THREE.Material;
  mirror: THREE.Material;
  darkAccent: THREE.Material;
}

export interface BuildMeshResult {
  fixtureGroup: THREE.Group;
  hasShowerHead: boolean;
  showerHeadPos: THREE.Vector3;
}

/**
 * Safely converts product dimensions to feet for standardized 3D scaling.
 */
export function getProductDimensionsFeet(prod: KohlerProduct): { width: number; depth: number; height: number } {
  if (!prod.dimensions) return { width: 2.0, depth: 2.0, height: 2.0 };
  const unit = (prod.dimensions.unit || 'ft').toLowerCase();
  const scale = unit === 'in' ? 1 / 12 : unit === 'mm' ? 1 / 304.8 : 1.0;
  return {
    width: Math.max(0.2, prod.dimensions.width * scale),
    depth: Math.max(0.2, prod.dimensions.depth * scale),
    height: Math.max(0.2, prod.dimensions.height * scale),
  };
}

/**
 * Computes exact bounding box and center for a rotated fixture placement.
 */
export function getPlacementCenterAndBounds(p: FixturePlacement): {
  centerX: number;
  centerY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const w = p.width;
  const d = p.depth;
  const rot = p.rotation || 0;
  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localPts = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: d },
    { x: 0, y: d },
  ];

  const worldPts = localPts.map((pt) => ({
    x: p.x + pt.x * cos - pt.y * sin,
    y: p.y + pt.x * sin + pt.y * cos,
  }));

  const xs = worldPts.map((pt) => pt.x);
  const ys = worldPts.map((pt) => pt.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return { centerX, centerY, minX, minY, maxX, maxY };
}

export function buildProductMesh(
  prod: KohlerProduct,
  p: FixturePlacement,
  mats: FixtureMaterials
): BuildMeshResult {
  const group = new THREE.Group();
  let hasShowerHead = false;
  let showerHeadPos = new THREE.Vector3(0, 0, 0);

  const profile = getProductProfile(prod.id, prod.category);
  const dims = getProductDimensionsFeet(prod);
  const w = p.width > 0.4 ? p.width : dims.width;
  const d = p.depth > 0.4 ? p.depth : dims.depth;

  switch (profile.type) {
    case 'toilet': {
      const tData = profile.data;
      const isWallHung = tData.form === 'wall_hung' || tData.form === 'smart_wall_hung';
      const isSmart = tData.form === 'smart_floor' || tData.form === 'smart_wall_hung';
      const bowlRadius = (tData.bowlRadius || 0.4) * w;
      const baseElev = isWallHung ? 0.35 : 0;

      if (isSmart && tData.form === 'smart_floor') {
        // Numi 2.0 / Intelligent Floor: Monolithic faceted cuboid shell with tapered front
        const shroudH = tData.skirtHeight || 1.5;
        const mainBody = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.9, shroudH * 0.75, d * 0.9),
          mats.chinaWhite
        );
        mainBody.position.set(0, baseElev + (shroudH * 0.75) / 2, 0);
        mainBody.castShadow = true;
        group.add(mainBody);

        // Angled rear display panel
        const rearPanel = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.88, shroudH * 0.35, d * 0.25),
          mats.chinaWhite
        );
        rearPanel.position.set(0, baseElev + shroudH * 0.85, -d * 0.3);
        group.add(rearPanel);

        // Slim automatic lid
        const lid = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.78, 0.05, d * 0.65),
          mats.chinaWhite
        );
        lid.position.set(0, baseElev + shroudH * 0.76, 0.08);
        group.add(lid);
      } else if (isWallHung) {
        // Wall-hung: cantilevered bowl suspended above floor, no visible cistern
        const bowlH = 1.1;
        const bowlGeo = new THREE.CylinderGeometry(bowlRadius, bowlRadius * 0.7, bowlH, 24);
        bowlGeo.scale(1.0, 1.0, d / (bowlRadius * 2.2));
        const bowl = new THREE.Mesh(bowlGeo, mats.chinaWhite);
        bowl.position.set(0, baseElev + bowlH / 2, 0.1);
        bowl.castShadow = true;
        group.add(bowl);

        // Sleek slim seat
        const lid = new THREE.Mesh(
          new THREE.CylinderGeometry(bowlRadius * 1.02, bowlRadius * 1.02, 0.05, 24),
          mats.chinaWhite
        );
        lid.scale.set(1.0, 1.0, d / (bowlRadius * 2.2));
        lid.position.set(0, baseElev + bowlH + 0.03, 0.1);
        group.add(lid);
      } else if (tData.form === 'floor_one_piece') {
        // One-piece: continuous skirted body, integrated low-profile tank
        const skirtH = tData.skirtHeight || 1.45;
        const bowlGeo = new THREE.CylinderGeometry(bowlRadius, bowlRadius * 0.85, skirtH, 20);
        bowlGeo.scale(1.0, 1.0, (d * 0.6) / (bowlRadius * 2));
        const bowl = new THREE.Mesh(bowlGeo, mats.chinaWhite);
        bowl.position.set(0, skirtH / 2, d * 0.15);
        bowl.castShadow = true;
        group.add(bowl);

        // Seamless integrated tank
        const tankH = tData.tankHeight || 1.6;
        const tankGeo = new THREE.BoxGeometry(w * 0.85, tankH, d * 0.35);
        const tank = new THREE.Mesh(tankGeo, mats.chinaWhite);
        tank.position.set(0, tankH / 2, -d * 0.28);
        tank.castShadow = true;
        group.add(tank);

        // Lid
        const lid = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, 0.06, d * 0.55), mats.chinaWhite);
        lid.position.set(0, skirtH + 0.03, d * 0.15);
        group.add(lid);
      } else {
        // Standard two-piece: separate distinct rectangular tank + pedestal bowl + trapway
        const tankH = tData.tankHeight || 1.8;
        const tank = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.9, tankH, d * 0.32),
          mats.chinaWhite
        );
        tank.position.set(0, tankH / 2 + 0.4, -d * 0.28);
        tank.castShadow = true;
        group.add(tank);

        // Tank lid with bevel edge
        const tankLid = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.94, 0.1, d * 0.36),
          mats.chinaWhite
        );
        tankLid.position.set(0, tankH + 0.45, -d * 0.28);
        group.add(tankLid);

        // Oval Bowl
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(bowlRadius, bowlRadius * 0.65, 1.35, 20),
          mats.chinaWhite
        );
        bowl.position.set(0, 0.68, d * 0.15);
        bowl.castShadow = true;
        group.add(bowl);

        // Chrome trip lever
        const lever = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8),
          mats.fixtureMetal
        );
        lever.rotation.z = Math.PI / 2;
        lever.position.set(-w * 0.46, tankH + 0.2, -d * 0.25);
        group.add(lever);
      }

      // Ambient nightlight LED ring for Intelligent Veil/Numi
      if (tData.hasLedRing) {
        const led = new THREE.PointLight(0x38bdf8, 1.2, 3.5);
        led.position.set(0, baseElev + 0.3, 0.2);
        group.add(led);
      }
      break;
    }

    case 'basin': {
      const bData = profile.data;
      const bForm = bData.form;

      if (bForm === 'pedestal') {
        // Standalone Pedestal Sink: column reaching up from floor + molded basin top
        const pedStyle = bData.pedestalStyle || 'column';
        const pedH = 2.4;
        const pedGeo = pedStyle === 'art_deco'
          ? new THREE.BoxGeometry(0.55, pedH, 0.55)
          : new THREE.CylinderGeometry(0.28, 0.35, pedH, 16);
        const pedestal = new THREE.Mesh(pedGeo, mats.chinaWhite);
        pedestal.position.set(0, pedH / 2, 0);
        pedestal.castShadow = true;
        group.add(pedestal);

        // Basin top shelf
        const basinTop = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.4, d),
          mats.chinaWhite
        );
        basinTop.position.set(0, pedH + 0.2, 0);
        basinTop.castShadow = true;
        group.add(basinTop);

        // Inner basin cavity
        const cavity = new THREE.Mesh(
          new THREE.CylinderGeometry(w * 0.35, w * 0.25, 0.25, 20),
          mats.chinaWhite
        );
        cavity.position.set(0, pedH + 0.22, 0);
        group.add(cavity);

        // Integrated faucet
        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.65, 12),
          mats.fixtureMetal
        );
        spout.rotation.x = Math.PI / 8;
        spout.position.set(0, pedH + 0.6, -d * 0.3);
        group.add(spout);
      } else if (bForm === 'wall_hung_basin') {
        // Wall-hung basin with visible chrome P-trap below
        const basinElev = 2.6;
        const basin = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.45, d),
          mats.chinaWhite
        );
        basin.position.set(0, basinElev, 0);
        basin.castShadow = true;
        group.add(basin);

        // Chrome P-trap pipe
        const pTrap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12),
          mats.fixtureMetal
        );
        pTrap.position.set(0, basinElev - 0.5, -0.1);
        group.add(pTrap);
      } else if (bForm === 'vessel_round' || bForm === 'vessel_organic') {
        // Countertop vessel: round or organic curves
        const counterH = 2.7;
        // Countertop support shelf
        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(w * 1.3, 0.15, d * 1.3),
          mats.countertop
        );
        counter.position.set(0, counterH, 0);
        group.add(counter);

        const vH = bData.rimThickness ? bData.rimThickness * 1.1 : 0.45;
        const vRadius = Math.min(w, d) * 0.45;
        const vGeo = new THREE.CylinderGeometry(vRadius, vRadius * 0.75, vH, 28);
        if (bData.isOrganicCurve) {
          vGeo.scale(1.25, 1.0, 0.95);
        }
        const vessel = new THREE.Mesh(vGeo, mats.chinaWhite);
        vessel.position.set(0, counterH + vH / 2 + 0.08, 0);
        vessel.castShadow = true;
        group.add(vessel);

        // Tall vessel faucet
        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12),
          mats.fixtureMetal
        );
        spout.rotation.x = Math.PI / 8;
        spout.position.set(0, counterH + 0.65, -d * 0.45);
        group.add(spout);
      } else if (bForm === 'undermount_rect' || bForm === 'undermount_round') {
        // Sunken undermount basin inside countertop
        const counterH = 2.75;
        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(w * 1.25, 0.2, d * 1.25),
          mats.countertop
        );
        counter.position.set(0, counterH, 0);
        group.add(counter);

        const bowlGeo = bForm === 'undermount_round'
          ? new THREE.CylinderGeometry(w * 0.35, w * 0.25, 0.5, 20)
          : new THREE.BoxGeometry(w * 0.75, 0.5, d * 0.7);
        const bowl = new THREE.Mesh(bowlGeo, mats.chinaWhite);
        bowl.position.set(0, counterH - 0.2, 0);
        group.add(bowl);
      } else {
        // Forefront / Vox / Rectangular Vessel Basin
        const counterH = 2.7;
        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(w * 1.2, 0.15, d * 1.2),
          mats.countertop
        );
        counter.position.set(0, counterH, 0);
        group.add(counter);

        const vH = 0.45;
        const vessel = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.88, vH, d * 0.85),
          mats.chinaWhite
        );
        vessel.position.set(0, counterH + vH / 2 + 0.08, 0);
        vessel.castShadow = true;
        group.add(vessel);

        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.9, 12),
          mats.fixtureMetal
        );
        spout.rotation.x = Math.PI / 8;
        spout.position.set(0, counterH + 0.6, -d * 0.4);
        group.add(spout);
      }
      break;
    }

    case 'faucet': {
      const fData = profile.data;
      const fForm = fData.form;

      if (fForm === 'floor_filler') {
        // Freestanding floor-mount tub filler column (height ~2.2 ft)
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.09, 2.2, 16),
          mats.fixtureMetal
        );
        column.position.set(0, 1.1, 0);
        column.castShadow = true;
        group.add(column);

        // Curved high-arc spout
        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12),
          mats.fixtureMetal
        );
        spout.position.set(0, 2.3, 0.25);
        spout.rotation.x = Math.PI / 4;
        group.add(spout);

        // Handheld shower wand attached on side
        const wand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
          mats.fixtureMetal
        );
        wand.position.set(0.18, 1.9, 0);
        group.add(wand);
      } else if (fForm === 'wall_mount') {
        // Horizontal wall-mount spout + wall handles
        const elev = 3.3;
        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12),
          mats.fixtureMetal
        );
        spout.rotation.x = Math.PI / 2;
        spout.position.set(0, elev, 0.25);
        group.add(spout);

        // Dual wall handle rosettes
        [-0.3, 0.3].forEach((offX) => {
          const rosette = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16),
            mats.fixtureMetal
          );
          rosette.rotation.x = Math.PI / 2;
          rosette.position.set(offX, elev, 0.05);
          group.add(rosette);
        });
      } else if (fForm === 'widespread_two_lever' || fForm === 'widespread_cross') {
        // 3-piece widespread: central spout + 2 flanking handles
        const deckElev = 2.75;
        const spoutH = fData.spoutHeight || 0.75;
        const spout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.06, spoutH, 12),
          mats.fixtureMetal
        );
        spout.rotation.x = Math.PI / 9;
        spout.position.set(0, deckElev + spoutH / 2, 0.1);
        group.add(spout);

        // Handles
        [-0.32, 0.32].forEach((offX) => {
          if (fForm === 'widespread_cross') {
            // Cross handle
            const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), mats.fixtureMetal);
            const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), mats.fixtureMetal);
            bar1.position.set(offX, deckElev + 0.18, 0);
            bar2.position.set(offX, deckElev + 0.18, 0);
            group.add(bar1);
            group.add(bar2);
          } else {
            // Lever handle
            const lever = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), mats.fixtureMetal);
            lever.position.set(offX, deckElev + 0.18, 0.04);
            group.add(lever);
          }
        });
      } else if (fForm === 'waterfall') {
        // Beitou flat waterfall open-channel spout
        const deckElev = 2.75;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mats.fixtureMetal);
        body.position.set(0, deckElev + 0.28, 0);
        group.add(body);

        // Flat waterfall slide ledge
        const chute = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.45), mats.fixtureMetal);
        chute.position.set(0, deckElev + 0.55, 0.2);
        group.add(chute);
      } else {
        // Purist / Composed Tall Single-Lever Monobloc
        const deckElev = 2.75;
        const spoutH = fData.spoutHeight || 0.95;
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.055, spoutH, 16),
          mats.fixtureMetal
        );
        column.position.set(0, deckElev + spoutH / 2, 0);
        group.add(column);

        // Spout reach arm
        const reach = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12),
          mats.fixtureMetal
        );
        reach.rotation.x = Math.PI / 2.3;
        reach.position.set(0, deckElev + spoutH - 0.05, 0.16);
        group.add(reach);

        // Top lever handle
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.22), mats.fixtureMetal);
        handle.position.set(0, deckElev + spoutH + 0.04, 0.05);
        handle.rotation.x = -Math.PI / 12;
        group.add(handle);
      }
      break;
    }

    case 'shower': {
      const sData = profile.data;
      const sForm = sData.form;

      if (sForm === 'shower_door_pivot' || sForm === 'shower_door_walkin') {
        // Full-height glass shower enclosure panel (height ~6.8 ft)
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(w, 6.8, 0.05),
          mats.glass
        );
        panel.position.set(0, 3.4, d / 2);
        group.add(panel);

        // Chrome hinge & vertical handle
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8),
          mats.fixtureMetal
        );
        handle.position.set(w * 0.35, 3.4, d / 2 + 0.06);
        group.add(handle);
      } else if (sForm === 'handshower_slide_bar') {
        // Vertical slide rail along wall + handheld wand
        const railH = 2.4;
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, railH, 12),
          mats.fixtureMetal
        );
        rail.position.set(0, 5.0, -d * 0.4);
        group.add(rail);

        // Slider bracket and wand
        const wand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.035, 0.8, 12),
          mats.fixtureMetal
        );
        wand.rotation.z = Math.PI / 6;
        wand.position.set(0.12, 5.3, -d * 0.35);
        group.add(wand);
      } else if (sForm === 'shower_trim' || sForm === 'digital_valve') {
        // Wall-mounted valve plate / DTV digital control screen
        const trimGeo = sForm === 'digital_valve'
          ? new THREE.BoxGeometry(0.55, 0.4, 0.06)
          : new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24);
        const trim = new THREE.Mesh(trimGeo, sForm === 'digital_valve' ? mats.darkAccent : mats.fixtureMetal);
        trim.rotation.x = Math.PI / 2;
        trim.position.set(0, 3.8, -d * 0.45);
        group.add(trim);

        // Ergonomic lever / dial on trim
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), mats.fixtureMetal);
        dial.rotation.x = Math.PI / 2;
        dial.position.set(0, 3.8, -d * 0.45 + 0.08);
        group.add(dial);
      } else {
        // Rain Showerhead: Statement 12" / Moxie / Aquamac
        const discDiam = sData.discDiameter || 0.9;
        const discThick = sData.discThickness || 0.08;

        // Shower arm from ceiling/wall
        const armH = 1.3;
        const showerArm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, armH, 8),
          mats.fixtureMetal
        );
        showerArm.position.set(0, 6.8, -d * 0.25);
        showerArm.rotation.x = Math.PI / 4;
        group.add(showerArm);

        // Rain Spray Disc
        const discGeo = new THREE.CylinderGeometry(discDiam / 2, discDiam / 2, discThick, 28);
        const showerDisc = new THREE.Mesh(discGeo, mats.fixtureMetal);
        showerDisc.position.set(0, 6.6, -d * 0.25 + 0.5);
        group.add(showerDisc);

        // Moxie: Distinctive Harman Kardon central speaker dome in contrasting dark mesh!
        if (sData.hasSpeakerDome) {
          const speakerGeo = new THREE.CylinderGeometry((discDiam / 2) * 0.55, (discDiam / 2) * 0.55, discThick * 1.3, 20);
          const speaker = new THREE.Mesh(speakerGeo, mats.darkAccent);
          speaker.position.set(0, 6.59, -d * 0.25 + 0.5);
          group.add(speaker);
        }

        hasShowerHead = true;
        showerHeadPos = new THREE.Vector3(p.x + w / 2, 6.5, p.y + d / 2);
      }
      break;
    }

    case 'bathtub': {
      const bData = profile.data;
      const bForm = bData.form;

      if (bForm === 'freestanding_oval' || bForm === 'freestanding_clawfoot') {
        // Freestanding sculptural tub
        const tubH = 1.8;
        const tubGeo = new THREE.CylinderGeometry(w * 0.46, w * 0.38, tubH, 28);
        tubGeo.scale(1.0, 1.0, d / w);
        const tub = new THREE.Mesh(tubGeo, mats.chinaWhite);
        tub.position.set(0, bData.hasLegs ? tubH / 2 + 0.25 : tubH / 2, 0);
        tub.castShadow = true;
        group.add(tub);

        // Artifacts Clawfoot: 4 decorative plinth feet elevating the tub
        if (bData.hasLegs) {
          const footGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.25, 8);
          const footPositions = [
            [-w * 0.35, -d * 0.35],
            [w * 0.35, -d * 0.35],
            [-w * 0.35, d * 0.35],
            [w * 0.35, d * 0.35],
          ];
          footPositions.forEach(([fx, fz]) => {
            const foot = new THREE.Mesh(footGeo, mats.darkAccent);
            foot.position.set(fx, 0.12, fz);
            group.add(foot);
          });
        }
      } else {
        // Alcove / Drop-In (Underscore, Cimarron, Mariposa Whirlpool)
        const tubH = 1.7;
        // Outer surround / apron block
        const surround = new THREE.Mesh(
          new THREE.BoxGeometry(w, tubH, d),
          mats.chinaWhite
        );
        surround.position.set(0, tubH / 2, 0);
        surround.castShadow = true;
        group.add(surround);

        // Inner bathing well cavity
        const innerWell = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.82, tubH * 0.85, d * 0.82),
          mats.chinaWhite
        );
        innerWell.position.set(0, tubH / 2 + 0.15, 0);
        group.add(innerWell);

        // Whirlpool hydrotherapy jets (Mariposa)
        if (bData.hasJets) {
          [-0.35, 0, 0.35].forEach((offZ) => {
            const jet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), mats.fixtureMetal);
            jet1.rotation.z = Math.PI / 2;
            jet1.position.set(-w * 0.4, tubH * 0.5, offZ * d);
            group.add(jet1);

            const jet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), mats.fixtureMetal);
            jet2.rotation.z = Math.PI / 2;
            jet2.position.set(w * 0.4, tubH * 0.5, offZ * d);
            group.add(jet2);
          });
        }
      }
      break;
    }

    case 'vanity': {
      const vData = profile.data;
      const vForm = vData.form;
      const isFloating = vData.isFloating ?? true;
      const vanityElev = isFloating ? 0.8 : 0;
      const vanityH = isFloating ? 1.8 : 2.7;

      if (vForm === 'console') {
        // Seaport Console: open architectural frame with 4 slender legs and slatted bottom
        const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), mats.countertop);
        top.position.set(0, 2.7, 0);
        group.add(top);

        // 4 legs
        const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.7, 12);
        const legOffsets = [
          [-w * 0.45, -d * 0.45],
          [w * 0.45, -d * 0.45],
          [-w * 0.45, d * 0.45],
          [w * 0.45, d * 0.45],
        ];
        legOffsets.forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, mats.fixtureMetal);
          leg.position.set(lx, 1.35, lz);
          group.add(leg);
        });

        // Lower shelf
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.08, d * 0.85), mats.vanityWood);
        shelf.position.set(0, 0.8, 0);
        group.add(shelf);
      } else {
        // Cabinet Box (Single / Double / Floating / Floor)
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(w, vanityH, d),
          mats.vanityWood
        );
        cab.position.set(0, vanityElev + vanityH / 2, 0);
        cab.castShadow = true;
        group.add(cab);

        // Countertop plate (solid surface or marble)
        const counterMat = vData.counterMaterial === 'marble' ? mats.chinaWhite : mats.countertop;
        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.1, 0.15, d + 0.1),
          counterMat
        );
        counter.position.set(0, vanityElev + vanityH + 0.08, 0);
        group.add(counter);

        // Drawer divide lines
        const rows = vData.drawerRows || 2;
        for (let r = 1; r < rows; r++) {
          const divider = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.95, 0.02, 0.03),
            mats.darkAccent
          );
          divider.position.set(0, vanityElev + (vanityH / rows) * r, d / 2 + 0.01);
          group.add(divider);
        }
      }
      break;
    }

    case 'accessory': {
      const aData = profile.data;
      const aForm = aData.form;

      if (aForm === 'mirror_round') {
        // Circular Mirror
        const mRadius = (aData.width || 2.0) / 2;
        const mirrorMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(mRadius, mRadius, 0.04, 32),
          mats.mirror
        );
        mirrorMesh.rotation.x = Math.PI / 2;
        mirrorMesh.position.set(0, 4.8, 0);
        group.add(mirrorMesh);
      } else if (aForm === 'mirror_rect' || aForm === 'medicine_cabinet') {
        // Rectangular LED Mirror / Medicine Cabinet
        const mW = aData.width || 2.2;
        const mH = aData.height || 2.8;
        const mirrorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(mW, mH, aForm === 'medicine_cabinet' ? 0.35 : 0.05),
          mats.mirror
        );
        mirrorMesh.position.set(0, 4.8, 0);
        group.add(mirrorMesh);

        // Perimeter glowing LED backlight for Vitality LED mirror
        if (prod.id.includes('VITALITY') || prod.id.includes('VERDERA')) {
          const backLight = new THREE.PointLight(0xfff3d6, 0.9, 3.0);
          backLight.position.set(0, 4.8, 0.1);
          group.add(backLight);
        }
      } else if (aForm === 'towel_bar') {
        // Towel Bar Rod + Draped Towel
        const rodW = aData.width || 2.0;
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, rodW, 12), mats.fixtureMetal);
        rod.rotation.z = Math.PI / 2;
        rod.position.set(0, 3.5, 0.15);
        group.add(rod);

        const towel = new THREE.Mesh(new THREE.BoxGeometry(rodW * 0.7, 0.8, 0.05), mats.chinaWhite);
        towel.position.set(0, 3.1, 0.15);
        group.add(towel);
      } else if (aForm === 'towel_ring') {
        // Towel Ring
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 24), mats.fixtureMetal);
        ring.position.set(0, 3.8, 0.1);
        group.add(ring);
      } else if (aForm === 'robe_hook') {
        // Wall Hook
        const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.15, 8), mats.fixtureMetal);
        hook.rotation.x = Math.PI / 2;
        hook.position.set(0, 5.2, 0.08);
        group.add(hook);
      } else if (aForm === 'drain') {
        // Floor Drain Grate
        const drain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.4), mats.fixtureMetal);
        drain.position.set(0, 0.02, 0);
        group.add(drain);
      } else {
        // General accessory box
        const acc = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), mats.fixtureMetal);
        acc.position.set(0, 3.0, 0);
        group.add(acc);
      }
      break;
    }
  }

  return { fixtureGroup: group, hasShowerHead, showerHeadPos };
}
