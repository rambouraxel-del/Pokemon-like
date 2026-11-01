// Types élémentaires + table d'affinités (attaquant -> défenseur). Absent = x1.
export const TYPES = {
  normal: { name: 'Normal', color: '#a8a090' },
  flore:  { name: 'Flore',  color: '#58b848' },
  braise: { name: 'Braise', color: '#f06830' },
  onde:   { name: 'Onde',   color: '#4890e8' },
  eclat:  { name: 'Éclat',  color: '#e8c030' },
  ombre:  { name: 'Ombre',  color: '#7858b0' },
};
export const CHART = {
  flore:  { onde: 2, braise: 0.5, flore: 0.5 },
  braise: { flore: 2, onde: 0.5, braise: 0.5 },
  onde:   { braise: 2, flore: 0.5, onde: 0.5 },
  eclat:  { ombre: 2, eclat: 0.5 },
  ombre:  { eclat: 2, ombre: 0.5 },
};
export const effectiveness = (atkType, defType) => (CHART[atkType] && CHART[atkType][defType]) || 1;
