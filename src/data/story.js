// Histoire, dialogues et événements scriptés. `w` = API de la scène d'exploration (voir scenes/world.js).
// Pour modifier un texte ou un événement, éditer ce fichier uniquement.
import { SPECIES } from './species.js';
import { TYPES } from './types.js';
import { G } from '../systems/game.js';
import { makeCreature } from '../systems/creatures.js';

export const INTRO_PAGES = [
  "Depuis toujours, le Phare des Lueurs veille sur le village d'Aubépine.",
  "Il brille grâce à l'Éclat du Prisme, un cristal ancien caché dans le Sanctuaire.",
  "Mais la nuit dernière, la lumière s'est éteinte... et l'Éclat a disparu.",
  "Toi, Noa, tu t'apprêtes à te lancer dans une aventure avec les Lumins, ces créatures nées de la lumière.",
];

export function objective(g = G) {
  const f = g.s.flags, n = g.s.team.length;
  if (!f.starter) return "Va voir le Professeur Sauge au laboratoire : le grand bâtiment bleu, au centre du village.";
  if (!f.gateOpen) {
    if (n < 2) return "Prends la route de l'est vers la forêt de Brumevert et capture un 2e Lumin dans les hautes herbes. Le gardien du sceau l'exige.";
    return "Rends-toi au nord-est de la forêt de Brumevert : le Gardien Orme ouvrira le sceau du Sanctuaire.";
  }
  if (!f.bossBeaten) return "Entre dans le Sanctuaire des Lueurs et affronte Maître Vesper dans la salle principale.";
  if (!f.ending) return "Replace l'Éclat du Prisme sur l'autel du sanctuaire.";
  return "Aventure terminée ! Explore librement, soigne-toi, et complète le bestiaire (8 espèces).";
}

// le rival prend le Lumin que le tien domine : un premier combat accessible
const COUNTER = { feuillin: 'gouttelin', braisillon: 'feuillin', gouttelin: 'braisillon' };
const name = (id) => SPECIES[id].name;

export function rivalTeam(stage) {
  const rs = G.s.flags.rivalStarter || 'braisillon';
  return stage === 1 ? [[rs, 5]] : [[rs, 8], ['plumette', 7]];
}

// Texte de règles des combats affiché au 1er combat
export const BATTLE_TIPS = [
  "Astuce : choisis ATTAQUE puis une capacité. Les types comptent : Flore > Onde > Braise > Flore.",
  "Astuce : Éclat et Ombre se craignent mutuellement. Les capacités vertes/bleues peuvent aussi soigner ou renforcer.",
];

export const SCRIPTS = {
  // ----- maison -----
  async mom(w) {
    if (!G.flag('starter')) {
      await w.say(["Noa ! Enfin réveillé ! Le Phare s'est éteint cette nuit... tout le village est sens dessus dessous.", "Le Professeur Sauge veut te voir. Son laboratoire est le grand bâtiment bleu, au centre du village."]);
    } else if (G.flag('ending')) {
      await w.say(["Le Phare brille de nouveau ! Je suis si fière de toi, Noa.", "Repose-toi un peu. Je m'occupe de tes Lumins."]);
      await w.healTeam({ map: 'home', x: 4, y: 5, dir: 'down' }, true);
    } else {
      await w.say(["Prends soin de toi et de tes Lumins, Noa. Viens te reposer quand tu veux."]);
      await w.healTeam({ map: 'home', x: 4, y: 5, dir: 'down' }, true);
    }
  },
  async bed(w) { await w.say(["C'est ton lit. Pas le moment de dormir : il y a un village à sauver !"]); },
  async homeTable(w) { await w.say(["Sur la table, un mot de Maman : « Prends un bon petit-déjeuner ! »"]); },
  async homeShelf(w) { await w.say(["Des livres sur les Lumins. L'un d'eux parle d'un Prisme qui dort dans un sanctuaire..."]); },

  // ----- laboratoire -----
  async labIntro(w) {
    const prof = w.npc('prof');
    await w.say(["Ah, Noa ! Te voilà enfin.", "Le Phare est éteint : l'Éclat du Prisme a été volé dans le Sanctuaire des Lueurs, au nord de la forêt de Brumevert.", "Pour y entrer, il faut être accompagné. Les Lumins, nés de la lumière, répondent à ceux qui les respectent.", "Ces trois orbes abritent des Lumins de départ. Approche-toi d'un orbe pour en savoir plus, puis choisis ton compagnon !"], prof.name);
    G.setFlag('labIntro');
  },
  async prof(w) {
    const f = G.s.flags;
    if (!f.starter) { await w.say(["Choisis ton premier compagnon parmi les trois orbes. Approche-toi d'un orbe et appuie sur A."], 'Pr Sauge'); return; }
    if (f.ending) { await w.say(["Le Phare est rallumé, et grâce à toi le Sanctuaire est en paix. Je rédige déjà un livre sur cette aventure !", "N'oublie pas de compléter ton bestiaire : il y a 8 espèces à découvrir."], 'Pr Sauge'); return; }
    if (!f.gateOpen) { await w.say(["Direction l'est, la forêt de Brumevert. Capture au moins un autre Lumin : le Gardien Orme n'ouvre le sceau qu'aux dresseurs accompagnés.", "Si tes Lumins sont fatigués, reviens à la Maison des Soins : c'est gratuit !"], 'Pr Sauge'); return; }
    await w.say(["Le sceau est ouvert ? Alors le Sanctuaire t'attend. Soigne-toi bien avant d'entrer, et prends des Baumes !"], 'Pr Sauge');
  },
  async aide(w) {
    if (G.flag('ending')) { await w.say(["Tout le village parle de toi !"]); return; }
    await w.say(["Les Lumins sont plus à l'aise face à un type qu'ils dominent. Flore bat Onde, Onde bat Braise, Braise bat Flore.", "Éclat et Ombre s'affaiblissent mutuellement !"]);
  },
  async rivalLab(w) { await w.say(["Je t'attends, Noa ! Choisis vite ton Lumin : je prendrai celui qui gagne contre le tien !"], 'Lior'); },
  async labTable(w) { await w.say(["Des notes : « Les Lanternes de capture sont plus efficaces sur un Lumin affaibli. »"]); },
  async labShelf(w) { await w.say(["Des ouvrages sur l'histoire du Phare et des Lumins."]); },

  async pedestal(w, id) {
    if (G.flag('starter')) { await w.say(["L'orbe est vide : son Lumin est parti avec son dresseur."]); return; }
    if (!G.flag('labIntro')) { await w.say(["Le Professeur Sauge veut te parler avant. Va le voir !"]); return; }
    const sp = SPECIES[id];
    await w.say([`Un orbe lumineux. À l'intérieur : ${sp.name}, un Lumin de type ${TYPES[sp.type].name}.`, sp.desc]);
    const r = await w.ask(`Choisir ${sp.name} ?`, ['Oui', 'Non']);
    if (r !== 0) return;
    G.addCreature(makeCreature(id, 5));
    G.setFlag('starter', id);
    G.setFlag('rivalStarter', COUNTER[id]);
    w.sfx('levelup');
    await w.say([`${sp.name} rejoint ton équipe !`]);
    G.save();
    await SCRIPTS.rivalFirst(w);
  },
  async rivalFirst(w) {
    const rival = w.npc('rival_lab');
    const rs = G.flag('rivalStarter');
    await w.say([`Super choix ! Moi, je prends ${name(rs)}. Tu as l'avantage de type, mais ça ne me fait pas peur !`, "On fait un petit match d'essai ? Je vais te montrer qui est le meilleur dresseur d'Aubépine !"], 'Lior');
    await w.say(["Pr Sauge : Un combat se joue au tour par tour. Choisis ATTAQUE, puis une capacité. Le plus rapide frappe en premier.", "Pr Sauge : Fais attention aux types : Flore bat Onde, Onde bat Braise, Braise bat Flore. Ton Lumin a l'avantage !"], null);
    const res = await w.trainerBattle({ trainer: { id: 'rival1', cls: 'Rival', trainerName: 'Lior', team: rivalTeam(1), reward: 100, rivalStage: 1 }, npc: rival, tutorial: true, noDefeat: true });
    if (res === 'win') await w.say(["Lior : Aïe ! Tu es doué... Mais je m'entraînerai et je te rattraperai !"]); else await w.say(["Lior : Ha ! Facile ! Entraîne-toi un peu avant de partir."]);
    w.healTeamSilent();
    await w.say(["Pr Sauge : Bien joué ! Voici de quoi t'aider : cinq Lanternes pour capturer des Lumins sauvages, et des Baumes pour les soigner."]);
    w.give('lanterne', 5, true); w.give('baume', 3, true); G.s.money += 200;
    w.sfx('confirm');
    await w.say(["(Tu reçois 5 Lanternes, 3 Baumes et 200 écus !)", "Pr Sauge : Dans la forêt de Brumevert, à l'est, les hautes herbes abritent des Lumins sauvages. Affaiblis-les, puis lance une Lanterne !", "Pr Sauge : Le Gardien du sceau n'ouvre le Sanctuaire qu'aux dresseurs accompagnés d'au moins deux Lumins. Bonne chance, Noa !"]);
    await w.say(["Lior : Je file à la forêt ! Tu vas voir, c'est moi qui retrouverai l'Éclat !"]);
    G.setFlag('rival1');
    G.setFlag('lanternGiven');
    G.save();
    w.sfx('save');
    w.toast('Partie sauvegardée');
  },

  // ----- boutique / soins -----
  async shop(w) {
    await w.say(["Bienvenue à la Boutique Lanterne !"], 'Marchand');
    await w.openShop();
    await w.say(["Merci de ta visite ! Reviens quand tu veux."], 'Marchand');
  },
  async shopCustomer(w) { await w.say(["Les Lanternes se vendent comme des petits pains depuis que le Phare s'est éteint."]); },
  async nurse(w) {
    await w.say(["Bienvenue à la Maison des Soins ! Nous soignons tous les Lumins, gratuitement."], 'Infirmière');
    const r = await w.ask('Soigner tes Lumins ?', ['Oui', 'Non']);
    if (r === 0) { await w.healTeam({ map: 'village', x: 23, y: 8, dir: 'down' }, false); await w.say(["Voilà ! Tes Lumins sont en pleine forme. À bientôt !"], 'Infirmière'); }
    else await w.say(["Reviens quand tu veux."], 'Infirmière');
  },
  async pc(w) {
    await w.say(["Le Gestionnaire de réserve. Tu peux y ranger tes Lumins en trop."]);
    await w.openBox();
  },

  // ----- village -----
  async papy(w) {
    if (G.flag('ending')) { await w.say(["Le Phare brille ! Mes vieux yeux n'en croient pas leurs..., euh, leurs yeux !"]); return; }
    await w.say(["Autrefois, on voyait le Phare à des lieues. Sans lui, les Lumins se sentent perdus."]);
  },
  async kid(w) {
    if (!G.flag('starter')) { await w.say(["Tu as vu ? Le Phare est éteint ! C'est la panique !"]); return; }
    await w.say(["Le centre de soins est à côté du magasin. Tout y est gratuit !"]);
  },
  async dame(w) {
    await w.say(["Conseil : garde toujours quelques Baumes. Et pense à ta Réserve (menu) pour changer de Lumin."]);
  },
  async jardinier(w) { await w.say(["Mes fleurs poussent mieux depuis que des Feuillins s'y promènent."]); },
  async blockExit(w) {
    await w.say(["Tu ne peux pas partir sans compagnon ! Va d'abord voir le Professeur Sauge, au labo."]);
    await w.playerWalk(['left', 'left']);
  },

  // ----- forêt -----
  async lea(w) {
    if (G.flag('ending')) { await w.say(["Le sanctuaire est libéré ? Génial !"]); return; }
    await w.say(["Salut ! Pour capturer un Lumin : affaiblis-le d'abord, puis choisis OBJET > Lanterne.", "Plus ses PV sont bas, plus la capture est facile. Une Lanterne n'est perdue que si tu la lances vraiment !"]);
  },
  async rivalForest(w, npc) {
    const rs = G.flag('rivalStarter');
    await w.say(["Lior : Te voilà ! J'ai déjà exploré toute la forêt.", "Lior : Le gardien refuse de m'ouvrir le sceau... Il faut deux Lumins ! Mais d'abord, un combat !"]);
    const res = await w.trainerBattle({ trainer: { id: 'rival2', cls: 'Rival', trainerName: 'Lior', team: rivalTeam(2), reward: 250, rivalStage: 2 }, npc });
    if (res !== 'win') return;
    G.setFlag('rival2');
    await w.say(["Lior : Bien joué... Tiens, prends ces Baumes. Je vais capturer un deuxième Lumin, moi aussi.", "Lior : Au nord-est, il y a une source de lumière qui soigne tout le monde. Profites-en !"]);
    w.give('baume', 2, true); w.sfx('confirm');
    await w.say(["(Tu reçois 2 Baumes.)"]);
    w.hideNpc(npc);
  },
  async gardien(w, npc) {
    const n = G.s.team.length;
    if (G.flag('gateOpen')) return;
    if (n < 2) {
      await w.say(["Halte ! Le sceau du Sanctuaire des Lueurs ne s'ouvre qu'aux dresseurs accompagnés d'au moins DEUX Lumins.", "Capture-en un dans les hautes herbes, avec une Lanterne. Reviens ensuite me voir."], npc.name);
      return;
    }
    await w.say([`${n} Lumins à tes côtés... La lumière te reconnaît.`, "Le sceau s'ouvre. Va, jeune dresseur, et rends la lumière à Aubépine !"], npc.name);
    G.setFlag('gateOpen');
    w.sfx('door');
    w.hideNpc(w.npc('gardien')); w.hideNpc(w.npc('gardienne'));
    w.toast('Le sceau est ouvert !');
    G.save();
  },
  async spring(w) {
    await w.say(["Une source de lumière scintille. Son eau est tiède et apaisante."]);
    const r = await w.ask('Se baigner dans la source ?', ['Oui', 'Non']);
    if (r === 0) { await w.healTeam(w.springSpot(), true); await w.say(["Tes Lumins sont revigorés !"]); }
  },

  // ----- sanctuaire -----
  async runeW(w) { await w.say(["Une stèle gravée : « La lumière n'appartient à personne, elle se partage. »"]); },
  async runeE(w) { await w.say(["Une stèle gravée : « Quand la nuit tombe, les Lumins veillent sur nous. »"]); },
  async vesperIntro(w) {
    if (G.flag('vesperMet')) return;
    G.setFlag('vesperMet');
    const v = w.npc('vesper');
    await w.say(["Vesper : ... Tu as passé mes disciples. Alors tu es celui qui veut reprendre l'Éclat."], 'Maître Vesper');
    await w.say(["Vesper : Regarde Ténébrume. Gardienne du Sanctuaire depuis mille ans... Elle s'éteignait. J'ai pris l'Éclat pour la sauver.", "Vesper : Mais le cristal l'a changée, et maintenant elle ne m'obéit plus. Je dois la protéger !"], 'Maître Vesper');
    await SCRIPTS.vesper(w, v, true);
  },
  async vesper(w, npc, introDone) {
    if (G.flag('bossBeaten')) {
      if (!G.flag('ending')) { await w.say(["Vesper : Replace l'Éclat sur l'autel, je t'en prie."], 'Maître Vesper'); return; }
      await w.say(["Vesper : Merci, Noa. Je vais reconstruire ce que j'ai brisé, avec les villageois."], 'Maître Vesper');
      return;
    }
    if (!introDone) await w.say(["Vesper : Montre-moi que ton lien avec tes Lumins est sincère !"], 'Maître Vesper');
    else await w.say(["Vesper : Je ne te laisserai pas approcher de l'autel sans te battre !"], 'Maître Vesper');
    const res = await w.trainerBattle({ trainer: { id: 'vesper', cls: 'Gardien', trainerName: 'Maître Vesper', team: [['noctule', 11], ['lucioline', 11], ['tenebrume', 13]], reward: 500, boss: true, items: ['grand_baume'] }, npc });
    if (res !== 'win') return;
    G.setFlag('bossBeaten');
    G.save();
    await w.say(["Vesper : ... Je vois. Elle t'a laissé gagner la bataille... pour mieux se libérer.", "Vesper : L'Éclat du Prisme, le voici. Place-le sur l'autel : lui seul peut apaiser Ténébrume."], 'Maître Vesper');
    await w.teleportPlayer(7, 2, 'up');
    await SCRIPTS.altar(w);
  },
  async altar(w) {
    if (G.flag('ending')) { await w.say(["L'Éclat du Prisme rayonne doucement sur l'autel."]); return; }
    if (!G.flag('bossBeaten')) { await w.say(["Un autel ancien. Un creux en forme de cristal est vide... La salle est gardée !"]); return; }
    await w.say(["Tu poses l'Éclat du Prisme dans le creux de l'autel..."]);
    await w.beacon();
    await w.say(["Une lumière dorée envahit la salle. Ténébrume se redresse, ses yeux redeviennent clairs.", "Au loin, par la porte du Sanctuaire, tu vois le Phare d'Aubépine se rallumer."]);
    await w.say(["Vesper : Merci... Ténébrume semble t'apprécier, Noa. Elle veut t'accompagner."], 'Maître Vesper');
    const res = G.addCreature(makeCreature('tenebrume', 13));
    w.sfx('catch');
    await w.say([`Ténébrume rejoint ${res === 'team' ? "ton équipe" : 'ta réserve'} !`]);
    G.setFlag('ending');
    G.save();
    await w.openEnding();
  },
  async tenebrumeNpc(w) {
    if (!G.flag('bossBeaten')) { await w.say(["Ténébrume gronde sourdement. Son cristal pulse d'une lueur sombre..."]); return; }
    await w.say(["Ténébrume te regarde, apaisée."]);
  },

  // ----- dresseurs génériques -----
  async trainer(w, npc) {
    const t = npc.trainer;
    if (G.s.defeated[t.id]) { await w.say(t.after, npc.name); return; }
    await w.say(t.intro, npc.name);
    await w.trainerBattle({ trainer: { ...t, trainerName: npc.name }, npc });
  },
};
