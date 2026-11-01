# Notes de projet – LUMINA (prototype 0.1)

## Décisions
- **Stack** : Vite + JavaScript (modules ES), Canvas 2D 320×192 mis à l'échelle (pixels nets, `image-rendering: pixelated`). Aucune dépendance runtime hors la police pixel (`@fontsource/press-start-2p`, embarquée au build).
- **Assets** : 100 % procéduraux (aucun fichier image/son) → `gfx/pixel.js` (formes + ombrage « cel » + contour automatique), sprites créatures 64×64 (vues face/dos), personnages 16×24, tuiles 16×16, bâtiments en volume (toit + façade + côté), arbres/objets triés en profondeur (le joueur passe derrière canopées et toits), herbe haute dessinée devant les pieds.
- **Audio** : synthé WebAudio (pistes `TRACKS` dans `core/audio.js`, effets `sfx()`), initialisé au premier geste (clavier/toucher) ; volume + sourdine persistés (`lumina_settings`).
- **Scripts/événements** : `async/await` partout (`ui.say`, `ui.choose`, `clock.wait`, `fx.out/in`) → les dialogues et cutscènes s'écrivent comme du code linéaire (`data/story.js`).
- **Sauvegarde** : `localStorage` clé `lumina_save`, objet `version:1`. Pour changer le format : incrémenter `SAVE_VERSION` (config.js) et ajouter une migration dans `core/save.js` (`MIGRATIONS`). Autosave : changement de carte, choix du starter, soins, victoires de dresseurs, ouverture du sceau, fin.
- **Équilibrage** : PV = ⌊2·base·N/100⌋+N+10 ; dégâts façon Pokémon (STAB ×1.5, affinité ×2/×0.5, critique 1/16) ; XP rapide (3·N²) + 50 % pour l'équipe non engagée ; capture = f(PV restants, taux de l'espèce, lanterne).
- **Rival** : prend le Lumin que le tien domine (1er combat accessible). **Sceau** : exige ≥ 2 Lumins → force la capture.
- **Défaite** : retour au dernier point de soin utilisé (maison/Maison des Soins/source), équipe soignée, pas de perte d'argent.

## Intrigue provisoire
Le Phare d'Aubépine s'éteint : l'Éclat du Prisme a disparu du Sanctuaire. Maître Vesper l'a pris pour sauver Ténébrume, gardienne mourante, mais le cristal l'a corrompue. On bat Vesper, on replace l'Éclat, Ténébrume rejoint l'équipe, le Phare se rallume.

## Travail restant / idées
- Évolutions, statuts (sommeil, poison), PP des attaques, objets tenus, vente d'objets, surnoms, choix du nom/aspect du héros.
- Combats doubles, plus de zones/villes, quêtes secondaires, jour/nuit, météo.
- Vrais sprites/tuiles dessinés à la main (remplacer `gfx/*`), vraie musique.
- Animations d'attaque propres à chaque capacité (aujourd'hui : une par type).
- Tests automatisés en CI (le script `tools/playthrough.cjs` existe mais nécessite Playwright + navigateur).
- Mode portrait tactile : jouable mais paysage recommandé ; PWA/manifest à ajouter.

## Vérifié / non vérifié
Voir la section « Vérifications » du compte rendu final dans le README ou l'historique de session.
