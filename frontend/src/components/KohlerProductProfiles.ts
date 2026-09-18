/**
 * KohlerProductProfiles.ts
 *
 * Product-specific 3D visual profile map for all 131 Kohler catalog products.
 * Keyed by internal product ID. All specs grounded from kohler_catalog.json.
 * Visual profiles drive parametric geometry selection in BathroomView3D.tsx.
 */

export type ToiletForm =
  | 'floor_two_piece'
  | 'floor_one_piece'
  | 'wall_hung'
  | 'smart_floor'
  | 'smart_wall_hung';

export type BasinForm =
  | 'vessel_rect'
  | 'vessel_round'
  | 'vessel_organic'
  | 'undermount_rect'
  | 'undermount_round'
  | 'semi_recessed'
  | 'wall_hung_basin'
  | 'pedestal';

export type FaucetForm =
  | 'tall_single_lever'
  | 'tall_single_knob'
  | 'widespread_two_lever'
  | 'widespread_cross'
  | 'wall_mount'
  | 'waterfall'
  | 'touchless'
  | 'floor_filler'
  | 'bath_mixer';

export type ShowerForm =
  | 'rain_round_large'
  | 'rain_round_small'
  | 'rain_square'
  | 'rain_multimedia'
  | 'handshower_slide_bar'
  | 'body_spray_array'
  | 'digital_valve'
  | 'shower_door_pivot'
  | 'shower_door_walkin'
  | 'shower_trim';

export type BathtubForm =
  | 'alcove_rect'
  | 'drop_in_rect'
  | 'freestanding_oval'
  | 'freestanding_clawfoot'
  | 'whirlpool';

export type VanityForm =
  | 'floating_single'
  | 'floating_double'
  | 'floor_single'
  | 'floor_double'
  | 'console';

export interface ToiletProfile {
  form: ToiletForm;
  hasLedRing?: boolean;
  hasTank?: boolean;
  tankHeight?: number;
  bowlRadius?: number;
  skirtHeight?: number;
  isRimless?: boolean;
  seatStyle?: 'standard' | 'slim';
}

export interface BasinProfile {
  form: BasinForm;
  aspectRatio?: number;
  rimThickness?: number;
  hasPedestal?: boolean;
  pedestalStyle?: 'slim' | 'column' | 'art_deco';
  isOrganicCurve?: boolean;
}

export interface FaucetProfile {
  form: FaucetForm;
  spoutHeight?: number;
  handleCount?: number;
  spoutReach?: number;
  hasAeratorDisc?: boolean;
}

export interface ShowerProfile {
  form: ShowerForm;
  discDiameter?: number;
  discThickness?: number;
  hasSpeakerDome?: boolean;
  armLength?: number;
}

export interface BathtubProfile {
  form: BathtubForm;
  hasApron?: boolean;
  hasLegs?: boolean;
  rimStyle?: 'flat' | 'rolled' | 'sculpted';
  hasJets?: boolean;
}

export interface VanityProfile {
  form: VanityForm;
  drawerRows?: number;
  hasOpenShelf?: boolean;
  counterMaterial?: 'solid_surface' | 'marble' | 'quartz';
  isFloating?: boolean;
  legStyle?: 'none' | 'round' | 'tapered';
}

export interface AccessoryProfile {
  form: 'mirror_round' | 'mirror_rect' | 'medicine_cabinet' | 'towel_bar' | 'towel_ring' | 'robe_hook' | 'drain' | 'grab_bar' | 'paper_holder' | 'niche' | 'basket';
  width?: number;
  height?: number;
}

export type ProductVisualProfile =
  | { type: 'toilet'; data: ToiletProfile }
  | { type: 'basin'; data: BasinProfile }
  | { type: 'faucet'; data: FaucetProfile }
  | { type: 'shower'; data: ShowerProfile }
  | { type: 'bathtub'; data: BathtubProfile }
  | { type: 'vanity'; data: VanityProfile }
  | { type: 'accessory'; data: AccessoryProfile };

export const KOHLER_PRODUCT_PROFILES: Record<string, ProductVisualProfile> = {
  // SMART TOILETS
  'K-NUMI2-01':            { type: 'toilet', data: { form: 'smart_floor', hasLedRing: true, hasTank: false, bowlRadius: 0.42, skirtHeight: 1.6, seatStyle: 'slim' } },
  'K-VEIL-WH-02':          { type: 'toilet', data: { form: 'smart_wall_hung', hasLedRing: true, hasTank: false, bowlRadius: 0.44, skirtHeight: 1.3, seatStyle: 'slim' } },
  'K-INNATE-01':           { type: 'toilet', data: { form: 'smart_floor', hasLedRing: false, hasTank: false, bowlRadius: 0.41, skirtHeight: 1.45, seatStyle: 'slim' } },
  'K-AIRIA-01':            { type: 'toilet', data: { form: 'smart_wall_hung', hasLedRing: false, hasTank: false, bowlRadius: 0.43, skirtHeight: 1.25, seatStyle: 'slim' } },
  'K-EIR-01':              { type: 'toilet', data: { form: 'smart_floor', hasLedRing: false, hasTank: false, bowlRadius: 0.4, skirtHeight: 1.5, seatStyle: 'slim' } },
  'K-NUMI-ORIG-01':        { type: 'toilet', data: { form: 'smart_floor', hasLedRing: true, hasTank: false, bowlRadius: 0.44, skirtHeight: 1.55, seatStyle: 'slim' } },
  'K-SAN-SOUCI-SMART-01':  { type: 'toilet', data: { form: 'smart_floor', hasLedRing: false, hasTank: false, bowlRadius: 0.4, skirtHeight: 1.4, seatStyle: 'slim' } },
  'K-PUREWASH-E790-01':    { type: 'toilet', data: { form: 'wall_hung', hasLedRing: false, hasTank: false, bowlRadius: 0.38, skirtHeight: 1.1, seatStyle: 'slim', isRimless: true } },
  // STANDARD TOILETS
  'K-MODERNLIFE-03':       { type: 'toilet', data: { form: 'wall_hung', hasTank: false, bowlRadius: 0.37, isRimless: true, seatStyle: 'slim' } },
  'K-CIMARRON-04':         { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.8, bowlRadius: 0.4, seatStyle: 'standard' } },
  'K-SAN-RAPHAEL-01':      { type: 'toilet', data: { form: 'floor_one_piece', hasTank: true, tankHeight: 1.6, bowlRadius: 0.39, skirtHeight: 1.5, seatStyle: 'standard' } },
  'K-MEMOIRS-TOILET-01':   { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.85, bowlRadius: 0.41, seatStyle: 'standard' } },
  'K-VEIL-TOILET-CONV-01': { type: 'toilet', data: { form: 'wall_hung', hasTank: false, bowlRadius: 0.38, isRimless: false, seatStyle: 'slim' } },
  'K-PATIO-01':            { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.7, bowlRadius: 0.36, seatStyle: 'standard' } },
  'K-SAN-MARTINE-01':      { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.75, bowlRadius: 0.39, seatStyle: 'standard' } },
  'K-DEVONSHIRE-TOILET-01':{ type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.9, bowlRadius: 0.42, seatStyle: 'standard' } },
  'K-REACH-UP-01':         { type: 'toilet', data: { form: 'floor_one_piece', hasTank: true, tankHeight: 1.55, bowlRadius: 0.38, skirtHeight: 1.35, seatStyle: 'slim' } },
  'K-CORBELLE-01':         { type: 'toilet', data: { form: 'floor_one_piece', hasTank: true, tankHeight: 1.6, bowlRadius: 0.4, skirtHeight: 1.45, seatStyle: 'slim' } },
  'K-WELLWORTH-01':        { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.8, bowlRadius: 0.38, seatStyle: 'standard' } },
  'K-ODEON-WH-01':         { type: 'toilet', data: { form: 'wall_hung', hasTank: false, bowlRadius: 0.37, isRimless: false, seatStyle: 'slim' } },
  'K-BRACKEN-01':          { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.75, bowlRadius: 0.38, seatStyle: 'standard' } },
  'K-SAN-SOUCI-ROUND-01':  { type: 'toilet', data: { form: 'floor_one_piece', hasTank: true, tankHeight: 1.55, bowlRadius: 0.36, skirtHeight: 1.3, seatStyle: 'slim' } },
  'K-BETTER-LIVING-ADA-TOILET-01': { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.9, bowlRadius: 0.43, seatStyle: 'standard' } },
  'K-PANACHE-WH-01':       { type: 'toilet', data: { form: 'wall_hung', hasTank: false, bowlRadius: 0.39, isRimless: false, seatStyle: 'standard' } },
  'K-PRESQU-ILE-01':       { type: 'toilet', data: { form: 'wall_hung', hasTank: false, bowlRadius: 0.38, isRimless: true, seatStyle: 'slim' } },
  'K-SAN-RAPHAEL-COMFORT-01': { type: 'toilet', data: { form: 'floor_one_piece', hasTank: true, tankHeight: 1.65, bowlRadius: 0.41, skirtHeight: 1.5, seatStyle: 'standard' } },
  // BASINS
  'K-FOREFRONT-01':        { type: 'basin', data: { form: 'vessel_rect', aspectRatio: 1.34, rimThickness: 0.42 } },
  'K-VEIL-BASIN-01':       { type: 'basin', data: { form: 'vessel_organic', aspectRatio: 1.33, rimThickness: 0.38, isOrganicCurve: true } },
  'K-CAXTON-01':           { type: 'basin', data: { form: 'undermount_rect', aspectRatio: 1.5, rimThickness: 0.3 } },
  'K-LADENA-01':           { type: 'basin', data: { form: 'undermount_rect', aspectRatio: 1.35, rimThickness: 0.28 } },
  'K-VOX-RECT-01':         { type: 'basin', data: { form: 'vessel_rect', aspectRatio: 1.4, rimThickness: 0.4 } },
  'K-CHALICE-ROUND-01':    { type: 'basin', data: { form: 'vessel_round', aspectRatio: 1.0, rimThickness: 0.35 } },
  'K-MEMOIRS-PEDESTAL-01': { type: 'basin', data: { form: 'pedestal', hasPedestal: true, pedestalStyle: 'art_deco', aspectRatio: 1.2 } },
  'K-VEIL-VESSEL-ROUND-01':{ type: 'basin', data: { form: 'vessel_round', aspectRatio: 1.0, rimThickness: 0.3, isOrganicCurve: true } },
  'K-VERNON-WALL-BASIN-01':{ type: 'basin', data: { form: 'wall_hung_basin', aspectRatio: 1.3, rimThickness: 0.28 } },
  'K-MANSFIELD-SEMIREC-01':{ type: 'basin', data: { form: 'semi_recessed', aspectRatio: 1.35, rimThickness: 0.32 } },
  'K-CONICAL-BELL-01':     { type: 'basin', data: { form: 'vessel_round', aspectRatio: 1.0, rimThickness: 0.45 } },
  'K-MICA-ROUND-01':       { type: 'basin', data: { form: 'vessel_round', aspectRatio: 1.0, rimThickness: 0.3 } },
  'K-VERTICYL-01':         { type: 'basin', data: { form: 'undermount_round', aspectRatio: 1.0, rimThickness: 0.25 } },
  'K-DEVONSHIRE-PEDESTAL-01': { type: 'basin', data: { form: 'pedestal', hasPedestal: true, pedestalStyle: 'column', aspectRatio: 1.15 } },
  'K-BOULEVARD-VESSEL-01': { type: 'basin', data: { form: 'vessel_rect', aspectRatio: 1.2, rimThickness: 0.38 } },
  'K-ARCHER-UNDERMOUNT-01':{ type: 'basin', data: { form: 'undermount_rect', aspectRatio: 1.45, rimThickness: 0.26 } },
  'K-MINIMAL-ROUND-BASIN-01': { type: 'basin', data: { form: 'vessel_round', aspectRatio: 1.0, rimThickness: 0.25 } },
  // FAUCETS
  'K-PURIST-01':           { type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 1.05, handleCount: 1, spoutReach: 0.6, hasAeratorDisc: true } },
  'K-ARTIFACTS-FAUCET-01': { type: 'faucet', data: { form: 'widespread_two_lever', spoutHeight: 0.8, handleCount: 2, spoutReach: 0.45, hasAeratorDisc: false } },
  'K-COMPOSED-01':         { type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 0.95, handleCount: 1, spoutReach: 0.5, hasAeratorDisc: true } },
  'K-PURIST-WALL-FAUCET-01': { type: 'faucet', data: { form: 'wall_mount', spoutHeight: 0.7, handleCount: 2, spoutReach: 0.55, hasAeratorDisc: true } },
  'K-DEVONSHIRE-FAUCET-01':{ type: 'faucet', data: { form: 'widespread_two_lever', spoutHeight: 0.7, handleCount: 2, spoutReach: 0.4, hasAeratorDisc: false } },
  'K-AVID-FAUCET-01':      { type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 0.85, handleCount: 1, spoutReach: 0.5, hasAeratorDisc: true } },
  'K-TAUT-FAUCET-01':      { type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 0.9, handleCount: 1, spoutReach: 0.45, hasAeratorDisc: true } },
  'K-PARALLEL-FAUCET-01':  { type: 'faucet', data: { form: 'widespread_two_lever', spoutHeight: 0.75, handleCount: 2, spoutReach: 0.42, hasAeratorDisc: true } },
  'K-BEITOU-WATERFALL-01': { type: 'faucet', data: { form: 'waterfall', spoutHeight: 0.9, handleCount: 1, spoutReach: 0.55, hasAeratorDisc: false } },
  'K-SENSATE-TOUCHLESS-01':{ type: 'faucet', data: { form: 'touchless', spoutHeight: 0.85, handleCount: 0, spoutReach: 0.52, hasAeratorDisc: true } },
  'K-MEMOIRS-FAUCET-01':   { type: 'faucet', data: { form: 'widespread_cross', spoutHeight: 0.72, handleCount: 2, spoutReach: 0.4, hasAeratorDisc: false } },
  'K-JULIUS-FAUCET-01':    { type: 'faucet', data: { form: 'tall_single_knob', spoutHeight: 1.0, handleCount: 1, spoutReach: 0.48, hasAeratorDisc: true } },
  'K-REFINED-WALL-FAUCET-01': { type: 'faucet', data: { form: 'wall_mount', spoutHeight: 0.65, handleCount: 2, spoutReach: 0.5, hasAeratorDisc: true } },
  'K-MALLECO-TOUCH-FAUCET-01': { type: 'faucet', data: { form: 'touchless', spoutHeight: 0.9, handleCount: 1, spoutReach: 0.5, hasAeratorDisc: true } },
  'K-ALEO-WALL-MIXER-01':  { type: 'faucet', data: { form: 'wall_mount', spoutHeight: 0.68, handleCount: 2, spoutReach: 0.5, hasAeratorDisc: true } },
  'K-FINIAL-TRAD-FAUCET-01': { type: 'faucet', data: { form: 'widespread_cross', spoutHeight: 0.7, handleCount: 2, spoutReach: 0.4, hasAeratorDisc: false } },
  'K-PURIST-FLOOR-FILLER-01': { type: 'faucet', data: { form: 'floor_filler', spoutHeight: 2.2, handleCount: 2, spoutReach: 0.6, hasAeratorDisc: false } },
  'K-MODERNLIFE-FAUCET-01':{ type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 0.88, handleCount: 1, spoutReach: 0.47, hasAeratorDisc: true } },
  'K-HONOLULU-WALL-FAUCET-01': { type: 'faucet', data: { form: 'wall_mount', spoutHeight: 0.75, handleCount: 2, spoutReach: 0.52, hasAeratorDisc: false } },
  'K-ARCHER-FAUCET-01':    { type: 'faucet', data: { form: 'widespread_two_lever', spoutHeight: 0.78, handleCount: 2, spoutReach: 0.42, hasAeratorDisc: true } },
  'K-SINGULIER-BATH-FILLER-01': { type: 'faucet', data: { form: 'bath_mixer', spoutHeight: 1.1, handleCount: 1, spoutReach: 0.65, hasAeratorDisc: false } },
  // SHOWERS
  'K-STATEMENT-01':        { type: 'shower', data: { form: 'rain_round_large', discDiameter: 1.0, discThickness: 0.08, armLength: 1.2 } },
  'K-MOXIE-02':            { type: 'shower', data: { form: 'rain_multimedia', discDiameter: 0.65, discThickness: 0.1, hasSpeakerDome: true, armLength: 0.9 } },
  'K-AQUAMAC-RAIN-01':     { type: 'shower', data: { form: 'rain_round_large', discDiameter: 0.9, discThickness: 0.09, armLength: 1.0 } },
  'K-RAIN-ROUND-10-01':    { type: 'shower', data: { form: 'rain_round_large', discDiameter: 0.83, discThickness: 0.07, armLength: 1.1 } },
  'K-HYDRO-RAIL-01':       { type: 'shower', data: { form: 'handshower_slide_bar', discDiameter: 0.4, discThickness: 0.07, armLength: 2.5 } },
  'K-STATEMENT-HANDSHOWER-01': { type: 'shower', data: { form: 'handshower_slide_bar', discDiameter: 0.38, discThickness: 0.06, armLength: 2.2 } },
  'K-SHIFT-HANDSHOWER-01': { type: 'shower', data: { form: 'handshower_slide_bar', discDiameter: 0.32, discThickness: 0.06, armLength: 2.0 } },
  'K-RENEW-HANDSHOWER-01': { type: 'shower', data: { form: 'handshower_slide_bar', discDiameter: 0.3, discThickness: 0.05, armLength: 1.8 } },
  'K-PURIST-VALVE-TRIM-01':{ type: 'shower', data: { form: 'shower_trim', discDiameter: 0.25, discThickness: 0.04 } },
  'K-THERMOSTATIC-TRIM-01':{ type: 'shower', data: { form: 'shower_trim', discDiameter: 0.28, discThickness: 0.05 } },
  'K-DTV-MODE-DIGITAL-01': { type: 'shower', data: { form: 'digital_valve', discDiameter: 0.3, discThickness: 0.04 } },
  'K-LEVO-DOOR-01':        { type: 'shower', data: { form: 'shower_door_pivot', discDiameter: 0.15, discThickness: 0.05 } },
  'K-REVEL-PIVOT-01':      { type: 'shower', data: { form: 'shower_door_pivot', discDiameter: 0.15, discThickness: 0.05 } },
  'K-GRADMATE-WALKIN-01':  { type: 'shower', data: { form: 'shower_door_walkin', discDiameter: 0.15, discThickness: 0.05 } },
  'K-ROUND-WATERFALL-SHOWER-01': { type: 'shower', data: { form: 'rain_round_large', discDiameter: 0.9, discThickness: 0.12, armLength: 1.1 } },
  'K-WATERTILE-BODYSPRAY-01': { type: 'shower', data: { form: 'body_spray_array', discDiameter: 0.2, discThickness: 0.06, armLength: 1.5 } },
  'K-DEVONSHIRE-SHOWER-TRIM-01': { type: 'shower', data: { form: 'shower_trim', discDiameter: 0.25, discThickness: 0.04 } },
  'K-EXHALE-FILTER-SHOWER-01': { type: 'shower', data: { form: 'rain_round_small', discDiameter: 0.55, discThickness: 0.09, armLength: 0.8 } },
  'K-AWAKEN-SHOWER-SET-01':{ type: 'shower', data: { form: 'rain_round_small', discDiameter: 0.5, discThickness: 0.07, armLength: 0.9 } },
  'K-ARCHER-SHOWER-TRIM-01': { type: 'shower', data: { form: 'shower_trim', discDiameter: 0.26, discThickness: 0.04 } },
  // BATHTUBS
  'K-UNDERSCORE-01':       { type: 'bathtub', data: { form: 'drop_in_rect', hasApron: false, hasLegs: false, rimStyle: 'flat', hasJets: false } },
  'K-ARTIFACTS-BATH-02':   { type: 'bathtub', data: { form: 'freestanding_clawfoot', hasApron: false, hasLegs: true, rimStyle: 'rolled', hasJets: false } },
  'K-CIMARRON-ALCOVE-BATH-01': { type: 'bathtub', data: { form: 'alcove_rect', hasApron: true, hasLegs: false, rimStyle: 'flat', hasJets: false } },
  'K-VEIL-FREESTANDING-BATH-01': { type: 'bathtub', data: { form: 'freestanding_oval', hasApron: false, hasLegs: false, rimStyle: 'sculpted', hasJets: false } },
  'K-ARCHER-ALCOVE-BATH-01': { type: 'bathtub', data: { form: 'alcove_rect', hasApron: true, hasLegs: false, rimStyle: 'flat', hasJets: false } },
  'K-VOLUTE-FREESTANDING-01': { type: 'bathtub', data: { form: 'freestanding_oval', hasApron: false, hasLegs: false, rimStyle: 'rolled', hasJets: false } },
  'K-MARIPOSA-WHIRLPOOL-01': { type: 'bathtub', data: { form: 'whirlpool', hasApron: true, hasLegs: false, rimStyle: 'flat', hasJets: true } },
  'K-MEMOIRS-ALCOVE-BATH-01': { type: 'bathtub', data: { form: 'alcove_rect', hasApron: true, hasLegs: false, rimStyle: 'sculpted', hasJets: false } },
  'K-SUNSTRUCK-OVAL-BATH-01': { type: 'bathtub', data: { form: 'freestanding_oval', hasApron: false, hasLegs: false, rimStyle: 'rolled', hasJets: false } },
  // VANITIES
  'K-HARKEN-VANITY-01':    { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: true } },
  'K-MEMOIRS-VANITY-01':   { type: 'vanity', data: { form: 'floor_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'marble', isFloating: false } },
  'K-JAS-VANITY-01':       { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: true } },
  'K-JUTE-VANITY-01':      { type: 'vanity', data: { form: 'floating_single', drawerRows: 3, hasOpenShelf: false, counterMaterial: 'quartz', isFloating: true } },
  'K-DEVONSHIRE-VANITY-01':{ type: 'vanity', data: { form: 'floor_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'marble', isFloating: false } },
  'K-SILICON-VALLEY-VANITY-01': { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, hasOpenShelf: true, counterMaterial: 'solid_surface', isFloating: true } },
  'K-TRESSORE-VANITY-01':  { type: 'vanity', data: { form: 'floor_single', drawerRows: 3, hasOpenShelf: false, counterMaterial: 'marble', isFloating: false } },
  'K-MAXSTOW-VANITY-01':   { type: 'vanity', data: { form: 'floating_single', drawerRows: 3, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: true } },
  'K-VERA-DOUBLE-VANITY-01': { type: 'vanity', data: { form: 'floating_double', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: true } },
  'K-DAMASK-VANITY-01':    { type: 'vanity', data: { form: 'floor_double', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'quartz', isFloating: false } },
  'K-BRITTON-VANITY-01':   { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, hasOpenShelf: true, counterMaterial: 'solid_surface', isFloating: true } },
  'K-SOK-CORNER-VANITY-01':{ type: 'vanity', data: { form: 'floor_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: false } },
  'K-SEAPORT-CONSOLE-01':  { type: 'vanity', data: { form: 'console', drawerRows: 1, hasOpenShelf: true, counterMaterial: 'solid_surface', isFloating: false, legStyle: 'round' } },
  'K-ARRESTO-VANITY-01':   { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'solid_surface', isFloating: true } },
  'K-ARCHER-VANITY-01':    { type: 'vanity', data: { form: 'floor_single', drawerRows: 2, hasOpenShelf: false, counterMaterial: 'quartz', isFloating: false } },
  // ACCESSORIES & MIRRORS
  'K-AIGNER-ROUND-MIRROR-01': { type: 'accessory', data: { form: 'mirror_round', width: 2.0, height: 2.0 } },
  'K-VITALITY-LED-MIRROR-01': { type: 'accessory', data: { form: 'mirror_rect', width: 2.5, height: 3.0 } },
  'K-MAXSTOW-MED-CABINET-01': { type: 'accessory', data: { form: 'medicine_cabinet', width: 2.0, height: 2.5 } },
  'K-VERDERA-01':          { type: 'accessory', data: { form: 'medicine_cabinet', width: 2.5, height: 3.0 } },
  'K-VERDERA-SINGLE-DOOR-01': { type: 'accessory', data: { form: 'medicine_cabinet', width: 1.5, height: 2.5 } },
  'K-MODERNLIFE-MIRROR-01':{ type: 'accessory', data: { form: 'mirror_rect', width: 2.0, height: 2.5 } },
  'K-PURIST-TOWEL-BAR-24-01': { type: 'accessory', data: { form: 'towel_bar', width: 2.0, height: 0.2 } },
  'K-DEVONSHIRE-TOWEL-BAR-01': { type: 'accessory', data: { form: 'towel_bar', width: 2.5, height: 0.2 } },
  'K-MEMOIRS-TOWEL-RING-01': { type: 'accessory', data: { form: 'towel_ring', width: 0.8, height: 0.8 } },
  'K-ALEO-TOWEL-RING-01':  { type: 'accessory', data: { form: 'towel_ring', width: 0.75, height: 0.75 } },
  'K-PURIST-ROBE-HOOK-01': { type: 'accessory', data: { form: 'robe_hook', width: 0.4, height: 0.4 } },
  'K-DEVONSHIRE-ROBE-HOOK-01': { type: 'accessory', data: { form: 'robe_hook', width: 0.4, height: 0.4 } },
  'K-LINEAGE-DRAIN-01':    { type: 'accessory', data: { form: 'drain', width: 0.25, height: 0.05 } },
  'K-STATEMENT-DRAIN-SQUARE-01': { type: 'accessory', data: { form: 'drain', width: 0.3, height: 0.05 } },
  'K-SHOWER-NICHE-01':     { type: 'accessory', data: { form: 'niche', width: 1.0, height: 1.0 } },
  'K-ARTIFACTS-HOTELIER-01': { type: 'accessory', data: { form: 'towel_bar', width: 1.5, height: 0.2 } },
  'K-PURIST-GRAB-BAR-01':  { type: 'accessory', data: { form: 'grab_bar', width: 1.5, height: 0.15 } },
  'K-PURIST-PAPER-HOLDER-01': { type: 'accessory', data: { form: 'paper_holder', width: 0.6, height: 0.5 } },
  'K-DEVONSHIRE-PAPER-HOLDER-01': { type: 'accessory', data: { form: 'paper_holder', width: 0.6, height: 0.5 } },
  'K-CONTEMPORARY-CORNER-BASKET-01': { type: 'accessory', data: { form: 'basket', width: 0.8, height: 0.5 } },
  'K-PURETIDE-MANUAL-01':  { type: 'accessory', data: { form: 'paper_holder', width: 0.8, height: 0.5 } },
  'K-CUFF-HEALTH-FAUCET-01': { type: 'accessory', data: { form: 'grab_bar', width: 0.5, height: 0.5 } },
  'K-CLEAN-TOUCH-SPRAY-01':{ type: 'accessory', data: { form: 'grab_bar', width: 0.5, height: 0.5 } },
};

export function getProductProfile(productId: string, category: string): ProductVisualProfile {
  const mapped = KOHLER_PRODUCT_PROFILES[productId];
  if (mapped) return mapped;
  const cat = category.toLowerCase();
  if (cat.includes('smart_toilet') || cat.includes('toilet')) {
    return { type: 'toilet', data: { form: 'floor_two_piece', hasTank: true, tankHeight: 1.75, bowlRadius: 0.38 } };
  }
  if (cat.includes('basin')) {
    return { type: 'basin', data: { form: 'vessel_rect', aspectRatio: 1.35, rimThickness: 0.35 } };
  }
  if (cat.includes('faucet')) {
    return { type: 'faucet', data: { form: 'tall_single_lever', spoutHeight: 0.85, handleCount: 1, spoutReach: 0.5 } };
  }
  if (cat.includes('shower')) {
    return { type: 'shower', data: { form: 'rain_round_large', discDiameter: 0.75, discThickness: 0.08 } };
  }
  if (cat.includes('bathtub') || cat.includes('bath')) {
    return { type: 'bathtub', data: { form: 'alcove_rect', hasApron: true, hasLegs: false, rimStyle: 'flat' } };
  }
  if (cat.includes('vanity')) {
    return { type: 'vanity', data: { form: 'floating_single', drawerRows: 2, isFloating: true, counterMaterial: 'solid_surface' } };
  }
  return { type: 'accessory', data: { form: 'mirror_rect', width: 1.5, height: 1.5 } };
}
