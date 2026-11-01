# LUMINA – L'Éclat Perdu

Premier prototype jouable d'un jeu de capture de créatures (les **Lumins**) dans le navigateur.
Vue de dessus inclinée façon Nintendo DS, pixel art 100 % généré par code, musique et sons synthétisés (aucun fichier externe).
Aventure de 20 à 30 minutes : village d'Aubépine → forêt de Brumevert → Sanctuaire des Lueurs → combat final.

## Lancer le jeu

```bash
npm install
npm run dev        # http://localhost:5173 (accessible sur le réseau local pour tester sur téléphone)
npm run build      # produit dist/ (hébergement statique, chemins relatifs)
npm run preview    # sert dist/
npm run check      # vérifie les données (cartes accessibles, scripts, références)
```

Hébergement de test : le workflow `.github/workflows/pages.yml` déploie `dist/` sur GitHub Pages à chaque push sur `main`
(à activer une fois dans *Settings → Pages → Source : GitHub Actions*). N'importe quel hébergement statique convient (Netlify, itch.io, etc.).

## Commandes

| Action | Clavier | Tactile |
|---|---|---|
| Se déplacer | Flèches ou ZQSD / WASD | Croix directionnelle |
| Valider / parler | Espace, Entrée, E | Bouton **A** |
| Retour / courir (maintenu) | X, Retour arrière, Maj | Bouton **B** |
| Menu | Échap, Tab, M | Bouton **MENU** |

Le bouton ♫ (en haut à droite) coupe/rétablit le son ; le volume se règle dans Menu → Options.
Sur iPhone : le son démarre au premier toucher (et l'interrupteur silencieux du téléphone coupe aussi le son web) ; préférer le mode paysage (une bulle l'indique en portrait) ; « Ajouter à l'écran d'accueil » permet de jouer en plein écran.

## Contenu

- 8 espèces originales (3 compagnons de départ au choix), 6 types dont 5 avec affinités (Flore > Onde > Braise > Flore, Éclat ⇄ Ombre).
- 4 attaques max par Lumin : dégâts, soin, modification de stats ; XP, niveaux, apprentissage d'attaques.
- Combats 1v1 au tour par tour : attaque, objet, changement, fuite (sauvages uniquement), capture (plus facile si affaibli).
- Équipe de 6 + réserve, bestiaire (vu / capturé), sac, boutique, soins gratuits (Maison des Soins, sources de lumière, maman).
- Sauvegarde locale (`localStorage`, version 1) automatique aux changements de zone / après événements importants + manuelle (Menu → Sauvegarder).
- Défaite : retour au dernier point de soin, équipe soignée, aucun blocage.

## Structure

```
src/
  main.js            boucle, mise à l'échelle, commandes tactiles
  config.js          constantes
  core/              input, audio (synthé WebAudio + pistes), save, ui (boîtes/menus), scènes & transitions, horloge
  data/              species, moves, items, types, maps (+ mapbuilder), story (dialogues & événements)
  gfx/               pixel (moteur de pixel art), creatures, characters, tiles/bâtiments, effets de combat
  systems/           game (état global), creatures (stats, XP)
  scenes/            title/intro, world, battle, menu, team, bag, dex, box, shop, options, ending
tools/               check-data.mjs (vérif. des données), bot.js + playthrough.cjs (test automatisé de bout en bout)
docs/NOTES.md        décisions et travail restant
```

Ajouter du contenu : une espèce → `data/species.js` + un peintre dans `gfx/creatures.js` ; une attaque → `data/moves.js` ;
un objet → `data/items.js` ; une carte/PNJ/dresseur → `data/maps.js` ; un dialogue ou événement → `data/story.js`.

## Tests

`node tools/playthrough.cjs` (avec `npm run dev` lancé) joue toute l'aventure dans Chromium (Playwright) via les vraies entrées du jeu et
échoue si la fin n'est pas atteinte. Voir `docs/NOTES.md` pour le détail de ce qui est vérifié.
