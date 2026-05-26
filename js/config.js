'use strict';

const CFG = {
    W: 960,
    H: 540,
    GRAVITY: 0.55,
    PLAYER_W: 36,
    PLAYER_H: 48,
    PLAYER_SPEED: 4.5,
    SPRINT_SPEED: 8.5,
    SPRINT_DURATION: 90,
    SPRINT_COOLDOWN: 240,
    JUMP_FORCE: -13,
    ROLL_SPEED: 7,
    ROLL_DURATION: 28,
    DIG_RANGE: 40,
    ATTACK_RANGE: 55,
    ATTACK_DURATION: 22,
    INVINCIBLE_FRAMES: 80,
    HEALTH_MAX: 100,

    LEVELS: [
        {
            id: 1,
            name: 'Doggy Day Care',
            subtitle: 'The Great Escape',
            timeLabel: '6:00 AM',
            skyTop: '#1a0533',
            skyBottom: '#ff6b35',
            groundColor: '#8B7355',
            accentColor: '#D4A017',
            width: 3200,
            bossName: 'Tyler the Teen',
            bossType: 'teenWorker',
            ambientLight: 0.7
        },
        {
            id: 2,
            name: 'Busy Streets',
            subtitle: 'Crosstown Traffic',
            timeLabel: '7:30 AM',
            skyTop: '#FF6B35',
            skyBottom: '#FFD700',
            groundColor: '#555555',
            accentColor: '#FF4444',
            width: 3600,
            bossName: 'Officer Woofcatcher',
            bossType: 'animalControl',
            ambientLight: 0.85
        },
        {
            id: 3,
            name: 'The Neighborhood',
            subtitle: 'Turf of the Paw',
            timeLabel: '9:00 AM',
            skyTop: '#4A90D9',
            skyBottom: '#C8E8FF',
            groundColor: '#4a7c2f',
            accentColor: '#228B22',
            width: 3400,
            bossName: 'Don Whiskers',
            bossType: 'fatCatBoss',
            ambientLight: 1.0
        },
        {
            id: 4,
            name: 'City Park',
            subtitle: 'Off the Leash',
            timeLabel: '11:30 AM',
            skyTop: '#2B80D9',
            skyBottom: '#A8D8FF',
            groundColor: '#3a6b1f',
            accentColor: '#7CFC00',
            width: 3800,
            bossName: 'Ranger Robinson',
            bossType: 'parkRanger',
            ambientLight: 1.0
        },
        {
            id: 5,
            name: 'Highway & Construction',
            subtitle: 'Under Construction',
            timeLabel: '2:00 PM',
            skyTop: '#4682B4',
            skyBottom: '#B0D4F0',
            groundColor: '#8B8B8B',
            accentColor: '#FF8C00',
            width: 4000,
            bossName: 'Big Bob',
            bossType: 'foreman',
            ambientLight: 0.95
        },
        {
            id: 6,
            name: 'Shopping Strip',
            subtitle: 'Retail Ruckus',
            timeLabel: '5:30 PM',
            skyTop: '#2C3E50',
            skyBottom: '#E8722E',
            groundColor: '#6B6B6B',
            accentColor: '#FFD700',
            width: 3600,
            bossName: 'Mall Cop Mike',
            bossType: 'mallSecurity',
            ambientLight: 0.75
        },
        {
            id: 7,
            name: 'Wonderland Park',
            subtitle: 'The Final Stretch',
            timeLabel: '9:00 PM',
            skyTop: '#0a0020',
            skyBottom: '#1a0050',
            groundColor: '#2a2a3a',
            accentColor: '#FF00FF',
            width: 4200,
            bossName: 'Chad the Attendant',
            bossType: 'coasterAttendant',
            ambientLight: 0.5
        }
    ],

    FOOD_TYPES: [
        { name: 'kibble',  heal: 5,  r: 7,  color: '#C4954A', outline: '#8B6914' },
        { name: 'treat',   heal: 15, r: 10, color: '#D4A017', outline: '#9B7000' },
        { name: 'biscuit', heal: 25, r: 13, color: '#E8C060', outline: '#B09030' },
        { name: 'hotdog',  heal: 35, r: 11, color: '#CC4400', outline: '#882200' },
        { name: 'burger',  heal: 50, r: 16, color: '#8B4513', outline: '#5C2D0A' }
    ],

    UPGRADES: [
        { id: 'sprint',     name: 'Sprint Burst',   desc: 'Dash with a speed burst! (SHIFT)',       color: '#00DDFF', icon: '💨' },
        { id: 'doubleJump', name: 'Double Jump',    desc: 'Jump again in mid-air! (SPACE x2)',      color: '#FFDD00', icon: '🦘' },
        { id: 'powerDrill', name: 'Power Drill',    desc: 'Dig through anything! (DOWN)',            color: '#FF8800', icon: '⚙️' },
        { id: 'bigChompers',name: 'Big Chompers',   desc: 'Bite metal & big enemies! (Z)',          color: '#FF4488', icon: '🦷' }
    ],

    KEYS: {
        LEFT:   ['ArrowLeft',  'a', 'A'],
        RIGHT:  ['ArrowRight', 'd', 'D'],
        JUMP:   ['ArrowUp',    'w', 'W', ' '],
        ROLL:   ['ArrowDown',  's', 'S'],
        ATTACK: ['z', 'Z'],
        SPRINT: ['Shift'],
        CONFIRM:['Enter', ' '],
        ESCAPE: ['Escape']
    }
};
