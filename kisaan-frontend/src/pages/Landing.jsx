import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const easeInOutCubic = [0.645, 0.045, 0.355, 1];
const easeOutExpo = [0.16, 1, 0.3, 1];

const sceneTimings = {
    seedTravelEnd: 2.5,
    settleEnd: 3.2,
    germinationStart: 3.2,
    titleReveal: 6.2,
    subtitleReveal: 6.5,
    buttonReveal: 7
};

// All coordinates are relative to a 300x300 container
const seedMotion = {
    hidden: {
        x: 300,
        y: -400,
        opacity: 1,
        rotate: 0,
        scale: 1,
    },
    visible: {
        x: [300, 100, -10, 0, 0],
        y: [-400, -100, 150, 240, 240],
        opacity: [1, 1, 1, 0.9, 0],
        rotate: [0, 360, 720, 760, 760],
        scale: [1, 1, 0.9, 1.05, 1],
        transition: {
            duration: 3.2,
            times: [0, 0.6, 0.85, 0.92, 1],
            ease: easeInOutCubic
        }
    },
    settled: {
        x: 0,
        y: 240,
        opacity: 0,
        rotate: 760,
        scale: 1
    }
};

const soilReveal = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            delay: sceneTimings.seedTravelEnd,
            duration: 0.8,
            ease: easeOutExpo
        }
    }
};

const stemGrowth = {
    hidden: { opacity: 0, scaleY: 0 },
    visible: {
        opacity: 1,
        scaleY: 1,
        transition: {
            delay: sceneTimings.germinationStart,
            duration: 1.8,
            ease: easeOutExpo
        }
    }
};

const leafReveal = {
    hidden: ({ startRotate = -30 }) => ({
        opacity: 0,
        scale: 0,
        rotate: startRotate
    }),
    visible: ({ delay = 4.1, endRotate = 0 }) => ({
        opacity: 1,
        scale: [0, 1.1, 1],
        rotate: [endRotate - 30, endRotate + 5, endRotate],
        transition: {
            delay,
            duration: 1.2,
            ease: easeOutExpo
        }
    })
};

const plantIdle = {
    idle: {
        rotate: [-1.5, 1.5, -1.5],
        transition: {
            delay: 5.5,
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

const textReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: ({ delay = sceneTimings.titleReveal }) => ({
        opacity: 1,
        y: 0,
        transition: { delay, duration: 1, ease: easeOutExpo }
    })
};

const buttonReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            delay: sceneTimings.buttonReveal,
            duration: 0.6,
            ease: easeOutExpo,
            staggerChildren: 0.1
        }
    }
};

const buttonItemReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: easeOutExpo }
    }
};

const seedCrack = {
    hidden: ({ x = 0, y = 0, rotate = 0 }) => ({
        opacity: 0, x, y, rotate, scale: 0.9
    }),
    visible: ({ x = 0, y = 0, rotate = 0 }) => ({
        opacity: [0, 1, 0.8],
        x, y, rotate,
        scale: [0.9, 1.05, 1],
        transition: {
            delay: sceneTimings.germinationStart,
            duration: 1,
            ease: easeOutExpo
        }
    })
};

export default function Landing() {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const seedInitial = prefersReducedMotion ? 'settled' : 'hidden';
    const contentDelay = prefersReducedMotion ? 0.1 : undefined;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0f0d] text-white font-sans flex flex-col items-center justify-center">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Logo */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-8 left-8 z-50 flex items-center gap-2"
            >
                <div className="p-2 bg-green-500/20 rounded-xl backdrop-blur-md border border-green-500/30">
                    <Leaf size={24} className="text-green-400" />
                </div>
                <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">
                    Kisaan Konnect
                </span>
            </motion.div>

            {/* Animation Container - Fixed Size for Perfect Measurements */}
            <div className="relative w-[300px] h-[300px] -mt-20 z-20">
                
                {/* Seed & Trail */}
                <AnimatePresence>
                    {!prefersReducedMotion && (
                        <motion.div
                            key="seed-trail"
                            aria-hidden="true"
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            variants={seedMotion}
                            className="pointer-events-none absolute left-1/2 top-0 z-20 w-8 h-8 -ml-4"
                        >
                            <div className="absolute top-1/2 left-1/2 w-16 h-8 -translate-y-1/2 -translate-x-[80%] rounded-full bg-green-400/30 blur-xl" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    aria-hidden="true"
                    initial={seedInitial}
                    animate="visible"
                    variants={seedMotion}
                    className="pointer-events-none absolute left-1/2 top-0 z-30 w-6 h-6 -ml-3 -mt-3"
                >
                    <div className="w-full h-full rounded-full border border-green-300/40 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                         style={{ background: 'radial-gradient(circle at 30% 30%, #86efac 0%, #22c55e 50%, #166534 100%)' }}>
                        <div className="absolute inset-[-4px] rounded-full bg-green-400/30 blur-md" />
                    </div>
                </motion.div>

                {/* Soil */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={soilReveal}
                    className="absolute bottom-[40px] left-1/2 w-[140px] h-[24px] -ml-[70px] rounded-[50%] border border-white/5 bg-gradient-to-r from-[#241710] via-[#3d2719] to-[#241710] shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10"
                >
                    <div className="absolute inset-x-[15%] top-[20%] h-[40%] rounded-full bg-black/30 blur-sm" />
                </motion.div>

                {/* Cracked Seed Shells */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    custom={{ x: -12, y: 238, rotate: -25 }}
                    variants={seedCrack}
                    className="absolute left-1/2 top-0 w-3 h-4 origin-bottom rounded-l-full border border-green-400/30 bg-gradient-to-br from-green-500 to-emerald-800 z-20 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    style={{ clipPath: 'inset(0 50% 0 0 round 999px)', marginLeft: '-6px' }}
                />
                <motion.div
                    initial="hidden"
                    animate="visible"
                    custom={{ x: 12, y: 238, rotate: 25 }}
                    variants={seedCrack}
                    className="absolute left-1/2 top-0 w-3 h-4 origin-bottom rounded-r-full border border-green-400/30 bg-gradient-to-br from-green-500 to-emerald-800 z-20 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    style={{ clipPath: 'inset(0 0 0 50% round 999px)' }}
                />

                {/* Stem */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stemGrowth}
                    className="absolute bottom-[50px] left-1/2 w-1.5 h-[120px] origin-bottom -ml-[3px] rounded-full bg-gradient-to-t from-green-800 via-green-500 to-green-300 shadow-[0_0_15px_rgba(34,197,94,0.4)] z-10"
                />

                {/* Leaves */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    custom={{ delay: 4.1, startRotate: -40, endRotate: -10 }}
                    variants={leafReveal}
                    className="absolute left-1/2 bottom-[80px] w-[50px] h-[25px] origin-right z-10"
                    style={{ marginLeft: '-50px' }}
                >
                    <motion.div
                        animate={prefersReducedMotion ? undefined : 'idle'}
                        variants={plantIdle}
                        className="w-full h-full rounded-[100%_0_100%_0/100%_0_100%_0] border border-green-300/40 bg-gradient-to-br from-green-300 to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    />
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    custom={{ delay: 4.4, startRotate: 40, endRotate: 15 }}
                    variants={leafReveal}
                    className="absolute left-1/2 bottom-[110px] w-[45px] h-[22px] origin-left z-10"
                >
                    <motion.div
                        animate={prefersReducedMotion ? undefined : 'idle'}
                        variants={plantIdle}
                        className="w-full h-full rounded-[0_100%_0_100%/0_100%_0_100%] border border-green-300/40 bg-gradient-to-bl from-green-300 to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    />
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    custom={{ delay: 4.8, startRotate: -20, endRotate: 5 }}
                    variants={leafReveal}
                    className="absolute left-1/2 bottom-[150px] w-[35px] h-[18px] origin-bottom-right z-10"
                    style={{ marginLeft: '-32px' }}
                >
                    <motion.div
                        animate={prefersReducedMotion ? undefined : 'idle'}
                        variants={plantIdle}
                        className="w-full h-full rounded-[100%_0_100%_0/100%_0_100%_0] border border-green-300/40 bg-gradient-to-br from-green-300 to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    />
                </motion.div>
                
                {/* Glow behind plant */}
                <div className="absolute left-1/2 bottom-[100px] w-32 h-32 -ml-16 rounded-full bg-green-500/20 blur-[40px] pointer-events-none z-0" />
            </div>

            {/* Text & Actions Content */}
            <div className="relative z-40 flex w-full max-w-3xl flex-col items-center px-6 text-center mt-8">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    custom={{ delay: contentDelay ?? sceneTimings.titleReveal }}
                    variants={textReveal}
                    className="text-5xl font-black tracking-tight text-white md:text-7xl drop-shadow-lg"
                >
                    Grow with
                    <span className="block mt-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent pb-2">
                        Kisaan Konnect
                    </span>
                </motion.h1>

                <motion.p
                    initial="hidden"
                    animate="visible"
                    custom={{ delay: contentDelay ?? sceneTimings.subtitleReveal }}
                    variants={textReveal}
                    className="mt-6 max-w-2xl text-lg text-gray-300 md:text-xl font-light leading-relaxed"
                >
                    Personalized crop guidance, local market intelligence, and AI-powered farming support in one <span className="font-semibold text-green-400">calm, connected experience</span>.
                </motion.p>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={buttonReveal}
                    className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row"
                >
                    <motion.button
                        variants={buttonItemReveal}
                        type="button"
                        onClick={() => navigate('/login')}
                        className="group relative flex-1 overflow-hidden rounded-2xl bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/60"
                    >
                        <span className="relative z-10">Log In</span>
                    </motion.button>
                    
                    <motion.button
                        variants={buttonItemReveal}
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] focus:outline-none focus:ring-2 focus:ring-green-500/60"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        <span className="relative z-10">Get Started</span>
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

