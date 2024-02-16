window.onload = function() {
    class BootScene extends Phaser.Scene {
        constructor() {
            super('BootScene');
        }

        preload() {
            this.load.image('background', './assets/backgrounds/bluedot.jpg');
            this.load.image('tile', './assets/tiles/tiletexture.png');
            this.load.audio('backgroundMusic', 'music/song4.mp3');
            this.load.audio('swoosh', './assets/sounds/swoosh2.wav');
            this.load.audio('break', './assets/sounds/break.wav');
            this.load.audio('bonus', './assets/sounds/bonus.wav');
            this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
        }

        create() {
            this.scene.start('StartScene');
        }
    }

    class StartScene extends Phaser.Scene {
        constructor() {
            super('StartScene');
        }

        create() {
            const centerX = this.cameras.main.width / 2;
            this.background = this.add.image(centerX, this.cameras.main.height / 2, 'background');
            this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
            this.add.text(centerX, 250, 'Piano Tiles', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);
            this.add.text(centerX, 300, 'Press SPACE to Start', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);

            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('MainScene');
            });
        }
    }

    class MainScene extends Phaser.Scene {
        constructor() {
            super('MainScene');
            this.tiles = [];
            this.score = 0;
            this.tileHeight = 275;
            this.timeLeft = 30; // Starting time for the timer
            this.timePenalty = 5; // Time penalty for hitting the wrong tile
            this.timeReward = 0; // Time gained for hitting the correct tile
            this.timerBar = null; // Placeholder for the timer bar graphics object
            this.initalTime = 30;
        }

        initGameState() {
            this.tiles = [];
            this.score = 0;
            this.timeLeft = 30; // Reset timer each game start
        }

        create() {
            this.initGameState();
            this.backgroundMusic = this.sound.add('backgroundMusic', { volume: 1, loop: true });
            this.swoosh = this.sound.add('swoosh', { volume: 1, loop: false });
            this.break = this.sound.add('break', { volume: 1, loop: false });
            this.bonus = this.sound.add('bonus', { volume: 1, loop: false });
            this.backgroundMusic.play();

            this.background = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
            this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height).setDepth(0);
            const centerX = this.cameras.main.width / 2;
            this.scoreText = this.add.text(centerX, 70, '0', { fontSize: '100px', fill: '#000' }).setOrigin(0.5).setDepth(20);
            // this.timerText = this.add.text(this.cameras.main.width - 150, 70, 'Time: ' + this.timeLeft, { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);
            this.initTimerBar();
            this.timerEvent = this.time.addEvent({
                delay: 1000,
                callback: this.updateTimer,
                callbackScope: this,
                loop: true
            });

            // Touch support
            this.input.on('pointerdown', pointer => {
                let widthSegment = this.cameras.main.width / 4;
                if (pointer.x < widthSegment) {
                    this.checkTile(0); // Leftmost tile
                } else if (pointer.x < widthSegment * 2) {
                    this.checkTile(1);
                } else if (pointer.x < widthSegment * 3) {
                    this.checkTile(2);
                } else if (pointer.x <= widthSegment * 4) {
                    this.checkTile(3); // Rightmost tile
                }
            });


            this.input.keyboard.removeAllListeners();
            this.input.keyboard.on('keydown-A', () => { this.checkTile(0) });
            this.input.keyboard.on('keydown-S', () => { this.checkTile(1) });
            this.input.keyboard.on('keydown-K', () => { this.checkTile(2) });
            this.input.keyboard.on('keydown-L', () => { this.checkTile(3) });

            this.generateInitialTiles();
        }
        initTimerBar() {
            const centerX = this.cameras.main.width / 2;
            const barWidth = 150;
            const barHeight = 20;
            const startX = centerX - barWidth / 2;
            this.timerBar = this.add.graphics({x: startX, y: 120}).setDepth(10);
            this.timerBar.fillStyle(0x0511f2, 1);
            this.timerBar.fillRect(0, 0, barWidth, barHeight);
        }

        updateTimer() {
            this.timeLeft -= 1;
            // Optional: Update or remove the timer text
            // this.timerText.setText('Time: ' + this.timeLeft);

            // Update the timer bar
            this.updateTimerBar();

            if (this.timeLeft <= 0) {
                this.timerEvent.remove();
                if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
                    this.backgroundMusic.stop();
                }
                this.scene.start('GameOverScene');
            }
        }

        updateTimerBar() {
            const totalBarWidth = 150;
            const ratio = this.timeLeft / this.initalTime;
            this.timerBar.clear();
            if (this.timeLeft < 5) {
                this.timerBar.fillStyle(0xff0000, 1);
            } else {
                this.timerBar.fillStyle(0x0511f2, 1);
            }
            this.timerBar.fillRect(0, 0, totalBarWidth * ratio, 20);
        }

        playSwoosh() {
            this.swoosh.play();
            return true;
        }
        playBreak() {
            this.break.play();
            return true;
        }

        generateInitialTiles() {
            for (let i = 0; i < 4; i++) {
                this.generateTile(i);
            }
        }

        generateTile(index) {
            let laneWidth = this.game.config.width / 4;
            let lane = Phaser.Math.Between(0, 3);
            let xPosition = lane * laneWidth + laneWidth / 2;
            let yPosition = this.game.config.height - this.tileHeight / 2 - (index * this.tileHeight);
            let tile = this.add.image(xPosition, yPosition, 'tile');
            tile.lane = lane;
            tile.setDisplaySize(laneWidth, this.tileHeight);
            this.tiles.unshift(tile);
        }

        showGlowEffect(lane, color) {
            if (color == "white") {
                color = 0xFFFFFF;
            } else {
                color = 0xFF0000;
            }
            let xPosition = lane * (this.game.config.width / 4) + (this.game.config.width / 8);
            let glow = this.add.rectangle(xPosition, this.game.config.height / 2, this.game.config.width / 4, this.game.config.height, color, 0.7);
            glow.setDepth(1);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.7, to: 0 },
                duration: 300,
                onComplete: () => glow.destroy()
            });
        }


        checkTile(lane) {
            let bottomTile = this.tiles[this.tiles.length - 1];
            if (bottomTile && bottomTile.lane === lane) {
                this.showGlowEffect(lane, "white");
                this.playSwoosh();
                this.score += 1;
                this.scoreText.setText(this.score.toString());
                const emitter = this.add.particles(bottomTile.x, bottomTile.y + 150, 'flares', {
                    frame: 'white',
                    color: [ 0x96e0da, 0x937ef3 ],
                    colorEase: 'quart.out',
                    lifespan: 500,
                    angle: { min: -100, max: -80 },
                    scale: { start: 1, end: 0, ease: 'sine.in' },
                    speed: { min: 250, max: 350 },
                    advance: 2000,
                    blendMode: 'ADD'
                });
                emitter.explode(16);
                // Check if score is a multiple of 50, then reward additional time
                if (this.score % 50 === 0) {
                    this.timeLeft += 15; // Reward additional 15 seconds for every 50 tiles hit
                    this.updateTimerBar();
                    this.bonus.play();
                }
                this.timeLeft += this.timeReward; // Regular time reward for hitting a correct tile
                bottomTile.destroy();
                this.tiles.pop();
                this.tiles.forEach((tile) => { tile.y += this.tileHeight; });
                this.generateTile(this.tiles.length);
            } else {
                this.showGlowEffect(lane, "red");
                this.playBreak();
                this.timeLeft -= this.timePenalty; // Apply penalty for incorrect hit
                this.updateTimerBar();
                if (this.timeLeft <= 0) {
                    this.timerEvent.remove();
                    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
                        this.backgroundMusic.stop();
                    }
                    this.scene.start('GameOverScene');
                }
            }
        }

    }

    class GameOverScene extends Phaser.Scene {
        constructor() {
            super('GameOverScene');
        }

        create() {
            const centerX = this.cameras.main.width / 2;
            this.background = this.add.image(centerX, this.cameras.main.height / 2, 'background');
            this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height).setDepth(0);
            this.add.text(centerX, 250, 'Game Over', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);
            this.add.text(centerX, 300, 'Press SPACE to Restart', { fontSize: '20px', fill: '#000' }).setOrigin(0.5);

            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('MainScene');
            });
        }
    }

    // var gameWidth = 800; // Fixed width
    // var windowHeight = window.innerHeight; // Dynamic window height
    // var gameHeight = windowHeight; // Set game height to match window height
// Determine if the device is likely a mobile device based on the screen width
    var isMobile = window.innerWidth <= 800;

// Set game width dynamically: fixed width for desktop, screen width for mobile
    var gameWidth = isMobile ? window.innerWidth : 800; // Use 800 as the fixed width for desktop

// Set game height. You can adjust this as needed or keep it responsive
    var gameHeight = window.innerHeight;

    var config = {
        type: Phaser.AUTO,
        width: gameWidth,
        height: gameHeight,
        backgroundColor: '#242424',
        parent: 'gameContainer',
        scene: [BootScene, StartScene, MainScene, GameOverScene],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        }
    };

    var game = new Phaser.Game(config);
};