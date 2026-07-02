import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

/*
 * LandingIntro — full-viewport cinematic intro
 * ─────────────────────────────────────────────
 * Pure #000 background.
 * A green seed rolls in from the right edge, glows, then burrows into soil.
 * A sprout grows from the soil with three organic leaves.
 * Title + CTA buttons fade in last.
 * No particles, no dots, no extra decorations.
 */
export default function LandingIntro() {
    const prefersReducedMotion = useReducedMotion();
    const v = prefersReducedMotion ? 'reduced' : 'animate';

    // ── Brand tokens ────────────────────────────────────────────────────────
    const GREEN      = '#22c55e';
    const GREEN_DARK = '#16a34a';
    const SOIL_DARK  = '#5C3A21';
    const SOIL_MID   = '#6B4423';
    const SOIL_LIGHT = '#7B4A2B';
    const BG         = '#000000';   // used as "negative-space" vein colour

    // ── Easing ──────────────────────────────────────────────────────────────
    const EXPO_OUT = [0.16, 1, 0.3, 1];

    // ── Animation variants ──────────────────────────────────────────────────

    /* Seed rolls in from right (0 → 1.5 s) */
    const seedRoll = {
        initial: { x: '48vw', rotate: 0 },
        animate: {
            x: 0,
            rotate: -540,              // 1.5 full rotations — visible with gradient
            transition: { duration: 1.5, ease: EXPO_OUT }
        },
        reduced: { x: 0, rotate: 0 }
    };

    /* Seed glows then scales to zero (1.5 → 2.4 s) */
    const seedGlow = {
        initial: { scale: 1, opacity: 1 },
        animate: {
            scale:   [1, 1.25, 1,  0],
            opacity: [1, 1,    1,  0],
            transition: {
                delay: 1.5, duration: 0.9,
                times: [0, 0.35, 0.65, 1],
                ease: 'easeInOut'
            }
        },
        reduced: { scale: 0, opacity: 0 }
    };

    /* Soil mound scales up (2.3 → 3.0 s) */
    const soilVar = {
        initial: { scaleY: 0, opacity: 0 },
        animate: {
            scaleY: 1, opacity: 1,
            transition: { delay: 2.3, duration: 0.6, ease: EXPO_OUT }
        },
        reduced: { scaleY: 1, opacity: 1 }
    };

    /* Stem drawn upward via strokeDashoffset (2.8 → 4.4 s) */
    const stemVar = {
        initial: { pathLength: 0, opacity: 0 },
        animate: {
            pathLength: 1,
            opacity: 1,
            transition: { delay: 2.8, duration: 1.6, ease: [0.4, 0, 0.2, 1] }
        },
        reduced: { pathLength: 1, opacity: 1 }
    };

    /* Leaves stagger from 4.4 s */
    const leavesCtnr = {
        initial: {},
        animate: { transition: { staggerChildren: 0.22, delayChildren: 4.4 } },
        reduced: { transition: { staggerChildren: 0,    delayChildren: 0   } }
    };
    const leafVar = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { duration: 0.65, ease: EXPO_OUT } },
        reduced: { scale: 1, opacity: 1 }
    };

    /* Title + subtitle (5.6 s) */
    const titleVar = {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0, transition: { delay: 5.6, duration: 0.8, ease: EXPO_OUT } },
        reduced: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.5 } }
    };
    const subVar = {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0, transition: { delay: 5.9, duration: 0.8, ease: EXPO_OUT } },
        reduced: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }
    };
    const linksVar = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { delay: 6.2, duration: 0.7, ease: 'easeOut' } },
        reduced: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }
    };

    // ── SVG geometry — viewBox 0 0 220 260 ──────────────────────────────────
    // All planted around centre-x = 110

    // Single stem: from soil top (110, 190) curves gently
    const stemPath = 'M 110 190 C 112 155, 118 115, 104 80 C 97 55, 106 30, 112 15';

    // Top-left LARGE leaf (attached ~104,80)
    const leafTL      = 'M 104 80 C 68 62, 48 28, 60 8 C 72 -12, 100 12, 104 80 Z';
    const veinTL      = 'M 104 80 Q 76 48 62 14';

    // Middle-right MEDIUM leaf (attached ~112,120)
    const leafMR      = 'M 112 122 C 145 108, 162 82, 152 62 C 142 42, 116 66, 112 122 Z';
    const veinMR      = 'M 112 122 Q 140 95 150 67';

    // Bottom-left SMALL leaf (attached ~106,155)
    const leafBL      = 'M 106 156 C 78 146, 62 126, 70 112 C 78 98, 102 124, 106 156 Z';
    const veinBL      = 'M 106 156 Q 80 134 72 115';

    // Soil mound — three layered paths for depth
    const soilBack    = 'M 55 208 C 58 190, 72 186, 82 195 C 92 172, 128 172, 138 195 C 148 186, 162 190, 165 208 Z';
    const soilMid     = 'M 65 210 C 70 196, 84 193, 92 200 C 100 182, 120 182, 128 200 C 136 193, 150 196, 155 210 Z';
    const soilFront   = 'M 75 212 C 80 202, 95 200, 105 206 C 115 200, 130 202, 135 212 Z';

    return (
        /*
         * This wrapper is intentionally 100vw × 100vh with overflow hidden and
         * a solid #000 background so NOTHING bleeds through.
         */
        <div
            style={{ background: '#000', width: '100vw', height: '100vh', overflow: 'hidden' }}
            className="flex flex-col items-center justify-center"
        >
            {/* ── Plant stage ──────────────────────────────────────────────── */}
            {/*  Shifted down a bit via translateY so it reads as "grounded"   */}
            <div className="flex flex-col items-center" style={{ transform: 'translateY(30px)' }}>

                <svg
                    viewBox="0 0 220 260"
                    width="240"
                    height="290"
                    style={{ overflow: 'visible' }}
                >
                    {/*
                     * SOIL — three layered fills using the specified brown palette.
                     * transformOrigin at the base so scaleY grows upward from bottom.
                     */}
                    <motion.g
                        initial="initial" animate={v} variants={soilVar}
                        style={{ transformOrigin: '110px 210px' }}
                    >
                        <path d={soilBack}  fill={SOIL_DARK}  />
                        <path d={soilMid}   fill={SOIL_MID}   />
                        <path d={soilFront} fill={SOIL_LIGHT} />
                    </motion.g>

                    {/* STEM — pathLength animation draws it upward */}
                    <motion.path
                        d={stemPath}
                        fill="none"
                        stroke={GREEN}
                        strokeWidth="9"
                        strokeLinecap="round"
                        initial="initial" animate={v} variants={stemVar}
                    />

                    {/* LEAVES */}
                    <motion.g initial="initial" animate={v} variants={leavesCtnr}>
                        {/* Top-left large */}
                        <motion.g variants={leafVar} style={{ transformOrigin: '78px 44px' }}>
                            <path d={leafTL} fill={GREEN} />
                            <path d={veinTL} fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round" />
                        </motion.g>

                        {/* Mid-right medium */}
                        <motion.g variants={leafVar} style={{ transformOrigin: '137px 92px' }}>
                            <path d={leafMR} fill={GREEN} />
                            <path d={veinMR} fill="none" stroke={BG} strokeWidth="2" strokeLinecap="round" />
                        </motion.g>

                        {/* Bottom-left small */}
                        <motion.g variants={leafVar} style={{ transformOrigin: '84px 134px' }}>
                            <path d={leafBL} fill={GREEN} />
                            <path d={veinBL} fill="none" stroke={BG} strokeWidth="2" strokeLinecap="round" />
                        </motion.g>
                    </motion.g>

                    {/*
                     * ROLLING SEED
                     * Lives in its own motion.g that slides left (seedRoll).
                     * Inside it a child handles the glow + scale-out (seedGlow).
                     * The gradient gives the sphere a 3-D shading that makes
                     * the rotation visually convincing even with a solid colour.
                     */}
                    <defs>
                        <radialGradient id="seedGrad" cx="35%" cy="30%" r="65%">
                            <stop offset="0%"   stopColor="#86efac" />   {/* bright highlight */}
                            <stop offset="50%"  stopColor={GREEN}   />
                            <stop offset="100%" stopColor={GREEN_DARK} />
                        </radialGradient>
                    </defs>

                    <motion.g
                        initial="initial" animate={v} variants={seedRoll}
                        style={{ translateY: 0 }}
                    >
                        <motion.g
                            initial="initial" animate={v} variants={seedGlow}
                            style={{ transformOrigin: '110px 190px' }}
                        >
                            {/* Sphere shaded with radial gradient — rotation visible via gradient shift */}
                            <circle cx="110" cy="190" r="16" fill="url(#seedGrad)" />
                            {/* Specular highlight dot */}

                        </motion.g>
                    </motion.g>
                </svg>

                {/* ── Text ──────────────────────────────────────────────────── */}
                <div className="flex flex-col items-center text-center px-6 mt-4">
                    <motion.h1
                        initial="initial" animate={v} variants={titleVar}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white"
                    >
                        Grow with
                        <span className="block text-green-500 mt-1 pb-1">Kisaan Konnect</span>
                    </motion.h1>

                    <motion.p
                        initial="initial" animate={v} variants={subVar}
                        className="mt-5 max-w-md text-base md:text-lg text-gray-400 font-light leading-relaxed"
                    >
                        Personalized crop guidance, market intelligence, and AI-powered farming support —
                        all in one{' '}
                        <span className="text-green-400 font-medium">calm, connected experience</span>.
                    </motion.p>

                    <motion.div
                        initial="initial" animate={v} variants={linksVar}
                        className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm"
                    >
                        <Link
                            to="/login"
                            className="flex-1 text-center px-8 py-3.5 rounded-2xl
                                       border border-white/15 bg-white/5 text-white font-semibold
                                       hover:bg-white/10 hover:scale-[1.02] transition-all
                                       focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signup"
                            className="flex-1 text-center px-8 py-3.5 rounded-2xl
                                       bg-green-600 text-white font-semibold
                                       hover:bg-green-500 hover:scale-[1.02] transition-all
                                       focus:outline-none focus:ring-2 focus:ring-green-500
                                       shadow-lg shadow-green-900/30"
                        >
                            Create Account
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
