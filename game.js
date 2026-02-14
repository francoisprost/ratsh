const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a', // Fond gris foncé (sol de donjon)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Pas de gravité (vue de dessus)
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors; // Pour les flèches (tir)
let keys;    // Pour ZQSD (mouvement)
let bullets;
let walls;   // Déplacé en global pour être accessible par loadRoom
let doors;   // Nouveau groupe pour les portes
let enemies;
let enemyBullets; // Nouveau groupe pour les tirs ennemis
let lastFired = 0;
let fireRate = 250; // Délai entre les tirs en ms (Variable)
let playerDamage = 1; // Dégâts du joueur
let projectileCount = 1; // Nombre de projectiles
let playerSpeed = 200;
const DEFAULT_SPEED = 200;
const BULLET_SPEED = 400;
const ENEMY_SPEED = 80;
let dungeon = []; // La grille du donjon
let roomX = 5;    // Position actuelle X dans la grille
let roomY = 5;    // Position actuelle Y dans la grille
let minimapGraphics; // Pour dessiner la carte
let isRoomLocked = false; // État de verrouillage de la salle
let heartsGroup; // Groupe pour l'UI des cœurs
let gameOverText; // Texte de fin de jeu
let isGameOver = false;
let maxHealth = 3;
const DEFAULT_MAX_HEALTH = 3;
let bossHealthBar; // Barre de vie du boss
let currentHealth = maxHealth;
let lastDamageTime = 0;
const DAMAGE_COOLDOWN = 1000; // 1 seconde d'invincibilité
let coins = 0;
let coinText;
let pickups;
let shopItems; // Groupe pour les objets du magasin
let shopTexts; // Groupe pour les prix
let level = 1;
let levelText;
let statsText; // Texte pour les stats
let stairs;
let treasureChest; // Groupe pour le coffre

function preload() {
    // Création de textures placeholder dynamiques (Pixel Art simulé)
    
    // 1. Joueur : Image externe (player.png doit être dans le dossier du jeu)
    this.load.image('player', 'player.png');

    // Outil graphique pour les autres textures générées
    let bg = this.make.graphics({ x: 0, y: 0 });

    // 2. Ennemi (Carré Rouge)
    bg.fillStyle(0xff3333, 1);
    bg.fillRect(0, 0, 32, 32);
    bg.generateTexture('enemy', 32, 32);

    // 3. Projectile (Petit rond jaune)
    bg.clear();
    bg.fillStyle(0xffff00, 1);
    bg.fillCircle(8, 8, 6);
    bg.generateTexture('bullet', 16, 16);

    // 4. Mur (Gris clair)
    bg.clear();
    bg.fillStyle(0x888888, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('wall', 40, 40);

    // 5. Porte (Carré Vert foncé)
    bg.clear();
    bg.fillStyle(0x006600, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('door', 40, 40);

    // 6. Porte Verrouillée (Carré Rouge)
    bg.clear();
    bg.fillStyle(0xff0000, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('door_locked', 40, 40);

    // 7. Cœur (UI - Plein)
    bg.clear();
    bg.fillStyle(0xff0000, 1);
    bg.fillCircle(10, 10, 8);
    bg.generateTexture('heart', 20, 20);

    // 8. Cœur vide (UI - Vide/Gris)
    bg.clear();
    bg.fillStyle(0x555555, 1);
    bg.fillCircle(10, 10, 8);
    bg.generateTexture('heart_empty', 20, 20);

    // 9. Ennemi Tireur (Carré Violet)
    bg.clear();
    bg.fillStyle(0x9933ff, 1);
    bg.fillRect(0, 0, 32, 32);
    bg.generateTexture('enemy_shooter', 32, 32);

    // 10. Projectile Ennemi (Petit rond orange)
    bg.clear();
    bg.fillStyle(0xff9900, 1);
    bg.fillCircle(6, 6, 4);
    bg.generateTexture('enemy_bullet', 12, 12);

    // 11. Boss (Grand Carré Noir/Rouge)
    bg.clear();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, 64, 64);
    bg.lineStyle(4, 0xff0000, 1);
    bg.strokeRect(0, 0, 64, 64);
    bg.generateTexture('boss', 64, 64);

    // 12. Projectile Boss (Grand rond rouge)
    bg.fillStyle(0xff0000, 1);
    bg.fillCircle(10, 10, 8);
    bg.generateTexture('boss_bullet', 20, 20);

    // 13. Pièce (Petit rond jaune doré)
    bg.clear();
    bg.fillStyle(0xffd700, 1);
    bg.fillCircle(8, 8, 6);
    bg.generateTexture('coin', 16, 16);

    // 14. Cœur à ramasser (Similaire à l'UI mais en objet)
    bg.clear();
    bg.fillStyle(0xff0000, 1);
    bg.fillCircle(8, 8, 6);
    bg.generateTexture('pickup_heart', 16, 16);

    // 15. Item Max HP (Carré Vert avec +)
    bg.clear();
    bg.fillStyle(0x00ff00, 1);
    bg.fillRect(0, 0, 32, 32);
    bg.lineStyle(4, 0xffffff, 1);
    bg.beginPath();
    bg.moveTo(16, 8);
    bg.lineTo(16, 24);
    bg.moveTo(8, 16);
    bg.lineTo(24, 16);
    bg.strokePath();
    bg.generateTexture('item_maxhp', 32, 32);

    // 16. Item Speed (Carré Bleu Cyan)
    bg.clear();
    bg.fillStyle(0x00ffff, 1);
    bg.fillRect(0, 0, 32, 32);
    bg.generateTexture('item_speed', 32, 32);

    // 17. Escalier (Carré Bleu foncé avec lignes)
    bg.clear();
    bg.fillStyle(0x0000cc, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.lineStyle(4, 0xaaaaaa, 1);
    bg.beginPath();
    bg.moveTo(5, 10); bg.lineTo(35, 10);
    bg.moveTo(5, 20); bg.lineTo(35, 20);
    bg.moveTo(5, 30); bg.lineTo(35, 30);
    bg.strokePath();
    bg.generateTexture('stairs', 40, 40);

    // 18. Porte Shop (Jaune)
    bg.clear();
    bg.fillStyle(0xffff00, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('door_shop', 40, 40);

    // 19. Porte Boss (Rouge Sombre)
    bg.clear();
    bg.fillStyle(0x880000, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('door_boss', 40, 40);

    // 20. Porte Trésor (Orange/Or)
    bg.clear();
    bg.fillStyle(0xffaa00, 1);
    bg.fillRect(0, 0, 40, 40);
    bg.generateTexture('door_treasure', 40, 40);

    // 21. Coffre au trésor (Carré Marron avec serrure dorée)
    bg.clear();
    bg.fillStyle(0x8b4513, 1);
    bg.fillRect(0, 0, 32, 32);
    bg.fillStyle(0xffd700, 1); // Serrure
    bg.fillRect(12, 10, 8, 8);
    bg.generateTexture('chest', 32, 32);
}

function create() {
    // --- Initialisation des groupes ---
    walls = this.physics.add.staticGroup();
    doors = this.physics.add.staticGroup();
    enemies = this.physics.add.group();
    pickups = this.physics.add.group();
    stairs = this.physics.add.staticGroup();
    treasureChest = this.physics.add.staticGroup();
    shopItems = this.physics.add.staticGroup();
    shopTexts = this.add.group();
    enemyBullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 50,
        runChildUpdate: true
    });
    bullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 30,
        runChildUpdate: true
    });
    
    minimapGraphics = this.add.graphics();
    minimapGraphics.setDepth(20); // Au-dessus du joueur (qui est à 10)

    bossHealthBar = this.add.graphics();
    bossHealthBar.setDepth(50);
    bossHealthBar.setScrollFactor(0);

    // --- UI Pièces ---
    coinText = this.add.text(650, 20, 'Pièces: 0', {
        fontSize: '24px',
        fill: '#ffd700'
    });
    coinText.setScrollFactor(0);
    coinText.setDepth(50);

    // --- UI Niveau ---
    levelText = this.add.text(650, 50, 'Étage: 1', {
        fontSize: '24px',
        fill: '#ffffff'
    });
    levelText.setScrollFactor(0);
    levelText.setDepth(50);

    // --- UI Santé ---
    heartsGroup = this.add.group();
    updateHealthUI(this);

    // --- UI Stats ---
    statsText = this.add.text(20, 220, '', {
        fontSize: '16px',
        fill: '#cccccc',
        lineSpacing: 5
    });
    statsText.setScrollFactor(0);
    statsText.setDepth(50);
    updateStatsUI();

    // --- Game Over Screen ---
    gameOverText = this.add.text(400, 300, 'GAME OVER\nCliquer pour recommencer', {
        fontSize: '40px',
        fill: '#ff0000',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 10, y: 10 }
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0); // Fixe par rapport à la caméra
    gameOverText.setVisible(false);
    gameOverText.setDepth(100);

    this.input.on('pointerdown', () => {
        if (isGameOver) restartGame(this);
    });

    // --- Génération du Donjon ---
    generateDungeon();

    // --- Joueur ---
    player = this.physics.add.sprite(400, 300, 'player');
    
    // Ajustement de la hitbox : on garde un cœur de 40x40 (20*2) pour éviter de bloquer
    player.body.setSize(20, 20);
    
    player.setCollideWorldBounds(true);
    player.setDepth(10); // Le joueur est au-dessus des portes

    // --- Chargement de la première salle ---
    loadRoom(this);

    // --- Contrôles ---
    // Flèches pour tirer
    cursors = this.input.keyboard.createCursorKeys();
    // ZQSD / WASD pour bouger
    keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.Z,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.Q,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // --- Collisions ---
    this.physics.add.collider(player, walls);
    this.physics.add.collider(enemies, walls);
    this.physics.add.collider(enemies, doors); // Les ennemis ne passent pas les portes
    this.physics.add.collider(enemies, enemies); // Les ennemis se poussent entre eux

    // Collision Balle -> Mur (La balle disparait)
    this.physics.add.collider(bullets, walls, (bullet, wall) => {
        bullet.destroy();
    });

    // Collision Balle Ennemi -> Mur
    this.physics.add.collider(enemyBullets, walls, (bullet, wall) => {
        bullet.destroy();
    });

    // Collision Balle -> Ennemi (Les deux disparaissent pour l'instant)
    this.physics.add.overlap(bullets, enemies, (bullet, enemy) => {
        bullet.destroy();
        
        // Gestion des PV de l'ennemi
        let currentHp = enemy.getData('hp') - playerDamage;
        enemy.setData('hp', currentHp);

        if (enemy.getData('type') === 'boss') {
            updateBossHealthBar(this, currentHp, enemy.getData('maxHp'));
        }

        // Effet de flash blanc
        enemy.setTintFill(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.clearTint();
            }
        });

        if (currentHp <= 0) {
            enemy.destroy();
            if (enemy.getData('type') === 'boss') bossHealthBar.clear();
        }

        // Vérification de fin de salle (si l'ennemi vient de mourir)
        if (enemies.countActive() === 0) {
            dungeon[roomY][roomX].cleared = true;
            // Déverrouiller les portes
            isRoomLocked = false;
            doors.getChildren().forEach(door => door.setTexture(getDoorTexture(door.name)));
            
            drawMinimap(); // Mettre à jour la carte (changement de couleur potentielle)
            
            if (dungeon[roomY][roomX].type === 'boss') {
                stairs.create(400, 300, 'stairs');
                treasureChest.create(400, 200, 'chest'); // Coffre de récompense
            } else {
                spawnRoomReward(this, 400, 300); // Apparition potentielle d'un objet
            }
        }
        // Ici on pourrait ajouter un score ou une animation d'explosion
    });

    // Collision Ennemi -> Joueur (Game Over ou dégâts)
    this.physics.add.overlap(player, enemies, (player, enemy) => {
        if (isGameOver) return;
        const time = this.time.now;
        if (time > lastDamageTime + DAMAGE_COOLDOWN) {
            takeDamage(this);
            lastDamageTime = time;
        }
    });

    // Collision Balle Ennemi -> Joueur
    this.physics.add.overlap(player, enemyBullets, (player, bullet) => {
        bullet.destroy();
        if (isGameOver) return;
        const time = this.time.now;
        if (time > lastDamageTime + DAMAGE_COOLDOWN) {
            takeDamage(this);
            lastDamageTime = time;
        }
    });

    // Collision Joueur -> Objets à ramasser
    this.physics.add.overlap(player, pickups, (player, pickup) => {
        collectPickup(this, pickup);
    });

    // Collision Joueur -> Shop Items
    this.physics.add.overlap(player, shopItems, (player, item) => {
        buyItem(this, item);
    });

    // Collision Joueur -> Escalier
    this.physics.add.overlap(player, stairs, (player, stair) => {
        nextLevel(this);
    });

    // Collision Joueur -> Coffre
    this.physics.add.overlap(player, treasureChest, (player, chest) => {
        openTreasureChest(this, chest);
    });

    // Collision Joueur -> Porte (Changement de salle)
    this.physics.add.overlap(player, doors, (player, door) => {
        if (!isRoomLocked) {
            changeRoom(door.name, this);
        }
    });
}

function generateDungeon() {
    // Initialiser une grille vide 10x10
    for (let y = 0; y < 10; y++) {
        dungeon[y] = [];
        for (let x = 0; x < 10; x++) {
            // Chaque case contient maintenant un objet d'état
            dungeon[y][x] = { active: false, visited: false, cleared: false, type: 'normal', pickups: [], shopData: null, treasureOpen: false };
        }
    }
    
    // Marche aléatoire pour créer les salles
    let cx = 5, cy = 5; // Départ au centre
    roomX = cx;
    roomY = cy;
    dungeon[cy][cx].active = true;
    dungeon[cy][cx].visited = true;
    dungeon[cy][cx].cleared = true; // La salle de départ est sûre
    dungeon[cy][cx].type = 'start';

    for (let i = 0; i < 15; i++) { // Générer 15 salles
        let dir = Phaser.Math.Between(0, 3);
        if (dir === 0) cy--;      // Nord
        else if (dir === 1) cy++; // Sud
        else if (dir === 2) cx--; // Ouest
        else if (dir === 3) cx++; // Est

        // Garder dans les limites 0-9
        cx = Phaser.Math.Clamp(cx, 0, 9);
        cy = Phaser.Math.Clamp(cy, 0, 9);
        dungeon[cy][cx].active = true;
    }

    // Trouver la salle la plus éloignée pour le Boss
    let maxDist = 0;
    let bossRoomCoords = { x: 5, y: 5 };

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            if (dungeon[y][x].active) {
                // Distance de Manhattan par rapport au centre (5,5)
                let dist = Math.abs(x - 5) + Math.abs(y - 5);
                if (dist > maxDist) {
                    maxDist = dist;
                    bossRoomCoords = { x: x, y: y };
                }
            }
        }
    }
    // Définir la salle du boss
    dungeon[bossRoomCoords.y][bossRoomCoords.x].type = 'boss';

    // Définir la salle du Magasin (Shop)
    // On cherche une salle active qui n'est ni le départ ni le boss
    let shopPlaced = false;
    let attempts = 0;
    while (!shopPlaced && attempts < 100) {
        let rx = Phaser.Math.Between(0, 9);
        let ry = Phaser.Math.Between(0, 9);
        let room = dungeon[ry][rx];
        if (room.active && room.type === 'normal' && (rx !== 5 || ry !== 5)) {
             room.type = 'shop';
             shopPlaced = true;
        }
        attempts++;
    }

    // Définir la salle du Trésor
    let treasurePlaced = false;
    attempts = 0;
    while (!treasurePlaced && attempts < 100) {
        let rx = Phaser.Math.Between(0, 9);
        let ry = Phaser.Math.Between(0, 9);
        let room = dungeon[ry][rx];
        if (room.active && room.type === 'normal' && (rx !== 5 || ry !== 5)) {
             room.type = 'treasure';
             treasurePlaced = true;
        }
        attempts++;
    }
}

function loadRoom(scene) {
    // Nettoyer la salle précédente
    walls.clear(true, true);
    doors.clear(true, true);
    enemies.clear(true, true);
    bullets.clear(true, true); // Supprimer les balles en vol
    enemyBullets.clear(true, true); // Supprimer les balles ennemies
    bossHealthBar.clear();
    pickups.clear(true, true); // Nettoyer les objets non ramassés
    shopItems.clear(true, true);
    shopTexts.clear(true, true);
    stairs.clear(true, true);
    treasureChest.clear(true, true);

    // Restaurer les objets persistants de la salle
    if (dungeon[roomY][roomX].pickups) {
        dungeon[roomY][roomX].pickups.forEach(data => createPickup(scene, data));
    }

    // Restaurer le shop si c'est une salle magasin
    if (dungeon[roomY][roomX].type === 'shop') {
        spawnShop(scene);
        dungeon[roomY][roomX].cleared = true; // Le shop est toujours sûr
    }

    // Restaurer le coffre si c'est une salle trésor
    if (dungeon[roomY][roomX].type === 'treasure') {
        dungeon[roomY][roomX].cleared = true; // Salle sûre
        if (!dungeon[roomY][roomX].treasureOpen) {
            treasureChest.create(400, 300, 'chest');
        }
    }
    
    // Déterminer si la salle doit être verrouillée (si elle n'est pas nettoyée)
    isRoomLocked = !dungeon[roomY][roomX].cleared;

    // Faire réapparaître l'escalier si la salle du boss est nettoyée
    if (dungeon[roomY][roomX].type === 'boss' && dungeon[roomY][roomX].cleared) {
        stairs.create(400, 300, 'stairs');
        if (!dungeon[roomY][roomX].treasureOpen) {
            treasureChest.create(400, 200, 'chest');
        }
    }

    // Marquer la salle comme visitée et mettre à jour la minimap
    dungeon[roomY][roomX].visited = true;
    drawMinimap();

    // Vérifier les voisins (pour placer les portes)
    let hasNorth = roomY > 0 && dungeon[roomY - 1][roomX].active;
    let hasSouth = roomY < 9 && dungeon[roomY + 1][roomX].active;
    let hasWest = roomX > 0 && dungeon[roomY][roomX - 1].active;
    let hasEast = roomX < 9 && dungeon[roomY][roomX + 1].active;

    // --- Construction des Murs et Portes ---
    // Haut et Bas
    for (let x = 0; x < 800; x += 40) {
        let isCenter = (x >= 360 && x <= 400); // Zone centrale pour la porte
        
        // Mur du Haut
        if (hasNorth && isCenter) {
            let texture = isRoomLocked ? 'door_locked' : getDoorTexture('north');
            let d = doors.create(x + 20, 20, texture);
            d.name = 'north';
        } else {
            walls.create(x + 20, 20, 'wall');
        }

        // Mur du Bas
        if (hasSouth && isCenter) {
            let texture = isRoomLocked ? 'door_locked' : getDoorTexture('south');
            let d = doors.create(x + 20, 580, texture);
            d.name = 'south';
        } else {
            walls.create(x + 20, 580, 'wall');
        }
    }

    // Gauche et Droite
    for (let y = 40; y < 560; y += 40) { // On évite les coins déjà faits
        let isCenter = (y >= 260 && y <= 300);

        // Mur de Gauche
        if (hasWest && isCenter) {
            let texture = isRoomLocked ? 'door_locked' : getDoorTexture('west');
            let d = doors.create(20, y + 20, texture);
            d.name = 'west';
        } else {
            walls.create(20, y + 20, 'wall');
        }

        // Mur de Droite
        if (hasEast && isCenter) {
            let texture = isRoomLocked ? 'door_locked' : getDoorTexture('east');
            let d = doors.create(780, y + 20, texture);
            d.name = 'east';
        } else {
            walls.create(780, y + 20, 'wall');
        }
    }

    // --- Spawner des ennemis ---
    // Seulement si la salle n'a pas encore été nettoyée
    if (!dungeon[roomY][roomX].cleared) {
        let roomType = dungeon[roomY][roomX].type;

        if (roomType === 'boss') {
            // --- SPAWN BOSS ---
            let boss = enemies.create(400, 300, 'boss');
            boss.setCollideWorldBounds(true);
            boss.setBounce(0.2);
            boss.setData('type', 'boss');
            boss.setData('hp', 20 + (level * 5)); // PV augmentent avec le niveau
            boss.setData('maxHp', 20 + (level * 5));
            boss.setData('nextFire', 0);
            boss.setData('activeAt', scene.time.now + 1000); // Le boss attend 1s
            updateBossHealthBar(scene, 20, 20);
        } else {
            // --- SPAWN ENNEMIS NORMAUX ---
            let enemyCount = Phaser.Math.Between(1, 4);
            for (let i = 0; i < enemyCount; i++) {
                let ex = Phaser.Math.Between(100, 700);
                let ey = Phaser.Math.Between(100, 500);
                
                // 50% de chance d'être un tireur
                let type = Phaser.Math.Between(0, 100) > 50 ? 'shooter' : 'chaser';
                let texture = type === 'shooter' ? 'enemy_shooter' : 'enemy';

                let enemy = enemies.create(ex, ey, texture);
                enemy.setCollideWorldBounds(true);
                enemy.setBounce(1);
                enemy.setData('type', type); // On stocke le type dans l'objet
                enemy.setData('hp', 3 + Math.floor(level / 2)); // PV augmentent tous les 2 niveaux
                enemy.setData('nextFire', 0); // Pour le tireur
                enemy.setData('activeAt', scene.time.now + 800); // Les ennemis attendent 0.8s
            }
        }
    }
}

function drawMinimap() {
    minimapGraphics.clear();
    
    const size = 12;   // Taille d'une case minimap
    const padding = 2; // Espace entre les cases
    const startX = 20; // Position X sur l'écran
    const startY = 20; // Position Y sur l'écran

    // Fond semi-transparent pour la minimap
    minimapGraphics.fillStyle(0x000000, 0.5);
    minimapGraphics.fillRect(startX - 5, startY - 5, (size + padding) * 10 + 10, (size + padding) * 10 + 10);

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            let room = dungeon[y][x];
            if (!room.active) continue;

            // Visibilité : Soit visitée, soit adjacente à une salle visitée
            let isVisible = room.visited;
            if (!isVisible) {
                if (y > 0 && dungeon[y - 1][x].visited) isVisible = true;
                else if (y < 9 && dungeon[y + 1][x].visited) isVisible = true;
                else if (x > 0 && dungeon[y][x - 1].visited) isVisible = true;
                else if (x < 9 && dungeon[y][x + 1].visited) isVisible = true;
            }

            if (isVisible) {
                if (x === roomX && y === roomY) {
                    minimapGraphics.fillStyle(0x00ff00, 1); // Vert pour joueur
                } else {
                    // Couleur de base selon le type
                    let color = 0xaaaaaa; // Normal (Gris)
                    if (room.type === 'boss') color = 0xff0000; // Boss (Rouge)
                    else if (room.type === 'shop') color = 0xffff00; // Shop (Jaune)
                    else if (room.type === 'treasure') color = 0xffaa00; // Trésor (Orange)

                    // Assombrir si non visité
                    if (!room.visited) {
                        if (room.type === 'boss') color = 0x660000;
                        else if (room.type === 'shop') color = 0x666600;
                        else color = 0x555555;
                    }

                    minimapGraphics.fillStyle(color, 0.8);
                }
                minimapGraphics.fillRect(startX + x * (size + padding), startY + y * (size + padding), size, size);
            }
        }
    }
}

function update(time, delta) {
    if (isGameOver) return;

    // --- Mouvement du Joueur ---
    player.setVelocity(0);

    if (keys.left.isDown) {
        player.setVelocityX(-playerSpeed);
    } else if (keys.right.isDown) {
        player.setVelocityX(playerSpeed);
    }

    if (keys.up.isDown) {
        player.setVelocityY(-playerSpeed);
    } else if (keys.down.isDown) {
        player.setVelocityY(playerSpeed);
    }

    // Normaliser la vitesse en diagonale (pour ne pas aller plus vite)
    player.body.velocity.normalize().scale(playerSpeed);

    // --- Tir (Twin-stick shooter style) ---
    if (time > lastFired) {
        let fired = false;
        let velocity = { x: 0, y: 0 };

        if (cursors.left.isDown) {
            velocity.x = -BULLET_SPEED;
            fired = true;
        } else if (cursors.right.isDown) {
            velocity.x = BULLET_SPEED;
            fired = true;
        } else if (cursors.up.isDown) {
            velocity.y = -BULLET_SPEED;
            fired = true;
        } else if (cursors.down.isDown) {
            velocity.y = BULLET_SPEED;
            fired = true;
        }

        if (fired) {
            fireBullet(player.x, player.y, velocity);
            lastFired = time + fireRate;
        }
    }

    // --- IA Ennemi ---
    enemies.children.iterate((enemy) => {
        if (enemy) {
            // Si l'ennemi est encore en phase d'apparition, il ne fait rien
            if (time < enemy.getData('activeAt')) return;

            if (enemy.getData('type') === 'boss') {
                // IA Boss : Se déplace lentement vers le joueur et tire en éventail
                this.physics.moveToObject(enemy, player, 40); // Vitesse lente
                
                if (time > enemy.getData('nextFire')) {
                    fireBossPattern(enemy, player, time);
                }
                return; // Fin du traitement pour le boss
            }

            if (enemy.getData('type') === 'shooter') {
                // IA Tireur : Garde ses distances et tire
                let dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
                
                if (dist > 300) {
                    // Trop loin, on s'approche
                    this.physics.moveToObject(enemy, player, ENEMY_SPEED);
                } else if (dist < 200) {
                    // Trop près, on recule (kiting)
                    let angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
                    this.physics.velocityFromRotation(angle, ENEMY_SPEED, enemy.body.velocity);
                } else {
                    enemy.setVelocity(0);
                }

                if (time > enemy.getData('nextFire')) {
                    fireEnemyBullet(enemy, player, time);
                }
            } else {
                // IA Chaser (Classique) : Fonce sur le joueur
                this.physics.moveToObject(enemy, player, ENEMY_SPEED);
            }
        }
    });
}

function nextLevel(scene) {
    level++;
    levelText.setText('Étage: ' + level);
    
    generateDungeon();
    player.setPosition(400, 300);
    loadRoom(scene);
    scene.cameras.main.flash(500, 0, 0, 0); // Transition visuelle
}

function changeRoom(direction, scene) {
    // Mettre à jour les coordonnées de la salle
    if (direction === 'north') roomY--;
    if (direction === 'south') roomY++;
    if (direction === 'west') roomX--;
    if (direction === 'east') roomX++;

    // Charger la nouvelle salle
    loadRoom(scene);

    // Repositionner le joueur à l'opposé de la porte qu'il a prise
    if (direction === 'north') {
        player.y = 530;
    } else if (direction === 'south') {
        player.y = 70;
    } else if (direction === 'west') {
        player.x = 730;
    } else if (direction === 'east') {
        player.x = 70;
    }
    
    // Petit effet de caméra pour la transition
    scene.cameras.main.flash(200);
}

function takeDamage(scene) {
    currentHealth--;
    updateHealthUI(scene);
    scene.cameras.main.shake(200, 0.02);
    
    // Effet visuel de dégâts (clignotement)
    scene.tweens.add({
        targets: player,
        alpha: 0,
        duration: 100,
        yoyo: true,
        repeat: 3
    });

    if (currentHealth <= 0) {
        triggerGameOver(scene);
    }
}

function updateHealthUI(scene) {
    heartsGroup.clear(true, true);
    for (let i = 0; i < maxHealth; i++) {
        let x = 30 + i * 25;
        let y = 180; // Positionné sous la minimap
        let texture = i < currentHealth ? 'heart' : 'heart_empty';
        let heart = scene.add.image(x, y, texture);
        heart.setScrollFactor(0); // L'UI ne bouge pas avec la caméra
        heart.setDepth(50);
        heartsGroup.add(heart);
    }
}

function updateBossHealthBar(scene, current, max) {
    bossHealthBar.clear();
    if (current <= 0) return;

    const width = 400;
    const height = 20;
    const x = 200; // Centré (800 - 400) / 2
    const y = 550; // Bas de l'écran

    // Fond
    bossHealthBar.fillStyle(0x000000, 0.8);
    bossHealthBar.fillRect(x, y, width, height);

    // Barre de vie
    const percent = current / max;
    bossHealthBar.fillStyle(0xff0000, 1);
    bossHealthBar.fillRect(x + 2, y + 2, (width - 4) * percent, height - 4);
    
    // Bordure
    bossHealthBar.lineStyle(2, 0xffffff, 1);
    bossHealthBar.strokeRect(x, y, width, height);
}

function triggerGameOver(scene) {
    isGameOver = true;
    scene.physics.pause();
    player.setTint(0xff0000); // Joueur devient rouge
    gameOverText.setVisible(true);
}

function restartGame(scene) {
    isGameOver = false;
    gameOverText.setVisible(false);
    player.clearTint();
    player.alpha = 1;
    scene.physics.resume();
    maxHealth = DEFAULT_MAX_HEALTH;
    playerSpeed = DEFAULT_SPEED;
    playerDamage = 1;
    fireRate = 250;
    projectileCount = 1;
    currentHealth = maxHealth;
    level = 1;
    levelText.setText('Étage: 1');
    coins = 0;
    coinText.setText('Pièces: 0');
    updateHealthUI(scene);
    generateDungeon(); // Nouveau donjon
    updateStatsUI();
    player.setPosition(400, 300); // Retour au centre
    loadRoom(scene);
}

function fireBullet(x, y, velocity) {
    // Calcul de l'angle de base
    let baseAngle = Math.atan2(velocity.y, velocity.x);
    let speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    // Tirer plusieurs projectiles si nécessaire
    for (let i = 0; i < projectileCount; i++) {
        let bullet = bullets.get();
        if (bullet) {
            // Répartition des angles : centré autour de l'angle de base
            // Si 1 proj: offset 0. Si 3 proj: -0.2, 0, +0.2 radians
            let offset = (i - (projectileCount - 1) / 2) * 0.15; 
            let angle = baseAngle + offset;
            
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;

            bullet.setTexture('bullet');
            bullet.fire(x, y, { x: vx, y: vy });
        }
    }
}

function fireEnemyBullet(enemy, target, time) {
    let bullet = enemyBullets.get();
    if (bullet) {
        bullet.setTexture('enemy_bullet');
        bullet.setPosition(enemy.x, enemy.y);
        bullet.setActive(true);
        bullet.setVisible(true);
        
        let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300); // Vitesse 300
        
        enemy.setData('nextFire', time + 2000); // Tire toutes les 2 secondes
    }
}

function fireBossPattern(boss, target, time) {
    // Tir en éventail (3 projectiles)
    let baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, target.x, target.y);
    
    for (let i = -1; i <= 1; i++) {
        let bullet = enemyBullets.get();
        if (bullet) {
            bullet.setTexture('boss_bullet');
            bullet.setPosition(boss.x, boss.y);
            bullet.setActive(true);
            bullet.setVisible(true);
            
            let angle = baseAngle + (i * 0.3); // Décalage angulaire
            bullet.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
        }
    }
    boss.setData('nextFire', time + 1500); // Tire toutes les 1.5 secondes
}

function spawnRoomReward(scene, x, y) {
    if (Phaser.Math.Between(0, 100) > 50) { // 50% de chance d'avoir un objet
        let type = Phaser.Math.Between(0, 100) > 60 ? 'pickup_heart' : 'coin'; // 40% cœur, 60% pièce
        
        let data = { x: x, y: y, type: type, id: Date.now() };
        dungeon[roomY][roomX].pickups.push(data);
        createPickup(scene, data);
    }
}

function createPickup(scene, data) {
    let pickup = pickups.create(data.x, data.y, data.type);
    pickup.setData('type', data.type);
    pickup.setData('id', data.id);
    
    // Petite animation de rebond
    scene.tweens.add({
        targets: pickup,
        y: data.y - 5,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
}

function collectPickup(scene, pickup) {
    let type = pickup.getData('type');
    let id = pickup.getData('id');
    let collected = false;
    
    if (type === 'coin') {
        coins++;
        coinText.setText('Pièces: ' + coins);
        collected = true;
    } else if (type === 'pickup_heart') {
        if (currentHealth < maxHealth) {
            currentHealth++;
            updateHealthUI(scene);
            collected = true;
        }
    }

    if (collected) {
        // Retirer de la sauvegarde de la salle
        let roomPickups = dungeon[roomY][roomX].pickups;
        let index = roomPickups.findIndex(p => p.id === id);
        if (index !== -1) {
            roomPickups.splice(index, 1);
        }
        pickup.destroy();
    }
}

function spawnShop(scene) {
    // Si les données du shop n'existent pas encore pour cette salle, on les crée
    if (!dungeon[roomY][roomX].shopData) {
        dungeon[roomY][roomX].shopData = [
            { type: 'pickup_heart', price: 5, x: 300, y: 300, id: 1 },
            { type: 'item_maxhp', price: 15, x: 400, y: 300, id: 2 },
            { type: 'item_speed', price: 10, x: 500, y: 300, id: 3 }
        ];
    }

    let items = dungeon[roomY][roomX].shopData;
    
    items.forEach(itemData => {
        // Créer l'objet physique
        let item = shopItems.create(itemData.x, itemData.y, itemData.type);
        item.setData('price', itemData.price);
        item.setData('type', itemData.type);
        item.setData('id', itemData.id);

        // Afficher le prix
        let text = scene.add.text(itemData.x - 10, itemData.y - 30, itemData.price + '', {
            fontSize: '16px',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        });
        shopTexts.add(text);
    });
}

function buyItem(scene, item) {
    let price = item.getData('price');
    let type = item.getData('type');
    let id = item.getData('id');

    if (coins >= price) {
        let bought = false;

        if (type === 'pickup_heart') {
            if (currentHealth < maxHealth) {
                currentHealth++;
                bought = true;
            }
        } else if (type === 'item_maxhp') {
            maxHealth++;
            currentHealth = maxHealth; // Soigne complètement aussi
            bought = true;
        } else if (type === 'item_speed') {
            playerSpeed += 50;
            bought = true;
        }

        if (bought) {
            coins -= price;
            coinText.setText('Pièces: ' + coins);
            updateHealthUI(scene);
            
            // Retirer l'objet des données de la salle pour qu'il ne réapparaisse pas
            let shopData = dungeon[roomY][roomX].shopData;
            let index = shopData.findIndex(i => i.id === id);
            if (index !== -1) {
                shopData.splice(index, 1);
            }

            // Détruire l'objet visuel et recharger la salle pour nettoyer le texte
            loadRoom(scene);
        }
    }
}

function openTreasureChest(scene, chest) {
    // Empêcher d'ouvrir plusieurs fois (même si la collision le gère, sécurité)
    if (dungeon[roomY][roomX].treasureOpen) return;

    dungeon[roomY][roomX].treasureOpen = true;
    chest.destroy();

    // Liste des améliorations possibles
    const upgrades = [
        { name: "Dégâts +1", apply: () => playerDamage++ },
        { name: "Vitesse d'attaque +", apply: () => fireRate = Math.max(50, fireRate - 30) }, // Min 50ms
        { name: "Vitesse +", apply: () => playerSpeed += 20 },
        { name: "Santé Max +1", apply: () => { maxHealth++; currentHealth = maxHealth; updateHealthUI(scene); } },
        { name: "Projectile +1", apply: () => projectileCount++ }
    ];

    // Choix aléatoire
    let upgrade = upgrades[Phaser.Math.Between(0, upgrades.length - 1)];
    upgrade.apply();

    // Mise à jour UI
    updateStatsUI();

    // Texte flottant
    let text = scene.add.text(player.x, player.y - 40, upgrade.name, {
        fontSize: '20px',
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
    });
    
    scene.tweens.add({
        targets: text,
        y: player.y - 80,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy()
    });
}

function updateStatsUI() {
    // Calcul du DPS approximatif pour info (Dmg * (1000/Rate) * Count)
    // let dps = (playerDamage * (1000 / fireRate) * projectileCount).toFixed(1);
    
    statsText.setText([
        'STATS:',
        'Dégâts: ' + playerDamage,
        'Cadence: ' + fireRate + 'ms',
        'Vitesse: ' + playerSpeed,
        'Tirs: ' + projectileCount
    ]);
}

function getDoorTexture(direction) {
    let tx = roomX;
    let ty = roomY;
    if (direction === 'north') ty--;
    else if (direction === 'south') ty++;
    else if (direction === 'west') tx--;
    else if (direction === 'east') tx++;

    if (tx < 0 || tx > 9 || ty < 0 || ty > 9) return 'door';
    let type = dungeon[ty][tx].type;
    if (type === 'shop') return 'door_shop';
    if (type === 'boss') return 'door_boss';
    if (type === 'treasure') return 'door_treasure';
    return 'door';
}

// Extension de la classe Bullet pour gérer son cycle de vie
Phaser.Physics.Arcade.Image.prototype.fire = function (x, y, velocity) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(velocity.x, velocity.y);
}
