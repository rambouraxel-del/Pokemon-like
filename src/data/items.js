// kind: 'ball' (capture, mult = bonus) | 'heal' (hp fixe) | 'revive' (fraction des PV max) | 'key'
export const ITEMS = {
  lanterne:      { id: 'lanterne', name: 'Lanterne', kind: 'ball', mult: 1, price: 50, desc: 'Cage de lumière pour capturer une créature sauvage.' },
  super_lanterne:{ id: 'super_lanterne', name: 'Super lanterne', kind: 'ball', mult: 1.8, price: 120, desc: 'Plus efficace que la lanterne classique.' },
  baume:         { id: 'baume', name: 'Baume', kind: 'heal', hp: 30, price: 40, desc: 'Rend 30 PV à une créature.' },
  grand_baume:   { id: 'grand_baume', name: 'Grand baume', kind: 'heal', hp: 80, price: 100, desc: 'Rend 80 PV à une créature.' },
  rappel:        { id: 'rappel', name: 'Rappel', kind: 'revive', frac: 0.5, price: 150, desc: 'Réveille une créature K.O. avec la moitié de ses PV.' },
};
export const SHOP_STOCK = ['lanterne', 'super_lanterne', 'baume', 'grand_baume', 'rappel'];
